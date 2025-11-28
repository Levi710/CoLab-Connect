import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Star } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

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

    // Filter projects
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || project.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredProjects = projects.filter(p => p.is_sponsored);
    // Simple logic for project of the month: most likes
    const projectOfTheMonth = [...projects].sort((a, b) => b.likes - a.likes)[0];

    if (loading) return <div className="text-center py-20">Loading projects...</div>;

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center py-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80')] opacity-10 bg-cover bg-center"></div>
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Where Ideas Meet <span className="text-amber-300">Action</span>
                    </h1>
                    <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
                        Discover groundbreaking projects, find your dream team, and turn "what if" into "what is".
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto bg-white rounded-full p-2 flex shadow-lg transform hover:scale-[1.01] transition-transform duration-200">
                        <div className="flex-1 flex items-center px-4">
                            <Search className="h-5 w-5 text-gray-400 mr-3" />
                            <input
                                type="text"
                                placeholder="Search for projects, skills, or keywords..."
                                className="w-full focus:outline-none text-gray-700 placeholder-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="border-l border-gray-200 mx-2"></div>
                        <select
                            className="bg-transparent text-gray-600 font-medium px-4 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Tech">Tech</option>
                            <option value="Art">Art</option>
                            <option value="Social">Social</option>
                            <option value="Business">Business</option>
                        </select>
                        <button className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-md">
                            Search
                        </button>
                    </div>
                </div>
            </section>

            {/* Project of the Month */}
            {projectOfTheMonth && (
                <section>
                    <div className="flex items-center mb-6">
                        <Star className="h-6 w-6 text-amber-500 mr-2 fill-current" />
                        <h2 className="text-2xl font-bold text-gray-900">Project of the Month</h2>
                    </div>
                    <ProjectCard
                        project={projectOfTheMonth}
                        isFeatured={true}
                        isOwner={currentUser && projectOfTheMonth.user_id === currentUser.id}
                    />
                </section>
            )}

            {/* Featured / Sponsored */}
            {featuredProjects.length > 0 && (
                <section>
                    <div className="flex items-center mb-6">
                        <TrendingUp className="h-6 w-6 text-indigo-500 mr-2" />
                        <h2 className="text-2xl font-bold text-gray-900">Featured Projects</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredProjects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isSponsored={true}
                                isOwner={currentUser && project.user_id === currentUser.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Discovery Feed */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Discovery Feed</h2>
                    <button className="flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                    </button>
                </div>

                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isOwner={currentUser && project.user_id === currentUser.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setFilterCategory('All'); }}
                            className="mt-4 text-indigo-600 font-medium hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
