import os
import time
import sys
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gpt4all import GPT4All
from typing import Optional, List, Dict, Any
import base64
import cv2
import numpy as np
from ultralytics import YOLO

# Ensure debug folder exists
os.makedirs("debug_images", exist_ok=True)

app = FastAPI()

# Add CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_NAME = "Phi-3-mini-4k-instruct.Q4_0.gguf"
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "llmModel")

print(f"🚀 Initializing AI Service...", flush=True)

# Load YOLO Model for Object Detection
try:
    print("🚀 Loading YOLOv8n model for object detection...", flush=True)
    yolo_model = YOLO("yolov8n.pt") 
    print("✅ YOLOv8n loaded successfully.", flush=True)
except Exception as e:
    print(f"❌ Failed to load YOLO model: {e}", flush=True)
    yolo_model = None

# Load Model (Global instance to avoid reloading)
try:
    print(f"🚀 Loading AI Model {MODEL_NAME}...", flush=True)
    model = GPT4All(MODEL_NAME, model_path=MODEL_PATH, allow_download=False, n_ctx=4096)
    print("✅ AI Model loaded successfully.", flush=True)
except Exception as e:
    print(f"❌ Failed to load model: {e}", flush=True)
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
    
    prompt = f"Question: {request.question}\nCorrect Answer: {request.correct_answer}\nUser Answer: {request.user_answer}\nExplain why the correct answer is correct and why the user's answer (if different) is wrong. Keep it concise."
    
    try:
        start_time = time.time()
        output = model.generate(prompt, max_tokens=200)
        processing_time = time.time() - start_time
        return {"explanation": output.strip(), "processing_time": processing_time}
    except Exception as e:
        print(f"❌ Explanation Generation Error: {e}", flush=True)
        return {"explanation": "Failed to generate explanation", "processing_time": 0}

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
    
    print(f"🤖 Generating {request.count} questions for topic: '{request.topic}' ({request.exam_type} - {request.subject})", flush=True)
    
    # Construct few-shot prompt
    prompt = f"Generate {request.count} {request.difficulty} level {request.subject} questions on topic '{request.topic}' for {request.exam_type} exam.\n"
    prompt += "Return ONLY a raw JSON array of objects with keys: question, options (list of 4), correct_answer, explanation, type.\n\n"
    
    if request.examples:
        prompt += "Examples:\n"
        for ex in request.examples[:2]:
            prompt += f"Q: {ex.question}\nO: {ex.options}\nA: {ex.correct_answer}\n\n"
            
    prompt += "New Questions JSON:\n["
    
    try:
        print(f"⏳ Sending prompt to AI model... (this may take ~{request.count * 25}s on CPU)", flush=True)
        output = model.generate(prompt, max_tokens=1024, temp=0.7)
        # Attempt to clean and parse JSON
        cleaned_output = output.strip()
        
        # Remove markdown code blocks if present
        if "```json" in cleaned_output:
            cleaned_output = cleaned_output.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_output:
             cleaned_output = cleaned_output.split("```")[1].split("```")[0].strip()

        if not cleaned_output.startswith("["):
            # Try to find the first '['
            start = cleaned_output.find("[")
            if start != -1:
                cleaned_output = cleaned_output[start:]
            else:
                # If no bracket, maybe it's just a raw list of objects? Try adding brackets
                cleaned_output = "[" + cleaned_output

        if not cleaned_output.endswith("]"):
            # Try to find the last ']'
            end = cleaned_output.rfind("]")
            if end != -1:
                cleaned_output = cleaned_output[:end+1]
            else:
                 # If cut off, try to append ']'
                 cleaned_output += "]"
            
        import json
        import re
        
        # Step 1: Clean the output
        # Since we end the prompt with '[', the model will continue from there
        # So we need to prepend '[' to the output
        full_json = "[" + cleaned_output
        
        # Step 2: Try to find valid JSON array boundaries
        # Remove everything after the last valid ']'
        bracket_count = 0
        last_valid_pos = -1
        for i, char in enumerate(full_json):
            if char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    last_valid_pos = i
                    break
        
        if last_valid_pos != -1:
            full_json = full_json[:last_valid_pos + 1]
        
        try:
            questions = json.loads(full_json)
        except json.JSONDecodeError as json_err:
            print(f"⚠️ JSON Parse Error: {json_err}. Raw output: \n{output}", flush=True)
            # Fallback: Regex extraction for objects
            # Look for objects enclosed in braces
            matches = re.findall(r'\{[^{}]*\}', cleaned_output, re.DOTALL)
            questions = []
            for m in matches:
                try:
                    obj = json.loads(m)
                    # Validate that it has required fields and they're not empty
                    if obj.get('question') and obj.get('options') and obj.get('correct_answer'):
                        questions.append(obj)
                except:
                    pass

            if not questions:
                raise ValueError("Could not extract any valid JSON objects")
        
        print(f"✅ Successfully generated {len(questions)} questions for topic '{request.topic}'", flush=True)
        return {"questions": questions}
    except Exception as e:
        print(f"❌ Question Generation Error for topic '{request.topic}': {e}", flush=True)
        return {"questions": [], "error": str(e)}

