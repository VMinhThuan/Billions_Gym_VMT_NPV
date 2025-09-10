const express = require('express');
const router = express.Router();
const baiTapController = require('../controllers/baitap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Chỉ Ông Chủ và PT mới được quản lý bài tập
const allowedRoles = ['OngChu', 'PT'];

router.post('/', auth, authorize(allowedRoles), baiTapController.createBaiTap);
router.get('/', auth, baiTapController.getAllBaiTap); // Mọi người dùng đã đăng nhập đều có thể xem
router.get('/:id', auth, baiTapController.getBaiTapById);
router.put('/:id', auth, authorize(allowedRoles), baiTapController.updateBaiTap);
router.delete('/:id', auth, authorize(allowedRoles), baiTapController.deleteBaiTap);

module.exports = router;
