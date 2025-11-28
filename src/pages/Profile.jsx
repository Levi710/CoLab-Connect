import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Award, Briefcase } from 'lucide-react';

export default function Profile() {
    const { currentUser, login } = useAuth(); // Re-using login to update context if needed, or we might need a dedicated update function in context
    const [isEditing, setIsEditing] = React.useState(false);
    const [bio, setBio] = React.useState('');
    const [skills, setSkills] = React.useState('');
    const [photoUrl, setPhotoUrl] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (currentUser) {
            setBio(currentUser.bio || '');
            setSkills(currentUser.skills || '');
            setPhotoUrl(currentUser.photo_url || '');
        }
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">Please log in to view your profile.</p>
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

    const handleSave = async () => {
        setLoading(true);
        try {
            // We need to import api here or use it from context if available. 
            // Assuming api is imported at top of file (it wasn't in original, need to add import)
            const { api } = await import('../api');
            const updatedUser = await api.auth.updateProfile({ bio, skills, photo_url: photoUrl });
            // Ideally update context state here. For now, a page reload or re-fetch would happen on navigation.
            // But to reflect changes immediately, we might need to update AuthContext. 
            // Since we don't have an update method in AuthContext, we'll rely on the fact that we updated the DB.
            // A reload is a simple way to sync.
            window.location.reload();
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile.');
        } finally {
            setLoading(false);
            setIsEditing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-indigo-600 h-32"></div>
                <div className="px-4 py-5 sm:px-6 relative">
                    <div className="-mt-16 mb-4">
                        {photoUrl ? (
                            <img
                                className="h-24 w-24 rounded-full border-4 border-white shadow-md inline-block object-cover"
                                src={photoUrl}
                                alt={currentUser.username}
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center inline-block">
                                <User className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                        {isEditing && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700">Change Photo</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold leading-6 text-gray-900">
                                {currentUser.username}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                {currentUser.email}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                {currentUser.is_premium ? 'Premium Plan' : 'Free Plan'}
                            </span>
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (isEditing ? 'Save Profile' : 'Edit Profile')}
                            </button>
                            {isEditing && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Briefcase className="h-4 w-4" /> Bio
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {isEditing ? (
                                    <textarea
                                        rows={4}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                    />
                                ) : (
                                    bio || <span className="text-gray-400 italic">No bio added yet.</span>
                                )}
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Award className="h-4 w-4" /> Skills
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {isEditing ? (
                                    <div>
                                        <input
                                            type="text"
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                            value={skills}
                                            onChange={(e) => setSkills(e.target.value)}
                                            placeholder="React, Node.js, Design (comma separated)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {skills ? skills.split(',').map((skill) => (
                                            <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {skill.trim()}
                                            </span>
                                        )) : <span className="text-gray-400 italic">No skills added yet.</span>}
                                    </div>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
