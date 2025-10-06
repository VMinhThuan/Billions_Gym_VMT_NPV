const mongoose = require('mongoose');

// Schema cho lịch làm việc của PT
const LichLamViecPTSchema = new mongoose.Schema({
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
    thu: { 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
        required: true 
    },
    gioLamViec: [{
        gioBatDau: { type: String, required: true }, // Format: "HH:mm"
        gioKetThuc: { type: String, required: true }, // Format: "HH:mm"
        trangThai: { 
            type: String, 
            enum: ['RANH', 'BAN', 'NGHI'], 
            default: 'RANH' 
        }
    }],
    ghiChu: { type: String }
}, { collection: 'LichLamViecPT', timestamps: true });

// Index để tối ưu truy vấn
LichLamViecPTSchema.index({ pt: 1, thu: 1 });

module.exports = mongoose.model('LichLamViecPT', LichLamViecPTSchema);
