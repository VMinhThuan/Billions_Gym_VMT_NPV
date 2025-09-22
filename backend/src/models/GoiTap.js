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
    giaGoc: { type: Number }, // Giá gốc để hiển thị giảm giá
    popular: { type: Boolean, default: false }, // Gói phổ biến
    hinhAnhDaiDien: { type: String },
    kichHoat: { type: Boolean, default: true },
}, { collection: 'goiTaps', timestamps: true });

module.exports = mongoose.model('GoiTap', GoiTapSchema);
