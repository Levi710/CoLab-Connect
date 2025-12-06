import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Star, Users, X, Heart, Share2, Clock, TrendingUp, Send, Trash2, Image as ImageIcon, Briefcase, Tag } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Poll from './Poll';

export default function ProjectCard({ project, isSponsored, isOwner, onDelete, onEdit }) {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [note, setNote] = useState('');

    // Social State
    const [likes, setLikes] = useState(project.likes_count || project.likes || 0);
    const [isLiked, setIsLiked] = useState(project.is_liked || false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null); // { id, username }

    useEffect(() => {
        setIsLiked(project.is_liked || false);
        setLikes(project.likes_count || project.likes || 0);
    }, [project.is_liked, project.likes, project.likes_count]);

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return addToast('Please login to like projects', 'info');

        // Optimistic update
        const previousIsLiked = isLiked;
        const previousLikes = likes;
        const newIsLiked = !isLiked;
        const newLikes = newIsLiked ? likes + 1 : likes - 1;

        setIsLiked(newIsLiked);
        setLikes(newLikes);

        try {
            await api.projects.toggleLike(project.id);
        } catch (err) {
            // Rollback state if API call fails
            setIsLiked(previousIsLiked);
            setLikes(previousLikes);
            console.error("Like failed", err);
            addToast('Failed to update like', 'error');
        }
    };

    const toggleComments = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
            addToast('Please login to view comments', 'info');
            return;
        }
        if (!showComments) {
            setLoadingComments(true);
            try {
                const data = await api.projects.getComments(project.id);
                setComments(data);
            } catch (err) {
                console.error(err);
                addToast('Failed to load comments', 'error');
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!currentUser) return addToast('Please login to comment', 'info');
        if (!newComment.trim()) return;

        try {
            const parentId = replyTo ? replyTo.id : null;
            const comment = await api.projects.addComment(project.id, newComment, parentId);
            setComments([comment, ...comments]);
            setNewComment('');
            setReplyTo(null);
            addToast('Comment added', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to post comment', 'error');
        }
    };

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const handleDeleteComment = (e, commentId) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, id: commentId });
    };

    const confirmDeleteComment = async (commentId) => {
        try {
            await api.projects.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
            addToast('Comment deleted', 'success');
            setDeleteModal({ isOpen: false, id: null });
        } catch (err) {
            console.error('Failed to delete comment:', err);
            addToast('Failed to delete comment', 'error');
        }
    };

    const handleCommentLike = async (commentId) => {
        if (!currentUser) return addToast('Please login to like comments', 'info');

        // Optimistic Update
        const originalComments = [...comments];
        setComments(comments.map(c => {
            if (c.id === commentId) {
                const isLiked = c.is_liked;
                return {
                    ...c,
                    is_liked: !isLiked,
                    likes_count: isLiked ? (c.likes_count - 1) : (c.likes_count + 1)
                };
            }
            return c;
        }));

        try {
            await api.projects.toggleCommentLike(commentId);
        } catch (err) {
            console.error('Failed to like comment:', err);
            addToast('Failed to like comment', 'error');
            // Rollback
            setComments(originalComments);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.projects.delete(project.id);
            if (onDelete) onDelete(project.id);
            addToast('Project deleted', 'success');
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Failed to delete project:', err);
            addToast('Failed to delete project', 'error');
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!note.trim()) {
            return addToast('Please add a message to your application.', 'info');
        }
        try {
            await api.requests.create({
                projectId: project.id,
                role: 'Collaborator',
                note: note
            });
            addToast('Application sent successfully!', 'success');
            setShowApplyModal(false);
            setNote('');
        } catch (error) {
            console.error('Failed to apply:', error);
            if (error.message.includes('already requested')) {
                addToast('You have already requested to join this project.', 'info');
            } else {
                addToast(error.message || 'Failed to send application. Please try again.', 'error');
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
            <Link to={`/profile/${comment.user_id}`} className="h-6 w-6 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity">
                {comment.photo_url ? (
                    <img src={comment.photo_url} alt={comment.username} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-white font-bold">
                        {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                )}
            </Link>
            <div className="flex-1">
                <div className="bg-white/5 rounded-lg rounded-tl-none p-2 text-xs group relative">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                            <Link to={`/profile/${comment.user_id}`} className="font-bold text-gray-300 mr-2 hover:text-primary transition-colors">{comment.username}</Link>
                            <span className="text-gray-400 break-words">{comment.content}</span>
                        </div>

                        {/* Actions Container */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-start mt-0.5">
                            {/* Reply Button for Owner */}
                            {isOwner && !isReply && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setReplyTo({ id: comment.id, username: comment.username }); }}
                                    className="text-[10px] text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Reply"
                                >
                                    Reply
                                </button>
                            )}

                            {/* Delete Button */}
                            {(isOwner || (currentUser && currentUser.id === comment.user_id && (new Date() - new Date(comment.created_at) < 10 * 60 * 1000))) && (
                                <button
                                    onClick={(e) => handleDeleteComment(e, comment.id)}
                                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Comment"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}

                            {/* Like Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCommentLike(comment.id); }}
                                className={`flex items-center gap-1 transition-colors ${comment.is_liked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                            >
                                <Heart className={`w-3 h-3 ${comment.is_liked ? 'fill-pink-500' : ''}`} />
                                <span className="text-[10px]">{comment.likes_count || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>
                <span className="text-[10px] text-gray-600 ml-1">{new Date(comment.created_at).toLocaleDateString()}</span>

                {/* Render Replies */}
                {!isReply && getReplies(comment.id).map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
            </div>
        </div>
    );



    const handleCardClick = (e) => {
        if (showComments) return; // Disable click when comments are open

        if (!currentUser) {
            e.preventDefault();
            e.stopPropagation();
            addToast('Please login to view project details', 'info');
            return;
        }
        setShowDetailsModal(true);
    };

    const handleLinkClick = (e) => {
        if (!currentUser) {
            e.preventDefault();
            e.stopPropagation();
            addToast('Please login to view profile', 'info');
        }
    };

    return (
        <>
            <div
                className={`bg-[#13161f] rounded-xl overflow-hidden group relative transition-all duration-300 h-[500px] flex flex-col ${isSponsored ? 'ring-1 ring-primary/20' : ''} ${showComments ? '' : 'hover:bg-white/5 cursor-pointer'}`}
                onClick={handleCardClick}
            >
                {isSponsored && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/20 to-transparent px-3 py-1 rounded-bl-xl z-10">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Featured
                        </span>
                    </div>
                )}

                {/* Project Images */}
                {project.images && project.images.length > 0 && (
                    <div className="h-48 w-full overflow-x-auto flex snap-x snap-mandatory custom-scrollbar shrink-0">
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

                <div className="p-6 flex flex-col flex-1 min-h-0">
                    <div className="flex justify-between items-start mb-4 shrink-0">
                        <div className="flex items-center space-x-3 min-w-0">
                            <Link to={`/profile/${project.owner_public_id || project.user_id}`} className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold shadow-inner border border-white/5 overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleLinkClick(e); }}>
                                {project.owner_photo ? (
                                    <img src={project.owner_photo} alt={project.owner_name} className="h-full w-full object-cover" />
                                ) : (
                                    <span>{project.owner_name ? project.owner_name.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link to={`/profile/${project.owner_public_id || project.user_id}`} className="block" onClick={(e) => { e.stopPropagation(); handleLinkClick(e); }}>
                                    <h3 className="text-lg font-bold text-gray-100 group-hover:text-primary transition-colors line-clamp-1 break-words">{project.title}</h3>
                                </Link>
                                <p className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isOwner && (
                                <>
                                    <button onClick={() => onEdit && onEdit(project)} className="text-gray-500 hover:text-white transition-colors text-xs">
                                        Edit
                                    </button>
                                    <button onClick={handleDeleteClick} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed shrink-0">
                        {project.description}
                    </p>

                    {/* Looking For Section */}
                    {project.looking_for && (
                        <div className="mb-4 bg-white/5 p-3 rounded-lg border border-white/5 shrink-0 max-h-[80px] overflow-hidden">
                            <h4 className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">Looking For</h4>
                            <p className="text-xs text-gray-300 line-clamp-2">{project.looking_for}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-6 shrink-0 overflow-hidden h-[32px]">
                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-gray-300 border border-white/5 whitespace-nowrap">
                            {project.category}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-gray-300 border border-white/5 whitespace-nowrap">
                            {project.status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-4 text-gray-500">
                            <button
                                onClick={handleLike}
                                className={`flex items-center space-x-1 hover:text-pink-500 transition-colors group/like ${isLiked ? 'text-pink-500' : ''}`}
                            >
                                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : 'group-hover/like:fill-current'}`} />
                                <span className="text-xs">{likes || 0}</span>
                            </button>
                            <button
                                onClick={toggleComments}
                                className="flex items-center space-x-1 hover:text-primary transition-colors"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-xs">{comments.length || project.comments_count || 0}</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {isOwner ? (
                                <span className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                                    Your Project
                                </span>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!currentUser) {
                                            addToast('Please login to express interest', 'info');
                                            return;
                                        }
                                        handleInterestClick();
                                    }}
                                    className="text-sm font-medium text-primary hover:text-white transition-colors flex items-center gap-1 group/btn"
                                >
                                    I'm Interested
                                </button>
                            )}
                            {!showComments && (
                                <button
                                    onClick={() => setShowDetailsModal(true)}
                                    className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    View Details
                                </button>
                            )}
                        </div>
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
                                    <form onSubmit={handleAddComment} className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

            {/* View Project Details Modal */}
            {showDetailsModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-[#13161f] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Project Images Carousel */}
                        {project.images && project.images.length > 0 && (
                            <div className="h-64 w-full overflow-x-auto flex snap-x snap-mandatory custom-scrollbar bg-black/50">
                                {project.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`${project.title} preview ${idx + 1}`}
                                        className="h-full w-full object-contain flex-shrink-0 snap-center"
                                    />
                                ))}
                            </div>
                        )}

                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Link to={`/profile/${project.user_id}`} className="flex-shrink-0">
                                    {project.owner_photo ? (
                                        <img src={project.owner_photo} alt={project.owner_name} className="h-12 w-12 rounded-full object-cover border-2 border-primary/20" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-lg border border-white/10">
                                            {project.owner_name ? project.owner_name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-white leading-tight">{project.title}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        <span className="font-medium text-primary">@{project.owner_name || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none mb-8">
                                <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{project.description}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-wide flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> Looking For
                                    </h4>
                                    <p className="text-sm text-gray-200">{project.looking_for || 'Collaborators'}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-wide flex items-center gap-2">
                                        <Tag className="w-4 h-4" /> Category
                                    </h4>
                                    <p className="text-sm text-gray-200">{project.category}</p>
                                </div>

                                {/* Poll Section */}
                                {project.polls && project.polls.length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-primary rounded-full"></div>
                                            Active Polls
                                        </h4>
                                        <Poll pollData={project.polls} />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-white/10">
                                {!isOwner && (
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            handleInterestClick();
                                        }}
                                        className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        I'm Interested <Send className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-[#13161f] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 transform transition-all" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Project?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to delete "{project.title}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Comment Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal({ isOpen: false, id: null })}>
                    <div className="bg-[#13161f] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 transform transition-all" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Comment?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                                className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmDeleteComment(deleteModal.id)}
                                className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete Comment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
