const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Performance = require('../models/Performance');
const User = require('../models/User');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected.');

        const perfs = await Performance.find({});
        console.log(`Found ${perfs.length} performance records.`);

        for (const perf of perfs) {
            console.log(`\nUser: ${perf.userId}`);
            console.log('Exams found:', Array.from(perf.exams.keys()));

            if (perf.exams.has('GATE CS')) {
                const data = perf.exams.get('GATE CS');
                console.log('GATE CS Stats:');
                console.log('  Global Attempted:', data.globalStats.totalAttempted);
                console.log('  Subject Stats Count:', data.subjectStats.size);
                console.log('  Subjects:', Array.from(data.subjectStats.keys()));
            }
        }

        // Check Users
        const users = await User.find({});
        for (const u of users) {
            console.log(`\nUser ID: ${u._id}`);
            console.log(`Selected Exam (if any): ${u.selectedExam}`); // If schema has it
            // Or check Profile?
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
