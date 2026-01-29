const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Question = require('../models/Question');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // Simulate Controller Logic EXACTLY
        const topic = "Aldehydes Ketones And Carboxylic Acids";
        const examType = "jee-main";

        const cleanTopic = topic.trim();
        const topicRegex = new RegExp(`^${cleanTopic}$`, 'i');
        const examRegex = new RegExp(`^${examType.replace(/-/g, '[ -]')}$`, 'i');

        console.log(`\n[Simulation] Regex Source:`);
        console.log(`Topic Source: ${topicRegex.source}`);
        console.log(`Exam Source: ${examRegex.source}`);

        console.log(`\n[Simulation] Running Question.find with regex objects...`);
        const q1 = await Question.find({
            topic: { $regex: topicRegex },
            exam: { $regex: examRegex }
        }).limit(2);
        console.log(`Result (Regex Objects): Found ${q1.length}`);

        console.log(`\n[Simulation] Running Question.find with .source string...`);
        const q2 = await Question.find({
            topic: { $regex: topicRegex.source, $options: 'i' },
            exam: { $regex: examRegex.source, $options: 'i' }
        }).limit(2);
        console.log(`Result (Regex Strings): Found ${q2.length}`);


    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
