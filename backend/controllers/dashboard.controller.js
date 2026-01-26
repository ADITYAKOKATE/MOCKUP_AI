const Attempt = require('../models/Attempt');
const Performance = require('../models/Performance');
const UserProfile = require('../models/UserProfile');

/**
 * Get comprehensive dashboard data
 * GET /api/dashboard?exam=jee-main
 */
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { exam } = req.query;

        // Get user profile to determine selected exam
        const userProfile = await UserProfile.findOne({ userId });
        if (!userProfile || !userProfile.exams || userProfile.exams.length === 0) {
            return res.json({
                message: 'Please complete your profile setup',
                hasProfile: false
            });
        }

        // Use exam from query parameter, or default to first exam
        let selectedExam;
        if (exam) {
            // Normalize exam parameter (handle "jee-main" format)
            const normalizedExam = exam.replace(/-/g, ' ');
            // Find matching exam in user's profile (case-insensitive)
            // Find matching exam in user's profile (case-insensitive)
            // Handle both "examType" and "examType branch" formats
            const matchingExam = userProfile.exams.find(e => {
                const typeMatch = e.examType.toLowerCase() === normalizedExam.toLowerCase();
                if (typeMatch) return true;

                if (e.branch) {
                    const fullMatch = `${e.examType} ${e.branch}`.toLowerCase() === normalizedExam.toLowerCase();
                    if (fullMatch) return true;
                }
                return false;
            });
            selectedExam = matchingExam ? matchingExam.examType : userProfile.exams[0].examType;
        } else {
            selectedExam = userProfile.exams[0].examType;
        }

        console.log(`[Dashboard] Fetching data for exam: ${selectedExam}`);

        // Fetch attempts for this specific exam
        // Use prefix match to handle variations (e.g. "GATE" matches "gate-cs")
        const attempts = await Attempt.find({
            userId,
            examType: { $regex: new RegExp(`^${selectedExam}`, 'i') }
        })
            .sort({ createdAt: -1 })
            .limit(20);

        // Normalize for Performance lookup to prevent mismatch/rebuild loops
        let performanceExamName = selectedExam;
        if (performanceExamName === 'GATE') performanceExamName = 'GATE CS';
        if (performanceExamName === 'gate-cs') performanceExamName = 'GATE CS';
        if (performanceExamName === 'jee-main') performanceExamName = 'JEE Main';

        // Fetch performance data
        let performance = await Performance.findOne({ userId });

        // SELF-HEALING: If attempts exist but performance is missing or empty, rebuild it
        // Use normalized name to check existence
        if (attempts.length > 0 && (!performance || !performance.exams || performance.exams.size === 0 || !performance.exams.has(performanceExamName))) {
            console.log(`[Dashboard] Detected missing performance data for user ${userId}. Rebuilding for ${performanceExamName}...`);

            // We need ALL attempts, not just the last 20, to rebuild accurately
            const allAttempts = await Attempt.find({ userId });
            const Question = require('../models/Question');

            // Initialize fresh performance record if needed
            if (!performance) {
                performance = new Performance({ userId, exams: new Map() });
            }

            // Rebuild from scratch
            for (const attempt of allAttempts) {
                if (!attempt.questions || attempt.questions.length === 0) continue;

                // We need the database questions to map subjects correctly
                const qIds = attempt.questions.map(q => q.questionId);
                const dbQuestions = await Question.find({ _id: { $in: qIds } });
                const qMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));

                await Performance.updatePerformance(userId, attempt.examType, attempt.questions, qMap);
            }

            // Reload performance after rebuild
            performance = await Performance.findOne({ userId });
            console.log(`[Dashboard] Rebuild complete.`);
        }

        // Calculate dashboard metrics
        const dashboardData = {
            hasProfile: true,
            selectedExam,

            // Overall Stats
            stats: {
                totalTests: attempts.length,
                totalQuestions: attempts.reduce((sum, a) => sum + a.totalQuestions, 0),
                totalCorrect: attempts.reduce((sum, a) => sum + a.totalCorrect, 0),
                totalWrong: attempts.reduce((sum, a) => sum + a.totalWrong, 0),
                totalTime: attempts.reduce((sum, a) => sum + a.totalTimeTaken, 0),
                averageScore: attempts.length > 0
                    ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(2)
                    : 0,
                averageAccuracy: attempts.length > 0
                    ? ((attempts.reduce((sum, a) => sum + a.totalCorrect, 0) /
                        attempts.reduce((sum, a) => sum + a.totalQuestions, 0)) * 100).toFixed(2)
                    : 0
            },

            // Last Test Info
            lastTest: attempts.length > 0 ? {
                score: attempts[0].score,
                totalQuestions: attempts[0].totalQuestions,
                totalMarks: attempts[0].totalMarks,
                accuracy: ((attempts[0].totalCorrect / attempts[0].totalQuestions) * 100).toFixed(2),
                timeTaken: attempts[0].totalTimeTaken,
                date: attempts[0].createdAt,
                testType: attempts[0].testType,
                subject: attempts[0].subject
            } : null,

            // Performance Trend (last 10 tests)
            performanceTrend: attempts.slice(0, 10).reverse().map((attempt, index) => {
                const subjects = {};

                // Method 1: Use pre-calculated subjectWise map (Preferred)
                if (attempt.subjectWise && attempt.subjectWise.size > 0) { // Check if map exists and has entries
                    // Iterate Mongoose Map
                    for (const [subject, stats] of attempt.subjectWise.entries()) { // Use entries() for Map
                        if (stats.attempted > 0 || stats.total > 0) { // Check for valid stats
                            // Calculate percentage (Accuracy based on correct/total questions for that subject if total exists, else correct/attempted)
                            // Note: subjectWise schema usually has 'attempted', 'correct', etc.
                            // Let's assume stats has 'correct' and 'attempted' or 'total'
                            // Based on Attempt.js schema: attempted, correct, wrong, unattempted, score...
                            // We probably want % correct vs total questions in that subject for the test?
                            // Or just accuracy? Let's use accuracy if available or calc it.
                            const total = (stats.attempted || 0) + (stats.unattempted || 0);
                            const percentage = total > 0
                                ? Math.round((stats.correct / total) * 100)
                                : 0;
                            subjects[subject] = percentage;
                        }
                    }
                }
                // Method 2: Fallback to calculating from questions
                else if (attempt.questions && attempt.questions.length > 0) {
                    const subjectStats = {};
                    attempt.questions.forEach(q => {
                        const sub = q.subject || 'General';
                        if (!subjectStats[sub]) subjectStats[sub] = { correct: 0, total: 0 };
                        subjectStats[sub].total++;
                        if (q.isCorrect) subjectStats[sub].correct++;
                    });

                    Object.keys(subjectStats).forEach(sub => {
                        subjects[sub] = subjectStats[sub].total > 0
                            ? Math.round((subjectStats[sub].correct / subjectStats[sub].total) * 100)
                            : 0;
                    });
                }

                // If subjects is empty despite having a testType='Subject', might label it as the specific subject
                if (Object.keys(subjects).length === 0 && attempt.subject) {
                    // For single subject test
                    subjects[attempt.subject] = attempt.totalQuestions > 0
                        ? Math.round((attempt.totalCorrect / attempt.totalQuestions) * 100)
                        : 0;
                }

                return {
                    id: index + 1,
                    score: attempt.score,
                    accuracy: attempt.totalQuestions > 0 ? ((attempt.totalCorrect / attempt.totalQuestions) * 100).toFixed(2) : 0,
                    date: attempt.createdAt,
                    testType: attempt.testType,
                    subjects
                };
            }),

            // Recent Activity
            recentActivity: attempts.slice(0, 5).map(attempt => ({
                id: attempt._id,
                testType: attempt.testType,
                subject: attempt.subject,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                accuracy: ((attempt.totalCorrect / attempt.totalQuestions) * 100).toFixed(2),
                date: attempt.createdAt,
                timeTaken: attempt.totalTimeTaken
            })),

            // Study Streak (simplified - count consecutive days with attempts)
            studyStreak: calculateStudyStreak(attempts),

            // Subject Performance (if performance data exists)
            subjectPerformance: null,
            weakAreas: [],
            strongAreas: []
        };

        // Add performance-based data if available
        if (performance && performance.exams.has(performanceExamName)) {
            const examData = performance.exams.get(performanceExamName);

            // Subject Performance
            const subjectPerf = [];
            for (const [subject, stats] of examData.subjectStats.entries()) {
                const strength = Performance.calculateStrength(stats);
                subjectPerf.push({
                    subject,
                    attempted: stats.totalAttempted,
                    correct: stats.totalCorrect,
                    wrong: stats.totalWrong,
                    accuracy: stats.totalAttempted > 0
                        ? ((stats.totalCorrect / stats.totalAttempted) * 100).toFixed(2)
                        : 0,
                    strength,
                    avgTime: stats.totalAttempted > 0
                        ? (stats.totalTime / stats.totalAttempted).toFixed(2)
                        : 0
                });
            }
            dashboardData.subjectPerformance = subjectPerf;

            // Weak and Strong Areas (topics)
            const topicPerf = [];
            for (const [topic, stats] of examData.topicStats.entries()) {
                const strength = Performance.calculateStrength(stats);
                if (strength !== null) {
                    topicPerf.push({
                        topic,
                        attempted: stats.totalAttempted,
                        correct: stats.totalCorrect,
                        wrong: stats.totalWrong,
                        accuracy: ((stats.totalCorrect / stats.totalAttempted) * 100).toFixed(2),
                        strength,
                        avgTime: (stats.totalTime / stats.totalAttempted).toFixed(2)
                    });
                }
            }

            // Sort and categorize
            topicPerf.sort((a, b) => a.strength - b.strength);
            dashboardData.weakAreas = topicPerf.filter(t => t.strength < 60).slice(0, 5);
            dashboardData.strongAreas = topicPerf.filter(t => t.strength >= 75).slice(-5).reverse();
        }

        // Calculate Predictive Exam Score and Rank
        dashboardData.predictiveAnalysis = calculatePredictiveScore(
            performance,
            performanceExamName,
            attempts,
            dashboardData.subjectPerformance
        );

        res.json(dashboardData);

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Calculate study streak from attempts
 * @param {Array} attempts - Array of attempt documents
 * @returns {Object} Streak information
 */
