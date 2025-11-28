import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleLayout from '../components/layout/SimpleLayout';
import Reviews from '../components/Reviews';
import RatingSummary from '../components/RatingSummary';
import CompareModal from '../components/CompareModal';
import { api } from '../services/api';
import './PackageDetail.css';
import { formatDurationUnitLabel, normalizeDurationUnit } from '../utils/duration';

const PackageDetail = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [allPackages, setAllPackages] = useState([]);
    const [showServices, setShowServices] = useState(false);
    const [user, setUser] = useState(null);
    const [showReviews, setShowReviews] = useState(false);
    const [selectedPackageForCompare, setSelectedPackageForCompare] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsAuthenticated(false);
            if (onNavigateToLogin) {
                onNavigateToLogin();
            } else {
                navigate('/login');
            }
            return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setIsAuthenticated(true);
    }, [navigate, onNavigateToLogin]);

    useEffect(() => {
        if (!isAuthenticated) return;

        window.scrollTo(0, 0);
        fetchPackageDetail();
        fetchAllPackages();
    }, [id, isAuthenticated]);

    const handleRatingClick = () => {
        setShowReviews(true);
        setTimeout(() => {
            const reviewsSection = document.querySelector('.reviews-section');
            if (reviewsSection) {
                reviewsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    };

    const handleCompareClick = () => {
        setSelectedPackageForCompare(packageData);
        setShowCompareModal(true);
    };

    const handleCloseCompareModal = () => {
        setShowCompareModal(false);
        setSelectedPackageForCompare(null);
    };

    const fetchPackageDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔍 Fetching package detail for ID:', id);

            const response = await api.get(`/goitap/${id}`, {}, false);
            console.log('📦 Package detail response:', response);

            setPackageData(response);
        } catch (error) {
            console.error('❌ Error fetching package detail:', error);
            setError('Không thể tải thông tin gói tập');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPackages = async () => {
        try {
            const response = await api.get('/goitap', {}, false);
            setAllPackages(Array.isArray(response) ? response.filter(pkg => pkg.kichHoat) : []);
        } catch (error) {
            console.error('❌ Error fetching all packages:', error);
        }
    };

    const handleRegister = () => {
        if (!packageData) return;
        navigate(`/checkout/${packageData._id}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    const getPackageTypeLabel = (loaiGoiTap) => {
        const types = {
            'CaNhan': '💪 Cá Nhân',
            'Nhom': '👥 Nhóm',
            'CongTy': '🏢 Công Ty'
        };
        return types[loaiGoiTap] || loaiGoiTap;
    };

    const getDurationLabel = (thoiHan, donViThoiHan) => {
        if (thoiHan >= 36500) return '♾️ Vĩnh viễn';
        const normalized = normalizeDurationUnit(donViThoiHan);
        if (normalized === 'phut') {
            return `⚡ Thử ${thoiHan} ${formatDurationUnitLabel(donViThoiHan).toLowerCase()}`;
        }
        if (normalized === 'nam' || thoiHan >= 365) return '📆 Theo năm';
        if (normalized === 'thang') return '📅 Theo tháng';
        return '📅 Theo ngày';
    };

    const getPackageFeatures = (pkg) => {
        // Sử dụng dữ liệu quyền lợi từ database
        if (pkg.quyenLoi && pkg.quyenLoi.length > 0) {
            return pkg.quyenLoi.map(benefit => ({
                text: benefit.tenQuyenLoi,
                description: benefit.moTa,
                icon: benefit.icon,
                type: benefit.loai
            }));
        }

        // Fallback nếu không có dữ liệu quyền lợi
        const baseFeatures = [
            'Truy cập tất cả video bài tập',
            'Theo dõi tiến độ cá nhân',
            'Cộng đồng hỗ trợ online 24/7',
            'Hỗ trợ từ huấn luyện viên chuyên nghiệp'
        ];

        if (pkg.loaiGoiTap === 'CaNhan') {
            return [
                ...baseFeatures,
                'Kế hoạch lập luyện cá nhân hóa',
                'Hướng dẫn dinh dưỡng cơ bản',
                'Truy cập lớp tập nhóm miễn phí',
                'Đánh giá thể lực định kỳ',
                'Tư vấn sức khỏe qua app'
            ].map(feature => ({ text: feature, icon: '💪', type: 'co_ban' }));
        } else if (pkg.loaiGoiTap === 'Nhom') {
            return [
                ...baseFeatures,
                'Kế hoạch lập luyện nâng cao',
                'Huấn luyện dinh dưỡng toàn diện',
                'Truy cập chương trình tập nâng cao',
                'Phân tích thành phần cơ thể',
                'Hỗ trợ nhóm tập luyện'
            ].map(feature => ({ text: feature, icon: '👥', type: 'co_ban' }));
        } else {
            return [
                ...baseFeatures,
                'Kế hoạch tập và dinh dưỡng tùy chỉnh hoàn toàn',
                'Kiểm tra hàng tuần với huấn luyện viên',
                'Truy cập tất cả tính năng nền tảng',
                'Giảm giá thiết bị độc quyền',
                'Hỗ trợ doanh nghiệp 24/7'
            ].map(feature => ({ text: feature, icon: '🏢', type: 'co_ban' }));
        }
    };

    const toggleServices = () => {
        setShowServices(!showServices);
    };

    if (loading) {
        return (
            <SimpleLayout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
                <div className="package-detail-loading">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    if (error) {
        return (
            <SimpleLayout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
                <div className="package-detail-error">
                    <div className="error-content">
                        <h2>⚠️ {error}</h2>
                        <button onClick={() => navigate('/')} className="back-button">
                            ← Quay lại trang chủ
                        </button>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    if (!packageData) {
        return (
            <SimpleLayout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
                <div className="package-detail-error">
                    <div className="error-content">
                        <h2>❌ Không tìm thấy gói tập</h2>
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
            <div className="package-detail-page">
                {/* Package Detail Content */}
                <div className="package-detail-container">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-5 bg-[#da2128] text-white px-4 py-1 rounded-lg hover:opacity-90 transition-opacity shadow-lg inline-flex items-center justify-center gap-2 hover:underline cursor-pointer w-fit"
                    >
                        ← Quay lại
                    </button>

                    <div className="package-detail-grid">
                        {/* Left Column - Image */}
                        <div className="package-image-section">
                            <div className="package-image-container">
                                {packageData.hinhAnhDaiDien ? (
                                    <img
                                        src={packageData.hinhAnhDaiDien}
                                        alt={packageData.tenGoiTap}
                                        className="package-image"
                                    />
                                ) : (
                                    <div className="package-image-placeholder">
                                        <div className="placeholder-icon">🏋️‍♂️</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Package Info */}
                        <div className="package-info-section">
                            <div className="package-info-content">
                                {/* Package Name */}
                                <h1 className="package-name">{packageData.tenGoiTap}</h1>

                                {/* Package Description */}
                                <p className="package-description">{packageData.moTa}</p>

                                {/* Package Type */}
                                <div className="package-type">
                                    <span className="package-type-label">Loại gói:</span>
                                    <span className="package-type-value">{getPackageTypeLabel(packageData.loaiGoiTap)}</span>
                                </div>

                                {/* Duration */}
                                <div className="package-duration">
                                    <span className="package-duration-label">Thời hạn:</span>
                                    <span className="package-duration-value">{getDurationLabel(packageData.thoiHan, packageData.donViThoiHan)}</span>
                                </div>

                                {/* Rating Summary */}
                                <RatingSummary
                                    averageRating={4.5}
                                    totalReviews={127}
                                    onClick={handleRatingClick}
                                />

                                {/* Services & Benefits */}
                                <div className="package-services">
                                    <button
                                        onClick={toggleServices}
                                        className="services-title-button"
                                    >
                                        <h3 className="services-title">Dịch vụ & Quyền lợi</h3>
                                        <svg
                                            className={`services-arrow ${showServices ? 'rotated' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showServices && (
                                        <ul className="services-list">
                                            {getPackageFeatures(packageData).map((feature, index) => (
                                                <li key={index} className={`service-item service-${feature.type}`}>
                                                    <span className="service-icon">{feature.icon}</span>
                                                    <div className="service-content">
                                                        <div className="service-text">{feature.text}</div>
                                                        {feature.description && (
                                                            <div className="service-description">{feature.description}</div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section - Price & Actions */}
                        <div className="package-actions-section">
                            <div className="package-price-info">
                                <div className="price-display">
                                    <span className="price-amount">{formatPrice(packageData.donGia)}₫</span>
                                </div>
                                {packageData.giaGoc && packageData.giaGoc > packageData.donGia && (
                                    <div className="original-price">
                                        <span className="original-price-text">{formatPrice(packageData.giaGoc)}₫</span>
                                        <span className="discount-badge">
                                            -{Math.round((1 - packageData.donGia / packageData.giaGoc) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="register-button"
                                    onClick={handleRegister}
                                    disabled={isRegistering}
                                >
                                    {isRegistering ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                                </button>
                                <button
                                    className="compare-button"
                                    onClick={handleCompareClick}
                                >
                                    So sánh gói tập
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                {showReviews && (
                    <Reviews
                        packageId={id}
                        user={user}
                        onNavigateToLogin={onNavigateToLogin}
                    />
                )}

                {/* Compare Modal */}
                <CompareModal
                    isOpen={showCompareModal}
                    onClose={handleCloseCompareModal}
                    selectedPackage={selectedPackageForCompare}
                    allPackages={allPackages}
                    onNavigateToPackage={navigate}
                />
            </div>
        </SimpleLayout>
    );
};

export default PackageDetail;
