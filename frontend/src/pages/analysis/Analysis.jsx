import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Share2, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const Analysis = () => {
    const [searchParams] = useSearchParams();
    const analysisId = searchParams.get('id');
    const { selectedExam } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterSubject, setFilterSubject] = useState('All');

    // Fetch Analysis
    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            try {
                const result = await api.getAnalysis(analysisId || 'latest', selectedExam);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch analysis:", error);
            } finally {
                setLoading(false);
            }
        };
        if (analysisId || selectedExam) {
            fetchAnalysis();
        }
    }, [analysisId, selectedExam]);

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

    // Check for empty data
    if (!data) {
        return (
            <div className="max-w-7xl mx-auto p-10 text-center text-gray-500">
                No performance data found for {selectedExam}. Take a test to see results!
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span>Analytics</span>
                        <span>&gt;</span>
                        <span className="font-semibold text-gray-900">Test Result Summary</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Test Result Summary</h2>
                    <p className="text-gray-500">Performance Analysis: {data.examType || selectedExam}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
                {/* Score / Total Correct */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border print:border-gray-300">
                    <p className="text-gray-500 text-sm mb-1">Final Score</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 flex items-baseline">
                        {data.score} <span className="text-lg text-gray-400 font-medium">/ 100</span>
                    </h3>
                    <p className="text-sm font-bold text-green-600 mt-2">{data.improvement}</p>
                </div>

                {/* Accuracy */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border print:border-gray-300">
                    <p className="text-gray-500 text-sm mb-1">Accuracy</p>
                    <h3 className="text-4xl font-extrabold text-gray-900">
                        {data.accuracy}%
                    </h3>
                    <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle size={14} /> {data.accuracy > 70 ? 'Strong' : 'Needs Improvement'}
                    </p>
                </div>

                {/* Percentile */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border print:border-gray-300">
                    <p className="text-gray-500 text-sm mb-1">Percentile</p>
                    <h3 className="text-4xl font-extrabold text-gray-900">
                        {data.percentile}
                    </h3>
                    <p className="text-sm font-medium text-blue-600 mt-2">
                        🏆 Rank: {data.rank}
                    </p>
                </div>

                {/* Attempted */}
                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white print:bg-white print:text-black print:border print:border-gray-300 print:shadow-none">
                    <p className="text-blue-100 text-sm mb-1 print:text-gray-500">Attempted</p>
                    <h3 className="text-4xl font-extrabold">
                        {data.attempted}
                    </h3>
                    <p className="text-sm text-blue-100 mt-2 flex items-center gap-1 print:text-gray-600">
                        <Clock size={14} /> Speed: {data.speed}
                    </p>
                </div>
            </div>

            {/* Detailed Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-2">
                {/* Left Column: Subject Accuracy */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border print:border-gray-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Subject-wise Accuracy</h3>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide print:hidden">ANALYSIS</span>
                    </div>

                    <div className="space-y-6">
                        {data.subjectBreakdown.map((item, idx) => (
                            <div key={idx} className="print:break-inside-avoid">
                                <div className="flex justify-between mb-2">
                                    <span className="font-semibold text-gray-800">{item.subject}</span>
                                    <span className={`font-bold ${item.accuracy >= 80 ? 'text-green-600' :
                                        item.accuracy >= 60 ? 'text-blue-600' :
                                            item.accuracy >= 40 ? 'text-amber-500' : 'text-red-500'
                                        }`}>
                                        {item.accuracy}%
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden print:border print:border-gray-200">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${item.accuracy >= 80 ? 'bg-green-500' :
                                            item.accuracy >= 60 ? 'bg-blue-500' :
                                                item.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                            } print:print-color-adjust-exact`}
                                        style={{ width: `${item.accuracy}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: AI Suggestion & Time Analysis */}
                <div className="space-y-6 print:break-inside-avoid">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border print:border-gray-300">
                        <h3 className="font-bold text-gray-900 mb-4">Time Analysis</h3>
                        {(() => {
                            const totalTimeMins = Math.round((data.totalTimeTaken || 0) / 60);
                            const avgTopperMins = data.topperTime
                                ? Math.round(data.topperTime / 60)
                                : Math.max(1, Math.round(totalTimeMins * 0.85));
                            const diff = totalTimeMins - avgTopperMins;

                            // Prevent division by zero if totalTimeMins is 0
                            const userWidth = totalTimeMins > 0 ? Math.min(100, (totalTimeMins / Math.max(totalTimeMins, avgTopperMins)) * 100) : 0;
                            const topperWidth = avgTopperMins > 0 ? Math.min(100, (avgTopperMins / Math.max(totalTimeMins, avgTopperMins)) * 100) : 0;

                            return (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded print:text-gray-600 print:bg-transparent print:p-0">YOUR TIME</span>
                                        <span className="font-bold text-gray-900">{totalTimeMins} mins</span>
                                    </div>
                                    <div className="h-2 w-full bg-blue-100 rounded-full mb-6 print:border print:border-gray-200">
                                        <div className="h-full bg-blue-600 rounded-full print:print-color-adjust-exact" style={{ width: `${userWidth}%` }}></div>
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded print:text-gray-600 print:bg-transparent print:p-0">AVG TOPPER</span>
                                        <span className="font-bold text-gray-900">{avgTopperMins} mins</span>
                                    </div>
                                    <div className="h-2 w-full bg-green-100 rounded-full mb-4 print:border print:border-gray-200">
                                        <div className="h-full bg-green-500 rounded-full print:print-color-adjust-exact" style={{ width: `${topperWidth}%` }}></div>
                                    </div>
                                    <p className="text-xs text-center text-gray-500">
                                        {diff > 0
                                            ? <span>You are <span className="text-red-500 font-bold">{diff} mins slower</span> than the average topper.</span>
                                            : <span>You are <span className="text-green-500 font-bold">{Math.abs(diff)} mins faster</span> than the average topper.</span>
                                        }
                                    </p>
                                </>
                            );
                        })()}
                    </div>

                    <div className="bg-[#2563EB] p-6 rounded-2xl shadow-lg text-white print:bg-white print:text-black print:border print:border-gray-300 print:shadow-none">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="text-yellow-400 print:text-black" />
                            <h3 className="font-bold text-lg">AI Recommendation</h3>
                        </div>
                        {(() => {
                            // Find weak topics (highest incorrect)
                            const weakTopics = [...(data.detailedBreakdown || [])]
                                .sort((a, b) => b.incorrect - a.incorrect)
                                .slice(0, 2)
                                .map(t => t.topic);

                            // Find strong topics (highest correct), excluding weak ones to avoid contradiction
                            const strongTopics = [...(data.detailedBreakdown || [])]
                                .filter(t => !weakTopics.includes(t.topic)) // Exclude weak topics
                                .sort((a, b) => b.correct - a.correct)
                                .slice(0, 1)
                                .map(t => t.topic);

                            return (
                                <p className="text-blue-100 text-sm leading-relaxed mb-6 print:text-gray-700">
                                    {weakTopics.length > 0 ? (
                                        <>
                                            Based on your performance, you should focus more on <strong className="text-white print:text-black">{weakTopics.join(' and ')}</strong>.
                                            {strongTopics.length > 0 && <span> Your grasp of <strong className="text-white print:text-black">{strongTopics[0]}</strong> is strong.</span>}
                                        </>
                                    ) : (
                                        "Great job! Keep practicing to maintain your consistent performance across all topics."
                                    )}
                                </p>
                            );
                        })()}
                        <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors print:hidden">
                            Review Weak Topics
                        </button>
                    </div>
                </div>


            </div>

            {/* Proctoring Report - Full Width Section */}
            {data.proctoringLogs && data.proctoringLogs.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border border-red-100 overflow-hidden print:break-before-page">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-red-50 to-white px-8 py-6 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-red-100">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-gray-900">Proctoring Integrity Report</h3>
                                <p className="text-red-600 font-medium mt-1">
                                    {data.proctoringLogs.length} violation(s) detected during this session
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-red-200 shadow-md">
                                Action Required
                            </span>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="p-8 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.proctoringLogs.map((log, index) => (
                                <div key={index} className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                                    {/* Large Header Image */}
                                    <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                                        {log.evidence ? (
                                            <img
                                                src={`${import.meta.env.VITE_BACKEND_URL}${log.evidence}`}
                                                alt={log.type}
                                                className="w-full h-full object-contain bg-black/50 backdrop-blur-xl group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                                                <AlertTriangle size={48} className="opacity-20 text-white" />
                                                <span className="text-gray-400 font-medium">No Visual Evidence</span>
                                            </div>
                                        )}

                                        {/* Floating Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur text-gray-900 text-sm font-bold px-3 py-1 rounded-lg shadow-lg">
                                                #{index + 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                                    {log.type.replace(/_/g, ' ')}
                                                </h4>
                                                <p className="text-gray-500 text-sm mt-1">Detected Algorithmically</p>
                                            </div>
                                            <div className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                <Clock size={16} className="text-gray-500" />
                                                <span className="font-mono font-bold text-gray-700">
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <p className="text-red-800 font-medium text-sm leading-relaxed">
                                                {log.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t border-gray-200">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Detailed Breakdown</h3>
                        <p className="text-gray-500 text-sm">Granular view of your question-wise attempt</p>
                    </div>
                    {/* Subject Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Filter Topics by Subject:</span>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                        >
                            <option value="All">All Subjects</option>
                            {[...new Set(data.detailedBreakdown.map(item => item.subject || 'General'))].map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Subject Topic</th>
                                <th className="px-6 py-4 font-semibold text-green-600">Correct</th>
                                <th className="px-6 py-4 font-semibold text-red-600">Incorrect</th>
                                <th className="px-6 py-4 font-semibold text-gray-400">Unattempted</th>
                                <th className="px-6 py-4 font-semibold text-right">Avg Time/Q</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.detailedBreakdown
                                .filter(row => filterSubject === 'All' || (row.subject || 'General') === filterSubject)
                                .map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 print:break-inside-avoid">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div>{row.topic}</div>
                                            <div className="text-xs text-gray-500 font-normal">{row.subject}</div>
                                        </td>
                                        <td className="px-6 py-4 text-green-600 font-bold">{row.correct}</td>
                                        <td className="px-6 py-4 text-red-600 font-bold">{row.incorrect}</td>
                                        <td className="px-6 py-4 text-gray-400">{row.unattempted}</td>
                                        <td className="px-6 py-4 text-right text-gray-600">{row.avgTime}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
