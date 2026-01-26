const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ExamPattern = require('../models/ExamPattern');
const { METADATA, EXAMS } = require('../utils/constants');

// Configuration for Real Exam Patterns

async function seedPatterns() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ Connected');

        // --- GATE CS Pattern ---
        console.log('📋 Configuring GATE CS...');

        // 1. General Aptitude (Fixed 15 marks)
        // 5 Qs x 1 mark, 5 Qs x 2 marks
        const gaSubject = {
            name: "General Aptitude",
            displayName: "General Aptitude",
            sections: [
                { name: "GA-1", type: "MCQ", count: 5, marksPerQuestion: 1 },
                { name: "GA-2", type: "MCQ", count: 5, marksPerQuestion: 2 }
            ]
        };

        // 2. Technical Subjects (85 marks total)
        // Need approx 55 questions total (so 55 tech + 10 GA = 65 total)
        // We have ~13 tech subjects in constants.js
        const techSubjectsList = Object.keys(METADATA['GATE']['CS']).filter(s => s !== 'General Aptitude');

        const techSubjects = techSubjectsList.map((subjName, index) => {
            // Distribute 55 questions among ~13 subjects (~4 per subject)
            // Distribute 85 marks (~6.5 per subject)
            // Pattern: 2 x 1-mark, 2 x 2-mark = 6 marks, 4 Qs per subject
            // 13 subjects * 4 Qs = 52 Qs. Need 3 more to reach 55.
            // We'll add extra questions to the first 3 subjects (usually Core like Algo/DS)

            const isCore = index < 3;
            const countOneMark = isCore ? 3 : 2;
            const countTwoMark = 2; // Keep 2-marks consistent

            return {
                name: subjName,
                displayName: subjName,
                sections: [
                    { name: "Tech-1", type: "MCQ", count: countOneMark, marksPerQuestion: 1 },
                    { name: "Tech-2", type: "MCQ", count: countTwoMark, marksPerQuestion: 2 }
                ]
            };
        });

        const gatePattern = {
            examName: "GATE CS", // Matches startFullTest resolution
            displayName: "GATE Computer Science",
            totalQuestions: 65,
            questionsToAttempt: 65,
            totalMarks: 100,
            duration: 180, // 3 hours
            subjects: [gaSubject, ...techSubjects],
            instructions: [
                "Total Duration: 180 minutes.",
                "Total Marks: 100.",
                "General Aptitude: 15 Marks.",
                "Technical Section: 85 Marks.",
                "Negative Marking: 1/3rd for 1-mark, 2/3rd for 2-mark questions."
            ],
            negativeMarking: { MCQ: -0.33, NAT: 0, MSQ: 0 },
            active: true
        };

        await updatePattern(gatePattern);


        // --- JEE Main Pattern ---
        console.log('📋 Configuring JEE Main...');
        // Physics, Chemistry, Maths
        // Per Subject: 20 MCQ (Sec A), 10 NAT (Sec B, attempt 5) -> We'll just put 10 NAT, usually system handles 'attempt any 5' if supported. 
        // ExamPattern schema has `attemptAny`.

        const jeeSubjectsList = ["Physics", "Chemistry", "Mathematics"]; // Match constants.js keys

        const jeeSubjects = jeeSubjectsList.map(subjName => ({
            name: subjName,
            displayName: subjName,
            sections: [
                {
                    name: "Section A",
                    type: "MCQ",
                    count: 20,
                    marksPerQuestion: 4,
                    compulsory: true
                },
                {
                    name: "Section B",
                    type: "NAT",
                    count: 10,
                    marksPerQuestion: 4,
                    compulsory: false,
                    attemptAny: 5
                }
            ]
        }));

        const jeePattern = {
            examName: "JEE Main",
            displayName: "JEE Main Full Test",
            totalQuestions: 90,
            questionsToAttempt: 75, // 25 per subject
            totalMarks: 300,
            duration: 180,
            subjects: jeeSubjects,
            instructions: [
                "Total Duration: 3 Hours",
                "Total Marks: 300",
                "Each Subject has two sections.",
                "Section A: 20 MCQs (Compulsory).",
                "Section B: 10 Numerical Value Questions (Attempt any 5).",
                "Correct Answer: +4, Incorrect Answer: -1 (for MCQs)."
            ],
            negativeMarking: { MCQ: -1, NAT: 0 }, // Usually NAT has no negative in some years, check latest. 2024 has -1? Keeping 0 for safety or user preference.
            active: true
        };

        await updatePattern(jeePattern);

        console.log('✨ All patterns updated successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error seeding patterns:', err);
        process.exit(1);
    }
}

async function updatePattern(patternData) {
    // Delete existing or Update
    // We prefer findOneAndReplace or delete then create to ensure clean slate
    await ExamPattern.deleteOne({ examName: patternData.examName });
    await ExamPattern.create(patternData);
    console.log(`✅ Updated ${patternData.examName}`);
}

seedPatterns();
