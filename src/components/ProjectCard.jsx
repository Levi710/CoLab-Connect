import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Star, Users, X } from 'lucide-react';

export default function ProjectCard({ project, isFeatured, isSponsored, isOwner }) {
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [note, setNote] = useState('');

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            const { api } = await import('../api');
            await api.requests.create({
                projectId: project.id,
                role: 'Collaborator', // Default role or add a selector
                note: note
            });
            alert('Application sent successfully!');
            setShowApplyModal(false);
            setNote('');
        } catch (error) {
            console.error('Failed to apply:', error);
            alert('Failed to send application. Please try again.');
        }
    };

    return (
        <>
            <div className={`bg-white rounded-xl shadow-sm overflow-hidden border ${isSponsored ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'} hover:shadow-md transition-shadow duration-200`}>
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            {isSponsored && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
                                    Featured
                                </span>
                            )}
                            {isFeatured && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-2 ml-2">
                                    Project of the Month
                                </span>
                            )}
                            <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{project.category} • {project.status}</p>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400">
                            <Star className={`h-5 w-5 ${isFeatured ? 'text-amber-400 fill-current' : ''}`} />
                        </div>
                    </div>

                    <p className="mt-4 text-gray-600 line-clamp-3">{project.description}</p>

                    <div className="mt-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Looking For</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {project.lookingFor.split(',').map((role, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {role.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {project.pollQuestion && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-gray-700 mb-2">Poll: {project.pollQuestion}</p>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-50">Yes</button>
                                <button className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-50">No</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                    <div className="flex space-x-4 text-sm text-gray-500">
                        <span className="flex items-center"><ThumbsUp className="h-4 w-4 mr-1" /> {project.likes || 0}</span>
                        <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {project.impressions || 0}</span>
                    </div>
                    {!isOwner && (
                        <button
                            onClick={() => setShowApplyModal(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            I'm Interested
                        </button>
                    )}
                    {isOwner && (
                        <span className="text-xs text-gray-400 italic">Your Project</span>
                    )}
                </div>
            </div>

            {showApplyModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowApplyModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => setShowApplyModal(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Apply to {project.title}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Let the host know why you're a good fit for this project.
                                        </p>
                                        <textarea
                                            rows={4}
                                            className="mt-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                                            placeholder="I'm a React developer with 3 years of experience..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleApply}
                                >
                                    Send Request
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowApplyModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
