const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Attempt = require('../models/Attempt');

async function inspectAndFix() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

        const attemptId = '6977c490ea96b648e1da2478'; // From previous log
        const attempt = await Attempt.findById(attemptId);

        console.log(`Attempt ID: ${attempt._id}`);
        console.log(`Questions length: ${attempt.questions.length}`);

        if (attempt.questions.length > 65) {
            console.log('⚠️  Duplicate questions detected!');

            // Deduplicate
            const uniqueQuestions = [];
            const seenIds = new Set();

            for (const q of attempt.questions) {
                const qId = q.questionId.toString();
                if (!seenIds.has(qId)) {
                    seenIds.add(qId);
                    uniqueQuestions.push(q);
                }
            }

            console.log(`Unique Questions: ${uniqueQuestions.length}`);

            if (uniqueQuestions.length < attempt.questions.length) {
                console.log('🛠️  Fixing Attempt document...');
                // Create a temporary clone to bypass mongoose array tracking weirdness if any
                attempt.questions = uniqueQuestions;
                // Also fix top-level stats
                attempt.totalAttempted = uniqueQuestions.filter(q => q.userAnswer).length;
                attempt.totalCorrect = uniqueQuestions.filter(q => q.isCorrect).length;
                attempt.totalWrong = uniqueQuestions.filter(q => q.userAnswer && !q.isCorrect).length;

                await attempt.save();
                console.log('✅ Attempt Fixed.');
            }
        } else {
            console.log('✅ Attempt looks healthy.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectAndFix();
