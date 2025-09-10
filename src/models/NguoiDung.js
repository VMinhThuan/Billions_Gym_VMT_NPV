const mongoose = require('mongoose');
const NguoiDungSchema = new mongoose.Schema({
    soCCCD: { type: String, unique: true },
    hoTen: { type: String, required: true },
    ngaySinh: { type: Date, required: true },
    diaChi: { type: String },
    gioiTinh: { type: String, required: true },
    anhDaiDien: { type: String },
    email: { type: String, unique: true },
    sdt: { type: String, unique: true, required: true },
}, { discriminatorKey: 'vaiTro', collection: 'nguoiDungs' });

const NguoiDung = mongoose.model('NguoiDung', NguoiDungSchema);

const HoiVienSchema = new mongoose.Schema({
    ngayThamGia: { type: Date, default: Date.now },
    ngayHetHan: { type: Date },
    trangThaiHoiVien: { type: String, enum: ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HET_HAN'], default: 'DANG_HOAT_DONG' },
    cacChiSoCoThe: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChiSoCoThe' }]
});

const HoiVien = NguoiDung.discriminator('HoiVien', HoiVienSchema);

const OngChuSchema = new mongoose.Schema({
});

const OngChu = NguoiDung.discriminator('OngChu', OngChuSchema);

const PTSchema = new mongoose.Schema({
    kinhNghiem: { type: Number },
    bangCapChungChi: { type: String },
    chuyenMon: { type: String },
    danhGia: { type: Number, min: 1, max: 5 },
    moTa: { type: String },
    trangThaiPT: { type: String, enum: ['DANG_HOAT_DONG', 'NGUNG_LAM_VIEC'], default: 'DANG_HOAT_DONG' },
});

const PT = NguoiDung.discriminator('PT', PTSchema);


module.exports = { NguoiDung, HoiVien, OngChu, PT };