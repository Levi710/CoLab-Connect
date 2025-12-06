import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
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
        category: 'Technology',
        status: 'Idea',
        lookingFor: '',
        pollQuestion: '',
        polls: [],
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
                polls: editingProject.polls || [],
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

        if (formData.memberLimit < 2) {
            addToast('Team size limit must be at least 2.', 'error');
            return;
        }

        if (formData.polls && formData.polls.length > 0) {
            for (const poll of formData.polls) {
                if (!poll.question || !poll.question.trim()) {
                    addToast('Poll questions cannot be empty.', 'error');
                    return;
                }
                const validOptions = poll.options.filter(opt => opt.text && opt.text.trim());
                if (validOptions.length < 2) {
                    addToast('Each poll must have at least 2 valid options.', 'error');
                    return;
                }
            }
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
                                <option value="Technology">Technology</option>
                                <option value="Social Impact">Social Impact</option>
                                <option value="Art">Art</option>
                                <option value="Education">Education</option>
                                <option value="Business">Business</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Design">Design</option>
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
                            min="2"
                            max="1000"
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

                    {/* Advanced Poll Builder */}
                    <div className="border-t border-white/10 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Poll Builder</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    if ((formData.polls || []).length >= 3) {
                                        addToast('You can add a maximum of 3 polls.', 'error');
                                        return;
                                    }
                                    setFormData(prev => ({
                                        ...prev,
                                        polls: [...(prev.polls || []), { question: '', options: [{ text: '', votes: 0 }, { text: '', votes: 0 }] }]
                                    }));
                                }}
                                className="text-sm text-primary hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Poll
                            </button>
                        </div>

                        {formData.polls && formData.polls.map((poll, pIndex) => (
                            <div key={pIndex} className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-medium text-gray-400">Question {pIndex + 1}</label>
                                            <span className="text-[10px] text-gray-500">{poll.question.length}/100</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={poll.question}
                                            maxLength={100}
                                            onChange={(e) => {
                                                const newPolls = [...formData.polls];
                                                newPolls[pIndex].question = e.target.value;
                                                setFormData(prev => ({ ...prev, polls: newPolls }));
                                            }}
                                            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-primary text-sm"
                                            placeholder="Ask a question..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newPolls = formData.polls.filter((_, i) => i !== pIndex);
                                            setFormData(prev => ({ ...prev, polls: newPolls }));
                                        }}
                                        className="text-gray-500 hover:text-red-500 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2 pl-4 border-l-2 border-white/5">
                                    {poll.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                                            <input
                                                type="text"
                                                value={option.text}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    const newPolls = [...formData.polls];
                                                    newPolls[pIndex].options[oIndex].text = e.target.value;
                                                    setFormData(prev => ({ ...prev, polls: newPolls }));
                                                }}
                                                className="flex-1 px-3 py-1.5 bg-black/20 border border-white/10 rounded-md text-white placeholder-gray-600 focus:border-primary text-xs"
                                                placeholder={`Option ${oIndex + 1} (max 50 chars)`}
                                            />
                                            {poll.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPolls = [...formData.polls];
                                                        newPolls[pIndex].options = poll.options.filter((_, i) => i !== oIndex);
                                                        setFormData(prev => ({ ...prev, polls: newPolls }));
                                                    }}
                                                    className="text-gray-600 hover:text-red-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (poll.options.length >= 5) {
                                                addToast('You can add a maximum of 5 options per poll.', 'error');
                                                return;
                                            }
                                            const newPolls = [...formData.polls];
                                            newPolls[pIndex].options.push({ text: '', votes: 0 });
                                            setFormData(prev => ({ ...prev, polls: newPolls }));
                                        }}
                                        className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 mt-2"
                                    >
                                        <Plus className="w-3 h-3" /> Add Option
                                    </button>
                                </div>
                            </div>
                        ))}
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
