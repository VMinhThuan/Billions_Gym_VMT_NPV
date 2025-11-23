const express = require('express');
const router = express.Router();
const lichTapController = require('../controllers/lichtap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const hoiVien = ['HoiVien'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Lấy tất cả lịch tập (cho dashboard)
router.get('/', auth, authorize(allUsers), lichTapController.getAllSchedules);

// Kiểm tra điều kiện đăng ký lịch tập tuần sau (chỉ dành cho Hội viên)
router.get('/check-registration-eligibility', auth, lichTapController.checkRegistrationEligibility);

// Lấy các buổi tập khả dụng cho chi nhánh, tuần và gói cụ thể
router.get('/available-sessions', auth, authorize(hoiVien), lichTapController.getAvailableSessions);

// Đăng ký buổi tập cho hội viên
router.post('/register-session', auth, authorize(hoiVien), lichTapController.registerSession);

// Hủy đăng ký buổi tập
router.post('/cancel-session', auth, authorize(hoiVien), lichTapController.cancelSession);

// Lấy danh sách buổi tập có sẵn trong tuần hiện tại
router.get('/available-sessions-this-week', auth, authorize(hoiVien), lichTapController.getAvailableSessionsThisWeek);

// Tạo lịch tập cho hội viên
router.post('/create-schedule', auth, authorize(hoiVien), lichTapController.createWorkoutSchedule);

// Lấy lịch tập của hội viên
router.get('/member/:hoiVienId', auth, authorize(hoiVien), lichTapController.getMemberSchedule);

module.exports = router;