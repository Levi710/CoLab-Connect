import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, User, Users, MoreVertical, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
    const { requestId } = useParams(); // requestId here acts as projectId or 'all'
    const { currentUser } = useAuth();

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [members, setMembers] = useState([]);
    const [isPremium, setIsPremium] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const fileInputRef = useRef(null);

    const messagesEndRef = useRef(null);

    // Fetch Rooms on Mount
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const [roomsData, userData] = await Promise.all([
                    api.chat.getRooms(),
                    api.auth.me()
                ]);
                setRooms(roomsData);
                setIsPremium(userData.is_premium);

                // Auto-select room if requestId is a number (projectId)
                if (requestId && requestId !== 'all' && !isNaN(requestId)) {
                    const room = roomsData.find(r => r.id === parseInt(requestId));
                    if (room) setSelectedRoom(room);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [requestId]);

    // Fetch Messages & Members when Room Changes
    useEffect(() => {
        if (!selectedRoom) return;

        const fetchMessages = async () => {
            try {
                const data = await api.messages.getProjectMessages(selectedRoom.id);
                setMessages(data);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        const fetchMembers = async () => {
            try {
                const data = await api.chat.getMembers(selectedRoom.id);
                setMembers(data);
            } catch (error) {
                console.error('Failed to fetch members:', error);
            }
        };

        fetchMessages();
        fetchMembers();

        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [selectedRoom]);

    useEffect(() => {
        // Only scroll if the last message is new or we just loaded
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length, selectedRoom?.id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom) return;

        try {
            await api.messages.send({ projectId: selectedRoom.id, content: newMessage });
            setNewMessage('');
            // Optimistic update handled by poll or re-fetch
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!isPremium) {
            alert('Image sending is a Premium feature.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                await api.messages.send({
                    projectId: selectedRoom.id,
                    content: 'Sent an image',
                    image_url: reader.result
                });
            } catch (error) {
                console.error('Failed to send image:', error);
                alert('Failed to send image');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editContent.trim() || !editingMessage) return;

        try {
            await api.messages.edit(editingMessage.id, editContent);
            setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: editContent, is_edited: true } : m));
            setEditingMessage(null);
            setEditContent('');
        } catch (error) {
            console.error('Failed to edit message:', error);
            alert(error.message || 'Failed to edit message');
        }
    };

    const startEditing = (msg) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
    };

    const handleDelete = async (msgId) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await api.messages.delete(msgId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (error) {
            console.error('Failed to delete message:', error);
            alert(error.message || 'Failed to delete message');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.chat.removeMember(selectedRoom.id, userId);
            setMembers(prev => prev.filter(m => m.user_id !== userId));
            alert('Member removed');
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member');
        }
    };

    const isOwner = selectedRoom?.user_id === currentUser?.id;

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-dark">
            {/* Sidebar - Rooms List */}
            <div className={`w-full md:w-80 bg-dark-surface border-r border-white/5 flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Your Projects</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {rooms.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center text-sm">No active projects yet.</div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                onClick={() => setSelectedRoom(room)}
                                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedRoom?.id === room.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-200 truncate">{room.title}</h3>
                                    {room.unread_count > 0 && (
                                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {room.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 truncate">{room.my_role}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex-col bg-dark ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
                {selectedRoom ? (
                    <>
                        {/* Header */}
                        <div className="bg-dark-surface border-b border-white/5 px-6 py-3 flex justify-between items-center shadow-sm">
                            <div>
                                <div className="flex items-center">
                                    <button onClick={() => setSelectedRoom(null)} className="md:hidden mr-2 text-gray-400">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <h2 className="text-xl font-bold text-white truncate max-w-[200px]">{selectedRoom.title}</h2>
                                </div>
                                <p className="text-xs text-gray-400">{members.length} Members</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="p-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-full transition-colors"
                                    title="View Members"
                                >
                                    <Users className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-dark">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    <p>Welcome to the project room!</p>
                                    <p className="text-sm">Start discussing your ideas.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === currentUser?.id;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <Link to={`/profile/${msg.sender_id}`} className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mx-2 border border-white/10 hover:opacity-80 transition-opacity">
                                                    {msg.sender_photo ? (
                                                        <img src={msg.sender_photo} alt={msg.sender_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </Link>
                                                <div>
                                                    {!isMe && <p className="text-xs text-gray-500 ml-1 mb-1">{msg.sender_name}</p>}
                                                    <div className={`rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-dark-surface border border-white/10 text-gray-300 rounded-tl-none'}`}>
                                                        {msg.image_url && (
                                                            <img src={msg.image_url} alt="Shared" className="max-w-full rounded mb-2" />
                                                        )}
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                    <div className={`flex items-center mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <p className="text-[10px] text-gray-500">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {msg.is_edited && <span className="ml-1 italic">(edited)</span>}
                                                        </p>
                                                        {isMe && (new Date() - new Date(msg.created_at) < 10 * 60 * 1000) && (
                                                            <button
                                                                onClick={() => startEditing(msg)}
                                                                className="ml-2 text-gray-500 hover:text-white text-[10px] underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        {isMe && (new Date() - new Date(msg.created_at) < 10 * 60 * 1000) && (
                                                            <button
                                                                onClick={() => handleDelete(msg.id)}
                                                                className="ml-2 text-red-500 hover:text-red-400 text-[10px]"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="bg-dark-surface border-t border-white/5 p-4">
                            {editingMessage ? (
                                <form onSubmit={handleEdit} className="flex gap-2 max-w-4xl mx-auto items-center">
                                    <span className="text-xs text-primary whitespace-nowrap">Editing...</span>
                                    <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="flex-1 bg-dark border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                    <button type="submit" className="text-primary hover:text-white text-sm">Save</button>
                                    <button type="button" onClick={() => setEditingMessage(null)} className="text-gray-500 hover:text-white text-sm">Cancel</button>
                                </form>
                            ) : (
                                <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto items-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-2 rounded-full transition-colors ${isPremium ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 cursor-not-allowed'}`}
                                        title={isPremium ? "Send Image" : "Premium feature"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-dark border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-primary text-white rounded-full p-2 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a project to start chatting
                    </div>
                )}
            </div>

            {/* Members Modal */}
            {showMembersModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-surface rounded-xl max-w-md w-full p-6 shadow-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Project Members</h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {members.map(member => (
                                <div key={member.user_id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3 border border-white/10">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-200">{member.username}</p>
                                            <p className="text-xs text-gray-500">{member.role}</p>
                                        </div>
                                    </div>
                                    {isOwner && member.user_id !== currentUser.id && (
                                        <button
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
