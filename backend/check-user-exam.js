require('dotenv').config();
const mongoose = require('mongoose');
const Performance = require('./models/Performance');
const User = require('./models/User');

async function checkUserAndExam() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to MongoDB\n');

        // Find the user
        const user = await User.findOne();
        if (!user) {
            console.log('No users found');
            process.exit(0);
        }

        console.log('User found:');
        console.log('  ID:', user._id);
        console.log('  Email:', user.email);

        // Find performance for this user
        const perf = await Performance.findOne({ userId: user._id });
        if (!perf) {
            console.log('\n❌ No performance data for this user');
            process.exit(0);
        }

        console.log('\n✅ Performance data exists');
        console.log('Available exams:', Array.from(perf.exams.keys()));
        console.log('\nExact exam names in database:');
        for (const examName of perf.exams.keys()) {
            console.log(`  "${examName}"`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUserAndExam();
