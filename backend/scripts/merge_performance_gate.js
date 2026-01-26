const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Performance = require('../models/Performance');

async function migrate() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected.');

        const perfs = await Performance.find({});
        console.log(`Found ${perfs.length} performance records.`);

        for (const perf of perfs) {
            if (perf.exams.has('GATE')) {
                console.log(`Migrating GATE data for user ${perf.userId}`);

                const gateData = perf.exams.get('GATE');
                let csData = perf.exams.get('GATE CS');

                if (!csData) {
                    // Just rename
                    perf.exams.set('GATE CS', gateData);
                    perf.exams.delete('GATE');
                    console.log('   Renamed GATE -> GATE CS');
                } else {
                    // Merge logic
                    console.log('   Merging GATE into existing GATE CS...');

                    // 1. Global Stats
                    csData.globalStats.totalAttempted += gateData.globalStats.totalAttempted;
                    csData.globalStats.totalCorrect += gateData.globalStats.totalCorrect;
                    csData.globalStats.totalWrong += gateData.globalStats.totalWrong;
                    csData.globalStats.totalTime += gateData.globalStats.totalTime;

                    if (csData.globalStats.totalAttempted > 0)
                        csData.globalStats.averageAccuracy = (csData.globalStats.totalCorrect / csData.globalStats.totalAttempted) * 100;

                    // 2. Maps Merger
                    const mergeMap = (sourceMap, targetMap) => {
                        for (const [key, sourceVal] of sourceMap.entries()) {
                            if (targetMap.has(key)) {
                                const targetVal = targetMap.get(key);
                                targetVal.totalAttempted += sourceVal.totalAttempted;
                                targetVal.totalCorrect += sourceVal.totalCorrect;
                                targetVal.totalWrong += sourceVal.totalWrong;
                                targetVal.totalUnattempted += sourceVal.totalUnattempted;
                                targetVal.totalTime += sourceVal.totalTime;

                                // Recalc derived
                                if (targetVal.totalAttempted > 0) {
                                    targetVal.accuracy = (targetVal.totalCorrect / targetVal.totalAttempted) * 100;
                                    targetVal.avgTime = targetVal.totalTime / targetVal.totalAttempted;
                                }
                                targetMap.set(key, targetVal);
                            } else {
                                targetMap.set(key, sourceVal);
                            }
                        }
                    };

                    mergeMap(gateData.subjectStats, csData.subjectStats);
                    mergeMap(gateData.topicStats, csData.topicStats);
                    mergeMap(gateData.difficultyStats, csData.difficultyStats);

                    // Question Stats Merger
                    for (const [qId, sourceQ] of gateData.questionStats.entries()) {
                        if (csData.questionStats.has(qId)) {
                            const targetQ = csData.questionStats.get(qId);
                            targetQ.attemptsCount += sourceQ.attemptsCount;

                            const srcDate = new Date(sourceQ.lastAttemptedAt);
                            const tgtDate = new Date(targetQ.lastAttemptedAt);

                            if (srcDate > tgtDate) {
                                targetQ.lastAttemptedAt = sourceQ.lastAttemptedAt;
                                targetQ.lastTimeTaken = sourceQ.lastTimeTaken;
                                targetQ.status = sourceQ.status;
                            }
                            csData.questionStats.set(qId, targetQ);
                        } else {
                            csData.questionStats.set(qId, sourceQ);
                        }
                    }

                    perf.exams.set('GATE CS', csData);
                    perf.exams.delete('GATE');
                    console.log('   Merged successfully.');
                }

                perf.markModified('exams');
                await perf.save();
            }
        }
        console.log('Migration complete.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
