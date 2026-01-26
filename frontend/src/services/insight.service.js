const BASE_URL = 'http://localhost:5000/api';

export const insightService = {
    getAIInsights: async (examType) => {
        const query = examType ? `?examType=${examType}` : '';
        const response = await fetch(`${BASE_URL}/insights${query}`);
        return response.json();
    }
};
