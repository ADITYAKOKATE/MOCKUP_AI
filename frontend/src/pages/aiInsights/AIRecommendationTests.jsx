import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Brain, Target, BookOpen, Layers, TrendingDown, Clock, ArrowRight, Sparkles, Zap, Award, ChevronRight } from 'lucide-react';

const AIRecommendationTests = () => {
    const { selectedExam } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('practice');
    const [loading, setLoading] = useState(true);
    const [practiceTests, setPracticeTests] = useState([]);
    const [subjectTests, setSubjectTests] = useState([]);
    const [topicTests, setTopicTests] = useState([]);

    // Handle tab query parameter from URL
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['practice', 'subject', 'topic'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Fetch recommendations from backend
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!selectedExam) {
                console.log('[AI Recommendations] No exam selected');
                return;
            }

            try {
                setLoading(true);
                console.log('[AI Recommendations] Fetching for exam:', selectedExam);
                const data = await api.getRecommendations(selectedExam);
                console.log('[AI Recommendations] Received data:', data);

                setPracticeTests(data.practiceTests || []);
                setSubjectTests(data.subjectTests || []);
                setTopicTests(data.topicTests || []);
            } catch (error) {
                console.error('[AI Recommendations] Failed to fetch:', error);
                toast.error('Failed to load recommendations. Please try again.');

                // Set empty arrays on error
                setPracticeTests([]);
                setSubjectTests([]);
                setTopicTests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [selectedExam]);

    const tabs = [
        { id: 'practice', label: 'Practice Tests', icon: Brain, color: 'blue' },
        { id: 'subject', label: 'Subject Wise', icon: BookOpen, color: 'purple' },
        { id: 'topic', label: 'Topic Wise', icon: Layers, color: 'green' }
    ];

    const getPriorityBadge = (priority) => {
        const styles = {
            'Critical': 'bg-red-100 text-red-700 border border-red-200',
            'High': 'bg-orange-100 text-orange-700 border border-orange-200',
            'Medium': 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        };
        return styles[priority] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 70) return 'text-green-600';
        if (accuracy >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    const handleStartTest = (testData, type) => {
        console.log('Starting test:', type, testData);
        // TODO: Implement navigation to test creation
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Loading AI Recommendations...</p>
                </div>
            </div>
        );
    }

    // Empty State - No performance data
    const hasNoData = practiceTests.length === 0 && subjectTests.length === 0 && topicTests.length === 0;
    if (hasNoData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-2xl mx-auto mt-20">
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Brain className="text-white" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">No Performance Data Yet</h2>
                        <p className="text-gray-600 mb-6">
                            Take some tests to generate personalized AI recommendations based on your performance.
                        </p>
                        <button
                            onClick={() => navigate('/tests')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-xl transition-all"
                        >
                            Start Your First Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Sparkles className="text-blue-600" size={28} />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">AI Recommended Tests</h1>
                            </div>
                            <p className="text-gray-600 text-base">Personalized practice based on your performance analytics</p>
                        </div>
                        <div className="hidden md:flex items-center gap-3 bg-blue-50 rounded-xl px-5 py-3 border border-blue-100">
                            <Zap className="text-blue-600" size={20} />
                            <div>
                                <div className="text-gray-900 text-sm font-semibold">AI Engine Active</div>
                                <div className="text-gray-600 text-xs">Analyzing weak areas</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-1.5">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Practice Tests Tab */}
                {activeTab === 'practice' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <Brain className="text-white" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Mixed Weak Topics Practice</h3>
                                    <p className="text-gray-600 text-xs mt-1">
                                        Combine questions from multiple weak topics for comprehensive improvement
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {practiceTests.map(test => (
                                <div key={test.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                                                {test.weaknessScore}% Priority
                                            </span>
                                            <Award className="text-gray-400" size={22} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{test.title}</h3>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        <p className="text-gray-600 text-sm leading-relaxed">{test.description}</p>

                                        {/* Topics */}
                                        <div className="flex flex-wrap gap-2">
                                            {test.topics.map((topic, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                                            <div className="text-center">
                                                <Target size={14} className="text-gray-400 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-gray-900">{test.questionCount}</div>
                                                <div className="text-xs text-gray-500 font-medium">Questions</div>
                                            </div>
                                            <div className="text-center">
                                                <Clock size={14} className="text-gray-400 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-gray-900">{test.estimatedTime}</div>
                                                <div className="text-xs text-gray-500 font-medium">Minutes</div>
                                            </div>
                                            <div className="text-center">
                                                <TrendingDown size={14} className="text-gray-400 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-gray-900">{test.difficulty}</div>
                                                <div className="text-xs text-gray-500 font-medium">Level</div>
                                            </div>
                                        </div>

                                        {/* Button */}
                                        <button
                                            onClick={() => handleStartTest(test, 'practice')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            Start Practice Test
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Subject Wise Tab */}
                {activeTab === 'subject' && (
                    <div className="space-y-6">
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-600 rounded-lg">
                                    <BookOpen className="text-white" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Subject-Specific Practice</h3>
                                    <p className="text-gray-600 text-xs mt-1">
                                        Focus on subjects where you need the most improvement
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subjectTests.map(test => (
                                <div key={test.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 border border-blue-200">
                                            <BookOpen className="text-blue-600" size={22} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{test.subject}</h3>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        {/* Accuracy */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div>
                                                <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Current Accuracy</div>
                                                <div className={`text-3xl font-bold ${getAccuracyColor(test.accuracy)}`}>
                                                    {test.accuracy}%
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Strength</div>
                                                <div className="text-2xl font-bold text-blue-600">{test.strength}</div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span className="font-medium">{test.topicsCount} weak topics</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="font-medium">{test.questionCount} questions</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="font-medium">{test.estimatedTime} mins</span>
                                        </div>

                                        {/* Button */}
                                        <button
                                            onClick={() => handleStartTest(test, 'subject')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            Start Subject Test
                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Topic Wise Tab */}
                {activeTab === 'topic' && (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-600 rounded-lg">
                                    <Layers className="text-white" size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Topic-Specific Deep Dive</h3>
                                    <p className="text-gray-600 text-xs mt-1">
                                        Master individual topics with focused, targeted practice
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topicTests.map(test => (
                                <div key={test.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                                        <span className={`inline-block px-3 py-1.5 ${getPriorityBadge(test.priority)} text-xs font-bold rounded-full mb-3`}>
                                            {test.priority} Priority
                                        </span>
                                        <div className="text-gray-500 text-xs font-semibold mb-1">{test.subject}</div>
                                        <h3 className="text-xl font-bold text-gray-900">{test.topic}</h3>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                                <div className="text-xs text-red-600 font-semibold mb-1">Accuracy</div>
                                                <div className={`text-2xl font-bold ${getAccuracyColor(test.accuracy)}`}>{test.accuracy}%</div>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                <div className="text-xs text-blue-600 font-semibold mb-1">Strength</div>
                                                <div className="text-2xl font-bold text-blue-600">{test.strength}</div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Target size={14} className="text-gray-400" />
                                                <span className="font-medium">{test.questionCount} Questions</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="font-medium">{test.estimatedTime} mins</span>
                                            </div>
                                        </div>

                                        {/* Button */}
                                        <button
                                            onClick={() => handleStartTest(test, 'topic')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            Start Topic Test
                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIRecommendationTests;
