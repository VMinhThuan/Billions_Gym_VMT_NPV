const mongoose = require('mongoose');

const LichSuTapSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    buoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'BuoiTap', required: true },
    ketQua: { type: String },
    caloTieuHao: { type: Number },
    danhGia: { type: Number, min: 1, max: 5 },
    ngayTap: { type: Date, default: Date.now },
}, { collection: 'LichSuTap', timestamps: true });

module.exports = mongoose.model('LichSuTap', LichSuTapSchema);