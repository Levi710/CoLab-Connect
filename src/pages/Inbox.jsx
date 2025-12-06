import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MessageSquare, Trash2, Bell, UserPlus, Send, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';

export default function Inbox() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null });

    const fetchData = async () => {
        try {
            const [requestsData, sentRequestsData, notificationsData] = await Promise.all([
                api.requests.getMyProjectRequests(),
                api.requests.getMySentRequests(),
                api.notifications.getAll()
            ]);
            console.log('Inbox Data:', { requestsData, sentRequestsData, notificationsData });
            setRequests(requestsData);
            setSentRequests(sentRequestsData);
            setNotifications(notificationsData);

            // Mark unread notifications as read
            const unreadIds = notificationsData.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
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
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleRequestStatus = async (requestId, status) => {
        try {
            await api.requests.updateStatus(requestId, status);
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status } : req
            ));
            addToast(`Request ${status}`, 'success');
        } catch (error) {
            console.error('Failed to update status:', error);
            if (error.message === 'Project is full') {
                addToast('Max team size already reached', 'error');
            } else {
                addToast(error.message || 'Failed to update request status', 'error');
            }
        }
    };

    const openDeleteModal = (type, id) => {
        setDeleteModal({ isOpen: true, type, id });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, type: null, id: null });
    };

    const confirmDelete = async () => {
        const { type, id } = deleteModal;
        try {
            if (type === 'request') {
                await api.requests.delete(id);
                setRequests(requests.filter(r => r.id !== id));
                addToast('Request deleted', 'success');
            } else if (type === 'revoke') {
                await api.requests.delete(id);
                setSentRequests(sentRequests.filter(r => r.id !== id));
                addToast('Request revoked', 'success');
            } else if (type === 'notification') {
                await api.notifications.delete(id);
                setNotifications(notifications.filter(n => n.id !== id));
                addToast('Notification deleted', 'success');
            }
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
            addToast(`Failed to delete ${type}`, 'error');
        } finally {
            closeDeleteModal();
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-secondary" /> Project Requests
                        </h2>
                        <div className="flex space-x-2 bg-[#13161f] p-1 rounded-lg border border-white/10">
                            <button
                                onClick={() => setActiveTab('received')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'received'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Received
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'sent'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Sent
                            </button>
                        </div>
                    </div>

                    {activeTab === 'received' ? (
                        requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map((request) => (
                                    <div key={request.id} className="bg-[#13161f] shadow-lg sm:rounded-lg p-6 border border-white/5 transition-all hover:border-white/10">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <img
                                                        src={request.user_photo || `https://ui-avatars.com/api/?name=${request.user_name}&background=random`}
                                                        alt={request.user_name}
                                                        className="h-10 w-10 rounded-full object-cover border border-white/10"
                                                    />
                                                    <div>
                                                        <h3 className="text-lg leading-6 font-medium text-white">
                                                            <span className="font-bold text-primary">{request.user_name}</span> <span className="text-gray-400 text-sm font-normal">wants to join</span> <span className="font-bold text-white">{request.project_title}</span>
                                                        </h3>
                                                        <p className="text-sm text-gray-400">Role: <span className="text-gray-300">{request.role}</span></p>
                                                    </div>
                                                </div>
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
                                                    onClick={() => openDeleteModal('request', request.id)}
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
                                No pending requests received.
                            </div>
                        )
                    ) : (
                        sentRequests.length > 0 ? (
                            <div className="space-y-4">
                                {sentRequests.map((request) => (
                                    <div key={request.id} className="bg-[#13161f] shadow-lg sm:rounded-lg p-6 border border-white/5 transition-all hover:border-white/10">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg leading-6 font-medium text-white">
                                                    <span className="text-gray-400">You requested to join</span> <span className="font-bold text-primary">{request.project_title}</span>
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
                                                    <button
                                                        onClick={() => openDeleteModal('revoke', request.id)}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none transition-colors"
                                                        title="Revoke Request"
                                                    >
                                                        <X className="h-4 w-4 mr-2" /> Revoke
                                                    </button>
                                                )}
                                                {request.status !== 'pending' && (
                                                    <button
                                                        onClick={() => openDeleteModal('revoke', request.id)}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600/80 hover:bg-red-700 focus:outline-none transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 bg-[#13161f] rounded-lg border border-white/5 border-dashed">
                                You haven't sent any requests yet.
                            </div>
                        )
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
                                        onClick={() => openDeleteModal('notification', notification.id)}
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

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                title={
                    deleteModal.type === 'revoke' ? 'Revoke Request' :
                        deleteModal.type === 'request' ? 'Delete Request' :
                            'Delete Notification'
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 p-4 rounded-lg border border-amber-400/20">
                        <AlertCircle className="h-6 w-6 flex-shrink-0" />
                        <p className="text-sm">
                            {deleteModal.type === 'revoke'
                                ? 'Are you sure you want to revoke this request? This action cannot be undone.'
                                : 'Are you sure you want to delete this item? This action cannot be undone.'}
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={closeDeleteModal}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                            {deleteModal.type === 'revoke' ? 'Revoke' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
