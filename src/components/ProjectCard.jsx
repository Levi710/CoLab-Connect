import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Star, Users, X, Heart, Share2, Clock, TrendingUp, Send } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';


export default function ProjectCard({ project, isFeatured, isSponsored, isOwner }) {
    const { currentUser } = useAuth();
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [note, setNote] = useState('');

    // Social State
    const [likes, setLikes] = useState(project.likes || 0);
    const [isLiked, setIsLiked] = useState(false); // Ideally this comes from API
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    const handleLike = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert('Please login to like projects');

        // Optimistic update
        const prevLikes = likes;
        const prevIsLiked = isLiked;
        setLikes(prev => prevIsLiked ? prev - 1 : prev + 1);
        setIsLiked(!prevIsLiked);

        try {
            const res = await api.projects.toggleLike(project.id);
            setLikes(res.likes);
            setIsLiked(res.liked);
        } catch (err) {
            // Revert
            setLikes(prevLikes);
            setIsLiked(prevIsLiked);
            console.error(err);
        }
    };

    const toggleComments = async (e) => {
        e.preventDefault();
        if (!showComments) {
            setLoadingComments(true);
            try {
                const data = await api.projects.getComments(project.id);
                setComments(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert('Please login to comment');
        if (!newComment.trim()) return;

        try {
            const comment = await api.projects.addComment(project.id, newComment);
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        }
    };

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
                            <button
                                onClick={handleLike}
                                className={`flex items-center space-x-1 hover:text-pink-500 transition-colors group/like ${isLiked ? 'text-pink-500' : ''}`}
                            >
                                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : 'group-hover/like:fill-current'}`} />
                                <span className="text-xs">{likes}</span>
                            </button>
                            <button
                                onClick={toggleComments}
                                className="flex items-center space-x-1 hover:text-primary transition-colors"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-xs">{comments.length || project.comments_count || 0}</span>
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


                {/* Comments Section */}
                {showComments && (
                    <div className="bg-black/20 border-t border-white/5 p-4">
                        <div className="mb-4 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                            {loadingComments ? (
                                <p className="text-xs text-gray-500 text-center">Loading comments...</p>
                            ) : comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                                            {comment.photo_url ? (
                                                <img src={comment.photo_url} alt={comment.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[10px] text-white font-bold">
                                                    {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white/5 rounded-lg rounded-tl-none p-2 text-xs">
                                                <span className="font-bold text-gray-300 mr-2">{comment.username}</span>
                                                <span className="text-gray-400">{comment.content}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-600 ml-1">{new Date(comment.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 text-center">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {currentUser && (
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="p-1.5 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
                                >
                                    <Send className="h-3 w-3" />
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Apply Modal */}
            {
                showApplyModal && (
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
                )
            }
        </>
    );
}
