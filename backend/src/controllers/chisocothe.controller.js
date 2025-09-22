const chiSoCoTheService = require('../services/chisocothe.service');
const mongoose = require('mongoose');

// Helper function để validate ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

exports.createChiSoCoThe = async (req, res) => {
    try {
        // Nếu là HoiVien, chỉ được tạo cho chính mình
        if (req.user.vaiTro === 'HoiVien') {
            req.body.hoiVien = req.user.id;
        }

        const chiSoCoThe = await chiSoCoTheService.createChiSoCoThe(req.body);
        res.status(201).json({
            message: 'Tạo chỉ số cơ thể thành công',
            data: chiSoCoThe
        });
    } catch (err) {
        res.status(400).json({ message: 'Tạo chỉ số cơ thể thất bại', error: err.message });
    }
};

exports.getAllChiSoCoThe = async (req, res) => {
    try {
        const filters = req.query;

        // Nếu là HoiVien, chỉ xem được chỉ số của mình
        if (req.user.vaiTro === 'HoiVien') {
            filters.hoiVien = req.user.id;
        }

        const chiSoCoThes = await chiSoCoTheService.getAllChiSoCoThe(filters);
        res.json({
            message: 'Lấy danh sách chỉ số cơ thể thành công',
            data: chiSoCoThes,
            total: chiSoCoThes.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getChiSoCoTheById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID chỉ số cơ thể không hợp lệ' });
        }

        const chiSoCoThe = await chiSoCoTheService.getChiSoCoTheById(id);
        if (!chiSoCoThe) {
            return res.status(404).json({ message: 'Không tìm thấy chỉ số cơ thể' });
        }

        // Nếu là HoiVien, chỉ xem được chỉ số của mình
        if (req.user.vaiTro === 'HoiVien' && chiSoCoThe.hoiVien._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền xem chỉ số này' });
        }

        res.json({
            message: 'Lấy thông tin chỉ số cơ thể thành công',
            data: chiSoCoThe
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getChiSoCoTheByHoiVien = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const { limit } = req.query;

        if (!isValidObjectId(hoiVienId)) {
            return res.status(400).json({ message: 'ID hội viên không hợp lệ' });
        }

        // Nếu là HoiVien, chỉ xem được chỉ số của mình
        if (req.user.vaiTro === 'HoiVien' && hoiVienId !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền xem chỉ số của hội viên khác' });
        }

        const chiSoCoThes = await chiSoCoTheService.getChiSoCoTheByHoiVien(hoiVienId, limit ? parseInt(limit) : null);
        res.json({
            message: 'Lấy chỉ số cơ thể của hội viên thành công',
            data: chiSoCoThes,
            total: chiSoCoThes.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getLatestChiSoByHoiVien = async (req, res) => {
    try {
        const { hoiVienId } = req.params;

        if (!isValidObjectId(hoiVienId)) {
            return res.status(400).json({ message: 'ID hội viên không hợp lệ' });
        }

        // Nếu là HoiVien, chỉ xem được chỉ số của mình
        if (req.user.vaiTro === 'HoiVien' && hoiVienId !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền xem chỉ số của hội viên khác' });
        }

        const chiSoCoThe = await chiSoCoTheService.getLatestChiSoByHoiVien(hoiVienId);
        if (!chiSoCoThe) {
            return res.status(404).json({ message: 'Chưa có chỉ số cơ thể nào' });
        }

        res.json({
            message: 'Lấy chỉ số cơ thể mới nhất thành công',
            data: chiSoCoThe
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateChiSoCoThe = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID chỉ số cơ thể không hợp lệ' });
        }

        // Kiểm tra quyền sở hữu nếu là HoiVien
        if (req.user.vaiTro === 'HoiVien') {
            const existingChiSo = await chiSoCoTheService.getChiSoCoTheById(id);
            if (!existingChiSo || existingChiSo.hoiVien._id.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Không có quyền cập nhật chỉ số này' });
            }
            // HoiVien không được thay đổi field hoiVien
            delete req.body.hoiVien;
        }

        const chiSoCoThe = await chiSoCoTheService.updateChiSoCoThe(id, req.body);
        res.json({
            message: 'Cập nhật chỉ số cơ thể thành công',
            data: chiSoCoThe
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật chỉ số cơ thể thất bại', error: err.message });
    }
};

exports.deleteChiSoCoThe = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID chỉ số cơ thể không hợp lệ' });
        }

        // Kiểm tra quyền sở hữu nếu là HoiVien
        if (req.user.vaiTro === 'HoiVien') {
            const existingChiSo = await chiSoCoTheService.getChiSoCoTheById(id);
            if (!existingChiSo || existingChiSo.hoiVien._id.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Không có quyền xóa chỉ số này' });
            }
        }

        const chiSoCoThe = await chiSoCoTheService.deleteChiSoCoThe(id);
        res.json({
            message: 'Xóa chỉ số cơ thể thành công',
            data: chiSoCoThe
        });
    } catch (err) {
        res.status(400).json({ message: 'Xóa chỉ số cơ thể thất bại', error: err.message });
    }
};

exports.getThongKeChiSo = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const { soLanGanNhat } = req.query;

        if (!isValidObjectId(hoiVienId)) {
            return res.status(400).json({ message: 'ID hội viên không hợp lệ' });
        }

        // Nếu là HoiVien, chỉ xem được thống kê của mình
        if (req.user.vaiTro === 'HoiVien' && hoiVienId !== req.user.id) {
            return res.status(403).json({ message: 'Không có quyền xem thống kê của hội viên khác' });
        }

        const thongKe = await chiSoCoTheService.getThongKeChiSo(
            hoiVienId,
            soLanGanNhat ? parseInt(soLanGanNhat) : 10
        );

        res.json({
            message: 'Lấy thống kê chỉ số cơ thể thành công',
            data: thongKe
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getMyChiSoCoThe = async (req, res) => {
    try {
        // API dành riêng cho HoiVien xem chỉ số của mình
        const chiSoCoThes = await chiSoCoTheService.getChiSoCoTheByHoiVien(req.user.id);
        res.json({
            message: 'Lấy chỉ số cơ thể của tôi thành công',
            data: chiSoCoThes,
            total: chiSoCoThes.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getMyLatestChiSo = async (req, res) => {
    try {
        // API dành riêng cho HoiVien xem chỉ số mới nhất của mình
        const chiSoCoThe = await chiSoCoTheService.getLatestChiSoByHoiVien(req.user.id);

        res.json({
            message: chiSoCoThe ? 'Lấy chỉ số cơ thể mới nhất thành công' : 'Chưa có chỉ số cơ thể nào',
            data: chiSoCoThe || null
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getMyThongKeChiSo = async (req, res) => {
    try {
        const { soLanGanNhat } = req.query;

        // API dành riêng cho HoiVien xem thống kê của mình
        const thongKe = await chiSoCoTheService.getThongKeChiSo(
            req.user.id,
            soLanGanNhat ? parseInt(soLanGanNhat) : 10
        );

        res.json({
            message: 'Lấy thống kê chỉ số cơ thể của tôi thành công',
            data: thongKe
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
