import os
import ctypes.util
import sys

def check_dll(name):
    path = ctypes.util.find_library(name)
    if path:
        print(f"✅ Found {name}: {path}")
        return True
    else:
        # Try manual search in PATH
        for p in os.environ["PATH"].split(os.pathsep):
            fpath = os.path.join(p, name)
            if os.path.exists(fpath):
                print(f"✅ Found {name} in PATH: {fpath}")
                return True
        print(f"❌ Could NOT find {name}")
        return False

print(f"Python: {sys.version}")
print("Checking for CUDA 12 libraries...")

libs = [
    "cudart64_12.dll",
    "cublas64_12.dll",
    "cublasLt64_12.dll",
    "zlibwapi.dll"  # Required for cuDNN sometimes
]

missing = []
for lib in libs:
    if not check_dll(lib):
        missing.append(lib)

if missing:
    print("\n⚠️  MISSING LIBRARIES:")
    for m in missing:
        print(f" - {m}")
    print("\nPlease verify that C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v12.6\\bin is in your PATH.")
else:
    print("\n✅ All core libraries found.")

print("\nLoadLibrary Test:")
for lib in libs:
    try:
        ctypes.CDLL(lib)
        print(f"✅ Successfully loaded {lib}")
    except Exception as e:
        print(f"❌ Failed to load {lib}: {e}")
