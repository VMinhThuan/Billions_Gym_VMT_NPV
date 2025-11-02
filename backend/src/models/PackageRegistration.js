const mongoose = require('mongoose');

const PackageRegistrationSchema = new mongoose.Schema({
    // Thông tin gói tập và người dùng
    goiTapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoiTap',
        required: true
    },
    nguoiDungId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NguoiDung',
        required: true
    },

    // Thời gian đăng ký
    thoiGianDangKy: {
        type: Date,
        required: true,
        default: Date.now
    },
    thoiGianCapNhat: {
        type: Date,
        default: Date.now
    },

    // Trạng thái đăng ký
    trangThai: {
        type: String,
        enum: [
            'CHO_THANH_TOAN',      // Chờ thanh toán
            'DA_THANH_TOAN',       // Đã thanh toán
            'THANH_TOAN_THAT_BAI', // Thanh toán thất bại
            'DA_HUY',              // Đã hủy
            'DA_KICH_HOAT'         // Đã kích hoạt (bắt đầu sử dụng)
        ],
        default: 'CHO_THANH_TOAN'
    },

    // Thông tin thanh toán
    thongTinThanhToan: {
        phuongThuc: {
            type: String,
            enum: ['momo', 'zalopay'],
            required: true
        },
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        amount: {
            type: Number,
            required: true
        },
        requestId: String,        // MoMo request ID
        app_trans_id: String,     // ZaloPay app_trans_id
        paymentUrl: String,       // URL thanh toán
        ketQuaThanhToan: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },

    // Thông tin khách hàng (để backup)
    thongTinKhachHang: {
        firstName: String,
        lastName: String,
        phone: String,
        email: String,
        partnerPhone: String,
        partnerInfo: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },

    // Thông tin gói tập (để backup)
    thongTinGoiTap: {
        tenGoiTap: String,
        donGia: Number,
        thoiHan: Number,
        donViThoiHan: String,
        loaiThoiHan: String,
        soLuongNguoiThamGia: Number
    },

    // Thời gian sử dụng (sẽ được cập nhật khi thanh toán thành công)
    thoiGianSuDung: {
        ngayBatDau: Date,
        ngayKetThuc: Date,
        soNgayConLai: Number
    },

    // Thông tin bổ sung
    ghiChu: String,

    // Metadata
    metadata: {
        userAgent: String,
        ipAddress: String,
        source: {
            type: String,
            default: 'web'
        }
    }

}, {
    collection: 'packageRegistrations',
    timestamps: true
});

// Indexes
PackageRegistrationSchema.index({ goiTapId: 1, nguoiDungId: 1 });
PackageRegistrationSchema.index({ 'thongTinThanhToan.orderId': 1 });
PackageRegistrationSchema.index({ trangThai: 1 });
PackageRegistrationSchema.index({ thoiGianDangKy: -1 });

// Pre-save middleware để backup thông tin gói tập
PackageRegistrationSchema.pre('save', async function (next) {
    if (this.isNew && this.goiTapId) {
        try {
            const GoiTap = mongoose.model('GoiTap');
            const goiTap = await GoiTap.findById(this.goiTapId);

            if (goiTap) {
                this.thongTinGoiTap = {
                    tenGoiTap: goiTap.tenGoiTap,
                    donGia: goiTap.donGia,
                    thoiHan: goiTap.thoiHan,
                    donViThoiHan: goiTap.donViThoiHan,
                    loaiThoiHan: goiTap.loaiThoiHan,
                    soLuongNguoiThamGia: goiTap.soLuongNguoiThamGia
                };
            }

            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Method: Cập nhật trạng thái thanh toán thành công
PackageRegistrationSchema.methods.markPaymentSuccess = function (paymentResult) {
    this.trangThai = 'DA_THANH_TOAN';
    this.thoiGianCapNhat = new Date();
    this.thongTinThanhToan.ketQuaThanhToan = paymentResult;

    // Tính thời gian sử dụng
    const today = new Date();
    const thoiHanMs = this.thongTinGoiTap.thoiHan * 24 * 60 * 60 * 1000; // Convert to milliseconds

    this.thoiGianSuDung = {
        ngayBatDau: today,
        ngayKetThuc: new Date(today.getTime() + thoiHanMs),
        soNgayConLai: this.thongTinGoiTap.thoiHan
    };

    return this.save();
};

// Method: Cập nhật trạng thái thanh toán thất bại
PackageRegistrationSchema.methods.markPaymentFailed = function (paymentResult) {
    this.trangThai = 'THANH_TOAN_THAT_BAI';
    this.thoiGianCapNhat = new Date();
    this.thongTinThanhToan.ketQuaThanhToan = paymentResult;

    return this.save();
};

// Static method: Tìm đăng ký theo order ID
PackageRegistrationSchema.statics.findByOrderId = function (orderId) {
    return this.findOne({ 'thongTinThanhToan.orderId': orderId });
};

// Static method: Lấy đăng ký của người dùng
PackageRegistrationSchema.statics.getUserRegistrations = function (userId) {
    return this.find({ nguoiDungId: userId })
        .populate('goiTapId')
        .sort({ thoiGianDangKy: -1 });
};

// Static method: Thống kê đăng ký
PackageRegistrationSchema.statics.getRegistrationStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: '$trangThai',
                count: { $sum: 1 },
                totalAmount: {
                    $sum: { $cond: [{ $eq: ['$trangThai', 'DA_THANH_TOAN'] }, '$thongTinThanhToan.amount', 0] }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('PackageRegistration', PackageRegistrationSchema);
