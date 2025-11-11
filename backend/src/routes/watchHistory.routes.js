const express = require('express');
const router = express.Router();
const watchHistoryController = require('../controllers/watchHistory.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// GET /api/watch-history - Lấy tiến độ xem của user
router.get('/', watchHistoryController.getWatchProgress);

// GET /api/watch-history/stats - Lấy thống kê tiến độ xem
router.get('/stats', watchHistoryController.getWatchStats);

// POST /api/watch-history/mark - Đánh dấu bài tập đã xem
router.post('/mark', watchHistoryController.markAsWatched);

// DELETE /api/watch-history/reset - Reset tiến độ xem
router.delete('/reset', watchHistoryController.resetProgress);

module.exports = router;
