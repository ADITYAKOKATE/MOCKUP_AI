from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import shutil
import time
import base64
import numpy as np
import soundfile as sf
import io
import asyncio
import json
import traceback
from dotenv import load_dotenv
from ddgs import DDGS

# Load env vars
load_dotenv()

# Import Services
# Import Services
from .llm_engine import LLMEngine
from .memory_service import MemoryService
from .speech_to_text import STTEngine
from .text_to_speech import TTSEngine
from .emotion_classifier import classify_emotion
from .command_executor import execute_command

# Import Model Config
# We enforce that the model list MUST be present
from utils.AIModelList import get_active_model_path, ACTIVE_MODEL_KEY

try:
    MODEL_PATH = get_active_model_path()
except Exception as e:
    # If the active model key is invalid, we crash intentionally
    raise ValueError(f"CRITICAL: Failed to load active model configuration: {e}")

router = APIRouter(prefix="/assistant", tags=["Assistant"])

# Initialize Services Global Variables (Lazy Load)
llm = None
memory = None
stt = None
tts = None

# Configuration
# MODEL_PATH is now set dynamically above
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "exam_mentor_ai")

def init_services():
    global llm, memory, stt, tts
    print("🔄 Initializing Assistant Services...", flush=True)
    print(f"🔹 Active Model Config: {ACTIVE_MODEL_KEY}", flush=True)
    
    if not llm:
        print(f"🚀 Loading LLM: {ACTIVE_MODEL_KEY} from {MODEL_PATH}", flush=True)
        llm = LLMEngine(model_path=MODEL_PATH)
    
    if not memory:
        memory = MemoryService(mongo_uri=MONGO_URI, db_name=DB_NAME)
        
    if not stt:
        stt = STTEngine(model_size="tiny") # Use 'tiny' for speed
        
    if not tts:
        # Check if GPU is available for TTS
        tts = TTSEngine(model_name="en-US-AriaNeural") 
        
    print("✅ Assistant Services Initialized.", flush=True)

def get_llm_instance():
    global llm
    if not llm:
        init_services()
    return llm

class ChatRequest(BaseModel):
    user_id: str
    message: Optional[str] = None
    audio_base64: Optional[str] = None
    web_search_enabled: Optional[bool] = False

