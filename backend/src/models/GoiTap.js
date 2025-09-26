const mongoose = require('mongoose');

const GoiTapSchema = new mongoose.Schema({
    tenGoiTap: { type: String, required: true },
    moTa: { type: String },
    donGia: { type: Number, required: true },
    thoiHan: { type: Number, required: true },
    donViThoiHan: {
        type: String,
        enum: ['Ngay', 'Thang', 'Nam'],
        default: 'Ngay',
        required: true
    },
    // Trường mới: Loại thời hạn
    loaiThoiHan: {
        type: String,
        enum: ['VinhVien', 'TinhTheoNgay'],
        default: 'TinhTheoNgay',
        required: true
    },
    // Trường mới: Số lượng người tham gia
    soLuongNguoiThamGia: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    // Trường mới: Loại gói tập
    loaiGoiTap: {
        type: String,
        enum: ['CaNhan', 'Nhom', 'CongTy'],
        default: 'CaNhan',
        required: true
    },
    giaGoc: { type: Number },
    popular: { type: Boolean, default: false },
    hinhAnhDaiDien: { type: String },
    kichHoat: { type: Boolean, default: true },
    ghiChu: { type: String },
}, { collection: 'goiTaps', timestamps: true });

module.exports = mongoose.model('GoiTap', GoiTapSchema);
