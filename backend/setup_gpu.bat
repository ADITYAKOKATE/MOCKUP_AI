@echo off
echo 🚀 Installing llama-cpp-python with CUDA Support (Pre-built Wheel)...

echo 1. Uninstalling current version...
pip uninstall -y llama-cpp-python

echo 2. Installing pre-built wheel (Trying cu124)...
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu124 --force-reinstall --no-cache-dir
if %errorlevel% neq 0 (
    echo ⚠️ cu124 failed. Trying cu123...
    pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu123 --force-reinstall --no-cache-dir
)
if %errorlevel% neq 0 (
    echo ⚠️ cu123 failed. Trying cu122...
    pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu122 --force-reinstall --no-cache-dir
)
if %errorlevel% neq 0 (
    echo ❌ All GPU wheels failed. Reverting to CPU version...
    pip install llama-cpp-python --force-reinstall --no-cache-dir
)

echo ✅ Installation Complete!
echo Please restart your backend server now.
