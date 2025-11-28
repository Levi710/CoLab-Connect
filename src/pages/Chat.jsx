import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, User, Users, MoreVertical, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
    const { requestId } = useParams(); // requestId here acts as projectId or 'all'
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [members, setMembers] = useState([]);

    const messagesEndRef = useRef(null);

    // Fetch Rooms on Mount
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await api.chat.getRooms();
                setRooms(data);

                // Auto-select room if requestId is a number (projectId)
                if (requestId && requestId !== 'all' && !isNaN(requestId)) {
                    const room = data.find(r => r.id === parseInt(requestId));
                    if (room) setSelectedRoom(room);
                } else if (data.length > 0 && !selectedRoom) {
                    // Select first room if none selected
                    setSelectedRoom(data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom) return;

        try {
            await api.messages.send({ projectId: selectedRoom.id, content: newMessage });
            setNewMessage('');
            // Optimistic update or wait for poll
            const newMsg = {
                id: Date.now(), // Temp ID
                project_id: selectedRoom.id,
                sender_id: currentUser.id,
                content: newMessage,
                created_at: new Date().toISOString(),
                sender_name: currentUser.username,
                sender_photo: currentUser.photo_url
            };
            setMessages(prev => [...prev, newMsg]);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
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
        <div className="flex h-[calc(100vh-64px)] bg-gray-100">
            {/* Sidebar - Rooms List */}
            <div className="w-80 bg-white border-r flex flex-col hidden md:flex">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Your Projects</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {rooms.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center text-sm">No active projects yet.</div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                onClick={() => setSelectedRoom(room)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedRoom?.id === room.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                            >
                                <h3 className="font-semibold text-gray-900 truncate">{room.title}</h3>
                                <p className="text-xs text-gray-500 mt-1 truncate">{room.my_role}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedRoom ? (
                    <>
                        {/* Header */}
                        <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedRoom.title}</h2>
                                <p className="text-xs text-gray-500">{members.length} Members</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                    title="View Members"
                                >
                                    <Users className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
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
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-2">
                                                    {msg.sender_photo ? (
                                                        <img src={msg.sender_photo} alt={msg.sender_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-5 w-5 text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    {!isMe && <p className="text-xs text-gray-500 ml-1 mb-1">{msg.sender_name}</p>}
                                                    <div className={`rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'}`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="bg-white border-t p-4">
                            <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Project Members</h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {members.map(member => (
                                <div key={member.user_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.username}</p>
                                            <p className="text-xs text-gray-500">{member.role}</p>
                                        </div>
                                    </div>
                                    {isOwner && member.user_id !== currentUser.id && (
                                        <button
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
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
