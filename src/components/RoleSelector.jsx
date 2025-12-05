import React, { useState, useMemo } from 'react';
import { Search, X, Check, ChevronDown, ChevronUp, AlertCircle, Plus } from 'lucide-react';
import projectRoles from '../data/projectRoles.json';
import { useToast } from '../context/ToastContext';

export default function RoleSelector({ selectedRoles = [], onChange, maxSelections = 10 }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState('Technology & Data');
    const { addToast } = useToast();

    // Flatten roles for search
    const allRoles = useMemo(() => {
        const roles = [];
        projectRoles.jobRoles.forEach(categoryGroup => {
            categoryGroup.roles.forEach(role => {
                roles.push({ name: role, category: categoryGroup.category });
            });
        });
        return roles;
    }, []);

    const filteredRoles = useMemo(() => {
        if (!searchTerm.trim()) return null;
        return allRoles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [searchTerm, allRoles]);

    const handleToggleRole = (roleName) => {
        if (selectedRoles.includes(roleName)) {
            onChange(selectedRoles.filter(r => r !== roleName));
        } else {
            if (selectedRoles.length >= maxSelections) return;
            onChange([...selectedRoles, roleName]);
        }
    };

    const handleAddCustomRole = () => {
        const trimmedTerm = searchTerm.trim();
        if (!trimmedTerm) return;

        // Check if already selected
        if (selectedRoles.includes(trimmedTerm)) {
            setSearchTerm('');
            return;
        }

        if (selectedRoles.length >= maxSelections) {
            addToast(`Maximum ${maxSelections} roles allowed`, 'error');
            return;
        }

        // Add to selection directly
        onChange([...selectedRoles, trimmedTerm]);
        setSearchTerm('');
        addToast(`Added custom role: "${trimmedTerm}"`, 'success');
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Search roles (e.g. React, Python)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredRoles?.length === 0 && searchTerm.trim()) {
                                handleAddCustomRole();
                            }
                        }
                    }}
                />
            </div>

            {/* Selected Roles Chips */}
            {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-lg border border-white/5">
                    {selectedRoles.map(role => (
                        <span key={role} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 animate-fadeIn">
                            {role}
                            <button
                                type="button"
                                onClick={() => handleToggleRole(role)}
                                className="ml-1.5 inline-flex items-center justify-center text-primary hover:text-white focus:outline-none"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <span className="text-xs text-gray-500 flex items-center ml-auto">
                        {selectedRoles.length}/{maxSelections} selected
                    </span>
                </div>
            )}

            {/* Selection Limit Warning */}
            {selectedRoles.length >= maxSelections && (
                <div className="flex items-center gap-2 text-amber-500 text-sm bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <span>Maximum {maxSelections} roles selected. Remove some to add others.</span>
                </div>
            )}

            {/* Roles List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {searchTerm ? (
                    // Search Results
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Search Results</h4>
                        {filteredRoles && filteredRoles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredRoles.map((role, idx) => (
                                    <button
                                        key={`${role.name}-${idx}`}
                                        type="button"
                                        onClick={() => handleToggleRole(role.name)}
                                        disabled={!selectedRoles.includes(role.name) && selectedRoles.length >= maxSelections}
                                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${selectedRoles.includes(role.name)
                                                ? 'bg-primary/20 text-primary border border-primary/30'
                                                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                                            } ${!selectedRoles.includes(role.name) && selectedRoles.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{role.name}</span>
                                        {selectedRoles.includes(role.name) && <Check className="h-4 w-4" />}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">
                                <p className="text-gray-400 text-sm mb-2">No roles found matching "{searchTerm}"</p>
                                <button
                                    type="button"
                                    onClick={handleAddCustomRole}
                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-full border border-primary/20 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add "{searchTerm}"
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Categories
                    projectRoles.jobRoles.map((categoryGroup) => (
                        <div key={categoryGroup.category} className="border border-white/5 rounded-lg overflow-hidden bg-black/20">
                            <button
                                type="button"
                                onClick={() => setExpandedCategory(expandedCategory === categoryGroup.category ? null : categoryGroup.category)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-gray-200">{categoryGroup.category}</span>
                                {expandedCategory === categoryGroup.category ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                            </button>

                            {expandedCategory === categoryGroup.category && (
                                <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {categoryGroup.roles.map((role, idx) => (
                                        <button
                                            key={`${role}-${idx}`}
                                            type="button"
                                            onClick={() => handleToggleRole(role)}
                                            disabled={!selectedRoles.includes(role) && selectedRoles.length >= maxSelections}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${selectedRoles.includes(role)
                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                                                } ${!selectedRoles.includes(role) && selectedRoles.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span>{role}</span>
                                            {selectedRoles.includes(role) && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
