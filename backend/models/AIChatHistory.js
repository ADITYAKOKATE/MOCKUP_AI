const mongoose = require('mongoose');

const aiChatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    emotion: {
        type: String,
        default: 'neutral'
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient retrieval of recent history
aiChatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIChatHistory', aiChatHistorySchema);
