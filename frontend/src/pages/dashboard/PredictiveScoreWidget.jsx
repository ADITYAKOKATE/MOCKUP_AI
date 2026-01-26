import React from 'react';
import { TrendingUp, Trophy, Target, Sparkles, TrendingDown, Minus } from 'lucide-react';

const PredictiveScoreWidget = ({ data }) => {
    if (!data || data.confidence === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Sparkles size={20} className="text-purple-600" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Predictive Analysis</h3>
                </div>
                <div className="text-center py-8">
                    <Target size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">{data?.message || 'Take more tests to generate predictions'}</p>
                </div>
            </div>
        );
    }

    const getTrendIcon = () => {
        if (data.trend === 'improving') return <TrendingUp size={16} className="text-green-600" />;
        if (data.trend === 'declining') return <TrendingDown size={16} className="text-red-600" />;
        return <Minus size={16} className="text-gray-600" />;
    };

    const getTrendColor = () => {
        if (data.trend === 'improving') return 'text-green-600 bg-green-50';
        if (data.trend === 'declining') return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getConfidenceColor = () => {
        if (data.confidence >= 70) return 'bg-green-500';
        if (data.confidence >= 50) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl p-6 border border-purple-100 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 rounded-xl">
                        <Sparkles size={24} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Predictive Analysis</h3>
                        <p className="text-xs text-gray-500">AI-powered exam prediction</p>
                    </div>
                </div>

                {/* Confidence Badge */}
                <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-white border-4 border-purple-100 flex items-center justify-center">
                        <span className="text-sm font-black text-purple-600">{data.confidence}%</span>
                    </div>
                </div>
            </div>

            {/* Main Prediction Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Predicted Score */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-blue-600" />
                        <p className="text-xs font-bold text-gray-500 uppercase">Predicted Score</p>
                    </div>
                    <p className="text-3xl font-black text-blue-600">{data.predictedScore}</p>
                    <p className="text-xs text-gray-500 mt-1">out of {data.maxScore}</p>
                </div>

                {/* Predicted Rank */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy size={16} className="text-yellow-600" />
                        <p className="text-xs font-bold text-gray-500 uppercase">Predicted Rank</p>
                    </div>
                    <p className="text-3xl font-black text-yellow-600">{data.predictedRank.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">out of {data.totalCandidates.toLocaleString()}</p>
                </div>

                {/* Predicted Percentile */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-600" />
                        <p className="text-xs font-bold text-gray-500 uppercase">Percentile</p>
                    </div>
                    <p className="text-3xl font-black text-green-600">{data.predictedPercentile}</p>
                    <p className="text-xs text-gray-500 mt-1">percentile</p>
                </div>
            </div>

            {/* Subject-wise Breakdown */}
            {data.subjectScores && data.subjectScores.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Subject-wise Prediction</h4>
                    <div className="space-y-2">
                        {data.subjectScores.map((subject, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-gray-900">{subject.subject}</span>
                                        <span className="text-sm font-black text-blue-600">{subject.predictedScore}/{subject.maxScore}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                            style={{ width: `${(subject.predictedScore / subject.maxScore) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trend and Confidence */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="text-xs font-bold capitalize">{data.trend}</span>
                    </div>
                    {data.trendPercentage !== '0.0' && (
                        <span className="text-xs text-gray-600">
                            {data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage}% trend
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getConfidenceColor()} transition-all duration-500`}
                            style={{ width: `${data.confidence}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{data.message}</span>
                </div>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-700 leading-relaxed">
                    <span className="font-bold">Note:</span> Predictions are based on your current performance, subject strengths, accuracy trends, and consistency. Take more tests to improve prediction accuracy.
                </p>
            </div>
        </div>
    );
};

export default PredictiveScoreWidget;