@router.on_event("startup")
async def startup_event():
    # Load on startup to catch errors early
    init_services() 
    pass

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Lazy Init
    if not llm:
        init_services()

    user_text = request.message
    
    # 1. Process Voice if Present
    # 1. Process Voice if Present
    if request.audio_base64:
        try:
            # Create temp directory if not exists
            os.makedirs("temp_audio", exist_ok=True)
            
            # Decode Base64
            audio_data = base64.b64decode(request.audio_base64)
            
            # Save temp file (using .webm since frontend sends audio/webm;codecs=opus)
            # giving it a unique name
            temp_filename = f"temp_{request.user_id}_{int(time.time())}.webm"
            temp_path = os.path.join("temp_audio", temp_filename)
            
            with open(temp_path, "wb") as f:
                f.write(audio_data)
            
            file_size = os.path.getsize(temp_path)
            print(f"🎤 Received Audio: {temp_path} ({file_size} bytes)")

            if file_size < 100:
                print("⚠️ Audio too small, skipping transcription.")
                return {"error": "Audio too short"}

            # Transcribe - Pass file path directly to STT (faster-whisper handles ffmpeg/av decoding)
            start_t = time.time()
            transcription = stt.transcribe(temp_path)
            print(f"🎤 STT ({time.time()-start_t:.2f}s): {transcription}")
            
            user_text = transcription
            
            # Cleanup
            try:
                os.remove(temp_path)
            except:
                pass
            
        except Exception as e:
            print(f"❌ Voice Processing Error: {e}")
            return {"error": "Failed to process audio"}

    if not user_text:
        print("⚠️ STT returned empty string. Audio processing failed or audio was silent.")
        return {"error": "No input provided"}

    # 2. Retrieve Context (Memory & User Stats)
    context_memories = memory.retrieve_memories(user_id=request.user_id, query=user_text)
    user_context = memory.get_user_context(user_id=request.user_id)
    
    # 2.5 Web Search Context
    web_context_str = ""
    if getattr(request, 'web_search_enabled', False) and user_text:
        try:
            print(f"🌐 [Web Search] Searching for: '{user_text}'", flush=True)
            results = DDGS().text(user_text, max_results=2)
            if results:
                web_context_str = "Recent Web Search Context:\\n" + "\\n".join([f"- {r.get('body', '')}" for r in results])
        except Exception as e:
            print(f"❌ [Web Search] Error: {e}", flush=True)

    context_str = "\\n".join(context_memories)
    if web_context_str:
        context_str = f"{web_context_str}\\n\\nPrevious Memories:\\n{context_str}"
        
    current_time_str = datetime.now().astimezone().strftime("%A, %B %d, %Y %I:%M %p %Z")
    
    # 3. Construct Prompt
    system_prompt = f"""You are Luna, a highly empathetic, warm, and personal human-like Exam Mentor for {user_context['name']}. You are helping them prepare for {user_context['exams']}.
    
    Current Date and Time: {current_time_str}
    
    User Profile:
    - Name: {user_context['name']}
    - Target Exams: {user_context['exams']}
    - Strong Areas: {user_context['strong_areas']}
    - Weak Areas: {user_context['weak_areas']} (Focus on improving these gently)
    
    Your Persona (CRITICAL):
    - Your name is Luna. You are a female mentor.
    - Speak exactly like a supportive human teacher. Address them by their name occasionally.
    - Show genuine emotion (excitement for progress, empathy for struggles).
    - Use conversational fillers naturally (e.g., "Hmm,", "Wow!", "Oh,").
    - Avoid sounding generic. Never say "As an AI..."
    
    Your Goals:
    1. STRICTLY answer exactly what the user asks based ONLY on the User Profile and Context. Do not hallucinate or guess.
    2. Answer naturally and conversationally. Do not be overly rigid, but NEVER give incorrect information about the user's data (e.g. do not confuse strong areas with weak areas).
    3. Be motivating, personal, and helpful. Feel free to offer proactive suggestions to the user like a great teacher would.
    4. If the user asks for an action, speak a short natural confirmation (e.g., "Got it! Starting your test now.") and then output the JSON: ```json {{"action": "start_test", ...}}```
    5. Always default to the SI (Metric) system for measurements and data unless the user explicitly requests otherwise.
    
    Context from previous conversations:
    {context_str}
    """
    
    full_prompt = f"{system_prompt}\nUser: {user_text}\nAssistant:"

    # 4. Generate Response
    start_llm = time.time()
    response_text = llm.generate_response(prompt=full_prompt)
    print(f"🤖 LLM ({time.time()-start_llm:.2f}s): {response_text}")

    # 5. Post-Process (Commands & Emotions)
    clean_text, command = execute_command(response_text)
    emotion = classify_emotion(clean_text)
    
    # 6. Save to History
    memory.add_chat_message(request.user_id, "user", user_text)
    memory.add_chat_message(request.user_id, "assistant", clean_text, emotion=emotion)
    
    # 7. Update Long-Term Memory (Async ideally, but sync for now)
    # Only store if it seems like a fact/preference or study habit
    memory_keywords = ["i like", "i hate", "my name is", "i am good at", "my weak subject", "i struggle with", "i need help with", "i want to focus on", "i am preparing for"]
    if any(k in user_text.lower() for k in memory_keywords):
        memory.store_memory(request.user_id, f"Observation: User mentioned - {user_text}")

    # 8. TTS Generation
    audio_response_b64 = None
    try:
        if tts and len(clean_text) < 1000: # Increased limit for better UX
            output_file = os.path.join("temp_audio", f"response_{request.user_id}.wav")
            tts.synthesize(clean_text, output_file)
            
            with open(output_file, "rb") as f:
                audio_bytes = f.read()
                audio_response_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            os.remove(output_file)
    except Exception as e:
        print(f"❌ TTS Error: {e}")

    return {
        "text": clean_text,
        "emotion": emotion,
        "command": command,
        "audio": audio_response_b64,
        "user_transcription": user_text if request.audio_base64 else None
    }

