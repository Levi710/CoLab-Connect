import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Star, Users, X, Heart, Share2, Clock, TrendingUp } from 'lucide-react';

export default function ProjectCard({ project, isFeatured, isSponsored, isOwner }) {
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [note, setNote] = useState('');

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            const { api } = await import('../api');
            await api.requests.create({
                projectId: project.id,
                role: 'Collaborator', // Default role or add a selector
                note: note
            });
            alert('Application sent successfully!');
            setShowApplyModal(false);
            setNote('');
        } catch (error) {
            console.error('Failed to apply:', error);
            alert('Failed to send application. Please try again.');
        }
    };

    return (
        <>
            <div className={`bg-[#13161f] rounded-xl overflow-hidden group relative hover:bg-white/5 transition-all duration-300 ${isSponsored ? 'ring-1 ring-primary/20' : ''}`}>
                {isSponsored && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/20 to-transparent px-3 py-1 rounded-bl-xl">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Featured
                        </span>
                    </div>
                )}

                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold shadow-inner border border-white/5">
                                {project.owner_name ? project.owner_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-100 group-hover:text-primary transition-colors line-clamp-1">{project.title}</h3>
                                <p className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {isOwner && (
                                <button className="text-gray-500 hover:text-white transition-colors">
                                    {/* Edit icon placeholder */}
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                        {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-gray-300 border border-white/5">
                            {project.category}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-gray-300 border border-white/5">
                            {project.status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex space-x-4 text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-pink-500 transition-colors group/like">
                                <Heart className="h-4 w-4 group-hover/like:fill-current" />
                                <span className="text-xs">{project.likes || 0}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-xs">{project.comments_count || 0}</span>
                            </button>
                        </div>

                        {isOwner ? (
                            <span className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                                Your Project
                            </span>
                        ) : (
                            <button
                                onClick={() => setShowApplyModal(true)}
                                className="text-sm font-medium text-primary hover:text-white transition-colors flex items-center gap-1 group/btn"
                            >
                                I'm Interested
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#13161f] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 transform transition-all">
                        <h3 className="text-xl font-bold text-white mb-2">Apply to {project.title}</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Let the project owner know why you'd be a great fit.
                        </p>

                        <textarea
                            className="w-full bg-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 resize-none h-32"
                            placeholder="I have experience with..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                            >
                                Send Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
