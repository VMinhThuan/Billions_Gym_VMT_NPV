import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const { width, height } = Dimensions.get('window');

const PackageCompareScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [allPackages, setAllPackages] = useState([]);
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [comparisonPackages, setComparisonPackages] = useState([]);

    const initialPackageId = route.params?.packageId;

    useEffect(() => {
        fetchAllPackages();
    }, []);

    const fetchAllPackages = async () => {
        try {
            setLoading(true);
            // Use public endpoint /goitap instead of /user/goitap
            const response = await apiService.apiCall('/goitap', 'GET', null, false);
            console.log('📦 All Packages Response:', response);

            let packages = [];
            if (response && response.data) {
                packages = response.data;
            } else if (Array.isArray(response)) {
                packages = response;
            }

            console.log('📦 Packages Array:', packages);
            console.log('📦 Number of packages:', packages.length);
            setAllPackages(packages);

            // Auto-select the initial package if provided
            if (initialPackageId && packages.length > 0) {
                const initialPkg = packages.find(pkg => pkg._id === initialPackageId);
                console.log('🎯 Initial Package:', initialPkg);
                if (initialPkg) {
                    setSelectedPackages([initialPackageId]);
                    setComparisonPackages([initialPkg]);
                }
            }
        } catch (err) {
            console.error('❌ Error fetching packages:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách gói tập');
        } finally {
            setLoading(false);
        }
    };

    const handlePackageSelect = (packageId) => {
        const packageData = allPackages.find(pkg => pkg._id === packageId);
        if (!packageData) return;

        setSelectedPackages(prev => {
            if (prev.includes(packageId)) {
                // Deselect if already selected
                return prev.filter(id => id !== packageId);
            } else {
                // Add to selection (max 4 packages)
                if (prev.length >= 4) {
                    Alert.alert('Giới hạn', 'Chỉ có thể so sánh tối đa 4 gói tập cùng lúc');
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
        navigation.navigate('PackageDetail', { packageId });
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

        const unitMap = {
            'Ngay': 'ngày',
            'Tuan': 'tuần',
            'Thang': 'tháng',
            'Nam': 'năm',
        };

        const unit = unitMap[donViThoiHan] || donViThoiHan?.toLowerCase() || '';

        if (donViThoiHan === 'Nam' || thoiHan >= 365) return '📆 Theo năm';
        if (donViThoiHan === 'Thang' || thoiHan >= 30) return '📅 Theo tháng';
        return '📅 Theo ngày';
    };

    const getPricePeriod = (thoiHan, donViThoiHan) => {
        if (thoiHan >= 36500) return 'lần';

        const unitMap = {
            'Ngay': 'ngày',
            'Tuan': 'tuần',
            'Thang': 'tháng',
            'Nam': 'năm',
        };

        const unit = unitMap[donViThoiHan] || donViThoiHan?.toLowerCase() || '';

        if (donViThoiHan === 'Nam' || thoiHan >= 365) return 'năm';
        if (donViThoiHan === 'Thang' || thoiHan >= 30) return 'tháng';
        return 'ngày';
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

    const hasBenefit = (pkg, keywords) => {
        if (!pkg.quyenLoi || !Array.isArray(pkg.quyenLoi)) return false;

        return pkg.quyenLoi.some(benefit => {
            const text = `${benefit.tenQuyenLoi} ${benefit.moTa || ''}`.toLowerCase();
            return keywords.some(keyword => text.includes(keyword.toLowerCase()));
        });
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

    const getPackageHeaderStyle = (packageClass) => {
        switch (packageClass) {
            case 'basic':
                return { backgroundColor: 'rgba(107, 114, 128, 0.2)' };
            case 'premium':
                return { backgroundColor: 'rgba(220, 38, 38, 0.2)' };
            case 'vip':
                return { backgroundColor: 'rgba(250, 204, 21, 0.2)' };
            case 'lifetime':
                return { backgroundColor: 'rgba(14, 165, 233, 0.2)' };
            default:
                return { backgroundColor: 'rgba(107, 114, 128, 0.2)' };
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#da2128" />
                        <Text style={styles.loadingText}>Đang tải danh sách gói tập...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>So sánh gói tập</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Package Selection */}
                    <View style={styles.selectionSection}>
                        <Text style={styles.selectionTitle}>Chọn gói để so sánh (tối đa 4 gói):</Text>
                        <ScrollView
                            style={styles.packageGrid}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {allPackages.map((pkg) => (
                                <TouchableOpacity
                                    key={pkg._id}
                                    style={[
                                        styles.packageSelectCard,
                                        selectedPackages.includes(pkg._id) && styles.packageSelectCardSelected
                                    ]}
                                    onPress={() => handlePackageSelect(pkg._id)}
                                >
                                    <View style={styles.packageSelectInfo}>
                                        <Text style={styles.packageSelectName}>{pkg.tenGoiTap}</Text>
                                        <Text style={styles.packageSelectPrice}>{formatPrice(pkg.donGia)}₫</Text>
                                        <Text style={styles.packageSelectType}>{getPackageTypeLabel(pkg.loaiGoiTap)}</Text>
                                    </View>
                                    <View style={[
                                        styles.packageSelectCheckbox,
                                        selectedPackages.includes(pkg._id) && styles.packageSelectCheckboxSelected
                                    ]}>
                                        {selectedPackages.includes(pkg._id) && (
                                            <Text style={styles.checkboxText}>✓</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Comparison Table */}
                    {comparisonPackages.length > 0 && (
                        <View style={styles.comparisonSection}>
                            <Text style={styles.comparisonTitle}>
                                SO SÁNH {comparisonPackages.length} GÓI TẬP
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={true}
                                style={styles.comparisonScroll}
                            >
                                <View style={styles.comparisonTable}>
                                    {comparisonPackages.map((pkg) => {
                                        const packageClass = getPackageClass(pkg);
                                        const headerStyle = getPackageHeaderStyle(packageClass);

                                        return (
                                            <View key={pkg._id} style={styles.packageColumn}>
                                                {/* Package Header */}
                                                <View style={[styles.packageHeader, headerStyle]}>
                                                    <Text style={styles.packageName}>{pkg.tenGoiTap}</Text>
                                                    <View style={styles.packagePriceInfo}>
                                                        <Text style={styles.packagePrice}>{formatPrice(pkg.donGia)}₫</Text>
                                                        <Text style={styles.packagePeriod}>/{getPricePeriod(pkg.thoiHan, pkg.donViThoiHan)}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => handleViewDetail(pkg._id)}
                                                    >
                                                        <View style={styles.viewDetailBtn}>
                                                            <Text style={styles.viewDetailBtnText}>Đăng ký ngay</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Package Features */}
                                                <View style={styles.packageFeatures}>
                                                    {features.map((feature, index) => {
                                                        const value = getFeatureValue(pkg, feature.feature);
                                                        const isCheckmark = value === '✓';
                                                        const isCross = value === '✕';

                                                        return (
                                                            <View key={index} style={styles.featureItem}>
                                                                <View style={styles.featureLabel}>
                                                                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                                                                    <Text style={styles.featureLabelText}>{feature.label}</Text>
                                                                </View>
                                                                <View style={styles.featureValue}>
                                                                    <Text style={[
                                                                        styles.featureValueText,
                                                                        isCheckmark && styles.checkmark,
                                                                        isCross && styles.cross
                                                                    ]}>
                                                                        {value}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}

                                                    {/* Real Benefits */}
                                                    <View style={styles.featureItem}>
                                                        <View style={styles.featureLabel}>
                                                            <Text style={styles.featureIcon}>📋</Text>
                                                            <Text style={styles.featureLabelText}>Chi tiết quyền lợi</Text>
                                                        </View>
                                                        <View style={styles.featureValue}>
                                                            <View style={styles.benefitsList}>
                                                                {pkg.quyenLoi && pkg.quyenLoi.length > 0 ? (
                                                                    <>
                                                                        {pkg.quyenLoi.slice(0, 3).map((benefit, idx) => (
                                                                            <View key={idx} style={styles.benefitItem}>
                                                                                <Text style={styles.benefitIcon}>{benefit.icon || '✓'}</Text>
                                                                                <Text style={styles.benefitName} numberOfLines={2}>
                                                                                    {benefit.tenQuyenLoi}
                                                                                </Text>
                                                                            </View>
                                                                        ))}
                                                                        {pkg.quyenLoi.length > 3 && (
                                                                            <View style={styles.moreBenefits}>
                                                                                <Text style={styles.moreBenefitsText}>
                                                                                    +{pkg.quyenLoi.length - 3} quyền lợi khác
                                                                                </Text>
                                                                            </View>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <Text style={styles.noBenefits}>Không có</Text>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.closeBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    selectionSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1a1a1a',
    },
    selectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    packageGrid: {
        maxHeight: 300,
    },
    packageSelectCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageSelectCardSelected: {
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
        borderColor: '#da2128',
    },
    packageSelectInfo: {
        flex: 1,
    },
    packageSelectName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    packageSelectPrice: {
        color: '#da2128',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    packageSelectType: {
        color: '#9ca3af',
        fontSize: 14,
    },
    packageSelectCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    packageSelectCheckboxSelected: {
        backgroundColor: '#da2128',
        borderColor: '#da2128',
    },
    checkboxText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    comparisonSection: {
        padding: 20,
    },
    comparisonTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 1,
    },
    comparisonScroll: {
        flex: 1,
    },
    comparisonTable: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 4,
    },
    packageColumn: {
        width: 280,
        minHeight: 600,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    packageHeader: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    packageName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    packagePriceInfo: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    packagePrice: {
        color: '#dc2626',
        fontSize: 28,
        fontWeight: '700',
    },
    packagePeriod: {
        color: '#9ca3af',
        fontSize: 14,
        marginLeft: 4,
        marginBottom: 4,
    },
    viewDetailBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        backgroundColor: '#da2128',
    },
    viewDetailBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    packageFeatures: {
        flex: 1,
    },
    featureItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        minHeight: 56,
    },
    featureLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    featureIcon: {
        fontSize: 16,
        minWidth: 20,
    },
    featureLabelText: {
        color: '#d1d5db',
        fontSize: 14,
        fontWeight: '500',
    },
    featureValue: {
        marginLeft: 8,
    },
    featureValueText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    checkmark: {
        color: '#10b981',
        fontSize: 18,
    },
    cross: {
        color: '#6b7280',
        fontSize: 18,
    },
    benefitsList: {
        minHeight: 120,
        maxHeight: 150,
        width: '100%',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    benefitIcon: {
        fontSize: 14,
        minWidth: 16,
    },
    benefitName: {
        color: '#e5e7eb',
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    noBenefits: {
        color: '#6b7280',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    moreBenefits: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    moreBenefitsText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    closeBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    closeBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PackageCompareScreen;
