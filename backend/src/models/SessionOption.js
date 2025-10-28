const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const SessionOptionSchema = new Schema({
    caSlot: { type: Types.ObjectId, ref: 'CaSlot', required: true, index: true },
    chiNhanh: { type: Types.ObjectId, ref: 'ChiNhanh', required: true },
    ptPhuTrach: { type: Types.ObjectId, ref: 'NguoiDung', required: true },
    // Secondary PTs to assist (optional). Keeps backward compatibility with FE using ptPhuTrach as primary
    ptHoTro: [{ type: Types.ObjectId, ref: 'NguoiDung' }],
    // Core scheduling fields
    ngay: { type: Date, required: true, index: true },
    gioBatDau: { type: String, required: true },
    gioKetThuc: { type: String, required: true },
    // Template and monthly tracking
    templateRef: { type: Types.ObjectId, ref: 'TemplateBuoiTap', index: true },
    thangKey: { type: String, index: true }, // YYYY-MM

    loai: { type: String, required: true },
    doKho: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], default: 'TRUNG_BINH', index: true },
    taiLieuBaiTap: [{ type: Types.ObjectId, ref: 'BaiTap' }],
    hinhAnh: { type: String, default: '' },
    soLuongToiDa: { type: Number, default: 20, min: 1 },
    soLuongDaDangKy: { type: Number, default: 0, min: 0 },
    trangThai: { type: String, enum: ['HOAT_DONG', 'HET_CHO', 'HUY'], default: 'HOAT_DONG' },
}, { timestamps: true, collection: 'sessionOptions' });

module.exports = mongoose.model('SessionOption', SessionOptionSchema);
