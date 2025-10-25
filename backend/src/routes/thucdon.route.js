const express = require('express');
const router = express.Router();
const thucdonController = require('../controllers/thucdon.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// GET /api/thucdon/healthy-meals - Lấy danh sách bữa ăn lành mạnh
router.get('/healthy-meals', thucdonController.getHealthyMeals);

module.exports = router;
