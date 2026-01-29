const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Performance = require('../models/Performance');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        // Target the user from the logs
        const userId = '6977c31f94f60719f8822669';
        const perf = await Performance.findOne({ userId: userId });

        if (!perf) {
            console.log("User not found!");
            return;
        }

        console.log(`Checking Performance for User: ${perf.userId}`);
        const examName = "JEE Main";
        if (perf.exams.has(examName)) {
            const stats = perf.exams.get(examName);

            // Log specific topics from the screenshot
            const topicsToCheck = [
                "Chemical Bonding And Molecular Structure",
                "Chemical Kinetics And Nuclear Chemistry",
                "Compounds Containing Nitrogen"
            ];

            console.log("--- Targeted Topics ---");
            for (const t of topicsToCheck) {
                const s = stats.topicStats.get(t);
                if (s) {
                    console.log(`Topic: ${t}`);
                    console.log(`  Strength: ${s.strength}`);
                    console.log(`  Accuracy: ${s.accuracy}`);
                    console.log(`  Attempts: ${s.totalAttempted}`);
                    console.log(`  Correct: ${s.totalCorrect}`);
                } else {
                    console.log(`Topic: ${t} - NOT FOUND`);
                }
            }

            // Log ANY topics < 50
            console.log("\n--- Topics < 50 Strength ---");
            for (const [topic, tStats] of stats.topicStats.entries()) {
                if (tStats.strength < 50) {
                    console.log(`${topic}: Strength ${tStats.strength} (Attempts: ${tStats.totalAttempted})`);
                }
            }
            console.log("\n--- Topics 50-70 Strength ---");
            for (const [topic, tStats] of stats.topicStats.entries()) {
                if (tStats.strength >= 50 && tStats.strength < 70) {
                    console.log(`${topic}: Strength ${tStats.strength} (Attempts: ${tStats.totalAttempted})`);
                }
            }

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
