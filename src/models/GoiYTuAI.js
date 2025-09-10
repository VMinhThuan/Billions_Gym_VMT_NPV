const mongoose = require('mongoose');

const GoiYTuAISchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    ngayGoiY: { type: Date, default: Date.now },
    noiDung: { type: String, required: true },
    mucTieu: { type: String, required: true },
    doKho: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], required: true },
    thoiGianTap: { type: Number, required: true },
}, { collection: 'GoiYTuAI', timestamps: true });

module.exports = mongoose.model('GoiYTuAI', GoiYTuAISchema);