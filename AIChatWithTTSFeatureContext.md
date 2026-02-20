# 🤖 Local Voice-Enabled AI Assistant with Animated 2D Robot Avatar

## 📌 Objective

Build a fully local AI assistant integrated into the exam preparation platform that:

- Runs completely offline
- Supports voice interaction (STT + TTS)
- Maintains per-user memory
- Executes platform commands
- Displays a cute, animated 2D robot avatar
- Has low latency suitable for real-time conversation

No external cloud APIs.  
No external avatar applications.  
No game engines.  
Everything runs locally.

---

# 🧠 System Overview

The assistant consists of 5 major subsystems:

1. LLM Inference Engine  
2. Memory & Retrieval System  
3. Speech Pipeline (STT + TTS)  
4. Command Execution Layer  
5. Animated 2D SVG Robot Avatar (Frontend)  

---

# 🧠 1️⃣ LLM (Core Brain)

## Model
Phi-3 Mini 4K Instruct (4-bit quantized GGUF)

## Runtime
llama-cpp-python

## Requirements

- Load model at server startup
- Enable streaming token generation
- Cap max tokens for low latency
- Context length: 2048 or 4096
- Temperature around 0.6

## Responsibilities

- Generate assistant responses
- Output structured JSON actions when needed
- Provide emotionally classifiable responses

---

# 🧠 2️⃣ Memory System

## Storage
MongoDB

## Memory Types

### Short-Term Memory
- Last N chat messages per user
- Stored in `chat_history` collection

### Long-Term Memory
- User goals
- Weak subjects
- Study patterns
- Previous AI recommendations

Stored in `user_memories` collection.

---

## Semantic Retrieval

Use SentenceTransformers.

Model:
all-MiniLM-L6-v2

### Flow

1. Embed incoming user query  
2. Retrieve top-k relevant past memories  
3. Inject into LLM prompt context  

Do not rely on model internal memory.

---

# 🎤 3️⃣ Speech Pipeline

## Speech to Text (STT)

Use faster-whisper.

Model:
whisper-tiny or whisper-base

### Requirements

- Preload model at startup
- Return transcription within 200–500ms
- No cloud calls

---

## Text to Speech (TTS)

Use Coqui TTS.

### Requirements

- Preload model at startup
- Generate WAV buffer
- Return audio file path or audio buffer
- Do not reload model per request

---

# 🧩 4️⃣ Command Execution Layer

LLM may return structured output:

```json
{
  "action": "start_test",
  "type": "subject",
  "subject": "Data Structures"
}
Rules
LLM does not directly modify database

Backend validates action

Backend executes platform logic

Backend returns confirmation message

Supported Actions
start_test

show_analysis

recommend_topic

fetch_weak_areas

🎭 5️⃣ 2D Animated Robot Avatar (Frontend)
Architecture
Frontend:
React

Component:
RobotAvatar.jsx

Use:
Inline SVG (not Canvas)

SVG Structure
Robot consists of:

Rounded square head

Two large expressive eyes

Small digital mouth (rounded rectangle)

Required IDs:

head

eye-left

eye-right

mouth

Eye Animation System
Control:

scaleY

scaleX

fill color

glow intensity

States:

Neutral

Encouragement

Happy

Serious

Excited

Thinking

Blink Logic
Every 3–6 seconds

scaleY to 0.1 for 120ms

Return to normal

Mouth Animation (Audio Driven)
Use Web Audio API:

AnalyserNode

Process
Get amplitude from audio

Map amplitude to mouth height

Smooth using interpolation

Example:

height range: 8px to 28px depending on amplitude

No phoneme detection required.

Emotion Mapping
Backend returns:

{
  "text": "...",
  "emotion": "encouragement",
  "intensity": 0.7,
  "audio_url": "..."
}
Frontend maps emotion to:

Encouragement:

Slight eye widening

Blue glow

Warning:

Eye narrowing

Orange tint

Excited:

Wider eyes

Faster blink

🔄 Complete Request Flow
Voice Input
→ STT (Whisper)
→ Memory Retrieval
→ LLM Generation (Streaming)
→ Emotion Classification
→ TTS Generation
→ Return text + emotion + audio

Frontend:

Plays audio

Animates mouth

Applies emotion to eyes

Everything runs locally.

🖥 UI Structure
Full Chat Page
Standard chat history

Text input

Voice input button

Robot avatar visible

Floating Voice Widget
Bottom-left popup

Click to activate microphone

Same backend endpoint as chat page

📂 Backend Folder Structure
backend/
  services/
    assistant/
      llm_engine.py
      memory_service.py
      speech_to_text.py
      text_to_speech.py
      emotion_classifier.py
      command_executor.py
      assistant_controller.py
All assistant logic must remain isolated from exam AI logic.

⚡ Performance Rules
Preload all models at startup

No model loading during requests

Use streaming LLM responses

Limit response length

Avoid blocking operations

Use async endpoints

Target end-to-end latency:
1.2 to 2 seconds.

🚫 Strict Constraints
No cloud APIs

No external avatar applications

No Unity

No Live2D runtime

No heavy graphics engines

No fake memory

No mocked AI responses

Everything must derive from real user data.

🎯 Final Goal
Create a fully local, memory-aware, voice-enabled AI study assistant with a cute animated SVG robot avatar that:

Feels alive

Responds emotionally

Executes platform actions

Maintains user memory

Runs completely offline

