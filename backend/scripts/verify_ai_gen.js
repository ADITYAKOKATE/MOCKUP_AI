const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Performance = require('../models/Performance');
const QuestionGenerator = require('../services/QuestionGenerator');

const connectDB = async () => {
    try {
        // console.log('Connecting to URI:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ DB Error:', err.message);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    try {
        // 1. Get a user
        const user = await User.findOne({});
        if (!user) {
            console.error('❌ No user found in DB');
            process.exit(1);
        }
        console.log(`👤 Using User: ${user.name || 'Unknown'} (${user._id})`);

        // 2. Ensure Performance Record Exists and has WEAK topics
        let perf = await Performance.findOne({ userId: user._id });
        const examName = 'JEE Main';

        if (!perf) {
            console.log('⚠️ No performance record found. Seeding mock data for verification...');
            // Initialize
            await Performance.initializeExamPerformance(user._id, examName, user.name || 'Test User');
            perf = await Performance.findOne({ userId: user._id });
        }

        // Force a topic to be "weak"
        const examData = perf.exams.get(examName);
        if (examData) {
            // Pick the first topic from topicStats
            const topics = Array.from(examData.topicStats.keys());
            if (topics.length > 0) {
                const weakTopic = topics[0];
                console.log(`📉 Setting topic "${weakTopic}" as WEAK (Strength: 20%) for testing...`);

                const stats = examData.topicStats.get(weakTopic);
                stats.totalAttempted = 10;
                stats.totalCorrect = 2; // 20% accuracy
                stats.strength = 20;

                examData.topicStats.set(weakTopic, stats);
                perf.markModified('exams');
                await perf.save();
                console.log('✅ Mock data saved.');
            }
        }

        console.log(`🚀 Triggering Remedial Generation for ${examName}...`);
        await QuestionGenerator.generateRemedialQuestions(user._id, examName);

        console.log('✅ Verification Script Completed');
    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
