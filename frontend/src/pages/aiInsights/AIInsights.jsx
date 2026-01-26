import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Zap, AlertOctagon, Lightbulb, RotateCw, ArrowRight } from 'lucide-react';

const AIInsights = () => {
    const { selectedExam } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            if (!selectedExam) return;
            try {
                setLoading(true);
                const result = await api.getAIInsights(selectedExam);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch insights:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [selectedExam]);

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
    if (!data) return <div className="p-10 text-center">No insights available.</div>;

    const getRecommendationStyles = (type) => {
        switch (type) {
            case 'CRITICAL':
                return {
                    bg: 'bg-white',
                    badge: 'bg-red-500 text-white',
                    border: 'border-l-4 border-l-red-500',
                    icon: <AlertOctagon className="text-red-500" size={24} />,
                    alertBg: 'bg-red-50 border-red-100 text-red-800'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-white',
                    badge: 'bg-amber-500 text-white',
                    border: 'border-l-4 border-l-amber-500',
                    icon: <Lightbulb className="text-amber-500" size={24} />,
                    alertBg: 'bg-amber-50 border-amber-100 text-amber-800'
                };
            case 'MAINTENANCE':
                return {
                    bg: 'bg-white',
                    badge: 'bg-blue-500 text-white',
                    border: 'border-l-4 border-l-blue-500',
                    icon: <RotateCw className="text-blue-500" size={24} />,
                    alertBg: 'bg-blue-50 border-blue-100 text-blue-800'
                };
            default:
                return {};
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        AI Learning Recommendations
                    </h2>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {data.recommendations.length} priority areas identified based on your last 5 mock tests.
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                    <RotateCw size={16} /> Re-sync Analytics
                </button>
            </div>

            <div className="space-y-6">
                {data.recommendations.map((rec, index) => {
                    const styles = getRecommendationStyles(rec.type);
                    return (
                        <div key={index} className={`rounded-xl shadow-sm border border-gray-200 overflow-hidden ${styles.border} flex flex-col md:flex-row`}>
                            {/* Visual Placeholder Section (Left) */}
                            <div className="md:w-64 bg-gray-900 p-6 flex flex-col justify-end relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                {/* Abstract Shapes */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                                <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-20 -ml-5 -mb-5 ${rec.type === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></div>

                                <span className="relative z-10 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{rec.subject}</span>
                                <h4 className="relative z-10 text-white font-bold text-lg leading-tight group-hover:underline decoration-blue-400 underline-offset-4 cursor-pointer">
                                    {rec.title}
                                </h4>
                                <div className={`absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase rounded-full ${styles.badge}`}>
                                    {rec.type} PRIORITY
                                </div>
                            </div>

                            {/* Content Section (Right) */}
                            <div className="flex-1 p-6 bg-white flex flex-col justify-between">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        {styles.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{rec.issue}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{rec.desc}</p>
                                    </div>
                                    {rec.type === 'CRITICAL' && (
                                        <div className="ml-auto w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                            <Zap size={16} className="text-red-500" fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
                                    {rec.type !== 'MAINTENANCE' && (
                                        <div className="flex gap-2 mr-auto">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">Video Lec</span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">Notes</span>
                                        </div>
                                    )}

                                    <button className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                        {rec.type === 'MAINTENANCE' ? 'Quick Quiz' : 'Start Practice'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Engine Status */}
            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between border border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Personalized Engine Active</h4>
                        <p className="text-xs text-gray-500">Training on 142 of your previous test responses.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="text-gray-500 text-sm font-medium hover:text-gray-900">Dismiss all</button>
                    <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50">Advanced Settings</button>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
