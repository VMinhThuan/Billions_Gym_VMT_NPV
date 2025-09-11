const mongoose = require('mongoose');

const LichHenPTSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'PT', required: true },
    ngayHen: { type: Date, required: true },
    gioHen: { type: String, required: true },
    trangThaiLichHen: { type: String, enum: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_HUY', 'HOAN_THANH'], default: 'CHO_XAC_NHAN' },
    ghiChu: { type: String }
}, { collection: 'LichHenPT', timestamps: true });

module.exports = mongoose.model('LichHenPT', LichHenPTSchema);