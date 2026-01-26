const BASE_URL = 'http://localhost:5000/api';

export const testSessionService = {
    /**
     * Start a full length test
     */
    startFullTest: async (examType) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/test/start-full-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ examType })
        });

        const data = await response.json();

        if (!response.ok) {
            // Pass the error data along so the frontend can handle 'active session' cases
            const error = new Error(data.message || 'Failed to start test');
            error.data = data;
            throw error;
        }

        return data;
    },

    /**
     * Get active test session
     */
    getSession: async (sessionId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/test/session/${sessionId}`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch test session');
        }

        return response.json();
    },

    /**
     * Save response for a question
     */
    saveResponse: async (sessionId, questionId, answer, timeTaken, marked = false) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/test/session/${sessionId}/response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ questionId, answer, timeTaken, marked })
        });

        if (!response.ok) {
            throw new Error('Failed to save response');
        }

        return response.json();
    },

    /**
     * Submit test
     */
    submitTest: async (sessionId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/test/session/${sessionId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit test');
        }

        return response.json();
    },

    /**
     * Discard active session
     */
    discardSession: async (sessionId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/test/session/${sessionId}/discard`, {
            method: 'POST',
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to discard session');
        }

        return response.json();
    },

    /**
     * Get test results
     */
    getTestResults: async (attemptId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/test/results/${attemptId}`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }

        return response.json();
    },

    /**
     * Get test history
     */
    getTestHistory: async (exam) => {
        const token = localStorage.getItem('token');
        const query = exam ? `?exam=${encodeURIComponent(exam)}` : '';
        const response = await fetch(`${BASE_URL}/test/history${query}`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        return response.json();
    }
};
