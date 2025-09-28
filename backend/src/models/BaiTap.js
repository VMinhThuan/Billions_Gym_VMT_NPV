const mongoose = require('mongoose');

const BaiTapSchema = new mongoose.Schema({
    tenBaiTap: { type: String, required: true },
    moTa: { type: String },
    hinhAnh: { type: String },
    nhomCo: { type: String },
    mucDoKho: { type: String },
    thietBiSuDung: { type: String },
    soHiepvaSoLanLap: { type: Number, default: 0 },
    mucTieuBaiTap: { type: String },
    hinhAnhMinhHoa: { type: String },
    videoHuongDan: { type: String },
}, { collection: 'BaiTap', timestamps: true });

module.exports = mongoose.model('BaiTap', BaiTapSchema);