const mongoose = require('mongoose');
const { getExamStructure } = require('../utils/constants');

const performanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    // Map of Exams (Key: Exam Name, e.g., "JEE Main")
    exams: {
        type: Map,
        of: {
            // Global Stats for this Exam
            globalStats: {
                totalAttempted: { type: Number, default: 0 },
                totalCorrect: { type: Number, default: 0 },
                totalWrong: { type: Number, default: 0 },
                totalTime: { type: Number, default: 0 },
                averageAccuracy: { type: Number, default: 0 } // Percentage
            },

            // Detailed Question History (Key: questionId string)
            questionStats: {
                type: Map,
                of: {
                    status: {
                        type: String,
                        enum: ['Correct', 'Wrong', 'Unattempted'],
                        default: 'Unattempted'
                    },
                    attemptsCount: { type: Number, default: 0 },
                    lastTimeTaken: { type: Number, default: 0 }, // Time of last attempt
                    lastAttemptedAt: { type: Date, default: Date.now }
                },
                default: {}
            },

            // Aggregated Stats
            subjectStats: {
                type: Map,
                of: {
                    totalAttempted: { type: Number, default: 0 },
                    totalCorrect: { type: Number, default: 0 },
                    totalWrong: { type: Number, default: 0 },
                    totalUnattempted: { type: Number, default: 0 },
                    totalTime: { type: Number, default: 0 }, // Seconds
                    accuracy: { type: Number, default: 0 },
                    avgTime: { type: Number, default: 0 },
                    strength: { type: Number, default: 0 }
                },
                default: {}
            },
            topicStats: {
                type: Map,
                of: {
                    totalAttempted: { type: Number, default: 0 },
                    totalCorrect: { type: Number, default: 0 },
                    totalWrong: { type: Number, default: 0 },
                    totalUnattempted: { type: Number, default: 0 },
                    totalTime: { type: Number, default: 0 }, // Seconds
                    accuracy: { type: Number, default: 0 },
                    avgTime: { type: Number, default: 0 },
                    strength: { type: Number, default: 0 }
                },
                default: {}
            },
            difficultyStats: {
                type: Map,
                of: {
                    totalAttempted: { type: Number, default: 0 },
                    totalCorrect: { type: Number, default: 0 },
                    totalWrong: { type: Number, default: 0 },
                    totalUnattempted: { type: Number, default: 0 },
                    totalTime: { type: Number, default: 0 }, // Seconds
                    accuracy: { type: Number, default: 0 },
                    avgTime: { type: Number, default: 0 },
                    strength: { type: Number, default: 0 }
                },
                default: {}
            },
            importanceStats: {
                type: Map,
                of: {
                    totalAttempted: { type: Number, default: 0 },
                    totalCorrect: { type: Number, default: 0 },
                    totalWrong: { type: Number, default: 0 },
                    totalUnattempted: { type: Number, default: 0 },
                    totalTime: { type: Number, default: 0 }, // Seconds
                    accuracy: { type: Number, default: 0 },
                    avgTime: { type: Number, default: 0 },
                    strength: { type: Number, default: 0 }
                },
                default: {}
            }
        },
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});


// Middleware to update lastUpdated on save
performanceSchema.pre('save', function () {
    this.lastUpdated = Date.now();
});

