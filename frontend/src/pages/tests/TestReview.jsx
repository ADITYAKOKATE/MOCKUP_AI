import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Bookmark, ChevronRight, ChevronLeft, Flag, Zap, Clock } from 'lucide-react';
import QuestionRenderer from './components/QuestionRenderer';

const TestReview = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const data = await api.getTestResults(attemptId);
                setResult(data);
                setQuestions(data.questions || []);
            } catch (error) {
                console.error("Failed to fetch review", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    }, [attemptId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium">Loading analysis...</p>
            </div>
        </div>
    );

    if (!result) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
                <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Attempt not found</h3>
                <button
                    onClick={() => navigate('/my-tests')}
                    className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                    Back to History
                </button>
            </div>
        </div>
    );

    const currentQuestion = questions[currentIndex];

    // Helper for sidebar indicators
    const getStatusColor = (question) => {
        if (question.isCorrect) return 'bg-green-100 text-green-700 border-green-200';
        if (question.userAnswer) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-50 text-gray-400 border-gray-200';
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col h-screen overflow-hidden font-sans">

            {/* Top Bar */}
            <header className="bg-white h-16 border-b px-6 flex items-center justify-between shrink-0 z-20 shadow-sm relative">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/my-tests')}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors flex items-center gap-2 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm hidden md:block">Exit Review</span>
                    </button>
                    <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                    <div>
                        <h1 className="font-black text-gray-900 leading-tight flex items-center gap-2">
                            {result.examType}
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">Review Mode</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score</div>
                        <div className="font-black text-gray-900 text-lg leading-none">
                            {result.score} <span className="text-gray-300">/ {result.totalMarks}</span>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-gray-100">
                        {Math.round((result.score / result.totalMarks) * 100)}%
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar Question Navigator */}
                <aside className="w-20 md:w-72 bg-white border-r overflow-y-auto hidden md:flex flex-col z-10">
                    <div className="p-6 sticky top-0 bg-white z-10 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Navigator</h3>
                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600">{currentIndex + 1}/{questions.length}</span>
                        </div>

                        <div className="flex gap-2 text-xs font-medium text-gray-500 mb-2">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Correct</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Wrong</div>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-4 gap-2 content-start">
                        {questions.map((q, idx) => (
                            <button
                                key={q.questionId}
                                onClick={() => setCurrentIndex(idx)}
                                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 relative ${currentIndex === idx
                                    ? 'ring-2 ring-gray-900 ring-offset-2 scale-105 z-10 shadow-md'
                                    : 'hover:scale-105 hover:shadow-sm'
                                    } ${getStatusColor(q)}`}
                            >
                                {idx + 1}
                                {currentIndex === idx && (
                                    <div className="absolute -bottom-1 w-1 h-1 bg-gray-900 rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">

                        {/* Question Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-10 relative overflow-hidden">
                            {/* Decorative gradient line */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${currentQuestion.isCorrect ? 'bg-green-500' :
                                currentQuestion.userAnswer ? 'bg-red-500' : 'bg-gray-300'
                                }`} />

                            {/* Question Header */}
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-8 pl-4">
                                <div className="flex items-center gap-3">
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">
                                        Q{currentIndex + 1}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Single Correct Type
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm border ${currentQuestion.isCorrect ? 'bg-green-50 text-green-700 border-green-100' :
                                        currentQuestion.userAnswer ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                        {currentQuestion.isCorrect ? <CheckCircle size={16} className="fill-current bg-white rounded-full" /> :
                                            currentQuestion.userAnswer ? <XCircle size={16} className="fill-current bg-white rounded-full" /> : <AlertCircle size={16} />}
                                        {currentQuestion.isCorrect ? 'Correct Answer' :
                                            currentQuestion.userAnswer ? 'Incorrect Answer' : 'Not Attempted'}
                                    </div>
                                    <div className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-200">
                                        <Clock size={16} className="text-gray-400" />
                                        {currentQuestion.timeTaken ? (currentQuestion.timeTaken < 60 ? `${currentQuestion.timeTaken}s` : `${Math.floor(currentQuestion.timeTaken / 60)}m ${currentQuestion.timeTaken % 60}s`) : '0s'}
                                    </div>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="prose prose-lg max-w-none mb-10 pl-4">
                                <div className="text-gray-900 font-medium leading-relaxed">
                                    <QuestionRenderer content={currentQuestion.questionText} />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-4 pl-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const label = String.fromCharCode(65 + idx);
                                    const isUserSelected = currentQuestion.userAnswer === label;
                                    const isCorrect = label === currentQuestion.correctAnswer || (currentQuestion.correctAnswer === idx.toString());

                                    let style = 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm';
                                    let indicator = <div className="w-6 h-6 rounded-full border-2 border-gray-200 text-xs flex items-center justify-center font-bold text-gray-400">{label}</div>;

                                    if (isUserSelected && currentQuestion.isCorrect) {
                                        style = 'border-green-500 bg-green-50/50 ring-1 ring-green-500';
                                        indicator = <CheckCircle size={24} className="text-green-600 fill-green-100" />;
                                    } else if (isUserSelected && !currentQuestion.isCorrect) {
                                        style = 'border-red-500 bg-red-50/50 ring-1 ring-red-500';
                                        indicator = <XCircle size={24} className="text-red-600 fill-red-100" />;
                                    } else if (label === currentQuestion.correctAnswer) {
                                        style = 'border-green-500 bg-green-50/30 ring-1 ring-green-500';
                                        indicator = <CheckCircle size={24} className="text-green-600 fill-green-100" />;
                                    }

                                    return (
                                        <div key={idx} className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${style}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="shrink-0">{indicator}</div>
                                                <span className="font-medium text-gray-800 text-lg group-hover:text-gray-900 transition-colors">
                                                    <QuestionRenderer content={option} />
                                                </span>
                                            </div>
                                            {isUserSelected && (
                                                <div className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/50 rounded-md text-gray-500">
                                                    Your Answer
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap size={120} className="text-blue-600" />
                            </div>

                            <h3 className="text-blue-900 font-black text-lg flex items-center gap-2 mb-4 relative z-10">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <Bookmark size={20} className="fill-current" />
                                </div>
                                Solution & Concept
                            </h3>

                            <div className="prose prose-blue max-w-none relative z-10">
                                <p className="text-blue-800 leading-relaxed font-medium">
                                    The correct answer is derived by analyzing the fundamental principles...
                                    (This is a placeholder for the detailed step-by-step solution provided by our expert faculty. In the production version, this would contain LaTeX formatted equations and diagrams.)
                                </p>
                            </div>
                        </div>

                    </div>
                </main>

                {/* Mobile Navigation Footer */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="p-3 bg-gray-100 rounded-xl disabled:opacity-50 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="font-black text-gray-900 text-lg">{currentIndex + 1} <span className="text-gray-400 font-medium text-sm">/ {questions.length}</span></span>
                    </div>

                    <button
                        onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="p-3 bg-gray-900 text-white rounded-xl disabled:opacity-50 hover:bg-black active:scale-95 transition-all shadow-lg shadow-gray-200"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TestReview;
