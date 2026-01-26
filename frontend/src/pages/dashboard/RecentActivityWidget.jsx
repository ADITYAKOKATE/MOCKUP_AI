import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, CheckCircle2, XCircle, Target } from 'lucide-react';

const RecentActivityWidget = ({ activities }) => {
    const navigate = useNavigate();

    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8 text-gray-400">
                    <Target size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No tests taken yet</p>
                    <p className="text-xs mt-1">Start your first test to see activity here</p>
                </div>
            </div>
        );
    }

    const getTestTypeColor = (type) => {
        const colors = {
            'Full': 'bg-purple-100 text-purple-700 border-purple-200',
            'Subject': 'bg-blue-100 text-blue-700 border-blue-200',
            'Random': 'bg-green-100 text-green-700 border-green-200',
            'AI': 'bg-pink-100 text-pink-700 border-pink-200'
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 80) return 'text-green-600';
        if (accuracy >= 60) return 'text-blue-600';
        if (accuracy >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">Recent Activity</h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Last 5 Tests</span>
            </div>

            {/* Activity List */}
            <div className="space-y-3">
                {activities.map((activity, index) => (
                    <div
                        key={activity.id}
                        onClick={() => navigate(`/test-analysis?id=${activity.id}`)}
                        className="group relative bg-gradient-to-r from-gray-50 to-transparent hover:from-blue-50 hover:to-transparent rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-all duration-200 cursor-pointer"
                    >
                        {/* Test Type Badge */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getTestTypeColor(activity.testType)}`}>
                                    {activity.testType}
                                </span>
                                {activity.subject && (
                                    <span className="text-xs font-semibold text-gray-600">
                                        {activity.subject}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{formatDate(activity.date)}</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Score */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded-lg">
                                    <Target size={14} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Score</p>
                                    <p className="text-sm font-black text-gray-900">{activity.score}</p>
                                </div>
                            </div>

                            {/* Accuracy */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-50 rounded-lg">
                                    <CheckCircle2 size={14} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Accuracy</p>
                                    <p className={`text-sm font-black ${getAccuracyColor(parseFloat(activity.accuracy))}`}>
                                        {activity.accuracy}%
                                    </p>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-50 rounded-lg">
                                    <Clock size={14} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Time</p>
                                    <p className="text-sm font-black text-gray-900">{formatTime(activity.timeTaken)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Hover Effect Indicator */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
