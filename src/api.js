const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const error = new Error(errorData.error || 'Registration failed');
                error.response = { data: errorData };
                throw error;
            }
            return res.json();
        },
        login: async (credentials) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const error = new Error(errorData.error || 'Login failed');
                error.response = { data: errorData };
                throw error;
            }
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
        checkUsername: async (username) => {
            const res = await fetch(`${API_URL}/auth/check-username/${username}`);
            if (!res.ok) throw new Error('Failed to check username');
            return res.json();
        },
    },
    notifications: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to delete notification');
            if (res.status === 204) return;
            return res.json();
        },
        markAsRead: async (id) => {
            const res = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to mark notification as read');
            return res.json();
        }
    },
    projects: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/projects`, {
                headers: getHeaders(),
            });
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
        toggleLike: async (projectId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/like`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to toggle like');
            return res.json();
        },
        getComments: async (projectId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/comments`);
            if (!res.ok) throw new Error('Failed to fetch comments');
            return res.json();
        },
        getBotSettings: async (projectId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/bot`);
            if (!res.ok) throw new Error('Failed to fetch bot settings');
            return res.json();
        },
        updateBotSettings: async (projectId, data) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/bot`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const error = new Error(errorData.error || 'Failed to update bot settings');
                error.response = { data: errorData };
                throw error;
            }
            return res.json();
        },
        updateBotAccess: async (projectId, accessList) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/bot/access`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ access_list: accessList }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const error = new Error(errorData.error || 'Failed to update bot access');
                error.response = { data: errorData };
                throw error;
            }
            return res.json();
        },

        delete: async (id) => {
            const res = await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to delete project');
            if (res.status === 204) return;
            return res.json();
        },
        view: async (id) => {
            const res = await fetch(`${API_URL}/projects/${id}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to update view count');
            return res.json();
        },
        addComment: async (projectId, content, parentId = null) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/comments`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content, parentId }),
            });
            if (!res.ok) throw new Error('Failed to add comment');
            return res.json();
        },
        deleteComment: async (commentId) => {
            const res = await fetch(`${API_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to delete comment');
            if (res.status === 204) return;
            return res.json();
        },
        toggleCommentLike: async (commentId) => {
            const res = await fetch(`${API_URL}/comments/${commentId}/like`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to toggle comment like');
            return res.json();
        },
        getMyProjects: async () => {
            const res = await fetch(`${API_URL}/projects/my`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch my projects');
            return res.json();
        },
        update: async (id, projectData) => {
            const res = await fetch(`${API_URL}/projects/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(projectData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update project');
            }
            return res.json();
        },
        getMembers: async (projectId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/members`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        },
        removeMember: async (projectId, userId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/members/${userId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to remove member');
            return res.json();
        }
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
        getMySentRequests: async () => {
            const res = await fetch(`${API_URL}/requests/sent`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch sent requests');
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
        delete: async (requestId) => {
            const res = await fetch(`${API_URL}/requests/${requestId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to delete request');
            if (res.status === 204) return;
            return res.json();
        },
    },
    messages: {
        getProjectMessages: async (projectId) => {
            const res = await fetch(`${API_URL}/messages/project/${projectId}`, {
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
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to send message');
            }
            return res.json();
        },
        edit: async (messageId, content) => {
            const res = await fetch(`${API_URL}/messages/${messageId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to edit message');
            }
            return res.json();
        },
        delete: async (messageId) => {
            const res = await fetch(`${API_URL}/messages/${messageId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete message');
            }
            if (res.status === 204) return;
            return res.json();
        },
        getReadReceipts: async (messageId) => {
            const res = await fetch(`${API_URL}/messages/${messageId}/read-receipts`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch read receipts');
            return res.json();
        }
    },
    chat: {
        getRooms: async () => {
            const res = await fetch(`${API_URL}/chat/rooms`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch chat rooms');
            return res.json();
        },
        getMembers: async (projectId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/members`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        },
        removeMember: async (projectId, userId) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/members/${userId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to remove member');
            return res.json();
        }
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
    users: {
        getProfile: async (userId) => {
            const res = await fetch(`${API_URL}/users/${userId}/profile`, {
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to fetch user profile');
            return res.json();
        },
        deleteAccount: async () => {
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to delete account');
            if (res.status === 204) return;
            return res.json();
        }
    },
    creators: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/creators`);
            if (!res.ok) throw new Error('Failed to fetch creators');
            return res.json();
        }
    },


};
