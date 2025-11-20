const mongoose = require('mongoose');
const cacChiSoCoTheSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    chieuCao: { type: Number },
    canNang: { type: Number },
    vongNguc: { type: Number },
    vongEo: { type: Number },
    vongMong: { type: Number },
    bmi: { type: Number },
    tyLeMoCoThe: { type: Number },
    tyLeCoBap: { type: Number },
    nhipTim: { type: Number },
    tinhTrangSuckhoe: { type: String },
    ngayDo: { type: Date, default: Date.now }
}, { collection: 'ChiSoCoThe' });

module.exports = mongoose.model('ChiSoCoThe', cacChiSoCoTheSchema);