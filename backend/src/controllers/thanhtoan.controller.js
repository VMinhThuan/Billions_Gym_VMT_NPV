const thanhToanService = require('../services/thanhtoan.service');

/**
 * Tạo thanh toán mới
 */
exports.createThanhToan = async (req, res) => {
    try {
        const { maChiTietGoiTap, phuongThuc, noiDung } = req.body;
        const hoiVien = req.user.id; // Lấy từ token

        const thanhToan = await thanhToanService.createThanhToan({
            hoiVien,
            maChiTietGoiTap,
            phuongThuc,
            noiDung
        });

        res.status(201).json({
            message: 'Tạo thanh toán thành công',
            data: thanhToan
        });
    } catch (error) {
        res.status(400).json({
            message: 'Tạo thanh toán thất bại',
            error: error.message
        });
    }
};

/**
 * Xác nhận thanh toán (chỉ admin)
 */
exports.confirmThanhToan = async (req, res) => {
    try {
        const { id } = req.params;
        const thanhToan = await thanhToanService.confirmThanhToan(id);

        res.json({
            message: 'Xác nhận thanh toán thành công',
            data: thanhToan
        });
    } catch (error) {
        if (error.code === 'PAYMENT_LOCKED') {
            return res.status(403).json({
                message: 'Thanh toán đã bị khóa',
                error: error.message
            });
        }

        res.status(400).json({
            message: 'Xác nhận thanh toán thất bại',
            error: error.message
        });
    }
};

/**
 * Lấy tất cả thanh toán (admin)
 */
exports.getAllThanhToan = async (req, res) => {
    try {
        const filter = {};
        if (req.query.hoiVien) filter.hoiVien = req.query.hoiVien;
        if (req.query.trangThaiThanhToan) filter.trangThaiThanhToan = req.query.trangThaiThanhToan;

        const thanhToans = await thanhToanService.getAllThanhToan(filter);
        res.json(thanhToans);
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * Lấy thanh toán theo ID
 */
exports.getThanhToanById = async (req, res) => {
    try {
        const { id } = req.params;
        const thanhToan = await thanhToanService.getThanhToanById(id);

        if (!thanhToan) {
            return res.status(404).json({
                message: 'Không tìm thấy thông tin thanh toán'
            });
        }

        res.json(thanhToan);
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * Lấy lịch sử thanh toán của hội viên
 */
exports.getMyThanhToan = async (req, res) => {
    try {
        const hoiVienId = req.user.id;
        const thanhToans = await thanhToanService.getThanhToanByHoiVien(hoiVienId);
        res.json(thanhToans);
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * Lấy lịch sử thanh toán của hội viên cụ thể (admin)
 */
exports.getThanhToanByHoiVien = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const thanhToans = await thanhToanService.getThanhToanByHoiVien(hoiVienId);
        res.json(thanhToans);
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * Hủy thanh toán
 */
exports.cancelThanhToan = async (req, res) => {
    try {
        const { id } = req.params;
        const { lyDo } = req.body;

        // Kiểm tra quyền: chỉ admin hoặc chủ thanh toán mới được hủy
        const thanhToan = await thanhToanService.getThanhToanById(id);
        if (!thanhToan) {
            return res.status(404).json({
                message: 'Không tìm thấy thông tin thanh toán'
            });
        }

        if (req.user.role !== 'ADMIN' && thanhToan.hoiVien._id.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Không có quyền hủy thanh toán này'
            });
        }

        const canceledThanhToan = await thanhToanService.cancelThanhToan(id, lyDo);

        res.json({
            message: 'Hủy thanh toán thành công',
            data: canceledThanhToan
        });
    } catch (error) {
        res.status(400).json({
            message: 'Hủy thanh toán thất bại',
            error: error.message
        });
    }
};

/**
 * Kiểm tra khả năng chỉnh sửa thanh toán
 */
exports.checkEditPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const canEdit = await thanhToanService.canEditThanhToan(id);

        res.json({
            canEdit,
            message: canEdit ? 'Có thể chỉnh sửa' : 'Không thể chỉnh sửa thanh toán đã hoàn thành'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
};

/**
 * Thống kê thanh toán
 */
exports.getThanhToanStats = async (req, res) => {
    try {
        const stats = await thanhToanService.getAllThanhToan();

        const summary = {
            total: stats.length,
            thanhCong: stats.filter(t => t.trangThaiThanhToan === 'THANH_CONG').length,
            dangXuLy: stats.filter(t => t.trangThaiThanhToan === 'DANG_XU_LY').length,
            thatBai: stats.filter(t => t.trangThaiThanhToan === 'THAT_BAI').length,
            tongTien: stats
                .filter(t => t.trangThaiThanhToan === 'THANH_CONG')
                .reduce((sum, t) => sum + t.soTien, 0)
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
};