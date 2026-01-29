import React from 'react';
import TestTopbar from './components/TestTopbar.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import TestBottomBar from './components/TestBottomBar.jsx';
import TestSidebar from './components/TestSidebar.jsx';
import QuitModal from './components/QuitModal.jsx';

const FullTestUI = ({
    questions,
    currentQuestionIndex,
    onQuestionChange,
    responses,
    onAnswer,
    timeLeft,
    onMarkForReview,
    onClearResponse,

    onSubmit,
    onDiscard,
    onSaveAndExit
}) => {
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
                        />
                    </div>
                </div>

                {/* Right Column: Sidebar (Desktop Only) */}
                <div className="hidden lg:block h-full overflow-hidden">
                    <div className="h-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
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

        </div>
    );
};

export default FullTestUI;
