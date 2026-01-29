import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gpt4all import GPT4All
from typing import Optional, List, Dict, Any

app = FastAPI()

# Configuration
MODEL_NAME = "Phi-3-mini-4k-instruct.Q4_0.gguf"
# Adjust path to match where setup_llm.py downloads it (backend/llmModel)
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "llmModel")

print(f"🚀 Initializing AI Service...")
print(f"📂 Model Path: {MODEL_PATH}")

# Load Model (Global instance to avoid reloading)
try:
    model = GPT4All(MODEL_NAME, model_path=MODEL_PATH, allow_download=False, n_ctx=4096)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

class ExplanationRequest(BaseModel):
    question: str
    user_answer: Optional[str] = None
    correct_answer: str
    static_explanation: Optional[str] = None
    time_taken: Optional[int] = 0

@app.post("/explain")
async def explain_question(request: ExplanationRequest):
    if not model:
        raise HTTPException(status_code=503, detail="AI Model not initialized")

    try:
        start_time = time.time()
        
        is_unattempted = request.user_answer in [None, "", "Skipped", "Unattempted"]
        user_answer_display = "Not Attempted / Skipped" if is_unattempted else request.user_answer

        if is_unattempted:
             prompt = f"""You are an expert personal tutor. A student skipped this question.

Context:
- Question: "{request.question}"
- Student's Status: Not Attempted
- Correct Answer: "{request.correct_answer}"
- Official Solution: "{request.static_explanation if request.static_explanation else 'Not provided'}"

Task:
Since they didn't attempt it:
1. Explain the concept simply so they can try it next time.
2. Do NOT say "You got it wrong". Say "Here is how to solve this...".
3. Keep it encouraging.
4. Do NOT use headers like "Analysis:" or separators like "===".

tutor:"""
        else:
            # Detect if they rushed (Wrong AND < 10 seconds)
            is_rushed = (request.user_answer != request.correct_answer) and (request.time_taken < 10)
            
            timing_instruction = ""
            if is_rushed:
                timing_instruction = f"2. CRITICAL: They answered in only {request.time_taken}s and got it wrong. TELL THEM they rushed. Advise them to take their time and read carefully."
            else:
                timing_instruction = "2. Comment on their speed (Good pace? Too slow?)."

            prompt = f"""You are an expert personal tutor. A student has just answered a question.

Context:
- Question: "{request.question}"
- Student's Answer: "{user_answer_display}"
- Correct Answer: "{request.correct_answer}"
- Time Taken: {request.time_taken} seconds
- Official Solution: "{request.static_explanation if request.static_explanation else 'Not provided'}"

Task:
Provide a 2-3 sentence friendly and personalized feedback.
1. Explain WHY they were wrong (or confirm why they were right).
{timing_instruction}
3. Simplify the core concept.
4. Use "You" to address the student directly.
5. Do NOT use headers like "Analysis:" or separators like "===". Just start speaking.

tutor:"""
        
        # Generate response
        output = model.generate(prompt, max_tokens=200, temp=0.6)
        
        # Power-clean artifacts
        cleaned_output = output.strip()
        
        # 1. Stop processing immediately at known end tokens/hallucinations
        stop_markers = ["<|endoftext|>", "[Question]:", "Student:", "Context:", "Task:"]
        for marker in stop_markers:
            if marker in cleaned_output:
                cleaned_output = cleaned_output.split(marker)[0]
        
        # 2. Remove common prefix artifacts
        artifacts = ["===", "Analysis:", "analysis:", "# student", "<|diff_marker|>"]
        for artifact in artifacts:
            cleaned_output = cleaned_output.replace(artifact, "")
            
        # 3. Final regex cleanup
        import re
        cleaned_output = re.sub(r'^[^a-zA-Z0-9"(]+', '', cleaned_output).strip()

        processing_time = time.time() - start_time
        print(f"⏱️ Generated explanation in {processing_time:.2f}s")
        
        return {
            "explanation": cleaned_output,
            "processing_time": processing_time
        }

    except Exception as e:
        print(f"❌ Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class QuestionExample(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    type: str

class GenerationRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str
    exam_type: str
    examples: List[QuestionExample]
    count: int = 1

@app.post("/generate-questions")
async def generate_questions(request: GenerationRequest):
    if not model:
        raise HTTPException(status_code=503, detail="AI Model not initialized")
    
    try:
        start_time = time.time()
        print(f"🧠 Generating {request.count} questions for {request.topic} ({request.subject})...")
        
        # Format examples
        examples_text = ""
        for i, ex in enumerate(request.examples, 1):
            examples_text += f"\nExample {i}:\nQuestion: {ex.question}\nOptions: {ex.options}\nCorrect Answer: {ex.correct_answer}\nExplanation: {ex.explanation}\n"

        # Simplified Prompt - Text Based (More robust for local models than JSON)
        prompt = f"""<|user|>
You are an expert exam question setter for {request.exam_type}. 
Task: Create {request.count} NEW practice question(s) on "{request.topic}" ({request.subject}).
Difficulty: {request.difficulty}.

Use this EXACT format for each question (do not use markdown or JSON):

---
Q: [Question text here]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Correct: [Option text of the correct answer]
Explanation: [Short explanation]
---

Rules:
1. Create {request.count} unique questions.
2. Do not copy the examples.
3. Ensure 4 options.
<|end|>
<|assistant|>"""

        # Generate with lower temp for stability
        output = model.generate(prompt, max_tokens=2048, temp=0.1)
        
        cleaned_output = output.strip()
        print(f"🔍 Raw LLM Output:\n{cleaned_output}\n-------------------")

        # Parse the structured text
        import re
        
        questions = []
        # Split by separator
        raw_blocks =cleaned_output.split('---')
        
        for block in raw_blocks:
            if not block.strip(): continue
            
            # Extract fields using Regex
            q_match = re.search(r'Q:\s*(.*?)(?=\n[A-D]\))', block, re.DOTALL)
            a_match = re.search(r'A\)\s*(.*?)(?=\nB\))', block, re.DOTALL)
            b_match = re.search(r'B\)\s*(.*?)(?=\nC\))', block, re.DOTALL)
            c_match = re.search(r'C\)\s*(.*?)(?=\nD\))', block, re.DOTALL)
            d_match = re.search(r'D\)\s*(.*?)(?=\nCorrect:)', block, re.DOTALL)
            corr_match = re.search(r'Correct:\s*(.*?)(?=\nExplanation:|$)', block, re.DOTALL)
            exp_match = re.search(r'Explanation:\s*(.*)', block, re.DOTALL)

            if q_match and a_match and b_match and c_match and d_match and corr_match:
                q_obj = {
                    "question": q_match.group(1).strip(),
                    "options": [
                        a_match.group(1).strip(),
                        b_match.group(1).strip(),
                        c_match.group(1).strip(),
                        d_match.group(1).strip()
                    ],
                    "correct_answer": corr_match.group(1).strip(),
                    "explanation": exp_match.group(1).strip() if exp_match else "Explanation provided by AI.",
                    "type": "MCQ"
                }
                questions.append(q_obj)

        if not questions:
            # Fallback: Try simpler split if regex fails (sometimes models miss newlines)
            pass 

        processing_time = time.time() - start_time
        print(f"⏱️ Parsed {len(questions)} questions in {processing_time:.2f}s")
        
        return {
            "questions": questions,
            "processing_time": processing_time
        }

    except Exception as e:
        print(f"❌ Generation error: {e}")
        return {"questions": [], "error": str(e)}

@app.get("/health")
def health_check():
    return {"status": "active", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
