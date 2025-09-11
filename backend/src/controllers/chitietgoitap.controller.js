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
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteChiTietGoiTap = async (req, res) => {
    try {
        const chiTiet = await chiTietGoiTapService.deleteChiTietGoiTap(req.params.id);
        if (!chiTiet) return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        res.json({ message: 'Xóa đăng ký gói tập thành công' });
    } catch (err) {
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
        const chiTiet = await chiTietGoiTapService.updateChiTietGoiTap(req.params.id, {
            trangThaiThanhToan
        });
        if (!chiTiet) return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        res.json({
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: chiTiet
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};
