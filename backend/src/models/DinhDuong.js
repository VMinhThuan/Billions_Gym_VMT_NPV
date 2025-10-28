const mongoose = require('mongoose');

const DinhDuongSchema = new mongoose.Schema({
    hoiVien: { type: mongoose.Schema.Types.ObjectId, ref: 'HoiVien', required: true },
    ngayGoiY: { type: Date, default: Date.now },
    buaAn: { type: String, required: true },
    luongCalo: { type: Number, required: true },

    // Phân tích tập luyện
    phanTichTapLuyen: {
        tanSuatTap: { type: Number, default: 0 },
        thoiGianTap: { type: Number, default: 0 },
        nhomCoTapChinh: [{ type: String }],
        doKhoTap: { type: String, enum: ['DE', 'TRUNG_BINH', 'KHO'], default: 'DE' },
        caloTieuHao: { type: Number, default: 0 },
        ngayTapGanNhat: { type: Date }
    },

    // Mục tiêu dinh dưỡng
    mucTieuDinhDuong: {
        mucTieuChinh: {
            type: String,
            enum: ['TANG_CAN', 'GIAM_CAN', 'DUY_TRI', 'TANG_CO_BAP', 'GIAM_MO'],
            required: true
        },
        caloMucTieu: { type: Number, required: true },
        tiLeMacro: {
            protein: { type: Number, default: 25 }, // %
            carb: { type: Number, default: 45 },    // %
            fat: { type: Number, default: 30 }      // %
        }
    },

    // Loại gợi ý
    loaiGoiY: {
        type: String,
        enum: ['DINH_DUONG_TONG_QUAT', 'GIAM_CAN', 'TANG_CAN', 'TANG_CO_BAP', 'GIAM_MO', 'DUY_TRI'],
        default: 'DINH_DUONG_TONG_QUAT'
    },

    // Gợi ý AI chi tiết
    goiYAI: {
        tieuDe: { type: String, required: true },
        noiDungGoiY: { type: String, required: true },
        cacThucPhamNenAn: [{ type: String }],
        cacThucPhamNenTranh: [{ type: String }],
        thoidDiemAnUong: [{ type: String }],
        boSungCanThiet: [{ type: String }],
        luuYDacBiet: [{ type: String }],
        danhGiaDoPhuhop: { type: Number, min: 1, max: 10, default: 8 }
    },

    // Thực đơn liên kết 
    thucDonLienKet: { type: mongoose.Schema.Types.ObjectId, ref: 'ThucDon' },

    // Phản hồi từ người dùng
    phanHoiNguoiDung: {
        danhGia: { type: Number, min: 1, max: 5 },
        nhanXet: { type: String },
        haiLong: { type: Boolean },
        ngayPhanHoi: { type: Date }
    },

    // Trạng thái
    trangThai: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'EXPIRED'],
        default: 'ACTIVE'
    }
}, { collection: 'DinhDuong', timestamps: true });

module.exports = mongoose.model('DinhDuong', DinhDuongSchema);
