const mongoose = require('mongoose');

const MonAnSchema = new mongoose.Schema({
    tenMonAn: { type: String, required: true },
    moTa: { type: String },
    hinhAnh: { type: String },
    congThucNauAn: { type: String },
    loaiMonAn: { type: String, enum: ['SANG', 'TRUA', 'CHIEU', 'TOI', 'PHU'], required: true },
    thoiGianNau: { type: Number },
    danhSachNguyenLieu: [{
        tenNguyenLieu: { type: String, required: true },
        soLuong: { type: Number, required: true },
        donVi: { type: String, required: true }
    }],
    thongTinDinhDuong: {
        calories: { type: Number, required: true }, // kcal
        protein: { type: Number, required: true }, // gram
        carbohydrate: { type: Number, required: true }, // gram
        fat: { type: Number, required: true }, // gram
        fiber: { type: Number, default: 0 }, // gram
        duong: { type: Number, default: 0 }, // gram
        natri: { type: Number, default: 0 }, // mg
        canxi: { type: Number, default: 0 }, // mg
        sat: { type: Number, default: 0 }, // mg
        vitaminC: { type: Number, default: 0 }, // mg
        vitaminD: { type: Number, default: 0 } // IU
    },
    phanKhuc: { type: Number, default: 1 },
    danhGia: { type: Number, min: 1, max: 5, default: 5 },
    mucDoKho: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], default: 'TRUNG_BINH' }
});

const ThucDonHangNgaySchema = new mongoose.Schema({
    ngay: { type: Date, required: true },
    buaSang: [MonAnSchema],
    buaTrua: [MonAnSchema],
    buaChieu: [MonAnSchema],
    buaToi: [MonAnSchema],
    doUongBoSung: [MonAnSchema],
    tongCalories: { type: Number, required: true },
    tongProtein: { type: Number, required: true },
    tongCarb: { type: Number, required: true },
    tongFat: { type: Number, required: true },
    ghiChu: { type: String }
});

const ThucDonSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    ngayBatDau: { type: Date, required: true },
    ngayKetThuc: { type: Date, required: true },
    loaiThucDon: { type: String, enum: ['TUAN', 'THANG'], default: 'TUAN' },

    mucTieuDinhDuong: {
        mucTieuChinh: { type: String, enum: ['TANG_CAN', 'GIAM_CAN', 'DUY_TRI', 'TANG_CO_BAP', 'GIAM_MO'], required: true },
        caloriesNgay: { type: Number, required: true },
        proteinNgay: { type: Number, required: true },
        carbNgay: { type: Number, required: true },
        fatNgay: { type: Number, required: true },
        soLuongBuaAn: { type: Number, default: 4 },
        soLuongNuocUong: { type: Number, default: 2500 }
    },

    thongTinCaNhan: {
        tuoi: { type: Number },
        canNang: { type: Number },
        chieuCao: { type: Number },
        bmi: { type: Number },
        hoatDongHangNgay: { type: String, enum: ['IT_HOAT_DONG', 'HOAT_DONG_NHE', 'HOAT_DONG_VUA', 'HOAT_DONG_MANH'], default: 'HOAT_DONG_VUA' },
        tinhTrangSucKhoe: { type: String, default: 'BINH_THUONG' },
        diUng: [{ type: String }],
        sothich: [{ type: String }],
        kiengCu: [{ type: String }]
    },

    hoatDongTapLuyen: {
        cacacBaiTapChinh: [{ type: String }],
        tanSuatTap: { type: Number, default: 3 },
        thoidGianTap: { type: Number, default: 60 },
        doKhoTap: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], default: 'TRUNG_BINH' },
        loaiHinhTap: { type: String, enum: ['CO_BAP', 'CARDIO', 'YOGA', 'CROSSFIT', 'POWERLIFTING'], default: 'CO_BAP' }
    },

    thucDonChiTiet: [ThucDonHangNgaySchema],

    goiYTuAI: {
        lyDoGoiY: { type: String },
        cacLuuY: [{ type: String }],
        goiYThayThe: [{ type: String }],
        danhGiaPhuhop: { type: Number, min: 1, max: 10, default: 8 },
        ngayTaoGoiY: { type: Date, default: Date.now }
    },

    trangThai: { type: String, enum: ['DANG_SU_DUNG', 'DA_HOAN_THANH', 'DA_HUY'], default: 'DANG_SU_DUNG' },
    danhGiaHaiLong: { type: Number, min: 1, max: 5 },
    phanHoi: { type: String }
}, { collection: 'ThucDon', timestamps: true });

module.exports = mongoose.model('ThucDon', ThucDonSchema);
