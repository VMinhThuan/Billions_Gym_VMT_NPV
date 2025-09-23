const mongoose = require('mongoose');

const TaiKhoanSchema = new mongoose.Schema({
    sdt: { type: String, required: true, unique: true },
    trangThaiTK: { type: String, enum: ['DANG_HOAT_DONG', 'DA_KHOA'], default: 'DANG_HOAT_DONG' },
    matKhau: { type: String, required: true },
    ngayTao: { type: Date, default: Date.now },
    nguoiDung: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true }
}, { collection: 'taiKhoans', timestamps: true });

module.exports = mongoose.model('TaiKhoan', TaiKhoanSchema);