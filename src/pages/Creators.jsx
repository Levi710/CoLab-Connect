import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Edit2, Save, X, Github, Linkedin, Twitter } from 'lucide-react';
import { api } from '../api';

export default function Creators() {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const isAdmin = !!currentUser; // Allow any logged-in user to edit as requested

    useEffect(() => {
        fetchCreators();
    }, []);

    const fetchCreators = async () => {
        try {
            // We need to add this to api.js or just fetch directly for now if api.js isn't updated
            // Assuming api.js will be updated or we use fetch directly
            const res = await fetch('http://localhost:5000/api/creators');
            const data = await res.json();
            setCreators(data);
        } catch (error) {
            console.error('Failed to fetch creators:', error);
            addToast('Failed to load creators', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (creator) => {
        setEditingId(creator.id);
        setEditForm(creator);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/creators/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error('Failed to update');

            const updatedCreator = await res.json();
            setCreators(creators.map(c => c.id === editingId ? updatedCreator : c));
            setEditingId(null);
            addToast('Creator updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update creator:', error);
            addToast('Failed to update creator', 'error');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-dark text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-dark text-gray-100 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                        Meet the Creators
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        The passionate team building the future of collaboration.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {creators.map((creator) => (
                        <div key={creator.id} className="bg-dark-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-300 group relative">
                            {isAdmin && !editingId && (
                                <button
                                    onClick={() => handleEditClick(creator)}
                                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-primary text-white rounded-full backdrop-blur-sm transition-colors z-10"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}

                            {editingId === creator.id ? (
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-white">Edit Creator</h3>
                                        <div className="flex gap-2">
                                            <button onClick={handleSave} className="p-2 bg-green-500/20 text-green-500 rounded-full hover:bg-green-500/30">
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button onClick={handleCancelEdit} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/30">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Role</label>
                                        <input
                                            type="text"
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={editForm.image_url}
                                            onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                                            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            rows={4}
                                            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white focus:border-primary outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-64 overflow-hidden relative">
                                        <img
                                            src={creator.image_url}
                                            alt={creator.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-surface to-transparent opacity-60"></div>
                                    </div>
                                    <div className="p-6 relative">
                                        <div className="absolute -top-10 left-6">
                                            <div className="bg-dark-surface p-1 rounded-xl inline-block">
                                                <div className="bg-gradient-to-br from-primary to-secondary w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                                    {creator.name.charAt(0)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-2xl font-bold text-white mb-1">{creator.name}</h3>
                                            <p className="text-primary font-medium mb-4">{creator.role}</p>
                                            <p className="text-gray-400 leading-relaxed mb-6">
                                                {creator.bio}
                                            </p>
                                            <div className="flex gap-4">
                                                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                                                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                                                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
