import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompareModal.css';

const CompareModal = ({
    isOpen,
    onClose,
    selectedPackage,
    allPackages,
    onNavigateToPackage
}) => {
    const navigate = useNavigate();
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [comparisonPackages, setComparisonPackages] = useState([]);

    useEffect(() => {
        if (isOpen && selectedPackage) {
            // Tự động chọn gói được click
            setSelectedPackages([selectedPackage._id]);
            setComparisonPackages([selectedPackage]);
        }
    }, [isOpen, selectedPackage]);

    const handlePackageSelect = (packageId) => {
        const packageData = allPackages.find(pkg => pkg._id === packageId);
        if (!packageData) return;

        setSelectedPackages(prev => {
            if (prev.includes(packageId)) {
                // Bỏ chọn nếu đã được chọn
                return prev.filter(id => id !== packageId);
            } else {
                // Thêm vào danh sách chọn (tối đa 4 gói)
                if (prev.length >= 4) {
                    alert('Chỉ có thể so sánh tối đa 4 gói tập cùng lúc');
                    return prev;
                }
                return [...prev, packageId];
            }
        });

        setComparisonPackages(prev => {
            if (prev.find(pkg => pkg._id === packageId)) {
                return prev.filter(pkg => pkg._id !== packageId);
            } else {
                if (prev.length >= 4) return prev;
                return [...prev, packageData];
            }
        });
    };

    const handleViewDetail = (packageId) => {
        onClose();
        navigate(`/goi-tap/${packageId}`);
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
        if (thoiHan >= 365) return '📆 Theo năm';
        return '📅 Theo tháng';
    };

    const getPricePeriod = (thoiHan) => {
        if (thoiHan >= 36500) return 'lần';
        if (thoiHan >= 365) return 'năm';
        return 'tháng';
    };

    const getBenefitsCount = (packageData) => {
        return packageData.quyenLoi ? packageData.quyenLoi.length : 0;
    };

    const getBenefitsByType = (packageData, type) => {
        if (!packageData.quyenLoi) return 0;
        return packageData.quyenLoi.filter(benefit => benefit.loai === type).length;
    };

    const getPackageClass = (pkg) => {
        const name = pkg.tenGoiTap.toLowerCase();
        if (name.includes('cơ bản') || name.includes('basic')) return 'basic';
        if (name.includes('premium')) return 'premium';
        if (name.includes('vip')) return 'vip';
        if (name.includes('lifetime')) return 'lifetime';
        return 'basic';
    };

    const getFeatureValue = (pkg, feature) => {
        switch (feature) {
            case 'price':
                return `${formatPrice(pkg.donGia)}₫`;
            case 'duration':
                return getDurationLabel(pkg.thoiHan, pkg.donViThoiHan);
            case 'type':
                return getPackageTypeLabel(pkg.loaiGoiTap);
            case 'total_benefits':
                return `${getBenefitsCount(pkg)} quyền lợi`;
            case 'basic_benefits':
                return getBenefitsByType(pkg, 'co_ban');
            case 'advanced_benefits':
                return getBenefitsByType(pkg, 'cao_cap');
            case 'vip_benefits':
                return getBenefitsByType(pkg, 'vip');
            case 'premium_benefits':
                return getBenefitsByType(pkg, 'premium');
            case 'equipment':
                return hasBenefit(pkg, ['dụng cụ', 'máy tập', 'thiết bị', 'cardio', 'tạ']) ? '✓' : '✕';
            case 'shower':
                return hasBenefit(pkg, ['phòng tắm', 'tắm', 'shower']) ? '✓' : '✕';
            case 'locker':
                return hasBenefit(pkg, ['locker', 'tủ đồ', 'tủ khóa']) ? '✓' : '✕';
            case 'sauna':
                return hasBenefit(pkg, ['xông hơi', 'sauna', 'phòng xông']) ? '✓' : '✕';
            case 'pt':
                return hasBenefit(pkg, ['PT', 'huấn luyện viên', 'personal trainer', 'hướng dẫn']) ? '✓' : '✕';
            case 'nutrition':
                return hasBenefit(pkg, ['dinh dưỡng', 'tư vấn dinh dưỡng', 'thực đơn', 'chế độ ăn']) ? '✓' : '✕';
            case 'massage':
                return hasBenefit(pkg, ['massage', 'mát xa', 'spa']) ? '✓' : '✕';
            case 'rating':
                return '4.5 ⭐ (127)';
            default:
                return '—';
        }
    };

    const hasBenefit = (pkg, keywords) => {
        if (!pkg.quyenLoi || !Array.isArray(pkg.quyenLoi)) return false;

        return pkg.quyenLoi.some(benefit => {
            const text = `${benefit.tenQuyenLoi} ${benefit.moTa || ''}`.toLowerCase();
            return keywords.some(keyword => text.includes(keyword.toLowerCase()));
        });
    };

    if (!isOpen) return null;

    return (
        <div className="compare-modal-overlay" onClick={onClose}>
            <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="compare-modal-header">
                    <h2 className="compare-modal-title">So sánh gói tập</h2>
                    <button className="compare-modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                {/* Package Selection */}
                <div className="compare-package-selection">
                    <h3 className="selection-title">Chọn gói để so sánh (tối đa 4 gói):</h3>
                    <div className="package-grid">
                        {allPackages.map((pkg) => (
                            <div
                                key={pkg._id}
                                className={`package-select-card ${selectedPackages.includes(pkg._id) ? 'selected' : ''
                                    }`}
                                onClick={() => handlePackageSelect(pkg._id)}
                            >
                                <div className="package-select-info">
                                    <h4 className="package-select-name">{pkg.tenGoiTap}</h4>
                                    <p className="package-select-price">{formatPrice(pkg.donGia)}₫</p>
                                    <p className="package-select-type">{getPackageTypeLabel(pkg.loaiGoiTap)}</p>
                                </div>
                                <div className="package-select-checkbox">
                                    {selectedPackages.includes(pkg._id) ? '✓' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison Table */}
                {comparisonPackages.length > 0 && (
                    <div className="comparison-table-container">
                        <h3 className="comparison-title">
                            So sánh {comparisonPackages.length} gói tập
                        </h3>

                        <div className="comparison-table">
                            {comparisonPackages.map((pkg) => {
                                const packageClass = getPackageClass(pkg);
                                const features = [
                                    { icon: '⏰', label: 'Thời hạn', feature: 'duration' },
                                    { icon: '👥', label: 'Loại gói', feature: 'type' },
                                    { icon: '🎁', label: 'Tổng quyền lợi', feature: 'total_benefits' },
                                    { icon: '🔹', label: 'Quyền lợi cơ bản', feature: 'basic_benefits' },
                                    { icon: '🔸', label: 'Quyền lợi cao cấp', feature: 'advanced_benefits' },
                                    { icon: '🥈', label: 'Quyền lợi VIP', feature: 'vip_benefits' },
                                    { icon: '👑', label: 'Quyền lợi Premium', feature: 'premium_benefits' },
                                    { icon: '🏋️', label: 'Dụng cụ tập', feature: 'equipment' },
                                    { icon: '🚿', label: 'Phòng tắm', feature: 'shower' },
                                    { icon: '🔒', label: 'Locker', feature: 'locker' },
                                    { icon: '🧖', label: 'Xông hơi', feature: 'sauna' },
                                    { icon: '💪', label: 'PT riêng', feature: 'pt' },
                                    { icon: '🥗', label: 'Dinh dưỡng', feature: 'nutrition' },
                                    { icon: '💆', label: 'Massage', feature: 'massage' },
                                    { icon: '⭐', label: 'Đánh giá', feature: 'rating' }
                                ];

                                return (
                                    <div key={pkg._id} className="package-column">
                                        {/* Package Header */}
                                        <div className={`package-header ${packageClass}`}>
                                            <h4 className="package-name-1">{pkg.tenGoiTap}</h4>
                                            <div className="package-price-info">
                                                <div className="package-price">{formatPrice(pkg.donGia)}₫</div>
                                                <div className="package-period">/{getPricePeriod(pkg.thoiHan)}</div>
                                            </div>
                                            <button
                                                className="view-detail-btn"
                                                onClick={() => handleViewDetail(pkg._id)}
                                            >
                                                Đăng ký ngay
                                            </button>
                                        </div>

                                        {/* Package Features */}
                                        <div className="package-features">
                                            {features.map((feature, index) => {
                                                const value = getFeatureValue(pkg, feature.feature);
                                                const isCheckmark = value === '✓';
                                                const isCross = value === '✕';

                                                return (
                                                    <div key={index} className="package-feature-item">
                                                        <div className="package-feature-label">
                                                            <span className="package-feature-icon">{feature.icon}</span>
                                                            <span>{feature.label}</span>
                                                        </div>
                                                        <div className="package-feature-value">
                                                            <span className={isCheckmark ? 'checkmark' : isCross ? 'cross' : ''}>
                                                                {value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Real Benefits from Database */}
                                            <div className="package-feature-item">
                                                <div className="package-feature-label">
                                                    <span className="package-feature-icon">📋</span>
                                                    <span>Chi tiết quyền lợi</span>
                                                </div>
                                                <div className="package-feature-value">
                                                    <div className="benefits-list">
                                                        {pkg.quyenLoi && pkg.quyenLoi.length > 0 ? (
                                                            pkg.quyenLoi.slice(0, 3).map((benefit, idx) => (
                                                                <div key={idx} className="benefit-item">
                                                                    <span className="benefit-icon">{benefit.icon}</span>
                                                                    <span className="benefit-name">{benefit.tenQuyenLoi}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="no-benefits">Không có</span>
                                                        )}
                                                        {pkg.quyenLoi && pkg.quyenLoi.length > 3 && (
                                                            <div className="more-benefits">
                                                                +{pkg.quyenLoi.length - 3} quyền lợi khác
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="compare-modal-footer">
                    <button className="close-comparison-btn" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompareModal;
