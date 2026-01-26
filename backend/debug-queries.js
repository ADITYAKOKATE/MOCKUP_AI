const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function inspectData() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to MongoDB');

        // 1. Check distinct values
        const exams = await Question.distinct('exam');
        const subjects = await Question.distinct('subject');

        console.log('\n--- Distinct Values ---');
        console.log('Exams found in DB:', exams);
        console.log('Subjects found in DB:', subjects);

        // 2. Sample a few questions
        const sampleQuestions = await Question.find().limit(3).select('exam subject type topic');
        console.log('\n--- Sample Questions ---');
        console.log(JSON.stringify(sampleQuestions, null, 2));

        // 3. Test the Controller Logic Simulation
        console.log('\n--- Simulation Matches ---');
        const examTypeToTest = "JEE Main"; // Change as needed based on user input (e.g., 'jee-main')
        const subjectToTest = "Physics";

        const query = {
            exam: { $regex: new RegExp(examTypeToTest, 'i') },
            subject: { $regex: new RegExp(subjectToTest, 'i') },
            type: "MCQ" // Assuming MCQ for test
        };

        console.log(`Testing Query:`, JSON.stringify(query));
        const count = await Question.countDocuments(query);
        console.log(`Matched Documents: ${count}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

inspectData();
