import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import RoleSelector from '../components/RoleSelector';

export default function CreateProject() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const location = useLocation();
    const editingProject = location.state?.project;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Tech',
        status: 'Idea',
        lookingFor: '',
        pollQuestion: '',
        memberLimit: 5,
        images: []
    });

    useEffect(() => {
        if (editingProject) {
            setFormData({
                title: editingProject.title || '',
                description: editingProject.description || '',
                category: editingProject.category || 'Tech',
                status: editingProject.status || 'Idea',
                lookingFor: editingProject.lookingFor || editingProject.looking_for || '',
                pollQuestion: editingProject.pollQuestion || editingProject.poll_question || '',
                memberLimit: editingProject.member_limit || 5,
                images: editingProject.images || []
            });
        }
    }, [editingProject]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxImages = currentUser?.is_premium ? 10 : 5;
        const currentCount = formData.images.length;

        if (currentCount + files.length > maxImages) {
            addToast(`You can only upload up to ${maxImages} images. ${currentUser?.is_premium ? '' : 'Upgrade to Premium for more!'}`, 'error');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, reader.result]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            addToast('Please login to create a project', 'error');
            return;
        }

        if (!formData.lookingFor.trim()) {
            addToast('Please specify who you are looking for', 'error');
            return;
        }

        setLoading(true);
        try {
            if (editingProject) {
                await api.projects.update(editingProject.id, formData);
                addToast('Project updated successfully!', 'success');
            } else {
                await api.projects.create(formData);
                addToast('Project created successfully!', 'success');
            }
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to save project:', err);
            addToast(err.message || 'Failed to save project. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-[#13161f] rounded-2xl shadow-xl overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-primary to-secondary px-8 py-6">
                    <h1 className="text-2xl font-bold text-white">Pitch Your Project</h1>
                    <p className="text-white/80 mt-1">Share your vision and find the perfect team.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                Project Title
                            </label>
                            <span className="text-xs text-gray-500">{formData.title.length}/50</span>
                        </div>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            maxLength={50}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="e.g., EcoTrack - Carbon Footprint AI"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                                Description
                            </label>
                            <span className="text-xs text-gray-500">{formData.description.length}/1000</span>
                        </div>
                        <textarea
                            id="description"
                            name="description"
                            rows="4"
                            required
                            maxLength={1000}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="Describe your project, its goals, and why it matters..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors [&>option]:bg-gray-900"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="Tech">Tech</option>
                                <option value="Social Impact">Social Impact</option>
                                <option value="Art">Art</option>
                                <option value="Education">Education</option>
                                <option value="Business">Business</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                                Current Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors [&>option]:bg-gray-900"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Idea">Just an Idea</option>
                                <option value="Prototype">Prototype Ready</option>
                                <option value="In Progress">In Development</option>
                                <option value="Launched">Launched</option>
                            </select>
                        </div>
                    </div>

                    {/* Looking For */}
                    <div>
                        <label htmlFor="lookingFor" className="block text-sm font-medium text-gray-300 mb-1">
                            Who are you looking for? <span className="text-red-500">*</span>
                        </label>
                        <RoleSelector
                            selectedRoles={formData.lookingFor ? formData.lookingFor.split(',').map(s => s.trim()).filter(Boolean) : []}
                            onChange={(roles) => {
                                setFormData(prev => ({
                                    ...prev,
                                    lookingFor: roles.join(', ')
                                }));
                            }}
                            maxSelections={10}
                        />
                        <p className="mt-2 text-xs text-gray-500">Select up to 10 roles.</p>
                    </div>

                    {/* Member Limit */}
                    <div>
                        <label htmlFor="memberLimit" className="block text-sm font-medium text-gray-300 mb-1">
                            Team Size Limit
                        </label>
                        <input
                            type="number"
                            id="memberLimit"
                            name="memberLimit"
                            min="1"
                            max="50"
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            value={formData.memberLimit}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Project Images ({formData.images.length}/{currentUser?.is_premium ? 10 : 5})
                        </label>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {formData.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group border border-white/10">
                                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {formData.images.length < (currentUser?.is_premium ? 10 : 5) && (
                                <label className="border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all aspect-video">
                                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-400">Upload Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Supported formats: JPG, PNG, GIF. Max 5MB per file.
                        </p>
                    </div>

                    {/* Poll Question (Optional) */}
                    <div>
                        <label htmlFor="pollQuestion" className="block text-sm font-medium text-gray-300 mb-1">
                            Poll Question (Optional)
                        </label>
                        <input
                            type="text"
                            id="pollQuestion"
                            name="pollQuestion"
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="e.g., What feature should we build next?"
                            value={formData.pollQuestion}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 text-gray-400 hover:text-white font-medium transition-colors mr-4"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-2 rounded-lg font-bold hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                'Launch Project'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
