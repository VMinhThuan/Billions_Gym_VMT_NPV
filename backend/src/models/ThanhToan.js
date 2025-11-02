const mongoose = require('mongoose');

const ThanhToanSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    soTien: { type: Number, required: true },
    ngayThanhToan: { type: Date, default: Date.now },
    noiDung: { type: String },
    phuongThuc: { type: String, enum: ['TIEN_MAT', 'CHUYEN_KHOAN', 'THE_TIN_DUNG'], required: true },
    trangThaiThanhToan: { type: String, enum: ['DANG_XU_LY', 'THANH_CONG', 'THAT_BAI'], default: 'DANG_XU_LY' },
    isLocked: { type: Boolean, default: false }, // Khóa chỉnh sửa sau khi hoàn thành
    maChiTietGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiTietGoiTap' } // Liên kết với gói tập
}, { collection: 'thanhToans', timestamps: true });

ThanhToanSchema.pre('save', function (next) {
    if (this.isModified('trangThaiThanhToan') && this.trangThaiThanhToan === 'THANH_CONG') {
        this.isLocked = true;
    }
    next();
});

ThanhToanSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
    const update = this.getUpdate();
    if (this.getFilter().isLocked === true || this.getFilter()._id) {
        // Kiểm tra nếu document đã bị khóa
        mongoose.model('ThanhToan').findOne(this.getFilter()).then(doc => {
            if (doc && doc.isLocked) {
                const error = new Error('Không thể chỉnh sửa thanh toán đã hoàn thành');
                error.code = 'PAYMENT_LOCKED';
                return next(error);
            }
            next();
        }).catch(next);
    } else {
        next();
    }
});

module.exports = mongoose.model('ThanhToan', ThanhToanSchema);