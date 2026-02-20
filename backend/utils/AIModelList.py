import os

# Define available models
# Keys are the friendly names, Values are the file paths relative to the backend directory
MODELS = {
    "phi3-mini": os.path.join("llmModel", "Phi-3-mini-4k-instruct.Q4_0.gguf"),
}

# -------------------------------------------------
# ⚙️ ACTIVE MODEL CONFIGURATION
# Change this string to switch the active model
# -------------------------------------------------
ACTIVE_MODEL_KEY = "phi3-mini"
# -------------------------------------------------

def get_active_model_path():
    if ACTIVE_MODEL_KEY not in MODELS:
        raise ValueError(f"Active model '{ACTIVE_MODEL_KEY}' not found in MODELS list.")
    return MODELS[ACTIVE_MODEL_KEY]
