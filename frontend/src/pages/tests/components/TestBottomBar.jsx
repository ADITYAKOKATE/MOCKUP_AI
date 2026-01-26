import React from 'react';
import { ChevronLeft, ChevronRight, Flag, X } from 'lucide-react';

const TestBottomBar = ({ 
    currentQ, 
    totalQ, 
    onPrev, 
    onNext, 
    onMark, 
    onClear, 
    isMarked, 
    onQuit 
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3 md:px-6 flex items-center justify-between w-full h-full">
            {/* Left: Previous */}
            <button
                onClick={onPrev}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
            >
                <ChevronLeft size={20} />
                <span className="hidden md:inline">Previous</span>
            </button>

            {/* Center: Actions (Mark/Clear) */}
            <div className="flex gap-2 md:gap-4">
                <button
                    onClick={onMark}
                    className={`w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 flex items-center justify-center gap-2 rounded-xl border transition-colors ${
                        isMarked 
                            ? 'bg-purple-100 border-purple-200 text-purple-700' 
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                    title="Mark for Review"
                >
                    <Flag size={18} className={isMarked ? 'fill-current' : ''} />
                    <span className="hidden md:inline font-medium">{isMarked ? 'Marked' : 'Review'}</span>
                </button>
                
                {onClear && (
                    <button
                        onClick={onClear}
                        className="hidden md:block text-gray-400 hover:text-gray-600 font-medium text-sm px-4"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Right: Next / Finish */}
                <button
                    onClick={onNext}
                    disabled={currentQ === totalQ - 1} // Logic might differ if "Finish" is handled by Next button
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {currentQ === totalQ - 1 ? 'Finish' : 'Next'}
                    <ChevronRight size={18} />
                </button>
        </div>
    );
};

export default TestBottomBar;
