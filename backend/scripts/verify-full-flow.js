const mongoose = require('mongoose');
const Performance = require('../models/Performance');
const User = require('../models/User');
const Question = require('../models/Question');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exam-mentor';

async function verifyFullFlow() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const testEmail = 'full_flow_test@example.com';

        // Cleanup
        await User.deleteOne({ email: testEmail });

        // Create User
        const user = await User.create({
            email: testEmail,
            password: 'password123'
        });
        console.log(`Created test user: ${user._id}`);

        // Cleanup Performance for this user
        await Performance.deleteOne({ userId: user._id });

        // Initialize Performance
        const examName = 'JEE Main';
        await Performance.initializeExamPerformance(user._id, examName);
        console.log('✅ Initialized Performance schema');

        // Find real questions from database
        const realQuestions = await Question.find({
            exam: { $regex: /JEE Main/i },
            subject: 'Physics',
            topic: { $exists: true }
        }).limit(3);

        if (realQuestions.length === 0) {
            console.log('⚠️  No real questions found in database. Creating mock questions...');

            // Create mock questions
            const mockQ1 = await Question.create({
                question: 'Test Question 1',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                type: 'MCQ',
                subject: 'Physics',
                topic: 'Mechanics',
                difficulty: 'Medium',
                importance: 7,
                exam: 'JEE Main'
            });

            const mockQ2 = await Question.create({
                question: 'Test Question 2',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'B',
                type: 'MCQ',
                subject: 'Physics',
                topic: 'Electromagnetism',
                difficulty: 'High',
                importance: 8,
                exam: 'JEE Main'
            });

            realQuestions.push(mockQ1, mockQ2);
            console.log('✅ Created mock questions');
        }

        console.log(`Found ${realQuestions.length} questions`);

        // Simulate attempt
        const questionMap = new Map();
        const attemptQuestions = [];

        realQuestions.forEach((q, index) => {
            questionMap.set(q._id.toString(), q);

            attemptQuestions.push({
                questionId: q._id,
                isCorrect: index % 2 === 0, // Alternate correct/wrong
                timeTaken: 120 + (index * 30)
            });
        });

        console.log('Updating Performance with attempt data...');
        await Performance.updatePerformance(user._id, examName, attemptQuestions, questionMap);

        // Verify
        const perf = await Performance.findOne({ userId: user._id });
        const examStats = perf.exams.get(examName);

        console.log('\n--- Verification Results ---');
        console.log('Global Stats:', examStats.globalStats);
        console.log('\nSubject Stats:');
        for (const [subject, stats] of examStats.subjectStats.entries()) {
            console.log(`  ${subject}:`, {
                attempted: stats.totalAttempted,
                correct: stats.totalCorrect,
                accuracy: stats.accuracy,
                avgTime: stats.avgTime,
                strength: stats.strength
            });
        }

        console.log('\nTopic Stats:');
        for (const [topic, stats] of examStats.topicStats.entries()) {
            if (stats.totalAttempted > 0) {
                console.log(`  ${topic}:`, {
                    attempted: stats.totalAttempted,
                    correct: stats.totalCorrect,
                    accuracy: stats.accuracy,
                    avgTime: stats.avgTime,
                    strength: stats.strength
                });
            }
        }

        let success = true;

        // Validate
        if (examStats.globalStats.totalAttempted !== realQuestions.length) {
            console.error(`\n❌ FAIL: Expected ${realQuestions.length} attempts, got ${examStats.globalStats.totalAttempted}`);
            success = false;
        }

        // Check that at least one topic has stats
        let hasTopicStats = false;
        for (const [topic, stats] of examStats.topicStats.entries()) {
            if (stats.totalAttempted > 0 && stats.accuracy !== undefined && stats.strength !== undefined) {
                hasTopicStats = true;
                break;
            }
        }

        if (!hasTopicStats) {
            console.error('\n❌ FAIL: No topic stats found with accuracy and strength');
            success = false;
        }

        if (success) {
            console.log('\n✅ FULL FLOW VERIFICATION SUCCESSFUL');
        } else {
            console.error('\n❌ VERIFICATION FAILED');
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        await Performance.deleteOne({ userId: user._id });
        console.log('\nCleanup done.');

        await mongoose.disconnect();

    } catch (err) {
        console.error('Error during verification:', err);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

verifyFullFlow();
