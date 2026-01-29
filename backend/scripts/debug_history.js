const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Attempt = require('../models/Attempt');
const User = require('../models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // Fetch all recent attempts (limit 10)
        const attempts = await Attempt.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name email');

        console.log(`🔍 Found ${attempts.length} recent attempts across ALL users:`);

        attempts.forEach(a => {
            console.log('------------------------------------------------');
            console.log(`ID: ${a._id}`);
            console.log(`User: ${a.userId?.name} (${a.userId?._id})`);
            console.log(`ExamType: "${a.examType}"`);
            console.log(`TestType: "${a.testType}"`);
            console.log(`Topic: "${a.topic}"`);
            console.log(`Score: ${a.score}/${a.totalMarks}`);
            console.log(`Created: ${a.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
