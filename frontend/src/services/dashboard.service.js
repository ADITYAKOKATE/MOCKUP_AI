const BASE_URL = 'http://localhost:5000/api';

export const dashboardService = {
    getDashboardData: async (exam) => {
        const token = localStorage.getItem('token');
        const query = exam ? `?exam=${encodeURIComponent(exam)}` : '';
        const response = await fetch(`${BASE_URL}/dashboard${query}`, {
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return response.json();
    }
};
