const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// Tất cả các route đều yêu cầu authentication và role admin/owner
// Áp dụng middleware cho từng route thay vì router.use để tránh lỗi

// GET /api/statistics/overall - Tổng hợp tất cả thống kê
router.get('/overall', auth, authorize(['OngChu', 'Admin']), statisticsController.getOverallStats);

// GET /api/statistics/members/by-branch - Thống kê hội viên theo chi nhánh
router.get('/members/by-branch', auth, authorize(['OngChu', 'Admin']), statisticsController.getMemberStatsByBranch);

// GET /api/statistics/members/new - Thống kê hội viên mới
router.get('/members/new', auth, authorize(['OngChu', 'Admin']), statisticsController.getNewMemberStats);

// GET /api/statistics/members/expiring - Thống kê hội viên sắp hết hạn
router.get('/members/expiring', auth, authorize(['OngChu', 'Admin']), statisticsController.getExpiringPackages);

// GET /api/statistics/members/status - Thống kê trạng thái hội viên
router.get('/members/status', auth, authorize(['OngChu', 'Admin']), statisticsController.getMemberStatusStats);

// GET /api/statistics/revenue - Thống kê doanh thu
router.get('/revenue', auth, authorize(['OngChu', 'Admin']), statisticsController.getRevenueStats);

// GET /api/statistics/packages - Thống kê gói tập
router.get('/packages', auth, authorize(['OngChu', 'Admin']), statisticsController.getPackageStats);

// GET /api/statistics/pt - Thống kê PT
router.get('/pt', auth, authorize(['OngChu', 'Admin']), statisticsController.getPTStats);

// GET /api/statistics/checkin - Thống kê check-in
router.get('/checkin', auth, authorize(['OngChu', 'Admin']), statisticsController.getCheckInStats);

// GET /api/statistics/checkin/recent - Lấy danh sách check-in real-time hôm nay
router.get('/checkin/recent', auth, authorize(['OngChu', 'Admin']), statisticsController.getRecentCheckIns);
router.get('/pt-checkin/recent', auth, authorize(['OngChu', 'Admin']), statisticsController.getRecentPTCheckIns);

module.exports = router;

