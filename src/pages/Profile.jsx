import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { User, Award, Briefcase, X, Plus, Search, Check, Lock } from 'lucide-react';
import skillsData from '../data/skills.json';
import ProjectCard from '../components/ProjectCard';

export default function Profile() {
    const { currentUser } = useAuth();
    const { id } = useParams();
    const [profileUser, setProfileUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [userProjects, setUserProjects] = useState([]);

    // Skills Selector State
    const [skillSearch, setSkillSearch] = useState('');
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Combine all skills for search
    const allSkills = [...skillsData.tech, ...skillsData.non_tech];

    const isOwnProfile = !id || (currentUser && currentUser.id === parseInt(id));



    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSkillDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [error, setError] = useState(null); // Add error state

    // ... (existing code)

    useEffect(() => {
        const fetchProfile = async () => {
            setError(null); // Reset error
            if (isOwnProfile) {
                if (currentUser) {
                    setProfileUser(currentUser);
                    setBio(currentUser.bio || '');
                    const userSkills = currentUser.skills ? currentUser.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                    setSelectedSkills(userSkills);
                    setPhotoUrl(currentUser.photo_url || '');
                    setBackgroundUrl(currentUser.background_url || '');

                    // Fetch own projects
                    try {
                        const { api } = await import('../api');
                        const projects = await api.projects.getMyProjects();
                        setUserProjects(projects);
                    } catch (err) {
                        console.error("Failed to fetch my projects", err);
                    }
                }
            } else {
                setLoading(true);
                try {
                    const { api } = await import('../api');
                    console.log('Fetching profile for ID:', id); // Debug log
                    const data = await api.users.getProfile(id);
                    setProfileUser(data);
                    setBio(data.bio || '');
                    const userSkills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                    setSelectedSkills(userSkills);
                    setPhotoUrl(data.photo_url || '');
                    setBackgroundUrl(data.background_url || '');
                    setUserProjects(data.projects || []);
                } catch (err) {
                    console.error("Failed to fetch user profile", err);
                    setError(err.message || 'Failed to load profile');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProfile();
    }, [currentUser, id, isOwnProfile]);

    // ... (existing code)

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <p className="text-gray-500">Profile not found or please log in.</p>
            </div>
        );
    }

    if (!profileUser && !loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">Profile not found or please log in.</p>
            </div>
        );
    }

    if (loading && !profileUser) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">Loading profile...</p>
            </div>
        );
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size exceeds 5MB limit.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size exceeds 5MB limit.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addSkill = (skill) => {
        if (!selectedSkills.includes(skill)) {
            setSelectedSkills([...selectedSkills, skill]);
        }
        setSkillSearch('');
        setShowSkillDropdown(false);
    };

    const removeSkill = (skillToRemove) => {
        setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
    };

    const filteredSkills = allSkills.filter(skill =>
        skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.includes(skill)
    );

    const handleSave = async () => {
        setLoading(true);
        try {
            const { api } = await import('../api');
            // Join skills array back to string for storage
            const skillsString = selectedSkills.join(', ');

            await api.auth.updateProfile({
                bio,
                skills: skillsString,
                photo_url: photoUrl,
                background_url: backgroundUrl
            });

            // Force reload to update context and UI
            window.location.reload();
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-dark-surface shadow-xl rounded-lg overflow-hidden border border-white/10 mb-8">
                <div
                    className="h-32 bg-cover bg-center relative"
                    style={{
                        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                        backgroundColor: backgroundUrl ? 'transparent' : '#4f46e5' // indigo-600
                    }}
                >
                    {isEditing && isOwnProfile && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-colors backdrop-blur-sm border border-white/20">
                                <span>Change Cover</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}
                </div>
                <div className="px-4 py-5 sm:px-6 relative">
                    <div className="-mt-16 mb-4">
                        {photoUrl ? (
                            <img
                                className="h-24 w-24 rounded-full border-4 border-dark-surface shadow-md inline-block object-cover bg-dark"
                                src={photoUrl}
                                alt={profileUser.username}
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full border-4 border-dark-surface shadow-md bg-dark flex items-center justify-center inline-block">
                                <User className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                        {isEditing && isOwnProfile && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Change Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold leading-6 text-white">
                                {profileUser.username}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-400">
                                {profileUser.email}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary h-fit border border-primary/20">
                                {profileUser.is_premium ? 'Premium Plan' : 'Free Plan'}
                            </span>
                            {isOwnProfile && (
                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none transition-colors"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
                                </button>
                            )}
                            {isEditing && isOwnProfile && (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset state
                                        setBio(profileUser.bio || '');
                                        const userSkills = profileUser.skills ? profileUser.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                                        setSelectedSkills(userSkills);
                                        setPhotoUrl(profileUser.photo_url || '');
                                        setBackgroundUrl(profileUser.background_url || '');
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-white/5 focus:outline-none transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-2">
                                <Briefcase className="h-4 w-4" /> Bio
                            </dt>
                            <dd className="mt-1 text-sm text-gray-200">
                                {isEditing ? (
                                    <textarea
                                        rows={4}
                                        className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm bg-dark border-white/10 rounded-md border p-3 text-white placeholder-gray-500"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap">{bio || <span className="text-gray-500 italic">No bio added yet.</span>}</p>
                                )}
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4" /> Skills
                            </dt>
                            <dd className="mt-1 text-sm text-gray-200">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {selectedSkills.map(skill => (
                                                <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                                    {skill}
                                                    <button
                                                        onClick={() => removeSkill(skill)}
                                                        className="ml-1.5 inline-flex items-center justify-center text-primary hover:text-white focus:outline-none"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>

                                        <div className="relative" ref={dropdownRef}>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm bg-dark border-white/10 rounded-md border p-2 text-white placeholder-gray-500"
                                                    placeholder="Search skills (e.g. React, Design)..."
                                                    value={skillSearch}
                                                    onChange={(e) => {
                                                        setSkillSearch(e.target.value);
                                                        setShowSkillDropdown(true);
                                                    }}
                                                    onFocus={() => setShowSkillDropdown(true)}
                                                />
                                            </div>

                                            {showSkillDropdown && (
                                                <div className="absolute z-10 mt-1 w-full bg-dark-surface shadow-xl max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-white/10">
                                                    {filteredSkills.length > 0 ? (
                                                        filteredSkills.map((skill) => (
                                                            <div
                                                                key={skill}
                                                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-white/5 text-gray-200"
                                                                onClick={() => addSkill(skill)}
                                                            >
                                                                <span className="block truncate">{skill}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                                                            No matching skills found.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">Select from the list to add skills.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSkills.length > 0 ? selectedSkills.map((skill) => (
                                            <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                {skill}
                                            </span>
                                        )) : <span className="text-gray-500 italic">No skills added yet.</span>}
                                    </div>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* User Projects Section */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    {isOwnProfile ? 'My Projects' : `${profileUser.username}'s Projects`}
                </h3>
                {userProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userProjects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isOwner={isOwnProfile}
                                onDelete={isOwnProfile ? async (id) => {
                                    if (window.confirm('Are you sure you want to delete this project?')) {
                                        const { api } = await import('../api');
                                        await api.projects.delete(id);
                                        setUserProjects(userProjects.filter(p => p.id !== id));
                                    }
                                } : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-dark-surface rounded-lg border border-white/5">
                        <p className="text-gray-500">No projects found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
