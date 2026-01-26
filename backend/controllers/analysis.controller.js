const Attempt = require('../models/Attempt');
const Performance = require('../models/Performance');

exports.getAnalysis = async (req, res) => {
    try {
        const { analysisId } = req.params;
        const userId = req.user.id;
        let attempt;

        if (analysisId === 'latest') {
            attempt = await Attempt.findOne({ userId }).sort({ createdAt: -1 });
        } else {
            attempt = await Attempt.findById(analysisId);
        }

        if (!attempt) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        // Aggregate Topic and Subject Stats from questions
        const topicStats = {};
        const subjectStats = {};

        attempt.questions.forEach(q => {
            // Topic Stats
            const topic = q.topic || 'General';
            const subject = q.subject || 'General'; // Capture subject
            if (!topicStats[topic]) {
                topicStats[topic] = {
                    correct: 0,
                    wrong: 0,
                    unattempted: 0,
                    time: 0,
                    total: 0,
                    subject: subject // Store subject
                };
            }
            topicStats[topic].total++;
            topicStats[topic].time += (q.timeTaken || 0);

            if (q.isCorrect) topicStats[topic].correct++;
            else if (q.userAnswer) topicStats[topic].wrong++; // Answered but not correct
            else topicStats[topic].unattempted++;

            // Subject Stats
            if (!subjectStats[subject]) {
                subjectStats[subject] = { correct: 0, total: 0 };
            }
            subjectStats[subject].total++;
            if (q.isCorrect) subjectStats[subject].correct++;
        });

        // Format for Frontend
        const detailedBreakdown = Object.entries(topicStats).map(([topic, stats]) => ({
            topic,
            subject: stats.subject, // Include subject
            correct: stats.correct,
            incorrect: stats.wrong,
            unattempted: stats.unattempted,
            avgTime: stats.total > 0 ? Math.round(stats.time / stats.total) + 's' : '0s'
        }));

        const subjectBreakdown = Object.entries(subjectStats).map(([subject, stats]) => ({
            subject,
            accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        }));

        // Calculate Rank (Global)
        // Note: Using regex to match exam variations for fairer ranking
        const examRegex = new RegExp(`^${attempt.examType.split(' ')[0]}`, 'i');
        const betterAttempts = await Attempt.countDocuments({
            examType: { $regex: examRegex },
            score: { $gt: attempt.score }
        });
        const rank = betterAttempts + 1;

        // Calculate Improvement (vs Previous Attempt)
        let improvement = 'Baseline';
        const previousAttempt = await Attempt.findOne({
            userId,
            _id: { $ne: attempt._id },
            createdAt: { $lt: attempt.createdAt },
            examType: { $regex: examRegex }
        }).sort({ createdAt: -1 });

        if (previousAttempt) {
            const diff = attempt.score - previousAttempt.score;
            const percentDiff = previousAttempt.score !== 0
                ? ((diff / Math.abs(previousAttempt.score)) * 100).toFixed(1)
                : 0;

            improvement = diff > 0
                ? `+${diff.toFixed(1)} marks (+${percentDiff}%)`
                : `${diff.toFixed(1)} marks`;
        }

        // Calculate Topper Avg Time (Top 10% scorers)
        const totalAttemptsCount = await Attempt.countDocuments({ examType: { $regex: examRegex } });
        const topCount = Math.max(1, Math.ceil(totalAttemptsCount * 0.1));

        const topAttempts = await Attempt.find({ examType: { $regex: examRegex } })
            .sort({ score: -1 })
            .limit(topCount)
            .select('totalTimeTaken');

        const topperAvgTime = topAttempts.length > 0
            ? topAttempts.reduce((acc, curr) => acc + curr.totalTimeTaken, 0) / topAttempts.length
            : attempt.totalTimeTaken;

        res.json({
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            accuracy: attempt.accuracy,
            percentile: attempt.percentage ? `${attempt.percentage.toFixed(1)}%` : '0%',
            rank: `#${rank}`,
            attempted: attempt.totalAttempted,
            speed: attempt.totalAttempted > 0 ? (attempt.totalTimeTaken / attempt.totalAttempted).toFixed(1) + 's/q' : '0s/q',
            totalTimeTaken: attempt.totalTimeTaken,
            topperTime: topperAvgTime,
            improvement,
            subjectBreakdown,
            detailedBreakdown,
            createdAt: attempt.createdAt,
            examType: attempt.examType
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getPerformance = async (req, res) => {
    try {
        const performance = await Performance.findOne({ userId: req.user.id });
        if (!performance) {
            return res.json({ exams: {} });
        }
        res.json(performance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Get performance analysis for a specific exam
 * GET /api/analysis/:examName
 */
exports.getPerformanceAnalysis = async (req, res) => {
    try {
        let { examName } = req.params;
        // Normalize
        if (examName === 'GATE') examName = 'GATE CS';
        if (examName === 'gate-cs') examName = 'GATE CS';

        const userId = req.user.id;

        const analysis = await Performance.getPerformanceAnalysis(userId, examName);

        if (!analysis) {
            return res.status(404).json({
                message: 'Performance data not found for this exam',
                hint: 'Take some tests to build your performance profile'
            });
        }

        res.json(analysis);
    } catch (err) {
        console.error('Error getting performance analysis:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get weak topics for AI recommendations
 * GET /api/analysis/:examName/weak-topics
 * Query params: threshold (default: 60), limit (default: 10)
 */
exports.getWeakTopics = async (req, res) => {
    try {
        let { examName } = req.params;
        if (examName === 'GATE') examName = 'GATE CS';
        if (examName === 'gate-cs') examName = 'GATE CS';

        const userId = req.user.id;
        const threshold = parseInt(req.query.threshold) || 60;
        const limit = parseInt(req.query.limit) || 10;

        const weakTopics = await Performance.getWeakTopics(userId, examName, threshold, limit);

        res.json({
            examName,
            threshold,
            count: weakTopics.length,
            weakTopics
        });
    } catch (err) {
        console.error('Error getting weak topics:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get all exams performance overview
 * GET /api/analysis/overview
 */
exports.getPerformanceOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        const perf = await Performance.findOne({ userId });

        if (!perf || perf.exams.size === 0) {
            return res.json({
                message: 'No performance data available',
                exams: []
            });
        }

        const overview = [];
        for (const [examName, examData] of perf.exams.entries()) {
            overview.push({
                examName,
                globalStats: examData.globalStats,
                subjectCount: examData.subjectStats.size,
                topicCount: examData.topicStats.size,
                questionsAttempted: examData.questionStats.size
            });
        }

        res.json({ exams: overview });
    } catch (err) {
        console.error('Error getting performance overview:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get topic-wise strength scores
 * GET /api/analysis/:examName/topic-strengths
 */
exports.getTopicStrengths = async (req, res) => {
    try {
        let { examName } = req.params;
        if (examName === 'GATE') examName = 'GATE CS';
        if (examName === 'gate-cs') examName = 'GATE CS';

        const userId = req.user.id;

        const perf = await Performance.findOne({ userId });
        if (!perf || !perf.exams.has(examName)) {
            return res.status(404).json({ message: 'Performance data not found' });
        }

        const examData = perf.exams.get(examName);
        const topicStrengths = [];

        for (const [topic, stats] of examData.topicStats.entries()) {
            const strength = Performance.calculateStrength(stats);
            topicStrengths.push({
                topic,
                strength,
                attempted: stats.totalAttempted,
                correct: stats.totalCorrect,
                wrong: stats.totalWrong,
                accuracy: stats.totalAttempted > 0
                    ? ((stats.totalCorrect / stats.totalAttempted) * 100).toFixed(2)
                    : 0,
                avgTime: stats.totalAttempted > 0
                    ? (stats.totalTime / stats.totalAttempted).toFixed(2)
                    : 0
            });
        }

        // Sort by strength (nulls last)
        topicStrengths.sort((a, b) => {
            if (a.strength === null && b.strength === null) return 0;
            if (a.strength === null) return 1;
            if (b.strength === null) return -1;
            return b.strength - a.strength;
        });

        res.json({
            examName,
            topics: topicStrengths
        });
    } catch (err) {
        console.error('Error getting topic strengths:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get subject-wise performance
 * GET /api/analysis/:examName/subject-performance
 */
exports.getSubjectPerformance = async (req, res) => {
    try {
        let { examName } = req.params;
        if (examName === 'GATE') examName = 'GATE CS';
        if (examName === 'gate-cs') examName = 'GATE CS';

        const userId = req.user.id;

        const perf = await Performance.findOne({ userId });
        if (!perf || !perf.exams.has(examName)) {
            return res.status(404).json({ message: 'Performance data not found' });
        }

        const examData = perf.exams.get(examName);
        const subjectPerformance = [];

        for (const [subject, stats] of examData.subjectStats.entries()) {
            const strength = Performance.calculateStrength(stats);
            subjectPerformance.push({
                subject,
                strength,
                attempted: stats.totalAttempted,
                correct: stats.totalCorrect,
                wrong: stats.totalWrong,
                accuracy: stats.totalAttempted > 0
                    ? ((stats.totalCorrect / stats.totalAttempted) * 100).toFixed(2)
                    : 0,
                avgTime: stats.totalAttempted > 0
                    ? (stats.totalTime / stats.totalAttempted).toFixed(2)
                    : 0
            });
        }

        // Sort by strength
        subjectPerformance.sort((a, b) => {
            if (a.strength === null && b.strength === null) return 0;
            if (a.strength === null) return 1;
            if (b.strength === null) return -1;
            return b.strength - a.strength;
        });

        res.json({
            examName,
            subjects: subjectPerformance
        });
    } catch (err) {
        console.error('Error getting subject performance:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get comprehensive overview for analysis page
 * GET /api/analysis/overview
 */
exports.getOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { exam } = req.query;

        const perf = await Performance.findOne({ userId });

        if (!perf || perf.exams.size === 0) {
            return res.json({
                hasData: false,
                message: 'No performance data available. Take some tests to see your analysis!'
            });
        }

        // Get exam from query or default to first exam
        // Get exam from query or default to first exam
        let examName;
        if (exam) {
            // Normalize exam parameter
            let normalizedExam = exam;
            if (normalizedExam === 'GATE') normalizedExam = 'GATE CS';
            if (normalizedExam === 'gate-cs') normalizedExam = 'GATE CS';

            // Check if specifically normalized name exists
            if (perf.exams.has(normalizedExam)) {
                examName = normalizedExam;
            } else {
                // Fallback to searching keys (legacy logic)
                const searchName = exam.replace(/-/g, ' ');
                examName = Array.from(perf.exams.keys()).find(key => {
                    const k = key.toLowerCase();
                    const n = searchName.toLowerCase();
                    return k === n || n.startsWith(k) || k.startsWith(n); // Added bidirectional check
                });
            }
        }

        if (!examName) {
            examName = Array.from(perf.exams.keys())[0];
        }

        console.log(`[Analysis Overview] Fetching data for exam: ${examName}`);

        const examData = perf.exams.get(examName);

        // Filter attempts by exam
        // Use prefix match to handle variations
        const attempts = await Attempt.find({
            userId,
            examType: { $regex: new RegExp(`^${examName}`, 'i') }
        }).sort({ createdAt: -1 }).limit(10);

        // Calculate summary stats
        const totalAttempted = examData.globalStats.totalAttempted;
        const totalCorrect = examData.globalStats.totalCorrect;
        const totalWrong = examData.globalStats.totalWrong;
        const accuracy = examData.globalStats.averageAccuracy;
        const totalTime = examData.globalStats.totalTime;

        // Find best and worst subjects
        let bestSubject = null;
        let worstSubject = null;
        let maxStrength = -1;
        let minStrength = 101;

        for (const [subject, stats] of examData.subjectStats.entries()) {
            const strength = Performance.calculateStrength(stats);
            if (strength !== null) {
                if (strength > maxStrength) {
                    maxStrength = strength;
                    bestSubject = { name: subject, strength, accuracy: stats.accuracy };
                }
                if (strength < minStrength) {
                    minStrength = strength;
                    worstSubject = { name: subject, strength, accuracy: stats.accuracy };
                }
            }
        }

        // Performance trend from recent attempts
        const performanceTrend = attempts.map((attempt, index) => ({
            testNumber: attempts.length - index,
            score: attempt.score,
            accuracy: attempt.accuracy,
            date: attempt.createdAt
        })).reverse();

        res.json({
            hasData: true,
            examName,
            summary: {
                totalAttempted,
                totalCorrect,
                totalWrong,
                accuracy: accuracy.toFixed(2),
                totalTimeSpent: Math.floor(totalTime / 60), // in minutes
                avgTimePerQuestion: totalAttempted > 0 ? (totalTime / totalAttempted).toFixed(1) : 0
            },
            insights: {
                bestSubject,
                worstSubject,
                totalSubjects: examData.subjectStats.size,
                totalTopics: examData.topicStats.size
            },
            performanceTrend
        });

    } catch (err) {
        console.error('Error getting overview:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get subject-wise detailed analysis
 * GET /api/analysis/subjects
 */
exports.getSubjectAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;
        const { exam } = req.query;
        const perf = await Performance.findOne({ userId });

        if (!perf || perf.exams.size === 0) {
            return res.json({ hasData: false, subjects: [] });
        }

        // Get exam from query or default to first exam
        let examName;
        if (exam) {
            const normalizedExam = exam.replace(/-/g, ' ');
            examName = Array.from(perf.exams.keys()).find(key =>
                key.toLowerCase() === normalizedExam.toLowerCase()
            );
            if (!examName) examName = Array.from(perf.exams.keys())[0];
        } else {
            examName = Array.from(perf.exams.keys())[0];
        }

        console.log(`[Subject Analysis] Fetching data for exam: ${examName}`);
        const examData = perf.exams.get(examName);
        const subjects = [];

        for (const [subject, stats] of examData.subjectStats.entries()) {
            const strength = Performance.calculateStrength(stats);
            subjects.push({
                subject,
                attempted: stats.totalAttempted,
                correct: stats.totalCorrect,
                wrong: stats.totalWrong,
                unattempted: stats.totalUnattempted,
                accuracy: stats.totalAttempted > 0
                    ? ((stats.totalCorrect / stats.totalAttempted) * 100).toFixed(2)
                    : 0,
                avgTime: stats.totalAttempted > 0
                    ? (stats.totalTime / stats.totalAttempted).toFixed(1)
                    : 0,
                totalTime: Math.floor(stats.totalTime / 60), // minutes
                strength: strength || 0,
                strengthLabel: getStrengthLabel(strength)
            });
        }

        // Sort by strength (descending)
        subjects.sort((a, b) => b.strength - a.strength);

        res.json({
            hasData: true,
            examName,
            subjects
        });

    } catch (err) {
        console.error('Error getting subject analysis:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get topic-wise detailed analysis with subject grouping
 * GET /api/analysis/topics
 */
exports.getTopicAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;
        const { exam } = req.query;
        const perf = await Performance.findOne({ userId });
        const { getExamStructure } = require('../utils/constants');

        if (!perf || perf.exams.size === 0) {
            return res.json({ hasData: false, topics: [] });
        }

        // Get exam from query or default to first exam
        let examName;
        if (exam) {
            const normalizedExam = exam.replace(/-/g, ' ');
            examName = Array.from(perf.exams.keys()).find(key =>
                key.toLowerCase() === normalizedExam.toLowerCase()
            );
            if (!examName) examName = Array.from(perf.exams.keys())[0];
        } else {
            examName = Array.from(perf.exams.keys())[0];
        }

        console.log(`[Topic Analysis] Fetching data for exam: ${examName}`);
        const examData = perf.exams.get(examName);
        const topicsWithSubject = [];

        // Build Topic->Subject Map from Constants (Much faster/reliable than DB query)
        const structure = getExamStructure(examName);
        const topicToSubject = {};
        if (structure) {
            for (const [subject, topics] of Object.entries(structure)) {
                // Map the Subject Name itself as a topic (Handles cases where topic = subject name)
                topicToSubject[subject] = subject;
                if (Array.isArray(topics)) {
                    topics.forEach(t => topicToSubject[t] = subject);
                }
            }
        }

        // Get all topics and find their subjects
        for (const [topic, stats] of examData.topicStats.entries()) {
            // Use mapped subject or fallback to General
            // Try exact match first
            let subject = topicToSubject[topic];

            // Fuzzy Match Fallback
            if (!subject && structure) {
                const lowerTopic = topic.toLowerCase();

                for (const [subj, topics] of Object.entries(structure)) {
                    // Check if topic name matches Subject partial
                    if (subj.toLowerCase().includes(lowerTopic) || lowerTopic.includes(subj.toLowerCase())) {
                        subject = subj;
                        break;
                    }

                    // Check if topic is substring of known topics
                    if (Array.isArray(topics) && topics.some(t => t.toLowerCase().includes(lowerTopic) || lowerTopic.includes(t.toLowerCase()))) {
                        subject = subj;
                        break;
                    }
                }
            }

            if (!subject) {
                subject = 'General';
            }

            const strength = Performance.calculateStrength(stats);
            topicsWithSubject.push({
                topic,
                subject: subject,
                attempted: stats.totalAttempted,
                correct: stats.totalCorrect,
                wrong: stats.totalWrong,
                unattempted: stats.totalUnattempted,
                accuracy: stats.totalAttempted > 0
                    ? ((stats.totalCorrect / stats.totalAttempted) * 100).toFixed(2)
                    : 0,
                avgTime: stats.totalAttempted > 0
                    ? (stats.totalTime / stats.totalAttempted).toFixed(1)
                    : 0,
                totalTime: Math.floor(stats.totalTime / 60),
                strength: strength || 0,
                strengthLabel: getStrengthLabel(strength)
            });
        }

        // Group by subject
        const groupedBySubject = topicsWithSubject.reduce((acc, topic) => {
            if (!acc[topic.subject]) {
                acc[topic.subject] = [];
            }
            acc[topic.subject].push(topic);
            return acc;
        }, {});

        // Sort topics within each subject by strength
        Object.keys(groupedBySubject).forEach(subject => {
            groupedBySubject[subject].sort((a, b) => b.strength - a.strength);
        });

        res.json({
            hasData: true,
            examName,
            topics: topicsWithSubject,
            groupedBySubject
        });

    } catch (err) {
        console.error('Error getting topic analysis:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get growth analysis over time
 * GET /api/analysis/growth?days=30
 */
exports.getGrowthAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const attempts = await Attempt.find({
            userId,
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });

        if (attempts.length === 0) {
            return res.json({
                hasData: false,
                message: 'No test attempts in the selected time period'
            });
        }

        // Overall growth trend
        const overallTrend = attempts.map((attempt, index) => ({
            testNumber: index + 1,
            date: attempt.createdAt,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2),
            accuracy: attempt.accuracy,
            timeTaken: attempt.totalTimeTaken
        }));

        // Subject-wise growth
        const subjectGrowth = {};
        attempts.forEach((attempt, index) => {
            if (attempt.subjectWise && attempt.subjectWise.size > 0) {
                for (const [subject, stats] of attempt.subjectWise.entries()) {
                    if (!subjectGrowth[subject]) {
                        subjectGrowth[subject] = [];
                    }
                    subjectGrowth[subject].push({
                        testNumber: index + 1,
                        date: attempt.createdAt,
                        accuracy: stats.attempted > 0
                            ? ((stats.correct / stats.attempted) * 100).toFixed(2)
                            : 0,
                        attempted: stats.attempted,
                        correct: stats.correct
                    });
                }
            }
        });

        // Calculate improvement percentage
        const firstTest = attempts[0];
        const lastTest = attempts[attempts.length - 1];
        const accuracyImprovement = lastTest.accuracy - firstTest.accuracy;
        const scoreImprovement = ((lastTest.score / lastTest.totalMarks) - (firstTest.score / firstTest.totalMarks)) * 100;

        res.json({
            hasData: true,
            period: `Last ${days} days`,
            totalTests: attempts.length,
            overallTrend,
            subjectGrowth,
            improvement: {
                accuracy: accuracyImprovement.toFixed(2),
                score: scoreImprovement.toFixed(2),
                trend: accuracyImprovement > 0 ? 'improving' : accuracyImprovement < 0 ? 'declining' : 'stable'
            }
        });

    } catch (err) {
        console.error('Error getting growth analysis:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get time analytics
 * GET /api/analysis/time-analytics
 */
exports.getTimeAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const perf = await Performance.findOne({ userId });

        if (!perf || perf.exams.size === 0) {
            return res.json({ hasData: false });
        }

        const examName = Array.from(perf.exams.keys())[0];
        const examData = perf.exams.get(examName);

        // Time distribution by subject
        const subjectTimeDistribution = [];
        for (const [subject, stats] of examData.subjectStats.entries()) {
            subjectTimeDistribution.push({
                subject,
                totalTime: Math.floor(stats.totalTime / 60), // minutes
                avgTime: stats.totalAttempted > 0
                    ? (stats.totalTime / stats.totalAttempted).toFixed(1)
                    : 0,
                questionsAttempted: stats.totalAttempted,
                speed: getSpeedLabel(stats.totalAttempted > 0 ? stats.totalTime / stats.totalAttempted : 0)
            });
        }

        // Time distribution by topic (top 10 most time-consuming)
        const topicTimeDistribution = [];
        for (const [topic, stats] of examData.topicStats.entries()) {
            topicTimeDistribution.push({
                topic,
                totalTime: Math.floor(stats.totalTime / 60),
                avgTime: stats.totalAttempted > 0
                    ? (stats.totalTime / stats.totalAttempted).toFixed(1)
                    : 0,
                questionsAttempted: stats.totalAttempted
            });
        }

        // Sort by total time and get top 10
        topicTimeDistribution.sort((a, b) => b.totalTime - a.totalTime);
        const top10Topics = topicTimeDistribution.slice(0, 10);

        // Overall time stats
        const totalTime = examData.globalStats.totalTime;
        const totalQuestions = examData.globalStats.totalAttempted;
        const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        res.json({
            hasData: true,
            examName,
            overall: {
                totalTimeSpent: Math.floor(totalTime / 60), // minutes
                totalHours: (totalTime / 3600).toFixed(1),
                avgTimePerQuestion: avgTimePerQuestion.toFixed(1),
                totalQuestions
            },
            subjectTimeDistribution,
            topTimeConsumingTopics: top10Topics
        });

    } catch (err) {
        console.error('Error getting time analytics:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper functions
function getStrengthLabel(strength) {
    if (strength === null || strength === 0) return 'Not Attempted';
    if (strength < 40) return 'Critical';
    if (strength < 60) return 'Weak';
    if (strength < 76) return 'Moderate';
    if (strength < 91) return 'Strong';
    return 'Excellent';
}

function getSpeedLabel(avgTime) {
    if (avgTime < 60) return 'Very Fast';
    if (avgTime < 90) return 'Fast';
    if (avgTime < 120) return 'Normal';
    if (avgTime < 150) return 'Slow';
    return 'Very Slow';
}