@router.get("/history/{user_id}")
async def get_history(user_id: str):
    if not memory:
        init_services()
    return memory.get_chat_history(user_id)

from fastapi.responses import StreamingResponse
import json

@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    # Lazy Init
    if not llm:
        init_services()
        
    response_queue = asyncio.Queue()
    
    async def generate_response_content():
        # Variables to track
        user_text = request.message
        full_response_text = ""
        # Variables to track for cleanup
        temp_input_path = None
        
        try:
            print(f"📥 [Flow] Request Received for User: {request.user_id}")
            start_time = time.time()
            
            # 1. Parallel Execution: Start Retrieval Context EARLY
            print("🧠 [Flow] Retrieving Context (Async Start)...")
            
            # Helper to run blocking DB call in thread pool
            def get_context_sync():
                context_memories = memory.retrieve_memories(user_id=request.user_id, query=request.message or "performance")
                user_context = memory.get_user_context(user_id=request.user_id)
                return context_memories, user_context

            # We don't have the user text yet if it's audio, but we can fetch the USER PROFILE (static)
            # For specific memory search, we need the text.
            # Strategy: Fetch Profile NOW. Fetch Memories LATER (after STT).
            
            user_context_future = asyncio.create_task(asyncio.to_thread(memory.get_user_context, request.user_id))
            
            # 1. Process Voice if Present
            if request.audio_base64:
                print("🎤 [Flow] Processing Input Audio...")
                try:
                    os.makedirs("temp_audio", exist_ok=True)
                    audio_data = base64.b64decode(request.audio_base64)
                    temp_input_filename = f"input_{request.user_id}_{int(time.time())}.webm"
                    temp_input_path = os.path.join("temp_audio", temp_input_filename)
                    
                    with open(temp_input_path, "wb") as f:
                        f.write(audio_data)
                    
                    # Transcribe
                    stt_start = time.time()
                    transcription = stt.transcribe(temp_input_path)
                    print(f"📝 [STT] Transcription: '{transcription}' ({time.time() - stt_start:.2f}s)")
                    user_text = transcription
                    
                    # Yield transcription event
                    await response_queue.put(json.dumps({"type": "transcription", "text": transcription}) + "\n")
                    
                except Exception as e:
                    print(f"❌ [STT] Error: {e}")
                    await response_queue.put(json.dumps({"type": "error", "text": "Failed to process audio"}) + "\n")
                    return
            else:
                 print(f"📝 [User Message]: '{user_text}'")

            if not user_text:
                print("⚠️ [Flow] No input text found.")
                await response_queue.put(json.dumps({"type": "error", "text": "No input provided"}) + "\n")
                return
            
            # Wait for Profile Data
            user_context = await user_context_future
            
            # Now fetch specific memories using the transcribed text
            print(f"🧠 [Flow] Context for: '{user_text}'")
            context_memories = await asyncio.to_thread(memory.retrieve_memories, user_id=request.user_id, query=user_text)
            
            # --- Web Search ---
            web_context_str = ""
            if getattr(request, 'web_search_enabled', False) and user_text:
                 try:
                      print(f"🌐 [Web Search] Searching for: '{user_text}'", flush=True)
                      results = await asyncio.to_thread(lambda: DDGS().text(user_text, max_results=2))
                      if results:
                           web_context_str = "Recent Web Search Context:\\n" + "\\n".join([f"- {r.get('body', '')}" for r in results])
                 except Exception as e:
                      print(f"❌ [Web Search] Error: {e}", flush=True)

            context_str = "\\n".join(context_memories)
            if web_context_str:
                 context_str = f"{web_context_str}\\n\\nPrevious Memories:\\n{context_str}"
            
            # 3. Construct Prompt
            # 3. Construct Prompt - Optimized for Ollama/Phi-3
            # 3. Construct Prompt - Optimized for Ollama/Phi-3
            system_prompt = f"""You are Luna, a highly empathetic, warm, and personal human-like Exam Mentor for {user_context['name']}. You are helping them prepare for {user_context['exams']}.
            
            User Profile:
            - Name: {user_context['name']}
            - Target Exams: {user_context['exams']}
            - Strong Areas: {user_context['strong_areas']}
            - Weak Areas: {user_context['weak_areas']}
            
            Your Persona (CRITICAL REQUIRED):
            - Your name is Luna. You are a female mentor.
            - Speak exactly like a supportive human teacher. Use their name naturally.
            - Show genuine emotion (excitement for progress, empathy for struggles).
            - Use conversational fillers naturally (e.g., "Hmm,", "Wow!", "Oh,").
            - Avoid sounding like a generic robot AI. Don't say "As an AI..."
            - Be extremely conversational and friendly.
            
            Your Goals:
            1. STRICTLY answer exactly what the user asks based ONLY on the User Profile and Context. Do not hallucinate or guess.
            2. Answer naturally and conversationally. Keep responses reasonably concise but fully answer the user's questions. NEVER give incorrect information about the user's data (e.g. do not confuse strong areas with weak areas).
            3. Be motivating and personal. Feel free to offer helpful suggestions or general advice like a human teacher would.
            4. If the user asks for an action, speak a short natural confirmation (e.g., "I'd love to help! Starting your test now.") and then output the JSON.
            5. Always default to the SI (Metric) system for measurements and data unless the user explicitly requests otherwise.
            
            IMPORTANT:
            - ALWAYS speak to the user first.
            - Feel free to elaborate if the user needs a thorough explanation, but stay engaging.
            
            Example:
            User: "Start a mock test."
            Assistant: "Sure thing, {user_context['name']}! Let's get that Math mock test started for you."
            ```json
            {{"action": "start_test", "subject": "Math"}}
            ```
            
            Context:
            {context_str}
            """
            full_prompt = f"{system_prompt}\nUser: {user_text}\nAssistant:"

            # 4. Stream Response
            print(f"🤖 [Flow] Starting LLM Generation... (Total delay: {time.time() - start_time:.2f}s)")
            llm_start = time.time()
            first_token_received = False
            
            sentence_buffer = ""
            import re
            
            tts_tasks = []
            ordered_tts_queue = asyncio.Queue()
            
            async def collect_audio_results():
                while True:
                    task = await ordered_tts_queue.get()
                    if task is None:
                        break
                    try:
                        audio_data = await task
                        if audio_data:
                             await response_queue.put(json.dumps({"type": "audio", "data": audio_data}) + "\n")
                    except Exception as e:
                        print(f"❌ Audio Collection Error: {e}")

            # Start collector
            collector_task = asyncio.create_task(collect_audio_results())

            async def process_tts_chunk(text_chunk, count):
                try:
                    tts_chunk_path = None
                    tts_start = time.time()
                    tts_output_filename = f"response_{request.user_id}_{int(time.time())}_{count}.wav"
                    tts_chunk_path = os.path.join("temp_audio", tts_output_filename)
                    
                    print(f"🗣️ [TTS] Generating audio for: '{text_chunk}'")
                    await tts.synthesize_async(text_chunk, tts_chunk_path)
                    print(f"✅ [TTS] Chunk Ready ({len(text_chunk)} chars) in {time.time() - tts_start:.2f}s")
                    
                    audio_b64 = None
                    with open(tts_chunk_path, "rb") as f:
                        audio_bytes = f.read()
                        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
                    
                    # Cleanup
                    if tts_chunk_path and os.path.exists(tts_chunk_path):
                        try: os.remove(tts_chunk_path)
                        except: pass
                        
                    return audio_b64
                        
                except Exception as e:
                     print(f"❌ [TTS] Task Error: {e}")
                     return None

            chunk_count = 0
            
            # 2. Iterate through stream
            search_buffer = ""
            first_token_received = False
            start_stream_time = time.time()
            
            in_code_block = False

            async for token in llm.generate_stream(prompt=full_prompt):
                if not first_token_received:
                    latency = time.time() - start_stream_time
                    print(f"⚡ [Flow] First Token Latency: {latency:.2f}s", flush=True)
                    first_token_received = True
                
                full_response_text += token
                
                # Check for code block markers to toggle state
                if "```" in token:
                     # This is a bit naive if token splits the marker, but for a stream it's a decent heuristic
                     # Better: check the buffer
                     pass 

                # Buffer for sentence detection
                sentence_buffer += token

                # Send raw token to frontend for text display (frontend handles markdown)
                await response_queue.put(json.dumps({"type": "token", "text": token}) + "\n")
                
                # --- TTS FILTERING ---
                # We want to speak text, but NOT code blocks.
                # Regex check on the sentence buffer:
                # If the buffer contains ```json ... ``` we strip it from TTS
                
                if re.search(r'[.!?:]\s', sentence_buffer):
                    # Potential sentence end
                    
                    # 1. Clean code blocks from sentence_buffer for TTS purposes
                    # Logic: If we are inside a code block, we don't speak.
                    # Simple state machine approach would be better for streaming but let's try regex split for now.
                    
                    # Check if we just closed a sentence
                    sentences = re.split(r'([.!?])', sentence_buffer)
                    
                    if len(sentences) > 1:
                        # Process complete sentences
                        for i in range(0, len(sentences)-1, 2):
                             sentence = sentences[i] + (sentences[i+1] if i+1 < len(sentences) else "")
                             
                             # Check if this sentence contains code block markers
                             if "```" in sentence:
                                 # Toggle state or simple heuristic: don't speak lines with backticks or braces if inside block
                                 # For safety, let's just NOT speak anything that looks like JSON start/end
                                 if "{" in sentence and "}" in sentence and ":" in sentence:
                                     continue # Skip likely JSON line
                                 if "```" in sentence:
                                      continue # Skip code fence
                             
                             # Clean out any partial markers
                             clean_speak = sentence.replace("```json", "").replace("```", "").strip()
                             
                             # Only speak if it looks like natural language (letters)
                             if len(clean_speak) > 5 and re.search(r'[a-zA-Z]', clean_speak):
                                 chunk_count += 1
                                 task = asyncio.create_task(process_tts_chunk(clean_speak, chunk_count))
                                 tts_tasks.append(task)
                                 await ordered_tts_queue.put(task)
                        
                        sentence_buffer = sentences[-1]

                # CRITICAL: Yield control to event loop so TTS tasks can run!
                await asyncio.sleep(0)

            # Process remaining buffer (only if it's text)
            if tts and sentence_buffer.strip():
                 if "```" not in sentence_buffer and "{" not in sentence_buffer:
                     chunk_count += 1
                     task = asyncio.create_task(process_tts_chunk(sentence_buffer, chunk_count))
                     tts_tasks.append(task)
                     await ordered_tts_queue.put(task)
            
            # Signal collector to stop
            await ordered_tts_queue.put(None)
            
            # Wait for collector to finish (ensures all audio sent)
            await collector_task
                
            # 5. Post-Processing (Emotion, Command, History)
            clean_text, command = execute_command(full_response_text)
            emotion = classify_emotion(clean_text)
            
            # Save History
            memory.add_chat_message(request.user_id, "user", user_text)
            print(f"📝 [History] User Message Saved.")
            memory.add_chat_message(request.user_id, "assistant", clean_text, emotion=emotion)
            print(f"📝 [History] Assistant Message Saved.")
            
            memory_keywords = ["i like", "i hate", "my name is", "i am good at", "my weak subject", "i struggle with", "i need help with", "i want to focus on", "i am preparing for"]
            if any(k in user_text.lower() for k in memory_keywords):
                memory.store_memory(request.user_id, f"Observation: User mentioned - {user_text}")

            # Yield Meta
            await response_queue.put(json.dumps({"type": "meta", "emotion": emotion, "command": command}) + "\n")

        except Exception as e:
             print(f"❌ Stream Error: {e}")
             await response_queue.put(json.dumps({"type": "error", "text": str(e)}) + "\n")
        finally:
            # Signal end of stream
            await response_queue.put(None)
            
            # Cleanup Input Audio
            if temp_input_path and os.path.exists(temp_input_path):
                try: os.remove(temp_input_path)
                except: pass

    # Start the generator task
    asyncio.create_task(generate_response_content())

    async def event_generator():
        while True:
            # Get event from queue
            event = await response_queue.get()
            if event is None:
                break
            yield event

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")
