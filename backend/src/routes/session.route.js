const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Tạo buổi tập (OngChu)
router.post('/', auth, authorize(['OngChu']), sessionController.create);

// Lấy buổi theo tuần/khoảng ngày
router.get('/', auth, authorize(['OngChu', 'PT']), sessionController.byWeek);

// Đăng ký / hủy đăng ký slot (cho phép PT/OngChu điều phối)
router.post('/:id/register', auth, authorize(['OngChu', 'PT']), sessionController.register);
router.post('/:id/unregister', auth, authorize(['OngChu', 'PT']), sessionController.unregister);

// Cập nhật / xóa
router.put('/:id', auth, authorize(['OngChu']), sessionController.update);
router.delete('/:id', auth, authorize(['OngChu']), sessionController.delete);

module.exports = router;


