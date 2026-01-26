import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const SubjectBreakdownWidget = ({ subjects }) => {
    if (!subjects || subjects.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-4">Subject Performance</h3>
                <div className="text-center py-12 text-gray-400">
                    <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No subject data available</p>
                    <p className="text-xs mt-1">Complete tests to see your performance breakdown</p>
                </div>
            </div>
        );
    }

    const getSubjectColor = (index) => {
        const colors = [
            { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
            { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' },
            { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-600' },
            { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
            { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
        ];
        return colors[index % colors.length];
    };

    const maxAttempted = Math.max(...subjects.map(s => s.attempted), 1);

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                        <BarChart3 size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Subject Performance</h3>
                        <p className="text-xs text-gray-500 font-medium">Your strengths across subjects</p>
                    </div>
                </div>
            </div>

            {/* Subject Bars */}
            <div className="space-y-4">
                {subjects.map((subject, index) => {
                    const colors = getSubjectColor(index);
                    const widthPercentage = (subject.attempted / maxAttempted) * 100;
                    const accuracyNum = parseFloat(subject.accuracy);

                    return (
                        <div key={index} className="group">
                            {/* Subject Name and Stats */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 ${colors.bg} rounded-full`}></div>
                                    <span className="text-sm font-bold text-gray-900">{subject.subject}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-xs text-gray-500 font-medium">Accuracy: </span>
                                        <span className={`text-sm font-black ${accuracyNum >= 80 ? 'text-green-600' :
                                            accuracyNum >= 60 ? 'text-blue-600' :
                                                accuracyNum >= 40 ? 'text-orange-600' :
                                                    'text-red-600'
                                            }`}>
                                            {subject.accuracy}%
                                        </span>
                                    </div>
                                    {subject.strength !== null && (
                                        <div className={`px-2.5 py-1 ${colors.light} ${colors.text} rounded-lg text-xs font-bold`}>
                                            {subject.strength} pts
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group-hover:border-gray-200 transition-all">
                                {/* Accuracy Bar */}
                                <div
                                    className={`absolute inset-y-0 left-0 ${colors.bg} opacity-90 transition-all duration-500 ease-out`}
                                    style={{ width: `${accuracyNum}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                                </div>

                                {/* Stats Overlay */}
                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                        <span className={`${subject.attempted > 0 ? 'text-white' : 'text-gray-400'} drop-shadow-md`}>
                                            {subject.attempted > 0 ? `${subject.correct}/${subject.attempted} correct` : 'No attempts yet'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-gray-600">
                                        {subject.attempted} questions
                                    </div>
                                </div>
                            </div>

                            {/* Additional Stats */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {subject.attempted > 0 && (
                                    <>
                                        <span>Correct: <span className="font-bold text-green-600">{subject.correct}</span></span>
                                        <span>Wrong: <span className="font-bold text-red-600">{subject.wrong}</span></span>
                                        {subject.totalUnattempted !== undefined && subject.totalUnattempted > 0 && (
                                            <span>Unattempted: <span className="font-bold text-gray-600">{subject.totalUnattempted}</span></span>
                                        )}
                                    </>
                                )}
                                {parseFloat(subject.avgTime) > 0 && (
                                    <span>Avg Time: <span className="font-bold text-gray-700">{subject.avgTime}s</span></span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

export default SubjectBreakdownWidget;
