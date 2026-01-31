
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Run this from the backend/ directory
dotenv.config(); // Loads .env from current directory (backend/)

const QuestionSchema = new mongoose.Schema({
    question: String,
    subject: String,
    topic: String,
    exam: String
}, { strict: false });

const Question = mongoose.model('Question', QuestionSchema);

const run = async () => {
    try {
        console.log('Connecting to DB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Check a few random questions to see format
        console.log('\n--- SAMPLE QUESTIONS ---');
        const samples = await Question.find({}).limit(5).select('exam subject topic');
        samples.forEach(q => console.log(JSON.stringify(q, null, 2)));

        // 2. Check specifically for a known subject if possible
        console.log('\n--- ALGORITHMS QUESTIONS (Regex Search) ---');
        const algoSamples = await Question.find({ subject: /Algorithms/i }).limit(5).select('topic subject exam');
        algoSamples.forEach(q => console.log(JSON.stringify(q, null, 2)));

        // 3. Check distinct topics for that subject
        console.log('\n--- DISTINCT TOPICS in DB for Algorithms ---');
        const distinctTopics = await Question.distinct('topic', { subject: /Algorithms/i });
        console.log(distinctTopics);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
