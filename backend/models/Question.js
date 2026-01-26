const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    image: {
        type: String, // Cloudinary URL
        default: null
    },
    options: [{
        type: String, // Allows holding text for options
        required: true
    }],
    correctAnswer: {
        type: String, // Can be option index/value or NAT numeric string
        required: true
    },
    explanation: {
        type: String, // Detailed solution/explanation
        default: null
    },
    type: {
        type: String,
        enum: ['MCQ', 'NAT', 'MSQ'],
        default: 'MCQ'
    },
    branch: {
        type: String,
        required: false, // Optional for Non-GATE exams
        uppercase: true
    },
    subject: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    year: {
        type: Number, // Exam Year e.g., 2024
        default: null
    },
    difficulty: {
        type: String,
        enum: ['Low', 'Medium', 'High', null],
        default: null
    },
    importance: {
        type: Number,
        min: 1,
        max: 10,
        default: null
    },
    exam: {
        type: String, // e.g., 'GATE CSE', 'JEE Main'
        required: true
    }
});

// Index for efficient random selection and filtering
questionSchema.index({ exam: 1, branch: 1, subject: 1, topic: 1 });

module.exports = mongoose.model('Question', questionSchema);
