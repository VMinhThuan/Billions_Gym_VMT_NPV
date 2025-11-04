const mongoose = require('mongoose');

const BaiTapTrongBuoiSchema = new mongoose.Schema({
    baiTap: { type: mongoose.Schema.Types.ObjectId, ref: 'BaiTap', required: true },
    soLanLap: { type: Number, default: 0 },
    soSet: { type: Number, default: 1 },
    kyThuat: { type: String, default: '' },
    trongLuongTa: { type: Number, default: 0 },
    thoiGianNghi: { type: Number, default: 60 },
    ghiChu: { type: String }
});

const BuoiTapSchema = new mongoose.Schema({
    tenBuoiTap: {
        type: String,
        required: true
    },
    chiNhanh: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChiNhanh',
        required: true
    },
    ptPhuTrach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PT',
        required: true
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
    soLuongToiDa: {
        type: Number,
        required: true,
        default: 10
    },
    soLuongHienTai: {
        type: Number,
        default: 0
    },
    trangThai: {
        type: String,
        enum: ['CHUAN_BI', 'DANG_DIEN_RA', 'HOAN_THANH', 'HUY'],
        default: 'CHUAN_BI'
    },
    danhSachHoiVien: [{
        hoiVien: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HoiVien'
        },
        ngayDangKy: {
            type: Date,
            default: Date.now
        },
        trangThai: {
            type: String,
            enum: ['DA_DANG_KY', 'DA_THAM_GIA', 'VANG_MAT', 'HUY'],
            default: 'DA_DANG_KY'
        }
    }],
    moTa: {
        type: String
    },
    ghiChu: {
        type: String
    }
}, {
    timestamps: true
});

// Index để tối ưu query
BuoiTapSchema.index({ chiNhanh: 1, ngayTap: 1 });
BuoiTapSchema.index({ ptPhuTrach: 1, ngayTap: 1 });
BuoiTapSchema.index({ ngayTap: 1, gioBatDau: 1 });

// Virtual để kiểm tra còn chỗ trống
BuoiTapSchema.virtual('conChoTrong').get(function () {
    return this.soLuongToiDa - this.soLuongHienTai;
});

// Virtual để kiểm tra đã đầy
BuoiTapSchema.virtual('daDay').get(function () {
    return this.soLuongHienTai >= this.soLuongToiDa;
});

// Method để thêm hội viên vào buổi tập
BuoiTapSchema.methods.themHoiVien = function (hoiVienId) {
    if (this.daDay) {
        throw new Error('Buổi tập đã đầy');
    }

    const existingMember = this.danhSachHoiVien.find(
        member => member.hoiVien.toString() === hoiVienId.toString()
    );

    if (existingMember) {
        throw new Error('Hội viên đã đăng ký buổi tập này');
    }

    this.danhSachHoiVien.push({
        hoiVien: hoiVienId,
        ngayDangKy: new Date(),
        trangThai: 'DA_DANG_KY'
    });

    this.soLuongHienTai = this.danhSachHoiVien.length;
    return this.save();
};

// Method để xóa hội viên khỏi buổi tập
BuoiTapSchema.methods.xoaHoiVien = function (hoiVienId) {
    this.danhSachHoiVien = this.danhSachHoiVien.filter(
        member => member.hoiVien.toString() !== hoiVienId.toString()
    );

    this.soLuongHienTai = this.danhSachHoiVien.length;
    return this.save();
};

module.exports = mongoose.model('BuoiTap', BuoiTapSchema);