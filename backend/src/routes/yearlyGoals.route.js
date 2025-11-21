const express = require('express');
const router = express.Router();
const yearlyGoalsController = require('../controllers/yearlyGoals.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// GET /api/yearly-goals/current - Lấy mục tiêu năm hiện tại
router.get('/current', auth, authorize(['OngChu', 'Admin']), yearlyGoalsController.getCurrentYearGoals);

// PUT /api/yearly-goals/current - Cập nhật mục tiêu năm hiện tại
router.put('/current', auth, authorize(['OngChu', 'Admin']), yearlyGoalsController.updateYearlyGoals);

// GET /api/yearly-goals/all - Lấy tất cả mục tiêu các năm
router.get('/all', auth, authorize(['OngChu', 'Admin']), yearlyGoalsController.getAllYearlyGoals);

module.exports = router;

