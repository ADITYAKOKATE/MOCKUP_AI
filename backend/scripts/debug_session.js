const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const TestSession = require('../models/TestSession');
const Question = require('../models/Question');
const ExamPattern = require('../models/ExamPattern');

const SESSION_ID = '697b1bf2d64736cc0662160e'; // FROM USER REPORT

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // 1. Fetch Session
        const session = await TestSession.findById(SESSION_ID);
        if (!session) {
            console.error('❌ Session NOT FOUND in DB');
            return;
        }
        console.log('📄 Session Found:', {
            id: session._id,
            testType: session.testType,
            topic: session.topic,
            examType: session.examType,
            questionsCount: session.questions.length,
            hasTestPattern: !!session.testPattern
        });

        // 2. Mock Submit Logic (Copy-Paste from Controller logic to find bug)
        console.log('🔄 Attempting to simulate submission logic...');

        // Pattern logic
        let pattern = await ExamPattern.findOne({ examName: session.examType });
        if (!pattern && session.testType === 'topic') {
            console.log('   ℹ️ Using fallback pattern logic');
            if (session.testPattern) {
                pattern = session.testPattern;
            } else {
                console.log('   ⚠️ Constructing default pattern (Zombie Session Path)');
                pattern = {
                    examName: session.examType,
                    markingScheme: { correct: 4, incorrect: -1 },
                    totalMarks: session.questions.length * 4
                };
            }
            if (!pattern.totalMarks) {
                pattern.totalMarks = session.questions.length * (pattern.markingScheme?.correct || 4);
            }
        }

        if (!pattern) throw new Error("Pattern config missing (Simulated)");
        console.log('   ✅ Pattern Resolved');

        // Questions Logic
        const questionIds = session.questions.map(q => q.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });
        console.log(`   📚 Fetched ${questions.length} questions from DB for ${questionIds.length} session refs`);

        const questionsMap = new Map();
        questions.forEach(q => {
            questionsMap.set(q._id.toString(), q);
        });

        // Calculate Results Logic (Simulating crash point)
        console.log('   🧮 Calculating Results...');
        session.questions.forEach((sq, idx) => {
            const qId = sq.questionId.toString();
            const question = questionsMap.get(qId);

            if (!question) {
                console.error(`   ❌ CRITICAL: Question ${qId} (Index ${idx}) NOT FOUND in DB! This will crash calculateResults.`);
            } else {
                // Determine mistake type is called here usually
                const isCorrect = false; // Mock
                const userAnswer = session.responses?.get(qId)?.answer;
                const timeTaken = session.responses?.get(qId)?.timeTaken || 0;

                // Just testing access
                const x = question.question;
            }
        });

        console.log('   ✅ calculation simulation passed (if no critical errors above)');

    } catch (error) {
        console.error('❌ SIMULATION ERROR:', error);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
    }
};

run();
