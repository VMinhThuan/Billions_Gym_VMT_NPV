const mongoose = require('mongoose');

const LichTapSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'PT', required: true },
    ngayBatDau: { type: Date, required: true },
    ngayKetThuc: { type: Date, required: true },
    cacBuoiTap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BuoiTap' }],
    
    // Thêm các trường mới
    chiTietGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiTietGoiTap', required: true },
    soNgayTapTrongTuan: { type: Number, default: 3 },
    cacNgayTap: [{ 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
    }],
    khungGioTap: [{
        ngayTrongTuan: { 
            type: String, 
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
        },
        gioBatDau: { type: String }, // Format: "HH:mm"
        gioKetThuc: { type: String }, // Format: "HH:mm"
    }],
    trangThaiLich: { 
        type: String, 
        enum: ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HOAN_THANH', 'HUY'], 
        default: 'DANG_HOAT_DONG' 
    },
    ghiChu: { type: String }
}, { collection: 'LichTap', timestamps: true });

module.exports = mongoose.model('LichTap', LichTapSchema);