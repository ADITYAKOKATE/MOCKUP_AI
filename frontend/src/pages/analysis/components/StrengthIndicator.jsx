import React from 'react';

const StrengthIndicator = ({ strength, size = 'md' }) => {
    const getStrengthConfig = (strength) => {
        if (strength === null || strength === 0) {
            return {
                label: 'Not Attempted',
                color: 'bg-gray-500',
                bgColor: 'bg-gray-50',
                textColor: 'text-gray-600',
                borderColor: 'border-gray-200'
            };
        }
        if (strength < 40) {
            return {
                label: 'Critical',
                color: 'bg-red-500',
                bgColor: 'bg-red-50',
                textColor: 'text-red-600',
                borderColor: 'border-red-200'
            };
        }
        if (strength < 60) {
            return {
                label: 'Weak',
                color: 'bg-orange-500',
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-600',
                borderColor: 'border-orange-200'
            };
        }
        if (strength < 76) {
            return {
                label: 'Moderate',
                color: 'bg-yellow-500',
                bgColor: 'bg-yellow-50',
                textColor: 'text-yellow-600',
                borderColor: 'border-yellow-200'
            };
        }
        if (strength < 91) {
            return {
                label: 'Strong',
                color: 'bg-green-500',
                bgColor: 'bg-green-50',
                textColor: 'text-green-600',
                borderColor: 'border-green-200'
            };
        }
        return {
            label: 'Excellent',
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        };
    };

    const config = getStrengthConfig(strength);
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-2'
    };

    return (
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center font-bold rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}>
                {config.label}
            </span>
            {strength !== null && strength > 0 && (
                <div className="flex-1 min-w-[60px]">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${config.color} transition-all duration-500`}
                            style={{ width: `${strength}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StrengthIndicator;
