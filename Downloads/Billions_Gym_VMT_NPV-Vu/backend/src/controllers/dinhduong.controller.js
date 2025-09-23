const dinhDuongService = require('../services/dinhduong.service');

// Lấy thông tin dinh dưỡng của hội viên
const getThongTinDinhDuong = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        if (!maHoiVien) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã hội viên'
            });
        }
        const result = await dinhDuongService.getThongTinDinhDuongHoiVien(maHoiVien);
        res.status(200).json({
            success: true,
            message: 'Lấy thông tin dinh dưỡng thành công',
            data: result
        });
    }
    catch (error) {
        console.error('Lỗi lấy thông tin dinh dưỡng:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thông tin dinh dưỡng'
        });
    }
}

// Tạo gợi ý dinh dưỡng AI cho hội viên
const taoGoiYDinhDuong = async (req, res) => {
    try {
        const { maHoiVien, mucTieu, thongTinThem } = req.body;

        if (!maHoiVien || !mucTieu) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: maHoiVien và mucTieu'
            });
        }

        // Kiểm tra mục tiêu hợp lệ
        const mucTieuHopLe = ['TANG_CAN', 'GIAM_CAN', 'DUY_TRI', 'TANG_CO_BAP', 'GIAM_MO'];
        if (!mucTieuHopLe.includes(mucTieu)) {
            return res.status(400).json({
                success: false,
                message: 'Mục tiêu không hợp lệ. Các mục tiêu hỗ trợ: ' + mucTieuHopLe.join(', ')
            });
        }

        const result = await dinhDuongService.taoGoiYDinhDuongAI(maHoiVien, mucTieu, thongTinThem);

        res.status(201).json({
            success: true,
            message: 'Tạo gợi ý dinh dưỡng thành công',
            data: result.data,
            thongTinThem: result.thongTinThem
        });

    } catch (error) {
        console.error('Lỗi tạo gợi ý dinh dưỡng:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo gợi ý dinh dưỡng'
        });
    }
};

// Tạo thực đơn tự động cho hội viên
const taoThucDonTuDong = async (req, res) => {
    try {
        const { maHoiVien, loaiThucDon, mucTieu } = req.body;

        if (!maHoiVien || !mucTieu) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: maHoiVien và mucTieu'
            });
        }

        // Kiểm tra loại thực đơn hợp lệ
        const loaiThucDonHopLe = ['TUAN', 'THANG'];
        const loaiThucDonFinal = loaiThucDon || 'TUAN';
        if (!loaiThucDonHopLe.includes(loaiThucDonFinal)) {
            return res.status(400).json({
                success: false,
                message: 'Loại thực đơn không hợp lệ. Chọn TUAN hoặc THANG'
            });
        }

        const result = await dinhDuongService.taoThucDonTuDong(maHoiVien, loaiThucDonFinal, mucTieu);

        res.status(201).json({
            success: true,
            message: `Tạo thực đơn ${loaiThucDonFinal.toLowerCase()} thành công`,
            data: result.data
        });

    } catch (error) {
        console.error('Lỗi tạo thực đơn:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo thực đơn'
        });
    }
};

// Lấy danh sách gợi ý dinh dưỡng của hội viên
const getGoiYDinhDuong = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { limit, page, loaiGoiY } = req.query;

        if (!maHoiVien) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã hội viên'
            });
        }

        const options = {
            limit: parseInt(limit) || 10,
            page: parseInt(page) || 1,
            loaiGoiY: loaiGoiY || null
        };

        const result = await dinhDuongService.getGoiYDinhDuongByHoiVien(maHoiVien, options);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách gợi ý dinh dưỡng thành công',
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Lỗi lấy gợi ý dinh dưỡng:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy gợi ý dinh dưỡng'
        });
    }
};

// Lấy chi tiết một gợi ý dinh dưỡng
const getChiTietGoiY = async (req, res) => {
    try {
        const { goiYId } = req.params;

        if (!goiYId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID gợi ý'
            });
        }

        const DinhDuong = require('../models/DinhDuong');
        const goiY = await DinhDuong.findById(goiYId)
            .populate('hoiVien', 'hoTen sdt')
            .populate('thucDonLienKet');

        if (!goiY) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy gợi ý dinh dưỡng'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết gợi ý thành công',
            data: goiY
        });

    } catch (error) {
        console.error('Lỗi lấy chi tiết gợi ý:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy chi tiết gợi ý'
        });
    }
};

// Cập nhật phản hồi cho gợi ý dinh dưỡng
const capNhatPhanHoi = async (req, res) => {
    try {
        const { goiYId } = req.params;
        const { danhGia, phanHoi, trangThai } = req.body;

        if (!goiYId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID gợi ý'
            });
        }

        if (danhGia && (danhGia < 1 || danhGia > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải từ 1 đến 5'
            });
        }

        const result = await dinhDuongService.capNhatPhanHoiGoiY(goiYId, danhGia, phanHoi, trangThai);

        res.status(200).json({
            success: true,
            message: 'Cập nhật phản hồi thành công',
            data: result.data
        });

    } catch (error) {
        console.error('Lỗi cập nhật phản hồi:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật phản hồi'
        });
    }
};

