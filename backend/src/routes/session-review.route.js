const express = require('express');
const router = express.Router();
const sessionReviewController = require('../controllers/session-review.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Tạo hoặc cập nhật đánh giá
router.post('/', auth, authorize(['HoiVien']), sessionReviewController.createOrUpdateReview);

// Lấy đánh giá theo check-in record
router.get('/checkin/:checkInRecordId', auth, authorize(['HoiVien']), sessionReviewController.getReviewByCheckInRecord);

// Lấy danh sách đánh giá chưa hoàn thành
router.get('/pending', auth, authorize(['HoiVien']), sessionReviewController.getPendingReviews);

module.exports = router;

