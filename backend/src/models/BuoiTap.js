const mongoose = require('mongoose');

const BaiTapTrongBuoiSchema = new mongoose.Schema({
    baiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'BaiTap', required: true },
    soLanLap: { type: Number, default: 0 },
    soSet: { type: Number, default: 1 },
    trongLuong: { type: Number, default: 0 },
    thoiGianNghi: { type: Number, default: 60 },
    ghiChu: { type: String }
});

const BuoiTapSchema = new mongoose.Schema({
    ngayTap: { type: Date, required: true },
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien' },
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'PT', required: true },
    cacBaiTap: [BaiTapTrongBuoiSchema],
    trangThaiTap: { type: String, enum: ['DA_HOAN_THANH', 'CHUA_HOAN_THANH'], default: 'CHUA_HOAN_THANH' },
    ghiChu: { type: String },
    thoiGianBatDau: { type: Date },
    thoiGianKetThuc: { type: Date },
    
    // Thêm các trường mới
    lichTap: { type: mongoose.Schema.Types.ObjectId, ref: 'LichTap' },
    gioBatDauDuKien: { type: String }, // Format: "HH:mm"
    gioKetThucDuKien: { type: String }, // Format: "HH:mm"
    trangThaiXacNhan: { 
        type: String, 
        enum: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_HUY'], 
        default: 'CHO_XAC_NHAN' 
    }
}, { collection: 'BuoiTap', timestamps: true });

module.exports = mongoose.model('BuoiTap', BuoiTapSchema);