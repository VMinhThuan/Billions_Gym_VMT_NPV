const mongoose = require('mongoose');

const PTAssignmentSchema = new mongoose.Schema({
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
    baiTap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaiTap',
        required: true
    },
    ngayGan: {
        type: Date,
        default: Date.now
    },
    hanHoanThanh: {
        type: Date
    },
    trangThai: {
        type: String,
        enum: ['CHUA_HOAN_THANH', 'DANG_THUC_HIEN', 'HOAN_THANH', 'QUA_HAN'],
        default: 'CHUA_HOAN_THANH'
    },
    ghiChu: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'ptassignments'
});

// Index để tối ưu query
PTAssignmentSchema.index({ pt: 1, hoiVien: 1 });
PTAssignmentSchema.index({ hoiVien: 1, trangThai: 1 });
PTAssignmentSchema.index({ pt: 1, trangThai: 1 });

module.exports = mongoose.model('PTAssignment', PTAssignmentSchema);

