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
    StatusBar,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MonthlyMembershipDemo = () => {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    // Dữ liệu mẫu cho gói tháng
    const monthlyPackages = [
        {
            id: 1,
            name: "Gói Tháng Cơ Bản",
            duration: "1 tháng",
            price: 500000,
            originalPrice: 600000,
            description: "Gói tập cơ bản 1 tháng với đầy đủ tiện ích",
            features: [
                "Truy cập tất cả thiết bị",
                "Hỗ trợ 24/7",
                "Locker miễn phí",
                "Tư vấn cơ bản"
            ],
            popular: false,
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
            isActive: true
        },
        {
            id: 2,
            name: "Gói Tháng Premium",
            duration: "1 tháng",
            price: 800000,
            originalPrice: 1000000,
            description: "Gói tập premium với nhiều ưu đãi đặc biệt",
            features: [
                "Truy cập tất cả thiết bị",
                "Hỗ trợ 24/7",
                "Locker miễn phí",
                "Tư vấn dinh dưỡng",
                "Xông hơi miễn phí",
                "Khóa học nhóm"
            ],
            popular: true,
            image: "https://images.unsplash.com/photo-1534438327276-14e5300c78a8?w=400",
            isActive: true
        },
        {
            id: 3,
            name: "Gói 3 Tháng Tiết Kiệm",
            duration: "3 tháng",
            price: 2000000,
            originalPrice: 2400000,
            description: "Gói tập 3 tháng với giá ưu đãi đặc biệt",
            features: [
                "Truy cập tất cả thiết bị",
                "Hỗ trợ 24/7",
                "Locker miễn phí",
                "Tư vấn dinh dưỡng",
                "Xông hơi miễn phí",
                "Khóa học nhóm miễn phí",
                "Giảm giá 20%"
            ],
            popular: false,
            image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400",
            isActive: true
        },
        {
            id: 4,
            name: "Gói 6 Tháng VIP",
            duration: "6 tháng",
            price: 3500000,
            originalPrice: 4200000,
            description: "Gói tập VIP với nhiều ưu đãi cao cấp",
            features: [
                "Truy cập tất cả thiết bị",
                "Hỗ trợ 24/7",
                "Locker VIP",
                "Tư vấn dinh dưỡng cá nhân",
                "Xông hơi + massage miễn phí",
                "Khóa học nhóm không giới hạn",
                "PT cá nhân 2 buổi/tháng"
            ],
            popular: true,
            image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400",
            isActive: true
        },
        {
            id: 5,
            name: "Gói 12 Tháng Diamond",
            duration: "12 tháng",
            price: 6000000,
            originalPrice: 7200000,
            description: "Gói tập Diamond cao cấp nhất với đầy đủ tiện ích",
            features: [
                "Truy cập tất cả thiết bị",
                "Hỗ trợ 24/7",
                "Locker VIP",
                "Tư vấn dinh dưỡng cá nhân",
                "Xông hơi + massage miễn phí",
                "Khóa học nhóm không giới hạn",
                "PT cá nhân 4 buổi/tháng",
                "Spa & wellness miễn phí",
                "Ưu tiên đặt lịch"
            ],
            popular: false,
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
            isActive: true
        }
    ];

    // Dữ liệu gói hiện tại (giả lập)
    const currentMembership = {
        tenGoiTap: "Gói Tháng Premium",
        thoiHan: 1,
        ngayConLai: 15,
        status: "active"
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
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
                        onPress: () => {
                            Alert.alert('Thành công!', 'Gói đã được mua thành công. Bạn sẽ nhận được thông báo xác nhận qua email.');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error handling purchase:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý giao dịch.');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
                Gói Tháng
            </Text>
            <TouchableOpacity style={styles.helpButton}>
                <Ionicons name="help-circle-outline" size={24} color="#333" />
            </TouchableOpacity>
        </View>
    );

    const renderCurrentMembership = () => {
        if (!currentMembership) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Gói hiện tại
                </Text>
                <View style={styles.currentMembershipCard}>
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
                                        width: `${((30 - currentMembership.ngayConLai) / 30) * 100}%`,
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
                <View style={styles.packageCard}>
                    <View style={styles.packageHeader}>
                        <View>
                            <Text style={[styles.packageName, { color: '#333' }]}>
                                {packageItem.name}
                            </Text>
                            <Text style={[styles.packageDuration, { color: '#666' }]}>
                                {packageItem.duration}
                            </Text>
                        </View>
                        <View style={styles.packagePricing}>
                            <Text style={[styles.packagePrice, { color: '#667eea' }]}>
                                {packageItem.price.toLocaleString('vi-VN')}đ
                            </Text>
                            {packageItem.originalPrice && (
                                <Text style={[styles.packageOriginalPrice, { color: '#999' }]}>
                                    {packageItem.originalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.packageDescription}>
                        <Text style={[styles.packageDescriptionText, { color: '#333' }]}>
                            {packageItem.description}
                        </Text>
                    </View>

                    <View style={styles.packageFeatures}>
                        {packageItem.features.slice(0, 3).map((feature, featureIndex) => (
                            <View key={featureIndex} style={styles.packageFeatureItem}>
                                <MaterialIcons name="check" size={16} color="#4CAF50" />
                                <Text style={[styles.packageFeatureText, { color: '#333' }]}>
                                    {feature}
                                </Text>
                            </View>
                        ))}
                        {packageItem.features.length > 3 && (
                            <Text style={[styles.moreFeaturesText, { color: '#667eea' }]}>
                                +{packageItem.features.length - 3} tính năng khác
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.packageButton, { backgroundColor: '#f5f5f5', borderColor: '#ddd' }]}
                        onPress={() => handlePurchase(packageItem)}
                    >
                        <Text style={[styles.packageButtonText, { color: '#333' }]}>
                            Mua ngay
                        </Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#667eea" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
                Chưa có gói tháng
            </Text>
            <Text style={styles.emptyStateText}>
                Hiện tại chưa có gói membership theo tháng nào được cung cấp.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#667eea']}
                        tintColor="#667eea"
                    />
                }
            >
                {renderCurrentMembership()}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: '#fff',
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
        color: '#333',
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
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },

    // Current Membership Styles
    currentMembershipCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f0f0f0',
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
        color: '#333',
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        color: '#666',
    },
});

export default MonthlyMembershipDemo;