// Lấy danh sách thực đơn của hội viên
const getThucDonHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { trangThai, limit, page } = req.query;

        if (!maHoiVien) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã hội viên'
            });
        }

        const ThucDon = require('../models/ThucDon');

        let query = { hoiVien: maHoiVien };
        if (trangThai) {
            query.trangThai = trangThai;
        }

        const limitNum = parseInt(limit) || 10;
        const pageNum = parseInt(page) || 1;

        const thucDonList = await ThucDon.find(query)
            .populate('hoiVien', 'hoTen sdt')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum);

        const total = await ThucDon.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách thực đơn thành công',
            data: thucDonList,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total
            }
        });

    } catch (error) {
        console.error('Lỗi lấy thực đơn hội viên:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thực đơn'
        });
    }
};

// Lấy chi tiết thực đơn
const getChiTietThucDon = async (req, res) => {
    try {
        const { thucDonId } = req.params;

        if (!thucDonId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID thực đơn'
            });
        }

        const ThucDon = require('../models/ThucDon');
        const thucDon = await ThucDon.findById(thucDonId)
            .populate('hoiVien', 'hoTen sdt gioiTinh ngaySinh');

        if (!thucDon) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thực đơn'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết thực đơn thành công',
            data: thucDon
        });

    } catch (error) {
        console.error('Lỗi lấy chi tiết thực đơn:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy chi tiết thực đơn'
        });
    }
};

// Cập nhật đánh giá thực đơn
const capNhatDanhGiaThucDon = async (req, res) => {
    try {
        const { thucDonId } = req.params;
        const { danhGiaHaiLong, phanHoi, trangThai } = req.body;

        if (!thucDonId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID thực đơn'
            });
        }

        // Validate đánh giá
        if (danhGiaHaiLong && (danhGiaHaiLong < 1 || danhGiaHaiLong > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải từ 1 đến 5'
            });
        }

        const ThucDon = require('../models/ThucDon');
        const updateData = {};

        if (danhGiaHaiLong) updateData.danhGiaHaiLong = danhGiaHaiLong;
        if (phanHoi) updateData.phanHoi = phanHoi;
        if (trangThai) updateData.trangThai = trangThai;

        const thucDon = await ThucDon.findByIdAndUpdate(
            thucDonId,
            updateData,
            { new: true }
        );

        if (!thucDon) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thực đơn'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật đánh giá thực đơn thành công',
            data: thucDon
        });

    } catch (error) {
        console.error('Lỗi cập nhật đánh giá thực đơn:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật đánh giá'
        });
    }
};

// Phân tích hoạt động tập luyện của hội viên
const phanTichHoatDong = async (req, res) => {
    try {
        const { maHoiVien } = req.params;

        if (!maHoiVien) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã hội viên'
            });
        }

        const result = await dinhDuongService.phanTichHoatDongTapLuyen(maHoiVien);

        res.status(200).json({
            success: true,
            message: 'Phân tích hoạt động tập luyện thành công',
            data: result
        });

    } catch (error) {
        console.error('Lỗi phân tích hoạt động:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi phân tích hoạt động'
        });
    }
};

// Tính nhu cầu calories cơ bản
const tinhNhuCauCalories = async (req, res) => {
    try {
        const { canNang, chieuCao, tuoi, gioiTinh, hoatDong, mucTieu } = req.body;

        // Validate dữ liệu đầu vào
        if (!canNang || !chieuCao || !tuoi || !gioiTinh || !mucTieu) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: canNang, chieuCao, tuoi, gioiTinh, mucTieu'
            });
        }

        const nhuCauCalories = dinhDuongService.tinhNhuCauCalories(
            canNang, chieuCao, tuoi, gioiTinh, hoatDong || 'HOAT_DONG_VUA', mucTieu
        );

        // Tính macro distribution
        let tiLeMacro = { protein: 25, carb: 45, fat: 30 };
        if (mucTieu === 'TANG_CO_BAP') {
            tiLeMacro = { protein: 30, carb: 40, fat: 30 };
        } else if (mucTieu === 'GIAM_CAN' || mucTieu === 'GIAM_MO') {
            tiLeMacro = { protein: 30, carb: 35, fat: 35 };
        }

        const proteinGram = Math.round(nhuCauCalories * tiLeMacro.protein / 100 / 4);
        const carbGram = Math.round(nhuCauCalories * tiLeMacro.carb / 100 / 4);
        const fatGram = Math.round(nhuCauCalories * tiLeMacro.fat / 100 / 9);

        res.status(200).json({
            success: true,
            message: 'Tính nhu cầu calories thành công',
            data: {
                nhuCauCalories,
                tiLeMacro,
                macroGram: {
                    protein: proteinGram,
                    carb: carbGram,
                    fat: fatGram
                },
                ghiChu: `Dựa trên mục tiêu ${mucTieu} và mức hoạt động ${hoatDong || 'HOAT_DONG_VUA'}`
            }
        });

    } catch (error) {
        console.error('Lỗi tính nhu cầu calories:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tính nhu cầu calories'
        });
    }
};

module.exports = {
    getThongTinDinhDuong,
    taoGoiYDinhDuong,
    taoThucDonTuDong,
    getGoiYDinhDuong,
    getChiTietGoiY,
    capNhatPhanHoi,
    getThucDonHoiVien,
    getChiTietThucDon,
    capNhatDanhGiaThucDon,
    phanTichHoatDong,
    tinhNhuCauCalories
};