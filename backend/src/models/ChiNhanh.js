const mongoose = require('mongoose');

const ChiNhanhSchema = new mongoose.Schema({
    tenChiNhanh: { type: String, required: true, index: true },
    diaChi: { type: String, required: true },
    soDienThoai: { type: String },
    moTa: { type: String },
    dichVu: [{ type: String }],
    hinhAnh: { type: String },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    thuTu: { type: Number, default: 0 },
}, { timestamps: true });

ChiNhanhSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ChiNhanh', ChiNhanhSchema);


