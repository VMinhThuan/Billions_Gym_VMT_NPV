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

// Get QR code of current member
router.get('/qr-code', checkinController.getQRCode);

// Check-in with QR code
router.post('/checkin-qr', checkinController.checkInWithQR);

// Check-out with QR code
router.post('/checkout-qr', checkinController.checkOutWithQR);

// Scan QR code from image
router.post('/scan-qr-from-image', checkinController.scanQRFromImage);

module.exports = router;

