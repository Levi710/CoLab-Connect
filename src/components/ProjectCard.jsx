import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Star, Users, X, Heart, Share2, Clock, TrendingUp, Send, Trash2, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProjectCard({ project, isSponsored, isOwner, onDelete, onEdit }) {
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
    const [replyTo, setReplyTo] = useState(null); // { id, username }

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
            const parentId = replyTo ? replyTo.id : null;
            const comment = await api.projects.addComment(project.id, newComment, parentId);
            setComments([comment, ...comments]);
            setNewComment('');
            setReplyTo(null);
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.projects.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Failed to delete comment:', err);
            alert('Failed to delete comment');
        }
    };

    const handleCommentLike = async (commentId) => {
        if (!currentUser) return alert('Please login to like comments');
        try {
            const res = await api.projects.toggleCommentLike(commentId);
            setComments(comments.map(c =>
                c.id === commentId ? { ...c, likes_count: res.likes } : c
            ));
        } catch (err) {
            console.error('Failed to like comment:', err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
        try {
            await api.projects.delete(project.id);
            if (onDelete) onDelete(project.id);
        } catch (err) {
            console.error('Failed to delete project:', err);
            alert('Failed to delete project');
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.requests.create({
                projectId: project.id,
                role: 'Collaborator',
                note: note
            });
            alert('Application sent successfully!');
            setShowApplyModal(false);
            setNote('');
        } catch (error) {
            console.error('Failed to apply:', error);
            if (error.message.includes('already requested')) {
                alert('You have already requested to join this project.');
            } else {
                alert(error.message || 'Failed to send application. Please try again.');
            }
        }
    };

    const handleInterestClick = async () => {
        setShowApplyModal(true);
        // Track impression on click
        try {
            await api.projects.view(project.id);
        } catch (err) {
            console.error('Failed to track view', err);
        }
    };

    // Organize comments into threads
    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const CommentItem = ({ comment, isReply = false }) => (
        <div className={`flex gap-3 ${isReply ? 'ml-10 mt-2' : 'mb-4'}`}>
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
                <div className="bg-white/5 rounded-lg rounded-tl-none p-2 text-xs group relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="font-bold text-gray-300 mr-2">{comment.username}</span>
                            <span className="text-gray-400">{comment.content}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleDateString()}</span>
                        <button
                            onClick={() => handleCommentLike(comment.id)}
                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-pink-500 transition-colors"
                        >
                            <Heart className="w-3 h-3" />
                            <span>{comment.likes_count || 0}</span>
                        </button>
                        {isOwner && !isReply && (
                            <button
                                onClick={() => setReplyTo({ id: comment.id, username: comment.username })}
                                className="text-[10px] text-gray-500 hover:text-primary transition-colors"
                            >
                                Reply
                            </button>
                        )}
                    </div>

                    {/* Delete Button for Owner or Comment Author */}
                    {(isOwner || (currentUser && currentUser.id === comment.user_id)) && (
                        <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute top-1 right-1 text-[10px] text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Comment"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Render Replies */}
                {!isReply && getReplies(comment.id).map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className={`bg-[#13161f] rounded-xl overflow-hidden group relative hover:bg-white/5 transition-all duration-300 ${isSponsored ? 'ring-1 ring-primary/20' : ''}`}>
                {isSponsored && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/20 to-transparent px-3 py-1 rounded-bl-xl z-10">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Featured
                        </span>
                    </div>
                )}

                {/* Project Images */}
                {project.images && project.images.length > 0 && (
                    <div className="h-48 w-full overflow-x-auto flex snap-x snap-mandatory custom-scrollbar">
                        {project.images.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`${project.title} preview ${idx + 1}`}
                                className="h-full w-full object-cover flex-shrink-0 snap-center"
                            />
                        ))}
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
                                <>
                                    <button onClick={() => onEdit && onEdit(project)} className="text-gray-500 hover:text-white transition-colors text-xs">
                                        Edit
                                    </button>
                                    <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {project.description}
                    </p>

                    {/* Looking For Section */}
                    {project.looking_for && (
                        <div className="mb-4 bg-white/5 p-3 rounded-lg border border-white/5">
                            <h4 className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">Looking For</h4>
                            <p className="text-xs text-gray-300">{project.looking_for}</p>
                        </div>
                    )}

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
                                onClick={handleInterestClick}
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
                            ) : rootComments.length > 0 ? (
                                rootComments.map(comment => (
                                    <CommentItem key={comment.id} comment={comment} />
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 text-center">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {currentUser && (
                            <div className="flex flex-col gap-2">
                                {replyTo && (
                                    <div className="flex justify-between items-center bg-white/5 px-3 py-1 rounded text-xs text-gray-400">
                                        <span>Replying to <b>{replyTo.username}</b></span>
                                        <button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button>
                                    </div>
                                )}
                                {/* Hide top-level comment input for owner */}
                                {(!isOwner || replyTo) && (
                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
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
