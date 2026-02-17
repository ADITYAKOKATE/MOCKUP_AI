const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    examType: {
        type: String,
        required: true
    },
    testType: {
        type: String,
        enum: ['full', 'subject', 'topic', 'revision', 'random', 'ai'],
        default: 'full'
    },
    topic: {
        type: String, // For topic-wise tests
        default: null
    },
    subject: {
        type: String, // For subject-wise tests
        default: null
    },
    testPattern: {
        type: mongoose.Schema.Types.Mixed, // For ad-hoc patterns
        default: null
    },
    questions: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        subject: String,
        section: String,
        questionNumber: Number,
        marksAllocated: Number,
        questionType: String // MCQ, NAT, MSQ
    }],
    responses: {
        type: Map,
        of: new mongoose.Schema({
            answer: mongoose.Schema.Types.Mixed,
            timeTaken: Number,
            marked: Boolean,
            timestamp: Date
        }, { _id: false })
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    duration: Number, // in minutes
    timeRemaining: Number, // in seconds
    status: {
        type: String,
        enum: ['active', 'submitted', 'expired', 'terminated'],
        default: 'active'
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        tabSwitches: {
            type: Number,
            default: 0
        },
        warnings: [String]
    },
    proctoringLogs: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'NO_FACE', 'MULTIPLE_FACES', 'LOOKING_AWAY', 'E_DEVICE_DETECTED', 'LOWER_face_conf', 'HIGH_MOVEMENT', 'TERMINATION_WARNING']
        },
        message: String,
        evidence: String // Optional: URL to captured image or confidence score
    }]
}, { timestamps: true });

// Index for finding active sessions
testSessionSchema.index({ userId: 1, status: 1 });

// Method to check if session is expired
testSessionSchema.methods.isExpired = function () {
    if (this.status !== 'active') return false;
    const now = new Date();
    const expiryTime = new Date(this.startTime.getTime() + this.duration * 60000);
    return now > expiryTime;
};

// Method to calculate time remaining
testSessionSchema.methods.getTimeRemaining = function () {
    if (this.status !== 'active') return 0;
    const now = new Date();
    const expiryTime = new Date(this.startTime.getTime() + this.duration * 60000);
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    return remaining;
};

module.exports = mongoose.model('TestSession', testSessionSchema);
