const mongoose = require('mongoose');

const ThanhToanSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    soTien: { type: Number, required: true },
    ngayThanhToan: { type: Date, default: Date.now },
    noiDung: { type: String },
    phuongThuc: { type: String, enum: ['TIEN_MAT', 'CHUYEN_KHOAN', 'THE_TIN_DUNG'], required: true },
}, { collection: 'thanhToans', timestamps: true });

module.exports = mongoose.model('ThanhToan', ThanhToanSchema);