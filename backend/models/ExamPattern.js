const mongoose = require('mongoose');

const examPatternSchema = new mongoose.Schema({
    examName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    displayName: {
        type: String,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    questionsToAttempt: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    subjects: [{
        name: {
            type: String,
            required: true
        },
        displayName: String,
        sections: [{
            name: String, // 'A', 'B', etc.
            type: {
                type: String,
                enum: ['MCQ', 'NAT', 'MSQ'],
                default: 'MCQ'
            },
            count: Number,
            compulsory: {
                type: Boolean,
                default: true
            },
            attemptAny: Number, // For optional sections
            marksPerQuestion: Number
        }]
    }],
    negativeMarking: {
        MCQ: {
            type: Number,
            default: -1
        },
        NAT: {
            type: Number,
            default: 0
        },
        MSQ: {
            type: Number,
            default: 0
        }
    },
    instructions: [String],
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ExamPattern', examPatternSchema);
