const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Performance = require('../models/Performance');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // Look for the user we saw in logs: 697917498b016209a6e84eb3
        // Or just find ANY user with exams
        const perf = await Performance.findOne({ userId: '697917498b016209a6e84eb3' });

        if (!perf) {
            console.log("User not found!");
            return;
        }

        console.log(`Checking Performance for User: ${perf.userId}`);
        const examName = "JEE Main"; // Assuming this is the exam
        if (perf.exams.has(examName)) {
            const stats = perf.exams.get(examName);
            console.log(`Exam: ${examName}`);

            const lowStrengthTopics = [];
            const allStrengths = [];

            for (const [topic, tStats] of stats.topicStats.entries()) {
                allStrengths.push(tStats.strength);
                if (tStats.strength < 60) { // Check slightly higher than 50 to see "near misses"
                    lowStrengthTopics.push({ topic, strength: tStats.strength, accuracy: tStats.accuracy, attempted: tStats.totalAttempted });
                }
            }

            console.log(`Total Topics: ${stats.topicStats.size}`);
            console.log(`Min Strength: ${Math.min(...allStrengths)}`);
            console.log(`Max Strength: ${Math.max(...allStrengths)}`);
            console.log(`Topics < 60 Strength:`);
            console.table(lowStrengthTopics);

        } else {
            console.log(`Exam ${examName} not found.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
