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

        const perfs = await Performance.find({});
        console.log(`Found ${perfs.length} performance records to update.`);

        for (const perf of perfs) {
            let modified = false;
            if (perf.exams) {
                for (const [examName, examData] of perf.exams.entries()) {

                    // Update Topic Stats
                    if (examData.topicStats) {
                        for (const [topic, stats] of examData.topicStats.entries()) {
                            // If strength is null OR (strength is 0 AND attempts is 0) -> Set to 100
                            if (stats.strength === null || stats.strength === undefined || (stats.strength === 0 && stats.totalAttempted === 0)) {
                                stats.strength = 100;
                                examData.topicStats.set(topic, stats); // Re-set to ensure map update
                                modified = true;
                            }
                        }
                    }

                    // Update Subject Stats
                    if (examData.subjectStats) {
                        for (const [subject, stats] of examData.subjectStats.entries()) {
                            if (stats.strength === null || stats.strength === undefined || (stats.strength === 0 && stats.totalAttempted === 0)) {
                                stats.strength = 100;
                                examData.subjectStats.set(subject, stats);
                                modified = true;
                            }
                        }
                    }
                    perf.exams.set(examName, examData);
                }
            }
            if (modified) {
                perf.markModified('exams');
                await perf.save();
                console.log(`Updated initial strength to 100 for user: ${perf.userId}`);
            }
        }

        console.log("✅ Migration Complete: All unattempted topics set to Strength 100.");

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
