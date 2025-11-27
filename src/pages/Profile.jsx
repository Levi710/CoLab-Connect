import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Award, Briefcase } from 'lucide-react';

export default function Profile() {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-gray-500">Please log in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-indigo-600 h-32"></div>
                <div className="px-4 py-5 sm:px-6 relative">
                    <div className="-mt-16 mb-4">
                        {currentUser.photoURL ? (
                            <img
                                className="h-24 w-24 rounded-full border-4 border-white shadow-md inline-block"
                                src={currentUser.photoURL}
                                alt={currentUser.displayName}
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center inline-block">
                                <User className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold leading-6 text-gray-900">
                                {currentUser.displayName || 'Anonymous User'}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                {currentUser.email}
                            </p>
                        </div>
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Free Plan
                        </span>
                    </div>
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Briefcase className="h-4 w-4" /> Bio
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                Passionate about building great products and connecting with like-minded individuals.
                                (This is a placeholder bio. Edit feature coming soon!)
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Award className="h-4 w-4" /> Skills
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                <div className="flex flex-wrap gap-2">
                                    {['React', 'Tailwind CSS', 'Firebase', 'Product Management'].map((skill) => (
                                        <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