# Session Store for Baselines (In-Memory)
session_baselines: Dict[str, Dict[str, int]] = {}

class CalibrationRequest(BaseModel):
    sessionId: str
    images: List[str] # List of Base64 images

@app.post("/calibrate")
async def calibrate_session(request: CalibrationRequest):
    try:
        print(f"📸 Calibrating session {request.sessionId} with {len(request.images)} frames...", flush=True)
        
        valid_faces = []
        
        for i, b64 in enumerate(request.images):
            try:
                print(f"🔹 Processing frame {i+1}/{len(request.images)} (Length: {len(b64)})", flush=True)
                
                # Decode
                if ',' in b64:
                     b64 = b64.split(',')[1]
                
                try:
                    image_data = base64.b64decode(b64)
                    np_arr = np.frombuffer(image_data, np.uint8)
                except Exception as e:
                    print(f"❌ Base64 Decode Error frame {i}: {e}", flush=True)
                    continue
                
                if np_arr.size == 0:
                    print(f"⚠️ Empty buffer frame {i}", flush=True)
                    continue
                
                try:
                    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                except Exception as e:
                    print(f"❌ Imdecode Error frame {i}: {e}", flush=True)
                    continue
                
                if img is None: 
                    print(f"⚠️ img is None frame {i}", flush=True)
                    continue

                h, w = img.shape[:2]
                print(f"📏 Frame {i} Size: {w}x{h}", flush=True)

                # Save frame for debugging
                timestamp = int(time.time() * 1000)
                debug_path = f"debug_images/calib_{request.sessionId}_{timestamp}_{i}.jpg"
                cv2.imwrite(debug_path, img)
                print(f"✅ Saved debug image: {debug_path}", flush=True)
                
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                # Enhance contrast
                gray = cv2.equalizeHist(gray)
                
                # Load Cascade
                
                # Load Cascade
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                face_cascade = cv2.CascadeClassifier(cascade_path)
                
                if face_cascade.empty():
                    print(f"❌ Failed to load Haar Cascade from: {cascade_path}", flush=True)
                
                # Relaxed parameters for better detection
                # scaleFactor=1.05 (slower but more thorough), minNeighbors=3 (more sensitive)
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))

                print(f"🖼️ Frame {i+1}: Found {len(faces)} faces.", flush=True)

                if len(faces) >= 1:
                    # Take the largest face if multiple
                    largest_face = max(faces, key=lambda f: f[2] * f[3])
                    valid_faces.append(largest_face) 
                else:
                    print(f"⚠️ No faces in frame {i+1}", flush=True)

            except Exception as e:
                print(f"⚠️ Error processing frame {i}: {e}", flush=True)
                continue
        
        print(f"📊 Valid faces collected: {len(valid_faces)} / {len(request.images)}", flush=True)

        if not valid_faces:
             return {"status": "error", "message": "No valid faces detected. Check lighting/camera."}

        # Calculate Average Baseline
        avg_x = int(sum([f[0] for f in valid_faces]) / len(valid_faces))
        avg_y = int(sum([f[1] for f in valid_faces]) / len(valid_faces))
        avg_w = int(sum([f[2] for f in valid_faces]) / len(valid_faces))
        avg_h = int(sum([f[3] for f in valid_faces]) / len(valid_faces))

        baseline = {"x": avg_x, "y": avg_y, "w": avg_w, "h": avg_h}
        session_baselines[request.sessionId] = baseline
        
        print(f"✅ Calibration Success for {request.sessionId}: {baseline}", flush=True)
        return {"status": "success", "baseline": baseline}

    except Exception as e:
        print(f"❌ Calibration error: {e}", flush=True)
        return {"status": "error", "message": str(e)}

