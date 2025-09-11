constructor(maBuoiDung, maDinhDuong, tenBuoiDung, dsMonAn, gioAn) {
    this.maBuoiDung = maBuoiDung;
    this.maDinhDuong = maDinhDuong;
    this.tenBuoiDung = tenBuoiDung;
    this.dsMonAn = dsMonAn;
    this.gioAn = gioAn;
}
}
module.exports = BuoiDung;

const mongoose = require('mongoose');

const BuoiDungSchema = new mongoose.Schema({
    maDinhDuong: { type: mongoose.Schema.Types.ObjectId, ref: 'DinhDuong', required: true },
    tenBuoiDung: { type: String, required: true },
    dsMonAn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MonAn' }],
    gioAn: { type: Date }
});

module.exports = mongoose.model('BuoiDung', BuoiDungSchema);
