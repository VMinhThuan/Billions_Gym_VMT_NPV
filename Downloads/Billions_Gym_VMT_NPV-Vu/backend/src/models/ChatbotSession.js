const mongoose = require('mongoose');

const ChatbotSessionSchema = new mongoose.Schema({
    hoiVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HoiVien',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [{
        type: {
            type: String,
            enum: ['user', 'bot'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        context: {
            type: String,
            enum: ['nutrition', 'workout', 'membership', 'general', 'booking', 'feedback'],
            default: 'general'
        },
        intent: {
            type: String,
            default: null
        },
        entities: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }],
    currentContext: {
        type: String,
        enum: ['nutrition', 'workout', 'membership', 'general', 'booking', 'feedback'],
        default: 'general'
    },
    userProfile: {
        mucTieu: String,
        hoatDongTap: String,
        canNang: Number,
        chieuCao: Number,
        gioiTinh: String,
        tuoi: Number
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better performance
ChatbotSessionSchema.index({ hoiVien: 1, isActive: 1 });
ChatbotSessionSchema.index({ sessionId: 1 });
ChatbotSessionSchema.index({ lastActivity: 1 });

module.exports = mongoose.model('ChatbotSession', ChatbotSessionSchema);
