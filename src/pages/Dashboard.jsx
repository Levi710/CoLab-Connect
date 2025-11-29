import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Users, ThumbsUp, MessageSquare, Check, X, TrendingUp, Lock, Zap, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('projects');
    const [isPremium, setIsPremium] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [myProjects, setMyProjects] = useState([]);
    const [requests, setRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [user, projectsData, requestsData, notificationsData] = await Promise.all([
                    api.auth.me(),
                    api.projects.getMyProjects(),
                    api.requests.getMyProjectRequests(),
                    api.notifications.getAll()
                ]);
                setIsPremium(user.is_premium);
                setMyProjects(projectsData);
                setRequests(requestsData);
                setNotifications(notificationsData);

                if (user.is_premium) {
                    fetchAiAnalysis();
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchAiAnalysis = async () => {
        setLoadingAi(true);
        try {
            const data = await api.ai.getAnalysis();
            setAiAnalysis(data);
        } catch (err) {
            console.error('Failed to fetch AI analysis:', err);
        } finally {
            setLoadingAi(false);
        }
    };

    const handleUpgrade = () => {
        window.open('https://rzp.io/rzp/CmYvunI', '_blank');
    };

    const handleRequestStatus = async (requestId, status) => {
        try {
            await api.requests.updateStatus(requestId, status);
            // Update local state
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status } : req
            ));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update request status');
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        try {
            await api.requests.delete(requestId);
            setRequests(requests.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Failed to delete request:', error);
            alert('Failed to delete request');
        }
    };

    const handleEditClick = (project) => {
        setEditingProject(project);
        setEditFormData({
            title: project.title,
            description: project.description,
            category: project.category,
            status: project.status,
            lookingFor: project.looking_for,
            memberLimit: project.member_limit
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const updated = await api.projects.update(editingProject.id, editFormData);
            setMyProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
            setEditingProject(null);
            alert('Project updated successfully!');
        } catch (error) {
            console.error('Failed to update project:', error);
            alert(error.message || 'Failed to update project');
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await api.notifications.delete(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');

    if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">
                    {currentUser ? `${currentUser.username}'s Dashboard` : 'Dashboard'}
                </h1>
                {!isPremium && (
                    <button
                        onClick={() => setShowPremiumModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-secondary to-primary hover:shadow-lg hover:shadow-primary/25 transition-all shadow-md"
                    >
                        Upgrade to Premium
                    </button>
                )}
                {isPremium && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                        <Zap className="h-4 w-4 mr-1 fill-current" /> Premium Member
                    </span>
                )}
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#13161f] p-6 rounded-lg shadow-lg border border-white/5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <ThumbsUp className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Total Likes</p>
                            <p className="text-2xl font-semibold text-white">
                                {myProjects.reduce((acc, curr) => acc + (curr.likes || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#13161f] p-6 rounded-lg shadow-lg border border-white/5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-500/10 text-green-400">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Total Comments</p>
                            <p className="text-2xl font-semibold text-white">
                                {myProjects.reduce((acc, curr) => acc + parseInt(curr.comments_count || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#13161f] p-6 rounded-lg shadow-lg border border-white/5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Pending Requests</p>
                            <p className="text-2xl font-semibold text-white">{pendingRequests.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Insights (Premium Only) */}
            <div className="mb-8 bg-[#13161f] p-6 rounded-lg shadow-lg border border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-primary" /> AI Advanced Insights
                    </h2>
                    {!isPremium && <Lock className="h-5 w-5 text-gray-500" />}
                </div>

                {isPremium && aiAnalysis ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Project Growth Trend</h3>
                                <div className="h-40 flex items-end justify-between space-x-2 px-2 bg-dark rounded p-4 border border-white/5">
                                    {aiAnalysis.projectGrowth.map((h, i) => (
                                        <div key={i} className="w-full bg-primary rounded-t-sm relative group" style={{ height: `${h * 5}%` }}>
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-dark text-xs py-1 px-2 rounded z-10 font-bold">
                                                {h} new views
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Audience Demographics</h3>
                                <div className="space-y-3 bg-dark rounded p-4 border border-white/5">
                                    {Object.entries(aiAnalysis.audienceDemographics).map(([role, percent]) => (
                                        <div key={role}>
                                            <div className="flex justify-between text-xs mb-1 text-gray-300">
                                                <span>{role}</span>
                                                <span>{percent}%</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div className="bg-secondary h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-2">AI Suggestions</h3>
                            <ul className="space-y-2">
                                {aiAnalysis.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-300 bg-primary/5 p-3 rounded-md border border-primary/10">
                                        <Zap className="h-4 w-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : isPremium && loadingAi ? (
                    <div className="text-center py-10 text-gray-400">Generating AI Analysis...</div>
                ) : (
                    <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <p className="text-gray-300 mb-4 font-medium">Unlock detailed growth charts and AI-powered suggestions.</p>
                        <button
                            onClick={() => setShowPremiumModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
                        >
                            Upgrade to Premium
                        </button>
                    </div>
                )}
                {/* Background placeholder for non-premium */}
                {!isPremium && (
                    <div className="h-64 flex items-end justify-between space-x-2 px-4 opacity-10">
                        {[30, 45, 35, 60, 55, 70, 85].map((h, i) => (
                            <div key={i} className="w-full bg-gray-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`${activeTab === 'projects' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        My Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`${activeTab === 'inbox' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Inbox <span className="ml-2 bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-xs border border-red-500/20">{pendingRequests.length + notifications.length}</span>
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'projects' ? (
                <div className="bg-[#13161f] shadow-lg overflow-hidden sm:rounded-md border border-white/5">
                    <ul className="divide-y divide-white/5">
                        {myProjects.length > 0 ? myProjects.map((project) => (
                            <li key={project.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-primary truncate">{project.title}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                                {project.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-400">
                                                <ThumbsUp className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                                {project.likes} Likes
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0 sm:ml-6">
                                                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                                {project.impressions} Impressions
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0 sm:ml-6">
                                                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                                {project.impressions} Impressions
                                            </p>
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(project); }}
                                                className="text-sm text-primary hover:text-white underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )) : (
                            <div className="p-6 text-center text-gray-500">
                                You haven't created any projects yet.
                            </div>
                        )}
                    </ul>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.length > 0 ? requests.map((request) => (
                        <div key={request.id} className="bg-[#13161f] shadow-lg sm:rounded-lg p-6 border border-white/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-white">
                                        {request.user_name} <span className="text-gray-500 text-sm font-normal">wants to join</span> {request.project_title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-400">Role: {request.role}</p>
                                    <div className="mt-3 text-sm text-gray-300 bg-white/5 p-3 rounded border border-white/10">
                                        "{request.note}"
                                    </div>
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            request.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {request.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleRequestStatus(request.id, 'accepted')}
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                title="Accept"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleRequestStatus(request.id, 'rejected')}
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                title="Reject"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                    {request.status === 'accepted' && (
                                        <button
                                            onClick={() => navigate(`/chat/${request.project_id}`)}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" /> Chat
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteRequest(request.id)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                        title="Delete Request"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-6 text-center text-gray-500 bg-[#13161f] rounded-lg shadow border border-white/5">
                            No pending requests.
                        </div>
                    )}

                    {/* Notifications Section */}
                    <h3 className="text-lg font-bold text-white mt-8 mb-4">Notifications</h3>
                    {notifications.length > 0 ? (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div key={notification.id} className="bg-[#13161f] shadow-lg sm:rounded-lg p-6 border border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-300">{notification.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                        title="Delete Notification"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 bg-[#13161f] rounded-lg shadow border border-white/5">
                            No new notifications.
                        </div>
                    )}
                </div>
            )}

            {/* Premium Modal */}
            {showPremiumModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowPremiumModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-[#13161f] rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl border border-white/10 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-transparent rounded-md text-gray-400 hover:text-white focus:outline-none"
                                    onClick={() => setShowPremiumModal(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-secondary to-primary text-base font-medium text-white hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleUpgrade}
                                >
                                    Upgrade Now (₹1)
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-white/10 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-gray-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowPremiumModal(false)}
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {editingProject && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm transition-opacity" onClick={() => setEditingProject(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-[#13161f] rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl border border-white/10 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <h3 className="text-lg leading-6 font-bold text-white mb-4">Edit Project</h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Title</label>
                                    <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} className="mt-1 block w-full bg-dark border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Description</label>
                                    <textarea name="description" rows="3" value={editFormData.description} onChange={handleEditChange} className="mt-1 block w-full bg-dark border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Category</label>
                                        <select name="category" value={editFormData.category} onChange={handleEditChange} className="mt-1 block w-full bg-dark border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                            <option value="Tech">Tech</option>
                                            <option value="Social Impact">Social Impact</option>
                                            <option value="Art">Art</option>
                                            <option value="Education">Education</option>
                                            <option value="Business">Business</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Status</label>
                                        <select name="status" value={editFormData.status} onChange={handleEditChange} className="mt-1 block w-full bg-dark border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                            <option value="Idea">Just an Idea</option>
                                            <option value="Prototype">Prototype Ready</option>
                                            <option value="In Progress">In Development</option>
                                            <option value="Launched">Launched</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Looking For</label>
                                    <input type="text" name="lookingFor" value={editFormData.lookingFor} onChange={handleEditChange} className="mt-1 block w-full bg-dark border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm">
                                        Save Changes
                                    </button>
                                    <button type="button" onClick={() => setEditingProject(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-white/10 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-gray-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
