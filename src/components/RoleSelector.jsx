import React, { useState, useMemo } from 'react';
import { Search, X, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import projectRoles from '../data/projectRoles.json';

export default function RoleSelector({ selectedRoles = [], onChange, maxSelections = 10 }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState('frontendDevelopment'); // Default open
    const [showAllCategories, setShowAllCategories] = useState(true);

    // Flatten roles for search
    const allRoles = useMemo(() => {
        const roles = [];
        Object.entries(projectRoles.skills).forEach(([category, skills]) => {
            skills.forEach(skill => {
                roles.push({ ...skill, category });
            });
        });
        return roles;
    }, []);

    const filteredRoles = useMemo(() => {
        if (!searchTerm) return null;
        return allRoles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase())
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

    const formatCategoryName = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
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
                        {filteredRoles.length > 0 ? (
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
                            <p className="text-gray-500 italic text-sm">No roles found matching "{searchTerm}"</p>
                        )}
                    </div>
                ) : (
                    // Categories
                    Object.entries(projectRoles.skills).map(([category, skills]) => (
                        <div key={category} className="border border-white/5 rounded-lg overflow-hidden bg-black/20">
                            <button
                                type="button"
                                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-gray-200">{formatCategoryName(category)}</span>
                                {expandedCategory === category ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                            </button>

                            {expandedCategory === category && (
                                <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {skills.map((skill, idx) => (
                                        <button
                                            key={`${skill.name}-${idx}`}
                                            type="button"
                                            onClick={() => handleToggleRole(skill.name)}
                                            disabled={!selectedRoles.includes(skill.name) && selectedRoles.length >= maxSelections}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${selectedRoles.includes(skill.name)
                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                                                } ${!selectedRoles.includes(skill.name) && selectedRoles.length >= maxSelections ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span>{skill.name}</span>
                                                <span className="text-[10px] text-gray-500">{skill.level}</span>
                                            </div>
                                            {selectedRoles.includes(skill.name) && <Check className="h-4 w-4" />}
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
