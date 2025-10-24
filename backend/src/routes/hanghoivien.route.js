const express = require('express');
const router = express.Router();
const hangHoiVienController = require('../controllers/hanghoivien.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Tạo hạng hội viên mới (chỉ admin)
router.post('/',
    authMiddleware,
    roleMiddleware(['OngChu']),
    hangHoiVienController.createHangHoiVien
);

// Lấy tất cả hạng hội viên
router.get('/', hangHoiVienController.getAllHangHoiVien);

// Lấy hạng hội viên theo ID
router.get('/:id', hangHoiVienController.getHangHoiVienById);

// Cập nhật hạng hội viên (chỉ admin)
router.put('/:id',
    authMiddleware,
    roleMiddleware(['OngChu']),
    hangHoiVienController.updateHangHoiVien
);

// Xóa hạng hội viên (chỉ admin)
router.delete('/:id',
    authMiddleware,
    roleMiddleware(['OngChu']),
    hangHoiVienController.deleteHangHoiVien
);

// Tính toán hạng hội viên cho một hội viên cụ thể
router.post('/tinh-hang/:hoiVienId',
    authMiddleware,
    roleMiddleware(['OngChu', 'PT']),
    hangHoiVienController.tinhHangHoiVien
);

// Thêm route tính hạng hội viên theo thời hạn
router.get('/tinh-hang-theo-thoi-han/:userId', hangHoiVienController.tinhHangHoiVienTheoThoiHan);

// Thêm route tính thời gian còn lại của hạng hội viên
router.get('/thoi-gian-con-lai/:userId', hangHoiVienController.tinhThoiGianConLai);

// Thêm route cập nhật thời gian còn lại của hạng hội viên
router.put('/cap-nhat-thoi-gian-con-lai/:userId', hangHoiVienController.capNhatThoiGianConLai);

// Lấy thông tin hạng hội viên của một hội viên
router.get('/hoi-vien/:hoiVienId',
    authMiddleware,
    hangHoiVienController.getHangHoiVienCuaHoiVien
);

// Lấy danh sách hội viên theo hạng
router.get('/hang/:hangId/hoi-vien',
    authMiddleware,
    roleMiddleware(['OngChu', 'PT']),
    hangHoiVienController.getHoiVienTheoHang
);

// Cập nhật hạng cho tất cả hội viên (chỉ admin)
router.post('/cap-nhat-tat-ca',
    authMiddleware,
    roleMiddleware(['OngChu']),
    hangHoiVienController.capNhatHangTatCaHoiVien
);

// Lấy thống kê hạng hội viên
router.get('/thong-ke/overview',
    authMiddleware,
    roleMiddleware(['OngChu', 'PT']),
    hangHoiVienController.getThongKeHangHoiVien
);

module.exports = router;
