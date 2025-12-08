const express = require('express');
const router = express.Router();
const ptCheckinController = require('../controllers/pt-checkin.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// All routes require authentication and PT role
router.use(auth);
router.use(authorize(['PT']));

// Get today's sessions for PT
router.get('/today-sessions', ptCheckinController.getTodaySessions);

// PT Check-in
router.post('/checkin', ptCheckinController.checkIn);

// PT Check-out
router.post('/checkout', ptCheckinController.checkOut);

// Get PT check-in history
router.get('/history', ptCheckinController.getCheckInHistory);

// Get PT QR code
router.get('/qr-code', ptCheckinController.getQRCode);

module.exports = router;

