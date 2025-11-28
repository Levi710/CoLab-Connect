import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, User } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [otherUser, setOtherUser] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const data = await api.messages.get(requestId);
            setMessages(data);

            // Determine the "other" user for the header
            if (data.length > 0 && currentUser) {
                const firstMsg = data[0];
                // This logic might need adjustment depending on who started the chat or if it's empty
                // For now, we might need to fetch request details to know who the participants are if chat is empty
                // But let's assume we can get it from the messages if they exist
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.messages.send({ requestId, content: newMessage });
            setNewMessage('');
            fetchMessages(); // Immediate refresh
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center shadow-sm">
                <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Project Chat</h2>
                    <p className="text-xs text-gray-500">Request ID: {requestId}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500 mt-10">Loading chat...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-2">
                                        {msg.sender_photo ? (
                                            <img src={msg.sender_photo} alt={msg.sender_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-500" />
                                        )}
                                    </div>
                                    <div className={`rounded-lg px-4 py-2 shadow-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
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

            {/* Input Area */}
            <div className="bg-white border-t p-4">
                <form onSubmit={handleSend} className="flex gap-2">
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
        </div>
    );
}
