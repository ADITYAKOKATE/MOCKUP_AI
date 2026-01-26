const BASE_URL = 'http://localhost:5000/api';

export const analysisService = {
    getAnalysis: async (analysisId, examType) => {
        const token = localStorage.getItem('token');
        const query = examType ? `?examType=${examType}` : '';
        const response = await fetch(`${BASE_URL}/analysis/attempt/${analysisId}${query}`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch analysis');
        return response.json();
    },
    getPerformance: async (examType) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/analysis/performance`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch performance');
        const data = await response.json();
        return data;
    },

    // Comprehensive Analysis Page APIs
    getAnalysisOverview: async (exam) => {
        const token = localStorage.getItem('token');
        const query = exam ? `?exam=${encodeURIComponent(exam)}` : '';
        const response = await fetch(`${BASE_URL}/analysis/overview${query}`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch analysis overview');
        return response.json();
    },
    getSubjectAnalysis: async (exam) => {
        const token = localStorage.getItem('token');
        const query = exam ? `?exam=${encodeURIComponent(exam)}` : '';
        const response = await fetch(`${BASE_URL}/analysis/subjects${query}`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch subject analysis');
        return response.json();
    },
    getTopicAnalysis: async (exam) => {
        const token = localStorage.getItem('token');
        const query = exam ? `?exam=${encodeURIComponent(exam)}` : '';
        const response = await fetch(`${BASE_URL}/analysis/topics${query}`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch topic analysis');
        return response.json();
    },
    getGrowthAnalysis: async (days = 30) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/analysis/growth?days=${days}`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch growth analysis');
        return response.json();
    },
    getTimeAnalytics: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/analysis/time-analytics`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Failed to fetch time analytics');
        return response.json();
    }
};
