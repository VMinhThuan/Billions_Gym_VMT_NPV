const mongoose = require('mongoose');

const PTNoteSchema = new mongoose.Schema({
    pt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PT',
        required: true
    },
    hoiVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HoiVien',
        required: true
    },
    noiDung: {
        type: String,
        required: true
    },
    ngayTao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'ptnotes'
});

// Index để tối ưu query
PTNoteSchema.index({ pt: 1, hoiVien: 1 });
PTNoteSchema.index({ hoiVien: 1, ngayTao: -1 });

module.exports = mongoose.model('PTNote', PTNoteSchema);

