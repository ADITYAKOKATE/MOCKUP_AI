import React, { useState } from 'react';
import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import StrengthIndicator from './StrengthIndicator';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const SubjectsTab = ({ data }) => {
    const [sortBy, setSortBy] = useState('strength');

    if (!data || !data.hasData || !data.subjects || data.subjects.length === 0) {
        return (
            <div className="text-center py-20">
                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Subject Data Available</h3>
                <p className="text-gray-600">Take some tests to see subject-wise analysis</p>
            </div>
        );
    }

    const sortedSubjects = [...data.subjects].sort((a, b) => {
        if (sortBy === 'strength') return b.strength - a.strength;
        if (sortBy === 'accuracy') return parseFloat(b.accuracy) - parseFloat(a.accuracy);
        if (sortBy === 'attempted') return b.attempted - a.attempted;
        return 0;
    });

    // Radar chart data
    const radarData = data.subjects.map(subject => ({
        subject: subject.subject,
        strength: subject.strength,
        accuracy: parseFloat(subject.accuracy)
    }));

    return (
        <div className="space-y-6">
            {/* Header with Sort */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">Subject Performance</h2>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="strength">Sort by Strength</option>
                    <option value="accuracy">Sort by Accuracy</option>
                    <option value="attempted">Sort by Attempted</option>
                </select>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-4">Subject Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Radar name="Strength" dataKey="strength" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Subject Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedSubjects.map((subject, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-gray-900">{subject.subject}</h3>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <BookOpen size={20} className="text-blue-600" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <StrengthIndicator strength={subject.strength} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target size={14} className="text-gray-400" />
                                    <p className="text-xs font-bold text-gray-500 uppercase">Attempted</p>
                                </div>
                                <p className="text-lg font-black text-gray-900">{subject.attempted}</p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp size={14} className="text-gray-400" />
                                    <p className="text-xs font-bold text-gray-500 uppercase">Accuracy</p>
                                </div>
                                <p className="text-lg font-black text-green-600">{subject.accuracy}%</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 font-medium">Correct</p>
                                <p className="text-sm font-black text-green-600">{subject.correct}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 font-medium">Wrong</p>
                                <p className="text-sm font-black text-red-600">{subject.wrong}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 font-medium">Time</p>
                                <p className="text-sm font-black text-gray-900">{subject.avgTime}s</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubjectsTab;
