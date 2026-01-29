const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const Question = require('../models/Question');

const connectDB = async () => {
    try {
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
        const questions = await Question.find({ isAiGenerated: true }).sort({ createdAt: -1 }).limit(5);

        if (questions.length === 0) {
            console.log('⚠️ No AI generated questions found.');
        } else {
            console.log(`✅ Found ${questions.length} AI generated questions:\n`);
            questions.forEach((q, i) => {
                console.log(`--- Question ${i + 1} ---`);
                console.log(`Topic: ${q.topic}`);
                console.log(`Question: ${q.question}`);
                console.log(`Options: ${q.options.join(', ')}`);
                console.log(`Correct Answer: ${q.correctAnswer}`);
                console.log(`Explanation: ${q.explanation}\n`);
            });
        }
    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