// Static method to update performance after an attempt
performanceSchema.statics.updatePerformance = async function (userId, examName, attemptQuestions, questionMap) {
    try {
        // Normalize exam name to prevent fragmentation
        if (examName === 'GATE') examName = 'GATE CS';
        if (examName === 'gate-cs') examName = 'GATE CS';
        if (examName === 'jee-main') examName = 'JEE Main';

        let perf = await this.findOne({ userId });
        if (!perf) {
            perf = await this.create({ userId, exams: {} });
        }

        // Initialize exam stats if not present
        if (!perf.exams.has(examName)) {
            perf.exams.set(examName, {
                globalStats: { totalAttempted: 0, totalCorrect: 0, totalWrong: 0, totalTime: 0, averageAccuracy: 0 },
                questionStats: {},
                subjectStats: {},
                topicStats: {},
                difficultyStats: {},
                importanceStats: {}
            });
        }

        const examStats = perf.exams.get(examName);

        // Store reference to Model for use in helper function
        const PerformanceModel = this;

        // Helper to update a Stats object (structure is now implicit in the map)
        const updateStats = (map, key, isCorrect, timeTaken) => {
            if (!key) return; // Skip if key is null/undefined
            key = String(key); // Ensure key is string for Map

            if (!map.has(key)) {
                map.set(key, {
                    totalAttempted: 0,
                    totalCorrect: 0,
                    totalWrong: 0,
                    totalUnattempted: 0,
                    totalTime: 0,
                    accuracy: 0,
                    avgTime: 0,
                    strength: 0
                });
            }
            const stats = map.get(key);
            stats.totalAttempted += 1;
            stats.totalTime += timeTaken;
            if (isCorrect) stats.totalCorrect += 1;
            else stats.totalWrong += 1;

            // Derived stats
            stats.accuracy = (stats.totalCorrect / stats.totalAttempted) * 100;
            stats.avgTime = stats.totalTime / stats.totalAttempted;

            // Calculate strength using the Model reference
            stats.strength = PerformanceModel.calculateStrength(stats);

            map.set(key, stats); // Re-set to ensure Mongoose change tracking picks it up
        };

        // New helper to handle unattempted questions
        const updateStatsWithUnattempted = (map, key, wasAttempted, isCorrect, timeTaken) => {
            if (!key) return;
            key = String(key);

            if (!map.has(key)) {
                map.set(key, {
                    totalAttempted: 0,
                    totalCorrect: 0,
                    totalWrong: 0,
                    totalUnattempted: 0,
                    totalTime: 0,
                    accuracy: 0,
                    avgTime: 0,
                    strength: 0
                });
            }

            const stats = map.get(key);

            if (wasAttempted) {
                stats.totalAttempted += 1;
                stats.totalTime += timeTaken;
                if (isCorrect) stats.totalCorrect += 1;
                else stats.totalWrong += 1;

                // Derived stats (only for attempted questions)
                stats.accuracy = (stats.totalCorrect / stats.totalAttempted) * 100;
                stats.avgTime = stats.totalTime / stats.totalAttempted;
                stats.strength = PerformanceModel.calculateStrength(stats);
            } else {
                stats.totalUnattempted += 1;
            }

            map.set(key, stats);
        };

        for (const q of attemptQuestions) {
            const dbQuestion = questionMap.get(q.questionId.toString());
            if (!dbQuestion) continue;

            const isCorrect = q.isCorrect;
            const timeTaken = q.timeTaken || 0;

            // Check if question was actually attempted
            const wasAttempted = q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== '';

            // 1. Update Global Stats
            if (wasAttempted) {
                examStats.globalStats.totalAttempted += 1;
                examStats.globalStats.totalTime += timeTaken;
                if (isCorrect) examStats.globalStats.totalCorrect += 1;
                else examStats.globalStats.totalWrong += 1;
            }

            // 2. Update Question Progress
            const qId = q.questionId.toString();
            let qProg = examStats.questionStats.get(qId);
            if (!qProg) {
                qProg = { status: 'Unattempted', attemptsCount: 0, lastTimeTaken: 0, lastAttemptedAt: null };
            }

            if (wasAttempted) {
                qProg.attemptsCount += 1;
                qProg.lastTimeTaken = timeTaken;
                qProg.lastAttemptedAt = new Date();
                qProg.status = isCorrect ? 'Correct' : 'Wrong';
            }
            examStats.questionStats.set(qId, qProg);

            // 3. Update Categorical Stats (only if attempted OR track unattempted)
            updateStatsWithUnattempted(examStats.subjectStats, dbQuestion.subject, wasAttempted, isCorrect, timeTaken);
            updateStatsWithUnattempted(examStats.topicStats, dbQuestion.topic, wasAttempted, isCorrect, timeTaken);
            updateStatsWithUnattempted(examStats.difficultyStats, dbQuestion.difficulty, wasAttempted, isCorrect, timeTaken);
            updateStatsWithUnattempted(examStats.importanceStats, dbQuestion.importance, wasAttempted, isCorrect, timeTaken);
        }

        // Recalculate Average Accuracy
        if (examStats.globalStats.totalAttempted > 0) {
            examStats.globalStats.averageAccuracy =
                (examStats.globalStats.totalCorrect / examStats.globalStats.totalAttempted) * 100;
        }

        perf.exams.set(examName, examStats); // Save back to Map

        // CRITICAL: Mark the exams field as modified to ensure Mongoose saves Map changes
        perf.markModified('exams');

        await perf.save();
        console.log(`✅ Performance updated for user ${userId} on exam ${examName}`);
        console.log(`   - Total Attempted: ${examStats.globalStats.totalAttempted}`);
        console.log(`   - Subjects updated: ${examStats.subjectStats.size}`);
        console.log(`   - Topics updated: ${examStats.topicStats.size}`);

    } catch (err) {
        console.error("❌ Error updating performance:", err);
        console.error("Stack trace:", err.stack);
        throw err; // Re-throw to see the error in the calling function
    }
};

