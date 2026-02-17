import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Target, TrendingUp, Clock, Award, PlayCircle,
    Zap, BookOpen, Brain, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component Imports
import StatCard from './StatCard';
import PerformanceTrendChart from './PerformanceTrendChart';
import SubjectBreakdownWidget from './SubjectBreakdownWidget';
import WeakAreasWidget from './WeakAreasWidget';
import RecentActivityWidget from './RecentActivityWidget';
import StudyStreakWidget from './StudyStreakWidget';
import PredictiveScoreWidget from './PredictiveScoreWidget';

const Dashboard = () => {
    const { user, selectedExam } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!selectedExam) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const result = await api.getDashboardData(selectedExam);
                setData(result);
            } catch (err) {
                console.error('Dashboard Load Failed:', err);
                setError(err.message || 'Failed to load dashboard');
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedExam]); // Re-fetch when exam changes

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-600 font-semibold">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
                <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-lg max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Oops! Something went wrong</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // No Profile State
    if (!data || !data.hasProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
                <div className="bg-white rounded-2xl p-8 border border-blue-100 shadow-lg max-w-md text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Welcome to MockUp!</h3>
                    <p className="text-gray-600 mb-6">Please complete your profile setup to get started</p>
                    <button
                        onClick={() => window.location.href = '/settings'}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
                    >
                        Complete Profile
                    </button>
                </div>
            </div>
        );
    }

    const { stats, lastTest, performanceTrend, recentActivity, studyStreak, subjectPerformance, weakAreas } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Welcome Back! 👋
                        </h1>
                        <p className="text-gray-600 mt-2 font-medium">
                            {user?.profile?.name || 'Aspirant'} • {data.selectedExam || 'Exam Prep'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/tests')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200/50 flex items-center gap-2 transition-all active:scale-95 group"
                    >
                        <PlayCircle size={20} className="group-hover:scale-110 transition-transform" />
                        Start New Test
                    </button>
                </div>

                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Tests"
                        value={stats.totalTests}
                        subtitle={`${stats.totalAttempted || 0} questions attempted`}
                        icon={Target}
                        colorClass="text-blue-600"
                        bgClass="bg-blue-50"
                    />
                    <StatCard
                        title="Average Score"
                        value={stats.averageScore}
                        subtitle="Overall performance"
                        icon={Award}
                        colorClass="text-purple-600"
                        bgClass="bg-purple-50"
                    />
                    <StatCard
                        title="Accuracy"
                        value={`${stats.averageAccuracy}%`}
                        subtitle={`${stats.totalCorrect} correct answers`}
                        icon={TrendingUp}
                        colorClass="text-green-600"
                        bgClass="bg-green-50"
                    />
                    <StatCard
                        title="Study Time"
                        value={`${Math.floor(stats.totalTime / 3600)}h`}
                        subtitle={`${Math.floor((stats.totalTime % 3600) / 60)}m total`}
                        icon={Clock}
                        colorClass="text-orange-600"
                        bgClass="bg-orange-50"
                    />
                </div>

                {/* Last Test Info (if available) */}
                {lastTest && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wide opacity-90 mb-1">Last Test Performance</h3>
                                <p className="text-3xl font-black mb-2">{lastTest.score} / {lastTest.totalMarks}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{lastTest.accuracy}% Accuracy</span>
                                    <span>{Math.floor(lastTest.timeTaken / 60)}m {lastTest.timeTaken % 60}s</span>
                                    <span>{lastTest.testType} Test</span>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Zap size={48} className="text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Study Streak */}
                {studyStreak && (
                    <StudyStreakWidget streakData={studyStreak} />
                )}

                {/* Predictive Score Analysis */}
                {data.predictiveAnalysis && (
                    <PredictiveScoreWidget data={data.predictiveAnalysis} />
                )}

                {/* Performance Trend Chart */}
                {performanceTrend && performanceTrend.length > 0 && (
                    <PerformanceTrendChart trendData={performanceTrend} />
                )}

                {/* Bottom Section: Subject Performance + Weak Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SubjectBreakdownWidget subjects={subjectPerformance} />
                    </div>
                    <div className="lg:col-span-1">
                        <WeakAreasWidget weakAreas={weakAreas} />
                    </div>
                </div>

                {/* Recent Activity */}
                {recentActivity && recentActivity.length > 0 && (
                    <RecentActivityWidget activities={recentActivity} />
                )}

                {/* Quick Actions Footer */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all group">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Target size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Practice Test</p>
                                <p className="text-xs text-gray-600">Quick 10 questions</p>
                            </div>
                        </button>
                        <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all group">
                            <div className="p-2 bg-purple-600 rounded-lg">
                                <Brain size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">AI Tutor</p>
                                <p className="text-xs text-gray-600">Get personalized help</p>
                            </div>
                        </button>
                        <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl border border-orange-200 transition-all group">
                            <div className="p-2 bg-orange-600 rounded-lg">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Review Mistakes</p>
                                <p className="text-xs text-gray-600">Learn from errors</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
