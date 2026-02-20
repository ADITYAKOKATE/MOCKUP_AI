# Python AI Dependencies Guide

This project uses a hybrid AI stack:
1.  **Ollama**: For LLM Inference (Replaces llama-cpp-python).
2.  **Faster-Whisper**: For Speech-to-Text (STT).
3.  **Edge-TTS**: For Text-to-Speech (TTS).
4.  **Sentence-Transformers**: For Vector Memory Embeddings.

## 🚀 Quick Setup

### 1. Install Python Packages
```bash
cd backend
pip install -r requirements.txt
```

### 2. Install & Configure Ollama (REQUIRED)
The LLM logic has been migrated to **Ollama** for better performance and easier setup.

1.  **Download Ollama**: [https://ollama.com/download](https://ollama.com/download)
2.  **Install & Run**: Follow the installer.
3.  **Register the Model**:
    We use a custom `Phi-3-mini` model configuration. Run the setup script:
    ```bash
    # Windows
    backend/register_model.bat
    ```
    *This script creates a model named `phi3-mini` in Ollama from your local `.gguf` file.*

### 3. Verify Ollama
Run this command to check if the model is ready:
```bash
ollama list
```
You should see `phi3-mini` in the list.

---

## 🛠️ Troubleshooting Specific Libraries

### 1. `faster-whisper` (STT) on GPU
**Issue:** `Could not load library` or `DLL load failed`.
**Solution:** You need NVIDIA CUDA Toolkit 12.x and cuDNN 8.9.x.

1.  **Install CUDA 12.x**: [NVIDIA Archive](https://developer.nvidia.com/cuda-12-6-0-download-archive)
2.  **Install cuDNN 8.9**: [NVIDIA Developer](https://developer.nvidia.com/rdp/cudnn-archive)
    -   Copy `bin/*.dll` to `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.x\bin`.
    -   Copy `include/*.h` to `include`.
    -   Copy `lib/x64/*.lib` to `lib/x64`.
3.  **Add `zlibwapi.dll`**: Download [zlib123dllx64.zip](http://www.winimage.com/zLibDll/zlib123dllx64.zip) and put `zlibwapi.dll` in the CUDA `bin` folder.

### 2. `sentence-transformers`
**Issue:** `ValueError: Your currently installed version of Keras is Keras 3`.
**Solution:** `pip install tf-keras` (should be handled by requirements.txt).

---

## ✅ Verification Script

Run this to verify Python can see all libraries:
```bash
python -c "import requests; import faster_whisper; import sentence_transformers; import edge_tts; print('✅ ALL PYTHON DEPENDENCIES OK')"
```
