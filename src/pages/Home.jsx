import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, TrendingUp, Star } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || 'All');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.projects.getAll();
                // Map snake_case from DB to camelCase for components
                const formattedData = data.map(p => ({
                    ...p,
                    lookingFor: p.looking_for || '',
                    pollQuestion: p.poll_question,
                    isFeatured: p.is_featured,
                    isSponsored: p.is_sponsored
                }));
                setProjects(formattedData);
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Sync local state with URL params when they change (e.g. back button)
    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
        setFilterCategory(searchParams.get('category') || 'All');
    }, [searchParams]);

    // Debounce search: Update URL params after 2 seconds of inactivity
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                if (searchTerm) newParams.set('q', searchTerm);
                else newParams.delete('q');

                if (filterCategory && filterCategory !== 'All') newParams.set('category', filterCategory);
                else newParams.delete('category');

                return newParams;
            });
        }, 2000); // 2 seconds delay as requested

        return () => clearTimeout(timer);
    }, [searchTerm, filterCategory, setSearchParams]);

    // Handle immediate filter change (optional, but usually filters are immediate. User asked for search throttling)
    // For now, I'll include category in the debounce to keep it consistent with the "wait" request, 
    // or I could separate them. I'll keep them together for simplicity.

    /* 
    const handleSearch = (e) => {
        e.preventDefault();
        // Search is now handled by the debounce effect
    }; 
    */

    // Filter projects based on URL params (source of truth)
    const currentSearch = searchParams.get('q') || '';
    const currentCategory = searchParams.get('category') || 'All';

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            project.description.toLowerCase().includes(currentSearch.toLowerCase());
        const matchesCategory = currentCategory === 'All' || project.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    // Simple logic for project of the month: most likes from FILTERED projects
    const projectOfTheMonth = [...filteredProjects].sort((a, b) => b.likes - a.likes)[0];

    if (loading) return <div className="text-center py-20">Loading projects...</div>;

    return (
        <div className="min-h-screen bg-[#0b0f19] bg-grid text-gray-100 font-sans selection:bg-primary/30">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-block mb-4">
                        <span className="py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase">
                            Featured Platform
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                        Find Your Next Project
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
                        Join the community of developers building the future.
                    </p>

                    {/* 3D Demo Placeholder */}
                    <div className="relative max-w-4xl mx-auto mt-12">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30 animate-pulse"></div>
                        <div className="relative bg-dark-surface rounded-2xl border border-white/10 aspect-video flex items-center justify-center overflow-hidden shadow-2xl">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 font-medium">Watch the Demo</p>
                            </div>
                            {/* Grid overlay for video placeholder */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-20 relative z-20">
                {/* Search Bar */}
                <div className="max-w-3xl mx-auto mb-16">
                    <form onSubmit={(e) => e.preventDefault()} className="bg-dark-surface border border-white/10 rounded-full p-2 flex shadow-xl shadow-black/50 backdrop-blur-xl">
                        <div className="flex-shrink-0 pl-4 pr-2 flex items-center border-r border-white/5">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-transparent text-gray-300 text-sm font-medium focus:outline-none cursor-pointer hover:text-white transition-colors [&>option]:bg-[#13161f] [&>option]:text-gray-300"
                            >
                                <option value="All" className="bg-[#13161f]">All Categories</option>
                                <option value="Tech" className="bg-[#13161f]">Technology</option>
                                <option value="Social Impact" className="bg-[#13161f]">Social Impact</option>
                                <option value="Art" className="bg-[#13161f]">Art</option>
                                <option value="Education" className="bg-[#13161f]">Education</option>
                                <option value="Business" className="bg-[#13161f]">Business</option>
                                <option value="Marketing" className="bg-[#13161f]">Marketing</option>
                                <option value="Design" className="bg-[#13161f]">Design</option>
                                <option value="Other" className="bg-[#13161f]">Other</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Search for projects..."
                            className="flex-1 bg-transparent border-none px-4 text-white placeholder-gray-500 focus:ring-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="px-4 py-3 text-gray-400">
                            {searchTerm ? 'Searching...' : <Search className="w-5 h-5" />}
                        </div>
                    </form>
                </div>

                {/* Featured Projects */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full"></span>
                            Featured Projects
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.filter(p => p.is_featured).map(project => (
                            <ProjectCard key={project.id} project={project} isOwner={project.user_id === currentUser?.id} />
                        ))}
                    </div>
                </div>

                {/* Project of the Month */}
                {projectOfTheMonth && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                            <span className="w-1 h-8 bg-gradient-to-b from-accent to-primary rounded-full"></span>
                            Project of the Month
                        </h2>
                        <div className="bg-dark-surface rounded-2xl p-1 border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <ProjectCard project={projectOfTheMonth} isSponsored={true} isOwner={projectOfTheMonth.user_id === currentUser?.id} />
                        </div>
                    </div>
                )}

                {/* All Projects */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-8">All Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.filter(p => !p.is_featured && p.id !== projectOfTheMonth?.id).map(project => (
                            <ProjectCard key={project.id} project={project} isOwner={project.user_id === currentUser?.id} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
