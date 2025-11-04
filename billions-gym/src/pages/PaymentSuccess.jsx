import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SimpleLayout from '../components/layout/SimpleLayout';
import ToastNotification from '../components/ToastNotification';
import { api } from '../services/api';
import './PaymentSuccess.css';
import successIcon from '../assets/icons/success.svg';
import failureIcon from '../assets/icons/failed.svg';
import pendingIcon from '../assets/icons/pending.svg';
import liftingIcon from '../assets/icons/lifting-weights.svg';
import supportIcon from '../assets/icons/support-online-center.svg';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [hasUpdatedStatus, setHasUpdatedStatus] = useState(false);

    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId) {
            setError('Không tìm thấy thông tin đơn hàng');
            setLoading(false);
            return;
        }

        // Optimistic success based on gateway query params
        const partnerCode = (searchParams.get('partnerCode') || '').toLowerCase();
        const gatewayResult = searchParams.get('resultCode'); // MoMo: '0' success
        const zaloReturn = searchParams.get('return_code');   // ZaloPay: '1' success
        const amountParam = Number(searchParams.get('amount') || 0);

        const isGatewaySuccess = (gatewayResult === '0') || (zaloReturn === '1');
        if (isGatewaySuccess && !hasUpdatedStatus) {
            setPaymentStatus({
                orderId,
                status: 'DA_THANH_TOAN',
                paymentMethod: partnerCode === 'momo' ? 'momo' : (partnerCode === 'zalopay' ? 'zalopay' : 'momo'),
                amount: amountParam || undefined,
                // Không set registrationTime ở đây, sẽ lấy từ backend
            });

            // Tự động cập nhật payment status trong backend (chỉ 1 lần)
            setHasUpdatedStatus(true);
            updatePaymentStatusInBackend(orderId, 'DA_THANH_TOAN');
        }

        // Always check backend status (in case IPN updated later)
        checkPaymentStatus();
    }, [orderId, hasUpdatedStatus]);

    // Tự động cập nhật payment status trong backend
    const updatePaymentStatusInBackend = async (orderId, status) => {
        try {
            console.log('🔍 [FRONTEND] Auto-updating payment status:', orderId, status);

            // Kiểm tra xem đã cập nhật chưa để tránh duplicate
            const updateKey = `payment_updated_${orderId}`;
            const hasUpdated = localStorage.getItem(updateKey);

            if (hasUpdated) {
                console.log('🔍 [FRONTEND] Payment status already updated for this order, skipping...');
                return;
            }

            const response = await api.post('/payment/manual-update', {
                orderId: orderId,
                status: status
            }, false);

            if (response.success) {
                console.log('✅ [FRONTEND] Payment status updated successfully');

                // Đánh dấu đã cập nhật để tránh duplicate
                localStorage.setItem(updateKey, JSON.stringify({
                    updated: true,
                    timestamp: Date.now()
                }));

                // Đánh dấu đã hiển thị thông báo để tránh duplicate khi check lại
                const notificationKey = `payment_success_${orderId}`;
                const notificationData = {
                    shown: true,
                    timestamp: Date.now()
                };
                localStorage.setItem(notificationKey, JSON.stringify(notificationData));

                // Sau khi update thành công, check lại payment status
                setTimeout(() => {
                    checkPaymentStatus();
                    // Trigger notification refresh
                    window.dispatchEvent(new CustomEvent('refreshNotifications'));
                }, 1000);

                // Tự động xóa sau 24 giờ
                setTimeout(() => {
                    localStorage.removeItem(notificationKey);
                    localStorage.removeItem(updateKey);
                }, 24 * 60 * 60 * 1000);
            }
        } catch (error) {
            console.error('❌ [FRONTEND] Error updating payment status:', error);
        }
    };

    const checkPaymentStatus = async () => {
        try {
            const data = await api.get(`/payment/status/${orderId}`, {}, false);

            if (data.success) {
                // Luôn ưu tiên dữ liệu từ backend (có thời gian đăng ký chính xác)
                setPaymentStatus(data.data);

                // Hiển thị toast notification nếu thanh toán thành công và chưa hiển thị trước đó
                if (data.data.status === 'DA_THANH_TOAN') {
                    const notificationKey = `payment_success_${orderId}`;
                    const notificationData = localStorage.getItem(notificationKey);

                    // Kiểm tra cả format cũ ('true') và format mới (JSON object)
                    let hasShownNotification = false;
                    if (notificationData) {
                        try {
                            const parsed = JSON.parse(notificationData);
                            hasShownNotification = parsed.shown === true;
                        } catch {
                            // Format cũ: 'true'
                            hasShownNotification = notificationData === 'true';
                        }
                    }

                    if (!hasShownNotification) {
                        setToastMessage(`🎉 Bạn đã thanh toán thành công gói tập! Vui lòng hoàn tất các bước tiếp theo.`);
                        setShowToast(true);
                        // Đánh dấu đã hiển thị thông báo cho order này với timestamp
                        const notificationData = {
                            shown: true,
                            timestamp: Date.now()
                        };
                        localStorage.setItem(notificationKey, JSON.stringify(notificationData));

                        // Tự động xóa thông báo sau 24 giờ để tránh localStorage đầy
                        setTimeout(() => {
                            localStorage.removeItem(notificationKey);
                        }, 24 * 60 * 60 * 1000); // 24 giờ
                    }
                }
            } else {
                setError(data.message || 'Không thể kiểm tra trạng thái thanh toán');
            }
        } catch (err) {
            console.error('Error checking payment status:', err);
            setError('Lỗi khi kiểm tra trạng thái thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/active-package');
    };

    if (loading) {
        return (
            <SimpleLayout>
                <div className="payment-success-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Đang kiểm tra trạng thái thanh toán...</p>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    if (error) {
        return (
            <SimpleLayout>
                <div className="payment-success-page">
                    <div className="error-container">
                        <div className="error-icon">❌</div>
                        <h2>Lỗi xảy ra</h2>
                        <p>{error}</p>
                        <button className="btn-primary" onClick={handleContinue}>
                            Quay về trang chủ
                        </button>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    const isSuccess = paymentStatus?.status === 'DA_THANH_TOAN';
    const isPending = paymentStatus?.status === 'CHO_THANH_TOAN';
    const isFailed = paymentStatus?.status === 'THANH_TOAN_THAT_BAI';

    return (
        <SimpleLayout>
            <div className="payment-success-page">
                <div className="success-container">
                    <div className="success-content">
                        {/* Header Section - Full Width */}
                        <div className="success-header">
                            {/* Status Icon */}
                            <div className={`status-icon ${isSuccess ? 'success' : isPending ? 'pending' : 'failed'}`}>
                                {isSuccess && <img src={successIcon} alt="success" className="w-10 h-10" />}
                                {isPending && <img src={pendingIcon} alt="pending" className="w-10 h-10" />}
                                {isFailed && <img src={failureIcon} alt="failed" className="w-10 h-10" />}
                            </div>

                            {/* Status Title */}
                            <h1 className="status-title">
                                {isSuccess && 'Thanh toán thành công!'}
                                {isPending && 'Đang chờ thanh toán'}
                                {isFailed && 'Thanh toán thất bại'}
                            </h1>

                            {/* Status Description */}
                            <p className="status-description">
                                {isSuccess && 'Cảm ơn bạn đã thanh toán. Gói tập của bạn đã được kích hoạt thành công!'}
                                {isPending && 'Vui lòng hoàn tất thanh toán để kích hoạt gói tập.'}
                                {isFailed && 'Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.'}
                            </p>
                        </div>

                        {/* Left Column */}
                        <div className="success-left-column">
                            {/* Payment Details */}
                            {paymentStatus && (
                                <div className="payment-details">
                                    <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1.2rem' }}>Chi tiết thanh toán</h3>
                                    <div className="detail-item">
                                        <span className="label">Mã đơn hàng:</span>
                                        <span className="value">{paymentStatus.orderId}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Phương thức thanh toán:</span>
                                        <span className="value">
                                            {paymentStatus.paymentMethod === 'momo' ? 'MoMo' : 'ZaloPay'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Số tiền:</span>
                                        <span className="value">
                                            {new Intl.NumberFormat('vi-VN').format(paymentStatus.amount)}₫
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Thời gian đăng ký:</span>
                                        <span className="value">
                                            {new Date(paymentStatus.registrationTime).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                {isSuccess && (
                                    <>
                                        <button className="btn-primary" onClick={handleViewOrders}>
                                            Xem gói tập của tôi
                                        </button>
                                        <button className="bg-white rounded-[8px] cursor-pointer hover:bg-[#da2128] hover:text-white hover:border-none border-gray-400 border text-[#141414] font-bold px-3" onClick={handleContinue}>
                                            Tiếp tục mua sắm
                                        </button>
                                    </>
                                )}

                                {isPending && (
                                    <>
                                        <button className="btn-primary" onClick={() => window.location.reload()}>
                                            Kiểm tra lại
                                        </button>
                                        <button className="btn-secondary" onClick={handleContinue}>
                                            Quay về trang chủ
                                        </button>
                                    </>
                                )}

                                {isFailed && (
                                    <>
                                        <button className="btn-primary" onClick={() => navigate(-1)}>
                                            Thử lại thanh toán
                                        </button>
                                        <button className="btn-secondary" onClick={handleContinue}>
                                            Quay về trang chủ
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="success-right-column">
                            {/* Additional Info */}
                            {isSuccess && (
                                <div className="success-info">
                                    <h3>🎉 Chào mừng bạn đến với Billions Fitness & Gym!</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <img src={liftingIcon} alt="lifting" className="w-8 h-8" />
                                            </div>
                                            <div className="info-text">
                                                <h4>Bắt đầu tập luyện</h4>
                                                <p>Gói tập của bạn đã được kích hoạt. Hãy đến phòng gym để bắt đầu hành trình fitness!</p>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-icon">📱</div>
                                            <div className="info-text">
                                                <h4>Quản lý lịch tập</h4>
                                                <p>Đăng nhập vào tài khoản để xem lịch tập và quản lý thông tin cá nhân.</p>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-icon">
                                                <img src={supportIcon} alt="support" className="w-8 h-8" />
                                            </div>
                                            <div className="info-text">
                                                <h4>Hỗ trợ 24/7</h4>
                                                <p>Đội ngũ PT và nhân viên luôn sẵn sàng hỗ trợ bạn trong suốt quá trình tập luyện.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Support */}
                            <div className="contact-support">
                                <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ:</p>
                                <div className="contact-info">
                                    <span>📞 Hotline: 1900 123 456</span>
                                    <span>✉️ Email: support@billionsfitness.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            <ToastNotification
                show={showToast}
                message={toastMessage}
                type="success"
                duration={6000}
                onClose={() => setShowToast(false)}
            />
        </SimpleLayout>
    );
};

export default PaymentSuccess;
