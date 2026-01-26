import React from 'react';
import QuestionRenderer from './QuestionRenderer';

const QuestionCard = ({ question, response, onAnswer, type = 'MCQ' }) => {

    // MCQ Handler: Emit Label (A, B, C, D)
    const handleMCQSelect = (idx) => {
        const label = String.fromCharCode(65 + idx);
        onAnswer(label);
    };

    // MSQ Handler: Emit indices (or could be labels, keeping simple for now)
    const handleMSQSelect = (idx) => {
        const currentAns = Array.isArray(response) ? response : [];
        if (currentAns.includes(idx)) {
            onAnswer(currentAns.filter(i => i !== idx));
        } else {
            onAnswer([...currentAns, idx].sort());
        }
    };

    // NAT Handler
    const handleNATChange = (e) => {
        onAnswer(e.target.value);
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            {/* Question Text */}
            <div className="prose max-w-none mb-8">
                <div className="text-lg text-gray-900 font-medium leading-relaxed">
                    <span className="font-bold text-gray-400 mr-2 text-sm uppercase tracking-wider">
                        {type}
                    </span>
                    <QuestionRenderer content={question.text} />
                </div>
                {question.image && (
                    <img src={question.image} alt="Question" className="mt-4 rounded-lg max-h-64 object-contain" />
                )}
            </div>

            {/* Options Area */}
            <div className="space-y-4">
                {/* MCQ & MSQ Options */}
                {(type === 'MCQ' || type === 'MSQ') && question.options.map((option, idx) => {
                    // Check selection state (Handle both Index and Label for backward compat in UI)
                    const isSelected = type === 'MCQ'
                        ? (response === idx || response === String.fromCharCode(65 + idx))
                        : (Array.isArray(response) && response.includes(idx));

                    return (
                        <button
                            key={idx}
                            onClick={() => type === 'MCQ' ? handleMCQSelect(idx) : handleMSQSelect(idx)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-400 text-gray-500'
                                    }`}>
                                    {type === 'MCQ' ? String.fromCharCode(65 + idx) : (isSelected ? '✓' : '')}
                                </div>
                                <span className="font-medium">
                                    <QuestionRenderer content={option} />
                                </span>
                            </div>
                        </button>
                    );
                })}

                {/* NAT Input */}
                {type === 'NAT' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter your answer:</label>
                        <input
                            type="number"
                            value={response || ''}
                            onChange={handleNATChange}
                            placeholder="Type numerical answer..."
                            className="w-full max-w-xs p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg font-mono"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionCard;
