require('dotenv').config();
const mongoose = require('mongoose');
const Performance = require('./models/Performance');
const User = require('./models/User');

async function checkAdityaUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to MongoDB\n');

        // Find the user by email
        const user = await User.findOne({ email: 'aditya.kokate47@gmail.com' });
        if (!user) {
            console.log('❌ User not found with email: aditya.kokate47@gmail.com');
            process.exit(0);
        }

        console.log('✅ User found:');
        console.log('  ID:', user._id);
        console.log('  Email:', user.email);
        console.log('  Name:', user.name);

        // Find performance for this user
        const perf = await Performance.findOne({ userId: user._id });
        if (!perf) {
            console.log('\n❌ No performance data for this user');
            console.log('   The user needs to complete some tests first');
            process.exit(0);
        }

        console.log('\n✅ Performance data exists!');
        console.log('Available exams:', Array.from(perf.exams.keys()));

        for (const examName of perf.exams.keys()) {
            const examData = perf.exams.get(examName);
            console.log(`\n📊 Exam: "${examName}"`);
            console.log('Subjects:', Array.from(examData.subjectStats.keys()));

            console.log('\nSubject Stats:');
            for (const [subject, stats] of examData.subjectStats.entries()) {
                console.log(`  ${subject}: ${stats.accuracy.toFixed(1)}% accuracy, ${stats.totalAttempted} attempted`);
            }

            console.log('\nWeak Topics (accuracy < 60% or strength < 50):');
            let weakCount = 0;
            for (const [topic, stats] of examData.topicStats.entries()) {
                if (stats.totalAttempted > 0 && (stats.accuracy < 60 || stats.strength < 50)) {
                    weakCount++;
                    if (weakCount <= 5) {
                        console.log(`  ${topic}: ${stats.accuracy.toFixed(1)}% accuracy, ${stats.strength.toFixed(1)} strength`);
                    }
                }
            }
            console.log(`Total weak topics: ${weakCount}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAdityaUser();
