import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="bg-[#13161f] rounded-lg border border-white/5 p-6 animate-pulse h-full">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-10 w-10 bg-white/10 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 w-3/4 bg-white/10 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-3 w-full bg-white/10 rounded"></div>
                            <div className="h-3 w-full bg-white/10 rounded"></div>
                            <div className="h-3 w-2/3 bg-white/10 rounded"></div>
                        </div>
                        <div className="h-32 bg-white/5 rounded-lg mb-4"></div>
                        <div className="flex justify-between mt-4">
                            <div className="h-8 w-20 bg-white/10 rounded"></div>
                            <div className="h-8 w-20 bg-white/10 rounded"></div>
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="animate-pulse">
                        <div className="h-48 bg-white/10 w-full mb-8"></div>
                        <div className="container mx-auto px-4 -mt-20">
                            <div className="flex flex-col md:flex-row items-end md:items-end gap-6 mb-8">
                                <div className="h-32 w-32 rounded-full bg-white/10 border-4 border-[#0b0f19]"></div>
                                <div className="flex-1 mb-4 space-y-2">
                                    <div className="h-8 w-48 bg-white/10 rounded"></div>
                                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="h-64 bg-[#13161f] rounded-lg border border-white/5"></div>
                                </div>
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="h-40 bg-[#13161f] rounded-lg border border-white/5"></div>
                                    <div className="h-40 bg-[#13161f] rounded-lg border border-white/5"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'list':
                return (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 bg-[#13161f] rounded-lg border border-white/5">
                                <div className="h-12 w-12 bg-white/10 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-white/10 rounded"></div>
                                    <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return <div className="h-20 w-full bg-white/10 rounded animate-pulse"></div>;
        }
    };

    return (
        <>
            {Array(count).fill(0).map((_, index) => (
                <React.Fragment key={index}>
                    {renderSkeleton()}
                </React.Fragment>
            ))}
        </>
    );
};

export default SkeletonLoader;
