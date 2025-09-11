const buoiTapService = require('../services/buoitap.service');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

exports.createBuoiTap = async (req, res) => {
    try {
        const buoiTap = await buoiTapService.createBuoiTap(req.body);
        res.status(201).json({
            message: 'Tạo buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Tạo buổi tập thất bại', error: err.message });
    }
};

exports.getBuoiTapById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        const buoiTap = await buoiTapService.getBuoiTapById(id);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json(buoiTap);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getBuoiTapByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { trangThai } = req.query;

        if (!isValidObjectId(maHoiVien)) {
            return res.status(400).json({ message: 'ID hội viên không hợp lệ' });
        }

        const buoiTaps = await buoiTapService.getBuoiTapByHoiVien(maHoiVien, trangThai);
        res.json(buoiTaps);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getAllBuoiTap = async (req, res) => {
    try {
        const { trangThai } = req.query;
        const buoiTaps = await buoiTapService.getAllBuoiTap(trangThai);
        res.json(buoiTaps);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateBuoiTap = async (req, res) => {
    try {
        const buoiTap = await buoiTapService.updateBuoiTap(req.params.id, req.body);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json({
            message: 'Cập nhật buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.hoanThanhBuoiTap = async (req, res) => {
    try {
        const maHoiVien = req.user.id;
        const buoiTap = await buoiTapService.hoanThanhBuoiTap(req.params.id, maHoiVien);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json({
            message: 'Hoàn thành buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

exports.deleteBuoiTap = async (req, res) => {
    try {
        const buoiTap = await buoiTapService.deleteBuoiTap(req.params.id);
        if (!buoiTap) return res.status(404).json({ message: 'Không tìm thấy buổi tập' });
        res.json({ message: 'Xóa buổi tập thành công' });
    } catch (err) {
        res.status(400).json({ message: 'Xóa thất bại', error: err.message });
    }
};

exports.addBaiTapToBuoiTap = async (req, res) => {
    try {
        const { buoiTapId } = req.params;
        const { maBaiTap, soLanLap, soSet, trongLuong, thoiGianNghi } = req.body;

        if (!isValidObjectId(buoiTapId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (maBaiTap && !isValidObjectId(maBaiTap)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const buoiTap = await buoiTapService.addBaiTapToBuoiTap(buoiTapId, {
            maBaiTap,
            soLanLap,
            soSet,
            trongLuong,
            thoiGianNghi
        });

        res.json({
            message: 'Thêm bài tập vào buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        res.status(400).json({ message: 'Thêm bài tập thất bại', error: err.message });
    }
};

exports.removeBaiTapFromBuoiTap = async (req, res) => {
    try {
        const { buoiTapId, baiTapId } = req.params;

        console.log('Xóa bài tập:', { buoiTapId, baiTapId });

        if (!isValidObjectId(buoiTapId)) {
            return res.status(400).json({ message: 'ID buổi tập không hợp lệ' });
        }

        if (!isValidObjectId(baiTapId)) {
            return res.status(400).json({ message: 'ID bài tập không hợp lệ' });
        }

        const buoiTap = await buoiTapService.removeBaiTapFromBuoiTap(buoiTapId, baiTapId);

        res.json({
            message: 'Xóa bài tập khỏi buổi tập thành công',
            data: buoiTap
        });
    } catch (err) {
        console.error('Lỗi xóa bài tập:', err);
        res.status(400).json({ message: 'Xóa bài tập thất bại', error: err.message });
    }
};
