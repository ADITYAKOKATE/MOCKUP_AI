const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Attempt = require('../models/Attempt');
const UserProfile = require('../models/UserProfile');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // Simulate Dashboard Logic
        const selectedExam = "JEE Main"; // This is what the controller resolves to
        const attemptQueryRegex = `^${selectedExam}`;

        console.log(`[Simulation] Querying Attempts with regex: ${attemptQueryRegex} (case-insensitive)`);

        const attempts = await Attempt.find({
            examType: { $regex: new RegExp(attemptQueryRegex, 'i') }
        })
            .sort({ createdAt: -1 })
            .limit(5);

        console.log(`[Simulation] Found ${attempts.length} attempts:`);
        attempts.forEach(a => {
            console.log(` - ID: ${a._id}, Exam: "${a.examType}", Type: "${a.testType}", Topic: "${a.topic}"`);
        });

        const topicTestFound = attempts.some(a => a.testType === 'topic-wise');
        if (topicTestFound) {
            console.log("✅ SUCCESS: Topic tests are visible to Dashboard query!");
        } else {
            console.log("❌ FAILURE: Topic tests NOT found in Dashboard query.");
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
