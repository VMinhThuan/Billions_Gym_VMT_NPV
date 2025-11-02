const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Lấy danh sách thông báo của user
router.get('/user/:userId', notificationController.getUserNotifications);

// Lấy số lượng thông báo chưa đọc
router.get('/unread-count/:userId', notificationController.getUnreadCount);

// Đánh dấu thông báo đã đọc
router.put('/mark-read/:notificationId', authMiddleware, notificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);

// Test create notification
router.post('/test', notificationController.testCreateNotification);

// Test unread count
router.get('/test-unread/:userId', notificationController.testUnreadCount);

// Test create workflow notification
router.post('/test-workflow', notificationController.testCreateWorkflowNotification);

// Simple test route
router.get('/simple-test', (req, res) => {
    res.json({ success: true, message: 'Simple test works' });
});

module.exports = router;
