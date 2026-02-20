import React from 'react';
import { CheckCircle, XCircle, MinusCircle, Clock, Trophy, Target, BarChart2, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TestResults = ({ results, onBack }) => {
    if (!results) return null;

    const {
        score,
        totalMarks,
        accuracy,
        percentage,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        totalQuestions,
        subjectWise,
        totalTimeTaken,
        proctoringLogs // Add this
    } = results;

    // Data for Pie Chart
    const pieData = [
        { name: 'Correct', value: totalCorrect, color: '#16a34a' },
        { name: 'Wrong', value: totalWrong, color: '#dc2626' },
        { name: 'Unattempted', value: totalUnattempted, color: '#9ca3af' }
    ];

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Test Analysis</h1>
                            <p className="text-gray-500 font-medium">Detailed performance report for your full length test</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={onBack}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Back to Tests
                            </button>
                        </div>
                    </div>
                </div>

                {/* Score Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Score */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                            <Trophy size={28} />
                        </div>
                        <div className="text-4xl font-black text-gray-900 mb-1">
                            {score} <span className="text-lg text-gray-400 font-bold">/ {totalMarks}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-500">Total Score</div>
                    </div>

                    {/* Percentage */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-full mb-3">
                            <Target size={28} />
                        </div>
                        <div className="text-4xl font-black text-gray-900 mb-1">{percentage}%</div>
                        <div className="text-sm font-semibold text-gray-500">Percentage</div>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-green-50 text-green-600 rounded-full mb-3">
                            <CheckCircle size={28} />
                        </div>
                        <div className="text-4xl font-black text-gray-900 mb-1">{accuracy}%</div>
                        <div className="text-sm font-semibold text-gray-500">Accuracy</div>
                    </div>

                    {/* Time Taken */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-full mb-3">
                            <Clock size={28} />
                        </div>
                        <div className="text-2xl font-black text-gray-900 mb-1">{formatTime(totalTimeTaken)}</div>
                        <div className="text-sm font-semibold text-gray-500">Time Taken</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Chart Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart2 size={20} className="text-gray-500" />
                            Question Distribution
                        </h3>
                        <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-900">{totalQuestions}</span>
                                <span className="text-xs font-bold text-gray-400">Total</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-6">
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm font-medium text-gray-600">
                                        {item.name} ({item.value})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>



                    {/* Subject Wise Analysis */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BookOpen size={20} className="text-gray-500" />
                            Subject-wise Performance
                        </h3>

                        <div className="space-y-6">
                            {Object.entries(subjectWise || {}).map(([subject, stats]) => (
                                <div key={subject} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-900 text-lg">{subject}</h4>
                                        <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-bold text-gray-700">
                                            Score: {stats.score}/{stats.maxScore}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-4 flex">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${(stats.correct / (stats.attempted + stats.unattempted || 1)) * 100}%` }}
                                        />
                                        <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${(stats.wrong / (stats.attempted + stats.unattempted || 1)) * 100}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-sm">
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="font-bold text-gray-900">{stats.attempted}</div>
                                            <div className="text-xs text-blue-600 font-semibold">Attempted</div>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="font-bold text-green-600">{stats.correct}</div>
                                            <div className="text-xs text-gray-500 font-medium">Correct</div>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="font-bold text-red-600">{stats.wrong}</div>
                                            <div className="text-xs text-gray-500 font-medium">Wrong</div>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="font-bold text-gray-900">{stats.accuracy}%</div>
                                            <div className="text-xs text-purple-600 font-semibold">Accuracy</div>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <div className="font-bold text-gray-900">{formatTime(stats.timeTaken || 0)}</div>
                                            <div className="text-xs text-orange-600 font-semibold">Time</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Proctoring Report */}
                    {proctoringLogs && proctoringLogs.length > 0 && (
                        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                            <h3 className="text-lg font-bold text-red-700 mb-6 flex items-center gap-2">
                                <Target size={20} className="text-red-500" />
                                Proctoring Violations Found ({proctoringLogs.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {proctoringLogs.map((log, index) => (
                                    <div key={index} className="border border-red-100 bg-red-50/50 p-4 rounded-xl flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-red-800 text-sm">{log.type}</div>
                                                <div className="text-xs text-red-600">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{log.message}</p>

                                        {/* Evidence Image */}
                                        {log.evidence && (
                                            <div className="relative group overflow-hidden rounded-lg border border-gray-200 mt-2">
                                                <img
                                                    src={log.evidence.startsWith('http') ? log.evidence : `${import.meta.env.VITE_BACKEND_URL}${log.evidence.startsWith('/') ? '' : '/'}${log.evidence}`}
                                                    alt={`Violation Evidence - ${log.type}`}
                                                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/300x200?text=Evidence+Not+Found';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default TestResults;
