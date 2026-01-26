import os
import sys
import json
import threading
from gpt4all import GPT4All

class AiClassifier:
    def __init__(self):
        # Using official GPT4All model name for auto-download
        self.model_name = "Phi-3-mini-4k-instruct.Q4_0.gguf" 
        self.model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "llmModel")
        self.llm = None
        self.lock = threading.Lock() # Ensure thread safety for inference
        self._load_model()

    def _load_model(self):
        print(f"🧠 Loading AI Model ({self.model_name})...")
        try:
            # allow_download=True lets GPT4All fetch it if missing.
            if not os.path.exists(self.model_path):
                os.makedirs(self.model_path)
            
            # GPU Selection Logic
            device = 'cpu'
            try:
                available_gpus = GPT4All.list_gpus()
                if available_gpus:
                    print(f"🔍 Found GPUs: {available_gpus}")
                    # Naive selection: Prefer non-Intel, non-Microsoft (likely discrete)
                    # If multiple, pick first one usually.
                    selected_gpu = next((g for g in available_gpus if "Intel" not in g and "Microsoft" not in g), None)
                    
                    if selected_gpu:
                        device = selected_gpu
                        print(f"🎮 Selected Dedicated GPU: {selected_gpu}")
                    else:
                        device = available_gpus[0] # Fallback to first available (e.g. Integrated)
                        print(f"⚠️ No Dedicated GPU found. Using: {device}")
                else:
                    print("⚠️ No GPUs detected by GPT4All. Using CPU.")
            except Exception as e:
                print(f"⚠️ GPU Discovery Failed: {e}. Defaulting to CPU.")

            self.llm = GPT4All(self.model_name, model_path=self.model_path, allow_download=True, device=device)
            print(f"✅ AI Engine Online (Device: {device}).")
        except Exception as e:
            print(f"❌ Failed to load AI Model: {e}")

    def classify(self, question, options, q_type="MCQ", exam_name="Unknown Exam"):
        if not self.llm: return None, None # Return defaults if model not loaded

        opts_str = "\n".join([f"- {opt['html'] if isinstance(opt, dict) else opt}" for opt in options])
        
        system_prompt = f"""You are an expert for Competitive Exams like JEE Mains, JEE Advanced, GATE, NEET, MHT CET.
        Your job is to rate the Difficulty and Importance of questions based on standard exam benchmarks.
        
        Benchmarks:
        - JEE Advanced/GATE: High difficulty is common. Deep conceptual questions.
        - JEE Mains/NEET: Medium to High. Speed and accuracy focused.
        - MHT CET: Low to Medium. Formula based.
        
        Analyze the question for the exam: {exam_name}."""
        
        user_prompt = f"""
        Question: {question}
        Type: {str(q_type)}
        Options:
        {opts_str}
        
        Task:
        1. Difficulty: 'Low', 'Medium', or 'High'.
        2. Importance: Integer 1 to 10.
        
        Return JSON object ONLY. No markdown, no text.
        Example: {{ "difficulty": "Medium", "importance": 7 }}
        """
        
        try:
            full_prompt = f"Instruct: {system_prompt} {user_prompt}\nOutput:"
            
            # Serialize inference to prevent low-level crashes (GGML assert filters)
            with self.lock:
                response_text = self.llm.generate(
                    full_prompt, 
                    max_tokens=60, 
                    temp=0.1
                ).strip()
            
            # 1. Attempt Clean JSON Extraction
            import re
            json_match = re.search(r'\{.*?\}', response_text, re.DOTALL)
            clean_json = json_match.group(0) if json_match else response_text
            
            diff = "Medium"
            imp = 5
            
            try:
                data = json.loads(clean_json)
                diff = data.get("difficulty", "Medium")
                imp = data.get("importance", 5)
            except:
                # 2. Fallback: Regex for individual fields if JSON is broken
                d_match = re.search(r'difficulty["\']?:\s*["\']?(Low|Medium|High)', response_text, re.IGNORECASE)
                i_match = re.search(r'importance["\']?:\s*(\d+)', response_text)
                
                if d_match: diff = d_match.group(1).capitalize()
                if i_match: imp = int(i_match.group(1))

            # Normalize
            if diff not in ['Low', 'Medium', 'High']: diff = None
            if not isinstance(imp, int): imp = int(imp) if str(imp).isdigit() else None
            
            return diff, imp
            
        except Exception as e:
            print(f"⚠️ AI Fail: {e}")
            return None, None
