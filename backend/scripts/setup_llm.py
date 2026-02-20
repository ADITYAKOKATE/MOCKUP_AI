import os
from gpt4all import GPT4All
from faster_whisper import WhisperModel
from sentence_transformers import SentenceTransformer
import shutil

def download_models():
    # 1. LLM
    model_name = "Phi-3-mini-4k-instruct.Q4_0.gguf"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to 'backend', then into 'llmModel'
    target_dir_llm = os.path.join(os.path.dirname(script_dir), "llmModel")
    
    if not os.path.exists(target_dir_llm):
        os.makedirs(target_dir_llm)
        
    print(f"🚀 [1/3] Checking LLM Model ({model_name})...")
    try:
        # Check if file exists to avoid re-downloading if GPT4All doesn't handle it well
        model_file = os.path.join(target_dir_llm, model_name)
        if os.path.exists(model_file):
             print(f"✅ LLM Model already exists at {model_file}")
        else:
             print(f"⬇️ Downloading LLM to {target_dir_llm}...")
             GPT4All(model_name, model_path=target_dir_llm, allow_download=True)
             print(f"✅ LLM Downloaded.")
    except Exception as e:
        print(f"❌ LLM Download failed: {e}")

    # 2. Whisper Model (STT)
    print(f"\n🚀 [2/3] Checking Whisper Model (tiny)...")
    try:
        # faster-whisper saves to cache by default, let's just trigger a load
        # To save to a specific folder, use download_root
        # We will use the default hub cache for simplicity, or we can vendor it.
        # Let's trust the default cache or allow it to download on first run.
        # But to be "setup", we should trigger it.
        model = WhisperModel("tiny", download_root=os.path.join(target_dir_llm, "whisper-tiny"))
        print(f"✅ Whisper Model ready.")
    except Exception as e:
        print(f"❌ Whisper Download failed: {e}")

    # 3. Embedding Model (Memory)
    print(f"\n🚀 [3/3] Checking Embedding Model (all-MiniLM-L6-v2)...")
    try:
        # sentence-transformers also caches.
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print(f"✅ Embedding Model ready.")
    except Exception as e:
         print(f"❌ Embedding Model failed: {e}")

    print("\n🎉 All models setup complete.")

if __name__ == "__main__":
    download_models()
