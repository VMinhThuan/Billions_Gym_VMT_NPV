const mongoose = require('mongoose');

const ChiTietGoiTapSchema = new mongoose.Schema({
    maHoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    maGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap', required: true },
    ngayDangKy: { type: Date, required: true, default: Date.now },
    ngayKetThuc: { type: Date, required: true },
    trangThaiThanhToan: { type: String, enum: ['DA_THANH_TOAN', 'CHUA_THANH_TOAN'], default: 'CHUA_THANH_TOAN' }
});

module.exports = mongoose.model('ChiTietGoiTap', ChiTietGoiTapSchema);