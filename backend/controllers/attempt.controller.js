const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const Performance = require('../models/Performance');
const QuestionGenerator = require('../services/QuestionGenerator');

exports.submitAttempt = async (req, res) => {
    try {
        const { userId, testType, subject, questions, totalTimeTaken } = req.body;

        let score = 0;
        let totalCorrect = 0;
        let totalWrong = 0;
        let processedQuestions = [];

        // Bulk fetch optimization
        const questionIds = questions.map(q => q.questionId);
        const dbQuestions = await Question.find({ _id: { $in: questionIds } });
        const questionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));

        for (let q of questions) {
            const dbQuestion = questionMap.get(q.questionId);
            if (!dbQuestion) continue;

            let isCorrect = false;
            // Normalize comparison
            const userAns = String(q.selectedOption).trim().toLowerCase();
            const correctAns = String(dbQuestion.correctAnswer).trim().toLowerCase();

            // Check correctness
            if (dbQuestion.type === 'NAT') {
                // For NAT, exact string match or numeric tolerance (keep simple for now)
                isCorrect = userAns === correctAns;
            } else {
                // MCQ
                isCorrect = userAns === correctAns;
            }

            if (isCorrect) {
                score += 1;
                totalCorrect++;
            } else {
                totalWrong++;
            }

            processedQuestions.push({
                questionId: q.questionId,
                selectedOption: q.selectedOption,
                correctAnswer: dbQuestion.correctAnswer, // Store correct answer in attempt history for ref
                isCorrect: isCorrect,
                timeTaken: q.timeTaken,
                mistakeType: q.mistakeType || 'None',
                // Include metadata for performance tracking
                subject: dbQuestion.subject,
                topic: dbQuestion.topic,
                difficulty: dbQuestion.difficulty,
                importance: dbQuestion.importance
            });
        }

        const attempt = new Attempt({
            userId,
            testType,
            subject,
            score,
            totalCorrect,
            totalWrong,
            totalQuestions: questions.length,
            totalTimeTaken,
            questions: processedQuestions
        });

        await attempt.save();

        // Update Aggregate Performance Stats
        // We use testType as the examName (e.g., "JEE Main", "GATE CSE")
        try {
            await Performance.updatePerformance(userId, testType, processedQuestions, questionMap);

            // Trigger AI Generation for Weak Topics (Async - fail safe)
            // Fire and forget to not block response
            QuestionGenerator.generateRemedialQuestions(userId, testType)
                .catch(err => console.error('Background Question Gen Failed:', err));

        } catch (perfError) {
            console.error('❌ Failed to update performance:', perfError);
            // Don't fail the attempt submission if performance update fails
        }

        res.json(attempt);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getHistory = async (req, res) => {
    try {
        // userId should come from middleware (req.user.id)
        // For now trusting req.params or req.user if auth middleware was active
        // Assuming we implement this route as protected usually
        const userId = req.user ? req.user.id : req.query.userId; // Temporary fallback

        const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 });
        res.json(attempts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAttemptById = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('questions.questionId');
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
        res.json(attempt);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
