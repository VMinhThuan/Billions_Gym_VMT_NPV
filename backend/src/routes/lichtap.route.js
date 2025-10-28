const express = require('express');
const router = express.Router();
const lichTapController = require('../controllers/lichtap.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const hoiVien = ['HoiVien'];
const allUsers = ['HoiVien', 'PT', 'OngChu'];

// Lấy tất cả lịch tập (cho dashboard)
router.get('/', auth, authorize(allUsers), lichTapController.getAllSchedules);

// Lấy các buổi tập khả dụng cho chi nhánh, tuần và gói cụ thể
router.get('/available-sessions', auth, authorize(hoiVien), lichTapController.getAvailableSessions);

// Đăng ký buổi tập cho hội viên
router.post('/register-session', auth, authorize(hoiVien), lichTapController.registerSession);

// Tạo lịch tập cho hội viên
router.post('/create-schedule', auth, authorize(hoiVien), lichTapController.createWorkoutSchedule);

// Lấy lịch tập của hội viên
router.get('/member/:hoiVienId', auth, authorize(hoiVien), lichTapController.getMemberSchedule);

module.exports = router;