const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderModel',
        required: true
    },
    senderModel: {
        type: String,
        enum: ['PT', 'HoiVien'],
        required: true
    },
    message: {
        type: String
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true,
    collection: 'chatmessages'
});

// Index để tối ưu query
ChatMessageSchema.index({ room: 1, createdAt: -1 });
ChatMessageSchema.index({ sender: 1, createdAt: -1 });
ChatMessageSchema.index({ isRead: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);

