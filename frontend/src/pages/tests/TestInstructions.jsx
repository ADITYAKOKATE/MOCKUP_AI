import React from 'react';
import { CheckCircle, Clock, AlertCircle, BookOpen, Award } from 'lucide-react';

const TestInstructions = ({ pattern, onStart, onCancel }) => {
    if (!pattern) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen size={32} />
                        <h1 className="text-3xl font-black">{pattern.displayName}</h1>
                    </div>
                    <p className="text-blue-100">Full Length Mock Test</p>
                </div>

                {/* Test Overview */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-black text-gray-900 mb-4">Test Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <div className="text-2xl font-black text-blue-600 mb-1">{pattern.totalQuestions}</div>
                            <div className="text-xs text-gray-600 font-medium">Total Questions</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <div className="text-2xl font-black text-purple-600 mb-1">{pattern.questionsToAttempt}</div>
                            <div className="text-xs text-gray-600 font-medium">To Attempt</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <div className="text-2xl font-black text-green-600 mb-1">{pattern.totalMarks}</div>
                            <div className="text-xs text-gray-600 font-medium">Total Marks</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <div className="text-2xl font-black text-orange-600 mb-1">{pattern.duration} min</div>
                            <div className="text-xs text-gray-600 font-medium">Duration</div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-orange-600" />
                        Important Instructions
                    </h2>
                    <ul className="space-y-3">
                        {pattern.instructions && pattern.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{instruction}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Marking Scheme */}
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Award size={18} className="text-yellow-600" />
                            Marking Scheme
                        </h3>
                        <div className="space-y-1 text-sm">
                            {pattern.negativeMarking.MCQ !== 0 && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">MCQ:</span> Correct answer = Full marks,
                                    Incorrect = {pattern.negativeMarking.MCQ} marks
                                </p>
                            )}
                            {pattern.negativeMarking.NAT === 0 && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">Numerical:</span> No negative marking
                                </p>
                            )}
                        </div>
                    </div>

                    {/* General Guidelines */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            General Guidelines
                        </h3>
                        <ul className="space-y-1 text-sm text-gray-700">
                            <li>• You can navigate between questions using the question palette</li>
                            <li>• Mark questions for review to revisit them later</li>
                            <li>• Your responses are auto-saved every 30 seconds</li>
                            <li>• The test will auto-submit when time expires</li>
                            <li>• Ensure stable internet connection throughout the test</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onStart}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        <CheckCircle size={20} />
                        I'm Ready to Begin
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestInstructions;
