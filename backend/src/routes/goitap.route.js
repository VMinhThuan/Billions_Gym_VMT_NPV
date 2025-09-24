const express = require('express');
const router = express.Router();
const goiTapController = require('../controllers/goitap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const admin = ['OngChu'];

// Lấy tất cả gói tập
router.get('/', goiTapController.getAllGoiTap);

// Lấy gói tháng
router.get('/monthly', goiTapController.getMonthlyPackages);

// Lấy gói theo đơn vị thời gian
router.get('/time-unit/:donViThoiHan', goiTapController.getPackagesByTimeUnit);

// Lấy chi tiết gói tập theo ID
router.get('/:id', goiTapController.getGoiTapById);

router.post('/', auth, authorize(admin), goiTapController.createGoiTap);
router.put('/:id', auth, authorize(admin), goiTapController.updateGoiTap);
router.delete('/:id', auth, authorize(admin), goiTapController.deleteGoiTap);

module.exports = router;
