import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SimpleLayout from '../components/layout/SimpleLayout';
import api from '../services/api';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState(null);

    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (orderId) {
            checkPaymentStatus();
        } else {
            setError('Không tìm thấy thông tin đơn hàng');
            setLoading(false);
        }
    }, [orderId]);

    const checkPaymentStatus = async () => {
        try {
            const response = await api.get(`/payment/status/${orderId}`);

            if (response.data.success) {
                setPaymentStatus(response.data.data);
            } else {
                setError(response.data.message || 'Không thể kiểm tra trạng thái thanh toán');
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
        navigate('/my-orders');
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
                    {/* Status Icon */}
                    <div className={`status-icon ${isSuccess ? 'success' : isPending ? 'pending' : 'failed'}`}>
                        {isSuccess && '✅'}
                        {isPending && '⏳'}
                        {isFailed && '❌'}
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

                    {/* Payment Details */}
                    {paymentStatus && (
                        <div className="payment-details">
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
                                <button className="btn-secondary" onClick={handleContinue}>
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

                    {/* Additional Info */}
                    {isSuccess && (
                        <div className="success-info">
                            <h3>🎉 Chào mừng bạn đến với Billions Fitness & Gym!</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-icon">🏋️</div>
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
                                    <div className="info-icon">💪</div>
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
        </SimpleLayout>
    );
};

export default PaymentSuccess;
