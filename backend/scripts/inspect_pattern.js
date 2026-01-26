const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ExamPattern = require('../models/ExamPattern');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

        console.log('Inspecting ExamPatterns...');
        const patterns = await ExamPattern.find({});

        for (const p of patterns) {
            console.log(`\nExam: ${p.examName} (Active: ${p.active})`);
            console.log(`Subjects: ${p.subjects.length}`);
            p.subjects.forEach((s, i) => {
                console.log(`  ${i + 1}. ${s.name} (${s.sections.length} sections)`);
                s.sections.forEach(sec => {
                    console.log(`      - ${sec.name} (${sec.type}): count ${sec.count}, marks ${sec.marksPerQuestion}`);
                });
            });

            // Check for duplicate subject names
            const names = p.subjects.map(s => s.name);
            const unique = new Set(names);
            if (names.length !== unique.size) {
                console.log('⚠️  DUPLICATE SUBJECTS DETECTED!');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
