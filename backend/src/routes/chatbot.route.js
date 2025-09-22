const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Gửi tin nhắn đến chatbot
router.post('/message', chatbotController.sendMessage);

// Lấy lịch sử chat
router.get('/history', chatbotController.getChatHistory);

// Tạo session mới
router.post('/session', chatbotController.createSession);

// Đóng session
router.delete('/session', chatbotController.closeSession);

// Lấy thông tin session hiện tại
router.get('/session', chatbotController.getCurrentSession);

// Lấy thông tin profile người dùng
router.get('/profile', chatbotController.getUserProfile);

module.exports = router;
