const chiTietGoiTapService = require('../services/chitietgoitap.service');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const mongoose = require('mongoose');

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
        console.log('🔍 getAllChiTietGoiTap called');
        const filter = {};
        if (req.query.maHoiVien) filter.maHoiVien = req.query.maHoiVien;
        if (req.query.maGoiTap) filter.maGoiTap = req.query.maGoiTap;
        const ds = await chiTietGoiTapService.getAllChiTietGoiTap(filter);
        console.log('🔍 getAllChiTietGoiTap result:', ds.length, 'registrations');
        res.json(ds);
    } catch (err) {
        console.error('🔍 getAllChiTietGoiTap error:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getChiTietGoiTapById = async (req, res) => {
    try {
        console.log('🔍 getChiTietGoiTapById called with ID:', req.params.id);
        const chiTiet = await chiTietGoiTapService.getChiTietGoiTapById(req.params.id);
        console.log('🔍 getChiTietGoiTapById result:', chiTiet ? 'Found' : 'Not found');
        if (!chiTiet) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký gói tập' });
        }
        res.json({ success: true, data: chiTiet });
    } catch (err) {
        console.error('🔍 getChiTietGoiTapById error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
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

/**
 * Cập nhật chi nhánh trực tiếp (cho phép Hội viên xác nhận/đổi)
 */
exports.updateBranchDirect = async (id, branchId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(branchId)) return null;
    const reg = await ChiTietGoiTap.findById(id);
    if (!reg) return null;
    // Chỉ owner gói hoặc admin mới được đổi
    if (reg.nguoiDungId?.toString() !== userId) return null;
    reg.branchId = branchId;
    reg.thoiGianCapNhat = new Date();
    await reg.save();
    return await ChiTietGoiTap.findById(id).populate('branchId').populate('goiTapId');
};
