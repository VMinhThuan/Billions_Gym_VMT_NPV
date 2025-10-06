const mongoose = require('mongoose');

const DangKyGoiTapSchema = new mongoose.Schema({
    maHoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    maGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'GoiTap', required: true },
    ngayDangKy: { type: Date, required: true, default: Date.now },
    ngayBatDau: { type: Date, required: true },
    ngayKetThuc: { type: Date, required: true },
    
    // Trạng thái gói tập
    trangThai: { 
        type: String, 
        enum: ['DANG_HOAT_DONG', 'TAM_DUNG', 'HET_HAN', 'DA_HUY'], 
        default: 'DANG_HOAT_DONG' 
    },
    
    // Thông tin tạm dừng
    ngayTamDung: { type: Date }, // Ngày bắt đầu tạm dừng
    soNgayConLai: { type: Number }, // Số ngày còn lại khi tạm dừng
    lyDoTamDung: { type: String }, // Lý do tạm dừng (đăng ký gói mới)
    
    // Thông tin thanh toán
    trangThaiThanhToan: { 
        type: String, 
        enum: ['DA_THANH_TOAN', 'CHUA_THANH_TOAN', 'HOAN_TIEN'], 
        default: 'CHUA_THANH_TOAN' 
    },
    soTienThanhToan: { type: Number, required: true },
    maThanhToan: { type: mongoose.Schema.Types.ObjectId, ref: 'ThanhToan' },
    
    // Thông tin PT và lịch tập
    ptDuocChon: { type: mongoose.Schema.Types.ObjectId, ref: 'PT' },
    lichTapDuocTao: { type: mongoose.Schema.Types.ObjectId, ref: 'LichTap' },
    
    // Ghi chú
    ghiChu: { type: String },
    
    // Thứ tự ưu tiên (gói mới nhất có priority cao nhất)
    thuTuUuTien: { type: Number, default: 1 }
}, { 
    collection: 'dangKyGoiTaps', 
    timestamps: true 
});

// Index để tối ưu query
DangKyGoiTapSchema.index({ maHoiVien: 1, trangThai: 1 });
DangKyGoiTapSchema.index({ maGoiTap: 1, trangThai: 1 });
DangKyGoiTapSchema.index({ maHoiVien: 1, thuTuUuTien: -1 });

// Middleware: Tự động tạm dừng các gói cũ khi đăng ký gói mới
DangKyGoiTapSchema.pre('save', async function(next) {
    if (this.isNew && this.trangThai === 'DANG_HOAT_DONG') {
        try {
            // Tìm tất cả gói đang hoạt động của hội viên này
            const activePackages = await this.constructor.find({
                maHoiVien: this.maHoiVien,
                trangThai: 'DANG_HOAT_DONG',
                _id: { $ne: this._id }
            });

            if (activePackages.length > 0) {
                // Tạm dừng tất cả gói cũ
                for (let pkg of activePackages) {
                    // Tính số ngày còn lại
                    const today = new Date();
                    const daysRemaining = Math.ceil((pkg.ngayKetThuc - today) / (1000 * 60 * 60 * 24));
                    
                    pkg.trangThai = 'TAM_DUNG';
                    pkg.ngayTamDung = today;
                    pkg.soNgayConLai = Math.max(0, daysRemaining);
                    pkg.lyDoTamDung = `Tạm dừng do đăng ký gói mới: ${this.maGoiTap}`;
                    
                    await pkg.save();
                }

                // Set priority cho gói mới
                this.thuTuUuTien = Math.max(...activePackages.map(p => p.thuTuUuTien)) + 1;
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Method: Kích hoạt lại gói tập (khi gói hiện tại hết hạn)
DangKyGoiTapSchema.methods.kichHoatLai = async function() {
    if (this.trangThai === 'TAM_DUNG' && this.soNgayConLai > 0) {
        const today = new Date();
        
        // Tính ngày kết thúc mới
        this.ngayBatDau = today;
        this.ngayKetThuc = new Date(today.getTime() + (this.soNgayConLai * 24 * 60 * 60 * 1000));
        this.trangThai = 'DANG_HOAT_DONG';
        this.ngayTamDung = null;
        this.soNgayConLai = null;
        this.lyDoTamDung = null;
        
        return await this.save();
    }
    throw new Error('Không thể kích hoạt lại gói tập này');
};

// Static method: Lấy gói đang hoạt động của hội viên
DangKyGoiTapSchema.statics.getActivePackage = function(maHoiVien) {
    return this.findOne({
        maHoiVien: maHoiVien,
        trangThai: 'DANG_HOAT_DONG'
    }).populate('maGoiTap').populate('ptDuocChon');
};

// Static method: Lấy tất cả gói của hội viên (bao gồm cả tạm dừng)
DangKyGoiTapSchema.statics.getAllPackagesByMember = function(maHoiVien) {
    return this.find({
        maHoiVien: maHoiVien
    }).populate('maGoiTap').populate('ptDuocChon').sort({ thuTuUuTien: -1, createdAt: -1 });
};

// Static method: Lấy danh sách hội viên của một gói tập
DangKyGoiTapSchema.statics.getMembersByPackage = function(maGoiTap) {
    return this.find({
        maGoiTap: maGoiTap,
        trangThai: { $in: ['DANG_HOAT_DONG', 'TAM_DUNG'] }
    }).populate('maHoiVien').sort({ createdAt: -1 });
};

// Static method: Thống kê gói tập
DangKyGoiTapSchema.statics.getPackageStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$maGoiTap',
                tongSoLuotDangKy: { $sum: 1 },
                soLuongDangHoatDong: {
                    $sum: { $cond: [{ $eq: ['$trangThai', 'DANG_HOAT_DONG'] }, 1, 0] }
                },
                soLuongTamDung: {
                    $sum: { $cond: [{ $eq: ['$trangThai', 'TAM_DUNG'] }, 1, 0] }
                },
                tongDoanhThu: {
                    $sum: { $cond: [{ $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] }, '$soTienThanhToan', 0] }
                }
            }
        },
        {
            $lookup: {
                from: 'goiTaps',
                localField: '_id',
                foreignField: '_id',
                as: 'thongTinGoiTap'
            }
        },
        {
            $unwind: '$thongTinGoiTap'
        },
        {
            $sort: { tongSoLuotDangKy: -1 }
        }
    ]);
};

module.exports = mongoose.model('DangKyGoiTap', DangKyGoiTapSchema);
