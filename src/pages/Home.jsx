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

    // Main Data State
    const [projects, setProjects] = useState([]); // The Feed
    const [featuredProjects, setFeaturedProjects] = useState([]); // Featured (Top)
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observerTarget = React.useRef(null);

    // Initial Filter State
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

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [featuredRes, feedRes] = await Promise.allSettled([
                api.projects.getFeatured(),
                api.projects.getAll({ page: 1, limit: 3 })
            ]);

            const mapProject = p => {
                const mapped = {
                    ...p,
                    lookingFor: p.looking_for || '',
                    pollQuestion: p.poll_question,
                    isFeatured: p.is_featured,
                    isSponsored: p.is_sponsored
                };

                // Map poll voted ID to index for the UI
                if (mapped.polls) {
                    mapped.polls = mapped.polls.map(poll => {
                        const votedIndex = poll.user_voted_option_id
                            ? poll.options.findIndex(opt => opt.id === poll.user_voted_option_id)
                            : undefined;
                        // Frontend expects user_voted_option as index
                        return { ...poll, user_voted_option: votedIndex !== -1 ? votedIndex : undefined };
                    });
                }
                return mapped;
            };

            if (featuredRes.status === 'fulfilled' && Array.isArray(featuredRes.value)) {
                setFeaturedProjects(featuredRes.value.map(mapProject));
            } else {
                console.error('Featured fetch failed or invalid:', featuredRes.reason || featuredRes.value);
            }

            if (feedRes.status === 'fulfilled' && Array.isArray(feedRes.value)) {
                const data = feedRes.value;
                setProjects(data.map(mapProject));
                if (data.length < 3) setHasMore(false);
            } else {
                console.error('Feed fetch failed or invalid:', feedRes.reason || feedRes.value);
                setHasMore(false);
            }

        } catch (err) {
            console.error('Failed to fetch initial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMoreProjects = async (pageNum) => {
        try {
            setIsFetchingMore(true);
            const data = await api.projects.getAll({ page: pageNum, limit: 10 });

            if (data.length < 10) setHasMore(false);

            const formattedData = data.map(p => ({
                ...p,
                lookingFor: p.looking_for || '',
                pollQuestion: p.poll_question,
                isFeatured: p.is_featured,
                isSponsored: p.is_sponsored
            }));

            setProjects(prev => [...prev, ...formattedData]);
        } catch (err) {
            console.error('Failed to fetch more projects:', err);
            setHasMore(false);
        } finally {
            setIsFetchingMore(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchMoreProjects(nextPage);
                        return nextPage;
                    });
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading, isFetchingMore]);

    // Sync local state with URL params when they change (e.g. back button)
    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
        setFilterCategory(searchParams.get('category') || 'All');
    }, [searchParams]);

    // Debounce search
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
        }, 2000);

        return () => clearTimeout(timer);
    }, [searchTerm, filterCategory, setSearchParams]);

    // Client-side filtering for the loaded feed
    const currentSearch = searchParams.get('q') || '';
    const currentCategory = searchParams.get('category') || 'All';

    const filterFn = (p) => {
        const matchesSearch = p.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(currentSearch.toLowerCase());
        const matchesCategory = currentCategory === 'All' || p.category === currentCategory;
        return matchesSearch && matchesCategory;
    };

    const filteredFeed = projects.filter(filterFn);

    // Project of the Month Logic
    // Prefer first featured project, fallback to most liked project in the current feed
    const projectOfTheMonth = featuredProjects.length > 0 ? featuredProjects[0] : [...projects].sort((a, b) => b.votes - a.votes)[0];

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
                {/* Featured Projects */}
                {featuredProjects.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-serif font-bold text-white flex items-center gap-2">
                                <span className="w-1 h-8 bg-gold-gradient rounded-full"></span>
                                Featured Projects
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredProjects.map(project => (
                                <ProjectCard key={project.id} project={project} isOwner={project.user_id === currentUser?.id} onEdit={handleEditProject} />
                            ))}
                        </div>
                    </div>
                )}

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

                {/* All Projects Feed - Only visible to logged in users */}
                {currentUser && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-8">All Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFeed.map((project, index) => (
                                <ProjectCard key={project.id || index} project={project} isOwner={project.user_id === currentUser?.id} onEdit={handleEditProject} />
                            ))}
                        </div>
                        {/* Sentinel for Infinite Scroll */}
                        {hasMore && (
                            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
                                {isFetchingMore && <div className="text-gray-400">Loading more projects...</div>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
