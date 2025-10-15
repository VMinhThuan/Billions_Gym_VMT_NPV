const express = require('express');
const ChiNhanh = require('../models/ChiNhanh');

const router = express.Router();

// GET /api/chinhanh?lat=..&lng=..&limit=..
router.get('/', async (req, res) => {
    try {
        const { lat, lng, limit = 50 } = req.query;

        let branches;
        if (lat && lng) {
            branches = await ChiNhanh.aggregate([
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                        distanceField: 'distance',
                        spherical: true,
                    },
                },
                { $limit: Number(limit) },
            ]);
        } else {
            branches = await ChiNhanh.find().sort({ thuTu: 1, createdAt: -1 }).limit(Number(limit));
        }

        res.json({ success: true, data: branches });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH: bulk set images for branches (admin-only in real app)
router.patch('/set-images', async (req, res) => {
    try {
        const { idToImage } = req.body || {};
        if (!idToImage || typeof idToImage !== 'object') {
            return res.status(400).json({ success: false, message: 'Thiếu idToImage mapping' });
        }
        const ids = Object.keys(idToImage);
        let updated = 0;
        for (const id of ids) {
            const img = idToImage[id];
            const doc = await ChiNhanh.findByIdAndUpdate(id, { hinhAnh: img }, { new: true });
            if (doc) updated++;
        }
        return res.json({ success: true, message: `Đã cập nhật ${updated} chi nhánh`, updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH: auto assign images cn-1.png..cn-N.png to first N branches ordered by thuTu
router.patch('/auto-assign-images', async (req, res) => {
    try {
        const count = Math.max(1, Math.min(Number(req.query.count || 10), 100));
        const prefix = req.body?.prefix || '/branches/';
        const branches = await ChiNhanh.find().sort({ thuTu: 1, createdAt: 1 }).limit(count);
        let updated = 0;
        for (let i = 0; i < branches.length; i++) {
            const filename = `${prefix}cn-${i + 1}.png`;
            const doc = await ChiNhanh.findByIdAndUpdate(branches[i]._id, { hinhAnh: filename }, { new: true });
            if (doc) updated++;
        }
        return res.json({ success: true, message: `Đã gán ${updated} ảnh`, updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;



