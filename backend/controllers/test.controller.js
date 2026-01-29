const TestSession = require('../models/TestSession');
const Attempt = require('../models/Attempt');
const ExamPattern = require('../models/ExamPattern');
const Question = require('../models/Question');
const Performance = require('../models/Performance');
const { BRANCHES } = require('../utils/constants');
const QuestionGenerator = require('../services/QuestionGenerator');

/**
 * Start a full length test
 * POST /api/test/start-full-test
 */
exports.startFullTest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examType } = req.body;

        if (!examType) {
            return res.status(400).json({ message: 'Exam type is required' });
        }

        // Check for existing active session
        const existingSession = await TestSession.findOne({
            userId,
            status: 'active'
        });

        if (existingSession) {
            // Check if it's actually expired but status is still active
            if (existingSession.isExpired()) {
                console.log(`[StartTest] Found expired active session ${existingSession._id}. Marking as expired.`);
                existingSession.status = 'expired';
                await existingSession.save();
                // Proceed to create new session
            } else {
                return res.status(400).json({
                    message: 'You already have an active test session',
                    sessionId: existingSession._id
                });
            }
        }

        console.log(`[StartTest] Request received for exam: "${examType}"`);

        // Get exam pattern (Try exact match first, then case-insensitive)
        let pattern = await ExamPattern.findOne({ examName: examType, active: true });

        if (!pattern) {
            console.log(`[StartTest] Exact match not found. Trying case-insensitive search for: "${examType}"`);
            pattern = await ExamPattern.findOne({
                examName: { $regex: new RegExp(`^${examType}$`, 'i') },
                active: true
            });
        }

        if (!pattern) {
            // Try matching common variations
            const variations = {
                'JEE Mains': 'JEE Main',
                'JEE_MAIN': 'JEE Main',
                'jee-main': 'JEE Main', // Handle frontend slug format
                'gate-cs': 'GATE CS',
                'neet-ug': 'NEET',
                'GATE': 'GATE CS', // Default to CS if just GATE
                'NEET UG': 'NEET'
            };

            if (variations[examType]) {
                console.log(`[StartTest] Trying mapped variation: "${variations[examType]}"`);
                pattern = await ExamPattern.findOne({ examName: variations[examType], active: true });
            }
        }

        // Final fallback: Replace hyphens with spaces and try case-insensitive regex
        if (!pattern) {
            const normalizedType = examType.replace(/-/g, ' ');
            console.log(`[StartTest] Trying normalized search: "${normalizedType}"`);
            pattern = await ExamPattern.findOne({
                examName: { $regex: new RegExp(`^${normalizedType}$`, 'i') },
                active: true
            });
        }

        if (!pattern) {
            console.log(`[StartTest] Pattern not found for: "${examType}"`);
            const availablePatterns = await ExamPattern.find({ active: true }).select('examName');
            console.log(`[StartTest] Available patterns: ${availablePatterns.map(p => p.examName).join(', ')}`);

            return res.status(404).json({
                message: `Exam pattern not found for '${examType}'. Available: ${availablePatterns.map(p => p.examName).join(', ')}`
            });
        }

        // Fetch questions according to pattern
        // USE pattern.examName instead of examType to ensure we use the DB's correct casing (e.g. "JEE Main" vs "jee-main")
        const questions = await fetchQuestionsByPattern(pattern.examName, pattern);

        if (questions.length === 0) {
            return res.status(404).json({ message: 'No questions available for this exam' });
        }

        // Create test session
        const testSession = new TestSession({
            userId,
            examType: pattern.examName, // Use normalized name
            testType: 'full',
            questions: questions.map((q, index) => ({
                questionId: q._id,
                subject: q.subject,
                section: q.section || 'A',
                questionNumber: index + 1,
                marksAllocated: q.marksAllocated,
                questionType: q.type
            })),
            duration: pattern.duration,
            timeRemaining: pattern.duration * 60,
            status: 'active'
        });

        await testSession.save();

        res.json({
            sessionId: testSession._id,
            pattern: {
                displayName: pattern.displayName,
                totalQuestions: pattern.totalQuestions,
                questionsToAttempt: pattern.questionsToAttempt,
                totalMarks: pattern.totalMarks,
                duration: pattern.duration,
                instructions: pattern.instructions,
                negativeMarking: pattern.negativeMarking
            },
            questions: questions.map(q => ({
                id: q._id,
                text: q.question,
                options: q.options,
                image: q.image,
                type: q.type,
                subject: q.subject,
                section: q.section,
                marksAllocated: q.marksAllocated
            })),
            startTime: testSession.startTime
        });

    } catch (error) {
        console.error('Error starting full test:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get active test session
 * GET /api/test/session/:sessionId
 */
exports.getTestSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await TestSession.findOne({ _id: sessionId, userId });

        if (!session) {
            return res.status(404).json({ message: 'Test session not found' });
        }

        // Check if expired
        if (session.isExpired() && session.status === 'active') {
            session.status = 'expired';
            await session.save();
        }

        // Get questions
        const questionIds = session.questions.map(q => q.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });

        const questionsMap = {};
        questions.forEach(q => {
            questionsMap[q._id.toString()] = q;
        });

        const formattedQuestions = session.questions.map(sq => {
            const q = questionsMap[sq.questionId.toString()];
            return {
                id: q._id,
                text: q.question,
                options: q.options,
                image: q.image,
                type: q.type,
                subject: sq.subject,
                section: sq.section,
                questionNumber: sq.questionNumber,
                marksAllocated: sq.marksAllocated
            };
        });

        res.json({
            sessionId: session._id,
            status: session.status,
            questions: formattedQuestions,
            responses: Object.fromEntries(session.responses || new Map()),
            timeRemaining: session.getTimeRemaining(),
            startTime: session.startTime
        });

    } catch (error) {
        console.error('Error fetching test session:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Save response for a question
 * POST /api/test/session/:sessionId/response
 */
exports.saveResponse = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        const { questionId, answer, timeTaken, marked } = req.body;

        const session = await TestSession.findOne({ _id: sessionId, userId, status: 'active' });

        if (!session) {
            return res.status(404).json({ message: 'Active test session not found' });
        }

        // Check if expired
        if (session.isExpired()) {
            session.status = 'expired';
            await session.save();
            return res.status(400).json({ message: 'Test session has expired' });
        }

        // Update response
        if (!session.responses) {
            session.responses = new Map();
        }

        const oldResponse = session.responses.get(questionId) || {};

        const currentAnswer = answer;
        console.log(`[SaveResponse] QID: ${questionId}, Input Answer: ${answer} (Type: ${typeof answer}), HasAns: ${answer !== undefined}`);

        // Merge updates
        const newAnswer = answer !== undefined ? answer : oldResponse.answer;
        const newTime = timeTaken !== undefined ? timeTaken : (oldResponse.timeTaken || 0);
        const newMarked = marked !== undefined ? marked : (oldResponse.marked || false);

        console.log(`[SaveResponse] Saving -> Answer: ${newAnswer}, Time: ${newTime}`);

        session.responses.set(questionId, {
            answer: newAnswer,
            timeTaken: newTime,
            marked: newMarked,
            timestamp: new Date()
        });

        session.markModified('responses'); // Critical force save
        await session.save();

        res.json({ message: 'Response saved successfully' });

    } catch (error) {
        console.error('Error saving response:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Submit test and calculate results
 * POST /api/test/session/:sessionId/submit
 */
// Start a Topic-Specific Test (AI Recommended)
exports.startTopicTest = async (req, res) => {
    try {
        const { topic, examType } = req.body;
        console.log(`[startTopicTest] Request: Topic="${topic}", Exam="${examType}"`);
        const userId = req.user.id;

        if (!topic) return res.status(400).json({ message: "Topic is required" });

        // 1. Check for active session
        const activeSession = await TestSession.findOne({ user: userId, status: 'active' });
        if (activeSession) {
            return res.status(400).json({
                message: "You have an unfinished test in progress.",
                sessionId: activeSession._id
            });
        }

        // 2. Fetch Questions (Mix of AI and Standard)
        const cleanTopic = topic.trim();
        // Case-insensitive regex for topic matching
        const topicRegex = new RegExp(`^${cleanTopic}$`, 'i');

        // Handle Exam Type Mismatch (e.g. "jee-main" vs "JEE Main")
        // Use [ -] to match space or hyphen. Avoid \\s which causes escape issues in RegExp constructor from string.
        const examRegex = new RegExp(`^${examType.replace(/-/g, '[ -]')}$`, 'i');

        // Normalize examType for storage (e.g. jee-main -> JEE Main)
        let storedExamType = examType;
        const foundPattern = await ExamPattern.findOne({ examName: { $regex: examRegex } });
        if (foundPattern) {
            storedExamType = foundPattern.examName;
        } else {
            // Fallback for common slugs if no pattern found by regex
            if (examType.toLowerCase() === 'jee-main') storedExamType = 'JEE Main';
            else if (examType.toLowerCase() === 'gate-cs') storedExamType = 'GATE CS';
            // Add more normalization as needed
        }

        console.log(`[startTopicTest] Searching for Topic: "${cleanTopic}" (Regex: ${topicRegex}), Exam: "${examType}" (Regex: ${examRegex}), StoredExamType: "${storedExamType}"`);

        const TOTAL_QUESTIONS = 20;

        // A. Get AI Generated Questions for this topic
        const aiQuestions = await Question.find({
            topic: { $regex: topicRegex },
            exam: { $regex: examRegex },
            isAiGenerated: true
        }).limit(10);

        // B. Fill remainder with Standard Questions
        const remainingCount = TOTAL_QUESTIONS - aiQuestions.length;
        const standardQuestions = await Question.aggregate([
            {
                $match: {
                    topic: { $regex: topicRegex.source, $options: 'i' },
                    exam: { $regex: examRegex.source, $options: 'i' },
                    isAiGenerated: { $ne: true }
                }
            },
            { $sample: { size: remainingCount } }
        ]);

        const finalQuestions = [...aiQuestions, ...standardQuestions];
        console.log(`[startTopicTest] Found: ${aiQuestions.length} AI + ${standardQuestions.length} Standard = ${finalQuestions.length} Total`);

        if (finalQuestions.length === 0) {
            console.warn(`[startTopicTest] 404 - No questions found for topic: "${cleanTopic}"`);
            return res.status(404).json({ message: "No questions found for this topic." });
        }

        // 3. Create Session
        // Use a dummy pattern structure since it's ad-hoc
        const adHocPattern = {
            examName: storedExamType, // Use Normalized Name
            duration: 25, // 25 mins for 20 questions
            totalQuestions: finalQuestions.length,
            markingScheme: { correct: 4, incorrect: -1 },
            negativeMarking: { MCQ: -1, NAT: 0, MSQ: 0 }, // Critical for calculateMarks
            totalMarks: finalQuestions.length * 4 // Explicitly set totalMarks
        };

        const newSession = new TestSession({
            userId: userId,
            examType: storedExamType, // Use Normalized Name
            testType: 'topic',
            topic: topic, // Save the topic!
            testPattern: adHocPattern,
            questions: finalQuestions.map(q => ({
                questionId: q._id,
                status: 'not_visited',
                subject: q.subject, // Save Subject
                questionType: q.type, // Save Type
                marksAllocated: 4 // Explicitly save marks (Default 4 for topic tests)
            })),
            startTime: new Date(),
            timeRemaining: adHocPattern.duration * 60,
            status: 'active'
        });

        await newSession.save();

        res.status(201).json({
            message: "Topic test started",
            sessionId: newSession._id,
            pattern: adHocPattern,
            questions: finalQuestions.map(q => ({
                id: q._id,
                text: q.question,
                options: q.options,
                image: q.image,
                type: q.type,
                subject: q.subject
            }))
        });

    } catch (error) {
        console.error("Start Topic Test Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.submitTest = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await TestSession.findOne({ _id: sessionId, userId });

        if (!session) {
            return res.status(404).json({ message: 'Test session not found' });
        }

        if (session.status === 'submitted') {
            return res.status(400).json({ message: 'Test already submitted' });
        }

        // Get exam pattern
        let pattern = await ExamPattern.findOne({ examName: session.examType });

        // Fallback for Topic Tests (which use ad-hoc patterns stored in the session)
        if (!pattern && session.testType === 'topic') {
            console.log(`[SubmitTest] Using ad-hoc pattern for Topic Test: ${session.topic}`);

            if (session.testPattern) {
                pattern = session.testPattern;
            } else {
                // Fallback for sessions created before schema update (Zombie Sessions)
                console.warn(`[SubmitTest] session.testPattern missing for ${sessionId}. Constructing default.`);
                pattern = {
                    examName: session.examType,
                    markingScheme: { correct: 4, incorrect: -1 }, // Default assumption
                    negativeMarking: { MCQ: -1, NAT: 0, MSQ: 0 }, // Critical
                    totalMarks: session.questions.length * 4
                };
            }

            // Ensure strictly required fields exist for calculation
            if (!pattern.totalMarks) {
                // Calculate total marks dynamically if missing (4 * count)
                pattern.totalMarks = session.questions.length * (pattern.markingScheme?.correct || 4);
            }
        }

        if (!pattern) {
            console.error(`[SubmitTest] Pattern missing for session ${sessionId} (Type: ${session.testType})`);
            return res.status(500).json({ message: 'Exam pattern config missing' });
        }

        // Get all questions
        const questionIds = session.questions.map(q => q.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });

        const questionsMap = new Map();
        questions.forEach(q => {
            questionsMap.set(q._id.toString(), q);
        });

        // Calculate results
        const results = calculateResults(session, questions, questionsMap, pattern);

        // Create attempt record
        const attempt = new Attempt({
            userId,
            testSessionId: session._id,
            examType: session.examType,
            testType: session.testType === 'topic' ? 'topic-wise' : 'Full', // Match requested format
            topic: session.topic || null, // Save topic name if available
            questions: results.questions,
            totalQuestions: results.totalQuestions,
            totalAttempted: results.totalAttempted,
            totalCorrect: results.totalCorrect,
            totalWrong: results.totalWrong,
            totalUnattempted: results.totalUnattempted,
            totalMarked: results.totalMarked,
            score: results.score,
            totalMarks: pattern.totalMarks,
            accuracy: results.accuracy,
            percentage: results.percentage,
            subjectWise: results.subjectWise,
            totalTimeTaken: results.totalTimeTaken,
            avgTimePerQuestion: results.avgTimePerQuestion,
            submittedAt: new Date()
        });

        await attempt.save();

        // Update session status
        session.status = 'submitted';
        session.endTime = new Date();
        await session.save();

        // Update performance model
        // Use the static method on the model to ensure correct schema usage (updating exams Map)
        try {
            await Performance.updatePerformance(userId, session.examType, attempt.questions, questionsMap);

            // Trigger AI Generation for weak areas (Async - Fire and Forget)
            // We do not await this, to keep response fast
            QuestionGenerator.generateRemedialQuestions(userId, session.examType)
                .catch(err => console.error('[SubmitTest] Background AI Gen Error:', err));

        } catch (perfError) {
            console.error('❌ Failed to update performance:', perfError);
            // Don't fail the test submission if performance update fails
        }

        res.json({
            attemptId: attempt._id,
            score: results.score,
            totalMarks: pattern.totalMarks,
            accuracy: results.accuracy,
            percentage: results.percentage,
            message: 'Test submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get test results
 * GET /api/test/results/:attemptId
 */
exports.getTestResults = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const userId = req.user.id;

        const attempt = await Attempt.findOne({ _id: attemptId, userId });

        if (!attempt) {
            return res.status(404).json({ message: 'Test results not found' });
        }

        // Fetch explanations for all questions in the attempt
        const questionIds = attempt.questions.map(q => q.questionId);
        const questionsWithExplanation = await Question.find({ _id: { $in: questionIds } })
            .select('_id explanation');

        const explanationMap = {};
        questionsWithExplanation.forEach(q => {
            explanationMap[q._id.toString()] = q.explanation;
        });

        // Convert attempt document to plain object to modify it
        const attemptObj = attempt.toObject();

        // Attach explanation to each question
        attemptObj.questions = attemptObj.questions.map(q => ({
            ...q,
            explanation: explanationMap[q.questionId.toString()] || null
        }));

        res.json(attemptObj);

    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper Functions

/**
 * Fetch questions according to exam pattern
 */
async function fetchQuestionsByPattern(examType, pattern) {
    const allQuestions = [];
    let questionNumber = 1;

    console.log(`[FetchQuestions] Starting fetch for exam: ${examType}`);

    for (const subject of pattern.subjects) {
        for (const section of subject.sections) {
            // Simplified query to increase match chances
            const query = {
                exam: { $regex: new RegExp(examType, 'i') },
                // Flexible subject matching (partial match)
                subject: { $regex: new RegExp(subject.name.split(' ')[0], 'i') },
                type: section.type
            };

            console.log(`[FetchQuestions] Querying: Exam="${examType}", Subject="${subject.name}", Section="${section.name}", Type="${section.type}"`);
            console.log(`[FetchQuestions] MongoDB Query:`, JSON.stringify(query));

            const questions = await Question.aggregate([
                { $match: query },
                { $sample: { size: section.count } }
            ]);

            console.log(`[FetchQuestions] Found ${questions.length} questions for ${subject.name} - Section ${section.name}`);

            questions.forEach(q => {
                q.section = section.name;
                q.marksAllocated = section.marksPerQuestion;
                q.questionNumber = questionNumber++;
            });

            allQuestions.push(...questions);
        }
    }

    console.log(`[FetchQuestions] Total questions found: ${allQuestions.length}`);
    return allQuestions;
}

/**
 * Calculate test results
 */
function calculateResults(session, questions, questionsMap, pattern) {
    const responses = session.responses || new Map();
    const questionResults = [];
    const subjectWise = new Map();

    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalMarked = 0;
    let totalScore = 0;
    let totalTimeTaken = 0;

    session.questions.forEach(sq => {
        const question = questionsMap.get(sq.questionId.toString());
        const response = responses.get(sq.questionId.toString());

        // Safety check: specific question might be deleted from DB
        if (!question) {
            console.warn(`[CalculateResults] Missing question in DB: ${sq.questionId}`);
            // Count as unattempted/wrong or just skip? 
            // Better to treat as unattempted but NOT crash
            totalUnattempted++;
            return; // Skip this iteration
        }

        const userAnswer = response?.answer;
        const timeTaken = Number(response?.timeTaken || 0); // Force Number
        const marked = response?.marked || false;

        // Strict check: 0 is a valid answer!
        const hasAnswer = userAnswer !== null && userAnswer !== undefined && userAnswer !== '';

        console.log(`[CalcResults] QID: ${sq.questionId}, UserAns: ${userAnswer}, HasAns: ${hasAnswer}, Time: ${timeTaken}`);

        const isCorrect = hasAnswer && checkAnswer(question, userAnswer);
        // Fallback to 4 marks if missing in session (Zombie Session Fix)
        const allocated = sq.marksAllocated || 4;
        const marksAwarded = calculateMarks(question, userAnswer, isCorrect, pattern, allocated);

        const mistakeType = determineMistakeType(userAnswer, isCorrect, timeTaken);

        if (hasAnswer) totalAttempted++;
        if (isCorrect) totalCorrect++;
        if (hasAnswer && !isCorrect) totalWrong++;
        if (marked) totalMarked++;

        totalScore += marksAwarded;
        totalTimeTaken += timeTaken;

        questionResults.push({
            questionId: question._id,
            questionText: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            userAnswer: userAnswer || null,
            isCorrect: isCorrect || false,
            marksAwarded,
            marksAllocated: sq.marksAllocated,
            timeTaken,
            marked,
            mistakeType,
            subject: sq.subject,
            topic: question.topic,
            difficulty: question.difficulty,
            section: sq.section,
            questionType: question.type
        });

        // Subject-wise aggregation
        if (!subjectWise.has(sq.subject)) {
            subjectWise.set(sq.subject, {
                attempted: 0,
                correct: 0,
                wrong: 0,
                unattempted: 0,
                score: 0,
                maxScore: 0,
                accuracy: 0,
                timeTaken: 0
            });
        }

        const subj = subjectWise.get(sq.subject);
        subj.maxScore += sq.marksAllocated;
        subj.score += marksAwarded;
        subj.timeTaken += timeTaken;

        if (hasAnswer) { // Use hasAnswer (true for 0), NOT userAnswer
            subj.attempted++;
            if (isCorrect) subj.correct++;
            else subj.wrong++;
        } else {
            subj.unattempted++;
        }

        subj.accuracy = subj.attempted > 0 ? (subj.correct / subj.attempted * 100).toFixed(2) : 0;
    });

    const totalUnattempted = session.questions.length - totalAttempted;
    const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted * 100).toFixed(2) : 0;
    const percentage = (totalScore / pattern.totalMarks * 100).toFixed(2);
    const avgTimePerQuestion = totalAttempted > 0 ? Math.round(totalTimeTaken / totalAttempted) : 0;

    return {
        questions: questionResults,
        totalQuestions: session.questions.length,
        totalAttempted,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        totalMarked,
        score: parseFloat(totalScore.toFixed(2)),
        accuracy: parseFloat(accuracy),
        percentage: parseFloat(percentage),
        subjectWise: Object.fromEntries(subjectWise), // Critical: Convert Map to Object
        totalTimeTaken,
        avgTimePerQuestion
    };
}

/**
 * Check if answer is correct
 */
/**
 * Check if answer is correct
 */
/**
 * Check if answer is correct
 */
function checkAnswer(question, userAnswer) {
    if (userAnswer === null || userAnswer === undefined) return false;

    const correct = question.correctAnswer.toString().trim().toUpperCase(); // Normalize DB answer
    const user = userAnswer.toString().trim().toUpperCase(); // Normalize User answer

    // Debug log
    // console.log(`Checking: Correct="${correct}" vs User="${user}"`);

    // 1. Direct Match (A vs A, or Text vs Text)
    if (correct === user) return true;

    // 2. Handle if Database has "Option Text" but User sends "Label" (A/B/C/D)
    // Only if user sends single letter A-D
    if (user.length === 1 && user >= 'A' && user <= 'D' && question.options) {
        const index = user.charCodeAt(0) - 65; // A->0
        if (index >= 0 && index < question.options.length) {
            const optionText = question.options[index].toString().trim().toUpperCase();
            if (correct === optionText) return true;
        }
    }

    // 3. NAT
    if (question.type === 'NAT') {
        const correctVal = parseFloat(correct);
        const userVal = parseFloat(user);
        if (!isNaN(correctVal) && !isNaN(userVal)) {
            return Math.abs(correctVal - userVal) < 0.01;
        }
    }

    return false;
}

/**
 * Calculate marks for a question
 */
function calculateMarks(question, userAnswer, isCorrect, pattern, marksAllocated) {
    if (!userAnswer) return 0;

    if (isCorrect) {
        return marksAllocated;
    } else {
        // Safe access (pattern.negativeMarking is undefined in old ad-hoc patterns)
        const negMap = pattern.negativeMarking || {};
        const negativeMarks = negMap[question.type] || -1; // Default to -1 if config missing
        return negativeMarks;
    }
}

/**
 * Determine mistake type
 */
function determineMistakeType(userAnswer, isCorrect, timeTaken) {
    if (!userAnswer) return 'Unattempted';
    if (isCorrect) return 'None';

    if (timeTaken < 30) return 'Speed';
    if (timeTaken > 180) return 'Conceptual';
    return 'Guess';
}

/**
 * Update performance model
 */
async function updatePerformance(userId, attempt) {
    try {
        let performance = await Performance.findOne({ userId });

        if (!performance) {
            performance = new Performance({ userId });
        }

        // Update overall stats
        performance.totalTests = (performance.totalTests || 0) + 1;
        performance.totalQuestions = (performance.totalQuestions || 0) + attempt.totalQuestions;
        performance.totalCorrect = (performance.totalCorrect || 0) + attempt.totalCorrect;
        performance.totalWrong = (performance.totalWrong || 0) + attempt.totalWrong;

        // Update subject-wise performance
        if (!performance.subjectWise) {
            performance.subjectWise = new Map();
        }

        attempt.subjectWise.forEach((stats, subject) => {
            if (!performance.subjectWise.has(subject)) {
                performance.subjectWise.set(subject, {
                    attempted: 0,
                    correct: 0,
                    wrong: 0,
                    strength: 0
                });
            }

            const perf = performance.subjectWise.get(subject);
            perf.attempted += stats.attempted;
            perf.correct += stats.correct;
            perf.wrong += stats.wrong;
            perf.strength = perf.attempted > 0 ? Math.round((perf.correct / perf.attempted) * 100) : 0;
        });

        // Update topic-wise performance
        if (!performance.topicWise) {
            performance.topicWise = new Map();
        }

        attempt.questions.forEach(q => {
            if (!q.topic) return;

            if (!performance.topicWise.has(q.topic)) {
                performance.topicWise.set(q.topic, {
                    attempted: 0,
                    correct: 0,
                    wrong: 0,
                    strength: 0
                });
            }

            const topic = performance.topicWise.get(q.topic);
            topic.attempted++;
            if (q.isCorrect) topic.correct++;
            else if (q.userAnswer) topic.wrong++;
            topic.strength = topic.attempted > 0 ? Math.round((topic.correct / topic.attempted) * 100) : 0;
        });

        await performance.save();
    } catch (error) {
        console.error('Error updating performance:', error);
    }
}

/**
 * Discard active test session
 * POST /api/test/session/:sessionId/discard
 */
exports.discardSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        // Use findOneAndUpdate to bypass potentially strict schema validation issues on save()
        // if the document has partial/corrupted data
        const session = await TestSession.findOneAndUpdate(
            { _id: sessionId, userId },
            {
                $set: {
                    status: 'expired',
                    endTime: new Date()
                }
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ message: 'Test session not found' });
        }

        res.json({ message: 'Test session discarded' });

    } catch (error) {
        console.error('Error discarding session:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get user's test history
 * GET /api/test/history?exam=jee-main
 */
exports.getUserAttempts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { exam } = req.query;

        // Build filter
        const filter = { userId };

        // Add exam filter if provided
        if (exam) {
            const normalizedExam = exam.replace(/-/g, ' ');
            let searchExam = normalizedExam;

            // Try to resolve base exam type from profile (e.g. "gate cs" -> "GATE")
            try {
                const UserProfile = require('../models/UserProfile');
                const userProfile = await UserProfile.findOne({ userId });
                if (userProfile && userProfile.exams) {
                    const matchingExam = userProfile.exams.find(e => {
                        const typeMatch = e.examType.toLowerCase() === normalizedExam.toLowerCase();
                        if (typeMatch) return true;
                        if (e.branch) {
                            const fullMatch = `${e.examType} ${e.branch}`.toLowerCase() === normalizedExam.toLowerCase();
                            if (fullMatch) return true;

                            // Also check full branch name match
                            const fullBranchName = BRANCHES[e.branch];
                            if (fullBranchName) {
                                const fullNameMatch = `${e.examType} ${fullBranchName}`.toLowerCase() === normalizedExam.toLowerCase();
                                if (fullNameMatch) return true;
                            }
                        }
                        return false;
                    });

                    if (matchingExam) {
                        searchExam = matchingExam.examType; // "GATE"

                        // Critical parsing for specific branch filtering
                        if (matchingExam.examType === 'GATE' && matchingExam.branch) {
                            // If a specific branch is selected, DO NOT default to broad "^GATE" regex.
                            // Instead, construct specific regex "^GATE DA"
                            searchExam = `GATE ${matchingExam.branch}`;
                            console.log(`[History] Refining filter for GATE branch: ${searchExam}`);
                        }
                    }
                }
            } catch (err) {
                console.error('Error resolving exam type in history:', err);
            }

            // Use prefix match to handle variations
            filter.examType = { $regex: new RegExp(`^${searchExam}`, 'i') };
        }

        const attempts = await Attempt.find(filter)
            .select('examType testType topic score totalMarks percentage accuracy createdAt subjectWise totalTimeTaken')
            .sort({ createdAt: -1 });

        res.json(attempts);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;
