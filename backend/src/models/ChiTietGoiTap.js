const mongoose = require('mongoose');

const ChiTietGoiTapSchema = new mongoose.Schema({
    maHoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    maGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap', required: true },
    ngayDangKy: { type: Date, required: true, default: Date.now },
    ngayBatDau: { type: Date, required: true }, // Ngày bắt đầu sử dụng gói tập
    ngayKetThuc: { type: Date, required: true },
    trangThaiThanhToan: { type: String, enum: ['DA_THANH_TOAN', 'CHUA_THANH_TOAN'], default: 'CHUA_THANH_TOAN' },
    isLocked: { type: Boolean, default: false }, // Khóa chỉnh sửa sau khi thanh toán
    maThanhToan: { type: mongoose.Schema.Types.ObjectId, ref: 'ThanhToan' }, // Liên kết với thanh toán
    
    // Thêm các trường mới cho workflow
    trangThaiDangKy: { 
        type: String, 
        enum: ['CHO_CHON_PT', 'DA_CHON_PT', 'DA_TAO_LICH', 'HOAN_THANH'], 
        default: 'CHO_CHON_PT' 
    },
    ptDuocChon: { type: mongoose.Schema.Types.ObjectId, ref: 'PT' },
    ngayChonPT: { type: Date },
    lichTapDuocTao: { type: mongoose.Schema.Types.ObjectId, ref: 'LichTap' },
    soNgayTapTrongTuan: { type: Number, default: 3 }, // Số ngày tập trong tuần
    gioTapUuTien: [{ type: String }], // Các khung giờ ưu tiên của khách hàng
    ghiChuYeuCau: { type: String } // Ghi chú yêu cầu đặc biệt của khách hàng
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