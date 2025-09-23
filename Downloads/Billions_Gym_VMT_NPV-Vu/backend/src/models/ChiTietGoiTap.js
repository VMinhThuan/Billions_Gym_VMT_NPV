const mongoose = require('mongoose');

const ChiTietGoiTapSchema = new mongoose.Schema({
    maHoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    maGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap', required: true },
    ngayDangKy: { type: Date, required: true, default: Date.now },
    ngayKetThuc: { type: Date, required: true },
    trangThaiThanhToan: { type: String, enum: ['DA_THANH_TOAN', 'CHUA_THANH_TOAN'], default: 'CHUA_THANH_TOAN' },
    isLocked: { type: Boolean, default: false }, // Khóa chỉnh sửa sau khi thanh toán
    maThanhToan: { type: mongoose.Schema.Types.ObjectId, ref: 'ThanhToan' } // Liên kết với thanh toán
});

// Middleware để tự động khóa sau khi thanh toán
ChiTietGoiTapSchema.pre('save', function (next) {
    if (this.isModified('trangThaiThanhToan') && this.trangThaiThanhToan === 'DA_THANH_TOAN') {
        this.isLocked = true;
    }
    next();
});

// Middleware để ngăn chặn chỉnh sửa khi đã khóa
ChiTietGoiTapSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
    if (this.getFilter().isLocked === true || this.getFilter()._id) {
        mongoose.model('ChiTietGoiTap').findOne(this.getFilter()).then(doc => {
            if (doc && doc.isLocked) {
                const error = new Error('Không thể chỉnh sửa đăng ký gói tập đã thanh toán');
                error.code = 'REGISTRATION_LOCKED';
                return next(error);
            }
            next();
        }).catch(next);
    } else {
        next();
    }
});

module.exports = mongoose.model('ChiTietGoiTap', ChiTietGoiTapSchema);