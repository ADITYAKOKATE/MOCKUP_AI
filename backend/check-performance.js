require('dotenv').config();
const mongoose = require('mongoose');
const Performance = require('./models/Performance');

async function checkPerformanceData() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to MongoDB\n');

        const perf = await Performance.findOne();

        if (!perf) {
            console.log('❌ No performance data found in database');
            process.exit(0);
        }

        console.log('✅ Performance data found!');
        console.log('UserId:', perf.userId);
        console.log('Exams:', Array.from(perf.exams.keys()));

        const examName = Array.from(perf.exams.keys())[0];
        if (examName) {
            const examData = perf.exams.get(examName);
            console.log('\n📊 Exam:', examName);
            console.log('Subjects:', Array.from(examData.subjectStats.keys()));

            console.log('\n📈 Subject Stats:');
            for (const [subject, stats] of examData.subjectStats.entries()) {
                console.log(`  ${subject}:`);
                console.log(`    - Accuracy: ${stats.accuracy.toFixed(1)}%`);
                console.log(`    - Strength: ${stats.strength.toFixed(1)}`);
                console.log(`    - Attempted: ${stats.totalAttempted}`);
            }

            console.log('\n📝 Topic Stats (first 10):');
            let count = 0;
            for (const [topic, stats] of examData.topicStats.entries()) {
                if (count++ >= 10) break;
                console.log(`  ${topic}:`);
                console.log(`    - Accuracy: ${stats.accuracy.toFixed(1)}%`);
                console.log(`    - Strength: ${stats.strength.toFixed(1)}`);
                console.log(`    - Attempted: ${stats.totalAttempted}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkPerformanceData();
