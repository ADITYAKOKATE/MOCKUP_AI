const Question = require('../models/Question');
const mongoose = require('mongoose');
require('dotenv').config();

const questions = [
    // JEE Main - Physics - MCQ
    {
        question: "A particle is moving in a circle of radius R with constant speed v. The change in velocity in moving from A to B (angle 60 degrees) is:",
        options: ["2v sin(30)", "2v cos(30)", "v sin(60)", "v"],
        correctAnswer: "2v sin(30)",
        type: "MCQ",
        subject: "Physics",
        topic: "Kinematics",
        exam: "JEE Main"
    },
    {
        question: "Two masses m and 2m are attached to a string passing over a frictionless pulley. The acceleration of the system is:",
        options: ["g/3", "g/2", "g", "2g/3"],
        correctAnswer: "g/3",
        type: "MCQ",
        subject: "Physics",
        topic: "Laws of Motion",
        exam: "JEE Main"
    },
    // JEE Main - Chemistry - MCQ
    {
        question: "Which of the following has the highest bond energy?",
        options: ["F-F", "Cl-Cl", "Br-Br", "I-I"],
        correctAnswer: "Cl-Cl",
        type: "MCQ",
        subject: "Chemistry",
        topic: "Chemical Bonding",
        exam: "JEE Main"
    },
    {
        question: "The shape of XeF4 molecule is:",
        options: ["Tetrahedral", "Square Planar", "Pyramidal", "Octahedral"],
        correctAnswer: "Square Planar",
        type: "MCQ",
        subject: "Chemistry",
        topic: "Chemical Bonding",
        exam: "JEE Main"
    },
    // JEE Main - Mathematics - MCQ
    {
        question: "If the sum of n terms of an AP is 3n^2 + 5n, then which term is 164?",
        options: ["26th", "27th", "28th", "None"],
        correctAnswer: "27th",
        type: "MCQ",
        subject: "Mathematics",
        topic: "Sequences and Series",
        exam: "JEE Main"
    },
    {
        question: "The value of lim(x->0) (sin x / x) is:",
        options: ["0", "1", "Infinity", "Undefined"],
        correctAnswer: "1",
        type: "MCQ",
        subject: "Mathematics",
        topic: "Calculus",
        exam: "JEE Main"
    },
    // JEE Main - Physics - NAT (Numerical)
    {
        question: "A force of 10N acts on a body of mass 2kg for 5 seconds. The change in momentum is (in kg m/s):",
        options: [],
        correctAnswer: "50",
        type: "NAT",
        subject: "Physics",
        topic: "Laws of Motion",
        exam: "JEE Main"
    },
    // GATE CS - MCQ
    {
        question: "Which of the following is TRUE?",
        options: ["P=NP", "NP-Complete is subset of P", "P is subset of NP", "None"],
        correctAnswer: "P is subset of NP",
        type: "MCQ",
        subject: "Computer Science",
        topic: "Algorithms",
        exam: "GATE CS"
    },
    {
        question: "The number of tokens in the C statement 'printf(\"i = %d, &i = %x\", i, &i);' is:",
        options: ["3", "10", "11", "12"],
        correctAnswer: "10",
        type: "MCQ",
        subject: "Computer Science",
        topic: "Compiler Design",
        exam: "GATE CS"
    },
    // GATE CS - Aptitude
    {
        question: "Choose the grammatically correct sentence:",
        options: ["Two and two make four", "Two and two makes four", "Two and two made four", "None"],
        correctAnswer: "Two and two make four",
        type: "MCQ",
        subject: "General Aptitude",
        topic: "Verbal",
        exam: "GATE CS"
    },
    // NEET - Biology - MCQ
    {
        question: "The powerhouse of the cell is:",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Body"],
        correctAnswer: "Mitochondria",
        type: "MCQ",
        subject: "Zoology",
        topic: "Cell Biology",
        exam: "NEET"
    },
    {
        question: "Photosynthesis occurs in:",
        options: ["Chloroplast", "Mitochondria", "Ribosome", "Nucleus"],
        correctAnswer: "Chloroplast",
        type: "MCQ",
        subject: "Botany",
        topic: "Plant Physiology",
        exam: "NEET"
    }
];

// Helper to generate many questions
function generateQuestions(baseQuestions, count) {
    const generated = [];
    for (let i = 0; i < count; i++) {
        baseQuestions.forEach(q => {
            generated.push({
                ...q,
                question: `${q.question} (Var ${i + 1})`
            });
        });
    }
    return generated;
}

async function seedQuestions() {
    try {
        const largeSet = generateQuestions(questions, 20); // Generate 20 variants of each = ~240 questions

        await Question.insertMany(largeSet);
        console.log(`✅ Seeded ${largeSet.length} questions successfully`);
    } catch (error) {
        console.error('❌ Error seeding questions:', error);
    }
}

if (require.main === module) {
    mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
        .then(() => {
            console.log('Connected to MongoDB');
            return seedQuestions();
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

module.exports = { seedQuestions };
