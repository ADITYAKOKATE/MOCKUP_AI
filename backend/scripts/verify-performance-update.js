const mongoose = require('mongoose');
const Performance = require('../models/Performance');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exam-mentor';

async function verifyPerformanceUpdate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const testEmail = 'perf_test_user@example.com';

        // Cleanup
        await User.deleteOne({ email: testEmail });
        await Performance.deleteOne({ userId: { $exists: false } }); // Safe cleanup? No, let's look up user first.

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
        console.log('Initialized Performance');

        // Mock Questions and Attempt
        // We need a map for questions as expected by updatePerformance
        const questionMap = new Map();

        const q1Id = new mongoose.Types.ObjectId();
        const q2Id = new mongoose.Types.ObjectId();

        questionMap.set(q1Id.toString(), {
            _id: q1Id,
            subject: 'Physics',
            topic: 'Mechanics',
            difficulty: 'Medium',
            importance: 'High'
        });

        questionMap.set(q2Id.toString(), {
            _id: q2Id,
            subject: 'Physics',
            topic: 'Mechanics',
            difficulty: 'Hard',
            importance: 'Medium'
        });

        const attemptQuestions = [
            {
                questionId: q1Id,
                isCorrect: true,
                timeTaken: 120,
                userAnswer: 'A'  // Add userAnswer to mark as attempted
            },
            {
                questionId: q2Id,
                isCorrect: false,
                timeTaken: 180,
                userAnswer: 'B'  // Add userAnswer to mark as attempted
            }
        ];

        console.log('Updating Performance...');
        await Performance.updatePerformance(user._id, examName, attemptQuestions, questionMap);

        // Verify
        const perf = await Performance.findOne({ userId: user._id });
        const examStats = perf.exams.get(examName);

        const mechanicsStats = examStats.topicStats.get('Mechanics');
        const physicsStats = examStats.subjectStats.get('Physics');

        console.log('\n--- Verification Results ---');
        console.log('Mechanics Stats:', mechanicsStats);
        console.log('Physics Stats:', physicsStats);

        let success = true;

        // Check Mechanics
        // Total: 2, Correct: 1, Wrong: 1, Time: 300, Acc: 50, AvgTime: 150
        if (mechanicsStats.totalAttempted !== 2) { console.error('FAIL: Mechanics totalAttempted mismatch'); success = false; }
        if (mechanicsStats.totalCorrect !== 1) { console.error('FAIL: Mechanics totalCorrect mismatch'); success = false; }
        if (mechanicsStats.accuracy !== 50) { console.error(`FAIL: Mechanics accuracy mismatch. Expected 50, got ${mechanicsStats.accuracy}`); success = false; }
        if (mechanicsStats.avgTime !== 150) { console.error(`FAIL: Mechanics avgTime mismatch. Expected 150, got ${mechanicsStats.avgTime}`); success = false; }
        if (mechanicsStats.strength === undefined || mechanicsStats.strength === null) { console.error('FAIL: Mechanics strength missing'); success = false; }

        if (success) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: All stats updated correctly.');
        } else {
            console.error('\n❌ VERIFICATION FAILED');
        }

        // Cleanup
        await User.deleteOne({ _id: user._id });
        await Performance.deleteOne({ userId: user._id });
        console.log('Cleanup done.');

        await mongoose.disconnect();

    } catch (err) {
        console.error('Error during verification:', err);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

verifyPerformanceUpdate();
