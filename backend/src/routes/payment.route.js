const express = require('express');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

// Routes cho MoMo Payment
router.post('/momo/create', paymentController.createMomoPayment);
router.post('/momo/callback', paymentController.handleMomoCallback);

// Routes cho ZaloPay Payment
router.post('/zalo/create', paymentController.createZaloPayment);
router.post('/zalo/callback', paymentController.handleZaloCallback);

// Route chung để kiểm tra trạng thái thanh toán
router.get('/status/:orderId', paymentController.checkPaymentStatus);

// Route để manually update payment status (for testing)
router.post('/manual-update', paymentController.manualUpdatePaymentStatus);

module.exports = router;
