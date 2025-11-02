const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const SessionSchema = new Schema({
    chiNhanh: { type: Types.ObjectId, ref: 'ChiNhanh', required: true, index: true },
    ptPhuTrach: { type: Types.ObjectId, ref: 'NguoiDung', required: true, index: true },
    goiTap: { type: Types.ObjectId, ref: 'GoiTap' },
    ngay: { type: Date, required: true, index: true },
    gioBatDau: { type: String, required: true }, // HH:mm
    gioKetThuc: { type: String, required: true }, // HH:mm
    taiLieuBaiTap: [{ type: Types.ObjectId, ref: 'Exercise' }], // Changed from 'BaiTap' to 'Exercise'
    hinhAnh: { type: String, default: '' },
    doKho: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], default: 'TRUNG_BINH', index: true },
    soLuongToiDa: { type: Number, default: 20, min: 1 },
    soLuongDaDangKy: { type: Number, default: 0, min: 0 },
    trangThai: { type: String, enum: ['HOAT_DONG', 'HET_CHO', 'HUY'], default: 'HOAT_DONG' },
    ghiChu: { type: String, default: '' },
}, { timestamps: true, collection: 'sessions' });

// Không cho phép soLuongDaDangKy vượt quá soLuongToiDa
SessionSchema.methods.canRegister = function () {
    return this.trangThai === 'HOAT_DONG' && this.soLuongDaDangKy < this.soLuongToiDa;
};

module.exports = mongoose.model('Session', SessionSchema);


