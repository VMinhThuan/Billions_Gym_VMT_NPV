const lichSuTapService = require('../services/lichsutap.service');

exports.createLichSuTap = async (req, res) => {
    try {
        const maHoiVien = req.user.id;
        const lichSu = await lichSuTapService.createLichSuTap({
            ...req.body,
            hoiVien: maHoiVien
        });
        res.status(201).json({
            message: 'Ghi nhận lịch sử tập thành công',
            data: lichSu
        });
    } catch (err) {
        res.status(400).json({ message: 'Ghi nhận lịch sử tập thất bại', error: err.message });
    }
};

exports.getLichSuTapByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { startDate, endDate, limit = 20, page = 1 } = req.query;

        const lichSu = await lichSuTapService.getLichSuTapByHoiVien(maHoiVien, {
            startDate,
            endDate,
            limit: parseInt(limit),
            page: parseInt(page)
        });

        res.json(lichSu);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getThongKeTapLuyen = async (req, res) => {
    try {
        const maHoiVien = req.user.id;
        const { startDate, endDate } = req.query;

        const thongKe = await lichSuTapService.getThongKeTapLuyen(maHoiVien, {
            startDate,
            endDate
        });

        res.json(thongKe);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateLichSuTap = async (req, res) => {
    try {
        const lichSu = await lichSuTapService.updateLichSuTap(req.params.id, req.body);
        if (!lichSu) return res.status(404).json({ message: 'Không tìm thấy lịch sử tập' });
        res.json({
            message: 'Cập nhật lịch sử tập thành công',
            data: lichSu
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteLichSuTap = async (req, res) => {
    try {
        const lichSu = await lichSuTapService.deleteLichSuTap(req.params.id);
        if (!lichSu) return res.status(404).json({ message: 'Không tìm thấy lịch sử tập' });
        res.json({ message: 'Xóa lịch sử tập thành công' });
    } catch (err) {
        res.status(400).json({ message: 'Xóa thất bại', error: err.message });
    }
};
