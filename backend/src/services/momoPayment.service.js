const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/payment.config');

class MomoPaymentService {
    constructor() {
        this.config = config.momo;
    }

    /**
     * Tạo đơn hàng thanh toán MoMo
     * @param {Object} paymentData - Dữ liệu thanh toán
     * @returns {Promise<Object>} - Kết quả tạo đơn hàng
     */
    async createPayment(paymentData) {
        try {
            const {
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData = ''
            } = paymentData;

            // Tạo request ID
            const requestId = orderId;

            // Tạo raw signature
            const rawSignature = [
                `accessKey=${this.config.accessKey}`,
                `amount=${amount}`,
                `extraData=${extraData}`,
                `ipnUrl=${ipnUrl}`,
                `orderId=${orderId}`,
                `orderInfo=${orderInfo}`,
                `partnerCode=${this.config.partnerCode}`,
                `redirectUrl=${redirectUrl}`,
                `requestId=${requestId}`,
                `requestType=${this.config.requestType}`
            ].join('&');

            // Tạo signature
            const signature = crypto
                .createHmac('sha256', this.config.secretKey)
                .update(rawSignature)
                .digest('hex');

            // Dữ liệu gửi đến MoMo
            const requestBody = {
                partnerCode: this.config.partnerCode,
                partnerName: 'Billions Fitness & Gym',
                storeId: 'BillionsFitnessStore',
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                lang: this.config.lang,
                requestType: this.config.requestType,
                autoCapture: this.config.autoCapture,
                extraData: extraData,
                orderGroupId: this.config.orderGroupId,
                signature: signature
            };

            // Gửi request đến MoMo
            const response = await axios.post(this.config.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
                }
            });

            return {
                success: true,
                data: response.data,
                orderId: orderId,
                requestId: requestId
            };

        } catch (error) {
            console.error('MomoPaymentService.createPayment error:', error);
            return {
                success: false,
                message: error.message || 'Lỗi tạo thanh toán MoMo',
                error: error.response?.data || error
            };
        }
    }

    /**
     * Kiểm tra trạng thái giao dịch MoMo
     * @param {string} orderId - ID đơn hàng
     * @returns {Promise<Object>} - Trạng thái giao dịch
     */
    async checkTransactionStatus(orderId) {
        try {
            const requestId = orderId;

            // Tạo signature để query
            const rawSignature = [
                `accessKey=${this.config.accessKey}`,
                `orderId=${orderId}`,
                `partnerCode=${this.config.partnerCode}`,
                `requestId=${requestId}`
            ].join('&');

            const signature = crypto
                .createHmac('sha256', this.config.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: this.config.partnerCode,
                requestId: requestId,
                orderId: orderId,
                signature: signature,
                lang: this.config.lang
            };

            const response = await axios.post(this.config.queryEndpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error('MomoPaymentService.checkTransactionStatus error:', error);
            return {
                success: false,
                message: error.message || 'Lỗi kiểm tra trạng thái MoMo',
                error: error.response?.data || error
            };
        }
    }

    /**
     * Xử lý callback từ MoMo
     * @param {Object} callbackData - Dữ liệu callback
     * @returns {Object} - Kết quả xử lý
     */
    processCallback(callbackData) {
        try {
            const {
                resultCode,
                orderId,
                amount,
                transId,
                message,
                orderInfo
            } = callbackData;

            // resultCode = 0: giao dịch thành công
            // resultCode = 9000: giao dịch được cấp quyền thành công
            // resultCode <> 0: giao dịch thất bại
            const isSuccess = resultCode === 0 || resultCode === 9000;

            return {
                success: isSuccess,
                orderId: orderId,
                amount: amount,
                transId: transId,
                message: message,
                orderInfo: orderInfo,
                resultCode: resultCode,
                paymentMethod: 'momo'
            };

        } catch (error) {
            console.error('MomoPaymentService.processCallback error:', error);
            return {
                success: false,
                message: 'Lỗi xử lý callback MoMo',
                error: error.message
            };
        }
    }
}

module.exports = new MomoPaymentService();
