import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, Star } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Home() {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize state from URL params
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || 'All');

    const [visionText, setVisionText] = useState('Vision');
    const languages = ['Vision', 'दृष्टि', 'ビジョン', '비전', 'Visión', 'Visione', 'Visão', 'Rؤية', 'Viziune'];

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % languages.length;
            setVisionText(languages[index]);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

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

    // Logic for project of the month: Prefer system-selected featured project, fallback to most likes
    const projectOfTheMonth = projects.find(p => p.is_featured) || [...filteredProjects].sort((a, b) => b.likes - a.likes)[0];

    const handleEditProject = (project) => {
        const isPremium = currentUser?.is_premium;
        const createdAt = new Date(project.created_at);
        const now = new Date();
        const diffInMinutes = (now - createdAt) / 1000 / 60;

        if (diffInMinutes > 30 && !isPremium) {
            addToast('Editing is restricted to 30 minutes after posting. Upgrade to Premium to edit anytime!', 'error');
            return;
        }

        navigate('/create-project', { state: { project } });
    };

    if (loading) return (
        <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <SkeletonLoader count={6} />
                </div>
            </div>
        </div>
    );



    return (
        <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-block mb-4">
                        <span className="py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase shadow-sm shadow-primary/5 transition-all duration-500">
                            {visionText}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight bg-gold-gradient bg-clip-text text-transparent mb-6 drop-shadow-sm pb-2 leading-tight">
                        Find Your Next Project
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light">
                        Join the community of developers building the future.
                    </p>

                    {/* 3D Demo Placeholder */}
                    <div className="relative max-w-4xl mx-auto mt-12">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30 animate-pulse"></div>
                        <div className="relative bg-dark-surface rounded-2xl border border-white/10 aspect-video flex items-center justify-center overflow-hidden shadow-2xl group">
                            <video
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls
                            >
                                <source src="/demo.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-20 relative z-20">
                {/* Featured Projects (Moved above Search) */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-8 bg-gold-gradient rounded-full"></span>
                            Featured Projects
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.filter(p => p.is_featured).map(project => (
                            <ProjectCard key={project.id} project={project} isOwner={project.user_id === currentUser?.id} onEdit={handleEditProject} />
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
                            <ProjectCard project={projectOfTheMonth} isSponsored={true} isOwner={projectOfTheMonth.user_id === currentUser?.id} onEdit={handleEditProject} />
                        </div>
                    </div>
                )}

                {/* Search Bar - Only visible to logged in users */}
                {currentUser && (
                    <div className="max-w-3xl mx-auto mb-16 px-4 sm:px-0">
                        <form onSubmit={(e) => e.preventDefault()} className="bg-dark-surface/80 border border-gold/20 rounded-2xl sm:rounded-full p-2 flex flex-col sm:flex-row shadow-2xl shadow-black/50 backdrop-blur-xl">
                            <div className="flex-shrink-0 pl-2 sm:pl-4 pr-2 flex items-center border-b sm:border-b-0 sm:border-r border-white/5 mb-2 sm:mb-0 pb-2 sm:pb-0">
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full sm:w-auto bg-transparent text-gray-300 text-sm font-medium focus:outline-none cursor-pointer hover:text-white transition-colors [&>option]:bg-[#13161f] [&>option]:text-gray-300 py-2 sm:py-0"
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
                                className="flex-1 bg-transparent border-none px-4 py-2 sm:py-0 text-white placeholder-gray-500 focus:ring-0 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="px-4 py-2 sm:py-3 text-gray-400 flex justify-end sm:block">
                                {searchTerm ? <span className="text-xs">Searching...</span> : <Search className="w-5 h-5" />}
                            </div>
                        </form>
                    </div>
                )}

                {/* All Projects - Only visible to logged in users */}
                {currentUser && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-8">All Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.filter(p => !p.is_featured && p.id !== projectOfTheMonth?.id).map(project => (
                                <ProjectCard key={project.id} project={project} isOwner={project.user_id === currentUser?.id} onEdit={handleEditProject} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
