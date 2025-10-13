const mongoose = require('mongoose');

const BaiTapSchema = new mongoose.Schema({
    tenBaiTap: { type: String, required: true },
    moTa: { type: String },
    hinhAnh: { type: String },
    nhomCo: { type: String },
    mucDoKho: { type: String },
    thoiGian: { type: Number },
    thietBiSuDung: { type: String },
    soHiepvaSoLanLap: { type: Number, default: 0 },
    kcal: { type: Number, default: null },
    mucTieuBaiTap: { type: String },
    hinhAnhMinhHoa: { type: [String] },
    videoHuongDan: { type: String },
}, { collection: 'BaiTap', timestamps: true });

// Compute default kcal for an exercise based on available fields
function computeDefaultKcal(doc) {
    try {
        const thoiGian = doc.thoiGian || 0;
        if (thoiGian && Number(thoiGian) > 0) {
            return Math.round(Number(thoiGian) * 8);
        }

        const diff = (doc.mucDoKho || '').toLowerCase();
        if (diff.includes('de') || diff.includes('dễ')) return 50;
        if (diff.includes('khó') || diff.includes('kho')) return 150;
        return 100;
    } catch (e) {
        return 100;
    }
}

// Pre-save hook: populate kcal if missing
BaiTapSchema.pre('save', function (next) {
    if (this.kcal == null) {
        this.kcal = computeDefaultKcal(this);
    }
    next();
});

module.exports = mongoose.model('BaiTap', BaiTapSchema);