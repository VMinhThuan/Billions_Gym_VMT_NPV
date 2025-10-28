const mongoose = require('mongoose');
const NguoiDungSchema = new mongoose.Schema({
    soCCCD: { type: String, unique: true },
    hoTen: { type: String, required: true },
    ngaySinh: { type: Date },
    diaChi: { type: String },
    gioiTinh: { type: String, required: true },
    anhDaiDien: { type: String },
    email: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined
    },
    sdt: { type: String, unique: true, required: true },
}, { discriminatorKey: 'vaiTro', collection: 'nguoiDungs' });

const NguoiDung = mongoose.model('NguoiDung', NguoiDungSchema);

const HoiVienSchema = new mongoose.Schema({
    ngayThamGia: { type: Date, default: Date.now },
    ngayHetHan: { type: Date },
    trangThaiHoiVien: { type: String, enum: ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HET_HAN'], default: 'DANG_HOAT_DONG' },
    cacChiSoCoThe: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChiSoCoThe' }],
    hangHoiVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HangHoiVien',
        default: null
    },
    ngayDatHang: { type: Date }, // Ngày đạt hạng hiện tại
    soTienTichLuy: { type: Number, default: 0 }, // Tổng số tiền đã chi
    soThangLienTuc: { type: Number, default: 0 }, // Số tháng liên tục là hội viên
    soBuoiTapDaTap: { type: Number, default: 0 } // Số buổi tập đã thực hiện
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
    ngayVaoLam: { type: Date, default: Date.now },
    trangThaiPT: { type: String, enum: ['DANG_HOAT_DONG', 'NGUNG_LAM_VIEC'], default: 'DANG_HOAT_DONG' },
    chinhanh: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChiNhanh',
        required: true
    },
});

const PT = NguoiDung.discriminator('PT', PTSchema);

const HangHoiVien = require('./HangHoiVien');

module.exports = { NguoiDung, HoiVien, OngChu, PT };