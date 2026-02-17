
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FullTestUI from './FullTestUI.jsx';
import ShortTestUI from './ShortTestUI.jsx';
import TopicSelectionModal from './TopicSelectionModal.jsx';
import CustomTestModal from './CustomTestModal.jsx';
import TestInstructions from './TestInstructions.jsx';
import toast from 'react-hot-toast';

import { ChevronRight, LayoutGrid, Clock, BookOpen, Shuffle, Sparkles, Target, Zap, AlertTriangle, PlayCircle, RefreshCw, Dna, ArrowRight } from 'lucide-react';
import TestResults from './TestResults.jsx';
import SubjectSelectionModal from './SubjectSelectionModal.jsx';

const TestCard = ({ title, description, icon: Icon, color, onClick, actionText, loading, status }) => {
    const isTerminated = status === 'terminated';

    // Override colors if terminated
    const colorClasses = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'hover:border-blue-500' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'hover:border-indigo-500' },
        teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'hover:border-teal-500' },
        violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'hover:border-violet-500' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'hover:border-orange-500' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'hover:border-purple-500' },
        red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500 bg-red-50' }, // Terminated style
    };

    const currentString = isTerminated ? colorClasses.red : (colorClasses[color] || colorClasses.blue);

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 ${currentString.border} text-left transition-all duration-300 cursor-pointer h-full flex flex-col disabled:opacity-50 ${isTerminated ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
        >
            {/* Background Watermark Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={80} className={`${currentString.text} rotate-12`} />
            </div>

            <div className={`h-12 w-12 ${currentString.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 z-10 relative`}>
                {isTerminated ? <AlertTriangle size={24} className="text-red-600" /> : <Icon size={24} className={currentString.text} />}
            </div>

            <h2 className={`text-xl font-bold text-gray-900 mb-2 group-hover:${currentString.text} transition-colors z-10 relative`}>{title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 z-10 relative">
                {isTerminated ? "This test was terminated due to proctoring violations." : description}
            </p>

            <div className={`flex items-center gap-2 ${currentString.text} text-sm font-semibold group-hover:translate-x-1 transition-transform z-10 relative`}>
                {isTerminated ? "View Violations" : actionText} <ChevronRight size={16} />
            </div>
        </button>
    );
};

const Tests = () => {
    const { selectedExam } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Test flow states
    const [testMode, setTestMode] = useState(null); // null, 'full', 'subject', etc.
    const [showInstructions, setShowInstructions] = useState(false);
    const [testPattern, setTestPattern] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeSessionStatus, setActiveSessionStatus] = useState(null);

    // activeSessionStatus effect
    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                // Fetch user attempts to check for last active/terminated session
                const history = await api.getTestHistory();
                // We assume getUserAttempts returns sorted list. 
                // If not, we might need a dedicated endpoint or Client sort. 
                // Assuming default is simple list.

                if (history && history.length > 0) {
                    const last = history[0];
                    if (last.status === 'active') { // Only check for active
                        setActiveSessionId(last._id);
                        setActiveSessionStatus(last.status);
                    }
                }
            } catch (e) {
                console.error("Failed to check active session", e);
            }
        };
        checkActiveSession();
    }, []);


    // ... (rest of states)

    // Check for active session on mount
    useEffect(() => {
        checkActiveSession();
    }, []);

    const checkActiveSession = async () => {
        try {
            // We need an API to get current active session status without starting one
            // Ideally `api.getUserAttempts` or a specific `api.getActiveSession`
            // For now, let's try to infer or added a lightweight check if possible.
            // Or we rely on the error from startAttempt.

            // Actually, let's fetch the most recent session to see if it was terminated/active
            const history = await api.getUserAttempts();
            const lastSession = history[0]; // Assuming sorted by date desc

            if (lastSession && lastSession.status === 'active') { // Only check for active
                setActiveSessionId(lastSession._id);
                setActiveSessionStatus(lastSession.status);
            }
        } catch (e) {
            console.error("Failed to check active session", e);
        }
    };
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [subjectForTopic, setSubjectForTopic] = useState(null);
    const [testIntent, setTestIntent] = useState(null); // 'subject', 'topic' (to track selection flow)
    const [pendingCustomConfig, setPendingCustomConfig] = useState(null); // For retrying custom test (to track selection flow)

    // Full test session states
    const [sessionId, setSessionId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [timeLeft, setTimeLeft] = useState(3600);
    const [isActive, setIsActive] = useState(false);

    // Topic-wise test states
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Subject-wise test states
    const [selectedSubject, setSelectedSubject] = useState(null);

    // Check for session ID passed from other pages (e.g., Topic Test)
    useEffect(() => {
        if (location.state && location.state.sessionId && !sessionId) {
            console.log("Hydrating session from navigation state:", location.state.sessionId);
            hydrateSession(location.state.sessionId);
            // Clear state so we don't re-hydrate on refresh weirdly (optional, but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const hydrateSession = async (sid) => {
        try {
            setLoading(true);
            const data = await api.getSession(sid);

            setSessionId(data.sessionId);
            setQuestions(data.questions);
            setResponses(data.responses || {});
            setTimeLeft(data.timeRemaining);

            if (data.status === 'terminated' || data.status === 'submitted') {
                // Show results immediately
                const result = await api.submitTest(sid); // Get results
                setTestResults(result); // Show results screen
            } else {
                // Resume active
                setTestMode('full');
                setIsActive(true);
                toast.success("Resuming Test Session...");
            }
        } catch (error) {
            console.error("Failed to hydrate session:", error);
            toast.error("Failed to load test session");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

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
    // Handle full test click
    const handleFullTestClick = async () => {
        try {
            setLoading(true);
            setTestMode('full');
            setTestResults(null);

            // Fetch pattern only - do not start session yet
            const pattern = await api.getExamPattern(selectedExam);

            setTestPattern(pattern);
            setShowInstructions(true);
            setSessionId(null); // No session yet
            // setQuestions([]); // Don't allow questions yet
            // setTimeLeft(pattern.duration * 60); // Will be set on start
        } catch (error) {
            console.error('Failed to fetch exam pattern:', error);
            toast.error(error.message || 'Failed to details');
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
    const handleStartNewSession = async (shouldShowInstructions = true) => {
        setLoading(true);
        setShowResumeModal(false);

        let currentActiveId = activeSessionId;
        let retryCount = 0;
        const MAX_RETRIES = 5;

        try {
            while (retryCount < MAX_RETRIES) {
                // 1. Discard current conflicting session if known
                if (currentActiveId) {
                    try {
                        console.log(`[Tests] Discarding blocking session: ${currentActiveId}`);
                        await api.discardSession(currentActiveId);
                    } catch (e) {
                        console.warn("Session discard failed (maybe already gone), continuing...", e);
                    }
                }

                // 2. Attempt to start the requested test
                try {
                    let data;
                    // Determine which test to restart based on mode or intent
                    if ((testMode === 'subject' || testIntent === 'subject') && selectedSubject) {
                        data = await api.startSubjectTest(selectedExam, selectedSubject);
                        setTestMode('subject');
                        toast.success(`Subject Test Ready: ${selectedSubject}`);
                    } else if ((testMode === 'topic' || testIntent === 'topic') && selectedSubject && selectedTopic) {
                        data = await api.startTopicTest(selectedExam, selectedSubject, selectedTopic);
                        setTestMode('topic');
                        toast.success(`Topic Test Ready: ${selectedTopic}`);
                    } else if (testMode === 'random' && pendingCustomConfig) {
                        data = await api.startCustomTest({
                            examType: selectedExam,
                            ...pendingCustomConfig
                        });
                        setTestMode('random');
                        toast.success('Custom Test Started!');
                    } else {
                        // Default to Full Test
                        data = await api.startFullTest(selectedExam);
                        setTestMode('full');
                    }

                    // 3. Success! Set state and break loop
                    setSessionId(data.sessionId);
                    setQuestions(data.questions);
                    setTestPattern(data.pattern);

                    // Specific logic for duration
                    if (testMode === 'random' && pendingCustomConfig) {
                        setTimeLeft((pendingCustomConfig.duration || 30) * 60);
                    } else if (data.pattern && data.pattern.duration) {
                        setTimeLeft(data.pattern.duration * 60);
                    } else {
                        setTimeLeft(3600); // Fallback
                    }

                    if (shouldShowInstructions) {
                        setShowInstructions(true);
                    } else {
                        // If instructions not needed, start immediately
                        setShowInstructions(false);
                        setIsActive(true);
                    }

                    setLoading(false);
                    return; // Exit function

                } catch (error) {
                    console.error('Start attempt failed:', error);

                    // 4. Check if it's ANOTHER active session conflict
                    if (error.data && error.data.sessionId) {
                        console.warn(`[Tests] Found another active session: ${error.data.sessionId}. Retrying...`);
                        currentActiveId = error.data.sessionId; // Update ID for next loop
                        retryCount++;
                    } else {
                        // Real error (network, validation, etc.) - Throw to outer catch
                        throw error;
                    }
                }
            }

            throw new Error("Too many active sessions. Please clear your history or contact support.");

        } catch (error) {
            console.error('Failed to start new test after retries:', error);
            toast.error(error.message || 'Failed to start new test');
            setTestMode(null);
            setLoading(false);
        }
    };

    // Handle Discard Active Session (from Quit Modal)
    const handleDiscardSession = async () => {
        if (!sessionId) {
            // If local mock test
            setTestMode(null);
            setQuestions([]);
            return;
        }

        try {
            setLoading(true);
            await api.discardSession(sessionId);
            toast.success('Test attempt discarded');
            setTestMode(null);
            setSessionId(null);
            setQuestions([]);
            setIsActive(false);
        } catch (error) {
            console.error('Failed to discard session:', error);
            toast.error('Failed to discard session');
        } finally {
            setLoading(false);
        }
    };

    // Handle Save and Exit (Quit without discarding)
    const handleSaveAndExit = () => {
        // Just navigate away or reset mode. Session remains active on server.
        // We might want to ensure time is saved one last time?
        // saveTimeForQuestion is called by effects or unmount logic usually, but let's be safe:
        // Actually saveTimeForQuestion uses current Index logic which might be complex to invoke purely here.
        // But auto-save works on interval.

        toast.success("Progress saved. You can resume this test later.");
        setTestMode(null);
        setSessionId(null);
        setQuestions([]);
        setIsActive(false);
        navigate('/dashboard'); // Or just go back to test list
    };


    // Attempt to start test (Gentle - Checks for conflict)
    const attemptStartTest = async () => {
        try {
            setLoading(true);
            let data;

            // 1. Try to start the requested test directly
            if ((testMode === 'subject' || testIntent === 'subject') && selectedSubject) {
                data = await api.startSubjectTest(selectedExam, selectedSubject);
                setTestMode('subject');
                toast.success(`Subject Test Ready: ${selectedSubject}`);
            } else if ((testMode === 'topic' || testIntent === 'topic') && selectedSubject && selectedTopic) {
                data = await api.startTopicTest(selectedExam, selectedSubject, selectedTopic);
                setTestMode('topic');
                toast.success(`Topic Test Ready: ${selectedTopic}`);
            } else if (testMode === 'random' && pendingCustomConfig) {
                data = await api.startCustomTest({
                    examType: selectedExam,
                    ...pendingCustomConfig
                });
                setTestMode('random');
                toast.success('Custom Test Started!');
            } else {
                // Default to Full Test
                data = await api.startFullTest(selectedExam);
                setTestMode('full');
            }

            // 2. Success!
            setSessionId(data.sessionId);
            setQuestions(data.questions);
            setTestPattern(data.pattern);

            if (testMode === 'random' && pendingCustomConfig) {
                setTimeLeft((pendingCustomConfig.duration || 30) * 60);
            } else if (data.pattern && data.pattern.duration) {
                setTimeLeft(data.pattern.duration * 60);
            } else {
                setTimeLeft(3600);
            }

            setShowInstructions(false);
            setIsActive(true);

        } catch (error) {
            console.error('Start attempt failed:', error);

            // 3. Check for Active Session Conflict
            if (error.data && error.data.sessionId) {
                console.warn(`[Tests] Active session found: ${error.data.sessionId}`);
                setActiveSessionId(error.data.sessionId);
                setShowResumeModal(true); // Show the choice to user!
            } else {
                toast.error(error.message || 'Failed to start test');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle instructions confirmation
    const handleStartTest = async () => {
        if (!sessionId) {
            // Session not started yet (deferred start)
            await attemptStartTest();
        } else {
            // Session already active
            setShowInstructions(false);
            setIsActive(true);
        }
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
        if (testMode && testMode !== 'full' && testMode !== 'topic' && testMode !== 'topic-wise' && testMode !== 'subject' && testMode !== 'random') {
            fetchQuestions();
        }
    }, [testMode, selectedExam]);



    // Handle subject selection
    const handleSubjectSelect = async (subject) => {
        setIsSubjectModalOpen(false);
        setSelectedSubject(subject);

        // If Topic Wise Test, open Topic Modal next
        if (testIntent === 'topic') {
            setSubjectForTopic(subject);
            setTimeout(() => setIsTopicModalOpen(true), 100);
            return;
        }

        // Else Start Subject Test immediately
        try {
            setLoading(true);
            setTestMode('subject'); // Set mode to subject

            // Start Subject Test Session
            const data = await api.startSubjectTest(selectedExam, subject);

            // Set Session Data & Pattern for Instructions
            setSessionId(data.sessionId);
            setQuestions(data.questions);
            setTestPattern(data.pattern); // Set pattern for instructions
            setShowInstructions(true);    // Show instructions first
            setTimeLeft(data.pattern.duration * 60 || 3600);

            toast.success(`Subject Test Ready: ${subject} `);
        } catch (error) {
            console.error('Failed to start subject test:', error);

            // Handle Active Session Error
            const errData = error.data || {};
            if (errData.activeSessionId || errData.sessionId) {
                setActiveSessionId(errData.activeSessionId || errData.sessionId);
                setShowResumeModal(true);
            } else {
                toast.error(error.message || 'Failed to start subject test');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTopicSelect = async (subject, topic) => {
        try {
            setLoading(true);
            setIsTopicModalOpen(false);
            setSelectedTopic(topic); // Keep track of selected topic

            const data = await api.startTopicTest(selectedExam, subject, topic);
            setSessionId(data.sessionId);
            setTestMode('topic');
            setQuestions(data.questions);
            setCurrentQuestionIndex(0);
            setTimeLeft(data.pattern?.duration * 60 || 1800);
            setTestPattern(data.pattern);
            setShowInstructions(true); // Show instructions for topic test
            toast.success(`Starting ${topic} Test!`);

        } catch (error) {
            console.error("Failed to start topic test:", error);
            if (error.data && error.data.sessionId) {
                toast.error("Active session found!");
                setActiveSessionId(error.data.sessionId);
                setShowResumeModal(true);
            } else {
                toast.error(error.message || "Failed to start topic test");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCustomTestStart = async (config) => {
        try {
            setLoading(true);
            setIsCustomModalOpen(false);

            const data = await api.startCustomTest({
                examType: selectedExam,
                ...config
            });

            setSessionId(data.sessionId);
            setTestMode('random'); // We can treat it like topic/subject logic-wise
            setQuestions(data.questions);
            setCurrentQuestionIndex(0);
            setTimeLeft(config.duration * 60);
            setTestPattern(data.pattern);
            setShowInstructions(true); // Show instructions for custom test
            toast.success('Custom Test Started!');

        } catch (error) {
            console.error("Failed to start custom test:", error);
            if (error.data && error.data.sessionId) {
                toast.error("Active session found!");
                setActiveSessionId(error.data.sessionId);
                setPendingCustomConfig(config); // Save for retry
                setTestMode('random'); // Mark intent
                setShowResumeModal(true);
            } else {
                toast.error(error.message || "Failed to start custom test");
            }
        } finally {
            setLoading(false);
        }
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
            if (sessionId && (testMode === 'full' || testMode === 'subject' || testMode === 'topic' || testMode === 'random')) {
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
            if (sessionId && (testMode === 'full' || testMode === 'subject' || testMode === 'topic' || testMode === 'random')) {
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

            if (sessionId && (testMode === 'full' || testMode === 'subject' || testMode === 'topic' || testMode === 'random')) {
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

            if (sessionId && (testMode === 'full' || testMode === 'subject' || testMode === 'topic' || testMode === 'random')) {
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

    const handleSubmit = async (payload = {}) => {
        // Sanitize payload: If it's a browser event, ignore it
        if (payload && (payload.nativeEvent || payload.preventDefault || payload.stopPropagation || payload.target)) {
            payload = {};
        }

        // Save time for final question
        const currentQId = questions[currentQuestionIndex]?.id;
        saveTimeForQuestion(currentQId);

        setIsActive(false);
        setLoading(true);

        if (sessionId && (testMode === 'full' || testMode === 'subject' || testMode === 'topic' || testMode === 'random')) {
            try {
                const result = await api.submitTest(sessionId, payload);
                setTestResults(result);
                toast.success(`Test Submitted Successfully!`);
            } catch (error) {
                console.error('Failed to submit test:', error);
                const errorMsg = error.response?.data?.details || error.response?.data?.message || 'Failed to submit test';
                toast.error(`Error: ${errorMsg} `);
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
        setTestIntent('topic');
        setIsSubjectModalOpen(true);
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
                    <TestCard
                        title="Full Test"
                        description="Simulate a real exam environment with proper pattern, timer, and detailed analytics."
                        icon={LayoutGrid}
                        color="blue"
                        onClick={() => {
                            if (activeSessionId && activeSessionStatus === 'active') {
                                setShowResumeModal(true);
                            } else if (activeSessionId && activeSessionStatus === 'terminated') {
                                hydrateSession(activeSessionId);
                            } else {
                                handleFullTestClick();
                            }
                        }}
                        actionText={activeSessionStatus === 'active' ? 'Resume Test' : 'Start Full Test'}
                        loading={loading}
                        status={activeSessionStatus}
                    />

                    {/* Subject Wise Card */}
                    <TestCard
                        title="Subject Wise"
                        description="Focus on specific subjects to strengthen your weak areas with targeted practice questions."
                        icon={BookOpen}
                        color="indigo"
                        onClick={() => {
                            setTestIntent('subject');
                            setIsSubjectModalOpen(true);
                        }}
                        actionText="Start Subject Test"
                    />

                    {/* Topic-wise Test Card */}
                    <TestCard
                        title="Topic-wise Test"
                        description="Master specific topics with focused practice. Select from available topics and start learning."
                        icon={Target}
                        color="teal"
                        onClick={handleTopicWiseClick}
                        actionText="Choose Topic"
                    />

                    {/* Custom Drill Card */}
                    <TestCard
                        title="Custom Drill"
                        description="Customize your challenge. Mix subjects and set your own limits."
                        icon={Dna}
                        color="violet"
                        onClick={() => setIsCustomModalOpen(true)}
                        actionText="Start Custom Drill"
                        isCustomDrill={true} // Just in case we need specific override, but style should be same
                    />

                    {/* Revision Test Card */}
                    <TestCard
                        title="Revision Test"
                        description="High-importance questions for last-minute revision before your exam. Quick and effective!"
                        icon={Zap}
                        color="orange"
                        onClick={() => setTestMode('revision')}
                        actionText="Start Revision"
                    />

                    {/* AI Recommended Card */}
                    <TestCard
                        title="AI Recommended"
                        description="Personalized test recommendations based on your weak topics and performance history."
                        icon={Sparkles}
                        color="purple"
                        onClick={() => navigate('/ai-recommendations')}
                        actionText="View Recommendations"
                    />
                </div>

                {/* Topic Selection Modal */}
                <SubjectSelectionModal
                    isOpen={isSubjectModalOpen}
                    onClose={() => setIsSubjectModalOpen(false)}
                    onSelect={(subject) => handleSubjectSelect(subject)}
                    examType={selectedExam}
                />

                <TopicSelectionModal
                    isOpen={isTopicModalOpen}
                    onClose={() => setIsTopicModalOpen(false)}
                    subject={subjectForTopic}
                    onSelect={(topic) => handleTopicSelect(subjectForTopic, topic)}
                    examType={selectedExam}
                />

                <CustomTestModal
                    isOpen={isCustomModalOpen}
                    onClose={() => setIsCustomModalOpen(false)}
                    examType={selectedExam}
                    onStartTest={handleCustomTestStart}
                />
            </div >
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
        onDiscard: handleDiscardSession,
        onSaveAndExit: handleSaveAndExit,
        sessionId,
        testMode,
        title: testMode === 'subject' ? `Subject Test: ${selectedSubject} ` :
            testMode === 'topic-wise' ? `Topic: ${selectedTopic} ` :
                testMode === 'revision' ? 'Revision Test' : 'Quick Quiz',
        enableProctoring: testMode === 'full' // Only enable for full tests
    };

    // Render based on mode
    if (testMode !== 'full' && testMode !== 'subject' && testMode !== 'topic') {
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
