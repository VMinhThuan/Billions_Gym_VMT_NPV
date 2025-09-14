const lichHenPTService = require('../services/lichhenpt.service');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

exports.createLichHenPT = async (req, res) => {
    try {
        const lichHenPT = await lichHenPTService.createLichHenPT(req.body);
        res.status(201).json({
            message: 'Tạo lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(400).json({ message: 'Tạo lịch hẹn PT thất bại', error: err.message });
    }
};

exports.getAllLichHenPT = async (req, res) => {
    try {
        const filters = req.query;
        const lichHenPTs = await lichHenPTService.getAllLichHenPT(filters);
        res.json({
            message: 'Lấy danh sách lịch hẹn PT thành công',
            data: lichHenPTs,
            total: lichHenPTs.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getLichHenPTById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID lịch hẹn không hợp lệ' });
        }

        const lichHenPT = await lichHenPTService.getLichHenPTById(id);
        if (!lichHenPT) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn PT' });
        }

        res.json({
            message: 'Lấy thông tin lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getLichHenPTByHoiVien = async (req, res) => {
    try {
        const { hoiVienId } = req.params;
        const { trangThai } = req.query;

        if (!isValidObjectId(hoiVienId)) {
            return res.status(400).json({ message: 'ID hội viên không hợp lệ' });
        }

        const lichHenPTs = await lichHenPTService.getLichHenPTByHoiVien(hoiVienId, trangThai);
        res.json({
            message: 'Lấy lịch hẹn PT của hội viên thành công',
            data: lichHenPTs,
            total: lichHenPTs.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.getLichHenPTByPT = async (req, res) => {
    try {
        const { ptId } = req.params;
        const { trangThai } = req.query;

        if (!isValidObjectId(ptId)) {
            return res.status(400).json({ message: 'ID PT không hợp lệ' });
        }

        const lichHenPTs = await lichHenPTService.getLichHenPTByPT(ptId, trangThai);
        res.json({
            message: 'Lấy lịch hẹn của PT thành công',
            data: lichHenPTs,
            total: lichHenPTs.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.updateLichHenPT = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID lịch hẹn không hợp lệ' });
        }

        const lichHenPT = await lichHenPTService.updateLichHenPT(id, req.body);
        res.json({
            message: 'Cập nhật lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(400).json({ message: 'Cập nhật lịch hẹn PT thất bại', error: err.message });
    }
};

exports.xacNhanLichHenPT = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID lịch hẹn không hợp lệ' });
        }

        const lichHenPT = await lichHenPTService.xacNhanLichHenPT(id);
        res.json({
            message: 'Xác nhận lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(400).json({ message: 'Xác nhận lịch hẹn PT thất bại', error: err.message });
    }
};

exports.huyLichHenPT = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID lịch hẹn không hợp lệ' });
        }

        const lichHenPT = await lichHenPTService.huyLichHenPT(id);
        res.json({
            message: 'Hủy lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(400).json({ message: 'Hủy lịch hẹn PT thất bại', error: err.message });
    }
};

exports.hoanThanhLichHenPT = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID lịch hẹn không hợp lệ' });
        }

        const lichHenPT = await lichHenPTService.hoanThanhLichHenPT(id);
        res.json({
            message: 'Hoàn thành lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(400).json({ message: 'Hoàn thành lịch hẹn PT thất bại', error: err.message });
    }
};

exports.deleteLichHenPT = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID lịch hẹn không hợp lệ' });
        }

        const lichHenPT = await lichHenPTService.deleteLichHenPT(id);
        res.json({
            message: 'Xóa lịch hẹn PT thành công',
            data: lichHenPT
        });
    } catch (err) {
        res.status(400).json({ message: 'Xóa lịch hẹn PT thất bại', error: err.message });
    }
};
