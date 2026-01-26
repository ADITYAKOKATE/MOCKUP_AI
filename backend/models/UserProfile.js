const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    exams: [{
        examType: {
            type: String,
            required: true,
            trim: true
        },
        branch: {
            type: String,
            trim: true
        }
    }],
    profileImage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);
