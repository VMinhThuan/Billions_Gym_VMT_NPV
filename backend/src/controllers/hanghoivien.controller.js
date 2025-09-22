const hangHoiVienService = require('../services/hanghoivien.service');

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
