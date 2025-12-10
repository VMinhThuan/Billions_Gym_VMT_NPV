import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Image,
    Linking,
    AppState,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import apiService from '../api/apiService';
import { APP_DEEP_LINK_PREFIXES, APP_PAYMENT_REDIRECT_URL, parsePaymentDeepLink } from '../utils/paymentDeepLink';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.7, 300);
const APP_DEEP_LINK_PREFIXES_UNIQUE = Array.from(new Set(APP_DEEP_LINK_PREFIXES));

const PaymentWebViewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { paymentUrl, orderId, packageName, amount } = route.params || {};
    const webViewRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false); // Toggle giữa WebView và QR
    const [extractedQRCode, setExtractedQRCode] = useState(null); // QR code extract từ trang MoMo
    const [qrFormat, setQrFormat] = useState(null); // 'base64' hoặc 'url'
    const [qrError, setQrError] = useState(null);
    const [webViewReady, setWebViewReady] = useState(false);
    const qrTimeoutRef = useRef(null);
    const qrRetryCountRef = useRef(0);
    const MAX_QR_RETRIES = 20; // Retry tối đa 20 lần (20 giây) - tăng lên vì cần đợi click button

    // JavaScript để inject vào WebView để extract QR code và detect payment success
    const injectedJavaScript = `
        (function() {
            let qrExtracted = false;
            let buttonClicked = false;
            
            // Function để click vào nút thanh toán MoMo để trigger QR code
            function clickPaymentButton() {
                if (buttonClicked) return false;
                
                try {
                    // Tìm các nút thanh toán phổ biến
                    const buttonSelectors = [
                        'button:contains("Thanh toán")',
                        'button:contains("Ví MoMo")',
                        'a:contains("Thanh toán")',
                        '[class*="pay"]',
                        '[class*="payment"]',
                        '[id*="pay"]',
                        '[id*="payment"]',
                        'button[type="button"]',
                        'a[href*="momo"]'
                    ];
                    
                    // Tìm button chứa text "Thanh toán" hoặc "Ví MoMo"
                    const allButtons = document.querySelectorAll('button, a, div[role="button"]');
                    for (let btn of allButtons) {
                        const text = (btn.textContent || btn.innerText || '').toLowerCase();
                        const className = (btn.className || '').toLowerCase();
                        const id = (btn.id || '').toLowerCase();
                        
                        if (text.includes('thanh toán') || 
                            text.includes('ví momo') || 
                            text.includes('pay') ||
                            className.includes('pay') ||
                            id.includes('pay')) {
                            try {
                                btn.click();
                                buttonClicked = true;
                                console.log('✅ Clicked payment button');
                                return true;
                            } catch (e) {
                                // Try trigger event
                                const clickEvent = new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                btn.dispatchEvent(clickEvent);
                                buttonClicked = true;
                                console.log('✅ Triggered click event on payment button');
                                return true;
                            }
                        }
                    }
                    
                    return false;
                } catch (error) {
                    console.error('Error clicking payment button:', error);
                    return false;
                }
            }
            
            // Function để extract QR code từ trang MoMo (tìm cả element ẩn)
            function extractQRCode() {
                if (qrExtracted) return true;
                
                try {
                    // 1. Tìm img có chứa QR code (bao gồm cả element ẩn)
                    // Loại bỏ các hình ảnh hướng dẫn, chỉ lấy QR code thực sự
                    const images = document.querySelectorAll('img');
                    for (let img of images) {
                        const src = img.src || '';
                        const alt = (img.alt || '').toLowerCase();
                        const className = (img.className || '').toLowerCase();
                        const id = (img.id || '').toLowerCase();
                        const dataSrc = img.getAttribute('data-src') || '';
                        const style = window.getComputedStyle(img);
                        
                        // Loại bỏ hình ảnh hướng dẫn
                        if (src.includes('instruction') || src.includes('guide') || src.includes('how-to')) {
                            continue;
                        }
                        
                        // Check nếu là QR code image (kể cả khi ẩn)
                        // Phải có kích thước hợp lý (không quá nhỏ) và không phải hình hướng dẫn
                        if (src && (
                            (src.includes('qr') && !src.includes('instruction') && !src.includes('guide')) || 
                            (src.includes('QR') && !src.includes('instruction') && !src.includes('guide')) || 
                            src.includes('qrcode') ||
                            (alt.includes('qr') && !alt.includes('instruction')) ||
                            (className.includes('qr') && !className.includes('instruction')) ||
                            (id.includes('qr') && !id.includes('instruction')) ||
                            dataSrc.includes('qrcode') ||
                            src.startsWith('data:image') // Base64 image
                        )) {
                            // Kiểm tra kích thước hình ảnh (QR code thường lớn hơn 100x100)
                            const width = img.naturalWidth || img.width || 0;
                            const height = img.naturalHeight || img.height || 0;
                            
                            // Nếu là base64 hoặc có kích thước hợp lý
                            if (src.startsWith('data:image') || (width >= 100 && height >= 100)) {
                                // Nếu là base64
                                if (src.startsWith('data:image')) {
                                    qrExtracted = true;
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'QR_CODE_FOUND',
                                        qrData: src,
                                        format: 'base64'
                                    }));
                                    return true;
                                }
                                // Nếu là URL (https/http) và không phải hình hướng dẫn
                                if ((src.startsWith('http://') || src.startsWith('https://')) && 
                                    !src.includes('instruction') && !src.includes('guide')) {
                                    qrExtracted = true;
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'QR_CODE_FOUND',
                                        qrData: src,
                                        format: 'url'
                                    }));
                                    return true;
                                }
                            }
                        }
                        
                        // Check data-src attribute (lazy loading) - loại bỏ hình hướng dẫn
                        if (dataSrc && dataSrc.includes('qrcode') && 
                            !dataSrc.includes('instruction') && !dataSrc.includes('guide')) {
                            qrExtracted = true;
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'QR_CODE_FOUND',
                                qrData: dataSrc,
                                format: 'url'
                            }));
                            return true;
                        }
                    }
                    
                    // 2. Tìm canvas có QR code (kể cả khi ẩn) - ưu tiên cao nhất vì QR code thường được render trong canvas
                    const canvases = document.querySelectorAll('canvas');
                    for (let canvas of canvases) {
                        try {
                            const width = canvas.width || canvas.clientWidth || 0;
                            const height = canvas.height || canvas.clientHeight || 0;
                            
                            // Canvas QR code thường có kích thước vuông và lớn hơn 200x200
                            if (width >= 200 && height >= 200 && Math.abs(width - height) < 50) {
                                const dataUrl = canvas.toDataURL('image/png');
                                if (dataUrl && dataUrl.length > 5000) { // QR code base64 thường lớn hơn 5KB
                                    qrExtracted = true;
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'QR_CODE_FOUND',
                                        qrData: dataUrl,
                                        format: 'base64'
                                    }));
                                    return true;
                                }
                            }
                        } catch (e) {
                            // Ignore CORS errors
                        }
                    }
                    
                    // 3. Tìm SVG có QR code (loại bỏ logo MoMo)
                    const svgs = document.querySelectorAll('svg');
                    for (let svg of svgs) {
                        try {
                            const className = (svg.className || '').toLowerCase();
                            const id = (svg.id || '').toLowerCase();
                            const width = svg.width?.baseVal?.value || svg.clientWidth || 0;
                            const height = svg.height?.baseVal?.value || svg.clientHeight || 0;
                            
                            // Loại bỏ logo MoMo (thường có class/id chứa "logo" hoặc kích thước nhỏ)
                            if (className.includes('logo') || id.includes('logo') || 
                                className.includes('imglogo') || id.includes('imglogo') ||
                                (width > 0 && width < 200) || (height > 0 && height < 200)) {
                                continue; // Bỏ qua logo, không phải QR code
                            }
                            
                            // Chỉ lấy SVG có kích thước lớn (QR code thường >= 200x200)
                            if (width >= 200 && height >= 200 && Math.abs(width - height) < 50) {
                                const svgData = new XMLSerializer().serializeToString(svg);
                                if (svgData && svgData.length > 5000) { // QR code SVG thường lớn hơn 5KB
                                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
                                    const reader = new FileReader();
                                    reader.onloadend = function() {
                                        qrExtracted = true;
                                        window.ReactNativeWebView.postMessage(JSON.stringify({
                                            type: 'QR_CODE_FOUND',
                                            qrData: reader.result,
                                            format: 'base64'
                                        }));
                                    };
                                    reader.readAsDataURL(svgBlob);
                                    return true;
                                }
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                    
                    // 4. Tìm element có class/id chứa "qr" hoặc "QR" (kể cả khi ẩn)
                    const qrElements = document.querySelectorAll('[class*="qr"], [class*="QR"], [id*="qr"], [id*="QR"], [data-qr], [aria-label*="qr"]');
                    for (let el of qrElements) {
                        if (el.tagName === 'IMG' && el.src) {
                            const format = el.src.startsWith('data:') ? 'base64' : 'url';
                            qrExtracted = true;
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'QR_CODE_FOUND',
                                qrData: el.src,
                                format: format
                            }));
                            return true;
                        }
                    }
                    
                    // 5. Tìm trong iframe
                    const iframes = document.querySelectorAll('iframe');
                    for (let iframe of iframes) {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            const iframeImages = iframeDoc.querySelectorAll('img');
                            for (let img of iframeImages) {
                                const src = img.src || '';
                                if (src && (src.includes('qr') || src.includes('QR') || src.startsWith('data:image'))) {
                                    qrExtracted = true;
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'QR_CODE_FOUND',
                                        qrData: src,
                                        format: src.startsWith('data:') ? 'base64' : 'url'
                                    }));
                                    return true;
                                }
                            }
                        } catch (e) {
                            // Ignore cross-origin iframe errors
                        }
                    }
                    
                    return false;
                } catch (error) {
                    console.error('Error extracting QR:', error);
                    return false;
                }
            }
            
            // Detect khi URL thay đổi
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            // Function để detect payment success từ DOM content
            function checkPaymentSuccessFromDOM() {
                try {
                    const bodyText = (document.body?.innerText || document.body?.textContent || '').toLowerCase();
                    const pageTitle = (document.title || '').toLowerCase();
                    
                    // Các từ khóa chỉ thị thanh toán thành công
                    const successKeywords = [
                        'thành công',
                        'thanh toán thành công',
                        'giao dịch thành công',
                        'payment success',
                        'success',
                        'đã thanh toán',
                        'thanh toán hoàn tất',
                        'hoàn tất thanh toán'
                    ];
                    
                    // Kiểm tra xem có text thành công không
                    const hasSuccessText = successKeywords.some(keyword => 
                        bodyText.includes(keyword) || pageTitle.includes(keyword)
                    );
                    
                    if (hasSuccessText) {
                        // Tìm orderId trong DOM hoặc URL
                        const url = window.location.href;
                        const params = new URLSearchParams(window.location.search);
                        let foundOrderId = params.get('orderId') || params.get('order_id');
                        
                        // Nếu không có trong URL, thử tìm trong DOM
                        if (!foundOrderId) {
                            const orderIdElements = document.querySelectorAll('[class*="order"], [id*="order"], [data-order]');
                            for (let el of orderIdElements) {
                                const text = (el.textContent || '').trim();
                                if (text && text.length > 5 && text.length < 50) {
                                    foundOrderId = text;
                                    break;
                                }
                            }
                        }
                        
                        // Tìm amount trong DOM
                        let foundAmount = null;
                        const amountElements = document.querySelectorAll('[class*="amount"], [class*="price"], [class*="money"]');
                        for (let el of amountElements) {
                            const text = (el.textContent || '').trim();
                            const amountMatch = text.match(/[\d,]+/);
                            if (amountMatch) {
                                foundAmount = parseInt(amountMatch[0].replace(/,/g, ''));
                                break;
                            }
                        }
                        
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'PAYMENT_SUCCESS',
                            orderId: foundOrderId || 'unknown',
                            paymentMethod: 'momo',
                            amount: foundAmount,
                            detectedFrom: 'DOM'
                        }));
                        return true;
                    }
                    
                    // Kiểm tra error keywords
                    const errorKeywords = [
                        'thất bại',
                        'lỗi',
                        'error',
                        'failed',
                        'cancel',
                        'hủy',
                        'thanh toán thất bại'
                    ];
                    
                    const hasErrorText = errorKeywords.some(keyword => 
                        bodyText.includes(keyword) || pageTitle.includes(keyword)
                    );
                    
                    if (hasErrorText) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'PAYMENT_ERROR',
                            detectedFrom: 'DOM'
                        }));
                        return true;
                    }
                    
                    return false;
                } catch (error) {
                    console.error('Error checking payment success from DOM:', error);
                    return false;
                }
            }
            
            function checkUrl() {
                const url = window.location.href;
                const params = new URLSearchParams(window.location.search);
                const resultCode = params.get('resultCode');
                const returnCode = params.get('return_code'); // ZaloPay
                const partnerCode = params.get('partnerCode') || params.get('partner_code');
                const orderId = params.get('orderId') || params.get('order_id');
                const amount = params.get('amount');
                
                // MoMo success: resultCode === '0'
                // ZaloPay success: return_code === '1'
                const isSuccess = resultCode === '0' || returnCode === '1';
                
                if (isSuccess && orderId) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'PAYMENT_SUCCESS',
                        orderId: orderId,
                        paymentMethod: partnerCode ? (partnerCode.toLowerCase().includes('momo') ? 'momo' : 'zalopay') : 'momo',
                        amount: amount ? parseInt(amount) : null,
                        resultCode: resultCode || returnCode
                    }));
                    return true;
                }
                
                // Check error
                if (resultCode && resultCode !== '0' && resultCode !== '9000' && resultCode !== '1') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'PAYMENT_ERROR',
                        orderId: orderId,
                        resultCode: resultCode
                    }));
                    return true;
                }
                
                // Nếu URL là localhost hoặc không có resultCode, check DOM content
                if (url.includes('localhost') || url.includes('127.0.0.1') || !resultCode) {
                    return checkPaymentSuccessFromDOM();
                }
                
                return false;
            }
            
            // Override pushState và replaceState
            history.pushState = function() {
                originalPushState.apply(history, arguments);
                setTimeout(checkUrl, 100);
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(history, arguments);
                setTimeout(checkUrl, 100);
            };
            
            // Extract QR code khi page load
            function tryExtractQR() {
                if (qrExtracted) return;
                
                // Nếu chưa click button, thử click trước
                if (!buttonClicked) {
                    const clicked = clickPaymentButton();
                    if (clicked) {
                        // Đợi 2s sau khi click để QR code render (tăng từ 500ms)
                        setTimeout(() => {
                            extractQRCode();
                        }, 2000);
                    } else {
                        // Nếu không click được, vẫn thử tìm QR code
                        extractQRCode();
                    }
                } else {
                    // Đã click rồi, tìm QR code
                    extractQRCode();
                }
            }
            
            // MutationObserver để detect khi DOM thay đổi và check payment success
            let paymentSuccessDetected = false;
            const observer = new MutationObserver(() => {
                if (!paymentSuccessDetected) {
                    // Check payment success từ DOM mỗi khi DOM thay đổi
                    setTimeout(() => {
                        if (checkPaymentSuccessFromDOM()) {
                            paymentSuccessDetected = true;
                        }
                    }, 500);
                }
            });
            
            // Bắt đầu observe DOM changes
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
            }
            
            // Check URL khi page load
            if (document.readyState === 'complete') {
                checkUrl();
                // Đợi 1s rồi check DOM content để detect payment success
                setTimeout(() => {
                    checkPaymentSuccessFromDOM();
                }, 1000);
                // Đợi 2s rồi mới bắt đầu extract QR (để page render xong và button có thể click)
                setTimeout(() => {
                    tryExtractQR();
                }, 2000);
            } else {
                window.addEventListener('load', () => {
                    checkUrl();
                    // Đợi 1s rồi check DOM content để detect payment success
                    setTimeout(() => {
                        checkPaymentSuccessFromDOM();
                    }, 1000);
                    // Đợi 2s rồi mới bắt đầu extract QR
                    setTimeout(() => {
                        tryExtractQR();
                    }, 2000);
                });
            }
            
            // Check URL mỗi 500ms để catch redirects
            setInterval(() => {
                if (!paymentSuccessDetected) {
                    checkUrl();
                }
            }, 500);
            
            // Check DOM content mỗi 2s để detect payment success (kể cả khi redirect về localhost)
            setInterval(() => {
                if (!paymentSuccessDetected) {
                    checkPaymentSuccessFromDOM();
                }
            }, 2000);
            
            // Try extract QR mỗi 2s (để catch QR code được render sau khi click button)
            setInterval(() => {
                if (!qrExtracted) {
                    tryExtractQR();
                }
            }, 2000);
            
            // Listen for DOM changes (để catch QR code được thêm vào DOM sau)
            const observer = new MutationObserver(() => {
                if (!qrExtracted) {
                    setTimeout(tryExtractQR, 300);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'data-src', 'class', 'id']
            });
        })();
        true; // Required for iOS
    `;

    // Xử lý message từ WebView
    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('📨 Message from WebView:', data);

            if (data.type === 'QR_CODE_FOUND') {
                // Kiểm tra xem có phải hình ảnh hướng dẫn hoặc logo MoMo không
                if (data.qrData && typeof data.qrData === 'string') {
                    const qrDataLower = data.qrData.toLowerCase();

                    // Loại bỏ hình ảnh hướng dẫn
                    if (qrDataLower.includes('instruction') ||
                        qrDataLower.includes('guide') ||
                        qrDataLower.includes('how-to') ||
                        qrDataLower.includes('qr-instruction-momo')) {
                        console.log('⚠️ Ignoring instruction image, not a real QR code');
                        return;
                    }

                    // Loại bỏ logo MoMo (thường là SVG nhỏ, có chứa "imglogo" hoặc "fill-current")
                    if (qrDataLower.includes('imglogo') ||
                        qrDataLower.includes('fill-current') ||
                        (qrDataLower.includes('svg') && qrDataLower.includes('logo')) ||
                        (qrDataLower.includes('svg') && data.qrData.length < 10000)) { // SVG logo thường nhỏ hơn 10KB
                        console.log('⚠️ Ignoring MoMo logo SVG, not a payment QR code');
                        return;
                    }
                }

                console.log('✅ QR code found from WebView:', data.format, data.qrData.substring(0, 50) + '...');
                setExtractedQRCode(data.qrData);
                setQrFormat(data.format);
                setQrError(null);
                // Clear timeout nếu đã tìm thấy QR
                if (qrTimeoutRef.current) {
                    clearTimeout(qrTimeoutRef.current);
                    qrTimeoutRef.current = null;
                }
                qrRetryCountRef.current = 0; // Reset retry count
            } else if (data.type === 'PAYMENT_SUCCESS') {
                console.log('✅ Payment success detected from WebView:', data);
                handlePaymentSuccess(data);
            } else if (data.type === 'PAYMENT_ERROR') {
                console.log('❌ Payment error detected from WebView:', data);
                handlePaymentError();
            }
        } catch (error) {
            console.error('❌ Error parsing WebView message:', error);
        }
    };

    const handleAppDeepLink = (url) => {
        const parsed = parsePaymentDeepLink(url);
        if (parsed?.isError) {
            handlePaymentError();
            return false;
        }
        if (parsed) {
            handlePaymentSuccess(parsed);
            return false;
        }
        return true;
    };

    // Chặn tất cả deep link schemes để tránh WebView tự load và báo lỗi -10
    const handleShouldStartLoadWithRequest = (request) => {
        const { url } = request || {};
        if (!url) return true;

        // Danh sách các deep link schemes cần xử lý
        const deepLinkSchemes = [
            'momo://',
            'market://',
            'play://',
            'itms://',
            'itms-apps://',
            'tel:',
            'sms:',
            'mailto:',
            ...APP_DEEP_LINK_PREFIXES_UNIQUE,
        ];

        // Kiểm tra xem URL có phải là deep link không
        const isDeepLink = deepLinkSchemes.some(scheme => url.toLowerCase().startsWith(scheme.toLowerCase()));

        if (isDeepLink) {
            console.log('🔗 Intercepted deep link (shouldStartLoad):', url);

            if (APP_DEEP_LINK_PREFIXES_UNIQUE.some(prefix => url.toLowerCase().startsWith(prefix.toLowerCase()))) {
                handleAppDeepLink(url);
                return false;
            }

            // Xử lý các deep link đặc biệt
            if (url.startsWith('momo://')) {
                Linking.canOpenURL(url)
                    .then((supported) => {
                        if (supported) {
                            Linking.openURL(url).catch((err) => console.error('❌ Error opening MoMo app:', err));
                        } else {
                            console.log('⚠️ MoMo app not installed');
                        }
                    })
                    .catch((err) => console.error('❌ Error checking MoMo app:', err));
            } else if (url.startsWith('market://') || url.startsWith('play://')) {
                // Mở Google Play Store
                Linking.openURL(url).catch((err) => {
                    console.error('❌ Error opening Play Store:', err);
                    // Fallback: mở Play Store web
                    const packageId = url.match(/id=([^&]+)/)?.[1];
                    if (packageId) {
                        Linking.openURL(`https://play.google.com/store/apps/details?id=${packageId}`).catch(() => { });
                    }
                });
            } else if (url.startsWith('itms://') || url.startsWith('itms-apps://')) {
                // Mở App Store (iOS)
                Linking.openURL(url).catch((err) => console.error('❌ Error opening App Store:', err));
            } else {
                // Các deep link khác (tel, sms, mailto)
                Linking.openURL(url).catch((err) => console.error('❌ Error opening deep link:', err));
            }

            // Chặn WebView load URL này để tránh ERR_UNKNOWN_URL_SCHEME
            return false;
        }

        return true;
    };

    // Setup timeout cho QR code extraction
    useEffect(() => {
        if (webViewReady && !extractedQRCode) {
            // Set timeout 20s để extract QR code từ trang MoMo (tăng lên vì cần đợi click button)
            qrTimeoutRef.current = setTimeout(() => {
                if (!extractedQRCode && qrRetryCountRef.current < MAX_QR_RETRIES) {
                    qrRetryCountRef.current++;
                    console.log(`⚠️ QR code extraction retry ${qrRetryCountRef.current}/${MAX_QR_RETRIES}`);
                    // Retry extraction bằng cách inject script để click button và tìm QR
                    if (webViewRef.current) {
                        webViewRef.current.injectJavaScript(`
                            (function() {
                                // Thử click button thanh toán
                                const buttons = document.querySelectorAll('button, a, div[role="button"]');
                                for (let btn of buttons) {
                                    const text = (btn.textContent || '').toLowerCase();
                                    if (text.includes('thanh toán') || text.includes('ví momo')) {
                                        try {
                                            btn.click();
                                            console.log('✅ Clicked payment button (retry)');
                                        } catch (e) {
                                            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
                                            btn.dispatchEvent(clickEvent);
                                        }
                                        break;
                                    }
                                }
                                
                                // Đợi 1.5s rồi tìm QR (đợi lâu hơn để QR code render)
                                setTimeout(() => {
                                    // Tìm canvas trước (ưu tiên cao nhất)
                                    const canvases = document.querySelectorAll('canvas');
                                    for (let canvas of canvases) {
                                        try {
                                            const width = canvas.width || canvas.clientWidth || 0;
                                            const height = canvas.height || canvas.clientHeight || 0;
                                            if (width >= 200 && height >= 200 && Math.abs(width - height) < 50) {
                                                const dataUrl = canvas.toDataURL('image/png');
                                                if (dataUrl && dataUrl.length > 5000) {
                                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                                        type: 'QR_CODE_FOUND',
                                                        qrData: dataUrl,
                                                        format: 'base64'
                                                    }));
                                                    return;
                                                }
                                            }
                                        } catch (e) {}
                                    }
                                    
                                    // Tìm img (loại bỏ hình hướng dẫn)
                                    const images = document.querySelectorAll('img');
                                    for (let img of images) {
                                        const src = img.src || img.getAttribute('data-src') || '';
                                        const width = img.naturalWidth || img.width || 0;
                                        const height = img.naturalHeight || img.height || 0;
                                        
                                        // Loại bỏ hình hướng dẫn và chỉ lấy QR code thực sự
                                        if (src && !src.includes('instruction') && !src.includes('guide') &&
                                            (src.includes('qrcode') || src.startsWith('data:image') || 
                                             (src.includes('qr') && width >= 100 && height >= 100))) {
                                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                                type: 'QR_CODE_FOUND',
                                                qrData: src,
                                                format: src.startsWith('data:') ? 'base64' : 'url'
                                            }));
                                            return;
                                        }
                                    }
                                }, 1500);
                            })();
                            true;
                        `);
                    }
                } else if (!extractedQRCode) {
                    console.log('⚠️ QR code extraction timeout, using paymentUrl as fallback');
                    setQrError('Không thể tải QR code từ trang MoMo. Sử dụng QR code từ URL thanh toán.');
                }
            }, 1000);
        }

        return () => {
            if (qrTimeoutRef.current) {
                clearTimeout(qrTimeoutRef.current);
            }
        };
    }, [webViewReady, extractedQRCode]);

    // Check payment status khi app được focus lại hoặc active lại (khi user quay lại từ Safari/localhost)
    const paymentStatusCheckedRef = useRef(false);
    const checkPaymentStatus = React.useCallback(async () => {
        if (!orderId) return;

        try {
            console.log('🔍 Checking payment status for orderId:', orderId);
            const response = await apiService.apiCall(`/payment/status/${orderId}`, 'GET', null, true);

            if (response?.success && response?.data) {
                const paymentData = response.data;
                // Kiểm tra nếu payment đã thành công
                if (paymentData.status === 'SUCCESS' || paymentData.status === 'success' ||
                    paymentData.resultCode === '0' || paymentData.return_code === '1') {
                    console.log('✅ Payment success detected from backend status check');
                    handlePaymentSuccess({
                        orderId: paymentData.orderId || orderId,
                        paymentMethod: paymentData.paymentMethod || 'momo',
                        amount: paymentData.amount || amount,
                        resultCode: paymentData.resultCode || paymentData.return_code
                    });
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Error checking payment status:', error);
            // Không hiển thị lỗi cho user, chỉ log
        }
        return false;
    }, [orderId, amount]);

    // Check khi screen được focus
    useFocusEffect(
        React.useCallback(() => {
            // Đợi 2s rồi check payment status (để đảm bảo payment đã được xử lý)
            const checkStatusTimeout = setTimeout(() => {
                checkPaymentStatus();
            }, 2000);

            return () => {
                clearTimeout(checkStatusTimeout);
            };
        }, [checkPaymentStatus])
    );

    // Check khi app được active lại (từ background)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // Đợi 2s rồi check payment status
                setTimeout(() => {
                    checkPaymentStatus();
                }, 2000);
            }
        });

        return () => {
            subscription?.remove();
        };
    }, [checkPaymentStatus]);

    // Xử lý khi WebView load xong
    const handleLoadEnd = () => {
        setLoading(false);
        setWebViewReady(true);
        console.log('✅ WebView loaded successfully');
    };

    // Xử lý khi URL thay đổi để detect payment success
    const handleNavigationStateChange = (navState) => {
        setCanGoBack(navState.canGoBack);
        setLoading(navState.loading);

        const url = navState.url;
        console.log('🌐 Navigation URL:', url);

        if (!url) return;

        // Xử lý tất cả deep link schemes
        const deepLinkSchemes = [
            'momo://',
            'market://',
            'play://',
            'itms://',
            'itms-apps://',
            'tel:',
            'sms:',
            'mailto:',
            ...APP_DEEP_LINK_PREFIXES_UNIQUE,
        ];

        const isDeepLink = deepLinkSchemes.some(scheme => url.toLowerCase().startsWith(scheme.toLowerCase()));

        if (isDeepLink) {
            console.log('🔗 Detected deep link in navigation:', url);

            if (APP_DEEP_LINK_PREFIXES_UNIQUE.some(prefix => url.toLowerCase().startsWith(prefix.toLowerCase()))) {
                handleAppDeepLink(url);
                return;
            }

            // Xử lý các deep link đặc biệt
            if (url.startsWith('momo://')) {
                Linking.canOpenURL(url).then((supported) => {
                    if (supported) {
                        Linking.openURL(url).catch((err) => {
                            console.error('❌ Error opening MoMo app:', err);
                        });
                    } else {
                        console.log('⚠️ MoMo app not installed');
                    }
                }).catch((err) => {
                    console.error('❌ Error checking MoMo app:', err);
                });
            } else if (url.startsWith('market://') || url.startsWith('play://')) {
                // Mở Google Play Store
                Linking.openURL(url).catch((err) => {
                    console.error('❌ Error opening Play Store:', err);
                    // Fallback: mở Play Store web
                    const packageId = url.match(/id=([^&]+)/)?.[1];
                    if (packageId) {
                        Linking.openURL(`https://play.google.com/store/apps/details?id=${packageId}`).catch(() => { });
                    }
                });
            } else if (url.startsWith('itms://') || url.startsWith('itms-apps://')) {
                // Mở App Store (iOS)
                Linking.openURL(url).catch((err) => console.error('❌ Error opening App Store:', err));
            } else {
                // Các deep link khác (tel, sms, mailto)
                Linking.openURL(url).catch((err) => console.error('❌ Error opening deep link:', err));
            }

            // Không xử lý tiếp, để WebView tự xử lý
            return;
        }

        // Nếu URL là localhost, đợi một chút rồi check DOM content (vì localhost có thể là redirect từ MoMo)
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            console.log('🌐 Detected localhost URL, will check DOM content for payment status:', url);
            // Đợi 2s để DOM render xong rồi check
            setTimeout(() => {
                // Inject JavaScript để check DOM content
                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                        (function() {
                            try {
                                const bodyText = (document.body?.innerText || document.body?.textContent || '').toLowerCase();
                                const pageTitle = (document.title || '').toLowerCase();
                                
                                const successKeywords = [
                                    'thành công',
                                    'thanh toán thành công',
                                    'giao dịch thành công',
                                    'payment success',
                                    'success',
                                    'đã thanh toán',
                                    'thanh toán hoàn tất'
                                ];
                                
                                const hasSuccessText = successKeywords.some(keyword => 
                                    bodyText.includes(keyword) || pageTitle.includes(keyword)
                                );
                                
                                if (hasSuccessText) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'PAYMENT_SUCCESS',
                                        orderId: '${orderId || 'unknown'}',
                                        paymentMethod: 'momo',
                                        detectedFrom: 'DOM_LOCALHOST'
                                    }));
                                }
                            } catch (e) {
                                console.error('Error checking DOM:', e);
                            }
                        })();
                        true;
                    `);
                }
            }, 2000);
            return;
        }

        // Parse URL để check resultCode
        try {
            const urlObj = new URL(url);
            const resultCode = urlObj.searchParams.get('resultCode');
            const returnCode = urlObj.searchParams.get('return_code'); // ZaloPay
            const orderId = urlObj.searchParams.get('orderId') || urlObj.searchParams.get('order_id');
            const amount = urlObj.searchParams.get('amount');
            const partnerCode = urlObj.searchParams.get('partnerCode') || urlObj.searchParams.get('partner_code');

            // MoMo success: resultCode === '0'
            // ZaloPay success: return_code === '1'
            if ((resultCode === '0' || returnCode === '1') && orderId) {
                console.log('✅ Payment success detected from URL params:', { resultCode, returnCode, orderId, amount });
                handlePaymentSuccess({
                    orderId,
                    paymentMethod: partnerCode ? (partnerCode.toLowerCase().includes('momo') ? 'momo' : 'zalopay') : 'momo',
                    amount: amount ? parseInt(amount) : null,
                    resultCode: resultCode || returnCode
                });
                return;
            }

            // Check error
            if (resultCode && resultCode !== '0' && resultCode !== '9000' && resultCode !== '1') {
                console.log('❌ Payment error detected from URL params:', { resultCode, orderId });
                handlePaymentError();
                return;
            }
        } catch (error) {
            // Nếu không parse được URL, fallback về cách cũ
            if (url.includes('payment-success') ||
                url.includes('/success') ||
                url.includes('thanh-toan-thanh-cong') ||
                (url.includes('orderId') && (url.includes('success') || url.includes('complete')))) {
                console.log('✅ Payment success detected from URL pattern:', url);
                handlePaymentSuccess({ orderId: orderId || 'unknown' });
                return;
            }

            if (url.includes('payment-error') ||
                url.includes('/cancel') ||
                url.includes('/error') ||
                url.includes('thanh-toan-that-bai')) {
                console.log('❌ Payment error/cancel detected from URL pattern:', url);
                handlePaymentError();
                return;
            }
        }
    };

    const handlePaymentSuccess = async (paymentData = {}) => {
        const finalOrderId = paymentData.orderId || orderId;
        const finalPaymentMethod = paymentData.paymentMethod || 'momo';
        const finalAmount = paymentData.amount || amount;
        const finalResultCode = paymentData.resultCode || '0';

        console.log('✅ [handlePaymentSuccess] Confirming payment with backend:', {
            orderId: finalOrderId,
            paymentMethod: finalPaymentMethod,
            amount: finalAmount,
            resultCode: finalResultCode
        });

        // Gọi API để confirm payment với backend
        try {
            const confirmResponse = await apiService.apiCall('/payment/confirm', 'POST', {
                orderId: finalOrderId,
                resultCode: finalResultCode,
                amount: finalAmount,
                paymentMethod: finalPaymentMethod
            }, true); // requiresAuth = true

            if (confirmResponse?.success) {
                console.log('✅ [handlePaymentSuccess] Payment confirmed successfully with backend');
            } else {
                console.warn('⚠️ [handlePaymentSuccess] Payment confirmation failed:', confirmResponse?.message);
                // Vẫn tiếp tục navigate đến success screen dù confirm fail
            }
        } catch (error) {
            console.error('❌ [handlePaymentSuccess] Error confirming payment:', error);
            // Vẫn tiếp tục navigate đến success screen dù có lỗi
        }

        // Navigate đến PaymentSuccessScreen với thông tin thanh toán
        navigation.replace('PaymentSuccess', {
            orderId: finalOrderId,
            paymentMethod: finalPaymentMethod,
            amount: finalAmount,
            packageName: packageName
        });
    };

    const handlePaymentError = () => {
        Alert.alert(
            'Thanh toán không thành công',
            'Giao dịch đã bị hủy hoặc có lỗi xảy ra. Vui lòng thử lại.',
            [
                {
                    text: 'Quay lại',
                    onPress: () => navigation.goBack()
                }
            ]
        );
    };

    const handleGoBack = () => {
        if (canGoBack && webViewRef.current) {
            webViewRef.current.goBack();
        } else {
            Alert.alert(
                'Hủy thanh toán?',
                'Bạn có chắc chắn muốn hủy thanh toán?',
                [
                    {
                        text: 'Tiếp tục thanh toán',
                        style: 'cancel'
                    },
                    {
                        text: 'Hủy',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        }
    };

    // Render QR Code View
    const renderQRCodeView = () => {
        // Ưu tiên QR extract từ trang MoMo, fallback về paymentUrl để generate QR
        const useExtractedQR = extractedQRCode && qrFormat === 'base64';
        const qrData = paymentUrl; // Luôn dùng paymentUrl để generate QR (vì nó chứa đầy đủ thông tin)

        return (
            <ScrollView
                contentContainerStyle={styles.qrContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.qrWrapper}>
                    <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
                    <Text style={styles.qrSubtitle}>
                        Mở ứng dụng MoMo và quét mã QR bên dưới
                    </Text>

                    <View style={styles.qrCodeContainer}>
                        {qrData ? (
                            <>
                                {useExtractedQR ? (
                                    // Hiển thị QR code từ base64 extract từ trang MoMo
                                    <View style={styles.qrImageContainer}>
                                        <Text style={styles.qrNote}>QR code từ trang MoMo</Text>
                                        <Image
                                            source={{ uri: extractedQRCode }}
                                            style={styles.qrImage}
                                            resizeMode="contain"
                                            onError={(error) => {
                                                console.error('❌ Error loading extracted QR:', error);
                                                setExtractedQRCode(null); // Fallback về generated QR
                                                setQrFormat(null);
                                            }}
                                        />
                                    </View>
                                ) : (
                                    // Generate QR code từ paymentUrl
                                    <View style={styles.qrGeneratedContainer}>
                                        {qrError && (
                                            <View style={styles.qrWarningContainer}>
                                                <MaterialIcons name="info-outline" size={16} color="#FF9800" />
                                                <Text style={styles.qrWarningText}>{qrError}</Text>
                                            </View>
                                        )}
                                        <QRCode
                                            value={qrData}
                                            size={QR_SIZE}
                                            color="#000000"
                                            backgroundColor="#FFFFFF"
                                            logo={null}
                                            logoSize={0}
                                            logoBackgroundColor="transparent"
                                            logoMargin={0}
                                            logoBorderRadius={0}
                                            quietZone={10}
                                            ecl="M" // Error correction level: Medium
                                        />
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.qrPlaceholder}>
                                <ActivityIndicator size="large" color="#E63946" />
                                <Text style={styles.qrPlaceholderText}>Đang tạo mã QR...</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.qrInfo}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="info-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>
                                Mã QR này chứa thông tin thanh toán của bạn
                            </Text>
                        </View>
                        {amount && (
                            <View style={styles.infoRow}>
                                <MaterialIcons name="payment" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Số tiền: {new Intl.NumberFormat('vi-VN').format(amount)}₫
                                </Text>
                            </View>
                        )}
                        {orderId && (
                            <View style={styles.infoRow}>
                                <MaterialIcons name="receipt" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Mã đơn: {orderId}
                                </Text>
                            </View>
                        )}
                        {packageName && (
                            <View style={styles.infoRow}>
                                <MaterialIcons name="fitness-center" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Gói: {packageName}
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.openWebButton}
                        onPress={() => setShowQRCode(false)}
                    >
                        <MaterialIcons name="open-in-browser" size={20} color="#fff" />
                        <Text style={styles.openWebButtonText}>
                            Mở trang thanh toán trong trình duyệt
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    if (!paymentUrl) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
                    <Text style={styles.errorText}>Không có URL thanh toán</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán MoMo</Text>
                <TouchableOpacity
                    onPress={() => setShowQRCode(!showQRCode)}
                    style={styles.toggleButton}
                >
                    <MaterialIcons
                        name={showQRCode ? "web" : "qr-code-2"}
                        size={24}
                        color="#E63946"
                    />
                </TouchableOpacity>
            </View>

            {showQRCode ? (
                // Hiển thị QR Code
                renderQRCodeView()
            ) : (
                // Hiển thị WebView
                <WebView
                    ref={webViewRef}
                    source={{ uri: paymentUrl }}
                    style={styles.webview}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadEnd={handleLoadEnd}
                    onMessage={handleMessage}
                    injectedJavaScript={injectedJavaScript}
                    onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('❌ WebView error:', nativeEvent);

                        // Xử lý tất cả deep link schemes - không phải lỗi thực sự
                        if (nativeEvent.code === -10 && nativeEvent.description && nativeEvent.description.includes('ERR_UNKNOWN_URL_SCHEME')) {
                            const url = nativeEvent.url || '';

                            // Danh sách các deep link schemes cần xử lý
                            const deepLinkSchemes = [
                                'momo://',
                                'market://',
                                'play://',
                                'itms://',
                                'itms-apps://',
                                'tel:',
                                'sms:',
                                'mailto:',
                                ...APP_DEEP_LINK_PREFIXES_UNIQUE,
                            ];

                            const isDeepLink = deepLinkSchemes.some(scheme => url.toLowerCase().startsWith(scheme.toLowerCase()));

                            if (isDeepLink) {
                                console.log('🔗 Detected deep link in onError, attempting to open:', url);

                                if (APP_DEEP_LINK_PREFIXES_UNIQUE.some(prefix => url.toLowerCase().startsWith(prefix.toLowerCase()))) {
                                    handleAppDeepLink(url);
                                    return;
                                }

                                // Xử lý các deep link đặc biệt
                                if (url.startsWith('momo://')) {
                                    Linking.canOpenURL(url).then((supported) => {
                                        if (supported) {
                                            Linking.openURL(url).catch((err) => {
                                                console.error('❌ Error opening MoMo app:', err);
                                            });
                                        } else {
                                            console.log('⚠️ MoMo app not installed');
                                        }
                                    }).catch((err) => {
                                        console.error('❌ Error checking MoMo app:', err);
                                    });
                                } else if (url.startsWith('market://') || url.startsWith('play://')) {
                                    // Mở Google Play Store
                                    Linking.openURL(url).catch((err) => {
                                        console.error('❌ Error opening Play Store:', err);
                                        // Fallback: mở Play Store web
                                        const packageId = url.match(/id=([^&]+)/)?.[1];
                                        if (packageId) {
                                            Linking.openURL(`https://play.google.com/store/apps/details?id=${packageId}`).catch(() => { });
                                        }
                                    });
                                } else if (url.startsWith('itms://') || url.startsWith('itms-apps://')) {
                                    // Mở App Store (iOS)
                                    Linking.openURL(url).catch((err) => console.error('❌ Error opening App Store:', err));
                                } else {
                                    // Các deep link khác (tel, sms, mailto)
                                    Linking.openURL(url).catch((err) => console.error('❌ Error opening deep link:', err));
                                }

                                // Không hiển thị lỗi cho deep link
                                return;
                            }
                        }

                        // Chỉ hiển thị lỗi cho các lỗi thực sự
                        setLoading(false);
                        Alert.alert(
                            'Lỗi tải trang',
                            'Không thể tải trang thanh toán. Vui lòng kiểm tra kết nối mạng và thử lại.',
                            [
                                {
                                    text: 'Quay lại',
                                    onPress: () => navigation.goBack()
                                },
                                {
                                    text: 'Thử lại',
                                    onPress: () => {
                                        if (webViewRef.current) {
                                            webViewRef.current.reload();
                                        }
                                    }
                                }
                            ]
                        );
                    }}
                    onHttpError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('❌ WebView HTTP error:', nativeEvent);
                        setLoading(false);
                        if (nativeEvent.statusCode === 403 || nativeEvent.statusCode === 404) {
                            Alert.alert(
                                'Lỗi truy cập',
                                'Không thể truy cập trang thanh toán. Vui lòng kiểm tra kết nối mạng và thử lại.',
                                [
                                    {
                                        text: 'Quay lại',
                                        onPress: () => navigation.goBack()
                                    },
                                    {
                                        text: 'Thử lại',
                                        onPress: () => {
                                            if (webViewRef.current) {
                                                webViewRef.current.reload();
                                            }
                                        }
                                    }
                                ]
                            );
                        }
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#E63946" />
                            <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
                        </View>
                    )}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scalesPageToFit={true}
                    mixedContentMode="always"
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsBackForwardNavigationGestures={true}
                    thirdPartyCookiesEnabled={true}
                    sharedCookiesEnabled={true}
                    cacheEnabled={true}
                    incognito={false}
                    originWhitelist={['*']}
                    allowsFullscreenVideo={false}
                />
            )}

            {/* Loading overlay */}
            {loading && !showQRCode && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#E63946" />
                    <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
    toggleButton: {
        padding: 8,
    },
    webview: {
        flex: 1,
    },
    qrContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    qrWrapper: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    qrSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    qrCodeContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: QR_SIZE + 40,
    },
    qrImageContainer: {
        alignItems: 'center',
        width: '100%',
    },
    qrImage: {
        width: QR_SIZE,
        height: QR_SIZE,
        borderRadius: 8,
    },
    qrGeneratedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    qrNote: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    qrWarningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
        width: '100%',
    },
    qrWarningText: {
        fontSize: 12,
        color: '#E65100',
        marginLeft: 8,
        flex: 1,
    },
    qrPlaceholder: {
        width: QR_SIZE,
        height: QR_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrPlaceholderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    qrInfo: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    openWebButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E63946',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
    },
    openWebButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    backButtonText: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#E63946',
        color: '#fff',
        borderRadius: 8,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PaymentWebViewScreen;

