import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Poll({ pollData }) {
    // Local state to track votes for this session
    // In a real app, this would come from the backend
    const [polls, setPolls] = useState(pollData || []);
    const [voted, setVoted] = useState({});

    if (!polls || polls.length === 0) return null;

    const handleVote = (questionIndex, optionIndex) => {
        if (voted[questionIndex]) return;

        const updatedPolls = [...polls];
        updatedPolls[questionIndex].options[optionIndex].votes += 1;
        setPolls(updatedPolls);
        setVoted(prev => ({ ...prev, [questionIndex]: true }));
    };

    const calculatePercentage = (votes, totalVotes) => {
        if (totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    return (
        <div className="space-y-6">
            {polls.map((poll, qIndex) => {
                const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.votes || 0), 0);
                const hasVoted = voted[qIndex];

                return (
                    <div key={qIndex} className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">{poll.question}</h3>
                        <div className="space-y-3">
                            {poll.options.map((option, oIndex) => {
                                const percentage = calculatePercentage(option.votes || 0, totalVotes);
                                return (
                                    <div key={oIndex} className="relative group">
                                        {/* Result Background Bar */}
                                        {hasVoted && (
                                            <div
                                                className="absolute inset-0 bg-primary/20 rounded-lg transition-all duration-500 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        )}

                                        <button
                                            onClick={() => handleVote(qIndex, oIndex)}
                                            disabled={hasVoted}
                                            className={`relative w-full flex items-center justify-between p-3 rounded-lg border transition-all ${hasVoted
                                                    ? 'border-transparent cursor-default'
                                                    : 'bg-black/20 border-white/10 hover:bg-white/10 hover:border-primary/30 text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 z-10">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${hasVoted
                                                        ? 'border-primary/50'
                                                        : 'border-gray-500 group-hover:border-primary'
                                                    }`}>
                                                    {hasVoted && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <span className="font-medium text-sm text-white">{option.text}</span>
                                            </div>

                                            {hasVoted && (
                                                <div className="flex items-center gap-2 z-10">
                                                    <span className="text-xs font-bold text-primary">{percentage}%</span>
                                                    <span className="text-xs text-gray-400">({option.votes || 0})</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 text-right">
                            {totalVotes} votes • {hasVoted ? 'Voted' : 'Select an option to vote'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
