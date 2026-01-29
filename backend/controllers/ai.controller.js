const Performance = require('../models/Performance');

/**
 * Get AI-powered test recommendations based on user performance
 * Analyzes weak subjects and topics to generate personalized test suggestions
 * Returns mock data if no performance data exists
 */
exports.getAIRecommendations = async (req, res) => {
    try {
        const { examName } = req.query;

        if (!examName) {
            return res.status(400).json({ message: 'Exam name is required' });
        }

        // Get user performance data (only for authenticated user)
        let performance = null;

        if (req.user && req.user.id) {
            performance = await Performance.findOne({ userId: req.user.id });
            console.log('[AI Recommendations] Performance found for user:', !!performance);
            if (performance) {
                console.log('[AI Recommendations] Available exams:', Array.from(performance.exams.keys()));
                console.log('[AI Recommendations] Requested exam:', examName);
            }
        } else {
            console.log('[AI Recommendations] No authenticated user, showing empty data');
        }

        // If no performance data, return empty recommendations
        if (!performance) {
            return res.json({
                practiceTests: [],
                subjectTests: [],
                topicTests: []
            });
        }

        // Normalize exam name to match database format
        // Frontend sends: "jee-main" (lowercase with dash)
        // Database has: "JEE Main" (original case with space)
        let examStats = null;

        // Try exact match first
        if (performance.exams.has(examName)) {
            examStats = performance.exams.get(examName);
        } else {
            // Try to find by normalizing both sides
            const normalizedRequest = examName.toLowerCase().replace(/[-_]/g, ' ');

            for (const [dbExamName, stats] of performance.exams.entries()) {
                const normalizedDb = dbExamName.toLowerCase().replace(/[-_]/g, ' ');
                if (normalizedDb === normalizedRequest) {
                    examStats = stats;
                    console.log('[AI Recommendations] Matched exam:', dbExamName, 'with request:', examName);
                    break;
                }
            }
        }

        if (!examStats) {
            console.log('[AI Recommendations] No exam data found for:', examName);
            return res.json({
                practiceTests: [],
                subjectTests: [],
                topicTests: []
            });
        }

        // Helper function to calculate weakness score (0-100, higher = weaker)
        const calculateWeaknessScore = (stats) => {
            if (stats.totalAttempted === 0) return 50;
            const accuracyFactor = (100 - stats.accuracy) * 0.7;
            const strengthFactor = (100 - stats.strength) * 0.3;
            return Math.round(accuracyFactor + strengthFactor);
        };

        // 1. PRACTICE TESTS - Mixed weak topics
        const practiceTests = [];
        const weakTopics = [];

        for (const [topicName, stats] of examStats.topicStats.entries()) {
            if (stats.totalAttempted > 0 && (stats.accuracy < 60 || stats.strength < 50)) {
                weakTopics.push({
                    name: topicName,
                    accuracy: stats.accuracy,
                    strength: stats.strength,
                    weaknessScore: calculateWeaknessScore(stats),
                    totalAttempted: stats.totalAttempted
                });
            }
        }

        weakTopics.sort((a, b) => b.weaknessScore - a.weaknessScore);

        if (weakTopics.length >= 3) {
            const criticalTopics = weakTopics.slice(0, 3);
            practiceTests.push({
                id: 'practice-critical',
                title: 'Critical Areas Focus',
                description: `High-priority topics with lowest accuracy: ${criticalTopics.map(t => t.name).join(', ')}`,
                topics: criticalTopics.map(t => t.name),
                questionCount: 25,
                estimatedTime: 35,
                difficulty: 'Hard',
                weaknessScore: Math.round(criticalTopics.reduce((sum, t) => sum + t.weaknessScore, 0) / 3),
                gradient: 'from-red-500 to-orange-500'
            });
        }

        if (weakTopics.length >= 5) {
            const generalTopics = weakTopics.slice(0, 5);
            practiceTests.push({
                id: 'practice-general',
                title: 'Weak Topics Mixed Practice',
                description: `Comprehensive practice covering: ${generalTopics.map(t => t.name).join(', ')}`,
                topics: generalTopics.map(t => t.name),
                questionCount: 30,
                estimatedTime: 45,
                difficulty: 'Medium',
                weaknessScore: Math.round(generalTopics.reduce((sum, t) => sum + t.weaknessScore, 0) / 5),
                gradient: 'from-purple-500 to-pink-500'
            });
        }

        // 2. SUBJECT TESTS
        const subjectTests = [];
        const subjectGradients = {
            'Physics': 'from-blue-500 to-cyan-500',
            'Chemistry': 'from-purple-500 to-indigo-500',
            'Mathematics': 'from-pink-500 to-rose-500'
        };

        for (const [subjectName, stats] of examStats.subjectStats.entries()) {
            if (stats.totalAttempted > 0 && stats.accuracy < 70) {
                let weakTopicsCount = 0;
                for (const [topicName, topicStats] of examStats.topicStats.entries()) {
                    if (topicStats.totalAttempted > 0 && topicStats.accuracy < 60) {
                        weakTopicsCount++;
                    }
                }

                subjectTests.push({
                    id: `subject-${subjectName.toLowerCase()}`,
                    subject: subjectName,
                    accuracy: Math.round(stats.accuracy),
                    strength: Math.round(stats.strength),
                    topicsCount: weakTopicsCount || 3,
                    questionCount: 30,
                    estimatedTime: 45,
                    gradient: subjectGradients[subjectName] || 'from-gray-500 to-gray-600'
                });
            }
        }

        subjectTests.sort((a, b) => a.accuracy - b.accuracy);

        // 3. TOPIC TESTS
        const topicTests = [];
        const priorityThresholds = {
            'Critical': 40,
            'High': 55,
            'Medium': 70
        };

        const topicGradients = [
            'from-red-500 to-orange-500',
            'from-orange-500 to-amber-500',
            'from-yellow-500 to-lime-500',
            'from-green-500 to-emerald-500',
            'from-cyan-500 to-blue-500'
        ];

        let gradientIndex = 0;
        for (const [topicName, stats] of examStats.topicStats.entries()) {
            if (stats.totalAttempted > 0 && stats.accuracy < 70) {
                let priority = 'Medium';
                if (stats.accuracy < priorityThresholds.Critical) {
                    priority = 'Critical';
                } else if (stats.accuracy < priorityThresholds.High) {
                    priority = 'High';
                }

                let subject = 'General';
                for (const [subjectName] of examStats.subjectStats.entries()) {
                    subject = subjectName;
                    break;
                }

                topicTests.push({
                    id: `topic-${topicName.toLowerCase().replace(/\s+/g, '-')}`,
                    topic: topicName,
                    subject: subject,
                    accuracy: Math.round(stats.accuracy),
                    strength: Math.round(stats.strength),
                    questionCount: 20,
                    estimatedTime: 25,
                    priority: priority,
                    gradient: topicGradients[gradientIndex % topicGradients.length]
                });

                gradientIndex++;
            }
        }

        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2 };
        topicTests.sort((a, b) => {
            // Primary Sort: Lowest Strength First (User's main request)
            if (a.strength !== b.strength) {
                return a.strength - b.strength;
            }
            // Secondary Sort: Priority
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            // Tertiary Sort: Lowest Accuracy
            return a.accuracy - b.accuracy;
        });

        const recommendations = {
            practiceTests: practiceTests.slice(0, 3),
            subjectTests: subjectTests.slice(0, 3),
            topicTests: topicTests // Return all qualifying topic tests
        };

        res.json(recommendations);

    } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        res.status(500).json({ message: 'Server error while fetching recommendations' });
    }
};

/**
 * Get AI explanation for a specific question
 * POST /api/ai/explain-question
 */
exports.getQuestionExplanation = async (req, res) => {
    try {
        const { question, userAnswer, correctAnswer, staticExplanation, timeTaken } = req.body;

        // Call Python AI Service
        const aiResponse = await fetch('http://127.0.0.1:5001/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                user_answer: userAnswer,
                correct_answer: correctAnswer,
                static_explanation: staticExplanation,
                time_taken: timeTaken
            })
        });

        if (!aiResponse.ok) {
            throw new Error('AI Service unavailable');
        }

        const data = await aiResponse.json();
        res.json(data);

    } catch (error) {
        console.error('Error fetching AI explanation:', error);
        res.status(503).json({
            message: 'AI Service currently unavailable',
            fallback: staticExplanation
        });
    }
};
