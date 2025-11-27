import React, { useState, useEffect } from 'react';
import { BarChart, Users, ThumbsUp, MessageSquare, Check, X, TrendingUp, Lock, Zap } from 'lucide-react';
import { api } from '../api';

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
    const [activeTab, setActiveTab] = useState('projects');
    const [isPremium, setIsPremium] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [myProjects, setMyProjects] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [user, projectsData, requestsData] = await Promise.all([
                    api.auth.me(),
                    api.projects.getMyProjects(),
                    api.requests.getMyProjectRequests()
                ]);
                setIsPremium(user.is_premium);
                setMyProjects(projectsData);
                setRequests(requestsData);

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

    if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
                {!isPremium && (
                    <button
                        onClick={() => setShowPremiumModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
                    >
                        Upgrade to Premium
                    </button>
                )}
                {isPremium && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <Zap className="h-4 w-4 mr-1 fill-current" /> Premium Member
                    </span>
                )}
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                            <ThumbsUp className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Likes</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {myProjects.reduce((acc, curr) => acc + (curr.likes || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Impressions</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {myProjects.reduce((acc, curr) => acc + (curr.impressions || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                            <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Insights (Premium Only) */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" /> AI Advanced Insights
                    </h2>
                    {!isPremium && <Lock className="h-5 w-5 text-gray-400" />}
                </div>

                {isPremium && aiAnalysis ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Project Growth Trend</h3>
                                <div className="h-40 flex items-end justify-between space-x-2 px-2 bg-gray-50 rounded p-4">
                                    {aiAnalysis.projectGrowth.map((h, i) => (
                                        <div key={i} className="w-full bg-indigo-500 rounded-t-sm relative group" style={{ height: `${h * 5}%` }}>
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                                                {h} new views
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Audience Demographics</h3>
                                <div className="space-y-3 bg-gray-50 rounded p-4">
                                    {Object.entries(aiAnalysis.audienceDemographics).map(([role, percent]) => (
                                        <div key={role}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{role}</span>
                                                <span>{percent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">AI Suggestions</h3>
                            <ul className="space-y-2">
                                {aiAnalysis.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-600 bg-indigo-50 p-3 rounded-md border border-indigo-100">
                                        <Zap className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : isPremium && loadingAi ? (
                    <div className="text-center py-10 text-gray-500">Generating AI Analysis...</div>
                ) : (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <p className="text-gray-600 mb-4 font-medium">Unlock detailed growth charts and AI-powered suggestions.</p>
                        <button
                            onClick={() => setShowPremiumModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Upgrade to Premium
                        </button>
                    </div>
                )}
                {/* Background placeholder for non-premium */}
                {!isPremium && (
                    <div className="h-64 flex items-end justify-between space-x-2 px-4 opacity-20">
                        {[30, 45, 35, 60, 55, 70, 85].map((h, i) => (
                            <div key={i} className="w-full bg-gray-300 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`${activeTab === 'projects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        My Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`${activeTab === 'inbox' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Inbox <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">{requests.length}</span>
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'projects' ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {myProjects.length > 0 ? myProjects.map((project) => (
                            <li key={project.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{project.title}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {project.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                <ThumbsUp className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {project.likes} Likes
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                {project.impressions} Impressions
                                            </p>
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
                        <div key={request.id} className="bg-white shadow sm:rounded-lg p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {request.user_name} <span className="text-gray-500 text-sm font-normal">wants to join</span> {request.project_title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">Role: {request.role}</p>
                                    <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                        "{request.note}"
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                        <Check className="h-5 w-5" />
                                    </button>
                                    <button className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow">
                            No pending requests.
                        </div>
                    )}
                </div>
            )}

            {/* Premium Modal */}
            {showPremiumModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPremiumModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => setShowPremiumModal(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Upgrade to Premium
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Get access to advanced analytics, boosted project visibility, and more.
                                        </p>
                                        <ul className="mt-4 space-y-2 text-left text-sm text-gray-600">
                                            <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Advanced AI Insights & Growth Charts</li>
                                            <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Sponsored Project Status (Top of Feed)</li>
                                            <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Priority Support</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-base font-medium text-white hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleUpgrade}
                                >
                                    Upgrade Now (₹1)
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowPremiumModal(false)}
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
