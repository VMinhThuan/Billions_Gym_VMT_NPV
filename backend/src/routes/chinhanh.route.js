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

module.exports = router;


