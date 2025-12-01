import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-400" />,
        error: <AlertCircle className="h-5 w-5 text-red-400" />,
        info: <Info className="h-5 w-5 text-blue-400" />
    };

    const styles = {
        success: "bg-dark-surface border-green-500/20",
        error: "bg-dark-surface border-red-500/20",
        info: "bg-dark-surface border-blue-500/20"
    };

    return (
        <div className={`flex items-center p-4 mb-3 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-in ${styles[type] || styles.info} min-w-[300px]`}>
            <div className="flex-shrink-0 mr-3">
                {icons[type] || icons.info}
            </div>
            <div className="flex-1 text-sm font-medium text-white">
                {message}
            </div>
            <button onClick={onClose} className="ml-3 text-gray-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
