const mongoose = require('mongoose');

const HangHoiVienSchema = new mongoose.Schema({
    tenHang: {
        type: String,
        required: true,
        unique: true,
        enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
    },
    tenHienThi: {
        type: String,
        required: true
    },
    moTa: {
        type: String,
        required: true
    },
    dieuKienDatHang: {
        soTienTichLuy: { type: Number, required: true }, // Tổng số tiền đã chi
        soThangLienTuc: { type: Number, required: true }, // Số tháng liên tục là hội viên
        soBuoiTapToiThieu: { type: Number, required: true } // Số buổi tập tối thiểu
    },
    quyenLoi: [{
        tenQuyenLoi: { type: String, required: true },
        moTa: { type: String },
        giaTri: { type: Number }, // Giá trị ưu đãi (phần trăm hoặc số tiền)
        loaiQuyenLoi: {
            type: String,
            enum: ['GIAM_GIA', 'TANG_DICH_VU', 'UU_DAI_DAC_BIET', 'QUA_TANG'],
            required: true
        }
    }],
    mauSac: {
        type: String,
        required: true,
        default: '#FFD700' // Màu vàng mặc định
    },
    icon: {
        type: String,
        required: true
    },
    kichHoat: {
        type: Boolean,
        default: true
    },
    thuTu: {
        type: Number,
        required: true,
        unique: true
    } // Thứ tự hiển thị (1 = thấp nhất, 5 = cao nhất)
}, {
    collection: 'hangHoiViens',
    timestamps: true
});

// Index để tìm kiếm nhanh
HangHoiVienSchema.index({ tenHang: 1 });
HangHoiVienSchema.index({ thuTu: 1 });

module.exports = mongoose.model('HangHoiVien', HangHoiVienSchema);