class AnalysisRequest(BaseModel):
    sessionId: str
    image: str # Base64 encoded image

@app.post("/analyze-frame")
async def analyze_frame(request: AnalysisRequest):
    try:
        # Decode image
        if ',' in request.image:
             b64 = request.image.split(',')[1]
        else:
             b64 = request.image

        image_data = base64.b64decode(b64)
        np_arr = np.frombuffer(image_data, np.uint8)
        
        if np_arr.size == 0:
             return {"status": "error", "message": "Empty image buffer"}

        try:
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception:
            return {"status": "error", "message": "Image decode error"}

        if img is None:
            return {"status": "error", "message": "Invalid image"}

        # 1. Check for Electronic Devices (Phones) using YOLO (PRIORITY)
        # Run this FIRST so it detects phone even if face is blocked
        if yolo_model:
            results = yolo_model(img, verbose=False) # Run inference
            
            # Check for class 67 ('cell phone')
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    if cls_id == 67 and conf > 0.4: # Lowered threshold slightly to 0.4
                         return {
                             "status": "violation", 
                             "type": "E_DEVICE_DETECTED", 
                             "message": "Electronic Device Detected (Phone)",
                             "evidence_score": conf
                         }

        # OpenCV Haar Cascade
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
        
        face_count = len(faces)

        if face_count == 0:
            return {"status": "violation", "type": "NO_FACE", "message": "No face detected"}

        if face_count > 1:
            return {"status": "violation", "type": "MULTIPLE_FACES", "message": "Multiple faces detected"}

        # Single Face Found - Check against Baseline
        (x, y, w, h) = faces[0]
        
        baseline = session_baselines.get(request.sessionId)
        
        violation_type = None
        violation_msg = None

        if baseline:
            # 1. Check Position Shift (Movement)
            cx, cy = x + w/2, y + h/2
            bx, by = baseline['x'] + baseline['w']/2, baseline['y'] + baseline['h']/2
            
            dist = np.sqrt((cx - bx)**2 + (cy - by)**2)
            
            # Thresholds (pixels) - Tunable
            MOVEMENT_THRESHOLD = 50 
            
            if dist > MOVEMENT_THRESHOLD:
                violation_type = "HIGH_MOVEMENT"
                violation_msg = "Excessive movement detected"
            
            # 2. Check Size Change (Leaning)
            current_area = w * h
            baseline_area = baseline['w'] * baseline['h']
            ratio = current_area / baseline_area
            
            if ratio < 0.6: # Much smaller
                violation_type = "LEANING_BACK"
                violation_msg = "User leaning too far back"
            elif ratio > 1.6: # Much bigger
                violation_type = "LEANING_FORWARD"
                violation_msg = "User too close to camera"

        if violation_type:
             return {
                 "status": "violation", 
                 "type": violation_type, 
                 "message": violation_msg,
                 "face_data": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
             }

        return {
            "status": "clean", 
            "type": "FACE_DETECTED", 
            "message": "Valid",
            "face_data": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        }

    except Exception as e:
        print(f"❌ Analysis error: {e}", flush=True)
        return {"status": "error", "message": str(e)}

@app.get("/health")
def health_check():
    return {"status": "active", "model_loaded": model is not None, "vision_loaded": True}

if __name__ == "__main__":
    import uvicorn
    # Enforce one process
    uvicorn.run(app, host="0.0.0.0", port=5001)
