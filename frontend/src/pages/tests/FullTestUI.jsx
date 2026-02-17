import React from 'react';
import TestTopbar from './components/TestTopbar.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import TestBottomBar from './components/TestBottomBar.jsx';
import TestSidebar from './components/TestSidebar.jsx';
import QuitModal from './components/QuitModal.jsx';
import { useProctoring } from '../../hooks/useProctoring';
import CameraComponent from './components/CameraComponent';
import toast from 'react-hot-toast';

const FullTestUI = ({
    questions,
    currentQuestionIndex,
    onQuestionChange,
    responses,
    onAnswer,
    timeLeft,
    onMarkForReview,
    onClearResponse,

    // Session Info
    sessionId,

    onSubmit,
    onDiscard,
    onSaveAndExit,
    enableProctoring = true // New prop
}) => {
    const { warnings, isFullScreen, webcamRef, enterFullScreen, calibrate, isCalibrated } = useProctoring(sessionId, (violation) => {
        if (violation.terminate) {
            toast.error("Test Terminated due to multiple violations.", { duration: 5000 });
            // Force submit with explicit terminated status
            onSubmit({ status: 'terminated' });
        }
    }, true, enableProctoring); // Pass enable flag

    // Warn if not fullscreen
    React.useEffect(() => {
        if (enableProctoring && !isFullScreen) {
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-red-600">⚠️ Fullscreen Required!</span>
                    <button
                        onClick={() => { enterFullScreen(); toast.dismiss(t.id); }}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                        Enable Fullscreen
                    </button>
                </div>
            ), { duration: Infinity, id: 'fs-warning' });
        } else {
            toast.dismiss('fs-warning');
        }
    }, [isFullScreen, enableProctoring]);
    const [isQuitModalOpen, setIsQuitModalOpen] = React.useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const currentResponse = responses[currentQuestion.id]?.answer;
    const isMarked = responses[currentQuestion.id]?.marked;

    const handleAnswer = (val) => {
        onAnswer(currentQuestion.id, val);
    };

    return (
        <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
            {/* Top Bar - Fixed Height */}
            <div className="flex-shrink-0 z-50">
                <TestTopbar
                    title="Full Mock Test"
                    timeLeft={timeLeft}
                    currentQ={currentQuestionIndex}
                    totalQ={questions.length}

                    onQuit={() => setIsQuitModalOpen(true)}
                    onSubmit={onSubmit}
                />
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 overflow-hidden pt-6">

                {/* Left Column: Questions Area + Bottom Bar */}
                <div className="flex flex-col h-full overflow-hidden gap-6">

                    {/* Scrollable Question Container */}
                    <div className="flex-1 overflow-y-auto rounded-2xl custom-scrollbar">
                        <QuestionCard
                            question={currentQuestion}
                            response={currentResponse}
                            onAnswer={handleAnswer}
                            type={currentQuestion.type || 'MCQ'}
                        />
                    </div>

                    {/* Bottom Bar - Fixed at bottom of Left Column */}
                    <div className="flex-shrink-0">
                        <TestBottomBar
                            currentQ={currentQuestionIndex}
                            totalQ={questions.length}
                            onPrev={() => onQuestionChange(currentQuestionIndex - 1)}
                            onNext={() => currentQuestionIndex === questions.length - 1 ? onSubmit() : onQuestionChange(currentQuestionIndex + 1)}
                            onMark={() => onMarkForReview(currentQuestion.id)}
                            onClear={() => onClearResponse(currentQuestion.id)}
                            isMarked={isMarked}
                            onQuit={onSubmit}
                            allAttempted={questions.every(q => responses[q.id]?.answer !== undefined && responses[q.id]?.answer !== null)}
                        />
                    </div>
                </div>

                {/* Right Column: Webcam + Sidebar (Desktop Only) */}
                <div className="hidden lg:flex flex-col h-full overflow-hidden gap-4">

                    {/* Webcam Monitor - Only Show if Proctoring Enabled */}
                    {enableProctoring && (
                        <div className="flex-shrink-0 relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-indigo-500 group">
                            <CameraComponent
                                ref={webcamRef}
                                className="w-full h-full object-cover"
                                onUserMedia={() => console.log("✅ Camera Active")}
                            />
                            {/* Live Indicator */}
                            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                <span className="text-[10px] font-bold text-white tracking-wider">LIVE</span>
                            </div>

                            {/* Status Overlay */}
                            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                {warnings.length > 0 && (
                                    <span className="text-[10px] font-bold text-white bg-red-500/90 px-2 py-0.5 rounded shadow-sm">
                                        {warnings.length} Warning(s)
                                    </span>
                                )}
                            </div>

                            {/* Calibration Overlay */}
                            {!isCalibrated && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                                    <button
                                        onClick={calibrate}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold shadow-lg transform transition hover:scale-105 flex items-center gap-2"
                                    >
                                        <span>🎯 Calibrate Face</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Question Palette */}
                    <div className="flex-1 rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
                        <TestSidebar
                            questions={questions}
                            currentQuestionIndex={currentQuestionIndex}
                            onQuestionChange={onQuestionChange}
                            responses={responses}
                        />
                    </div>
                </div>
            </div>
            {/* Quit Options Modal */}
            <QuitModal
                isOpen={isQuitModalOpen}
                onClose={() => setIsQuitModalOpen(false)}
                onResume={() => setIsQuitModalOpen(false)}
                onDiscard={onDiscard}
                onSubmit={onSubmit}
                onSaveAndExit={onSaveAndExit}
            />

            {/* Mobile/Tablet Fallback Webcam (Hidden but Active) - Optional: Could make PIP */}
            <div className="lg:hidden absolute opacity-0 pointer-events-none">
                <CameraComponent ref={webcamRef} />
            </div>

        </div>
    );
};

export default FullTestUI;
