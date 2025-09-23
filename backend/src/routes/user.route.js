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
router.put('/hoivien/:id', auth, authorize(['OngChu', 'HoiVien']), userController.updateHoiVien);
router.delete('/hoivien/:id', auth, authorize(['OngChu']), userController.deleteHoiVien);

// Check duplicate endpoints
router.post('/check-email', auth, userController.checkEmailExists);
router.post('/check-phone', auth, userController.checkPhoneExists);

// ✅ THÊM: Test endpoint để debug
router.put('/test-update/:id', auth, userController.testUpdate);
router.put('/test-flexible-update/:id', auth, userController.testFlexibleUpdate);
router.put('/restore-critical-data/:id', auth, userController.restoreCriticalData);
router.put('/taikhoan/:id/lock', auth, authorize(['OngChu']), userController.lockTaiKhoan);
router.put('/taikhoan/:id/unlock', auth, authorize(['OngChu']), userController.unlockTaiKhoan);
router.get('/taikhoan/by-phone/:sdt', auth, authorize(['OngChu']), userController.getTaiKhoanByPhone);

// CRUD PT (chỉ Ông Chủ)
router.post('/pt', auth, authorize(['OngChu']), userController.createPT);
router.get('/pt', auth, userController.getAllPT);
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

// Admin specific endpoints for member management
router.put('/hoivien/:id/status', auth, authorize(['OngChu']), userController.updateMemberStatus);

// PT specific endpoints
router.get('/pt/students', auth, authorize(['PT', 'OngChu']), userController.getPTStudents);

module.exports = router;