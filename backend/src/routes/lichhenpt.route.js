const express = require('express');
const router = express.Router();
const lichHenPTController = require('../controllers/lichhenpt.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// CRUD Lịch hẹn PT
router.post('/', auth, authorize(['HoiVien', 'OngChu']), lichHenPTController.createLichHenPT);
router.get('/', auth, lichHenPTController.getAllLichHenPT);
router.get('/:id', auth, lichHenPTController.getLichHenPTById);
router.put('/:id', auth, authorize(['HoiVien', 'PT', 'OngChu']), lichHenPTController.updateLichHenPT);
router.delete('/:id', auth, authorize(['HoiVien', 'PT', 'OngChu']), lichHenPTController.deleteLichHenPT);

// Lịch hẹn theo hội viên
router.get('/hoivien/:hoiVienId', auth, lichHenPTController.getLichHenPTByHoiVien);

// Lịch hẹn của PT hiện tại (phải đặt trước route với parameter)
router.get('/pt/my', auth, authorize(['PT', 'OngChu', 'HoiVien']), lichHenPTController.getMyPTBookings);

// Lịch hẹn theo PT
router.get('/pt/:ptId', auth, lichHenPTController.getLichHenPTByPT);

// Xác nhận lịch hẹn (chỉ PT và Ông Chủ)
router.put('/:id/xacnhan', auth, authorize(['PT', 'OngChu']), lichHenPTController.xacNhanLichHenPT);

// Hủy lịch hẹn
router.put('/:id/huy', auth, authorize(['HoiVien', 'PT', 'OngChu']), lichHenPTController.huyLichHenPT);

// Hoàn thành lịch hẹn (chỉ PT và Ông Chủ)
router.put('/:id/hoanthanh', auth, authorize(['PT', 'OngChu']), lichHenPTController.hoanThanhLichHenPT);

module.exports = router;
