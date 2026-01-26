import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, subtitle, trend, icon: Icon, colorClass = 'text-blue-500', bgClass = 'bg-blue-50' }) => {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend > 0) return <TrendingUp size={14} className="text-green-600" />;
        if (trend < 0) return <TrendingDown size={14} className="text-red-600" />;
        return <Minus size={14} className="text-gray-400" />;
    };

    const getTrendColor = () => {
        if (!trend) return '';
        if (trend > 0) return 'text-green-600 bg-green-50';
        if (trend < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            {/* Gradient Background Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity`}></div>

            <div className="relative z-10">
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${bgClass} rounded-xl ${colorClass}`}>
                        <Icon size={24} strokeWidth={2.5} />
                    </div>
                    {trend !== undefined && trend !== null && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                    <p className="text-sm font-semibold text-gray-500">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
