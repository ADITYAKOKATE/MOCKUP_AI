const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    testSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestSession'
    },
    examType: {
        type: String,
        required: true
    },
    testType: {
        type: String,
        enum: ['Full', 'Subject', 'Random', 'AI', 'Topic', 'Revision'],
        required: true
    },
    subject: {
        type: String,
        default: null
    },

    // Question-level details
    questions: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        questionText: String,
        options: [String],
        correctAnswer: mongoose.Schema.Types.Mixed,
        userAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        marksAwarded: Number,
        marksAllocated: Number,
        timeTaken: Number,
        marked: Boolean,
        mistakeType: {
            type: String,
            enum: ['Conceptual', 'Speed', 'Guess', 'None', 'Unattempted'],
            default: 'None'
        },
        subject: String,
        topic: String,
        difficulty: String,
        section: String,
        questionType: String // MCQ, NAT, MSQ
    }],

    // Summary statistics
    totalQuestions: {
        type: Number,
        required: true
    },
    totalAttempted: {
        type: Number,
        default: 0
    },
    totalCorrect: {
        type: Number,
        default: 0
    },
    totalWrong: {
        type: Number,
        default: 0
    },
    totalUnattempted: {
        type: Number,
        default: 0
    },
    totalMarked: {
        type: Number,
        default: 0
    },

    // Scoring
    score: {
        type: Number,
        default: 0
    },
    totalMarks: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },

    // Subject-wise breakdown
    subjectWise: {
        type: Map,
        of: new mongoose.Schema({
            attempted: Number,
            correct: Number,
            wrong: Number,
            unattempted: Number,
            score: Number,
            maxScore: Number,
            accuracy: Number,
            timeTaken: Number
        }, { _id: false })
    },

    // Time tracking
    totalTimeTaken: {
        type: Number,
        default: 0
    },
    avgTimePerQuestion: {
        type: Number,
        default: 0
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    submittedAt: Date
}, { timestamps: true });

// Index for efficient queries
attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ examType: 1, testType: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
