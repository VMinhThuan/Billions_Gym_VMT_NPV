const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    sdt: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // 5 phút
});

// Index để tối ưu query
OTPSchema.index({ sdt: 1, otp: 1 });
OTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', OTPSchema);