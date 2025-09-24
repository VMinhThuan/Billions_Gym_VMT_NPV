const express = require('express');
const router = express.Router();
const thanhToanController = require('../controllers/thanhtoan.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Routes cho hội viên
router.post('/', authMiddleware, thanhToanController.createThanhToan);
router.get('/my', authMiddleware, thanhToanController.getMyThanhToan);
router.post('/:id/cancel', authMiddleware, thanhToanController.cancelThanhToan);
router.get('/:id/can-edit', authMiddleware, thanhToanController.checkEditPermission);
router.get('/:id', authMiddleware, thanhToanController.getThanhToanById);

// Routes cho Ông Chủ
router.get('/', authMiddleware, roleMiddleware(['OngChu']), thanhToanController.getAllThanhToan);
router.post('/:id/confirm', authMiddleware, roleMiddleware(['OngChu']), thanhToanController.confirmThanhToan);
router.get('/hoivien/:hoiVienId', authMiddleware, roleMiddleware(['OngChu']), thanhToanController.getThanhToanByHoiVien);
router.get('/stats/summary', authMiddleware, roleMiddleware(['OngChu']), thanhToanController.getThanhToanStats);

module.exports = router;