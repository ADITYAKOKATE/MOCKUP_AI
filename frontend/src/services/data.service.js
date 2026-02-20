const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const dataService = {
    uploadImage: async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            body: formData // Content-Type is set automatically for FormData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Image upload failed');
        }

        return response.json();
    }
};
