const mongoose = require('mongoose');

const BuoiTapSchema = new mongoose.Schema({
    ngayTap: { type: Date, required: true },
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'PT', required: true },
    cacBaiTap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BaiTap' }],
    trangThaiTap: { type: String, enum: ['DA_HOAN_THANH', 'CHUA_HOAN_THANH'], default: 'CHUA_HOAN_THANH' },
}, { collection: 'BuoiTap', timestamps: true });

module.exports = mongoose.model('BuoiTap', BuoiTapSchema);