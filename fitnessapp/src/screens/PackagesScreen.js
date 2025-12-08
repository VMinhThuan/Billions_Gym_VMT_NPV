import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const PackagesScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [packages, setPackages] = useState([]);
    const [currentMembership, setCurrentMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch packages
            let packagesData = [];
            try {
                packagesData = await apiService.getAllGoiTap();
                console.log('✅ Packages loaded:', packagesData);
            } catch (pkgError) {
                console.error('❌ Error fetching packages:', pkgError);
                packagesData = [];
            }

            // Fetch membership
            let membershipData = null;
            try {
                const membershipResponse = await apiService.getMyMembership();
                console.log('✅ Membership response:', membershipResponse);
                
                // Handle different response formats
                if (Array.isArray(membershipResponse)) {
                    membershipData = membershipResponse;
                } else if (membershipResponse && membershipResponse.data) {
                    membershipData = Array.isArray(membershipResponse.data) 
                        ? membershipResponse.data 
                        : [membershipResponse.data];
                } else if (membershipResponse && membershipResponse.success === false) {
                    // No membership yet
                    membershipData = [];
                }
            } catch (memError) {
                console.error('❌ Error fetching membership:', memError);
                // Not critical, user might not have membership yet
                membershipData = [];
            }

            setPackages(Array.isArray(packagesData) ? packagesData : []);

            // Tìm gói đang hoạt động
            if (membershipData && Array.isArray(membershipData) && membershipData.length > 0) {
                const activeMembership = membershipData.find(
                    m => m.trangThai === 'DANG_HOAT_DONG' || m.trangThai === 'ACTIVE'
                );
                console.log('📦 Active membership:', activeMembership);
                setCurrentMembership(activeMembership);
            } else {
                console.log('ℹ️ No active membership found');
                setCurrentMembership(null);
            }
        } catch (error) {
            console.error('❌ Fatal error fetching data:', error);
            showAlert('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message) => {
        setModalMessage(message);
        setModalVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };

    const isExpired = (membership) => {
        if (!membership || !membership.ngayKetThuc) return false;
        return new Date(membership.ngayKetThuc) < new Date();
    };

    const getDaysRemaining = (membership) => {
        if (!membership || !membership.ngayKetThuc) return 0;
        const endDate = new Date(membership.ngayKetThuc);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getTimeUnitText = (thoiHan, donViThoiHan) => {
        const unitMap = {
            'Ngay': 'ngày',
            'Thang': 'tháng',
            'Nam': 'năm',
            'Phut': 'phút'
        };
        return `${thoiHan} ${unitMap[donViThoiHan] || 'ngày'}`;
    };

    const isCurrentPackage = (pkg) => {
        if (!currentMembership || !currentMembership.maGoiTap) return false;
        return currentMembership.maGoiTap._id === pkg._id || currentMembership.maGoiTap === pkg._id;
    };

    const canUpgrade = (pkg) => {
        if (!currentMembership || !currentMembership.maGoiTap) return true;
        
        const currentPrice = currentMembership.maGoiTap.donGia || 0;
        const newPrice = pkg.donGia || 0;
        
        return newPrice > currentPrice;
    };

    const handleSubscribe = async (pkg) => {
        setSelectedPackage(pkg);
        
        if (isCurrentPackage(pkg)) {
            showAlert('Bạn đang sử dụng gói tập này');
            return;
        }

        if (currentMembership && !isExpired(currentMembership) && !canUpgrade(pkg)) {
            showAlert('Bạn chỉ có thể nâng cấp lên gói cao hơn');
            return;
        }

        // Navigate to payment or registration screen
        showAlert(`Chức năng đăng ký gói ${pkg.tenGoiTap} đang được phát triển`);
    };

    const handleRenew = () => {
        if (currentMembership && currentMembership.maGoiTap) {
            handleSubscribe(currentMembership.maGoiTap);
        }
    };

    const renderPackageCard = (pkg, index) => {
        const isCurrent = isCurrentPackage(pkg);
        const isUpgradeable = canUpgrade(pkg);
        const showPackage = !currentMembership || isExpired(currentMembership) || isCurrent || isUpgradeable;

        if (!showPackage) return null;

        const isPopular = pkg.popular;
        const benefits = pkg.quyenLoi || [];

        return (
            <View
                key={pkg._id || index}
                style={[
                    styles.packageCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isCurrent ? colors.primary : 'rgba(150, 150, 150, 0.3)',
                        borderWidth: isCurrent ? 2 : 1,
                    },
                    isPopular && styles.popularCard
                ]}
            >
                {isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.popularText}>PHỔ BIẾN</Text>
                    </View>
                )}

                {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="check-circle" size={16} color="#fff" />
                        <Text style={styles.currentBadgeText}>Đang sử dụng</Text>
                    </View>
                )}

                <View style={styles.packageHeader}>
                    <Text style={[styles.packageName, { color: colors.text }]}>
                        {pkg.tenGoiTap}
                    </Text>
                    <Text style={[styles.packageDuration, { color: colors.textSecondary }]}>
                        {getTimeUnitText(pkg.thoiHan, pkg.donViThoiHan)}
                    </Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: colors.primary }]}>
                        {formatPrice(pkg.donGia)}
                    </Text>
                    {pkg.giaGoc && pkg.giaGoc > pkg.donGia && (
                        <View style={styles.savingBadge}>
                            <Text style={styles.savingText}>
                                Tiết kiệm {formatPrice(pkg.giaGoc - pkg.donGia)}
                            </Text>
                        </View>
                    )}
                </View>

                {pkg.moTa && (
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {pkg.moTa}
                    </Text>
                )}

                {benefits.length > 0 && (
                    <View style={styles.benefitsContainer}>
                        {benefits.slice(0, 4).map((benefit, idx) => (
                            <View key={idx} style={styles.benefitItem}>
                                <Text style={styles.benefitIcon}>{benefit.icon || '✓'}</Text>
                                <Text style={[styles.benefitText, { color: colors.text }]}>
                                    {benefit.tenQuyenLoi}
                                </Text>
                            </View>
                        ))}
                        {benefits.length > 4 && (
                            <Text style={[styles.moreBenefits, { color: colors.textSecondary }]}>
                                +{benefits.length - 4} quyền lợi khác
                            </Text>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.subscribeButton,
                        {
                            backgroundColor: isCurrent
                                ? 'transparent'
                                : colors.primary,
                            borderWidth: isCurrent ? 1 : 0,
                            borderColor: isCurrent ? colors.primary : 'transparent'
                        }
                    ]}
                    onPress={() => handleSubscribe(pkg)}
                    disabled={isCurrent}
                >
                    <Text
                        style={[
                            styles.subscribeButtonText,
                            { color: isCurrent ? colors.primary : '#fff' }
                        ]}
                    >
                        {isCurrent
                            ? 'Gói hiện tại'
                            : currentMembership && !isExpired(currentMembership)
                            ? 'Nâng cấp'
                            : 'Đăng ký'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderExpiredBanner = () => {
        if (!currentMembership || !isExpired(currentMembership)) return null;

        return (
            <View style={[styles.expiredBanner, { backgroundColor: '#FF6B6B' }]}>
                <MaterialIcons name="error-outline" size={24} color="#fff" />
                <View style={styles.expiredTextContainer}>
                    <Text style={styles.expiredTitle}>Gói tập đã hết hạn</Text>
                    <Text style={styles.expiredSubtitle}>
                        Gói "{currentMembership.maGoiTap?.tenGoiTap || 'N/A'}" đã hết hạn. Gia hạn ngay!
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.renewButton}
                    onPress={handleRenew}
                >
                    <Text style={styles.renewButtonText}>Gia hạn</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCurrentMembershipInfo = () => {
        if (!currentMembership || isExpired(currentMembership)) return null;

        const daysRemaining = getDaysRemaining(currentMembership);
        const totalDays = currentMembership.maGoiTap?.thoiHan || 30;
        const progress = Math.min(1, daysRemaining / totalDays);

        return (
            <View style={[styles.currentMembershipCard, { backgroundColor: colors.surface }]}>
                <View style={styles.membershipHeader}>
                    <View>
                        <Text style={[styles.membershipTitle, { color: colors.text }]}>
                            Gói tập hiện tại
                        </Text>
                        <Text style={[styles.membershipName, { color: colors.primary }]}>
                            {currentMembership.maGoiTap?.tenGoiTap || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.daysContainer}>
                        <Text style={[styles.daysNumber, { color: colors.primary }]}>
                            {daysRemaining}
                        </Text>
                        <Text style={[styles.daysText, { color: colors.textSecondary }]}>
                            ngày còn lại
                        </Text>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    backgroundColor: colors.primary,
                                    width: `${progress * 100}%`
                                }
                            ]}
                        />
                    </View>
                </View>

                <Text style={[styles.validUntil, { color: colors.textSecondary }]}>
                    Có hiệu lực đến:{' '}
                    {currentMembership.ngayKetThuc
                        ? new Date(currentMembership.ngayKetThuc).toLocaleDateString('vi-VN')
                        : 'N/A'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Đang tải...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Gói tập
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Expired Banner */}
                {renderExpiredBanner()}

                {/* Current Membership Info */}
                {renderCurrentMembershipInfo()}

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {currentMembership && !isExpired(currentMembership)
                            ? 'Nâng cấp gói tập'
                            : 'Chọn gói tập phù hợp'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {currentMembership && !isExpired(currentMembership)
                            ? 'Nâng cấp để trải nghiệm thêm nhiều quyền lợi'
                            : 'Bắt đầu hành trình thay đổi bản thân ngay hôm nay'}
                    </Text>
                </View>

                {/* Packages List */}
                <View style={styles.packagesContainer}>
                    {packages.filter(pkg => pkg.kichHoat !== false).length > 0 ? (
                        packages.filter(pkg => pkg.kichHoat !== false).map((pkg, index) => renderPackageCard(pkg, index))
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="fitness-center" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                Chưa có gói tập nào
                            </Text>
                            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                                Vui lòng quay lại sau
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer Info */}
                <View style={styles.footerInfo}>
                    <TouchableOpacity style={styles.restoreButton}>
                        <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
                            Khôi phục gói đã mua
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal */}
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={closeModal}>
                            <Text style={styles.modalButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    expiredBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        marginBottom: 8,
        borderRadius: 12,
    },
    expiredTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    expiredTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    expiredSubtitle: {
        color: '#fff',
        fontSize: 13,
        opacity: 0.9,
    },
    renewButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    renewButtonText: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '700',
    },
    currentMembershipCard: {
        margin: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    membershipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    membershipTitle: {
        fontSize: 14,
        marginBottom: 4,
    },
    membershipName: {
        fontSize: 20,
        fontWeight: '700',
    },
    daysContainer: {
        alignItems: 'flex-end',
    },
    daysNumber: {
        fontSize: 32,
        fontWeight: '700',
    },
    daysText: {
        fontSize: 12,
    },
    progressBarContainer: {
        marginBottom: 12,
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    validUntil: {
        fontSize: 13,
    },
    titleContainer: {
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    packagesContainer: {
        paddingHorizontal: 16,
    },
    packageCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: 'relative',
    },
    popularCard: {
        transform: [{ scale: 1.02 }],
    },
    popularBadge: {
        position: 'absolute',
        top: -8,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    currentBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    packageHeader: {
        marginBottom: 12,
    },
    packageName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    packageDuration: {
        fontSize: 14,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    price: {
        fontSize: 28,
        fontWeight: '700',
        marginRight: 12,
    },
    savingBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    savingText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    benefitsContainer: {
        marginBottom: 20,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    benefitIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    benefitText: {
        fontSize: 14,
        flex: 1,
    },
    moreBenefits: {
        fontSize: 13,
        marginTop: 4,
        fontStyle: 'italic',
    },
    subscribeButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    subscribeButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    footerInfo: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    restoreButton: {
        paddingVertical: 10,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default PackagesScreen;
