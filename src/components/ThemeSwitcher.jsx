import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette } from 'lucide-react';

export default function ThemeSwitcher() {
    const { currentTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = React.useState(false);

    const themes = [
        { id: 'gold', color: '#BF953F', label: 'Gold' },
        { id: 'green', color: '#88B04B', label: 'Green' },
        { id: 'blue', color: '#6495ED', label: 'Blue' },
        { id: 'purple', color: '#9370DB', label: 'Purple' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                title="Change Theme"
            >
                <Palette className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-[#13161f] rounded-xl shadow-xl border border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="text-xs font-medium text-gray-400 px-2 py-1 mb-2">Select Theme</div>
                        <div className="grid grid-cols-4 gap-2 px-2 pb-2">
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        setTheme(theme.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${currentTheme === theme.id ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                                    style={{ backgroundColor: theme.color }}
                                    title={theme.label}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
