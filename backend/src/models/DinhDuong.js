const mongoose = require('mongoose');

const DinhDuongSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    ngayGoiY: { type: Date, default: Date.now },
    buaAn: { type: String, required: true },
    luongCalo: { type: Number, required: true },
}, { collection: 'DinhDuong', timestamps: true });

module.exports = mongoose.model('DinhDuong', DinhDuongSchema);
