require('dotenv').config();
const mongoose = require('mongoose');
const Performance = require('./models/Performance');
const User = require('./models/User');

async function testExamNameMatching() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to MongoDB\n');

        const user = await User.findOne({ email: 'aditya.kokate47@gmail.com' });
        const performance = await Performance.findOne({ userId: user._id });

        console.log('Testing exam name matching logic:\n');

        const requestedExamName = 'jee-main'; // What frontend sends
        console.log('Frontend sends:', requestedExamName);
        console.log('Database has:', Array.from(performance.exams.keys()));

        // Test the matching logic
        let examStats = null;

        // Try exact match first
        if (performance.exams.has(requestedExamName)) {
            examStats = performance.exams.get(requestedExamName);
            console.log('\n✅ Exact match found');
        } else {
            console.log('\n❌ No exact match, trying normalized matching...');

            // Try to find by normalizing both sides
            const normalizedRequest = requestedExamName.toLowerCase().replace(/[-_]/g, ' ');
            console.log('Normalized request:', normalizedRequest);

            for (const [dbExamName, stats] of performance.exams.entries()) {
                const normalizedDb = dbExamName.toLowerCase().replace(/[-_]/g, ' ');
                console.log(`  Comparing "${normalizedDb}" with "${normalizedRequest}"`);

                if (normalizedDb === normalizedRequest) {
                    examStats = stats;
                    console.log(`  ✅ Match found! DB exam: "${dbExamName}"`);
                    break;
                }
            }
        }

        if (examStats) {
            console.log('\n✅ SUCCESS! Exam data retrieved');
            console.log('Subjects:', Array.from(examStats.subjectStats.keys()));
            console.log('Total topics:', examStats.topicStats.size);
        } else {
            console.log('\n❌ FAILED! No exam data found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testExamNameMatching();
