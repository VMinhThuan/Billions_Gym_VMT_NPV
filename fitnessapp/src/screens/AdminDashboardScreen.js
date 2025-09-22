import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        totalMembers: 0,
        totalPT: 0,
        monthlyRevenue: 0,
        activeMemberships: 0,
        newMembersThisMonth: 0,
        totalBookings: 0,
        completedSessions: 0,
        recentMembers: [],
        topPT: [],
        revenueChart: [],
        membershipStats: []
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load admin dashboard data
            const [members, ptList, payments, bookings] = await Promise.all([
                apiService.getAllMembers(),
                apiService.getAllPT(),
                apiService.getAllPayments(),
                apiService.getAllBookings()
            ]);

            // Ensure we have arrays to work with
            const safeMembers = Array.isArray(members) ? members : [];
            const safePTList = Array.isArray(ptList) ? ptList : [];
            const safePayments = Array.isArray(payments) ? payments : [];
            const safeBookings = Array.isArray(bookings) ? bookings : [];

            const today = new Date();
            const thisMonth = today.getMonth();
            const thisYear = today.getFullYear();

            // Calculate statistics
            const activeMemberships = safeMembers.filter(member =>
                member.trangThaiHoiVien === 'DANG_HOAT_DONG'
            ).length;

            const newMembersThisMonth = safeMembers.filter(member => {
                const joinDate = new Date(member.ngayThamGia);
                return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
            }).length;

            const monthlyRevenue = safePayments
                .filter(payment => {
                    const paymentDate = new Date(payment.ngayThanhToan);
                    return paymentDate.getMonth() === thisMonth &&
                        paymentDate.getFullYear() === thisYear &&
                        payment.trangThai === 'HOAN_THANH';
                })
                .reduce((total, payment) => total + (payment.soTien || 0), 0);

            const completedSessions = safeBookings.filter(booking =>
                booking.trangThai === 'HOAN_THANH'
            ).length;

            // Top PT by revenue
            const ptRevenue = {};
            safePayments
                .filter(payment => payment.trangThai === 'HOAN_THANH')
                .forEach(payment => {
                    if (payment.ptId) {
                        ptRevenue[payment.ptId] = (ptRevenue[payment.ptId] || 0) + (payment.soTien || 0);
                    }
                });

            const topPT = Object.entries(ptRevenue)
                .map(([ptId, revenue]) => {
                    const pt = safePTList.find(p => p._id === ptId);
                    return {
                        ...pt,
                        revenue
                    };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // Recent members
            const recentMembers = safeMembers
                .sort((a, b) => new Date(b.ngayThamGia) - new Date(a.ngayThamGia))
                .slice(0, 5);

            // Membership statistics
            const membershipStats = [
                { name: 'Đang hoạt động', value: safeMembers.filter(m => m.trangThaiHoiVien === 'DANG_HOAT_DONG').length, color: '#4CAF50' },
                { name: 'Tạm ngưng', value: safeMembers.filter(m => m.trangThaiHoiVien === 'TAM_NGUNG').length, color: '#FF9800' },
                { name: 'Hết hạn', value: safeMembers.filter(m => m.trangThaiHoiVien === 'HET_HAN').length, color: '#F44336' }
            ];

            setDashboardData({
                totalMembers: safeMembers.length,
                totalPT: safePTList.length,
                monthlyRevenue,
                activeMemberships,
                newMembersThisMonth,
                totalBookings: safeBookings.length,
                completedSessions,
                recentMembers,
                topPT,
                membershipStats
            });
        } catch (error) {
            console.error('Error loading admin dashboard data:', error);

            // Handle specific error types
            if (error.message && error.message.includes('403')) {
                Alert.alert('Lỗi quyền truy cập', 'Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản quản trị viên.');
            } else if (error.message && error.message.includes('401')) {
                Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (error.message && error.message.includes('404')) {
                Alert.alert('Lỗi', 'Không tìm thấy dữ liệu. Vui lòng kiểm tra kết nối mạng.');
            } else {
                Alert.alert('Lỗi', 'Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const renderStatsCard = (title, value, icon, color, subtitle = '') => (
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
                <MaterialIcons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>{title}</Text>
            {subtitle ? (
                <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            ) : null}
        </View>
    );

    const renderMemberItem = (member) => (
        <TouchableOpacity
            key={member._id}
            style={[styles.memberCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('MemberDetail', { memberId: member._id })}
        >
            <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                    {member.hoTen}
                </Text>
                <Text style={[styles.memberDate, { color: colors.textSecondary }]}>
                    Tham gia: {formatDate(member.ngayThamGia)}
                </Text>
            </View>
            <View style={[
                styles.statusBadge,
                { backgroundColor: member.trangThaiHoiVien === 'DANG_HOAT_DONG' ? '#4CAF50' : '#FF9800' }
            ]}>
                <Text style={styles.statusText}>
                    {member.trangThaiHoiVien === 'DANG_HOAT_DONG' ? 'Hoạt động' : 'Tạm ngưng'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderPTItem = (pt) => (
        <View key={pt._id} style={[styles.ptCard, { backgroundColor: colors.surface }]}>
            <View style={styles.ptInfo}>
                <Text style={[styles.ptName, { color: colors.text }]}>
                    {pt.hoTen}
                </Text>
                <Text style={[styles.ptRevenue, { color: colors.primary }]}>
                    {formatCurrency(pt.revenue)}
                </Text>
            </View>
            <View style={styles.ptRating}>
                <MaterialIcons name="star" size={16} color="#FFD700" />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                    {pt.danhGia || 0}/5
                </Text>
            </View>
        </View>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View>
                    <Text style={styles.welcomeText}>Xin chào,</Text>
                    <Text style={styles.adminName}>{user?.hoTen || 'Admin'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('AdminProfile')}
                >
                    <MaterialIcons name="admin-panel-settings" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Main Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    {renderStatsCard('Tổng thành viên', dashboardData.totalMembers, 'people', '#4CAF50')}
                    {renderStatsCard('PT', dashboardData.totalPT, 'fitness-center', '#2196F3')}
                </View>
                <View style={styles.statsRow}>
                    {renderStatsCard('Doanh thu tháng', formatCurrency(dashboardData.monthlyRevenue), 'attach-money', '#9C27B0')}
                    {renderStatsCard('Thành viên mới', dashboardData.newMembersThisMonth, 'person-add', '#FF9800')}
                </View>
            </View>

            {/* Secondary Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    {renderStatsCard('Lịch hẹn', dashboardData.totalBookings, 'event', '#00BCD4')}
                    {renderStatsCard('Buổi hoàn thành', dashboardData.completedSessions, 'check-circle', '#8BC34A')}
                </View>
            </View>

            {/* Membership Status */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Trạng thái thành viên</Text>
                <View style={styles.membershipStats}>
                    {dashboardData.membershipStats.map((stat, index) => (
                        <View key={index} style={styles.membershipStatItem}>
                            <View style={[styles.membershipStatDot, { backgroundColor: stat.color }]} />
                            <Text style={[styles.membershipStatText, { color: colors.text }]}>
                                {stat.name}: {stat.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Recent Members */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Thành viên mới</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MemberManagement')}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                {dashboardData.recentMembers.length > 0 ? (
                    dashboardData.recentMembers.map(renderMemberItem)
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                        <MaterialIcons name="people" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Chưa có thành viên mới
                        </Text>
                    </View>
                )}
            </View>

            {/* Top PT */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>PT hàng đầu</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('PTManagement')}>
                        <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                {dashboardData.topPT.length > 0 ? (
                    dashboardData.topPT.map(renderPTItem)
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                        <MaterialIcons name="fitness-center" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Chưa có dữ liệu PT
                        </Text>
                    </View>
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quản lý</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('MemberManagement')}
                    >
                        <MaterialIcons name="people" size={24} color="white" />
                        <Text style={styles.actionText}>Thành viên</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                        onPress={() => navigation.navigate('PTManagement')}
                    >
                        <MaterialIcons name="fitness-center" size={24} color="white" />
                        <Text style={styles.actionText}>PT</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                        onPress={() => navigation.navigate('Reports')}
                    >
                        <MaterialIcons name="assessment" size={24} color="white" />
                        <Text style={styles.actionText}>Báo cáo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => navigation.navigate('PaymentManagement')}
                    >
                        <MaterialIcons name="payment" size={24} color="white" />
                        <Text style={styles.actionText}>Thanh toán</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
                        onPress={() => navigation.navigate('PackageManagement')}
                    >
                        <MaterialIcons name="card-membership" size={24} color="white" />
                        <Text style={styles.actionText}>Gói tập</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#00BCD4' }]}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <MaterialIcons name="settings" size={24} color="white" />
                        <Text style={styles.actionText}>Cài đặt</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeText: {
        color: 'white',
        fontSize: 16,
        opacity: 0.9,
    },
    adminName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statsCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    statsTitle: {
        fontSize: 12,
        textAlign: 'center',
    },
    statsSubtitle: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    membershipStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    membershipStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    membershipStatDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    membershipStatText: {
        fontSize: 14,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    memberDate: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    ptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    ptInfo: {
        flex: 1,
    },
    ptName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    ptRevenue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    ptRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 14,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
        borderRadius: 12,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
});

export default AdminDashboardScreen;
