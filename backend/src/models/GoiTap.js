const mongoose = require('mongoose');

const GoiTapSchema = new mongoose.Schema({
    tenGoiTap: { type: String, required: true },
    moTa: { type: String },
    donGia: { type: Number, required: true },
    thoiHan: { type: Number, required: true },
    hinhAnhDaiDien: { type: String },
    kichHoat: { type: Boolean, default: true },
}, { collection: 'goiTaps', timestamps: true });

module.exports = mongoose.model('GoiTap', GoiTapSchema);
