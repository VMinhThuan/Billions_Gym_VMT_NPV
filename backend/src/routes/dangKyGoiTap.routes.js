const express = require('express');
const router = express.Router();
const {
    dangKyGoiTap,
    getDangKyByHoiVien,
    getHoiVienByGoiTap,
    getActivePackage,
    kichHoatLaiGoiTap,
    capNhatThanhToan,
    huyDangKy,
    nangCapGoiTap,
    thongKeGoiTap,
    getAllDangKy
} = require('../controllers/dangKyGoiTap.controller');

// Đăng ký gói tập mới
router.post('/', dangKyGoiTap);

// Lấy tất cả đăng ký (cho admin)
router.get('/', getAllDangKy);

// Thống kê gói tập
router.get('/thong-ke', thongKeGoiTap);

// Lấy danh sách đăng ký của hội viên
router.get('/hoi-vien/:maHoiVien', getDangKyByHoiVien);

// Lấy gói tập đang hoạt động của hội viên
router.get('/hoi-vien/:maHoiVien/active', getActivePackage);

// Lấy danh sách hội viên của gói tập
router.get('/goi-tap/:maGoiTap/hoi-vien', getHoiVienByGoiTap);

// Kích hoạt lại gói tập
router.put('/:id/kich-hoat', kichHoatLaiGoiTap);

// Cập nhật trạng thái thanh toán
router.put('/:id/thanh-toan', capNhatThanhToan);

// Hủy đăng ký
router.put('/:id/huy', huyDangKy);

// Đánh dấu gói đã nâng cấp
router.put('/:id/nang-cap', nangCapGoiTap);

module.exports = router;
