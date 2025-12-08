const mongoose = require('mongoose');

const PTCheckInRecordSchema = new mongoose.Schema({
    pt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PT',
        required: true,
        index: true
    },
    buoiTap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BuoiTap',
        required: true,
        index: true
    },
    checkInTime: {
        type: Date,
        required: true,
        index: true
    },
    checkOutTime: {
        type: Date,
        default: null
    },
    checkInStatus: {
        type: String,
        enum: ['DUNG_GIO', 'SOM', 'MUON'],
        required: true
    },
    checkOutStatus: {
        type: String,
        enum: ['DUNG_GIO', 'SOM', 'CHUA_CHECKOUT'],
        default: 'CHUA_CHECKOUT'
    },
    thoiGianMuonCheckIn: {
        type: Number, // Minutes late for check-in (sẽ bị trừ lương)
        default: 0
    },
    thoiGianSomCheckOut: {
        type: Number, // Minutes early for check-out (không được phép)
        default: 0
    },
    sessionDuration: {
        type: Number, // Duration in minutes
        default: null
    },
    anhCheckIn: {
        type: String, // Base64 encoded image or URL
        default: null
    },
    anhCheckOut: {
        type: String, // Base64 encoded image or URL
        default: null
    },
    tienLuong: {
        type: Number, // Số tiền lương cho buổi tập này (sau khi trừ phạt nếu có)
        default: 0
    },
    tienPhat: {
        type: Number, // Số tiền bị phạt do đi muộn
        default: 0
    },
    ghiChu: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for better query performance
PTCheckInRecordSchema.index({ pt: 1, checkInTime: -1 });
PTCheckInRecordSchema.index({ buoiTap: 1, pt: 1 });
PTCheckInRecordSchema.index({ checkInTime: -1 });

// Method to calculate session duration
PTCheckInRecordSchema.methods.calculateDuration = function () {
    if (!this.checkOutTime || !this.checkInTime) {
        return null;
    }
    const diffMs = this.checkOutTime - this.checkInTime;
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
};

// Pre-save hook to calculate duration
PTCheckInRecordSchema.pre('save', function (next) {
    if (this.checkOutTime && this.checkInTime) {
        this.sessionDuration = this.calculateDuration();
    }
    next();
});

// Static method to find today's check-in records
PTCheckInRecordSchema.statics.findTodayRecords = function (ptId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.find({
        pt: ptId,
        checkInTime: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).populate('buoiTap').sort({ checkInTime: -1 });
};

module.exports = mongoose.model('PTCheckInRecord', PTCheckInRecordSchema);

