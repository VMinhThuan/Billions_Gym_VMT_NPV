const express = require('express');
const router = express.Router();
const baiTapController = require('../controllers/baitap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const { seedBaiTap } = require('../utils/seedBaiTap');

const allowedRoles = ['OngChu', 'PT'];

// Seed data route (only for development)
router.post('/seed', async (req, res) => {
    try {
        const exercises = await seedBaiTap();
        res.json({
            message: 'Seed bài tập thành công',
            count: exercises.length,
            exercises: exercises
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi seed bài tập', error: error.message });
    }
});

router.post('/', auth, authorize(allowedRoles), baiTapController.createBaiTap);
router.get('/', baiTapController.getAllBaiTap); // Remove auth requirement for getting exercises
router.get('/:id', baiTapController.getBaiTapById); // Remove auth requirement for getting exercise by id
router.put('/:id', auth, authorize(allowedRoles), baiTapController.updateBaiTap);
router.delete('/:id', auth, authorize(allowedRoles), baiTapController.deleteBaiTap);

module.exports = router;
