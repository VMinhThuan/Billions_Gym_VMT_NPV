import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const PricingPlans = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('CaNhan');
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');

    useEffect(() => {
        fetchPackages();
    }, []);

    useEffect(() => {
        // Tự động chọn period phù hợp khi thay đổi tab
        const filteredPackages = packages.filter(pkg => pkg.loaiGoiTap === activeTab);
        if (filteredPackages.length > 0) {
            const hasMonthly = filteredPackages.some(pkg => pkg.thoiHan < 365);
            const hasYearly = filteredPackages.some(pkg => pkg.thoiHan >= 365 && pkg.thoiHan < 5000);
            const hasLifetime = filteredPackages.some(pkg => pkg.thoiHan >= 36500);

            // Ưu tiên chọn period theo thứ tự: monthly -> yearly -> lifetime
            if (hasMonthly) {
                setSelectedPeriod('monthly');
            } else if (hasYearly) {
                setSelectedPeriod('yearly');
            } else if (hasLifetime) {
                setSelectedPeriod('lifetime');
            }
        }
    }, [activeTab, packages]);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching packages from API...');
            const response = await api.get('/goitap', {}, false);
            console.log('📦 API Response:', response);
            console.log('📦 Response type:', typeof response);
            console.log('📦 Is array:', Array.isArray(response));

            const activePackages = Array.isArray(response) ? response.filter(pkg => pkg.kichHoat) : [];
            console.log('✅ Active packages:', activePackages);
            setPackages(activePackages);
        } catch (error) {
            console.error('❌ Error fetching packages:', error);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const packageTypes = {
        'CaNhan': '💪 Cá Nhân',
        'Nhom': '👥 Nhóm',
        'CongTy': '🏢 Công Ty'
    };

    const getAvailablePeriods = () => {
        const filteredPackages = packages.filter(pkg => pkg.loaiGoiTap === activeTab);
        const periods = [];

        const hasMonthly = filteredPackages.some(pkg => pkg.thoiHan < 365);
        const hasYearly = filteredPackages.some(pkg => pkg.thoiHan >= 365 && pkg.thoiHan < 5000);
        const hasLifetime = filteredPackages.some(pkg => pkg.thoiHan >= 36500);

        if (hasMonthly) periods.push({ key: 'monthly', label: '📅 Theo tháng' });
        if (hasYearly) periods.push({ key: 'yearly', label: '📆 Theo năm' });
        if (hasLifetime) periods.push({ key: 'lifetime', label: '♾️ Vĩnh viễn' });

        return periods;
    };

    const getFilteredPackages = () => {
        return packages.filter(pkg => {
            if (pkg.loaiGoiTap !== activeTab) return false;

            // Phân loại dựa trên thoiHan
            const thoiHan = pkg.thoiHan;

            switch (selectedPeriod) {
                case 'monthly':
                    return thoiHan < 365; // Dưới 365 ngày
                case 'yearly':
                    return thoiHan >= 365 && thoiHan < 5000; // Từ 365 đến dưới 5000 ngày
                case 'lifetime':
                    return thoiHan >= 36500; // Từ 36500 ngày trở lên
                default:
                    return true;
            }
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    const getBorderColor = (index) => {
        const colors = ['#f97316', '#dc2626', '#f97316']; // Orange, Red, Orange
        return colors[index % colors.length];
    };

    const getButtonColor = (index) => {
        const colors = ['#f97316', '#dc2626', '#f97316']; // Orange, Red, Orange
        return colors[index % colors.length];
    };

    const getPackageFeatures = (pkg) => {
        const baseFeatures = [
            'Truy cập tất cả video bài tập',
            'Theo dõi tiến độ',
            'Cộng đồng hỗ trợ online'
        ];

        if (pkg.loaiGoiTap === 'CaNhan') {
            return [
                ...baseFeatures,
                'Kế hoạch tập luyện cá nhân hóa',
                'Hướng dẫn dinh dưỡng cơ bản',
                'Truy cập lớp tập nhóm',
                `Thời hạn: ${pkg.thoiHan} ${pkg.donViThoiHan.toLowerCase()}`
            ];
        } else if (pkg.loaiGoiTap === 'Nhom') {
            return [
                ...baseFeatures,
                'Kế hoạch tập luyện nâng cao',
                'Huấn luyện dinh dưỡng toàn diện',
                'Truy cập chương trình tập nâng cao',
                'Phân tích thành phần cơ thể',
                `Thời hạn: ${pkg.thoiHan} ${pkg.donViThoiHan.toLowerCase()}`
            ];
        } else {
            return [
                ...baseFeatures,
                'Kế hoạch tập và dinh dưỡng tùy chỉnh hoàn toàn',
                'Kiểm tra hàng tuần với huấn luyện viên',
                'Truy cập tất cả tính năng nền tảng',
                'Giảm giá thiết bị độc quyền',
                `Thời hạn: ${pkg.thoiHan} ${pkg.donViThoiHan.toLowerCase()}`
            ];
        }
    };

    if (loading) {
        return (
            <section className="pricing-section">
                <div className="container">
                    <div className="text-center py-16">
                        <div className="text-white text-xl">Đang tải gói tập...</div>
                    </div>
                </div>
            </section>
        );
    }

    const filteredPackages = getFilteredPackages();

    return (
        <section className="pricing-section">
            <div className="container">
                {/* Header */}
                <div className="pricing-header">
                    <h2 className="pricing-title">
                        <span className="text-gray-400">KHÁM PHÁ</span> <span className="text-red-600">GÓI TẬP</span> <span className="text-gray-400">HOÀN HẢO</span>
                    </h2>
                    <p className="pricing-subtitle">
                        Lựa chọn gói tập phù hợp với mục tiêu và ngân sách của bạn. Từ gói cá nhân đến gói doanh nghiệp, chúng tôi có giải pháp tối ưu cho mọi nhu cầu fitness.
                    </p>
                </div>

                {/* Billing Cycle Toggle */}
                {getAvailablePeriods().length > 1 && (
                    <div className="billing-toggle">
                        {getAvailablePeriods().map((period) => (
                            <button
                                key={period.key}
                                className={`billing-btn ${selectedPeriod === period.key ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod(period.key)}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Package Type Tabs */}
                <div className="package-tabs">
                    {Object.entries(packageTypes).map(([key, label]) => (
                        <button
                            key={key}
                            className={`package-tab ${activeTab === key ? 'active' : ''}`}
                            onClick={() => setActiveTab(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Pricing Cards */}
                <div className="pricing-cards">
                    {filteredPackages.length > 0 ? (
                        filteredPackages.map((pkg, index) => (
                            <div
                                key={pkg._id}
                                className="pricing-card"
                                style={{ borderColor: getBorderColor(index) }}
                            >
                                <div className="package-label" style={{ color: getBorderColor(index) }}>
                                    Gói tập
                                </div>
                                <h3 className="package-name">{pkg.tenGoiTap}</h3>
                                <p className="package-description">{pkg.moTa}</p>

                                <ul className="package-features">
                                    {getPackageFeatures(pkg).map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>

                                <div className="package-price">
                                    <span className="price-amount">
                                        {formatPrice(pkg.donGia)}₫
                                    </span>
                                    <span className="price-period">
                                        /{selectedPeriod === 'monthly' ? 'tháng' :
                                            selectedPeriod === 'yearly' ? 'năm' :
                                                selectedPeriod === 'lifetime' ? 'lần' : pkg.donViThoiHan.toLowerCase()}
                                    </span>
                                    {pkg.giaGoc && pkg.giaGoc > pkg.donGia && (
                                        <div className="original-price">
                                            <span className="original-price-text">
                                                {formatPrice(pkg.giaGoc)}₫
                                            </span>
                                            <span className="discount-badge">
                                                -{Math.round((1 - pkg.donGia / pkg.giaGoc) * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="choose-plan-btn"
                                    style={{ backgroundColor: getButtonColor(index) }}
                                >
                                    Chọn gói này
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="no-packages">
                            <p className="text-gray-400">Không có gói tập nào cho loại {packageTypes[activeTab]}</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default PricingPlans;
