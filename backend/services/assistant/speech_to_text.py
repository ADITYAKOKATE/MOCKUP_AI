import os
import time
from faster_whisper import WhisperModel
import numpy as np

class STTEngine:
    def __init__(self, model_size="tiny", device="cuda", compute_type="int8_float16"):
        # Explicit priority for CUDA
        print(f"🎤 Loading Whisper ({model_size}) - Trying device: {device}...", flush=True)
        try:
            self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
            print(f"✅ Whisper Loaded on {device.upper()}.", flush=True)
        except Exception as e:
            print(f"⚠️ Failed to load Whisper on {device}: {e}", flush=True)
            print("🔄 Falling back to CPU...", flush=True)
            try:
                self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
                print("✅ Whisper Loaded on CPU (Fallback).", flush=True)
            except Exception as cpu_error:
                print(f"❌ Failed to load Whisper on CPU: {cpu_error}", flush=True)
                self.model = None

    def transcribe(self, audio_source, beam_size=5):
        if not self.model:
            return ""

        try:
            # faster-whisper optimizations:
            # - beam_size=1 (Greedy search) is much faster than beam search
            # - vad_filter=True with relaxed parameters to avoid cutting speech
            segments, info = self.model.transcribe(
                audio_source, 
                beam_size=1, # Greedy search for speed
                language="en",
                vad_filter=True, 
                vad_parameters=dict(min_silence_duration_ms=500, threshold=0.5)
            )
            # print(f"🎤 Detected language '{info.language}' with probability {info.language_probability}", flush=True)
            
            print("🎤 [STT Debug] Starting segment iteration...", flush=True)
            text_segments = []
            for i, segment in enumerate(segments):
                print(f"🎤 [STT Debug] Processing segment {i}...", flush=True)
                text_segments.append(segment.text)
            
            text = " ".join(text_segments).strip()
            print(f"🎤 [STT Debug] Segment iteration complete. Text length: {len(text)}", flush=True)
            
            # Filter common Whisper hallucinations on silence
            if text.lower() in ["you", "thank you", "thanks", "you.", "mbc", "amara"]:
                print(f"⚠️ Filtered hallucination: '{text}'")
                return ""
                
            return text
        except Exception as e:
            print(f"❌ Transcription Error: {e}", flush=True)
            return ""
