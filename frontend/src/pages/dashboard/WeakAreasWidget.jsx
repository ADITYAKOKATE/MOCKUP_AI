import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, BookOpen } from 'lucide-react';

const WeakAreasWidget = ({ weakAreas }) => {
    const navigate = useNavigate();
    if (!weakAreas || weakAreas.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-4">Areas to Improve</h3>
                <div className="text-center py-8 text-gray-400">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No weak areas identified yet</p>
                    <p className="text-xs mt-1">Take more tests to get personalized insights</p>
                </div>
            </div>
        );
    }

    const getStrengthColor = (strength) => {
        if (strength === null) return 'bg-gray-200';
        if (strength < 30) return 'bg-red-500';
        if (strength < 50) return 'bg-orange-500';
        return 'bg-yellow-500';
    };

    const getStrengthLabel = (strength) => {
        if (strength === null) return 'Not Attempted';
        if (strength < 30) return 'Critical';
        if (strength < 50) return 'Needs Work';
        return 'Improving';
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-red-50 rounded-xl">
                    <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-gray-900">Areas to Improve</h3>
                    <p className="text-xs text-gray-500 font-medium">Focus on these topics</p>
                </div>
            </div>

            {/* Weak Areas List - Limited to 3 with fade effect */}
            <div className="relative">
                <div className="space-y-3">
                    {weakAreas.slice(0, 3).map((area, index) => (
                        <div
                            key={index}
                            className="group bg-gradient-to-r from-red-50/50 to-transparent hover:from-red-50 rounded-xl p-4 border border-red-100 hover:border-red-200 transition-all duration-200"
                        >
                            {/* Topic Name and Badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">{area.topic}</h4>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white ${getStrengthColor(area.strength)}`}>
                                        {getStrengthLabel(area.strength)}
                                    </span>
                                </div>
                                {area.strength !== null && (
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-red-600">{area.strength}</div>
                                        <div className="text-xs text-gray-500 font-medium">strength</div>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-red-100">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Attempted</p>
                                    <p className="text-sm font-black text-gray-900">{area.attempted}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Correct</p>
                                    <p className="text-sm font-black text-green-600">{area.correct}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Accuracy</p>
                                    <p className="text-sm font-black text-gray-900">{area.accuracy}%</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {area.strength !== null && (
                                <div className="mt-3">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getStrengthColor(area.strength)} transition-all duration-500`}
                                            style={{ width: `${area.strength}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Fade overlay if more than 3 items */}
                {weakAreas.length > 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none rounded-b-xl"></div>
                )}
            </div>

            {/* Action Button */}
            <button
                onClick={() => navigate('/ai-recommendations?tab=topic')}
                className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-200/50 transition-all duration-200 active:scale-95"
            >
                Practice Weak Topics
            </button>
        </div>
    );
};

export default WeakAreasWidget;
