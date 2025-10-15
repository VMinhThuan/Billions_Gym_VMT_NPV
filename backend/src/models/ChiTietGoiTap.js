const mongoose = require('mongoose');

const ChiTietGoiTapSchema = new mongoose.Schema({
    // Legacy fields (giữ để tương thích)
    maHoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien' },
    maGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap' },

    // New fields for payment system
    goiTapId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap', required: true },
    nguoiDungId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
    thoiGianDangKy: { type: Date, default: Date.now },
    ngayBatDau: { type: Date }, // Ngày bắt đầu sử dụng gói tập
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiNhanh' }, // Chi nhánh được chọn

    // Payment information
    trangThaiThanhToan: {
        type: String,
        enum: ['CHO_THANH_TOAN', 'DA_THANH_TOAN', 'THANH_TOAN_THAT_BAI'],
        default: 'CHO_THANH_TOAN'
    },
    thongTinThanhToan: {
        phuongThuc: { type: String, enum: ['momo', 'zalopay'] },
        orderId: { type: String },
        app_trans_id: { type: String }, // For ZaloPay
        amount: { type: Number },
        requestId: { type: String }, // For MoMo
        paymentUrl: { type: String },
        ketQuaThanhToan: { type: mongoose.Schema.Types.Mixed }
    },
    thongTinKhachHang: {
        firstName: { type: String },
        lastName: { type: String },
        phone: { type: String },
        email: { type: String },
        partnerPhone: { type: String }, // For 2-person packages
        partnerInfo: { type: mongoose.Schema.Types.Mixed }
    },
    thoiGianCapNhat: { type: Date, default: Date.now },

    // Legacy fields (giữ để tương thích)
    ngayDangKy: { type: Date, default: Date.now },
    ngayKetThuc: { type: Date },
    isLocked: { type: Boolean, default: false }, // Khóa chỉnh sửa sau khi thanh toán
    maThanhToan: { type: mongoose.Schema.Types.ObjectId, ref: 'ThanhToan' }, // Liên kết với thanh toán

    // Thêm các trường mới cho workflow
    trangThaiDangKy: {
        type: String,
        enum: ['CHO_CHON_PT', 'DA_CHON_PT', 'DA_TAO_LICH', 'HOAN_THANH', 'DA_NANG_CAP'],
        default: 'CHO_CHON_PT'
    },
    ptDuocChon: { type: mongoose.Schema.Types.ObjectId, ref: 'PT' },
    ngayChonPT: { type: Date },
    lichTapDuocTao: { type: mongoose.Schema.Types.ObjectId, ref: 'LichTap' },
    soNgayTapTrongTuan: { type: Number, default: 3 }, // Số ngày tập trong tuần
    gioTapUuTien: [{ type: String }], // Các khung giờ ưu tiên của khách hàng
    ghiChuYeuCau: { type: String }, // Ghi chú yêu cầu đặc biệt của khách hàng

    // Các trường cho việc nâng cấp gói tập
    giaGoiTapGoc: { type: Number }, // Giá gốc của gói tập
    soTienBu: { type: Number, default: 0 }, // Số tiền bù cho trường hợp nâng cấp
    isUpgrade: { type: Boolean, default: false }, // Đánh dấu có phải gói nâng cấp không
    ghiChu: { type: String }, // Ghi chú chung
    trangThaiSuDung: {
        type: String,
        enum: ['DANG_HOAT_DONG', 'TAM_DUNG', 'HET_HAN', 'DA_HUY', 'DANG_SU_DUNG', 'CHO_CHON_PT', 'DANG_KICH_HOAT', 'DA_NANG_CAP'],
        default: 'CHO_CHON_PT'
    },
    ngayTamDung: { type: Date }, // Ngày tạm dừng
    lyDoTamDung: { type: String }, // Lý do tạm dừng
    soTienThanhToan: { type: Number, required: true } // Số tiền thực tế đã thanh toán
});

// Middleware để tự động khóa sau khi thanh toán
ChiTietGoiTapSchema.pre('save', function (next) {
    if (this.isModified('trangThaiThanhToan') && this.trangThaiThanhToan === 'DA_THANH_TOAN') {
        this.isLocked = true;
    }
    next();
});

// Middleware để ngăn chặn chỉnh sửa khi đã khóa - TẠM THỜI DISABLE
// ChiTietGoiTapSchema.pre(['updateOne', 'findOneAndUpdate', 'update', 'updateMany'], function (next) {
//     // Chỉ chặn khi thực sự cần update, không chặn khi find
//     if (this.getFilter().isLocked === true || this.getFilter()._id) {
//         mongoose.model('ChiTietGoiTap').findOne(this.getFilter()).then(doc => {
//             if (doc && doc.isLocked) {
//                 const error = new Error('Không thể chỉnh sửa đăng ký gói tập đã thanh toán');
//                 error.code = 'REGISTRATION_LOCKED';
//                 return next(error);
//             }
//             next();
//         }).catch(next);
//     } else {
//         next();
//     }
// });

module.exports = mongoose.model('ChiTietGoiTap', ChiTietGoiTapSchema);