/**
 * Initialize performance schema for a specific exam
     * Creates pre-populated structure with all subjects and topics
     * @param {ObjectId} userId - User ID
     * @param {string} examName - Name of the exam (e.g., "JEE Main")
     */
performanceSchema.statics.initializeExamPerformance = async function (userId, examName) {
    try {
        // Normalize
        if (examName === 'GATE') examName = 'GATE CS';
        if (examName === 'gate-cs') examName = 'GATE CS';
        if (examName === 'jee-main') examName = 'JEE Main';

        // Get exam structure from config
        const examStructure = getExamStructure(examName);
        if (!examStructure) {
            console.warn(`Exam structure not found for: ${examName}`);
            return;
        }

        // Find or create performance document
        let perf = await this.findOne({ userId });
        if (!perf) {
            perf = await this.create({ userId, exams: new Map() });
        }

        // Check if exam already initialized
        if (perf.exams.has(examName)) {
            console.log(`Performance schema already exists for ${examName}`);
            return perf;
        }

        // Initialize exam structure
        const examData = {
            globalStats: {
                totalAttempted: 0,
                totalCorrect: 0,
                totalWrong: 0,
                totalTime: 0,
                averageAccuracy: 0
            },
            questionStats: new Map(),
            subjectStats: new Map(),
            topicStats: new Map(),
            difficultyStats: new Map(),
            importanceStats: new Map()
        };

        // Pre-populate all subjects and topics with initial values
        for (const [subject, topics] of Object.entries(examStructure)) {
            // Initialize subject stats
            examData.subjectStats.set(subject, {
                totalAttempted: 0,
                totalCorrect: 0,
                totalWrong: 0,
                totalUnattempted: 0,
                totalTime: 0,
                accuracy: 0,
                avgTime: 0,
                strength: 0
            });

            // Initialize all topic stats
            for (const topic of topics) {
                examData.topicStats.set(topic, {
                    totalAttempted: 0,
                    totalCorrect: 0,
                    totalWrong: 0,
                    totalUnattempted: 0,
                    totalTime: 0,
                    accuracy: 0,
                    avgTime: 0,
                    strength: 0
                });
            }
        }

        // Initialize difficulty stats
        ['Low', 'Medium', 'High'].forEach(difficulty => {
            examData.difficultyStats.set(difficulty, {
                totalAttempted: 0,
                totalCorrect: 0,
                totalWrong: 0,
                totalUnattempted: 0,
                totalTime: 0,
                accuracy: 0,
                avgTime: 0,
                strength: 0
            });
        });

        // Initialize importance stats (1-10 scale)
        for (let i = 1; i <= 10; i++) {
            examData.importanceStats.set(String(i), {
                totalAttempted: 0,
                totalCorrect: 0,
                totalWrong: 0,
                totalUnattempted: 0,
                totalTime: 0,
                accuracy: 0,
                avgTime: 0,
                strength: 0
            });
        }

        perf.exams.set(examName, examData);
        await perf.save();

        console.log(`✅ Performance schema initialized for user ${userId} - Exam: ${examName}`);
        return perf;

    } catch (err) {
        console.error("Error initializing exam performance:", err);
        throw err;
    }
};

/**
 * Calculate strength score for a topic/subject
 * Returns a score from 0-100 based on accuracy, speed, and consistency
 * @param {Object} stats - Stats object with totalAttempted, totalCorrect, totalWrong, totalTime
 * @param {number} expectedAvgTime - Expected average time per question (in seconds)
 * @returns {number|null} Strength score (0-100) or null if not attempted
 */
performanceSchema.statics.calculateStrength = function (stats, expectedAvgTime = 120) {
    if (!stats || stats.totalAttempted === 0) {
        return null; // Not attempted yet
    }

    // 1. Accuracy Score (0-60 points) - Most important
    const accuracy = (stats.totalCorrect / stats.totalAttempted) * 100;
    const accuracyScore = (accuracy / 100) * 60;

    // 2. Speed Score (0-25 points)
    const avgTimePerQuestion = stats.totalTime / stats.totalAttempted;
    let speedScore = 0;
    if (avgTimePerQuestion <= expectedAvgTime * 0.7) {
        speedScore = 25; // Very fast
    } else if (avgTimePerQuestion <= expectedAvgTime) {
        speedScore = 20; // Good speed
    } else if (avgTimePerQuestion <= expectedAvgTime * 1.3) {
        speedScore = 15; // Acceptable
    } else if (avgTimePerQuestion <= expectedAvgTime * 1.5) {
        speedScore = 10; // Slow
    } else {
        speedScore = 5; // Very slow
    }

    // 3. Consistency Score (0-15 points) - Based on attempt count
    let consistencyScore = 0;
    if (stats.totalAttempted >= 20) {
        consistencyScore = 15; // High consistency
    } else if (stats.totalAttempted >= 10) {
        consistencyScore = 12;
    } else if (stats.totalAttempted >= 5) {
        consistencyScore = 8;
    } else {
        consistencyScore = 5; // Low consistency
    }

    // Total strength score
    const strengthScore = Math.round(accuracyScore + speedScore + consistencyScore);
    return Math.min(100, Math.max(0, strengthScore)); // Clamp between 0-100
};

