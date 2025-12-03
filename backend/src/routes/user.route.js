const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const goiTapController = require('../controllers/goitap.controller');
const chiTietGoiTapController = require('../controllers/chitietgoitap.controller');

// CRUD Hội Viên (chỉ Ông Chủ)
router.post('/hoivien', auth, authorize(['OngChu']), userController.createHoiVien);
router.get('/hoivien', auth, authorize(['OngChu']), userController.getAllHoiVien);
router.put('/hoivien/:id', auth, authorize(['OngChu',]), userController.updateHoiVien);
router.delete('/hoivien/:id', auth, authorize(['OngChu']), userController.deleteHoiVien);

// Kiểm tra email và số điện thoại
router.post('/check-email', auth, userController.checkEmailExists);
router.post('/check-phone', auth, userController.checkPhoneExists);

// CRUD Tài Khoản
router.put('/taikhoan/:id/lock', auth, authorize(['OngChu']), userController.lockTaiKhoan);
router.put('/taikhoan/:id/unlock', auth, authorize(['OngChu']), userController.unlockTaiKhoan);
router.get('/taikhoan/by-phone/:sdt', auth, authorize(['OngChu']), userController.getTaiKhoanByPhone);

// CRUD PT (chỉ Ông Chủ)
router.post('/pt', auth, authorize(['OngChu']), userController.createPT);
router.post('/pt/:id/account', auth, authorize(['OngChu']), userController.createPTAccount);
router.put('/pt/:id/reset-password', auth, authorize(['OngChu']), userController.resetPTPassword);
router.get('/pt', userController.getAllPT);
router.put('/pt/:id', auth, authorize(['OngChu']), userController.updatePT);
router.delete('/pt/:id', auth, authorize(['OngChu']), userController.deletePT);

// CRUD Gói Tập (chỉ Ông Chủ)
router.post('/goitap', auth, authorize(['OngChu']), goiTapController.createGoiTap);
router.get('/goitap', auth, goiTapController.getAllGoiTap);
router.put('/goitap/:id', auth, authorize(['OngChu']), goiTapController.updateGoiTap);
router.delete('/goitap/:id', auth, authorize(['OngChu']), goiTapController.deleteGoiTap);

// CRUD đăng ký gói tập (ChiTietGoiTap)
router.post('/chitietgoitap', auth, authorize(['OngChu', 'HoiVien']), chiTietGoiTapController.createChiTietGoiTap);
router.get('/chitietgoitap', auth, chiTietGoiTapController.getAllChiTietGoiTap);
router.put('/chitietgoitap/:id', auth, authorize(['OngChu', 'HoiVien']), chiTietGoiTapController.updateChiTietGoiTap);
router.delete('/chitietgoitap/:id', auth, authorize(['OngChu', 'HoiVien']), chiTietGoiTapController.deleteChiTietGoiTap);

router.get('/hoivien/:id', auth, authorize(['OngChu', 'HoiVien']), userController.getHoiVienById);
router.get('/pt/:id', auth, authorize(['OngChu', 'PT']), userController.getPTById);

// Cập nhật trạng thái hội viên
router.put('/hoivien/:id/status', auth, authorize(['OngChu']), userController.updateMemberStatus);

// Lấy danh sách học viên của PT
router.get('/pt/students', auth, authorize(['PT', 'OngChu']), userController.getPTStudents);

// Lấy hạng hội viên của người dùng
router.get('/:id/with-rank', auth, authorize(['OngChu', 'HoiVien']), userController.getUserWithRank);

router.get('/profile', auth, userController.getUserProfile);
router.put('/profile/edit', auth, userController.updateUserProfile);

module.exports = router;