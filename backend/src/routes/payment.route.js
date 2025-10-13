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

module.exports = router;
