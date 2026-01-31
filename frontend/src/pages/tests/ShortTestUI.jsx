import React from 'react';
import TestTopbar from './components/TestTopbar.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import TestBottomBar from './components/TestBottomBar.jsx';
import QuitModal from './components/QuitModal.jsx';

const ShortTestUI = ({
    questions,
    currentQuestionIndex,
    onQuestionChange,
    responses,
    onAnswer,
    timeLeft,
    onMarkForReview,

    onSubmit,
    onDiscard,
    title
}) => {
    const [isQuitModalOpen, setIsQuitModalOpen] = React.useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const currentResponse = responses[currentQuestion.id]?.answer;
    const isMarked = responses[currentQuestion.id]?.marked;

    // Handle answer update from QuestionCard
    const handleAnswer = (val) => {
        onAnswer(currentQuestion.id, val);
    };

    return (
        <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
            {/* Top Bar - Fixed */}
            <div className="flex-shrink-0 z-50">
                <TestTopbar
                    title={title || "Short Quiz"}
                    timeLeft={timeLeft}
                    currentQ={currentQuestionIndex}
                    totalQ={questions.length}

                    onQuit={() => setIsQuitModalOpen(true)}
                    onSubmit={onSubmit}
                />
            </div>

            {/* Middle - Scrollable Question Area */}
            <div className="flex-1 overflow-y-auto pb-4 pt-6">
                <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
                    <QuestionCard
                        question={currentQuestion}
                        response={currentResponse}
                        onAnswer={handleAnswer}
                        type={currentQuestion.type || 'MCQ'}
                    />
                </div>
            </div>

            {/* Bottom Bar - Fixed */}
            <div className="flex-shrink-0 z-40 pt-2">
                <div className="w-full">
                    <TestBottomBar
                        currentQ={currentQuestionIndex}
                        totalQ={questions.length}
                        onPrev={() => onQuestionChange(currentQuestionIndex - 1)}
                        onNext={() => currentQuestionIndex === questions.length - 1 ? onSubmit() : onQuestionChange(currentQuestionIndex + 1)}
                        onMark={() => onMarkForReview(currentQuestion.id)}
                        isMarked={isMarked}
                        onQuit={() => setIsQuitModalOpen(true)}
                    />
                </div>
            </div>
            {/* Quit Options Modal */}
            <QuitModal
                isOpen={isQuitModalOpen}
                onClose={() => setIsQuitModalOpen(false)}
                onResume={() => setIsQuitModalOpen(false)}
                onDiscard={onDiscard}
                onSubmit={onSubmit}
            />
        </div>
    );
};

export default ShortTestUI;
