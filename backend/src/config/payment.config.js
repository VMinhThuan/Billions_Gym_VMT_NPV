const getLocalIPAddress = require('../utils/getLocalIp');
const LOCAL_IP = getLocalIPAddress();

const IS_DEV = process.env.NODE_ENV !== 'production';

const BASE_WEB_URL = IS_DEV ? `http://${LOCAL_IP}:3000` : 'http://localhost:3000';
const BASE_API_URL = IS_DEV ? `http://${LOCAL_IP}:4000` : 'http://localhost:4000';

module.exports = {
    momo: {
        accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
        secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
        partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
        orderInfo: 'Thanh toán gói tập Billions Fitness & Gym',
        requestType: 'payWithMethod',
        extraData: '',
        orderGroupId: '',
        autoCapture: true,
        lang: 'vi',
        redirectUrl: `${BASE_WEB_URL}/payment-success`,
        ipnUrl: `${BASE_API_URL}/api/payment/momo/callback`,
        endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
        queryEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/query'
    },

    zalopay: {
        app_id: process.env.ZALOPAY_APP_ID || '2553',
        key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
        key2: process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
        redirectUrl: `${BASE_WEB_URL}/payment-success`,
        callbackUrl: `${BASE_API_URL}/api/payment/zalo/callback`,
        endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
        queryEndpoint: 'https://sb-openapi.zalopay.vn/v2/query'
    },

    common: {
        currency: 'VND',
        description: 'Thanh toán gói tập Billions Fitness & Gym',
        successMessage: 'Thanh toán thành công!',
        failureMessage: 'Thanh toán thất bại!'
    }
};
