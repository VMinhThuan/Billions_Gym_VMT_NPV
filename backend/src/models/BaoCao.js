const mongoose = require('mongoose');

const BaoCao = new mongoose.Schema({
    tenBaoCao: { type: String, require: true },
    ngayTao: { type: Date, default: Date.now },
    noiDung: { type: String, require: true },
}, { collection: 'BaoCao', timestamps: true });

module.exports = mongoose.model('BaoCao', BaoCao);