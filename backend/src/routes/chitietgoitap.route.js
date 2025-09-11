const express = require('express');
const router = express.Router();
const chiTietGoiTapController = require('../controllers/chitietgoitap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const hoiVien = ['HoiVien'];
const admin = ['OngChu'];
const ptAndAdmin = ['PT', 'OngChu'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Hội viên đăng ký gói tập
router.post('/dangky', auth, authorize(hoiVien), chiTietGoiTapController.dangkyGoiTap);

// Lấy danh sách đăng ký gói tập 
router.get('/', auth, authorize(ptAndAdmin), chiTietGoiTapController.getAllChiTietGoiTap);

// Lấy thông tin đăng ký gói tập của hội viên
router.get('/hoivien/:maHoiVien', auth, chiTietGoiTapController.getChiTietGoiTapByHoiVien);

// Cập nhật trạng thái thanh toán
router.put('/:id/thanhtoan', auth, authorize(ptAndAdmin), chiTietGoiTapController.updateTrangThaiThanhToan);

// Cập nhật thông tin đăng ký
router.put('/:id', auth, authorize(admin), chiTietGoiTapController.updateChiTietGoiTap);

// Hủy đăng ký gói tập
router.delete('/:id', auth, authorize(allUsers), chiTietGoiTapController.deleteChiTietGoiTap);

module.exports = router;
