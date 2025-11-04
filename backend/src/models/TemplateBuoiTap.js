const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const TemplateBuoiTapSchema = new Schema({
    ten: { type: String, required: true, index: true },
    moTa: { type: String, default: '' },
    loai: { type: String, default: '' },
    doKho: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], default: 'TRUNG_BINH', index: true },
    baiTap: [{ type: Types.ObjectId, ref: 'BaiTap' }],
    hinhAnh: { type: String, default: '' },
}, { timestamps: true, collection: 'templateBuoiTaps' });

module.exports = mongoose.model('TemplateBuoiTap', TemplateBuoiTapSchema);


