import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar, CheckCircle, ChevronRight, BarChart2, Hash, Zap, ArrowUpRight, FileText } from 'lucide-react';

const TestHistory = () => {
    const { selectedExam } = useAuth();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.getTestHistory(selectedExam);
                setAttempts(data);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [selectedExam]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const formatTime = (seconds) => {
        const m = Math.floor((seconds || 0) / 60);
        const s = (seconds || 0) % 60;
        return `${m}m ${s}s`;
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600 bg-green-50';
        if (percentage >= 50) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Journey</h1>
                        <p className="text-gray-500 mt-1">Track your progress and master your mistakes.</p>
                    </div>

                    {attempts.length > 0 && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Hash size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Total Tests</div>
                                <div className="text-lg font-black text-gray-900">{attempts.length}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attempts.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No Attempts Yet</h3>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">Start your first mock test to see your performance analytics here.</p>
                            <button
                                onClick={() => navigate('/tests')}
                                className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-200"
                            >
                                Start a Test
                            </button>
                        </div>
                    ) : (
                        attempts.map((attempt) => {
                            const percent = Math.round((attempt.score / attempt.totalMarks) * 100) || 0;
                            const statusColor = getScoreColor(percent);

                            return (
                                <div
                                    key={attempt._id}
                                    className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Top Decoration */}
                                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${percent >= 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`} />

                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            {(() => {
                                                const type = attempt.testType?.toLowerCase();
                                                let badgeStyle = "bg-gray-100 text-gray-700 border-gray-200";
                                                let label = attempt.examType;

                                                if (type === 'subject') {
                                                    badgeStyle = "bg-purple-50 text-purple-700 border-purple-100";
                                                    label = `Subject: ${attempt.subject}`;
                                                } else if (type === 'topic-wise' || type === 'topic') {
                                                    badgeStyle = "bg-teal-50 text-teal-700 border-teal-100";
                                                    label = `Topic: ${attempt.topic}`;
                                                } else if (type === 'full') {
                                                    badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";
                                                } else if (type === 'random') {
                                                    badgeStyle = "bg-violet-50 text-violet-700 border-violet-100";
                                                    label = attempt.subject === 'Mixed' ? "Custom Drill (Mixed)" : `Custom Drill: ${attempt.subject}`;
                                                }

                                                return (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${badgeStyle} mb-2`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                                <Calendar size={14} />
                                                {formatDate(attempt.createdAt)}
                                            </div>
                                        </div>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${statusColor}`}>
                                            {percent}%
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Score</div>
                                            <div className="text-xl font-black text-gray-900">
                                                {attempt.score}
                                                <span className="text-sm text-gray-400 font-medium bg-transparent">/{attempt.totalMarks}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Time</div>
                                            <div className="text-lg font-bold text-gray-700 flex items-center gap-1">
                                                {formatTime(attempt.totalTimeTaken)}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-2xl col-span-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                                                    <CheckCircle size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">Accuracy</span>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">{attempt.accuracy}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => navigate(`/test-analysis?id=${attempt._id}`)}
                                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <BarChart2 size={16} />
                                            Analysis
                                        </button>
                                        <button
                                            onClick={() => navigate(`/tests/review/${attempt._id}`)}
                                            className="px-4 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-gray-200"
                                        >
                                            Review
                                            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestHistory;
