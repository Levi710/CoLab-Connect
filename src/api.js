const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const api = {
    auth: {
        register: async (userData) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (!res.ok) throw new Error('Registration failed');
            return res.json();
        },
        login: async (credentials) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) throw new Error('Login failed');
            return res.json();
        },
        me: async () => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        },
        updateProfile: async (profileData) => {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(profileData),
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return res.json();
        },
    },
    projects: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/projects`);
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
        create: async (projectData) => {
            const res = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(projectData),
            });
            if (!res.ok) throw new Error('Failed to create project');
            return res.json();
        },
        getMyProjects: async () => {
            const res = await fetch(`${API_URL}/projects/my`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch my projects');
            return res.json();
        },
    },
    requests: {
        create: async (requestData) => {
            const res = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(requestData),
            });
            if (!res.ok) throw new Error('Failed to send request');
            return res.json();
        },
        getMyProjectRequests: async () => {
            const res = await fetch(`${API_URL}/requests/my-projects`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch requests');
            return res.json();
        },
        updateStatus: async (requestId, status) => {
            const res = await fetch(`${API_URL}/requests/${requestId}/status`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update request status');
            return res.json();
        },
    },
    messages: {
        get: async (requestId) => {
            const res = await fetch(`${API_URL}/messages/${requestId}`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        },
        send: async (messageData) => {
            const res = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(messageData),
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },
    },
    payment: {
        createOrder: async () => {
            const res = await fetch(`${API_URL}/payment/order`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to create order');
            return res.json();
        },
        verify: async (paymentData) => {
            const res = await fetch(`${API_URL}/payment/verify`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(paymentData),
            });
            if (!res.ok) throw new Error('Payment verification failed');
            return res.json();
        },
    },
    ai: {
        getAnalysis: async () => {
            const res = await fetch(`${API_URL}/ai/analysis`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch AI analysis');
            return res.json();
        },
    },
};
