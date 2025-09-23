const chiTietGoiTapService = require('../services/chitietgoitap.service');

exports.dangkyGoiTap = async (req, res) => {
    try {
        const maHoiVien = req.user.id;
        const { maGoiTap } = req.body;

        const chiTiet = await chiTietGoiTapService.createChiTietGoiTap({
            maHoiVien,
            maGoiTap
        });
        res.status(201).json({
            message: 'Đăng ký gói tập thành công',
            data: chiTiet
        });
    } catch (err) {
        res.status(400).json({ message: 'Đăng ký gói tập thất bại', error: err.message });
    }
};

exports.createChiTietGoiTap = async (req, res) => {
    try {
        const chiTiet = await chiTietGoiTapService.createChiTietGoiTap(req.body);
        res.status(201).json(chiTiet);
    } catch (err) {
        res.status(400).json({ message: 'Đăng ký gói tập thất bại', error: err.message });
    }
};

exports.getAllChiTietGoiTap = async (req, res) => {
    try {
        const filter = {};
        if (req.query.maHoiVien) filter.maHoiVien = req.query.maHoiVien;
        if (req.query.maGoiTap) filter.maGoiTap = req.query.maGoiTap;
        const ds = await chiTietGoiTapService.getAllChiTietGoiTap(filter);
        res.json(ds);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateChiTietGoiTap = async (req, res) => {
    try {
        const chiTiet = await chiTietGoiTapService.updateChiTietGoiTap(req.params.id, req.body);
        if (!chiTiet) return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        res.json(chiTiet);
    } catch (err) {
        if (err.message.includes('khóa') || err.message.includes('thanh toán')) {
            return res.status(403).json({ message: err.message, code: 'REGISTRATION_LOCKED' });
        }
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteChiTietGoiTap = async (req, res) => {
    try {
        const chiTiet = await chiTietGoiTapService.deleteChiTietGoiTap(req.params.id);
        if (!chiTiet) return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        res.json({ message: 'Xóa đăng ký gói tập thành công' });
    } catch (err) {
        if (err.message.includes('khóa') || err.message.includes('thanh toán')) {
            return res.status(403).json({ message: err.message, code: 'REGISTRATION_LOCKED' });
        }
        res.status(400).json({ message: 'Xóa thất bại', error: err.message });
    }
};

exports.getChiTietGoiTapByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const chiTiet = await chiTietGoiTapService.getChiTietGoiTapByHoiVien(maHoiVien);
        res.json(chiTiet);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateTrangThaiThanhToan = async (req, res) => {
    try {
        const { trangThaiThanhToan } = req.body;

        // Chỉ cho phép admin cập nhật trạng thái thanh toán
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
        }

        const chiTiet = await chiTietGoiTapService.updateChiTietGoiTap(req.params.id, {
            trangThaiThanhToan
        });
        if (!chiTiet) return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        res.json({
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: chiTiet
        });
    } catch (err) {
        if (err.message.includes('khóa') || err.message.includes('thanh toán')) {
            return res.status(403).json({ message: err.message, code: 'REGISTRATION_LOCKED' });
        }
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

/**
 * Kiểm tra khả năng chỉnh sửa đăng ký gói tập
 */
exports.checkEditPermission = async (req, res) => {
    try {
        const canEdit = await chiTietGoiTapService.canEditChiTietGoiTap(req.params.id);
        res.json({
            canEdit,
            message: canEdit ? 'Có thể chỉnh sửa' : 'Không thể chỉnh sửa đăng ký đã thanh toán'
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

/**
 * Lấy thống kê đăng ký gói tập
 */
exports.getStats = async (req, res) => {
    try {
        const stats = await chiTietGoiTapService.getChiTietGoiTapStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
