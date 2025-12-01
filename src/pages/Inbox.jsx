import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MessageSquare, Trash2, Bell, UserPlus } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Inbox() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [requestsData, notificationsData] = await Promise.all([
                api.requests.getMyProjectRequests(),
                api.notifications.getAll()
            ]);
            setRequests(requestsData);
            setNotifications(notificationsData);

            // Mark unread notifications as read
            const unreadIds = notificationsData.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
                // We can do this in parallel or one by one. Since we don't have a bulk endpoint, we'll do one by one for now.
                // Ideally we should add a bulk endpoint, but for now this works.
                unreadIds.forEach(id => api.notifications.markAsRead(id).catch(console.error));
            }
        } catch (err) {
            console.error('Failed to fetch inbox data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 10 seconds for real-time updates
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleRequestStatus = async (requestId, status) => {
        try {
            await api.requests.updateStatus(requestId, status);
            // Update local state
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status } : req
            ));
            addToast(`Request ${status}`, 'success');
        } catch (error) {
            console.error('Failed to update status:', error);
            addToast('Failed to update request status', 'error');
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        try {
            await api.requests.delete(requestId);
            setRequests(requests.filter(r => r.id !== requestId));
            addToast('Request deleted', 'success');
        } catch (error) {
            console.error('Failed to delete request:', error);
            addToast('Failed to delete request', 'error');
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await api.notifications.delete(id);
            setNotifications(notifications.filter(n => n.id !== id));
            addToast('Notification deleted', 'success');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            addToast('Failed to delete notification', 'error');
        }
    };

    if (loading) return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" /> Inbox
            </h1>
            <div className="space-y-8">
                <SkeletonLoader count={3} />
                <SkeletonLoader count={3} />
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" /> Inbox
            </h1>

            <div className="space-y-8">
                {/* Requests Section */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-secondary" /> Project Requests
                    </h2>
                    {requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div key={request.id} className="bg-[#13161f] shadow-lg sm:rounded-lg p-6 border border-white/5 transition-all hover:border-white/10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg leading-6 font-medium text-white">
                                                <span className="font-bold text-primary">{request.user_name}</span> <span className="text-gray-400 text-sm font-normal">wants to join</span> <span className="font-bold text-white">{request.project_title}</span>
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-400">Role: <span className="text-gray-300">{request.role}</span></p>
                                            <div className="mt-3 text-sm text-gray-300 bg-white/5 p-3 rounded border border-white/10 italic">
                                                "{request.note}"
                                            </div>
                                            <div className="mt-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                    request.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    }`}>
                                                    {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 flex-shrink-0">
                                            {request.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleRequestStatus(request.id, 'accepted')}
                                                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                                        title="Accept"
                                                    >
                                                        <Check className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestStatus(request.id, 'rejected')}
                                                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                            {request.status === 'accepted' && (
                                                <button
                                                    onClick={() => navigate(`/chat/${request.project_id}`)}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" /> Chat
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteRequest(request.id)}
                                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600/80 hover:bg-red-700 focus:outline-none transition-colors"
                                                title="Delete Request"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-[#13161f] rounded-lg border border-white/5 border-dashed">
                            No pending requests.
                        </div>
                    )}
                </section>

                {/* Notifications Section */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-amber-400" /> Notifications
                    </h2>
                    {notifications.length > 0 ? (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div key={notification.id} className="bg-[#13161f] shadow-lg sm:rounded-lg p-6 border border-white/5 flex justify-between items-center transition-all hover:bg-white/5">
                                    <div>
                                        <p className="text-gray-300 font-medium">{notification.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 focus:outline-none transition-colors"
                                        title="Delete Notification"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-[#13161f] rounded-lg border border-white/5 border-dashed">
                            No new notifications.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
