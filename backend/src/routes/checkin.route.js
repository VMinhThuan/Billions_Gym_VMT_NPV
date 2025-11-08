const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get today's sessions
router.get('/today-sessions', checkinController.getTodaySessions);

// Check-in to a session
router.post('/checkin', checkinController.checkIn);

// Check-out from a session
router.post('/checkout', checkinController.checkOut);

// Get check-in history
router.get('/history', checkinController.getCheckInHistory);

module.exports = router;

