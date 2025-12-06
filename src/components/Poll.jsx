import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function Poll({ pollData }) {
    // Polls now includes 'user_voted_option' (option_id/index) if signed in
    const [polls, setPolls] = useState(pollData || []);
    const [voted, setVoted] = useState({});

    // Initialize voted state from props
    useEffect(() => {
        if (pollData) {
            setPolls(pollData);
            const initialVoted = {};
            pollData.forEach((poll, index) => {
                if (poll.user_voted_option !== undefined && poll.user_voted_option !== null) {
                    initialVoted[index] = poll.user_voted_option;
                }
            });
            setVoted(initialVoted);
        }
    }, [pollData]);

    if (!polls || polls.length === 0) return null;

    const handleVote = async (questionIndex, optionIndex) => {
        const poll = polls[questionIndex];

        // Optimistic UI Update
        const previousVoted = { ...voted };
        const previousPolls = JSON.parse(JSON.stringify(polls));

        try {
            // Apply optimistic change
            const updatedPolls = [...polls];
            const currentVote = voted[questionIndex];

            // Revert/Unvote
            if (currentVote === optionIndex) {
                updatedPolls[questionIndex].options[optionIndex].votes -= 1;
                setVoted(prev => {
                    const newState = { ...prev };
                    delete newState[questionIndex];
                    return newState;
                });
            } else {
                // Switch or New Vote
                if (currentVote !== undefined) {
                    updatedPolls[questionIndex].options[currentVote].votes -= 1;
                }
                updatedPolls[questionIndex].options[optionIndex].votes += 1;
                setVoted(prev => ({ ...prev, [questionIndex]: optionIndex }));
            }
            setPolls(updatedPolls);

            // API Call
            await api.polls.vote(poll.id, optionIndex);
        } catch (err) {
            console.error('Vote failed:', err);
            // Revert state on error
            setVoted(previousVoted);
            setPolls(previousPolls);
        }
    };

    const calculatePercentage = (votes, totalVotes) => {
        if (totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    return (
        <div className="space-y-6">
            {polls.map((poll, qIndex) => {
                const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.votes || 0), 0);
                const userVoteIndex = voted[qIndex];
                const hasVoted = userVoteIndex !== undefined;

                return (
                    <div key={qIndex} className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-4">{poll.question}</h3>
                        <div className="space-y-3">
                            {poll.options.map((option, oIndex) => {
                                const percentage = calculatePercentage(option.votes || 0, totalVotes);
                                const isSelected = userVoteIndex === oIndex;

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
                                            className={`relative w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'bg-black/20 border-white/10 hover:bg-white/10 hover:border-primary/30 text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 z-10">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected
                                                    ? 'border-primary'
                                                    : 'border-gray-500 group-hover:border-primary'
                                                    }`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
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
