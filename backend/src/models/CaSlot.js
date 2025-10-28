const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const CaSlotSchema = new Schema({
    chiNhanh: { type: Types.ObjectId, ref: 'ChiNhanh', required: true, index: true },
    ngay: { type: Date, required: true, index: true },
    gioBatDau: { type: String, required: true },
    gioKetThuc: { type: String, required: true },
    sessionOptions: [{ type: Types.ObjectId, ref: 'SessionOption' }],
}, { timestamps: true, collection: 'caSlots' });

module.exports = mongoose.model('CaSlot', CaSlotSchema);


