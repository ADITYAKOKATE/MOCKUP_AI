const Question = require('../models/Question');
const { EXAMS, BRANCHES } = require('../utils/constants');

exports.getQuestions = async (req, res) => {
    try {
        const { type, subject, count, branch, exam, examType } = req.query;

        let query = {};

        // Handle examType mapping dynamically from constants
        if (examType) {
            const normalize = (str) => str.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const inputKey = normalize(examType);

            // Helper to find matching key in an object (fuzzy match)
            const findKey = (obj, input) => {
                const keys = Object.keys(obj);
                let match = keys.find(k => k === input);
                if (match) return match;

                match = keys.find(k => input.startsWith(k));
                if (match) return match;

                if (input.endsWith('S')) {
                    const singular = input.slice(0, -1);
                    match = keys.find(k => k === singular);
                    if (match) return match;
                }

                return null;
            };

            const escapeRegex = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            let matched = false;
            const parts = examType.split(/[-_\s]+/);

            if (parts.length >= 2) {
                const potentialExam = normalize(parts[0]);
                const potentialBranch = normalize(parts[1]);

                const examKey = findKey(EXAMS, potentialExam);
                const branchKey = Object.keys(BRANCHES).find(k => k === potentialBranch);

                if (examKey && branchKey) {
                    query.exam = new RegExp(`^${escapeRegex(EXAMS[examKey])}(?:\\s|$)`, 'i');
                    query.branch = branchKey;
                    if (branchKey === 'CS') query.branch = { $in: ['CS', 'CSE'] };
                    matched = true;
                }
            }

            if (!matched) {
                const matchedExamKey = findKey(EXAMS, inputKey);
                if (matchedExamKey) {
                    query.exam = new RegExp(`^${escapeRegex(EXAMS[matchedExamKey])}$`, 'i');
                } else {
                    query.exam = new RegExp(escapeRegex(examType), 'i');
                }
            }
        }

        if (exam) query.exam = exam;
        if (branch) query.branch = branch;
        if (subject) query.subject = subject;

        let limit = parseInt(count) || 10;

        const questions = await Question.aggregate([
            { $match: query },
            { $sample: { size: limit } }
        ]);

        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const { question, options, correctAnswer, type, branch, subject, topic, year, image, exam } = req.body;

        const newQuestion = new Question({
            question,
            image,
            options,
            correctAnswer,
            type,
            branch,
            subject,
            topic,
            year,
            exam
        });

        const savedQuestion = await newQuestion.save();
        res.json(savedQuestion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Get unique topics for a specific exam
 * GET /api/questions/topics/:examName
 */
exports.getTopicsByExam = async (req, res) => {
    try {
        const { examName } = req.params;

        const query = { exam: new RegExp(examName, 'i') };

        const topics = await Question.distinct('topic', query);

        const topicsWithCount = await Promise.all(
            topics.map(async (topic) => {
                const count = await Question.countDocuments({
                    ...query,
                    topic: topic
                });
                return { topic, count };
            })
        );

        topicsWithCount.sort((a, b) => a.topic.localeCompare(b.topic));

        res.json(topicsWithCount);
    } catch (err) {
        console.error('Error fetching topics:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * Get questions by topic
 * POST /api/questions/by-topic
 */
exports.getQuestionsByTopic = async (req, res) => {
    try {
        const { examName, topic, limit = 10 } = req.body;

        if (!examName || !topic) {
            return res.status(400).json({ message: 'examName and topic are required' });
        }

        const query = {
            exam: new RegExp(examName, 'i'),
            topic: topic
        };

        const questions = await Question.aggregate([
            { $match: query },
            { $sample: { size: parseInt(limit) } }
        ]);

        res.json(questions);
    } catch (err) {
        console.error('Error fetching topic questions:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * Get revision questions (high importance)
 * POST /api/questions/revision
 */
exports.getRevisionQuestions = async (req, res) => {
    try {
        const { examName, limit = 20 } = req.body;

        if (!examName) {
            return res.status(400).json({ message: 'examName is required' });
        }

        const query = {
            exam: new RegExp(examName, 'i'),
            importance: { $gte: 8 }
        };

        const questions = await Question.aggregate([
            { $match: query },
            { $sample: { size: parseInt(limit) } }
        ]);

        if (questions.length < limit) {
            const remaining = limit - questions.length;
            const mediumQuery = {
                exam: new RegExp(examName, 'i'),
                importance: { $gte: 6, $lt: 8 }
            };

            const additionalQuestions = await Question.aggregate([
                { $match: mediumQuery },
                { $sample: { size: remaining } }
            ]);

            questions.push(...additionalQuestions);
        }

        res.json(questions);
    } catch (err) {
        console.error('Error fetching revision questions:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
