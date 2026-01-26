import React from 'react';
import { Flame, Trophy, Calendar } from 'lucide-react';

const StudyStreakWidget = ({ streakData }) => {
    if (!streakData) return null;

    const { current, longest, lastStudyDate } = streakData;

    const getStreakColor = (days) => {
        if (days === 0) return 'from-gray-400 to-gray-500';
        if (days < 3) return 'from-orange-400 to-orange-500';
        if (days < 7) return 'from-orange-500 to-red-500';
        if (days < 14) return 'from-red-500 to-pink-500';
        return 'from-purple-500 to-pink-600';
    };

    const getStreakMessage = (days) => {
        if (days === 0) return 'Start your streak today!';
        if (days === 1) return 'Great start! Keep it going!';
        if (days < 7) return 'Building momentum!';
        if (days < 14) return 'On fire! 🔥';
        if (days < 30) return 'Unstoppable! 🚀';
        return 'Legendary streak! 👑';
    };

    return (
        <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl p-6 border border-orange-100 shadow-sm relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-red-400 to-orange-500 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 bg-gradient-to-br ${getStreakColor(current)} rounded-xl shadow-lg`}>
                        <Flame size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Study Streak</h3>
                        <p className="text-xs text-gray-600 font-medium">{getStreakMessage(current)}</p>
                    </div>
                </div>

                {/* Streak Stats */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Current Streak */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame size={16} className="text-orange-500" />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Current</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-900">{current}</span>
                            <span className="text-sm font-bold text-gray-500">days</span>
                        </div>
                    </div>

                    {/* Longest Streak */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy size={16} className="text-purple-500" />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Best</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-900">{longest}</span>
                            <span className="text-sm font-bold text-gray-500">days</span>
                        </div>
                    </div>
                </div>

                {/* Last Study Date */}
                {lastStudyDate && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                        <Calendar size={14} />
                        <span>Last studied: <span className="font-bold">{new Date(lastStudyDate).toLocaleDateString()}</span></span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyStreakWidget;
