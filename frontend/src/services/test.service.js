const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const testService = {
    getTestConfig: async () => {
        const response = await fetch(`${BASE_URL}/tests/config`);
        return response.json();
    },

    generateQuestions: async (params = {}) => {
        // Build query string, filtering out null/undefined
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v != null && v !== '')
        );
        const query = new URLSearchParams(cleanParams).toString();

        const response = await fetch(`${BASE_URL}/questions/generate?${query}`);
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        return response.json();
    },

    // Get topics for an exam
    getTopicsByExam: async (examName) => {
        const response = await fetch(`${BASE_URL}/questions/topics/${encodeURIComponent(examName)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch topics');
        }
        return response.json();
    },

    // Get questions by topic
    getQuestionsByTopic: async (examName, topic, limit = 10) => {
        const response = await fetch(`${BASE_URL}/questions/by-topic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examName, topic, limit })
        });
        if (!response.ok) {
            throw new Error('Failed to fetch topic questions');
        }
        return response.json();
    },

    // Get revision questions
    getRevisionQuestions: async (examName, limit = 20) => {
        const response = await fetch(`${BASE_URL}/questions/revision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examName, limit })
        });
        if (!response.ok) {
            throw new Error('Failed to fetch revision questions');
        }
        return response.json();
    },

    startTest: async (type, params = {}) => {
        const response = await fetch(`${BASE_URL}/tests/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...params })
        });
        return response.json();
    },

    submitAnswer: async (sessionId, questionId, optionIndex, timeTaken) => {
        const response = await fetch(`${BASE_URL}/tests/${sessionId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId, optionIndex, timeTaken })
        });
        return response.json();
    },

    submitTest: async (sessionId) => {
        const response = await fetch(`${BASE_URL}/tests/${sessionId}/finish`, {
            method: 'POST'
        });
        return response.json();
    }
};
