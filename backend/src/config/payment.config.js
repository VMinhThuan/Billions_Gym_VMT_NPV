// Payment Gateway Configuration
module.exports = {
    // MoMo Payment Configuration
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
        // URLs sẽ được cấu hình động trong code
        redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment-success',
        ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:4000/api/payment/momo/callback',
        endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
        queryEndpoint: 'https://test-payment.momo.vn/v2/gateway/api/query'
    },

    // ZaloPay Payment Configuration
    zalopay: {
        app_id: process.env.ZALOPAY_APP_ID || '2553',
        key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
        key2: process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
        // URLs sẽ được cấu hình động trong code
        redirectUrl: process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:3000/payment-success',
        callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:4000/api/payment/zalo/callback',
        endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
        queryEndpoint: 'https://sb-openapi.zalopay.vn/v2/query'
    },

    // Common Configuration
    common: {
        currency: 'VND',
        description: 'Thanh toán gói tập Billions Fitness & Gym',
        successMessage: 'Thanh toán thành công!',
        failureMessage: 'Thanh toán thất bại!'
    }
};
