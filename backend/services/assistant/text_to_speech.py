import os
import edge_tts
import asyncio

class TTSEngine:
    def __init__(self, model_name="en-US-AriaNeural", gpu=False):
        print(f"🗣️ Loading TTS Engine (edge-tts)...", flush=True)
        self.voice = model_name
        print("✅ TTS Engine Loaded (Async).", flush=True)

    async def synthesize_async(self, text: str, output_path: str):
        try:
            communicate = edge_tts.Communicate(text, self.voice)
            await communicate.save(output_path)
            
            if os.path.exists(output_path):
                return output_path
            return None
        except Exception as e:
            print(f"❌ Synthesis Error: {e}", flush=True)
            return None

    def synthesize(self, text: str, output_path: str):
        # Wrapper for sync calls if needed, but we should use async in FastAPI
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We are already in an async loop (FastAPI), so we must await it.
                # But this method signature is sync. We should change the controller to await.
                # For now, let's just return a coroutine and handle it in controller.
                return self.synthesize_async(text, output_path)
            else:
                loop.run_until_complete(self.synthesize_async(text, output_path))
                return output_path
        except RuntimeError:
             # Create new loop if none exists
             asyncio.run(self.synthesize_async(text, output_path))
             return output_path
