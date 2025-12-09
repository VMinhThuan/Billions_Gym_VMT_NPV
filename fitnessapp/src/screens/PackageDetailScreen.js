import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width, height } = Dimensions.get('window');

const PackageDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors } = useTheme();
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [packageData, setPackageData] = useState(null);
    const [showServices, setShowServices] = useState(false);

    const packageId = route.params?.packageId;

    useEffect(() => {
        fetchPackageDetail();
    }, [packageId]);

    const fetchPackageDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getPackageById(packageId);
            console.log('📦 Package Detail:', response);

            if (response && response.data) {
                setPackageData(response.data);
            } else if (response) {
                setPackageData(response);
            } else {
                setError('Không tìm thấy gói tập');
            }
        } catch (err) {
            console.error('❌ Error fetching package:', err);
            setError(err.message || 'Không thể tải thông tin gói tập');
        } finally {
            setLoading(false);
        }
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

        const unit = unitMap[donViThoiHan] || donViThoiHan;

        if (donViThoiHan === 'Nam' || thoiHan >= 365) return '📆 Theo năm';
        if (donViThoiHan === 'Thang') return '📅 Theo tháng';
        return `📅 ${thoiHan} ${unit}`;
    };

    const getPackageFeatures = (pkg) => {
        if (pkg.quyenLoi && pkg.quyenLoi.length > 0) {
            return pkg.quyenLoi.map(benefit => ({
                text: benefit.tenQuyenLoi || benefit.moTa || benefit,
                description: benefit.moTa,
                icon: benefit.icon || '✓',
                type: benefit.loai || 'co_ban'
            }));
        }

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

    const handleRegister = () => {
        if (!packageData) return;
        // Navigate to checkout screen
        navigation.navigate('Checkout', { packageId: packageData._id });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>⚠️ {error}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!packageData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>❌ Không tìm thấy gói tập</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const features = getPackageFeatures(packageData);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={['#000000', '#1a1a1a', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButtonTop}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                        <Text style={styles.backButtonTopText}>Quay lại</Text>
                    </TouchableOpacity>

                    {/* Main Content Card */}
                    <View style={styles.detailCard}>
                        {/* Image Section */}
                        <View style={styles.imageSection}>
                            {packageData.hinhAnhDaiDien ? (
                                <Image
                                    source={{ uri: packageData.hinhAnhDaiDien }}
                                    style={styles.packageImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Text style={styles.placeholderIcon}>🏋️‍♂️</Text>
                                </View>
                            )}
                            <LinearGradient
                                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(218,33,40,0.2)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.imageOverlay}
                            />
                        </View>

                        {/* Info Section */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.8)', 'rgba(26,26,26,0.9)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.infoSection}
                        >
                            {/* Radial Gradient Effect (simulated) */}
                            <View style={styles.radialGradient} />

                            <View style={styles.infoContent}>
                                {/* Package Name */}
                                <Text style={styles.packageName}>{packageData.tenGoiTap}</Text>

                                {/* Description */}
                                <Text style={styles.packageDescription}>{packageData.moTa}</Text>

                                {/* Package Type */}
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Loại gói:</Text>
                                    <Text style={styles.infoValue}>{getPackageTypeLabel(packageData.loaiGoiTap)}</Text>
                                </View>

                                {/* Duration */}
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Thời hạn:</Text>
                                    <Text style={styles.infoValue}>{getDurationLabel(packageData.thoiHan, packageData.donViThoiHan)}</Text>
                                </View>

                                {/* Rating Summary */}
                                <View style={styles.ratingContainer}>
                                    <View style={styles.ratingStars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                                key={star}
                                                name={star <= 4.5 ? "star" : "star-outline"}
                                                size={20}
                                                color="#fbbf24"
                                            />
                                        ))}
                                    </View>
                                    <Text style={styles.ratingText}>4.5 (127 đánh giá)</Text>
                                </View>

                                {/* Services & Benefits */}
                                <View style={styles.servicesContainer}>
                                    <TouchableOpacity
                                        style={styles.servicesTitleButton}
                                        onPress={() => setShowServices(!showServices)}
                                    >
                                        <Text style={styles.servicesTitle}>
                                            💪 Dịch vụ & Quyền lợi
                                        </Text>
                                        <Ionicons
                                            name={showServices ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>

                                    {showServices && (
                                        <View style={styles.servicesList}>
                                            {features.map((feature, index) => (
                                                <View key={index} style={styles.serviceItem}>
                                                    <Text style={styles.serviceIcon}>{feature.icon}</Text>
                                                    <View style={styles.serviceContent}>
                                                        <Text style={styles.serviceText}>{feature.text}</Text>
                                                        {feature.description && (
                                                            <Text style={styles.serviceDescription}>
                                                                {feature.description}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Price & Actions Section */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.95)', 'rgba(26,26,26,0.95)']}
                            style={styles.actionsSection}
                        >
                            <View style={styles.priceInfo}>
                                <Text style={styles.priceAmount}>{formatPrice(packageData.donGia)}₫</Text>
                                {packageData.giaGoc && packageData.giaGoc > packageData.donGia && (
                                    <View style={styles.originalPriceRow}>
                                        <Text style={styles.originalPrice}>
                                            {formatPrice(packageData.giaGoc)}₫
                                        </Text>
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>
                                                -{Math.round((1 - packageData.donGia / packageData.giaGoc) * 100)}%
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.registerButton}
                                    onPress={handleRegister}
                                >
                                    <LinearGradient
                                        colors={['#dc2626', '#b91c1c']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.registerButtonGradient}
                                    >
                                        <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.compareButton}
                                    onPress={() => {
                                        // Navigate to compare screen with current package
                                        navigation.navigate('PackageCompare', { packageId });
                                    }}
                                >
                                    <Text style={styles.compareButtonText}>So sánh gói tập</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    gradientBackground: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        color: '#ef4444',
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButtonTop: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    backButtonTopText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    detailCard: {
        marginHorizontal: 20,
        marginBottom: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 50,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    imageSection: {
        width: '100%',
        height: height * 0.4,
        position: 'relative',
    },
    packageImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 64,
        opacity: 0.5,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    infoSection: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        position: 'relative',
    },
    radialGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(218,33,40,0.05)',
        borderRadius: 100,
        opacity: 0.3,
    },
    infoContent: {
        position: 'relative',
        zIndex: 1,
    },
    packageName: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 16,
        color: '#fff',
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    packageDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: '#d1d5db',
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    infoValue: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '700',
    },
    ratingContainer: {
        marginTop: 20,
        marginBottom: 30,
    },
    ratingStars: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    ratingText: {
        color: '#d1d5db',
        fontSize: 14,
    },
    servicesContainer: {
        marginTop: 20,
    },
    servicesTitleButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    servicesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    servicesList: {
        gap: 12,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    serviceIcon: {
        fontSize: 20,
        marginRight: 12,
        marginTop: 2,
    },
    serviceContent: {
        flex: 1,
    },
    serviceText: {
        fontSize: 15,
        color: '#f3f4f6',
        lineHeight: 22,
        fontWeight: '500',
    },
    serviceDescription: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 4,
        lineHeight: 18,
    },
    actionsSection: {
        padding: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    priceInfo: {
        marginBottom: 24,
    },
    priceAmount: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 8,
    },
    originalPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    originalPrice: {
        fontSize: 20,
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    discountText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    actionButtons: {
        gap: 12,
    },
    registerButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    registerButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    compareButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    compareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PackageDetailScreen;
