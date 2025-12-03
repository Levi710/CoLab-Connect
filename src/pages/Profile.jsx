import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Briefcase, Award, X, Eye, Plus, Search, Lock, Users as UsersIcon } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import ProjectCard from '../components/ProjectCard';
import skillsData from '../data/skills.json';

export default function Profile() {
    const { currentUser, loading: authLoading, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const [profileUser, setProfileUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [userProjects, setUserProjects] = useState([]);
    const [viewingImage, setViewingImage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [userToRemove, setUserToRemove] = useState(null);

    // Bot Customization State
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get('projectId');
    const [isBotAuthorized, setIsBotAuthorized] = useState(false);
    const [botAccessList, setBotAccessList] = useState([]);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [newAccessId, setNewAccessId] = useState('');
    const [projectOwnerId, setProjectOwnerId] = useState(null);

    // Skills Selector State
    const [skillSearch, setSkillSearch] = useState('');
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Combine all skills for search
    const allSkills = [...skillsData.tech, ...skillsData.non_tech];

    const isOwnProfile = !id || (currentUser && (currentUser.public_id === id || currentUser.id == id));

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (authLoading) return; // Wait for auth to load

            if (id === 'system') {
                let systemUser = {
                    username: 'System Bot',
                    bio: 'I am the digital heartbeat of CoLab Connect. 🌐\n\nI manage your projects, deliver notifications, and ensure the network flows smoothly. When I\'m not routing packets, I\'m dreaming of electric sheep.',
                    photo_url: '/logo.svg',
                    skills: 'Project Management, Notification Delivery, Network Optimization, Beep Boop, 24/7 Uptime',
                    is_premium: true, // System is always premium
                    is_system: true,
                    background_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1920&q=80' // Network/Wave background
                };

                if (projectId) {
                    try {
                        const { api } = await import('../api');
                        // Fetch all projects to find the current one and check owner
                        const projects = await api.projects.getAll();
                        const project = projects.find(p => p.id == projectId); // Loose equality for ID

                        if (project) {
                            setProjectOwnerId(project.user_id);

                            const settings = await api.projects.getBotSettings(projectId);

                            if (settings) {
                                systemUser = {
                                    ...systemUser,
                                    username: settings.bot_name || systemUser.username,
                                    photo_url: settings.bot_avatar_url || systemUser.photo_url,
                                    bio: settings.bot_bio || systemUser.bio,
                                    skills: settings.bot_skills || systemUser.skills,
                                    background_url: settings.bot_background_url || systemUser.background_url,
                                };
                                setBotAccessList(settings.access_list || []);

                                // Check Authorization
                                if (currentUser) {
                                    const isOwner = currentUser.id === project.user_id;
                                    const isDelegated = settings.access_list?.includes(currentUser.id);
                                    // Authorized if: (Owner AND Premium) OR Delegated
                                    setIsBotAuthorized((isOwner && currentUser.is_premium) || isDelegated);
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch bot settings", err);
                    }
                }

                setProfileUser(systemUser);
                setBio(systemUser.bio);
                setSelectedSkills(systemUser.skills.split(',').map(s => s.trim()));
                setPhotoUrl(systemUser.photo_url);
                setBackgroundUrl(systemUser.background_url);
                setLoading(false);
                return;
            }

            setError(null);
            if (isOwnProfile) {
                if (currentUser) {
                    setProfileUser(currentUser);
                    setBio(currentUser.bio || '');
                    const userSkills = currentUser.skills ? currentUser.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
                    setSelectedSkills(userSkills);
                    setPhotoUrl(currentUser.photo_url || '');
                    setBackgroundUrl(currentUser.background_url || '');
                    setLoading(false);

                    // Fetch own projects
                    try {
                        const { api } = await import('../api');
                        const projects = await api.projects.getMyProjects();
                        setUserProjects(projects);
                    } catch (err) {
                        console.error("Failed to fetch my projects", err);
                    }
                } else {
                    // Not logged in and trying to view own profile (e.g. /profile)
                    setLoading(false);
                }
            } else {
                setLoading(true);
                try {
                    const { api } = await import('../api');
                    console.log('Fetching profile for ID:', id);
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
    }, [currentUser, id, isOwnProfile, authLoading]);

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

    if (authLoading || loading) return (
        <div className="min-h-screen bg-black">
            <SkeletonLoader type="profile" />
        </div>
    );

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-white pt-24">
                <p className="text-red-500 mb-2">{error}</p>
                <p className="text-gray-500">Profile not found.</p>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-white pt-24">
                <p className="text-gray-500">Please log in to view your profile.</p>
            </div>
        );
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast('File size exceeds 5MB limit.', 'error');
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
                addToast('File size exceeds 5MB limit.', 'error');
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

    const handleDeleteAccount = async () => {
        setShowDeleteModal(false);
        try {
            const { api } = await import('../api');
            await api.users.deleteAccount();
            logout();
            addToast('Account deleted successfully.', 'success');
            navigate('/');
        } catch (error) {
            console.error('Failed to delete account:', error);
            addToast('Failed to delete account.', 'error');
        }
    };

    const handleSave = async () => {
        if (!isOwnProfile && id !== 'system') return;

        setLoading(true);
        try {
            const { api } = await import('../api');
            const skillsString = selectedSkills.join(', ');

            if (id === 'system' && projectId) {
                // Update Bot Settings
                await api.projects.updateBotSettings(projectId, {
                    bot_name: profileUser.username,
                    bot_avatar_url: photoUrl,
                    bot_bio: bio,
                    bot_skills: skillsString,
                    bot_background_url: backgroundUrl
                });
                addToast('System Bot updated successfully!', 'success');
            } else {
                await api.auth.updateProfile({
                    bio,
                    skills: skillsString,
                    photo_url: photoUrl,
                    background_url: backgroundUrl
                });
                addToast('Profile updated successfully!', 'success');
            }

            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error('Failed to update profile:', error);
            addToast('Failed to update profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccess = async () => {
        if (!newAccessId) return;
        try {
            const { api } = await import('../api');
            const userId = parseInt(newAccessId);
            if (isNaN(userId)) {
                addToast('Invalid User ID', 'error');
                return;
            }
            const newList = [...botAccessList, userId];
            await api.projects.updateBotAccess(projectId, newList);
            setBotAccessList(newList);
            setNewAccessId('');
            addToast('User access granted', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to grant access', 'error');
        }
    };

    const handleRemoveAccess = async (userIdToRemove) => {
        try {
            const { api } = await import('../api');
            const newList = botAccessList.filter(uid => uid !== userIdToRemove);
            await api.projects.updateBotAccess(projectId, newList);
            setBotAccessList(newList);
            addToast('User access revoked', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to revoke access', 'error');
        }
    };

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

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
                    onClick={() => setViewingImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                        onClick={() => setViewingImage(null)}
                    >
                        <X className="h-10 w-10" />
                    </button>
                    <img
                        src={viewingImage === 'photo' ? photoUrl : backgroundUrl}
                        alt="Full view"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="bg-dark-surface/80 backdrop-blur-md shadow-2xl shadow-black/50 rounded-lg border border-gold/20 mb-8 relative overflow-hidden">
                {/* Decorative sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
                <div
                    className="h-32 bg-cover bg-center relative group rounded-t-lg"
                    style={{
                        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                        backgroundColor: backgroundUrl ? 'transparent' : '#4f46e5'
                    }}
                >
                    {/* Background Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        {backgroundUrl && (
                            <button
                                onClick={() => setViewingImage('background')}
                                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all transform hover:scale-110"
                                title="View Cover"
                            >
                                <Eye className="h-5 w-5" />
                            </button>
                        )}

                        {isEditing && isOwnProfile && (
                            <label className="cursor-pointer bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all transform hover:scale-110" title="Change Cover">
                                <span className="sr-only">Change Cover</span>
                                <Plus className="h-5 w-5" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundUpload}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>
                <div className="px-4 py-5 sm:px-6 relative">
                    <div className="-mt-16 mb-4 relative inline-block group">
                        {photoUrl ? (
                            <img
                                className="h-24 w-24 rounded-full border-4 border-dark-surface shadow-lg shadow-gold/20 inline-block object-cover bg-dark"
                                src={photoUrl}
                                alt={profileUser.username}
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full border-4 border-dark-surface shadow-md bg-dark flex items-center justify-center inline-block">
                                <User className="h-12 w-12 text-gray-400" />
                            </div>
                        )}

                        {/* Profile Photo Hover Overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 border-4 border-transparent">
                            {photoUrl && (
                                <button
                                    onClick={() => setViewingImage('photo')}
                                    className="text-white hover:text-primary transition-colors transform hover:scale-110"
                                    title="View Photo"
                                >
                                    <Eye className="h-6 w-6" />
                                </button>
                            )}

                            {isEditing && isOwnProfile && (
                                <label className="cursor-pointer text-white hover:text-primary transition-colors transform hover:scale-110" title="Change Photo">
                                    <Plus className="h-6 w-6" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h3 className="text-3xl font-serif font-bold leading-relaxed pb-1 bg-gold-gradient bg-clip-text text-transparent drop-shadow-sm">
                                {profileUser.username}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-silver font-light tracking-wide">
                                {profileUser.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium h-fit border shadow-sm ${profileUser.is_system ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-gold/10 text-gold border-gold/30 shadow-gold/10'}`}>
                                {profileUser.is_system ? 'System Core' : (profileUser.is_premium ? 'Premium Plan' : 'Free Plan')}
                            </span>
                            {/* Edit Profile & Manage Access Buttons */}
                            {console.log('Debug Visibility:', {
                                isOwnProfile,
                                id,
                                projectId,
                                currentUserId: currentUser?.id,
                                projectOwnerId,
                                isBotAuthorized,
                                isOwnerMatch: currentUser?.id == projectOwnerId // Loose equality check for debug
                            })}
                            {(isOwnProfile || (id === 'system' && projectId)) && (
                                <div className="flex gap-2">
                                    {id === 'system' ? (
                                        <>
                                            {/* Locked Button: Owner but NOT Authorized (Free) */}
                                            {currentUser?.id == projectOwnerId && !isBotAuthorized && (
                                                <div className="relative group">
                                                    <button disabled className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-white/10 cursor-not-allowed blur-[2px]">
                                                        Edit Profile
                                                    </button>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Lock className="h-5 w-5 text-yellow-500" />
                                                    </div>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-xs p-2 rounded hidden group-hover:block text-center z-50">
                                                        Premium Feature: Upgrade to customize the System Bot
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unlocked Button: Authorized (Premium Owner OR Delegated) */}
                                            {isBotAuthorized && (
                                                <button
                                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-lg shadow-gold/20 text-dark bg-gold-gradient hover:brightness-110 focus:outline-none transition-all transform hover:scale-105"
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
                                                </button>
                                            )}

                                            {/* Manage Access Button: Premium Owner Only */}
                                            {currentUser?.id == projectOwnerId && isBotAuthorized && (
                                                <button
                                                    onClick={() => setShowAccessModal(true)}
                                                    className="inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md shadow-sm text-white bg-dark-surface hover:bg-white/5 focus:outline-none transition-colors gap-2"
                                                >
                                                    <UsersIcon className="h-4 w-4" /> Manage Access
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        // Normal User Profile
                                        <button
                                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none transition-colors"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
                                        </button>
                                    )}
                                </div>
                            )}
                            {isOwnProfile && !isEditing && (
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-red-500/50 text-sm font-medium rounded-md shadow-sm text-red-500 bg-transparent hover:bg-red-500/10 focus:outline-none transition-colors"
                                >
                                    Delete Account
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
                                                <div className="absolute z-50 mt-1 w-full bg-dark-surface shadow-2xl max-h-80 rounded-lg py-2 text-base ring-1 ring-white/10 overflow-auto focus:outline-none sm:text-sm border border-white/10">
                                                    {filteredSkills.length > 0 ? (
                                                        filteredSkills.map((skill) => (
                                                            <div
                                                                key={skill}
                                                                className="cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-white/10 text-gray-200 transition-colors border-b border-white/5 last:border-0"
                                                                onClick={() => addSkill(skill)}
                                                            >
                                                                <span className="block truncate font-medium">{skill}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="cursor-default select-none relative py-3 pl-4 pr-9 text-gray-500 italic">
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
                {profileUser.is_system ? (
                    <div className="bg-dark-surface rounded-lg border border-white/10 p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            System Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-dark rounded border border-white/5">
                                <span className="text-gray-300">Server Uptime</span>
                                <span className="text-green-400 font-mono">99.99%</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-dark rounded border border-white/5">
                                <span className="text-gray-300">Coffee Level</span>
                                <span className="text-amber-400 font-mono">CRITICAL (Need Refill) ☕</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-dark rounded border border-white/5">
                                <span className="text-gray-300">Bugs Squashed</span>
                                <span className="text-primary font-mono">∞</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-dark rounded border border-white/5">
                                <span className="text-gray-300">World Domination Progress</span>
                                <div className="w-32 bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '1%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
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
                                        onEdit={handleEditProject}
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
                    </>
                )}
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-[#13161f] rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl border border-white/10 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-transparent rounded-md text-gray-400 hover:text-white focus:outline-none"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-bold text-white" id="modal-title">
                                        Delete Account
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-400">
                                            Are you absolutely sure you want to delete your account? This action is <span className="text-red-500 font-semibold">irreversible</span> and will permanently remove:
                                        </p>
                                        <ul className="mt-3 text-sm text-gray-400 list-disc list-inside space-y-1">
                                            <li>Your user profile and personal data</li>
                                            <li>All your projects and their content</li>
                                            <li>Messages and chat history</li>
                                            <li>Requests and notifications</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                                    onClick={handleDeleteAccount}
                                >
                                    Delete Account
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-white/10 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-gray-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Manage Access Modal */}
            {showAccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-dark-surface rounded-lg shadow-xl w-full max-w-md border border-white/10">
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">Manage Bot Access</h3>
                            <button onClick={() => setShowAccessModal(false)} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-400">Allow other users to customize this bot by adding their User ID.</p>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter User ID"
                                    value={newAccessId}
                                    onChange={(e) => setNewAccessId(e.target.value)}
                                    className="flex-1 bg-dark border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
                                />
                                <button
                                    onClick={handleAddAccess}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {botAccessList.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-2">No delegated users.</p>
                                ) : (
                                    botAccessList.map(uid => (
                                        <div key={uid} className="flex justify-between items-center bg-white/5 p-2 rounded">
                                            <span className="text-sm text-gray-300">User ID: {uid}</span>
                                            <button
                                                onClick={() => {
                                                    setUserToRemove(uid);
                                                    setShowRemoveConfirm(true);
                                                }}
                                                className="text-red-400 hover:text-red-300 p-1"
                                                title="Revoke Access"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Access Confirmation Modal */}
            {showRemoveConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-dark-surface rounded-lg shadow-xl w-full max-w-sm border border-white/10 p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Remove Access?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to remove this user? They will no longer be able to manage this bot.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRemoveConfirm(false);
                                    setUserToRemove(null);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (userToRemove) {
                                        handleRemoveAccess(userToRemove);
                                        setShowRemoveConfirm(false);
                                        setUserToRemove(null);
                                    }
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-red-500/20"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
