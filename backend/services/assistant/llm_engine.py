import os
import requests
import json
import time

class LLMEngine:
    def __init__(self, model_path: str, n_ctx: int = 4096):
        if not model_path:
            raise ValueError("LLMEngine requires a valid 'model_path'.")

        # Determine model name for Ollama
        if "/" in model_path or "\\" in model_path:
             # Extract filename without extension to use as model name
             filename = os.path.basename(model_path)
             if filename.endswith(".gguf"):
                 filename = filename[:-5]
             
             # Sanitize for Ollama (lowercase, replace illegal chars with -)
             self.model_name = filename.lower().replace(" ", "-")
             print(f"ℹ️ Derived Ollama model name '{self.model_name}' from path '{model_path}'")
        else:
             self.model_name = model_path

        self.api_url = "http://localhost:11434/api/generate"
        self.model_file_path = "Modelfile" 
        
        self._ensure_model_exists()

    def _ensure_model_exists(self):
        import subprocess
        try:
            # 1. Check if Ollama is running
            print(f"🚀 Connecting to Ollama at {self.api_url}...", flush=True)
            try:
                requests.get("http://localhost:11434/")
            except:
                print("❌ Ollama is NOT running. Please start it with 'ollama serve'")
                return

            # 2. Check if model exists
            print(f"🔍 Checking for model '{self.model_name}'...", flush=True)
            res = requests.post("http://localhost:11434/api/show", json={"name": self.model_name})
            
            if res.status_code != 200:
                print(f"❌ Model '{self.model_name}' NOT FOUND in Ollama.", flush=True)
                print(f"⚠️ Please run your model setup script to create '{self.model_name}' from the GGUF file.", flush=True)
            else:
                print(f"✅ Model '{self.model_name}' is ready.", flush=True)

        except Exception as e:
            print(f"❌ Model Check Failed: {e}")

    def generate_response(self, prompt: str, max_tokens: int = 256, stop: list = None, temperature: float = 0.7):
        try:
            # Debug Prompt Tokens (Estimate)
            print(f"🧠 Sending Prompt to Ollama (Model: {self.model_name})...", flush=True)

            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": temperature,
                    "num_ctx": 2048, # Reduced for speed
                    "num_gpu": 99, 
                    "stop": stop or ["User:", "\n\n"]
                }
            }
            
            response = requests.post(self.api_url, json=payload)
            response.raise_for_status()
            
            return response.json().get("response", "").strip()
            
        except Exception as e:
            print(f"❌ Generation Error: {e}", flush=True)
            return "I'm having trouble thinking right now."

    async def generate_stream(self, prompt: str, max_tokens: int = 256, stop: list = None, temperature: float = 0.7):
        import aiohttp
        try:
            # Debug Prompt Tokens (Estimate)
            print(f"🧠 Streaming Prompt to Ollama (Model: {self.model_name})...", flush=True)

            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": temperature,
                    "num_ctx": 2048, # Reduced for speed
                    "num_gpu": 99,
                    "stop": stop or ["User:", "\n\n"]
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, json=payload) as response:
                    if response.status != 200:
                        print(f"❌ Ollama Stream Error: {response.status}")
                        yield "Error."
                        return

                    async for line in response.content:
                        if line:
                            try:
                                json_obj = json.loads(line.decode('utf-8'))
                                text_chunk = json_obj.get("response", "")
                                if not json_obj.get("done") and text_chunk:
                                    yield text_chunk
                            except Exception as e:
                                print(f"Error parsing chunk: {e}")

        except Exception as e:
            print(f"❌ Streaming Error: {e}", flush=True)
            yield "Error."
