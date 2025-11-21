const mongoose = require('mongoose');

const YearlyGoalsSchema = new mongoose.Schema({
    nam: { type: Number, required: true, unique: true },
    hoiVienMoi: { type: Number, default: 0 },
    doanhThu: { type: Number, default: 0 },
    checkIn: { type: Number, default: 0 },
    goiTap: { type: Number, default: 0 },
    hoiVienDangHoatDong: { type: Number, default: 0 },
    tyLeGiaHan: { type: Number, default: 0 }, // Tỷ lệ gia hạn (%)
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' },
    nguoiCapNhat: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' }
}, { collection: 'YearlyGoals', timestamps: true });

module.exports = mongoose.model('YearlyGoals', YearlyGoalsSchema);

