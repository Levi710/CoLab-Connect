import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CreateProject() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Tech',
        status: 'Idea',
        lookingFor: '',
        pollQuestion: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.projects.create(formData);
            // Redirect to dashboard or home
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Failed to create project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                    <h1 className="text-2xl font-bold text-white">Pitch Your Project</h1>
                    <p className="text-indigo-100 mt-1">Share your vision and find the perfect team.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Project Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., EcoTrack - Carbon Footprint AI"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows="4"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Describe your project, its goals, and why it matters..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Current Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                        <label htmlFor="lookingFor" className="block text-sm font-medium text-gray-700 mb-1">
                            Who are you looking for?
                        </label>
                        <input
                            type="text"
                            id="lookingFor"
                            name="lookingFor"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., React Developer, UI Designer, Marketing Lead"
                            value={formData.lookingFor}
                            onChange={handleChange}
                        />
                        <p className="mt-1 text-xs text-gray-500">Separate roles with commas.</p>
                    </div>

                    {/* Poll Question */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <label htmlFor="pollQuestion" className="block text-sm font-medium text-indigo-900 mb-1">
                            Add a Poll (Optional)
                        </label>
                        <p className="text-xs text-indigo-700 mb-2">Engage the community by asking a question.</p>
                        <input
                            type="text"
                            id="pollQuestion"
                            name="pollQuestion"
                            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Would you use this feature?"
                            value={formData.pollQuestion}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Publishing...' : 'Publish Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
