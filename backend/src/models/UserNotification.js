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
        enum: ['PAYMENT_SUCCESS', 'UPGRADE_SUCCESS', 'PACKAGE_ADDED', 'WORKOUT_REMINDER', 'WORKFLOW', 'GENERAL'],
        default: 'GENERAL'
    },
    // Lưu dữ liệu linh hoạt cho từng loại thông báo (registrationId, actionUrl, v.v.)
    duLieuLienQuan: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
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
