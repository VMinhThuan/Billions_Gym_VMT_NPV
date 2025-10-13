const CryptoJS = require('crypto-js');
const axios = require('axios');
const moment = require('moment');
const qs = require('qs');
const config = require('../config/payment.config');

class ZaloPaymentService {
    constructor() {
        this.config = config.zalopay;
    }

    /**
     * Tạo đơn hàng thanh toán ZaloPay
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
                callbackUrl,
                userId = 'user123',
                extraData = {}
            } = paymentData;

            // Tạo embed_data
            const embed_data = {
                redirecturl: redirectUrl,
                ...extraData
            };

            // Tạo items (có thể để trống hoặc thêm thông tin sản phẩm)
            const items = [];

            // Tạo app_trans_id
            const transID = Math.floor(Math.random() * 1000000);
            const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

            // Tạo order object
            const order = {
                app_id: this.config.app_id,
                app_trans_id: app_trans_id,
                app_user: userId,
                app_time: Date.now(),
                item: JSON.stringify(items),
                embed_data: JSON.stringify(embed_data),
                amount: amount,
                callback_url: callbackUrl,
                description: orderInfo,
                bank_code: ''
            };

            // Tạo MAC signature
            // appid|app_trans_id|appuser|amount|apptime|embeddata|item
            const data = [
                order.app_id,
                order.app_trans_id,
                order.app_user,
                order.amount,
                order.app_time,
                order.embed_data,
                order.item
            ].join('|');

            order.mac = CryptoJS.HmacSHA256(data, this.config.key1).toString();

            // Gửi request đến ZaloPay
            const response = await axios.post(this.config.endpoint, null, {
                params: order
            });

            return {
                success: true,
                data: response.data,
                orderId: orderId,
                app_trans_id: app_trans_id,
                transID: transID
            };

        } catch (error) {
            console.error('ZaloPaymentService.createPayment error:', error);
            return {
                success: false,
                message: error.message || 'Lỗi tạo thanh toán ZaloPay',
                error: error.response?.data || error
            };
        }
    }

    /**
     * Kiểm tra trạng thái giao dịch ZaloPay
     * @param {string} app_trans_id - ID giao dịch ZaloPay
     * @returns {Promise<Object>} - Trạng thái giao dịch
     */
    async checkOrderStatus(app_trans_id) {
        try {
            const postData = {
                app_id: this.config.app_id,
                app_trans_id: app_trans_id
            };

            // Tạo MAC signature
            const data = `${postData.app_id}|${postData.app_trans_id}|${this.config.key1}`;
            postData.mac = CryptoJS.HmacSHA256(data, this.config.key1).toString();

            const response = await axios.post(this.config.queryEndpoint, qs.stringify(postData), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error('ZaloPaymentService.checkOrderStatus error:', error);
            return {
                success: false,
                message: error.message || 'Lỗi kiểm tra trạng thái ZaloPay',
                error: error.response?.data || error
            };
        }
    }

    /**
     * Xử lý callback từ ZaloPay
     * @param {Object} callbackData - Dữ liệu callback
     * @returns {Object} - Kết quả xử lý
     */
    processCallback(callbackData) {
        try {
            const { data: dataStr, mac: reqMac } = callbackData;

            // Tạo MAC để verify
            const mac = CryptoJS.HmacSHA256(dataStr, this.config.key2).toString();

            // Kiểm tra callback hợp lệ
            if (reqMac !== mac) {
                return {
                    success: false,
                    message: 'MAC không hợp lệ',
                    return_code: -1,
                    return_message: 'mac not equal'
                };
            }

            // Parse dữ liệu
            const dataJson = JSON.parse(dataStr);

            // return_code = 1: thành công, 2: thất bại, 3: đang xử lý
            const isSuccess = dataJson.return_code === 1;

            return {
                success: isSuccess,
                app_trans_id: dataJson.app_trans_id,
                amount: dataJson.amount,
                zp_trans_id: dataJson.zp_trans_id,
                return_code: dataJson.return_code,
                return_message: dataJson.return_message,
                paymentMethod: 'zalopay'
            };

        } catch (error) {
            console.error('ZaloPaymentService.processCallback error:', error);
            return {
                success: false,
                message: 'Lỗi xử lý callback ZaloPay',
                return_code: 0,
                return_message: error.message
            };
        }
    }
}

module.exports = new ZaloPaymentService();
