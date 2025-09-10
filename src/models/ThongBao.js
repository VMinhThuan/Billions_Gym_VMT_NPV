const mongoose = require('mongoose');

const ThongBaoSchema = new mongoose.Schema({
    tieuDe: { type: String, required: true },
    hinhAnhBanner: { type: String },
    noiDung: { type: String, required: true },
    thoiGianGui: { type: Date, default: Date.now },
    trangThaiThongBao: { type: String, enum: ['DA_GUI', 'CHUA_GUI'], default: 'DA_GUI' }
}, { collection: 'ThongBao', timestamps: true });

module.exports = mongoose.model('ThongBao', ThongBaoSchema);