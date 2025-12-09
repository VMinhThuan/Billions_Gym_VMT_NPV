import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const PackagesScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentPackage, setCurrentPackage] = useState(null);
    const [availablePackages, setAvailablePackages] = useState([]);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!userInfo || !userInfo._id) {
                setError('Vui lòng đăng nhập để xem thông tin gói tập');
                setLoading(false);
                return;
            }

            // 1) Load gói tập hiện tại
            let activePackage = null;
            try {
                const membershipResponse = await apiService.getMyMembership();
                console.log('📦 Membership response:', membershipResponse);

                let memberships = [];
                if (Array.isArray(membershipResponse)) {
                    memberships = membershipResponse;
                } else if (membershipResponse?.data) {
                    memberships = Array.isArray(membershipResponse.data)
                        ? membershipResponse.data
                        : [membershipResponse.data];
                }

                // Tìm gói đang hoạt động
                activePackage = memberships.find(m => {
                    const isPaid = m.trangThaiThanhToan === 'DA_THANH_TOAN';
                    const notCancelled = (!m.trangThaiDangKy || m.trangThaiDangKy !== 'DA_HUY') &&
                        (!m.trangThaiSuDung || !['DA_HUY', 'HET_HAN'].includes(m.trangThaiSuDung));
                    const hasValidEndDate = !m.ngayKetThuc || new Date(m.ngayKetThuc) > new Date();
                    return isPaid && notCancelled && hasValidEndDate;
                });

                setCurrentPackage(activePackage);
            } catch (memError) {
                console.log('ℹ️ No active package found');
                setCurrentPackage(null);
            }

            // 2) Load danh sách gói tập
            try {
                const allPackages = await apiService.getAllGoiTap();
                console.log('📦 All packages:', allPackages);

                // Lấy giá gói hiện tại
                const currentPrice = activePackage?.maGoiTap?.donGia || activePackage?.goiTapId?.donGia || 0;

                // Lọc: chỉ lấy gói kích hoạt và có giá >= giá gói hiện tại
                const filtered = allPackages.filter(pkg => {
                    if (!pkg.kichHoat) return false;
                    // Nếu chưa có gói, hiển thị tất cả
                    if (!activePackage) return true;
                    // Nếu có gói, chỉ hiển thị gói có giá >= giá hiện tại
                    return pkg.donGia >= currentPrice;
                });

                // Sắp xếp theo độ phổ biến và giá
                const sorted = filtered.sort((a, b) => {
                    // Ưu tiên gói phổ biến
                    if (a.popular && !b.popular) return -1;
                    if (!a.popular && b.popular) return 1;
                    // Sau đó sắp xếp theo giá tăng dần
                    return a.donGia - b.donGia;
                });

                setAvailablePackages(sorted);
            } catch (pkgError) {
                console.warn('⚠️ Error loading packages:', pkgError);
                setAvailablePackages([]);
            }

            setLoading(false);
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError(err.message || 'Không thể tải thông tin gói tập');
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const getPackageData = (pkg) => pkg.maGoiTap || pkg.goiTapId;

    const formatDuration = (thoiHan, unit = 'Ngay') => {
        if (!thoiHan) return '';
        const unitLabels = {
            'Ngay': 'ngày',
            'Tuan': 'tuần',
            'Thang': 'tháng',
            'Nam': 'năm',
        };
        return `${thoiHan} ${unitLabels[unit] || 'ngày'}`;
    };

    const formatPrice = (price) => {
        return price.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
    };

    const addDuration = (startDate, duration, unit = 'Ngay') => {
        const date = new Date(startDate);
        switch (unit) {
            case 'Ngay':
                date.setDate(date.getDate() + duration);
                break;
            case 'Tuan':
                date.setDate(date.getDate() + (duration * 7));
                break;
            case 'Thang':
                date.setMonth(date.getMonth() + duration);
                break;
            case 'Nam':
                date.setFullYear(date.getFullYear() + duration);
                break;
        }
        return date;
    };

    const handleSelectPackage = (pkg) => {
        console.log('Selected package:', pkg._id);
        // Navigate to package detail screen
        navigation.navigate('PackageDetail', { packageId: pkg._id });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchData}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentPkg = currentPackage ? getPackageData(currentPackage) : null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            {/* <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Gói tập</Text>
                <View style={{ width: 24 }} />
            </View> */}

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                }
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={[styles.mainTitle, { color: colors.text }]}>Tìm gói tập phù hợp với bạn</Text>
                    <Text style={[styles.mainDescription, { color: colors.textSecondary }]}>
                        Khám phá gói tập lý tưởng để phát triển thể lực của bạn. Các gói tập được thiết kế cẩn thận để đáp ứng nhu cầu của mọi người.
                    </Text>
                </View>

                {/* All Packages (including current) */}
                <View style={styles.availableSection}>
                    {availablePackages.length > 0 ? (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Các gói tập</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.packagesScrollContent}
                                style={styles.packagesScroll}
                                snapToInterval={CARD_WIDTH + 16}
                                decelerationRate="fast"
                            >
                                {availablePackages.map((pkg, index) => {
                                    const isPopular = pkg.popular;
                                    const isCurrentPackage = currentPkg && currentPkg._id === pkg._id;

                                    // Kiểm tra gói đã hết hạn chưa
                                    let isExpired = false;
                                    if (isCurrentPackage && currentPackage) {
                                        if (currentPackage.ngayKetThuc) {
                                            isExpired = new Date(currentPackage.ngayKetThuc) <= new Date();
                                        } else if (currentPackage.ngayBatDau && currentPkg.thoiHan) {
                                            const ngayKetThuc = addDuration(currentPackage.ngayBatDau, currentPkg.thoiHan, currentPkg.donViThoiHan);
                                            isExpired = ngayKetThuc <= new Date();
                                        }
                                    }

                                    return (
                                        <View key={pkg._id} style={[
                                            styles.packageCard,
                                            isPopular && styles.popularCard,
                                            isCurrentPackage && !isExpired && styles.currentActiveCard,
                                            { width: CARD_WIDTH }
                                        ]}>
                                            {/* Popular Badge hoặc Current Badge */}
                                            {isCurrentPackage && !isExpired ? (
                                                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                                                    <Text style={styles.popularBadgeText}>ĐANG SỬ DỤNG</Text>
                                                </View>
                                            ) : isPopular && (
                                                <View style={styles.popularBadge}>
                                                    <Ionicons name="star" size={12} color="#f9fafb" />
                                                    <Text style={styles.popularBadgeText}>PHỔ BIẾN</Text>
                                                </View>
                                            )}

                                            {/* Package Header */}
                                            <View style={styles.packageHeader}>
                                                <Text style={[styles.packageName, { color: colors.text }]}>
                                                    {pkg.tenGoiTap}
                                                </Text>
                                                <Text style={[styles.packageDescription, { color: colors.textSecondary }]}>
                                                    {pkg.moTa || 'Gói tập chất lượng cao với nhiều quyền lợi.'}
                                                </Text>
                                            </View>

                                            {/* Divider */}
                                            <View style={styles.divider} />

                                            {/* Price */}
                                            <View style={styles.priceContainer}>
                                                <View style={styles.priceRow}>
                                                    <Text style={[styles.amount, { color: colors.text }]}>
                                                        {formatPrice(pkg.donGia)}
                                                    </Text>
                                                    <Text style={[styles.currency, { color: colors.text }]}> ₫</Text>
                                                </View>
                                                <Text style={[styles.priceNote, { color: colors.textSecondary }]}>
                                                    / {formatDuration(pkg.thoiHan, pkg.donViThoiHan)}
                                                </Text>
                                            </View>

                                            {/* Features List */}
                                            <View style={styles.featuresContainer}>
                                                {(pkg.quyenLoi && pkg.quyenLoi.length > 0
                                                    ? pkg.quyenLoi.map(ql => ql.tenQuyenLoi || ql.moTa || ql)
                                                    : [
                                                        'Không giới hạn số lần tập',
                                                        'Tư vấn chế độ tập luyện',
                                                        'Hỗ trợ huấn luyện viên',
                                                        'Thiết bị tập luyện hiện đại',
                                                        'Theo dõi tiến độ'
                                                    ]
                                                ).slice(0, 5).map((feature, idx) => (
                                                    <View key={idx} style={styles.featureItem}>
                                                        <Ionicons name="checkmark-circle" size={20} color="#4ade80" style={styles.featureIcon} />
                                                        <Text style={[styles.featureText, { color: colors.text }]}>
                                                            {feature}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>

                                            {/* Action Button */}
                                            <TouchableOpacity
                                                style={[
                                                    styles.upgradeButton,
                                                    (isCurrentPackage && !isExpired) && styles.disabledButton,
                                                ]}
                                                onPress={() => handleSelectPackage(pkg)}
                                                disabled={isCurrentPackage && !isExpired}
                                            >
                                                <LinearGradient
                                                    colors={(isCurrentPackage && !isExpired) ? ['#4b5563', '#4b5563'] : ['#ef4444', 'rgba(239, 68, 68, 0.6)']}
                                                    start={{ x: 1, y: 0 }}
                                                    end={{ x: 0, y: 0 }}
                                                    style={styles.upgradeButtonGradient}
                                                >
                                                    <Text style={styles.upgradeButtonText}>
                                                        {isCurrentPackage && !isExpired ? 'Gói của bạn' : isCurrentPackage && isExpired ? 'Gia hạn ngay' : 'Chọn gói này'}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </>
                    ) : (
                        <View style={styles.noPackages}>
                            <Text style={[styles.noPackagesText, { color: colors.textSecondary }]}>
                                Không có gói tập nào để hiển thị.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    titleSection: {
        alignItems: 'center',
        marginVertical: 32,
        paddingHorizontal: 20,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'System',
    },
    mainDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'System',
    },
    currentPackageSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 16,
        paddingHorizontal: 20,
        fontFamily: 'System',
    },
    currentPackageCard: {
        borderWidth: 2,
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        backgroundColor: 'rgba(218, 33, 40, 0.05)',
    },
    currentBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'System',
    },
    currentPackageName: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'System',
    },
    currentPackageDescription: {
        fontSize: 14,
        marginBottom: 16,
        fontFamily: 'System',
    },
    currentPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    currentCurrency: {
        fontSize: 20,
        marginRight: 4,
        fontFamily: 'System',
    },
    currentAmount: {
        fontSize: 32,
        fontWeight: '700',
        fontFamily: 'System',
    },
    currentPeriod: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'System',
    },
    packageDates: {
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'System',
    },
    availableSection: {
        marginBottom: 32,
    },
    packagesScroll: {
        marginTop: 0,
    },
    packagesScrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    packageCard: {
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(115, 115, 115, 0.8)',
        position: 'relative',
        backgroundColor: 'rgba(255, 254, 254, 0.08)',
    },
    popularCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    currentActiveCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: '#ef4444',
        borderWidth: 3,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
    },
    popularBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    popularBadgeText: {
        color: '#f9fafb',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'System',
    },
    packageHeader: {
        marginBottom: 20,
    },
    packageName: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        lineHeight: 36,
        fontFamily: 'System',
    },
    packageDescription: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'System',
    },
    divider: {
        height: 2,
        backgroundColor: 'rgba(212, 212, 216, 0.1)',
        marginBottom: 20,
    },
    priceContainer: {
        marginBottom: 24,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        fontSize: 24,
        fontWeight: '600',
        fontFamily: 'System',
    },
    amount: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        fontFamily: 'System',
    },
    priceNote: {
        fontSize: 15,
        marginTop: 4,
        fontFamily: 'System',
    },
    featuresContainer: {
        gap: 12,
        marginBottom: 28,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    featureIcon: {
        marginTop: 2,
    },
    featureText: {
        fontSize: 15,
        flex: 1,
        lineHeight: 22,
        fontFamily: 'System',
    },
    upgradeButton: {
        borderRadius: 100,
        overflow: 'hidden',
    },
    upgradeButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    upgradeButtonText: {
        color: '#e5e7eb',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'System',
    },
    disabledButton: {
        opacity: 0.5,
    },
    noPackages: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
    },
    noPackagesText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: 'System',
    },
});

export default PackagesScreen;
