const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Performance = require('../models/Performance');
const { getExamStructure, METADATA } = require('../utils/constants');

async function debugTopics() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

        // User ID from previous context
        const userId = '6977c31f94f60719f8822669';

        const perf = await Performance.findOne({ userId });
        if (!perf) {
            console.log('No performance found');
            process.exit(0);
        }

        const examName = 'GATE CS';
        const examData = perf.exams.get(examName);

        if (!examData) {
            console.log(`No data for ${examName}`);
            process.exit(0);
        }

        console.log(`\n--- Inspecting Topics for ${examName} ---`);
        const dbTopics = Array.from(examData.topicStats.keys());
        console.log(`Total Topics in DB: ${dbTopics.length}`);

        // Build Map
        const structure = getExamStructure(examName);
        const topicToSubject = {};
        const normalizedMap = {}; // Lowercase -> Subject

        if (structure) {
            for (const [subject, topics] of Object.entries(structure)) {
                if (Array.isArray(topics)) {
                    topics.forEach(t => {
                        topicToSubject[t] = subject;
                        normalizedMap[t.toLowerCase()] = subject;
                    });
                }
            }
        }

        let mappedCount = 0;
        let unmappedCount = 0;

        const subjectCounts = {};

        console.log('\n--- Mapped Breakdown ---');
        for (const t of dbTopics) {
            if (topicToSubject[t]) {
                mappedCount++;
                const subj = topicToSubject[t];
                subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
                // console.log(`'${t}' -> '${subj}'`);
            } else {
                unmappedCount++;
                console.log(`❌ '${t}' -> Not found`);
            }
        }

        console.log('\n--- Subject Distribution ---');
        Object.entries(subjectCounts).forEach(([subj, count]) => {
            console.log(`${subj}: ${count} topics`);
        });

        console.log(`\nSummary:`);
        console.log(`Mapped: ${mappedCount}`);
        console.log(`Unmapped: ${unmappedCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugTopics();
