import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top', className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div 
            className={`relative flex items-center w-fit ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && content && (
                <div className={`
                    absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 
                    rounded-lg shadow-xl whitespace-nowrap min-w-max animate-in fade-in zoom-in-95 duration-200
                    ${positions[position]}
                `}>
                    {content}
                    {/* Arrow */}
                    <div className={`
                        absolute w-2.5 h-2.5 bg-slate-800 rotate-45 
                        ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2' : ''}
                        ${position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2' : ''}
                        ${position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2' : ''}
                        ${position === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2' : ''}
                    `}/>
                </div>
            )}
        </div>
    );
};

export default Tooltip;
