const express = require('express');
const router = express.Router();
const chiSoCoTheController = require('../controllers/chisocothe.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// API dành cho HoiVien tự quản lý chỉ số của mình
router.get('/my', auth, authorize(['HoiVien']), chiSoCoTheController.getMyChiSoCoThe);
router.get('/my/latest', auth, authorize(['HoiVien']), chiSoCoTheController.getMyLatestChiSo);
router.get('/my/thongke', auth, authorize(['HoiVien']), chiSoCoTheController.getMyThongKeChiSo);

// CRUD Chỉ số cơ thể
router.post('/', auth, authorize(['HoiVien', 'PT', 'OngChu']), chiSoCoTheController.createChiSoCoThe);
router.get('/', auth, authorize(['PT', 'OngChu']), chiSoCoTheController.getAllChiSoCoThe);
router.get('/:id', auth, chiSoCoTheController.getChiSoCoTheById);
router.put('/:id', auth, authorize(['HoiVien', 'PT', 'OngChu']), chiSoCoTheController.updateChiSoCoThe);
router.delete('/:id', auth, authorize(['HoiVien', 'PT', 'OngChu']), chiSoCoTheController.deleteChiSoCoThe);

// Lấy chỉ số theo hội viên
router.get('/hoivien/:hoiVienId', auth, chiSoCoTheController.getChiSoCoTheByHoiVien);
router.get('/hoivien/:hoiVienId/latest', auth, chiSoCoTheController.getLatestChiSoByHoiVien);
router.get('/hoivien/:hoiVienId/thongke', auth, chiSoCoTheController.getThongKeChiSo);

module.exports = router;
