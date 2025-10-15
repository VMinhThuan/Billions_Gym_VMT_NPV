const mongoose = require('mongoose');

const UserNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NguoiDung',
        required: true
    },
    tieuDe: {
        type: String,
        required: true
    },
    noiDung: {
        type: String,
        required: true
    },
    loaiThongBao: {
        type: String,
        enum: ['PAYMENT_SUCCESS', 'PACKAGE_ADDED', 'WORKOUT_REMINDER', 'GENERAL'],
        default: 'GENERAL'
    },
    duLieuLienQuan: {
        goiTapId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap' },
        chiTietGoiTapId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiTietGoiTap' },
        // Có thể thêm các trường khác tùy theo loại thông báo
    },
    daDoc: {
        type: Boolean,
        default: false
    },
    thoiGianDoc: {
        type: Date
    }
}, {
    collection: 'UserNotification',
    timestamps: true
});

// Index để tối ưu query
UserNotificationSchema.index({ userId: 1, daDoc: 1, createdAt: -1 });

module.exports = mongoose.model('UserNotification', UserNotificationSchema);
