import axios from 'axios';

// Use environment variable with fallback
export const API_PYTHON_URL = import.meta.env.VITE_API_PYTHON_URL || 'http://localhost:5001';

export const assistantService = {
  assistantChat: async (userId, message, audioBase64) => {
    try {
      const response = await axios.post(`${API_PYTHON_URL}/assistant/chat`, {
        user_id: userId,
        message: message,
        audio_base64: audioBase64
      });
      return response.data;
    } catch (error) {
      console.error("Assistant Chat Error:", error);
      throw error;
    }
  },

  assistantHistory: async (userId) => {
    try {
      const response = await axios.get(`${API_PYTHON_URL}/assistant/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Assistant History Error:", error);
      throw error;
    }
  }
};
