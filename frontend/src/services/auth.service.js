const BASE_URL = 'http://localhost:5000/api';

export const authService = {
    login: async (email, password) => {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        return response.json();
    },

    register: async (userData) => {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }
        return response.json();
    },

    getMe: async (token) => {
        const response = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 
                'x-auth-token': token 
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }
        return response.json();
    },

    updateProfile: async (token, profileData) => {
        const response = await fetch(`${BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        return response.json();
    }
};
