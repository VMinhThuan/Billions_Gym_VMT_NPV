import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    RefreshControl,
    Alert,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../api/apiService';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

const MonthlyMembershipScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [monthlyPackages, setMonthlyPackages] = useState([]);
    const [currentMembership, setCurrentMembership] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);

    useEffect(() => {
        fetchMonthlyData();
    }, []);

    const fetchMonthlyData = async () => {
        try {
            setLoading(true);

            // Fetch monthly packages
            const monthlyPkgs = await apiService.getMonthlyPackages();

            const transformedPackages = monthlyPkgs.map(pkg => ({
                id: pkg._id,
                name: pkg.tenGoiTap,
                duration: `${pkg.thoiHan} tháng`,
                price: pkg.donGia,
                originalPrice: pkg.giaGoc || null,
                description: pkg.moTa,
                features: pkg.moTa?.split('\n') || ['Gói tập cơ bản'],
                popular: pkg.popular || false,
                image: pkg.hinhAnhDaiDien,
                isActive: pkg.kichHoat
            }));

            setMonthlyPackages(transformedPackages);

            // Fetch current membership
            const membershipResponse = await apiService.getMyMembership();
            if (membershipResponse) {
                setCurrentMembership(membershipResponse);
            }

        } catch (error) {
            console.error('Error fetching monthly data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu gói tháng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMonthlyData();
        setRefreshing(false);
    };

    const handleSelectPackage = (packageItem) => {
        setSelectedPackage(packageItem);
    };

    const handlePurchase = async (packageItem) => {
        try {
            Alert.alert(
                'Xác nhận mua gói',
                `Bạn có chắc chắn muốn mua gói "${packageItem.name}" với giá ${packageItem.price.toLocaleString('vi-VN')}đ?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Xác nhận',
                        onPress: () => processPurchase(packageItem)
                    }
                ]
            );
        } catch (error) {
            console.error('Error handling purchase:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý giao dịch.');
        }
    };

    const processPurchase = async (packageItem) => {
        try {
            // Navigate to payment screen or process payment
            navigation.navigate('Payment', {
                package: packageItem,
                type: 'monthly_membership'
            });
        } catch (error) {
            console.error('Error processing purchase:', error);
            Alert.alert('Lỗi', 'Không thể xử lý thanh toán.');
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
                Gói Tháng
            </Text>
            <TouchableOpacity style={styles.helpButton}>
                <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );

    const renderCurrentMembership = () => {
        if (!currentMembership) return null;

        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Gói hiện tại
                </Text>
                <View style={[styles.currentMembershipCard, { backgroundColor: colors.card }]}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.currentMembershipGradient}
                    >
                        <View style={styles.currentMembershipHeader}>
                            <View>
                                <Text style={styles.currentMembershipName}>
                                    {currentMembership.tenGoiTap}
                                </Text>
                                <Text style={styles.currentMembershipDuration}>
                                    {currentMembership.thoiHan} tháng
                                </Text>
                            </View>
                            <View style={styles.currentMembershipStatus}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Đang hoạt động</Text>
                            </View>
                        </View>

                        <View style={styles.currentMembershipProgress}>
                            <Text style={styles.daysRemaining}>
                                {currentMembership.ngayConLai} ngày còn lại
                            </Text>
                            <View style={styles.progressBar}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        width: `${((currentMembership.thoiHan * 30 - currentMembership.ngayConLai) / (currentMembership.thoiHan * 30)) * 100}%`,
                                    }
                                ]} />
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        );
    };

    const renderPackageCard = (packageItem, index) => (
        <View key={packageItem.id} style={styles.packageCardContainer}>
            {packageItem.popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>PHỔ BIẾN</Text>
                </View>
            )}

            {packageItem.popular ? (
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.packageCard}
                >
                    <View style={styles.packageHeader}>
                        <View>
                            <Text style={styles.packageName}>{packageItem.name}</Text>
                            <Text style={styles.packageDuration}>{packageItem.duration}</Text>
                        </View>
                        <View style={styles.packagePricing}>
                            <Text style={styles.packagePrice}>
                                {packageItem.price.toLocaleString('vi-VN')}đ
                            </Text>
                            {packageItem.originalPrice && (
                                <Text style={styles.packageOriginalPrice}>
                                    {packageItem.originalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.packageDescription}>
                        <Text style={styles.packageDescriptionText}>
                            {packageItem.description}
                        </Text>
                    </View>

                    <View style={styles.packageFeatures}>
                        {packageItem.features.slice(0, 3).map((feature, featureIndex) => (
                            <View key={featureIndex} style={styles.packageFeatureItem}>
                                <MaterialIcons name="check" size={16} color="#4CAF50" />
                                <Text style={styles.packageFeatureText}>{feature}</Text>
                            </View>
                        ))}
                        {packageItem.features.length > 3 && (
                            <Text style={styles.moreFeaturesText}>
                                +{packageItem.features.length - 3} tính năng khác
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.packageButton}
                        onPress={() => handlePurchase(packageItem)}
                    >
                        <Text style={styles.packageButtonText}>Mua ngay</Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>
            ) : (
                <View style={[styles.packageCard, { backgroundColor: colors.card }]}>
                    <View style={styles.packageHeader}>
                        <View>
                            <Text style={[styles.packageName, { color: colors.text }]}>
                                {packageItem.name}
                            </Text>
                            <Text style={[styles.packageDuration, { color: colors.textSecondary }]}>
                                {packageItem.duration}
                            </Text>
                        </View>
                        <View style={styles.packagePricing}>
                            <Text style={[styles.packagePrice, { color: colors.primary }]}>
                                {packageItem.price.toLocaleString('vi-VN')}đ
                            </Text>
                            {packageItem.originalPrice && (
                                <Text style={[styles.packageOriginalPrice, { color: colors.textMuted }]}>
                                    {packageItem.originalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.packageDescription}>
                        <Text style={[styles.packageDescriptionText, { color: colors.text }]}>
                            {packageItem.description}
                        </Text>
                    </View>

                    <View style={styles.packageFeatures}>
                        {packageItem.features.slice(0, 3).map((feature, featureIndex) => (
                            <View key={featureIndex} style={styles.packageFeatureItem}>
                                <MaterialIcons name="check" size={16} color={colors.success} />
                                <Text style={[styles.packageFeatureText, { color: colors.text }]}>
                                    {feature}
                                </Text>
                            </View>
                        ))}
                        {packageItem.features.length > 3 && (
                            <Text style={[styles.moreFeaturesText, { color: colors.primary }]}>
                                +{packageItem.features.length - 3} tính năng khác
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.packageButton, { backgroundColor: colors.surface }]}
                        onPress={() => handlePurchase(packageItem)}
                    >
                        <Text style={[styles.packageButtonText, { color: colors.text }]}>
                            Mua ngay
                        </Text>
                        <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Chưa có gói tháng
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Hiện tại chưa có gói membership theo tháng nào được cung cấp.
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        Đang tải...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {renderCurrentMembership()}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Gói tháng khả dụng
                    </Text>
                    {monthlyPackages.length > 0 ? (
                        monthlyPackages.map((packageItem, index) => renderPackageCard(packageItem, index))
                    ) : (
                        renderEmptyState()
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    helpButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },

    // Current Membership Styles
    currentMembershipCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    currentMembershipGradient: {
        padding: 20,
    },
    currentMembershipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    currentMembershipName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    currentMembershipDuration: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    currentMembershipStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    currentMembershipProgress: {
        marginTop: 8,
    },
    daysRemaining: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 4,
    },

    // Package Card Styles
    packageCardContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -8,
        right: 20,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 1,
    },
    popularText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    packageCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    packageDuration: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    packagePricing: {
        alignItems: 'flex-end',
    },
    packagePrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    packageOriginalPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 2,
    },
    packageDescription: {
        marginBottom: 16,
    },
    packageDescriptionText: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 20,
    },
    packageFeatures: {
        marginBottom: 20,
    },
    packageFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    packageFeatureText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 8,
        flex: 1,
    },
    moreFeaturesText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontStyle: 'italic',
        marginTop: 4,
    },
    packageButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    packageButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 8,
    },

    // Empty State Styles
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default MonthlyMembershipScreen;
