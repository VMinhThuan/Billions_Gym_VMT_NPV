const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    goiTapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoiTap',
        required: true
    },
    hoiVienId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NguoiDung',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: 'Rating phải là số nguyên từ 1 đến 5'
        }
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    hinhAnh: [{
        type: String, // URL hoặc base64
        validate: {
            validator: function (arr) {
                return arr.length <= 3;
            },
            message: 'Chỉ được tối đa 3 hình ảnh'
        }
    }],
    ngayTao: {
        type: Date,
        default: Date.now
    },
    ngayCapNhat: {
        type: Date,
        default: Date.now
    },
    trangThai: {
        type: String,
        enum: ['active', 'hidden', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index để tối ưu query
reviewSchema.index({ goiTapId: 1, ngayTao: -1 });
reviewSchema.index({ hoiVienId: 1, goiTapId: 1 }, { unique: true });

// Virtual để populate thông tin hội viên
reviewSchema.virtual('hoiVien', {
    ref: 'NguoiDung',
    localField: 'hoiVienId',
    foreignField: '_id',
    justOne: true
});

// Đảm bảo virtual fields được serialize
reviewSchema.set('toJSON', { virtuals: true });

// Middleware để cập nhật ngayCapNhat
reviewSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.ngayCapNhat = new Date();
    }
    next();
});

module.exports = mongoose.model('Review', reviewSchema);
