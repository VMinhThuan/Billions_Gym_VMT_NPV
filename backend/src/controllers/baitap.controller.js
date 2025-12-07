const baiTapService = require('../services/baitap.service');

exports.createBaiTap = async (req, res) => {
    try {
        const baiTap = await baiTapService.createBaiTap(req.body);
        res.status(201).json(baiTap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllBaiTap = async (req, res) => {
    try {
        console.log('📋 getAllBaiTap - Request received');
        const baiTaps = await baiTapService.getAllBaiTap();
        console.log(`📋 getAllBaiTap - Returning ${baiTaps.length} exercises`);
        res.json(baiTaps);
    } catch (err) {
        console.error('📋 getAllBaiTap - Error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.getBaiTapById = async (req, res) => {
    try {
        const baiTap = await baiTapService.getBaiTapById(req.params.id);
        res.json(baiTap);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.updateBaiTap = async (req, res) => {
    try {
        const baiTap = await baiTapService.updateBaiTap(req.params.id, req.body);
        res.json(baiTap);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteBaiTap = async (req, res) => {
    try {
        const result = await baiTapService.deleteBaiTap(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};
