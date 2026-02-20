import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const aiService = {
    /**
     * Get AI-powered test recommendations based on user performance
     * @param {string} examName - Name of the exam (e.g., "JEE Main")
     * @returns {Promise} - Promise with recommendations data
     */
    getRecommendations: async (examName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/ai/recommendations`, {
                headers: { 'x-auth-token': token },
                params: { examName }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching AI recommendations:', error);
            throw error.response?.data || error;
        }
    },

    /**
     * Get AI explanation for a question
     */
    explainQuestion: async (data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/ai/explain-question`, data, {
                headers: { 'x-auth-token': token }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching AI explanation:', error);
            throw error.response?.data || error;
        }
    }
};
