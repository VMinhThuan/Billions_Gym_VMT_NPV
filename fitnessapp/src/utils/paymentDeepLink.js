import * as Linking from 'expo-linking';

const APP_DEEP_LINK_SCHEME = 'fitnessapp';
export const APP_PAYMENT_SUCCESS_PATH = 'payment-success';
export const APP_PAYMENT_ERROR_PATH = 'payment-error';

export const APP_PAYMENT_REDIRECT_URL = `${APP_DEEP_LINK_SCHEME}://${APP_PAYMENT_SUCCESS_PATH}`;
export const APP_DEEP_LINK_PREFIXES = [
    `${APP_DEEP_LINK_SCHEME}://`,
    'exp://',
    'exps://',
];

export const getPaymentRedirectUrl = () => {
    try {
        // Expo Go / dev client sẽ tự build đúng URL
        return Linking.createURL(APP_PAYMENT_SUCCESS_PATH);
    } catch {
        return APP_PAYMENT_REDIRECT_URL;
    }
};

const normalizePath = (urlInstance) => {
    const host = (urlInstance.host || '').toLowerCase();
    const path = (urlInstance.pathname || '').replace(/^\//, '').toLowerCase();
    return host || path;
};

export const parsePaymentDeepLink = (url) => {
    if (!url || typeof url !== 'string') return null;

    try {
        const parsedUrl = new URL(url);
        const location = normalizePath(parsedUrl);
        const pathLower = (parsedUrl.pathname || '').toLowerCase();
        const isPaymentPath = location === APP_PAYMENT_SUCCESS_PATH ||
            location === APP_PAYMENT_ERROR_PATH ||
            pathLower.includes(`/${APP_PAYMENT_SUCCESS_PATH}`) ||
            pathLower.includes(`/${APP_PAYMENT_ERROR_PATH}`);

        if (!isPaymentPath) {
            return null;
        }

        const isError = location === APP_PAYMENT_ERROR_PATH || pathLower.includes(APP_PAYMENT_ERROR_PATH);

        const params = parsedUrl.searchParams;
        const partnerCode = params.get('partnerCode') || params.get('partner_code');
        const resultCode = params.get('resultCode') || params.get('return_code');
        const amountParam = params.get('amount');

        const decodedPackageName = (() => {
            const raw = params.get('packageName') || params.get('orderInfo');
            if (!raw) return null;
            try {
                return decodeURIComponent(raw.replace(/\+/g, ' '));
            } catch {
                return raw.replace(/\+/g, ' ');
            }
        })();

        return {
            orderId: params.get('orderId') || params.get('order_id'),
            paymentMethod: partnerCode
                ? (partnerCode.toLowerCase().includes('zalopay') ? 'zalopay' : 'momo')
                : (params.get('paymentMethod') || 'momo'),
            amount: amountParam ? parseInt(amountParam, 10) : null,
            resultCode,
            packageName: decodedPackageName,
            isError,
        };
    } catch (error) {
        console.warn('⚠️ Không parse được deep link thanh toán:', error);
        return null;
    }
};

export const buildAppRedirectUrl = (orderId) => {
    if (!orderId) return APP_PAYMENT_REDIRECT_URL;
    const separator = APP_PAYMENT_REDIRECT_URL.includes('?') ? '&' : '?';
    return `${APP_PAYMENT_REDIRECT_URL}${separator}orderId=${orderId}`;
};

