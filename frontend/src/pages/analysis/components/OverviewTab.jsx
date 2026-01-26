import React from 'react';
import { Target, TrendingUp, Clock, Award, BarChart3, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const OverviewTab = ({ data }) => {
    if (!data || !data.hasData) {
        return (
            <div className="text-center py-20">
                <BarChart3 size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Analysis Data Available</h3>
                <p className="text-gray-600">Take some tests to see your detailed performance analysis</p>
            </div>
        );
    }

    const { summary, insights, performanceTrend } = data;

    // Pie chart data
    const pieData = [
        { name: 'Correct', value: summary.totalCorrect, color: '#10b981' },
        { name: 'Wrong', value: summary.totalWrong, color: '#ef4444' }
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Target size={20} className="text-blue-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Total Attempted</h3>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{summary.totalAttempted}</p>
                    <p className="text-xs text-gray-500 mt-1">questions</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp size={20} className="text-green-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Accuracy</h3>
                    </div>
                    <p className="text-3xl font-black text-green-600">{summary.accuracy}%</p>
                    <p className="text-xs text-gray-500 mt-1">{summary.totalCorrect} correct</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Clock size={20} className="text-orange-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Time Spent</h3>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{summary.totalTimeSpent}</p>
                    <p className="text-xs text-gray-500 mt-1">minutes total</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Award size={20} className="text-purple-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Avg Time/Q</h3>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{summary.avgTimePerQuestion}s</p>
                    <p className="text-xs text-gray-500 mt-1">per question</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trend */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-4">Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={performanceTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="testNumber" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-4">Answer Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.bestSubject && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Trophy size={24} className="text-green-600" />
                            <h3 className="text-lg font-bold text-gray-900">Best Subject</h3>
                        </div>
                        <p className="text-2xl font-black text-green-600">{insights.bestSubject.name}</p>
                        <p className="text-sm text-gray-600 mt-1">Strength: {insights.bestSubject.strength}</p>
                    </div>
                )}

                {insights.worstSubject && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
                        <div className="flex items-center gap-3 mb-3">
                            <Target size={24} className="text-red-600" />
                            <h3 className="text-lg font-bold text-gray-900">Needs Improvement</h3>
                        </div>
                        <p className="text-2xl font-black text-red-600">{insights.worstSubject.name}</p>
                        <p className="text-sm text-gray-600 mt-1">Strength: {insights.worstSubject.strength}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverviewTab;
