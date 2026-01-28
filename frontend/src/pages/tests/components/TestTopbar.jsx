import React from 'react';
import { X } from 'lucide-react';

const TestTopbar = ({ title, timeLeft, currentQ, totalQ, onQuit, onSubmit }) => {
    // Format mm:ss
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progressPercent = ((currentQ + 1) / totalQ) * 100;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="h-16 flex items-center justify-between px-4">
                {/* Left: Title or Progress */}
                <div className="flex items-center gap-3 md:gap-4">
                    <h1 className="text-sm md:text-base font-bold text-gray-800">{title || 'Loop Test'}</h1>

                    {/* Question Counter */}
                    <div className="hidden md:flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Question</span>
                        <span className="font-mono font-bold text-gray-700 text-xs">
                            {String(currentQ + 1).padStart(2, '0')} / {String(totalQ).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Center: Timer (Smaller & Centered) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <div className="flex flex-col items-center">
                        <div className="bg-white border border-gray-200 rounded-lg w-9 h-9 flex items-center justify-center shadow-sm">
                            <span className="text-base font-bold text-gray-800">{String(minutes).padStart(2, '0')}</span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">Min</span>
                    </div>

                    <span className="text-gray-300 text-lg font-light mb-3">:</span>

                    <div className="flex flex-col items-center">
                        <div className="bg-white border border-gray-200 rounded-lg w-9 h-9 flex items-center justify-center shadow-sm">
                            <span className="text-base font-bold text-gray-800">{String(seconds).padStart(2, '0')}</span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">Sec</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {onSubmit && (
                        <button
                            onClick={onSubmit}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs md:text-sm font-bold transition-colors border border-green-200"
                        >
                            <span>Submit</span>
                        </button>
                    )}

                    <button
                        onClick={onQuit}
                        className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-xs md:text-sm font-medium"
                    >
                        <X size={16} />
                        <span className="hidden sm:inline">Quit</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar inside Topbar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
};

export default TestTopbar;
