const mongoose = require('mongoose');

const sessionReviewSchema = new mongoose.Schema({
    buoiTapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BuoiTap',
        required: true,
        index: true
    },
    hoiVienId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NguoiDung',
        required: true,
        index: true
    },
    checkInRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CheckInRecord',
        required: true
    },
    // Đánh giá PT
    ptRating: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
            validator: function (v) {
                return v === null || (Number.isInteger(v) && v >= 1 && v <= 5);
            },
            message: 'PT rating phải là số nguyên từ 1 đến 5 hoặc null'
        }
    },
    ptComment: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    // Đánh giá chi nhánh (cơ sở vật chất)
    branchRating: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
            validator: function (v) {
                return v === null || (Number.isInteger(v) && v >= 1 && v <= 5);
            },
            message: 'Branch rating phải là số nguyên từ 1 đến 5 hoặc null'
        }
    },
    branchComment: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
    // Trạng thái đánh giá
    isCompleted: {
        type: Boolean,
        default: false
    },
    ngayTao: {
        type: Date,
        default: Date.now
    },
    ngayCapNhat: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index để tối ưu query
sessionReviewSchema.index({ buoiTapId: 1, hoiVienId: 1 }, { unique: true });
sessionReviewSchema.index({ checkInRecordId: 1 });
sessionReviewSchema.index({ hoiVienId: 1, isCompleted: 1 });

// Virtual để populate thông tin
sessionReviewSchema.virtual('buoiTap', {
    ref: 'BuoiTap',
    localField: 'buoiTapId',
    foreignField: '_id',
    justOne: true
});

sessionReviewSchema.virtual('hoiVien', {
    ref: 'NguoiDung',
    localField: 'hoiVienId',
    foreignField: '_id',
    justOne: true
});

sessionReviewSchema.set('toJSON', { virtuals: true });

// Middleware để cập nhật ngayCapNhat
sessionReviewSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.ngayCapNhat = new Date();
    }
    // Tự động đánh dấu completed nếu cả PT và branch đều đã được đánh giá
    if (this.ptRating !== null && this.ptRating !== undefined &&
        this.branchRating !== null && this.branchRating !== undefined) {
        this.isCompleted = true;
    }
    next();
});

module.exports = mongoose.model('SessionReview', sessionReviewSchema);

