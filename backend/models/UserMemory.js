const mongoose = require('mongoose');

const memoryItemSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    },
    source: {
        type: String,
        default: 'interaction'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const userMemorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    memories: [memoryItemSchema]
}, { timestamps: true });

// Index for performance
userMemorySchema.index({ userId: 1 });

module.exports = mongoose.model('UserMemory', userMemorySchema);
