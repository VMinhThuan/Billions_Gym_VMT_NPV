const mongoose = require('mongoose');

const LichTapSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'PT', required: true },
    ngayBatDau: { type: Date, required: true },
    ngayKetThuc: { type: Date, required: true },
    cacBuoiTap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BuoiTap' }],
}, { collection: 'LichTap', timestamps: true });

module.exports = mongoose.model('LichTap', LichTapSchema);