const express = require('express');
const router = express.Router();
const workoutPredictionController = require('../controllers/workoutPrediction.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware xác thực cho tất cả routes
router.use(authMiddleware);

// Dự báo thời gian và phương pháp tập luyện hiệu quả
router.post('/du-bao-thoi-gian-va-phuong-phap', workoutPredictionController.duBaoThoiGianVaPhuongPhapTap);

// Dự báo hiệu quả tập luyện
router.post('/du-bao-hieu-qua', workoutPredictionController.duBaoHieuQuaTap);

// Phân tích lịch sử tập luyện
router.get('/phan-tich-lich-su/:hoiVienId', workoutPredictionController.phanTichLichSuTap);

// Lấy gợi ý phương pháp tập luyện
router.get('/goi-y-phuong-phap', workoutPredictionController.layGoiYPhuongPhapTap);

// Tính thời gian tập luyện tối ưu
router.post('/tinh-thoi-gian-toi-uu', workoutPredictionController.tinhThoiGianToiUu);

// Dự báo tiến độ tập luyện
router.post('/du-bao-tien-do', workoutPredictionController.duBaoTienDoTap);

module.exports = router;
