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
    Animated,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../api/apiService';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

const MembershipScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [membershipData, setMembershipData] = useState({
        membershipType: "Chưa có gói",
        startDate: "",
        endDate: "",
        daysRemaining: 0,
        totalDays: 0,
        status: "inactive",
        benefits: []
    });
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [availablePackages, setAvailablePackages] = useState([]);
    const [hangHoiVien, setHangHoiVien] = useState({
        tenHang: "",
        tenHienThi: "",
        mauSac: "#FFD700",
        icon: "🥉",
        quyenLoi: [],
        soTienTichLuy: 0,
        soThangLienTuc: 0,
        soBuoiTapDaTap: 0
    });

    useEffect(() => {
        fetchMembershipData();
    }, []);

    const fetchMembershipData = async () => {
        try {
            setLoading(true);

            // Fetch membership and payment data
            const [membershipInfo, paymentData, availablePackages, hangHoiVienData] = await Promise.allSettled([
                apiService.getMyMembership(),
                apiService.getMyPayments(),
                apiService.getAllGoiTap(),
                apiService.getHangHoiVienCuaHoiVien(await apiService.getCurrentUserId())
            ]);

            if (membershipInfo.status === 'fulfilled' && membershipInfo.value) {
                const memberships = membershipInfo.value;
                const activeMembership = memberships.find(m =>
                    m.trangThai === 'DangHoatDong' && new Date(m.ngayKetThuc) > new Date()
                );

                if (activeMembership) {
                    const startDate = new Date(activeMembership.ngayBatDau);
                    const endDate = new Date(activeMembership.ngayKetThuc);
                    const today = new Date();
                    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                    setMembershipData({
                        membershipType: activeMembership.maGoiTap?.tenGoiTap || 'Gói tập',
                        startDate: startDate.toLocaleDateString('vi-VN'),
                        endDate: endDate.toLocaleDateString('vi-VN'),
                        daysRemaining: Math.max(0, daysRemaining),
                        totalDays: totalDays,
                        status: daysRemaining > 0 ? 'active' : 'expired',
                        benefits: activeMembership.maGoiTap?.moTa?.split('\n') || [
                            "Truy cập phòng gym",
                            "Sử dụng thiết bị tập luyện",
                            "Tham gia lớp học nhóm"
                        ]
                    });
                }
            }

            if (paymentData.status === 'fulfilled' && paymentData.value) {
                const payments = paymentData.value;
                const transformedPayments = Array.isArray(payments) ? payments.map(payment => ({
                    id: payment._id,
                    date: new Date(payment.ngayThanhToan).toLocaleDateString('vi-VN'),
                    amount: `${payment.soTien?.toLocaleString('vi-VN')}đ`,
                    package: payment.moTa || 'Thanh toán phí tập',
                    status: payment.trangThai === 'DaThanhToan' ? 'completed' :
                        payment.trangThai === 'DangXuLy' ? 'pending' : 'failed',
                    method: payment.phuongThucThanhToan || 'Chuyển khoản'
                })) : [];
                setPaymentHistory(transformedPayments);
            }

            if (availablePackages.status === 'fulfilled' && availablePackages.value) {
                const packages = availablePackages.value;
                const transformedPackages = Array.isArray(packages) ? packages.map(pkg => ({
                    id: pkg._id,
                    name: pkg.tenGoiTap,
                    duration: `${pkg.thoiHan} ${pkg.donViThoiHan === 'Thang' ? 'tháng' : 'ngày'}`,
                    price: `${pkg.gia?.toLocaleString('vi-VN')}đ`,
                    features: pkg.moTa?.split('\n') || ['Gói tập cơ bản'],
                    popular: pkg.popular || false,
                    originalPrice: pkg.giaGoc ? `${pkg.giaGoc?.toLocaleString('vi-VN')}đ` : null
                })) : [];
                setAvailablePackages(transformedPackages);
            }

            if (hangHoiVienData.status === 'fulfilled' && hangHoiVienData.value) {
                const hangData = hangHoiVienData.value;
                if (hangData.hangHoiVien) {
                    setHangHoiVien({
                        tenHang: hangData.hangHoiVien.tenHang,
                        tenHienThi: hangData.hangHoiVien.tenHienThi,
                        mauSac: hangData.hangHoiVien.mauSac,
                        icon: hangData.hangHoiVien.icon,
                        quyenLoi: hangData.hangHoiVien.quyenLoi || [],
                        soTienTichLuy: hangData.soTienTichLuy || 0,
                        soThangLienTuc: hangData.soThangLienTuc || 0,
                        soBuoiTapDaTap: hangData.soBuoiTapDaTap || 0
                    });
                }
            }

        } catch (error) {
            console.error('Error fetching membership data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu thành viên. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMembershipData();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#4CAF50';
            case 'expired': return '#DA2128';
            case 'pending': return '#FF9800';
            default: return '#666';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Đang hoạt động';
            case 'expired': return 'Đã hết hạn';
            case 'pending': return 'Chờ xác nhận';
            default: return 'Không xác định';
        }
    };

    const handleRenewMembership = () => {
        Alert.alert(
            "Gia hạn thành viên",
            "Bạn có muốn gia hạn gói thành viên hiện tại?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Gia hạn", onPress: () => {
                        Alert.alert("Thành công", "Yêu cầu gia hạn đã được gửi!");
                    }
                }
            ]
        );
    };

    const handleUpgrade = (packageItem) => {
        Alert.alert(
            "Nâng cấp gói",
            `Bạn có muốn nâng cấp lên gói ${packageItem.name}?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Nâng cấp", onPress: () => {
                        Alert.alert("Thành công", "Yêu cầu nâng cấp đã được gửi!");
                    }
                }
            ]
        );
    };

    const handleViewMonthlyPackages = () => {
        navigation.navigate('MonthlyMembership');
    };

    const renderQuickStats = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thống kê nhanh</Text>
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                        <MaterialIcons name="attach-money" size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {hangHoiVien.soTienTichLuy.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tích lũy</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                        <MaterialIcons name="schedule" size={24} color={colors.success} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {hangHoiVien.soThangLienTuc} tháng
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Liên tục</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                        <MaterialIcons name="fitness-center" size={24} color={colors.warning} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {hangHoiVien.soBuoiTapDaTap} buổi
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã tập</Text>
                </View>
            </View>
        </View>
    );

    const renderMembershipCard = () => {
        if (membershipData.status === 'inactive') {
            return (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Gói hiện tại</Text>
                    <View style={[styles.noMembershipCard, { backgroundColor: colors.card }]}>
                        <MaterialIcons name="card-membership" size={48} color={colors.textMuted} />
                        <Text style={[styles.noMembershipTitle, { color: colors.text }]}>
                            Chưa có gói thành viên
                        </Text>
                        <Text style={[styles.noMembershipText, { color: colors.textSecondary }]}>
                            Đăng ký gói thành viên để trải nghiệm đầy đủ dịch vụ
                        </Text>
                        <TouchableOpacity
                            style={[styles.getMembershipButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('MonthlyMembership')}
                        >
                            <Text style={styles.getMembershipButtonText}>Đăng ký ngay</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Gói hiện tại</Text>
                <View style={styles.membershipCardContainer}>
                    <LinearGradient
                        colors={membershipData.status === 'active' ? ['#667eea', '#764ba2'] : ['#f093fb', '#f5576c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.membershipCard}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>Gói {membershipData.membershipType}</Text>
                                <View style={styles.statusContainer}>
                                    <View style={[styles.statusDot, { backgroundColor: membershipData.status === 'active' ? '#4CAF50' : '#FF5722' }]} />
                                    <Text style={[styles.statusText, { color: '#fff' }]}>
                                        {getStatusText(membershipData.status)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.qrButton}>
                                <MaterialIcons name="qr-code" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressInfo}>
                                <Text style={styles.daysRemaining}>{membershipData.daysRemaining}</Text>
                                <Text style={styles.daysLabel}>ngày còn lại</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        width: `${((membershipData.totalDays - membershipData.daysRemaining) / membershipData.totalDays) * 100}%`,
                                    }
                                ]} />
                            </View>
                            <Text style={styles.progressText}>
                                {membershipData.startDate} - {membershipData.endDate}
                            </Text>
                        </View>

                        <View style={styles.benefitsList}>
                            <Text style={styles.benefitsTitle}>Quyền lợi của bạn:</Text>
                            {Array.isArray(membershipData.benefits) ? membershipData.benefits.slice(0, 3).map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                                    <Text style={styles.benefitText}>{benefit}</Text>
                                </View>
                            )) : null}
                            {membershipData.benefits && membershipData.benefits.length > 3 && (
                                <Text style={styles.moreBenefitsText}>
                                    +{membershipData.benefits.length - 3} quyền lợi khác
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity style={styles.renewButton} onPress={handleRenewMembership}>
                            <MaterialIcons name="autorenew" size={20} color="#fff" />
                            <Text style={styles.renewButtonText}>Gia hạn gói</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        );
    };

    const renderMembershipRank = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hạng hội viên</Text>
            <View style={[styles.hangCard, { backgroundColor: colors.card }]}>
                <View style={styles.hangHeader}>
                    <View style={[styles.hangIcon, { backgroundColor: hangHoiVien.mauSac }]}>
                        <Text style={styles.hangIconText}>{hangHoiVien.icon}</Text>
                    </View>
                    <View style={styles.hangInfo}>
                        <Text style={[styles.hangName, { color: colors.text }]}>{hangHoiVien.tenHienThi || 'Chưa có hạng'}</Text>
                        <Text style={[styles.hangDescription, { color: colors.textSecondary }]}>
                            {hangHoiVien.tenHang ? 'Hạng ' + hangHoiVien.tenHang : 'Chưa đạt hạng nào'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.rankInfoButton, { backgroundColor: colors.surface }]}>
                        <MaterialIcons name="info-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {hangHoiVien.tenHang && (
                    <View style={styles.hangStats}>
                        <View style={styles.hangStatItem}>
                            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <MaterialIcons name="attach-money" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.hangStatValue, { color: colors.text }]}>
                                {hangHoiVien.soTienTichLuy.toLocaleString('vi-VN')}đ
                            </Text>
                            <Text style={[styles.hangStatLabel, { color: colors.textSecondary }]}>Tích lũy</Text>
                        </View>
                        <View style={styles.hangStatItem}>
                            <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                                <MaterialIcons name="schedule" size={20} color={colors.success} />
                            </View>
                            <Text style={[styles.hangStatValue, { color: colors.text }]}>
                                {hangHoiVien.soThangLienTuc} tháng
                            </Text>
                            <Text style={[styles.hangStatLabel, { color: colors.textSecondary }]}>Liên tục</Text>
                        </View>
                        <View style={styles.hangStatItem}>
                            <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '20' }]}>
                                <MaterialIcons name="fitness-center" size={20} color={colors.warning} />
                            </View>
                            <Text style={[styles.hangStatValue, { color: colors.text }]}>
                                {hangHoiVien.soBuoiTapDaTap} buổi
                            </Text>
                            <Text style={[styles.hangStatLabel, { color: colors.textSecondary }]}>Đã tập</Text>
                        </View>
                    </View>
                )}

                {hangHoiVien.quyenLoi && hangHoiVien.quyenLoi.length > 0 && (
                    <View style={styles.quyenLoiContainer}>
                        <Text style={[styles.quyenLoiTitle, { color: colors.text }]}>Quyền lợi của bạn:</Text>
                        {hangHoiVien.quyenLoi.slice(0, 3).map((quyenLoi, index) => (
                            <View key={index} style={styles.quyenLoiItem}>
                                <MaterialIcons name="check-circle" size={16} color={colors.success} />
                                <Text style={[styles.quyenLoiText, { color: colors.text }]}>{quyenLoi.tenQuyenLoi}</Text>
                            </View>
                        ))}
                        {hangHoiVien.quyenLoi.length > 3 && (
                            <Text style={[styles.quyenLoiMore, { color: colors.primary }]}>
                                +{hangHoiVien.quyenLoi.length - 3} quyền lợi khác
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );

    const renderPaymentHistory = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Lịch sử thanh toán</Text>
            {paymentHistory.map((payment) => (
                <View key={payment.id} style={[styles.paymentItem, { backgroundColor: colors.card }]}>
                    <View style={[styles.paymentIcon, { backgroundColor: colors.primary + '20' }]}>
                        <MaterialIcons name="payment" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentPackage, { color: colors.text }]}>{payment.package}</Text>
                        <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>{payment.date} • {payment.method}</Text>
                    </View>
                    <View style={styles.paymentAmount}>
                        <Text style={[styles.paymentPrice, { color: colors.text }]}>{payment.amount}</Text>
                        <View style={[styles.paymentStatusBadge, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.paymentStatusText, { color: colors.success }]}>Đã thanh toán</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderAvailablePackages = () => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gói thành viên khả dụng</Text>
            {availablePackages.map((packageItem, index) => (
                <View key={packageItem.id} style={styles.packageCardContainer}>
                    {packageItem.popular && (
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.packageCard}
                        >
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularText}>PHỔ BIẾN</Text>
                            </View>
                            <View style={styles.packageHeader}>
                                <View>
                                    <Text style={styles.packageName}>{packageItem.name}</Text>
                                    <Text style={styles.packageDuration}>{packageItem.duration}</Text>
                                </View>
                                <View style={styles.packagePricing}>
                                    <Text style={styles.packagePrice}>{packageItem.price}</Text>
                                    {packageItem.originalPrice && (
                                        <Text style={styles.packageOriginalPrice}>{packageItem.originalPrice}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.packageBenefits}>
                                {Array.isArray(packageItem.benefits) ? packageItem.benefits.slice(0, 3).map((benefit, benefitIndex) => (
                                    <View key={benefitIndex} style={styles.packageBenefitItem}>
                                        <MaterialIcons name="check" size={16} color="#4CAF50" />
                                        <Text style={styles.packageBenefitText}>{benefit}</Text>
                                    </View>
                                )) : null}
                                {packageItem.benefits && packageItem.benefits.length > 3 && (
                                    <Text style={styles.moreBenefitsText}>
                                        +{packageItem.benefits.length - 3} quyền lợi khác
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity style={styles.packageButton} onPress={() => handleUpgrade(packageItem)}>
                                <Text style={styles.packageButtonText}>Nâng cấp</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>
                    )}

                    {!packageItem.popular && (
                        <View style={[styles.packageCard, { backgroundColor: colors.card }]}>
                            <View style={styles.packageHeader}>
                                <View>
                                    <Text style={[styles.packageName, { color: colors.text }]}>{packageItem.name}</Text>
                                    <Text style={[styles.packageDuration, { color: colors.textSecondary }]}>{packageItem.duration}</Text>
                                </View>
                                <View style={styles.packagePricing}>
                                    <Text style={[styles.packagePrice, { color: colors.primary }]}>{packageItem.price}</Text>
                                    {packageItem.originalPrice && (
                                        <Text style={[styles.packageOriginalPrice, { color: colors.textMuted }]}>{packageItem.originalPrice}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.packageBenefits}>
                                {Array.isArray(packageItem.benefits) ? packageItem.benefits.slice(0, 3).map((benefit, benefitIndex) => (
                                    <View key={benefitIndex} style={styles.packageBenefitItem}>
                                        <MaterialIcons name="check" size={16} color={colors.success} />
                                        <Text style={[styles.packageBenefitText, { color: colors.text }]}>{benefit}</Text>
                                    </View>
                                )) : null}
                                {packageItem.benefits && packageItem.benefits.length > 3 && (
                                    <Text style={[styles.moreBenefitsText, { color: colors.primary }]}>
                                        +{packageItem.benefits.length - 3} quyền lợi khác
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[styles.packageButton, { backgroundColor: colors.surface }]}
                                onPress={() => handleUpgrade(packageItem)}
                            >
                                <Text style={[styles.packageButtonText, { color: colors.text }]}>Nâng cấp</Text>
                                <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <MaterialIcons name="card-membership" size={24} color={colors.primary} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Thành viên</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.monthlyButton, { backgroundColor: colors.primary }]}
                        onPress={handleViewMonthlyPackages}
                    >
                        <MaterialIcons name="calendar-month" size={20} color="#fff" />
                        <Text style={styles.monthlyButtonText}>Gói tháng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.helpButton, { backgroundColor: colors.surface }]}>
                        <MaterialIcons name="help-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderQuickStats()}
                {renderMembershipCard()}
                {renderMembershipRank()}
                {renderPaymentHistory()}
                {renderAvailablePackages()}
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
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthlyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
    },
    monthlyButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    helpButton: {
        padding: 8,
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    membershipCardContainer: {
        margin: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    membershipCard: {
        borderRadius: 20,
        padding: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    qrButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressInfo: {
        alignItems: 'center',
        marginBottom: 16,
    },
    daysRemaining: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    daysLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    progressText: {
        fontSize: 12,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    benefitsList: {
        marginBottom: 20,
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#fff',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    benefitText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#fff',
    },
    moreBenefitsText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontStyle: 'italic',
        marginTop: 4,
    },
    renewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    renewButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        margin: 20,
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentPackage: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    paymentDate: {
        fontSize: 12,
    },
    paymentAmount: {
        alignItems: 'flex-end',
    },
    paymentPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    paymentStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    paymentStatusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    packageCardContainer: {
        marginBottom: 16,
    },
    packageCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    packageCardPopular: {
        borderWidth: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: -8,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FF6B6B',
    },
    popularText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#fff',
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
    },
    packageBenefits: {
        marginBottom: 16,
    },
    packageBenefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    packageBenefitText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#fff',
    },
    packageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    packageButtonPopular: {
        // backgroundColor will be set dynamically
    },
    packageButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 8,
    },
    packageButtonTextPopular: {
        color: '#fff',
    },
    // Hạng hội viên styles
    hangCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    hangHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    hangIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    hangIconText: {
        fontSize: 28,
    },
    hangInfo: {
        flex: 1,
    },
    hangName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    hangDescription: {
        fontSize: 14,
    },
    rankInfoButton: {
        padding: 8,
        borderRadius: 8,
    },
    hangStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    hangStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    hangStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    hangStatLabel: {
        fontSize: 12,
    },
    quyenLoiContainer: {
        marginTop: 8,
    },
    quyenLoiTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    quyenLoiItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    quyenLoiText: {
        marginLeft: 8,
        fontSize: 13,
    },
    quyenLoiMore: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    // No Membership Card Styles
    noMembershipCard: {
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    noMembershipTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    noMembershipText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    getMembershipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    getMembershipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    // Stats Grid Styles
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
});

export default MembershipScreen;