import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleLayout from '../components/layout/SimpleLayout';
import { api } from '../services/api';
import './Checkout.css';

const Checkout = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State management
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        partnerPhone: ''
    });

    // Transaction dates
    const getTodayString = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const todayString = getTodayString();
    const [startDate, setStartDate] = useState(todayString);

    const handleStartDateChange = (e) => {
        const value = e.target.value;
        if (value < todayString) {
            alert('Ngày bắt đầu tập phải từ hôm nay trở đi.');
            setStartDate(todayString);
            return;
        }
        setStartDate(value);
    };

    const [validation, setValidation] = useState({
        firstName: false,
        lastName: false,
        phone: false,
        email: false,
        partnerPhone: false
    });

    const [partnerInfo, setPartnerInfo] = useState(null);
    const [partnerLoading, setPartnerLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [formLocked, setFormLocked] = useState(false);

    // Fetch package data and user info
    useEffect(() => {
        const fetchPackageData = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await api.get(`/goitap/${id}`, {}, false);
                setPackageData(data);
            } catch (err) {
                console.error('Error fetching package data:', err);
                setError('Không thể tải thông tin gói tập');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPackageData();
        }
    }, [id]);

    // Check login status on component mount and localStorage changes
    useEffect(() => {
        const checkLoginStatus = () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                console.log('Checking login status:', user); // Debug log

                if (user && (user.hoTen || (user.ho && user.ten)) && (user.soDienThoai || user.sdt)) {
                    setIsLoggedIn(true);

                    // Handle different user data structures
                    let firstName = '';
                    let lastName = '';
                    let phone = '';

                    if (user.hoTen) {
                        // If hoTen exists, split it
                        const nameParts = user.hoTen.trim().split(' ');
                        firstName = nameParts[0] || '';
                        lastName = nameParts.slice(1).join(' ') || '';
                    } else if (user.ho && user.ten) {
                        // If ho and ten are separate fields
                        firstName = user.ho || '';
                        lastName = user.ten || '';
                    }

                    // Handle phone field variations
                    phone = user.soDienThoai || user.sdt || '';

                    // Auto-fill user info and lock form (prevent editing)
                    const userFormData = {
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        email: '', // Không tự động điền email từ database
                        partnerPhone: ''
                    };

                    console.log('Auto-filling form with:', userFormData); // Debug log

                    setFormData(userFormData);
                    setFormLocked(true); // Lock form when logged in

                    // Auto-validate filled fields
                    setValidation({
                        firstName: firstName.length >= 2,
                        lastName: lastName.length >= 2,
                        phone: /^[0-9]{10,11}$/.test(phone.replace(/\D/g, '')),
                        email: user.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) : false,
                        partnerPhone: false
                    });
                } else {
                    console.log('User not logged in or missing required fields'); // Debug log
                    setIsLoggedIn(false);
                    setFormLocked(false);
                }
            } catch (error) {
                console.error('Error checking login status:', error);
                setIsLoggedIn(false);
                setFormLocked(false);
            }
        };

        // Check immediately
        checkLoginStatus();

        // Listen for localStorage changes
        const handleStorageChange = (e) => {
            if (e.key === 'user') {
                checkLoginStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Validate form fields
    const validateField = (field, value) => {
        let isValid = false;
        switch (field) {
            case 'firstName':
            case 'lastName':
                isValid = value.trim().length >= 2;
                break;
            case 'phone':
                isValid = /^[0-9]{10,11}$/.test(value.replace(/\D/g, ''));
                break;
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                break;
            case 'partnerPhone':
                isValid = value === '' || /^[0-9]{10,11}$/.test(value.replace(/\D/g, ''));
                break;
            default:
                isValid = false;
        }

        setValidation(prev => ({ ...prev, [field]: isValid }));
        return isValid;
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        // Don't allow changes if form is locked and field is not partnerPhone or email
        if (formLocked && field !== 'partnerPhone' && field !== 'email') {
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    };

    // Check partner info
    const checkPartnerInfo = async (phone) => {
        if (!phone || phone.length < 10) {
            setPartnerInfo(null);
            return;
        }

        setPartnerLoading(true);
        try {
            // TODO: Implement API endpoint /user/check-phone in backend
            // For now, simulate partner check with mock data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

            // Mock validation - accept any phone number starting with 09 or 08
            const isValidPhone = /^(09|08)\d{8}$/.test(phone);

            if (isValidPhone) {
                setPartnerInfo({
                    name: `Hội viên ${phone}`,
                    isValid: true
                });
            } else {
                setPartnerInfo({
                    name: null,
                    isValid: false,
                    message: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại bắt đầu bằng 09 hoặc 08."
                });
            }

            // Uncomment below when API endpoint is ready:
            /*
            const data = await api.get(`/user/check-phone/${phone}`, {}, false);
            
            if (data.success && data.user) {
                setPartnerInfo({
                    name: `${data.user.ho} ${data.user.ten}`,
                    isValid: true
                });
            } else {
                setPartnerInfo({
                    name: null,
                    isValid: false,
                    message: "Người dùng này chưa phải là hội viên Billions Fitness. Vui lòng mời họ đăng ký trước."
                });
            }
            */
        } catch (err) {
            console.error('Error checking partner info:', err);
            setPartnerInfo({
                name: null,
                isValid: false,
                message: "Lỗi kiểm tra thông tin. Vui lòng thử lại."
            });
        } finally {
            setPartnerLoading(false);
        }
    };

    // Handle partner phone change with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.partnerPhone && validateField('partnerPhone', formData.partnerPhone)) {
                checkPartnerInfo(formData.partnerPhone);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.partnerPhone]);

    // Handle payment method selection
    const handlePaymentMethod = (method) => {
        setPaymentMethod(method);
    };

    // Process payment
    const handlePayment = async () => {
        // Validate all required fields
        const isFormValid = validation.firstName && validation.lastName &&
            validation.phone && validation.email && paymentMethod;

        if (!isFormValid) {
            alert('Vui lòng điền đầy đủ thông tin và chọn phương thức thanh toán');
            return;
        }

        // If partner is required, validate partner info
        if (packageData.soLuongNguoiThamGia === 2) {
            if (!partnerInfo || !partnerInfo.isValid) {
                alert('Vui lòng nhập thông tin người tập cùng hợp lệ');
                return;
            }
        }

        setIsProcessing(true);
        try {
            // Get user ID from localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user._id || user.id;

            if (!userId) {
                alert('Vui lòng đăng nhập để thanh toán');
                setIsProcessing(false);
                return;
            }

            // Prepare payment data
            const paymentRequest = {
                packageId: packageData._id,
                userId: userId,
                paymentData: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    partnerPhone: formData.partnerPhone,
                    partnerInfo: packageData.soLuongNguoiThamGia === 2 ? partnerInfo : null,
                    startDate: startDate
                }
            };

            console.log('Creating payment:', paymentRequest);

            let response;
            if (paymentMethod === 'momo') {
                response = await fetch('http://localhost:4000/api/payment/momo/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paymentRequest)
                });
                response = await response.json();
            } else if (paymentMethod === 'zalopay') {
                response = await fetch('http://localhost:4000/api/payment/zalo/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paymentRequest)
                });
                response = await response.json();
            }

            if (response.success) {
                // Redirect to payment gateway
                const paymentUrl = response.data.paymentUrl;
                console.log('Redirecting to payment URL:', paymentUrl);

                // Show success message
                alert('Đang chuyển hướng đến trang thanh toán...');

                // Redirect to payment gateway
                window.location.href = paymentUrl;
            } else {
                alert('Tạo thanh toán thất bại: ' + response.message);
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert('Có lỗi xảy ra khi tạo thanh toán: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    if (loading) {
        return (
            <SimpleLayout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
                <div className="checkout-loading">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    if (error || !packageData) {
        return (
            <SimpleLayout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
                <div className="checkout-error">
                    <div className="error-content">
                        <h2>⚠️ {error || 'Không tìm thấy gói tập'}</h2>
                        <button onClick={() => navigate('/')} className="back-button">
                            ← Quay lại trang chủ
                        </button>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
            <div className="checkout-page">
                <div className="checkout-header">
                    <button onClick={() => navigate(-1)} className="back-button">
                        ← Checkout
                    </button>
                </div>

                <div className="checkout-container">
                    <div className="checkout-grid">
                        {/* Left Column - Checkout Form */}
                        <div className="checkout-form-section">
                            {/* 1. Contact Information */}
                            <div className="form-section">
                                <div className="section-header">
                                    <h3 className="section-title">1. Thông tin hội viên</h3>
                                    {isLoggedIn && (
                                        <div className="login-status">
                                            <span className="login-badge">✓ Đã đăng nhập</span>
                                            <span className="locked-badge">🔒 Thông tin được khóa</span>
                                            <button
                                                className="refresh-info-btn"
                                                onClick={() => window.location.reload()}
                                                title="Làm mới thông tin"
                                            >
                                                🔄
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!isLoggedIn && (
                                    <div className="login-prompt">
                                        <p>💡 <strong>Mẹo:</strong> Đăng nhập để tự động điền thông tin và thanh toán nhanh hơn!</p>
                                        <div className="login-actions">
                                            <button
                                                className="login-suggestion-btn"
                                                onClick={onNavigateToLogin}
                                            >
                                                Đăng nhập ngay
                                            </button>
                                            <button
                                                className="debug-btn"
                                                onClick={() => {
                                                    const user = JSON.parse(localStorage.getItem('user'));
                                                    console.log('Debug - localStorage user:', user);
                                                    alert(`Debug Info:\nUser: ${JSON.stringify(user, null, 2)}\nIsLoggedIn: ${isLoggedIn}\nFormLocked: ${formLocked}`);
                                                }}
                                                title="Debug thông tin đăng nhập"
                                            >
                                                🐛 Debug
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>HỌ</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className={`modern-input ${validation.firstName ? 'valid' : ''} ${!validation.firstName && formData.firstName ? 'error' : ''} ${formLocked ? 'locked' : ''}`}
                                            placeholder="Nhập họ của bạn"
                                            disabled={formLocked}
                                            readOnly={formLocked}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>TÊN</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className={`modern-input ${validation.lastName ? 'valid' : ''} ${!validation.lastName && formData.lastName ? 'error' : ''} ${formLocked ? 'locked' : ''}`}
                                            placeholder="Nhập tên của bạn"
                                            disabled={formLocked}
                                            readOnly={formLocked}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>SỐ ĐIỆN THOẠI</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`modern-input ${validation.phone ? 'valid' : ''} ${!validation.phone && formData.phone ? 'error' : ''} ${formLocked ? 'locked' : ''}`}
                                        placeholder="Nhập số điện thoại"
                                        disabled={formLocked}
                                        readOnly={formLocked}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>E-MAIL</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`modern-input ${validation.email ? 'valid' : ''} ${!validation.email && formData.email ? 'error' : ''}`}
                                        placeholder="Nhập địa chỉ email"
                                    />
                                </div>
                            </div>

                            {/* 2. Package Summary */}
                            <div className="form-section">
                                <h3 className="section-title">2. Thông tin gói tập</h3>
                                <div className="package-summary-card">
                                    <div className="package-info">
                                        <h4>{packageData.tenGoiTap}</h4>
                                        <p>Thời hạn: {packageData.thoiHan} {packageData.donViThoiHan.toLowerCase()}</p>
                                        <p>Số người tham gia: {packageData.soLuongNguoiThamGia}</p>
                                        <div className="price-info">
                                            {packageData.giaGoc && packageData.giaGoc > packageData.donGia && (
                                                <span className="original-price">{formatPrice(packageData.giaGoc)}₫</span>
                                            )}
                                            <span className="current-price">{formatPrice(packageData.donGia)}₫</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Partner Information for 2-person packages */}
                                {packageData.soLuongNguoiThamGia === 2 && (
                                    <div className="partner-info">
                                        <label>SỐ ĐIỆN THOẠI NGƯỜI TẬP CÙNG</label>
                                        <input
                                            type="tel"
                                            value={formData.partnerPhone}
                                            onChange={(e) => handleInputChange('partnerPhone', e.target.value)}
                                            placeholder="Nhập số điện thoại người tập cùng"
                                        />

                                        {partnerLoading && (
                                            <div className="partner-loading">Đang kiểm tra...</div>
                                        )}

                                        {partnerInfo && (
                                            <div className={`partner-result ${partnerInfo.isValid ? 'valid' : 'invalid'}`}>
                                                {partnerInfo.isValid ? (
                                                    <div>
                                                        <span className="checkmark">✓</span>
                                                        <span>{partnerInfo.name}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="warning">⚠️</span>
                                                        <span>{partnerInfo.message}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 3. Payment Method */}
                            <div className="form-section">
                                <h3 className="section-title">3. Phương thức thanh toán</h3>
                                <div className="payment-methods">
                                    <button
                                        className={`payment-method ${paymentMethod === 'zalopay' ? 'active zalopay' : ''}`}
                                        onClick={() => handlePaymentMethod('zalopay')}
                                    >
                                        <div className="payment-logo zalopay">ZP</div>
                                        <span>ZaloPay</span>
                                    </button>
                                    <button
                                        className={`payment-method ${paymentMethod === 'momo' ? 'active momo' : ''}`}
                                        onClick={() => handlePaymentMethod('momo')}
                                    >
                                        <div className="payment-logo momo">M</div>
                                        <span>MoMo</span>
                                    </button>
                                </div>
                            </div>

                            {/* 4. Transaction Details */}
                            <div className="form-section">
                                <h3 className="section-title">4. Thông tin giao dịch</h3>
                                <div className="transaction-details">
                                    <div className="detail-item">
                                        <label>Ngày đăng ký:</label>
                                        <input type="date" value={todayString} readOnly disabled />
                                    </div>
                                    <div className="detail-item">
                                        <label>Ngày bắt đầu tập:</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            min={todayString}
                                            onChange={handleStartDateChange}
                                        />
                                    </div>
                                    {packageData.soLuongNguoiThamGia === 2 && (
                                        <div className="detail-note">
                                            <span>ℹ️</span>
                                            <span>Cả hai hội viên cần hoàn tất thanh toán để kích hoạt gói tập.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="order-summary-section">
                            <div className="order-summary-card">
                                <h3>Đơn hàng</h3>

                                <div className="order-item">
                                    <div className="item-info">
                                        <h4>{packageData.tenGoiTap}</h4>
                                        <p>Thời hạn: {packageData.thoiHan} {packageData.donViThoiHan.toLowerCase()}</p>
                                        <p>Số người: {packageData.soLuongNguoiThamGia}</p>
                                    </div>
                                </div>

                                <div className="order-breakdown">
                                    <div className="breakdown-item">
                                        <span>Giá gốc:</span>
                                        <span>{formatPrice(packageData.giaGoc || packageData.donGia)}₫</span>
                                    </div>
                                    {packageData.giaGoc && packageData.giaGoc > packageData.donGia && (
                                        <div className="breakdown-item discount">
                                            <span>Giảm giá:</span>
                                            <span>-{formatPrice(packageData.giaGoc - packageData.donGia)}₫</span>
                                        </div>
                                    )}
                                </div>

                                <div className="order-total">
                                    <span>TỔNG CỘNG:</span>
                                    <span className="total-amount">{formatPrice(packageData.donGia)}₫</span>
                                </div>

                                <button
                                    className={`premium-checkout-button ${paymentMethod ? 'active' : ''}`}
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <div className="processing" aria-label="Đang xử lý">
                                            <div className="spinner-small"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <span>Xác nhận & Thanh toán</span>
                                            <span>→</span>
                                        </>
                                    )}
                                </button>

                                <div className="premium-terms-agreement">
                                    <label className="premium-checkbox-container">
                                        <input type="checkbox" defaultChecked />
                                        <span className="premium-checkmark"></span>
                                        <span className="terms-text">
                                            Bằng cách xác nhận đơn hàng, tôi chấp nhận{' '}
                                            <a href="/terms" className="terms-link">điều khoản sử dụng</a>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
};

export default Checkout;