function calculateStudyStreak(attempts) {
    if (attempts.length === 0) {
        return { current: 0, longest: 0, lastStudyDate: null };
    }

    // Get unique study dates
    const studyDates = [...new Set(
        attempts.map(a => new Date(a.createdAt).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if studied today or yesterday for current streak
    if (studyDates[0] === today || studyDates[0] === yesterday) {
        currentStreak = 1;

        // Count consecutive days
        for (let i = 1; i < studyDates.length; i++) {
            const prevDate = new Date(studyDates[i - 1]);
            const currDate = new Date(studyDates[i]);
            const diffDays = Math.floor((prevDate - currDate) / 86400000);

            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    for (let i = 1; i < studyDates.length; i++) {
        const prevDate = new Date(studyDates[i - 1]);
        const currDate = new Date(studyDates[i]);
        const diffDays = Math.floor((prevDate - currDate) / 86400000);

        if (diffDays === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, currentStreak, 1);

    return {
        current: currentStreak,
        longest: longestStreak,
        lastStudyDate: studyDates[0]
    };
}

/**
 * Calculate Predictive Exam Score and Rank based on real performance data
 * @param {Object} performance - Performance document
 * @param {string} examName - Exam name
 * @param {Array} attempts - Recent attempts
 * @param {Array} subjectPerformance - Subject-wise performance data
 * @returns {Object} Predictive analysis with score, rank, percentile
 */
function calculatePredictiveScore(performance, examName, attempts, subjectPerformance) {
    // Default response if no data
    if (!performance || !performance.exams.has(examName) || attempts.length === 0) {
        return {
            predictedScore: null,
            predictedRank: null,
            predictedPercentile: null,
            confidence: 0,
            message: 'Take more tests to generate predictions'
        };
    }

    const examData = performance.exams.get(examName);

    // Exam-specific configurations (total marks and question distribution)
    const examConfigs = {
        'JEE Main': { totalMarks: 300, subjects: ['Physics', 'Chemistry', 'Mathematics'], marksPerSubject: 100, totalCandidates: 1200000 },
        'JEE Advanced': { totalMarks: 306, subjects: ['Physics', 'Chemistry', 'Mathematics'], marksPerSubject: 102, totalCandidates: 250000 },
        'NEET': { totalMarks: 720, subjects: ['Physics', 'Chemistry', 'Biology'], marksPerSubject: 180, totalCandidates: 1800000 },
        'GATE CSE': { totalMarks: 100, subjects: null, marksPerSubject: null, totalCandidates: 150000 },
        'GATE ECE': { totalMarks: 100, subjects: null, marksPerSubject: null, totalCandidates: 120000 }
    };

    const config = examConfigs[examName] || { totalMarks: 100, subjects: null, marksPerSubject: null, totalCandidates: 100000 };

    // Calculate subject-wise predicted scores
    let totalPredictedScore = 0;
    const subjectScores = [];

    if (config.subjects && subjectPerformance && subjectPerformance.length > 0) {
        // Subject-based exams (JEE, NEET)
        for (const subject of config.subjects) {
            const subjectData = subjectPerformance.find(s => s.subject === subject);

            if (subjectData && subjectData.attempted > 0) {
                const accuracy = parseFloat(subjectData.accuracy) / 100;
                const strength = subjectData.strength || 50;

                // Weighted score calculation
                // Base score from accuracy
                let baseScore = accuracy * config.marksPerSubject;

                // Strength adjustment (±20% based on strength)
                const strengthFactor = (strength - 50) / 250; // -0.2 to +0.2
                baseScore = baseScore * (1 + strengthFactor);

                // Consistency factor (based on attempts)
                const consistencyFactor = Math.min(1, subjectData.attempted / 50); // Max at 50 attempts
                baseScore = baseScore * (0.7 + 0.3 * consistencyFactor);

                // Difficulty adjustment (assume harder questions reduce score by 10%)
                baseScore = baseScore * 0.9;

                subjectScores.push({
                    subject,
                    predictedScore: Math.round(baseScore),
                    maxScore: config.marksPerSubject,
                    accuracy: (accuracy * 100).toFixed(1)
                });

                totalPredictedScore += baseScore;
            } else {
                // No data for this subject - use average
                const avgScore = config.marksPerSubject * 0.4; // Assume 40% for unknown subjects
                subjectScores.push({
                    subject,
                    predictedScore: Math.round(avgScore),
                    maxScore: config.marksPerSubject,
                    accuracy: '40.0'
                });
                totalPredictedScore += avgScore;
            }
        }
    } else {
        // Non-subject-based exams (GATE)
        const globalAccuracy = examData.globalStats.averageAccuracy / 100;
        const totalAttempted = examData.globalStats.totalAttempted;

        // Base score from global accuracy
        let baseScore = globalAccuracy * config.totalMarks;

        // Consistency factor
        const consistencyFactor = Math.min(1, totalAttempted / 100);
        baseScore = baseScore * (0.7 + 0.3 * consistencyFactor);

        // Difficulty adjustment
        baseScore = baseScore * 0.9;

        totalPredictedScore = baseScore;
    }

    // Calculate trend factor from recent attempts
    let trendFactor = 1.0;
    if (attempts.length >= 3) {
        const recentScores = attempts.slice(0, 5).map(a => (a.score / a.totalMarks) * 100);
        const avgRecent = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const firstScore = recentScores[recentScores.length - 1];
        const lastScore = recentScores[0];

        // If improving, boost by up to 10%
        if (lastScore > firstScore) {
            const improvement = (lastScore - firstScore) / firstScore;
            trendFactor = 1 + Math.min(0.1, improvement * 0.5);
        } else if (lastScore < firstScore) {
            // If declining, reduce by up to 5%
            const decline = (firstScore - lastScore) / firstScore;
            trendFactor = 1 - Math.min(0.05, decline * 0.5);
        }
    }

    totalPredictedScore = totalPredictedScore * trendFactor;
    totalPredictedScore = Math.round(Math.min(totalPredictedScore, config.totalMarks));

    // Calculate percentile based on predicted score
    // Calculate percentile based on predicted score
    // Using simple interpolation for realistic curves
    const scorePercentage = (totalPredictedScore / config.totalMarks) * 100;
    let predictedPercentile;

    if (scorePercentage >= 95) predictedPercentile = 99.9;
    else if (scorePercentage >= 90) predictedPercentile = 99.0 + (scorePercentage - 90) * 0.18;
    else if (scorePercentage >= 80) predictedPercentile = 95.0 + (scorePercentage - 80) * 0.4;
    else if (scorePercentage >= 70) predictedPercentile = 90.0 + (scorePercentage - 70) * 0.5;
    else if (scorePercentage >= 60) predictedPercentile = 80.0 + (scorePercentage - 60) * 1.0;
    else if (scorePercentage >= 50) predictedPercentile = 65.0 + (scorePercentage - 50) * 1.5;
    else if (scorePercentage >= 40) predictedPercentile = 45.0 + (scorePercentage - 40) * 2.0;
    else if (scorePercentage >= 30) predictedPercentile = 30.0 + (scorePercentage - 30) * 1.5; // GATE qualifying range
    else if (scorePercentage >= 20) predictedPercentile = 15.0 + (scorePercentage - 20) * 1.5;
    else predictedPercentile = Math.max(0.1, scorePercentage * 0.75); // Linear drop for very low scores

    // Calculate predicted rank
    const predictedRank = Math.round(config.totalCandidates * (1 - predictedPercentile / 100));

    // Calculate confidence level (0-100)
    const attemptsFactor = Math.min(100, (attempts.length / 10) * 40); // Max 40 points for 10+ attempts
    const consistencyFactor = Math.min(30, (examData.globalStats.totalAttempted / 100) * 30); // Max 30 points
    const trendConfidence = Math.abs(trendFactor - 1) < 0.05 ? 30 : 20; // 30 if stable, 20 if volatile
    const confidence = Math.round(attemptsFactor + consistencyFactor + trendConfidence);

    return {
        predictedScore: totalPredictedScore,
        maxScore: config.totalMarks,
        predictedRank,
        predictedPercentile: predictedPercentile.toFixed(2),
        confidence,
        subjectScores,
        trend: trendFactor > 1.02 ? 'improving' : trendFactor < 0.98 ? 'declining' : 'stable',
        trendPercentage: ((trendFactor - 1) * 100).toFixed(1),
        totalCandidates: config.totalCandidates,
        message: confidence >= 70 ? 'High confidence prediction' : confidence >= 50 ? 'Moderate confidence' : 'Low confidence - take more tests'
    };
}
