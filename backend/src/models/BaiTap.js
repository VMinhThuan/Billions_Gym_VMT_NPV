const mongoose = require('mongoose');

const BaiTapSchema = new mongoose.Schema({
    tenBaiTap: { type: String, required: true },
    moTa: { type: String },
    hinhAnh: { type: String },
    videoHuongDan: { type: String },
    nhomCo: { type: String },
    hinhAnhMinhHoa: { type: String },
    videoHuongDan: { type: String },
}, { collection: 'BaiTap', timestamps: true });

module.exports = mongoose.model('BaiTap', BaiTapSchema);