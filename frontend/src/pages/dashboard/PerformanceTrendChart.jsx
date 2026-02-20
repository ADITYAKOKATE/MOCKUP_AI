import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Activity, Layers } from 'lucide-react';

const PerformanceTrendChart = ({ trendData }) => {
    const [viewMode, setViewMode] = useState('overall'); // 'overall' | 'subject'

    if (!trendData || trendData.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp size={32} className="text-blue-500 opacity-50" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Performance Trend</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                    Complete more tests to unlock detailed performance analytics and trend visualization.
                </p>
            </div>
        );
    }

    // Extract all unique subjects for the lines
    const allSubjects = [...new Set(trendData.flatMap(d => Object.keys(d.subjects || {})))];

    // Color palette for subjects
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl z-50">
                    <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-xs text-gray-500 capitalize">{entry.name}:</span>
                            <span className="text-xs font-bold text-gray-900">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        Performance Trend
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-100">
                            +12% vs last week
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500">Track your improvement over time</p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setViewMode('overall')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'overall'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Activity size={14} />
                        Test Wise
                    </button>
                    <button
                        onClick={() => setViewMode('subject')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'subject'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Layers size={14} />
                        Subject Wise
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div style={{ width: '100%', height: 300, minWidth: 0, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'overall' ? (
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis
                                dataKey="id"
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `Test ${value}`}
                            />
                            <YAxis
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="score"
                                name="Score"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                            />
                        </AreaChart>
                    ) : (
                        <BarChart
                            data={trendData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barGap={2}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis
                                dataKey="id"
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `Test ${value}`}
                            />
                            <YAxis
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                            {allSubjects.map((subject, index) => (
                                <Bar
                                    key={subject}
                                    dataKey={(d) => d.subjects[subject] || 0}
                                    name={subject}
                                    fill={colors[index % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            ))}
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceTrendChart;
