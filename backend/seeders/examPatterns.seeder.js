const ExamPattern = require('../models/ExamPattern');

const examPatterns = [
    {
        examName: 'JEE Main',
        displayName: 'JEE Main (B.E./B.Tech)',
        totalQuestions: 90,
        questionsToAttempt: 75,
        totalMarks: 300,
        duration: 180,
        subjects: [
            {
                name: 'Physics',
                displayName: 'Physics',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 20,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'NAT',
                        count: 10,
                        compulsory: false,
                        attemptAny: 5,
                        marksPerQuestion: 4
                    }
                ]
            },
            {
                name: 'Chemistry',
                displayName: 'Chemistry',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 20,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'NAT',
                        count: 10,
                        compulsory: false,
                        attemptAny: 5,
                        marksPerQuestion: 4
                    }
                ]
            },
            {
                name: 'Mathematics',
                displayName: 'Mathematics',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 20,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'NAT',
                        count: 10,
                        compulsory: false,
                        attemptAny: 5,
                        marksPerQuestion: 4
                    }
                ]
            }
        ],
        negativeMarking: {
            MCQ: -1,
            NAT: 0,
            MSQ: 0
        },
        instructions: [
            'The test consists of 90 questions divided into 3 subjects: Physics, Chemistry, and Mathematics.',
            'Each subject has 30 questions divided into Section A and Section B.',
            'Section A contains 20 MCQs (compulsory).',
            'Section B contains 10 Numerical Answer Type questions (attempt any 5).',
            'Each question carries 4 marks.',
            'For MCQs, 1 mark will be deducted for each incorrect answer.',
            'There is no negative marking for Numerical Answer Type questions.',
            'Total duration: 3 hours (180 minutes).'
        ],
        active: true
    },
    {
        examName: 'GATE CS',
        displayName: 'GATE - Computer Science',
        totalQuestions: 65,
        questionsToAttempt: 65,
        totalMarks: 100,
        duration: 180,
        subjects: [
            {
                name: 'General Aptitude',
                displayName: 'General Aptitude',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 10,
                        compulsory: true,
                        marksPerQuestion: 1.5
                    }
                ]
            },
            {
                name: 'Engineering Mathematics',
                displayName: 'Engineering Mathematics',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 10,
                        compulsory: true,
                        marksPerQuestion: 1.3
                    }
                ]
            },
            {
                name: 'Computer Science',
                displayName: 'Computer Science & IT',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 25,
                        compulsory: true,
                        marksPerQuestion: 1
                    },
                    {
                        name: 'B',
                        type: 'MCQ',
                        count: 20,
                        compulsory: true,
                        marksPerQuestion: 2
                    }
                ]
            }
        ],
        negativeMarking: {
            MCQ: -0.33,
            NAT: 0,
            MSQ: 0
        },
        instructions: [
            'The test consists of 65 questions for a total of 100 marks.',
            'General Aptitude: 10 questions (15 marks).',
            'Engineering Mathematics: 10 questions (13 marks).',
            'Computer Science: 45 questions (72 marks).',
            'Questions are either 1-mark or 2-marks.',
            'For MCQs, 1/3 mark deducted for 1-mark questions and 2/3 mark for 2-mark questions.',
            'No negative marking for NAT questions.',
            'Total duration: 3 hours (180 minutes).'
        ],
        active: true
    },
    {
        examName: 'NEET',
        displayName: 'NEET (UG)',
        totalQuestions: 200,
        questionsToAttempt: 180,
        totalMarks: 720,
        duration: 200,
        subjects: [
            {
                name: 'Physics',
                displayName: 'Physics',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 35,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'MCQ',
                        count: 15,
                        compulsory: false,
                        attemptAny: 10,
                        marksPerQuestion: 4
                    }
                ]
            },
            {
                name: 'Chemistry',
                displayName: 'Chemistry',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 35,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'MCQ',
                        count: 15,
                        compulsory: false,
                        attemptAny: 10,
                        marksPerQuestion: 4
                    }
                ]
            },
            {
                name: 'Botany',
                displayName: 'Botany',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 35,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'MCQ',
                        count: 15,
                        compulsory: false,
                        attemptAny: 10,
                        marksPerQuestion: 4
                    }
                ]
            },
            {
                name: 'Zoology',
                displayName: 'Zoology',
                sections: [
                    {
                        name: 'A',
                        type: 'MCQ',
                        count: 35,
                        compulsory: true,
                        marksPerQuestion: 4
                    },
                    {
                        name: 'B',
                        type: 'MCQ',
                        count: 15,
                        compulsory: false,
                        attemptAny: 10,
                        marksPerQuestion: 4
                    }
                ]
            }
        ],
        negativeMarking: {
            MCQ: -1,
            NAT: 0,
            MSQ: 0
        },
        instructions: [
            'The test consists of 200 questions (attempt 180) for a total of 720 marks.',
            'Each subject has Section A (35 compulsory) and Section B (attempt any 10 out of 15).',
            'Each question carries 4 marks.',
            '1 mark will be deducted for each incorrect answer.',
            'No negative marking for unattempted questions.',
            'Total duration: 3 hours 20 minutes (200 minutes).'
        ],
        active: true
    }
];

async function seedExamPatterns() {
    try {
        // Clear existing patterns
        await ExamPattern.deleteMany({});
        console.log('Cleared existing exam patterns');

        // Insert new patterns
        const result = await ExamPattern.insertMany(examPatterns);
        console.log(`✅ Seeded ${result.length} exam patterns successfully`);

        result.forEach(pattern => {
            console.log(`   - ${pattern.displayName}: ${pattern.totalQuestions} questions, ${pattern.totalMarks} marks`);
        });

        return result;
    } catch (error) {
        console.error('❌ Error seeding exam patterns:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    const mongoose = require('mongoose');
    require('dotenv').config();

    mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
        .then(() => {
            console.log('Connected to MongoDB');
            return seedExamPatterns();
        })
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Seeding failed:', err);
            process.exit(1);
        });
}

module.exports = { seedExamPatterns, examPatterns };
