const express = require('express');
const router = express.Router();
const dinhDuongController = require('../controllers/dinhduong.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Lấy thông tin dinh dưỡng của hội viên
router.get('/info/:maHoiVien', dinhDuongController.getThongTinDinhDuong);

// Tạo gợi ý dinh dưỡng AI
router.post('/goi-y', dinhDuongController.taoGoiYDinhDuong);

// Lấy danh sách gợi ý của hội viên
router.get('/goi-y/:maHoiVien', dinhDuongController.getGoiYDinhDuong);

// Lấy chi tiết gợi ý
router.get('/goi-y/chi-tiet/:goiYId', dinhDuongController.getChiTietGoiY);

// Cập nhật phản hồi gợi ý
router.put('/goi-y/:goiYId/phan-hoi', dinhDuongController.capNhatPhanHoi);

// Tạo thực đơn tự động
router.post('/thuc-don', dinhDuongController.taoThucDonTuDong);

// Lấy danh sách thực đơn của hội viên
router.get('/thuc-don/:maHoiVien', dinhDuongController.getThucDonHoiVien);

// Lấy chi tiết thực đơn
router.get('/thuc-don/chi-tiet/:thucDonId', dinhDuongController.getChiTietThucDon);

// Cập nhật đánh giá thực đơn
router.put('/thuc-don/:thucDonId/danh-gia', dinhDuongController.capNhatDanhGiaThucDon);

// Phân tích hoạt động tập luyện
router.get('/phan-tich/:maHoiVien', dinhDuongController.phanTichHoatDong);

// Tính nhu cầu calories cơ bản
router.post('/tinh-calories', dinhDuongController.tinhNhuCauCalories);

module.exports = router;
