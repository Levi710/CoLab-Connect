import React, { useState, useEffect } from 'react';

import { useToast } from '../context/ToastContext';
import { Github, Linkedin, Twitter } from 'lucide-react';


export default function Creators() {
    const { addToast } = useToast();
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCreators();
    }, []);

    const fetchCreators = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/creators');
            const data = await res.json();

            // Override for Ayush and Suprovo
            const updatedData = data.map(creator => {
                if (creator.name.includes('Ayush') || creator.name.includes('Levi')) {
                    return {
                        ...creator,
                        image_url: '/creators/ayush.png',
                        role: 'Frontend and Backend Developer for this project'
                    };
                }
                if (creator.name.includes('Sarah')) {
                    return {
                        ...creator,
                        name: 'Suprovo Mallick',
                        role: 'AI Developer',
                        bio: 'Implemented the AI integration for this project, enabling intelligent features and analysis.',
                        image_url: '/creators/suprovo.jpg'
                    };
                }
                if (creator.name.includes('Marcus')) {
                    return {
                        ...creator,
                        name: 'Shailendra Pratap Singh',
                        image_url: '/creators/shailendra.jpg'
                    };
                }
                return creator;
            });

            setCreators(updatedData);
        } catch (error) {
            console.error('Failed to fetch creators:', error);
            addToast('Failed to load creators', 'error');
        } finally {
            setLoading(false);
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
