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
    loaiThoiHan: {
        type: String,
        enum: ['VinhVien', 'TinhTheoNgay'],
        default: 'TinhTheoNgay',
        required: true
    },
    soLuongNguoiThamGia: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
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
