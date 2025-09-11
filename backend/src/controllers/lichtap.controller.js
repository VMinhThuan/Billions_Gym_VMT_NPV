const lichTapService = require('../services/lichtap.service');

exports.createLichTap = async (req, res) => {
    try {
        const lichTap = await lichTapService.createLichTap(req.body);
        res.status(201).json(lichTap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getLichTapByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const lichTap = await lichTapService.getLichTapByHoiVien(maHoiVien);
        res.json(lichTap);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.addBuoiTap = async (req, res) => {
    try {
        const { lichTapId } = req.params;
        const buoiTap = await lichTapService.addBuoiTap(lichTapId, req.body);
        res.status(201).json(buoiTap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateBuoiTap = async (req, res) => {
    try {
        const { buoiTapId } = req.params;
        const buoiTap = await lichTapService.updateBuoiTap(buoiTapId, req.body);
        res.json(buoiTap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteBuoiTap = async (req, res) => {
    try {
        const { lichTapId, buoiTapId } = req.params;
        const result = await lichTapService.deleteBuoiTap(lichTapId, buoiTapId);
        res.json(result);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};