/**
 * Get detailed performance analysis with strength scores
 * @param {ObjectId} userId - User ID
 * @param {string} examName - Exam name
 * @returns {Object} Performance analysis with strength scores
 */
performanceSchema.statics.getPerformanceAnalysis = async function (userId, examName) {
    try {
        const perf = await this.findOne({ userId });
        if (!perf || !perf.exams.has(examName)) {
            return null;
        }

        const examData = perf.exams.get(examName);
        const analysis = {
            examName,
            globalStats: examData.globalStats,
            subjects: [],
            topics: [],
            weakTopics: [],
            strongTopics: []
        };

        // Analyze subjects
        for (const [subject, stats] of examData.subjectStats.entries()) {
            const strength = this.calculateStrength(stats);
            analysis.subjects.push({
                name: subject,
                ...stats,
                strength,
                accuracy: stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted * 100).toFixed(2) : 0
            });
        }

        // Analyze topics
        for (const [topic, stats] of examData.topicStats.entries()) {
            const strength = this.calculateStrength(stats);
            const topicData = {
                name: topic,
                ...stats,
                strength,
                accuracy: stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted * 100).toFixed(2) : 0
            };

            analysis.topics.push(topicData);

            // Categorize weak and strong topics
            if (strength !== null) {
                if (strength < 50) {
                    analysis.weakTopics.push(topicData);
                } else if (strength >= 75) {
                    analysis.strongTopics.push(topicData);
                }
            }
        }

        // Sort by strength
        analysis.weakTopics.sort((a, b) => (a.strength || 0) - (b.strength || 0));
        analysis.strongTopics.sort((a, b) => (b.strength || 0) - (a.strength || 0));

        return analysis;

    } catch (err) {
        console.error("Error getting performance analysis:", err);
        throw err;
    }
};

/**
 * Get weak topics for AI-recommended tests
 * @param {ObjectId} userId - User ID
 * @param {string} examName - Exam name
 * @param {number} threshold - Strength threshold (default: 60)
 * @param {number} limit - Maximum number of topics to return
 * @returns {Array} List of weak topics
 */
performanceSchema.statics.getWeakTopics = async function (userId, examName, threshold = 60, limit = 10) {
    try {
        const perf = await this.findOne({ userId });
        if (!perf || !perf.exams.has(examName)) {
            return [];
        }

        const examData = perf.exams.get(examName);
        const weakTopics = [];

        for (const [topic, stats] of examData.topicStats.entries()) {
            const strength = this.calculateStrength(stats);

            // Include topics that are either weak or not attempted yet
            if (strength === null || strength < threshold) {
                weakTopics.push({
                    topic,
                    strength,
                    attempted: stats.totalAttempted,
                    accuracy: stats.totalAttempted > 0 ? (stats.totalCorrect / stats.totalAttempted * 100).toFixed(2) : 0,
                    priority: strength === null ? 'unattempted' : (strength < 40 ? 'high' : 'medium')
                });
            }
        }

        // Sort: unattempted first, then by lowest strength
        weakTopics.sort((a, b) => {
            if (a.strength === null && b.strength !== null) return -1;
            if (a.strength !== null && b.strength === null) return 1;
            return (a.strength || 0) - (b.strength || 0);
        });

        return weakTopics.slice(0, limit);

    } catch (err) {
        console.error("Error getting weak topics:", err);
        throw err;
    }
};

/**
 * Initialize performance for multiple exams
 * @param {ObjectId} userId - User ID
 * @param {Array<string>} examNames - Array of exam names
 */
performanceSchema.statics.initializeMultipleExams = async function (userId, examNames) {
    try {
        const results = [];
        for (const examName of examNames) {
            const result = await this.initializeExamPerformance(userId, examName);
            results.push({ examName, success: !!result });
        }
        return results;
    } catch (err) {
        console.error("Error initializing multiple exams:", err);
        throw err;
    }
};

module.exports = mongoose.model('Performance', performanceSchema);
