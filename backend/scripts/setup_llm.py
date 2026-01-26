import os
from gpt4all import GPT4All

def download_model():
    model_name = "Phi-3-mini-4k-instruct.Q4_0.gguf"
    
    # Target Directory (backend/llmModel)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.join(os.path.dirname(script_dir), "llmModel")
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    print(f"🚀 Starting download of {model_name}...")
    print(f"📂 Target: {target_dir}")
    
    try:
        # GPT4All().download_model is static? No, usually instance or library function.
        # Actually GPT4All(..., allow_download=True) does it. 
        # But solely for downloading, we can just instantiate it.
        GPT4All(model_name, model_path=target_dir, allow_download=True)
        print(f"✅ Model ready.")
    except Exception as e:
        print(f"❌ Download failed: {e}")

if __name__ == "__main__":
    download_model()
