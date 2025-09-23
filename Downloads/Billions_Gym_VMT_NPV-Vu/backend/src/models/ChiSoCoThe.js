const mongoose = require('mongoose');
const cacChiSoCoTheSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    chieuCao: { type: Number },
    canNang: { type: Number },
    bmi: { type: Number },
    nhipTim: { type: Number },
    ngayDo: { type: Date, default: Date.now }
}, { collection: 'ChiSoCoThe' });

module.exports = mongoose.model('ChiSoCoThe', cacChiSoCoTheSchema);