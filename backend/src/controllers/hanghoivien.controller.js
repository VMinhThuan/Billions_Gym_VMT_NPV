const hangHoiVienService = require('../services/hanghoivien.service');
const { NguoiDung } = require('../models/NguoiDung');
const mongoose = require('mongoose');

// Tạo hạng hội viên mới
const createHangHoiVien = async (req, res) => {
    try {
        const hangHoiVien = await hangHoiVienService.createHangHoiVien(req.body);
        res.status(201).json({
            success: true,
            message: 'Tạo hạng hội viên thành công',
            data: hangHoiVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo hạng hội viên',
            error: error.message
        });
    }
};

// Lấy tất cả hạng hội viên
const getAllHangHoiVien = async (req, res) => {
    try {
        const hangHoiViens = await hangHoiVienService.getAllHangHoiVien();
        res.status(200).json({
            success: true,
            data: hangHoiViens
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách hạng hội viên',
            error: error.message
        });
    }
};

// Lấy hạng hội viên theo ID
const getHangHoiVienById = async (req, res) => {
    try {
        const { id } = req.params;
        const hangHoiVien = await hangHoiVienService.getHangHoiVienById(id);

        if (!hangHoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạng hội viên'
            });
        }

        res.status(200).json({
            success: true,
            data: hangHoiVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin hạng hội viên',
            error: error.message
        });
    }
};

// Cập nhật hạng hội viên
const updateHangHoiVien = async (req, res) => {
    try {
        const { id } = req.params;
        const hangHoiVien = await hangHoiVienService.updateHangHoiVien(id, req.body);

        if (!hangHoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạng hội viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hạng hội viên thành công',
            data: hangHoiVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật hạng hội viên',
            error: error.message
        });
    }
};

// Xóa hạng hội viên
const deleteHangHoiVien = async (req, res) => {
    try {
        const { id } = req.params;
        const hangHoiVien = await hangHoiVienService.deleteHangHoiVien(id);

        if (!hangHoiVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạng hội viên'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa hạng hội viên thành công',
            data: hangHoiVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hạng hội viên',
            error: error.message
        });
    }
};

// Tính toán hạng hội viên
const tinhHangHoiVien = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const hoiVien = await hangHoiVienService.tinhHangHoiVien(hoiVienId);

        res.status(200).json({
            success: true,
            message: 'Tính toán hạng hội viên thành công',
            data: hoiVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tính toán hạng hội viên',
            error: error.message
        });
    }
};

// Lấy thông tin hạng hội viên của một hội viên
const getHangHoiVienCuaHoiVien = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const data = await hangHoiVienService.getHangHoiVienCuaHoiVien(hoiVienId);

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin hạng hội viên',
            error: error.message
        });
    }
};

// Lấy danh sách hội viên theo hạng
const getHoiVienTheoHang = async (req, res) => {
    try {
        const { hangId } = req.params;
        const hoiViens = await hangHoiVienService.getHoiVienTheoHang(hangId);

        res.status(200).json({
            success: true,
            data: hoiViens
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách hội viên theo hạng',
            error: error.message
        });
    }
};

// Cập nhật hạng cho tất cả hội viên
const capNhatHangTatCaHoiVien = async (req, res) => {
    try {
        const results = await hangHoiVienService.capNhatHangTatCaHoiVien();

        res.status(200).json({
            success: true,
            message: 'Cập nhật hạng cho tất cả hội viên thành công',
            data: {
                soLuongCapNhat: results.length,
                results: results
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật hạng cho tất cả hội viên',
            error: error.message
        });
    }
};

// Lấy thống kê hạng hội viên
const getThongKeHangHoiVien = async (req, res) => {
    try {
        const stats = await hangHoiVienService.getThongKeHangHoiVien();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hạng hội viên',
            error: error.message
        });
    }
};

// Thêm endpoint tính hạng hội viên theo thời hạn
exports.tinhHangHoiVienTheoThoiHan = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await hangHoiVienService.tinhHangHoiVienTheoThoiHan(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm endpoint tính thời gian còn lại của hạng hội viên
exports.tinhThoiGianConLai = async (req, res) => {
    try {
        let userId = req.params.userId;
        // Validate userId as a valid ObjectId
        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'userId không hợp lệ' });
        }
        const result = await hangHoiVienService.tinhThoiGianConLai(userId);

        // Xử lý trường hợp có message (chưa có ngày hết hạn)
        if (result.message) {
            return res.status(200).json({
                success: true,
                data: result,
                message: result.message
            });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Lỗi tính thời gian còn lại:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm API cập nhật thời gian còn lại của hạng hội viên
exports.capNhatThoiGianConLai = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 14 } = req.body; // Lấy số ngày từ request body, mặc định 14 ngày

        const ngayHetHan = new Date();
        ngayHetHan.setDate(ngayHetHan.getDate() + days); // Cập nhật theo số ngày được chỉ định

        // Tìm HoiVien và cập nhật ngayHetHan
        const { HoiVien } = require('../models/NguoiDung');
        const user = await HoiVien.findByIdAndUpdate(userId, { ngayHetHan }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hội viên' });
        }

        res.status(200).json({ success: true, data: user, message: `Đã cập nhật thời hạn thành viên thêm ${days} ngày` });
    } catch (error) {
        console.error('Lỗi cập nhật thời gian còn lại:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createHangHoiVien,
    getAllHangHoiVien,
    getHangHoiVienById,
    updateHangHoiVien,
    deleteHangHoiVien,
    tinhHangHoiVien,
    getHangHoiVienCuaHoiVien,
    getHoiVienTheoHang,
    capNhatHangTatCaHoiVien,
    getThongKeHangHoiVien
};

// Add the exported functions to module.exports to make them available
module.exports.tinhHangHoiVienTheoThoiHan = exports.tinhHangHoiVienTheoThoiHan;
module.exports.tinhThoiGianConLai = exports.tinhThoiGianConLai;
module.exports.capNhatThoiGianConLai = exports.capNhatThoiGianConLai;
