import React from 'react';
import { Flag, LayoutGrid } from 'lucide-react';

const TestSidebar = ({ 
    questions, 
    currentQuestionIndex, 
    onQuestionChange, 
    responses 
}) => {

    const getQuestionStatusClass = (index) => {
        const qId = questions[index].id;
        const resp = responses[qId];
        if (resp?.marked) return 'bg-purple-100 text-purple-700 border-purple-300';
        if (resp?.answer !== undefined) return 'bg-green-100 text-green-700 border-green-300';
        if (index === currentQuestionIndex) return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200';
        return 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
    };

    return (
        <div className="bg-white flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex-shrink-0">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <LayoutGrid size={20} />
                    Question Palette
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-4 gap-3">
                    {questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => onQuestionChange(idx)}
                            className={`aspect-square rounded-lg font-bold text-sm flex items-center justify-center border transition-all ${getQuestionStatusClass(idx)}`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded text-green-700 flex items-center justify-center text-[10px] font-bold">1</div>
                        <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded text-purple-700 flex items-center justify-center text-[10px] font-bold"><Flag size={10} /></div>
                        <span>Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                        <span>Not Visited</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-4 h-4 bg-blue-600 border border-blue-600 rounded"></div>
                        <span>Current</span>
                    </div>
                </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="text-center">
                    <p className="text-xs text-gray-400 mb-2">Loop 1.0 Test Interface</p>
                </div>
            </div>
        </div>
    );
};

export default TestSidebar;
