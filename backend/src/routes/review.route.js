const express = require('express');
const router = express.Router();
const {
    getReviewsByPackageId,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/goitap/:id/reviews - Lấy danh sách reviews của gói tập (public)
router.get('/goitap/:id/reviews', getReviewsByPackageId);

// POST /api/goitap/:id/review - Tạo review mới (cần đăng nhập)
router.post('/goitap/:id/review', authMiddleware, createReview);

// PUT /api/reviews/:reviewId - Cập nhật review (cần đăng nhập + quyền sở hữu)
router.put('/reviews/:reviewId', authMiddleware, updateReview);

// DELETE /api/reviews/:reviewId - Xóa review (cần đăng nhập + quyền sở hữu)
router.delete('/reviews/:reviewId', authMiddleware, deleteReview);

module.exports = router;
