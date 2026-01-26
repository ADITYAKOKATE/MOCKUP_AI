import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FullTestUI from './FullTestUI.jsx';
import ShortTestUI from './ShortTestUI.jsx';
import TopicSelectionModal from './TopicSelectionModal.jsx';
import TestInstructions from './TestInstructions.jsx';
import toast from 'react-hot-toast';

import { ChevronRight, LayoutGrid, Clock, BookOpen, Shuffle, Sparkles, Target, Zap, AlertTriangle, PlayCircle, RefreshCw } from 'lucide-react';
import TestResults from './TestResults.jsx';

const Tests = () => {
    const { selectedExam } = useAuth();
    const navigate = useNavigate();

    // Test flow states
    const [testMode, setTestMode] = useState(null); // null, 'full', 'subject', etc.
    const [showInstructions, setShowInstructions] = useState(false);
    const [testPattern, setTestPattern] = useState(null);
    const [testResults, setTestResults] = useState(null);

    // Resume Modal State
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);

    // Full test session states
    const [sessionId, setSessionId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [timeLeft, setTimeLeft] = useState(3600);
    const [isActive, setIsActive] = useState(false);

    // Topic-wise test states
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Auto-submit when time expires
            handleAutoSubmit();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Auto-save responses every 30 seconds
    useEffect(() => {
        if (!sessionId || !isActive) return;

        const autoSaveInterval = setInterval(() => {
            // Auto-save logic would go here
            console.log('Auto-saving responses...');
        }, 30000);

        return () => clearInterval(autoSaveInterval);
    }, [sessionId, isActive, responses]);

    // Handle full test click
    const handleFullTestClick = async () => {
        try {
            setLoading(true);
            setTestMode('full');
            setTestResults(null);

            // Attempt to start - backend will match pattern or return 400 if active
            const data = await api.startFullTest(selectedExam);

            // If successful immediately (no active session conflict)
            setTestPattern(data.pattern);
            setShowInstructions(true);
            setSessionId(data.sessionId);
            setQuestions(data.questions);
            setTimeLeft(data.pattern.duration * 60);

        } catch (error) {
            console.error('Failed to start full test:', error);

            // Check if it's an "Active Session" conflict
            if (error.data && error.data.sessionId) {
                setActiveSessionId(error.data.sessionId);
                setShowResumeModal(true);
                return;
            }

            toast.error(error.message || 'Failed to start test');
            setTestMode(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle Resume Session
    const handleResumeSession = async () => {
        try {
            setLoading(true);
            setShowResumeModal(false);

            const data = await api.getSession(activeSessionId);

            // Assuming getSession returns pattern info too, or we infer it
            // Ideally backend getSession should return pattern details.
            // For now, let's re-fetch pattern implicitly or just route to UI.

            // We need the pattern for duration etc.
            // Since we are resuming, let's just use the session data.

            setSessionId(data.sessionId);
            setQuestions(data.questions);
            setResponses(data.responses || {});
            setTimeLeft(data.timeRemaining);

            // Mock pattern if not returned fully, or fetch it separately
            // For robust Resume, we jump straight to Active state
            setIsActive(true);
            setTestMode('full');

            toast.success('Resumed previous session');
        } catch (error) {
            console.error("Result Error", error);
            toast.error("Failed to resume session");
            setTestMode(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle Start New Session (Discard Old)
    const handleStartNewSession = async () => {
        try {
            setLoading(true);
            setShowResumeModal(false);

            await api.discardSession(activeSessionId);

            // Retry starting full test
            const data = await api.startFullTest(selectedExam);

            setTestPattern(data.pattern);
            setShowInstructions(true);
            setSessionId(data.sessionId);
            setQuestions(data.questions);
            setTimeLeft(data.pattern.duration * 60);

        } catch (error) {
            console.error('Failed to start new test:', error);
            toast.error('Failed to start new test');
            setTestMode(null);
        } finally {
            setLoading(false);
        }
    };


    // Handle instructions confirmation
    const handleStartTest = () => {
        setShowInstructions(false);
        setIsActive(true);
    };

    // Handle cancel from instructions
    const handleCancelInstructions = () => {
        setShowInstructions(false);
        setTestMode(null);
        setTestPattern(null);
        setSessionId(null);
        setQuestions([]);
    };

    // Handle Back from Results
    const handleBackFromResults = () => {
        setTestResults(null);
        setTestMode(null);
        setSessionId(null);
        setQuestions([]);
        setResponses({});
    };

    // Fetch Questions for non-full tests
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            let data;

            if (testMode === 'topic-wise' && selectedTopic) {
                data = await api.getQuestionsByTopic(selectedExam, selectedTopic, 15);
            } else if (testMode === 'revision') {
                data = await api.getRevisionQuestions(selectedExam, 20);
            } else {
                data = await api.generateQuestions({ examType: selectedExam });
            }

            const formattedQuestions = data.map(q => ({
                id: q._id,
                text: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                image: q.image,
                type: q.type,
                subject: q.subject
            }));

            setQuestions(formattedQuestions);
            if (formattedQuestions.length > 0) {
                setIsActive(true);
            }
        } catch (error) {
            console.error("Failed to load questions", error);
            toast.error("Failed to load test questions");
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch when mode is selected (for non-full tests)
    useEffect(() => {
        if (testMode && testMode !== 'full' && testMode !== 'topic-wise') {
            fetchQuestions();
        }
    }, [testMode, selectedExam]);

    // Handle topic selection
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        setShowTopicModal(false);
        setTimeout(() => {
            fetchQuestions();
        }, 100);
    };

    // Time Tracking Refs
    const startTimeRef = React.useRef(Date.now());
    const activeQuestionIdRef = React.useRef(null);

    // Initial Time Setup
    useEffect(() => {
        if (questions.length > 0) {
            activeQuestionIdRef.current = questions[currentQuestionIndex]?.id;
            startTimeRef.current = Date.now();
        }
    }, [questions, currentQuestionIndex]);

    // Helper: Save accumulated time for a question
    const saveTimeForQuestion = (qId) => {
        if (!qId) return;

        const now = Date.now();
        const elapsedSec = Math.round((now - startTimeRef.current) / 1000);

        if (elapsedSec < 1) return; // Ignore neglible time

        setResponses(prev => {
            const currentData = prev[qId] || {};
            const oldTime = currentData.timeTaken || 0;
            const newTime = oldTime + elapsedSec;

            // Sync to backend if session active
            if (sessionId && testMode === 'full') {
                // Send accumulated time, not just delta
                api.saveResponse(sessionId, qId, currentData.answer, newTime, currentData.marked)
                    .catch(e => console.error("Auto-save time failed", e));
            }

            return {
                ...prev,
                [qId]: { ...currentData, timeTaken: newTime }
            };
        });

        // Reset timer
        startTimeRef.current = Date.now();
    };

    // Handlers
    const handleQuestionChange = (index) => {
        // Save time for current question before switching
        const currentQId = questions[currentQuestionIndex]?.id;
        saveTimeForQuestion(currentQId);

        setCurrentQuestionIndex(index);
        // Reset timer happens in Effect due to dependency on index
    };

    const handleAnswer = async (qId, value) => {
        // Calculate time up to this answer
        const now = Date.now();
        const elapsedSec = Math.round((now - startTimeRef.current) / 1000);

        // Reset timer part-way so we don't double count
        startTimeRef.current = Date.now();

        setResponses(prev => {
            const currentData = prev[qId] || {};
            const oldTime = currentData.timeTaken || 0;
            const newTime = oldTime + elapsedSec;

            // Save response to backend
            if (sessionId && testMode === 'full') {
                api.saveResponse(sessionId, qId, value, newTime, currentData.marked)
                    .catch(err => console.error('Failed to save response:', err));
            }

            return {
                ...prev,
                [qId]: { ...currentData, answer: value, timeTaken: newTime }
            };
        });
    };

    const handleMarkForReview = async (qId) => {
        setResponses(prev => {
            const currentData = prev[qId] || {};
            const newVal = !currentData.marked;

            if (sessionId && testMode === 'full') {
                // Use existing time, don't update time on mark toggle
                api.saveResponse(sessionId, qId, currentData.answer, currentData.timeTaken || 0, newVal)
                    .catch(e => console.error('Failed to update mark:', e));
            }

            return {
                ...prev,
                [qId]: { ...currentData, marked: newVal }
            };
        });
    };

    const handleClearResponse = (qId) => {
        setResponses(prev => {
            const currentData = prev[qId] || {};
            // Just clear answer, keep time and mark? Usually yes.

            if (sessionId && testMode === 'full') {
                api.saveResponse(sessionId, qId, null, currentData.timeTaken || 0, currentData.marked)
                    .catch(e => console.error('Failed to clear:', e));
            }

            const newResp = { ...prev };
            if (newResp[qId]) {
                delete newResp[qId].answer; // OR set to null
                // newResp[qId].answer = null; // Better to set null for explicit clear
            }
            return newResp;
        });
    };

    const handleSubmit = async () => {
        // Save time for final question
        const currentQId = questions[currentQuestionIndex]?.id;
        saveTimeForQuestion(currentQId);

        setIsActive(false);
        setLoading(true);

        if (sessionId && testMode === 'full') {
            try {
                const result = await api.submitTest(sessionId);
                setTestResults(result);
                toast.success(`Test Submitted Successfully!`);
            } catch (error) {
                console.error('Failed to submit test:', error);
                toast.error('Failed to submit test');
            } finally {
                setLoading(false);
            }
        } else {
            alert("Test Submitted! (Mock)");
            setTestMode(null);
            setLoading(false);
        }
    };

    const handleAutoSubmit = async () => {
        toast.error('Time expired! Auto-submitting test...');
        await handleSubmit();
    };

    // Handle topic-wise test mode
    const handleTopicWiseClick = () => {
        setTestMode('topic-wise');
        setShowTopicModal(true);
    };

    // Show Results Screen
    if (testResults) {
        return <TestResults results={testResults} onBack={handleBackFromResults} />;
    }

    // Resume Confirmation Modal
    if (showResumeModal) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-yellow-100 p-3 rounded-full mb-4">
                            <AlertTriangle className="text-yellow-600 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Active Test Session Found</h3>
                        <p className="text-gray-500 mb-6">
                            You have an unfinished test in progress. Would you like to resume it or start a fresh one?
                        </p>

                        <div className="grid grid-cols-1 gap-3 w-full">
                            <button
                                onClick={handleResumeSession}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <PlayCircle size={20} />
                                Resume Previous Test
                            </button>
                            <button
                                onClick={handleStartNewSession}
                                className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} />
                                Start Fresh (Discard Old)
                            </button>
                            <button
                                onClick={() => {
                                    setShowResumeModal(false);
                                    setTestMode(null);
                                    setLoading(false);
                                }}
                                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show instructions screen
    if (showInstructions && testPattern) {
        return (
            <TestInstructions
                pattern={testPattern}
                onStart={handleStartTest}
                onCancel={handleCancelInstructions}
            />
        );
    }

    // Render Selection Screen
    if (!testMode) {
        return (
            <div className="h-full w-full bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Full Test Card */}
                    <button
                        onClick={handleFullTestClick}
                        disabled={loading}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-blue-500 text-left transition-all group cursor-pointer h-full flex flex-col disabled:opacity-50"
                    >
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <LayoutGrid size={24} className="text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Full Test</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                            Simulate a real exam environment with proper pattern, timer, and detailed analytics.
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            {loading ? 'Loading...' : 'Start Full Test'} <ChevronRight size={16} />
                        </div>
                    </button>

                    {/* Subject Wise Card */}
                    <button
                        onClick={() => setTestMode('subject')}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-indigo-500 text-left transition-all group cursor-pointer h-full flex flex-col"
                    >
                        <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen size={24} className="text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Subject Wise</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                            Focus on specific subjects to strengthen your weak areas with targeted practice questions.
                        </p>
                        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            Start Subject Test <ChevronRight size={16} />
                        </div>
                    </button>

                    {/* Topic-wise Test Card */}
                    <button
                        onClick={handleTopicWiseClick}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-teal-500 text-left transition-all group cursor-pointer h-full flex flex-col"
                    >
                        <div className="h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target size={24} className="text-teal-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Topic-wise Test</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                            Master specific topics with focused practice. Select from available topics and start learning.
                        </p>
                        <div className="flex items-center gap-2 text-teal-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            Choose Topic <ChevronRight size={16} />
                        </div>
                    </button>

                    {/* Random Questions Card */}
                    <button
                        onClick={() => setTestMode('random')}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-emerald-500 text-left transition-all group cursor-pointer h-full flex flex-col"
                    >
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Shuffle size={24} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Random Mix</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                            Quick practice with a random mix of questions to keep you on your toes.
                        </p>
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            Start Random Quiz <ChevronRight size={16} />
                        </div>
                    </button>

                    {/* Revision Test Card */}
                    <button
                        onClick={() => setTestMode('revision')}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-orange-500 text-left transition-all group cursor-pointer h-full flex flex-col"
                    >
                        <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap size={24} className="text-orange-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Revision Test</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                            High-importance questions for last-minute revision before your exam. Quick and effective!
                        </p>
                        <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            Start Revision <ChevronRight size={16} />
                        </div>
                    </button>

                    {/* AI Recommended Card */}
                    <button
                        onClick={() => navigate('/ai-recommendations')}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-purple-500 text-left transition-all group cursor-pointer h-full flex flex-col"
                    >
                        <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Sparkles size={24} className="text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">AI Recommended</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                            Personalized test recommendations based on your weak topics and performance history.
                        </p>
                        <div className="flex items-center gap-2 text-purple-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                            View Recommendations <ChevronRight size={16} />
                        </div>
                    </button>
                </div>

                {/* Topic Selection Modal */}
                <TopicSelectionModal
                    isOpen={showTopicModal}
                    onClose={() => {
                        setShowTopicModal(false);
                        setTestMode(null);
                    }}
                    examName={selectedExam}
                    onTopicSelect={handleTopicSelect}
                />
            </div>
        );
    }

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading questions...</div>;
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 font-medium">Failed to load questions for the selected exam.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Props Bundle
    const uiProps = {
        questions,
        currentQuestionIndex,
        onQuestionChange: handleQuestionChange,
        responses,
        onAnswer: handleAnswer,
        timeLeft,
        onMarkForReview: handleMarkForReview,
        onClearResponse: handleClearResponse,
        onSubmit: handleSubmit,
        sessionId,
        testMode
    };

    // Render based on mode
    if (testMode !== 'full') {
        return <ShortTestUI {...uiProps} />;
    }

    // Default to Full UI
    return (
        <div className="relative h-full w-full">
            <FullTestUI {...uiProps} />
        </div>
    );
};

export default Tests;
