const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const SessionPlaylistItemSchema = new Schema({
    session_id: {
        type: Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true
    },
    exercise_id: {
        type: Types.ObjectId,
        ref: 'Exercise',
        required: true,
        index: true
    },
    position: {
        type: Number,
        required: true,
        min: 1
    },
    is_preview: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'session_playlist_items'
});

// Unique constraint: không cho phép 2 item cùng position trong 1 session
SessionPlaylistItemSchema.index({ session_id: 1, position: 1 }, { unique: true });

// Unique constraint: không cho phép exercise trùng trong cùng session
SessionPlaylistItemSchema.index({ session_id: 1, exercise_id: 1 }, { unique: true });

// Index cho query
SessionPlaylistItemSchema.index({ session_id: 1 });
SessionPlaylistItemSchema.index({ exercise_id: 1 });

module.exports = mongoose.model('SessionPlaylistItem', SessionPlaylistItemSchema);

