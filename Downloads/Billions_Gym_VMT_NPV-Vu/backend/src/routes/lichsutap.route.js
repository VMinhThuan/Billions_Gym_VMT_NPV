const express = require('express');
const router = express.Router();
const lichSuTapController = require('../controllers/lichsutap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Quyền truy cập
const hoiVien = ['HoiVien'];
const ptAndAdmin = ['PT', 'OngChu'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Hội viên ghi nhận lịch sử tập
router.post('/', auth, authorize(hoiVien), lichSuTapController.createLichSuTap);

// Lấy lịch sử tập của hội viên 
router.get('/hoivien/:maHoiVien', auth, lichSuTapController.getLichSuTapByHoiVien);

// Hội viên xem thống kê tập luyện của mình
router.get('/thongke', auth, authorize(hoiVien), lichSuTapController.getThongKeTapLuyen);

// Cập nhật lịch sử tập
router.put('/:id', auth, authorize(allUsers), lichSuTapController.updateLichSuTap);

// Xóa lịch sử tập
router.delete('/:id', auth, authorize(allUsers), lichSuTapController.deleteLichSuTap);

module.exports = router;
