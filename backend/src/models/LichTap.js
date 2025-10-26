const mongoose = require('mongoose');

const LichTapSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    pt: { type: mongoose.Schema.Types.ObjectId, ref: 'PT', required: true },
    ngayBatDau: { type: Date, required: true },
    ngayKetThuc: { type: Date, required: true },
    cacBuoiTap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BuoiTap' }],

    chiTietGoiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'ChiTietGoiTap' },
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
        gioBatDau: { type: String }, // "HH:mm"
        gioKetThuc: { type: String }, // "HH:mm"
    }],
    trangThaiLich: {
        type: String,
        enum: ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HOAN_THANH', 'HUY'],
        default: 'DANG_HOAT_DONG'
    },
    goiTap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoiTap',
        required: true
    },
    chiNhanh: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChiNhanh',
        required: true
    },
    tuanBatDau: {
        type: Date,
        required: true
    },
    tuanKetThuc: {
        type: Date,
        required: true
    },
    soNgayTapTrongTuan: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    gioTapUuTien: [{
        type: String
    }],
    danhSachBuoiTap: [{
        buoiTap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BuoiTap'
        },
        ngayTap: {
            type: Date,
            required: true
        },
        gioBatDau: {
            type: String,
            required: true
        },
        gioKetThuc: {
            type: String,
            required: true
        },
        ptPhuTrach: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PT'
        },
        trangThai: {
            type: String,
            enum: ['DA_DANG_KY', 'DA_THAM_GIA', 'VANG_MAT', 'HUY'],
            default: 'DA_DANG_KY'
        },
        ngayDangKy: {
            type: Date,
            default: Date.now
        }
    }],
    trangThai: {
        type: String,
        enum: ['DANG_HOAT_DONG', 'HOAN_THANH', 'HUY'],
        default: 'DANG_HOAT_DONG'
    },
    ghiChu: {
        type: String
    }
}, {
    timestamps: true
});

// Index để tối ưu query
LichTapSchema.index({ hoiVien: 1, tuanBatDau: 1 });
LichTapSchema.index({ chiNhanh: 1, tuanBatDau: 1 });
LichTapSchema.index({ goiTap: 1, tuanBatDau: 1 });

// Virtual để lấy số buổi đã đăng ký
LichTapSchema.virtual('soBuoiDaDangKy').get(function () {
    return this.danhSachBuoiTap.length;
});

// Virtual để lấy số buổi đã tham gia
LichTapSchema.virtual('soBuoiDaThamGia').get(function () {
    return this.danhSachBuoiTap.filter(buoi => buoi.trangThai === 'DA_THAM_GIA').length;
});

// Method để thêm buổi tập vào lịch
LichTapSchema.methods.themBuoiTap = function (buoiTapData) {
    // Kiểm tra không vượt quá số ngày tập trong tuần
    if (this.danhSachBuoiTap.length >= this.soNgayTapTrongTuan) {
        throw new Error('Đã đạt giới hạn số buổi tập trong tuần');
    }

    // Kiểm tra không trùng ngày
    const existingDay = this.danhSachBuoiTap.find(
        buoi => buoi.ngayTap.toDateString() === buoiTapData.ngayTap.toDateString()
    );

    if (existingDay) {
        throw new Error('Đã có buổi tập trong ngày này');
    }

    this.danhSachBuoiTap.push({
        ...buoiTapData,
        ngayDangKy: new Date()
    });

    return this.save();
};

// Method để xóa buổi tập khỏi lịch
LichTapSchema.methods.xoaBuoiTap = function (buoiTapId) {
    this.danhSachBuoiTap = this.danhSachBuoiTap.filter(
        buoi => buoi.buoiTap.toString() !== buoiTapId.toString()
    );

    return this.save();
};

// Method để cập nhật trạng thái buổi tập
LichTapSchema.methods.capNhatTrangThaiBuoiTap = function (buoiTapId, trangThai) {
    const buoiTap = this.danhSachBuoiTap.find(
        buoi => buoi.buoiTap.toString() === buoiTapId.toString()
    );

    if (buoiTap) {
        buoiTap.trangThai = trangThai;
        return this.save();
    }

    throw new Error('Không tìm thấy buổi tập');
};

module.exports = mongoose.model('LichTap', LichTapSchema);