import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, BookOpen, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import OverviewTab from './components/OverviewTab';
import SubjectsTab from './components/SubjectsTab';
import TopicsTab from './components/TopicsTab';

const PerformanceAnalysis = () => {
    const { selectedExam } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [subjectsData, setSubjectsData] = useState(null);
    const [topicsData, setTopicsData] = useState(null);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'topics', label: 'Topics', icon: Layers }
    ];

    useEffect(() => {
        fetchData();
    }, [selectedExam]); // Re-fetch when exam changes

    const fetchData = async () => {
        if (!selectedExam) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [overview, subjects, topics] = await Promise.all([
                api.getAnalysisOverview(selectedExam),
                api.getSubjectAnalysis(selectedExam),
                api.getTopicAnalysis(selectedExam)
            ]);

            setOverviewData(overview);
            setSubjectsData(subjects);
            setTopicsData(topics);
        } catch (error) {
            console.error('Error fetching analysis data:', error);
            toast.error('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Loading your analysis...</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-50 rounded-xl">
                            <BarChart2 className="text-blue-600" size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900">Performance Analysis</h1>
                    </div>
                    <p className="text-gray-600 text-base">Deep dive into your performance metrics and growth</p>
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

                {/* Tab Content */}
                <div>
                    {activeTab === 'overview' && <OverviewTab data={overviewData} />}
                    {activeTab === 'subjects' && <SubjectsTab data={subjectsData} />}
                    {activeTab === 'topics' && <TopicsTab data={topicsData} />}
                </div>
            </div>
        </div>
    );
};

export default PerformanceAnalysis;
