const express = require('express');
const router = express.Router();
const buoiTapController = require('../controllers/buoitap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const BuoiTap = require('../models/BuoiTap');
const LichTap = require('../models/LichTap');

const hoiVien = ['HoiVien'];
const ptAndAdmin = ['PT', 'OngChu'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Tạo buổi tập mới (chỉ PT và admin)
router.post('/', auth, authorize(ptAndAdmin), buoiTapController.createBuoiTap);

// Thêm bài tập vào buổi tập 
router.post('/:buoiTapId/baitap', auth, authorize(ptAndAdmin), buoiTapController.addBaiTapToBuoiTap);

// Xóa bài tập khỏi buổi tập 
router.delete('/:buoiTapId/baitap/:baiTapId', auth, authorize(ptAndAdmin), buoiTapController.removeBaiTapFromBuoiTap);

// Lấy tất cả buổi tập 
router.get('/', auth, authorize(allUsers), buoiTapController.getAllBuoiTap);

// Lấy danh sách buổi tập của hội viên 
router.get('/hoivien/:maHoiVien', auth, buoiTapController.getBuoiTapByHoiVien);

// Hội viên đánh dấu hoàn thành buổi tập 
router.put('/:id/hoanthanh', auth, authorize(hoiVien), buoiTapController.hoanThanhBuoiTap);

// Lấy chi tiết buổi tập
router.get('/:id', auth, authorize(allUsers), buoiTapController.getBuoiTapById);

// Cập nhật buổi tập (chỉ PT và admin)
router.put('/:id', auth, authorize(ptAndAdmin), buoiTapController.updateBuoiTap);

// Xóa buổi tập (chỉ PT và admin)
router.delete('/:id', auth, authorize(ptAndAdmin), buoiTapController.deleteBuoiTap);

module.exports = router;
