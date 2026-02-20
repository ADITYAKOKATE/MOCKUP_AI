@echo off
echo 🚀 Registering Local Model with Ollama...

echo 1. Creating 'phi-3-mini-4k-instruct.q4_0' from Modelfile...
ollama create phi-3-mini-4k-instruct.q4_0 -f Modelfile

if %errorlevel% neq 0 (
    echo ❌ Failed to create model.
    echo Ensure Ollama is running ('ollama serve') and Modelfile exists.
    pause
    exit /b %errorlevel%
)

echo ✅ Model Registered Successfully!
echo You can now restart the backend.
pause
