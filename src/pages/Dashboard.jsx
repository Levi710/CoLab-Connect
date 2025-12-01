import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Users, ThumbsUp, MessageSquare, TrendingUp, Lock, Zap, X } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('projects');
    const [isPremium, setIsPremium] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [myProjects, setMyProjects] = useState([]);

    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [user, projectsData] = await Promise.all([
                    api.auth.me(),
                    api.projects.getMyProjects()
                ]);
                setIsPremium(user.is_premium);
                setMyProjects(projectsData);

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
            addToast('Project updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update project:', error);
            addToast(error.message || 'Failed to update project', 'error');
        }
    };

    const handleDeleteProject = (projectId) => {
        setMyProjects(prev => prev.filter(p => p.id !== projectId));
    };

    if (loading) return (
        <div className="container mx-auto px-4 py-8 animate-pulse">
            <div className="h-8 w-64 bg-white/10 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[#13161f] p-6 rounded-lg border border-white/5 h-32"></div>
                ))}
            </div>
            <div className="h-64 bg-[#13161f] rounded-lg border border-white/5 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[#13161f] rounded-xl h-64 border border-white/5"></div>
                ))}
            </div>
        </div>
    );

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
                <div className="bg-[#13161f] p-6 rounded-lg shadow-lg border border-white/5 relative">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
                            <BarChart className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Total Impressions</p>
                            <p className={`text-2xl font-semibold text-white ${!isPremium ? 'blur-sm' : ''}`}>
                                {currentUser?.profile_views || 0}
                            </p>
                        </div>
                    </div>
                    {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark/30 backdrop-blur-[2px] rounded-lg">
                            <Lock className="h-6 w-6 text-gray-400" />
                        </div>
                    )}
                </div>
                {/* Removed Pending Requests Card */}
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
                                <div className="h-40 flex items-end justify-between space-x-2 px-2 bg-dark rounded p-4 border border-white/5 overflow-x-auto custom-scrollbar">
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
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.length > 0 ? myProjects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        isOwner={true}
                        onDelete={handleDeleteProject}
                        onEdit={handleEditClick}
                    />
                )) : (
                    <div className="col-span-full p-6 text-center text-gray-500 bg-[#13161f] rounded-lg border border-white/5">
                        You haven't created any projects yet.
                    </div>
                )}
            </div>

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
