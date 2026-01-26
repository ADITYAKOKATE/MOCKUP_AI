const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Performance = require('../models/Performance');
const Attempt = require('../models/Attempt');
const Question = require('../models/Question'); // Assuming Question model exists
const User = require('../models/User');

const normalizeExamName = (name) => {
    if (!name) return name;
    if (name === 'GATE') return 'GATE CS';
    if (name === 'gate-cs') return 'GATE CS';
    if (name === 'jee-main') return 'JEE Main';
    return name;
};

async function recalculate() {
    try {
        console.log('🔌 Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ Connected.');

        // 1. Get Target User
        // User from the issue description JSON
        const targetUserId = '6977c31f94f60719f8822669';

        console.log(`🔍 Processing User: ${targetUserId}`);

        // 2. Fetch all attempts
        const attempts = await Attempt.find({ userId: targetUserId });
        console.log(`Found ${attempts.length} attempts.`);

        // Check for duplicates (same created time within 1 sec?)
        const uniqueAttempts = [];
        const seenTimes = new Set();

        // Simple de-duplication strategy: If attempts created within 2 seconds of each other, keep only one.
        // Or strictly by _id if assuming user manually retook?
        // User said "gave one test". If I see multiple attempts with vastly different times, they are real.
        // If close times, duplicates.

        for (const att of attempts) {
            const timeKey = Math.floor(att.createdAt.getTime() / 2000); // 2-second window
            if (!seenTimes.has(timeKey)) {
                seenTimes.add(timeKey);
                uniqueAttempts.push(att);
            } else {
                console.log(`⚠️  Skipping duplicate attempt (time close): ${att._id}`);
            }
        }

        console.log(`Valid Unique Attempts: ${uniqueAttempts.length}`);

        // 3. Reset Performance for GATE CS
        let perf = await Performance.findOne({ userId: targetUserId });
        if (!perf) {
            perf = await Performance.create({ userId: targetUserId, exams: {} });
        }

        // Wipe GATE CS
        if (perf.exams.has('GATE CS')) {
            console.log('🧹 Clearing existing GATE CS stats...');
            // Re-initialize with empty structure (or just delete and let updatePerformance create?)
            // updatePerformance creates if missing?
            // Actually updatePerformance assumes initialized? No, lines 117-132 init if missing.
            // But it initializes EMPTY.
            // I'll delete the key.
            perf.exams.delete('GATE CS');
            perf.exams.delete('GATE');
            await perf.save(); // Save deletion
            console.log('   Stats wiped. Saving...');
        }

        // 4. Re-process Attempts
        // Need to replicate updatePerformance logic BUT aggregation based.
        // Actually, simpler to just USE the existing updatePerformance function?
        // Yes, but I need to adapt it.
        // Perf model is loaded.

        for (const attempt of uniqueAttempts) {
            let examName = normalizeExamName(attempt.examType); // e.g. "Full Test - GATE" -> we need "GATE CS"
            // Wait, attempt.examType might be "GATE CS Full Test 1".
            // Extract core name.
            if (examName.includes('GATE')) examName = 'GATE CS';
            if (examName.includes('JEE')) examName = 'JEE Main';

            console.log(`🔄 Processing Attempt ${attempt._id} -> ${examName}`);

            // Fetch questions
            const qIds = attempt.questions.map(q => q.questionId);
            const questions = await Question.find({ _id: { $in: qIds } });
            const questionMap = new Map();
            questions.forEach(q => questionMap.set(q._id.toString(), q));

            await Performance.updatePerformance.call(Performance, targetUserId, examName, attempt.questions, questionMap);
        }

        console.log('✅ Recalculation Complete.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

recalculate();
