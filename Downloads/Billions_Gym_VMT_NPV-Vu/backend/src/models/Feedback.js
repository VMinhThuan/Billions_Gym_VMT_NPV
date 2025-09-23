const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    nguoiGui: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
    noiDung: { type: String, required: true },
    danhGia: { type: Number, min: 1, max: 5 },
    hinhAnh: [{ type: String }],
    ngayGui: { type: Date, default: Date.now },
}, { collection: 'Feedbacks', timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);