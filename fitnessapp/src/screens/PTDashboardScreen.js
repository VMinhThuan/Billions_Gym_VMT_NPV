import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Dimensions,
    ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const PTDashboardScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { userInfo } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        totalStudents: 0,
        activeBookings: 0,
        completedSessions: 0,
        monthlyRevenue: 0,
        todayBookings: [],
        upcomingSessions: [],
        recentStudents: []
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load PT dashboard data - handle errors individually
            let bookings = [];
            let students = [];
            
            try {
                bookings = await apiService.getMyPTBookings();
            } catch (bookingError) {
                bookings = [];
            }
            
            try {
                students = await apiService.getMyStudents();
            } catch (studentError) {
                students = [];
            }

            // Ensure we have arrays to work with
            const safeBookings = Array.isArray(bookings) ? bookings : [];
            const safeStudents = Array.isArray(students) ? students : [];

            const today = new Date();
            const todayBookings = safeBookings.filter(booking => {
                const bookingDate = new Date(booking.ngayHen);
                return bookingDate.toDateString() === today.toDateString();
            });

            const upcomingSessions = safeBookings
                .filter(booking => booking.trangThai === 'DA_XAC_NHAN')
                .sort((a, b) => new Date(a.ngayHen) - new Date(b.ngayHen))
                .slice(0, 5);

            const completedSessions = safeBookings.filter(booking =>
                booking.trangThai === 'HOAN_THANH'
            ).length;

            const monthlyRevenue = safeBookings
                .filter(booking => {
                    const bookingDate = new Date(booking.ngayHen);
                    return bookingDate.getMonth() === today.getMonth() &&
                        bookingDate.getFullYear() === today.getFullYear() &&
                        booking.trangThai === 'HOAN_THANH';
                })
                .reduce((total, booking) => total + (booking.giaTien || 0), 0);

            setDashboardData({
                totalStudents: safeStudents.length,
                activeBookings: safeBookings.filter(b => b.trangThai === 'DA_XAC_NHAN').length,
                completedSessions,
                monthlyRevenue,
                todayBookings,
                upcomingSessions,
                recentStudents: safeStudents.slice(0, 5)
            });
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải dữ liệu dashboard');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'CHO_XAC_NHAN': return '#FFA500';
            case 'DA_XAC_NHAN': return '#4CAF50';
            case 'HOAN_THANH': return '#2196F3';
            case 'DA_HUY': return '#F44336';
            default: return colors.text;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'CHO_XAC_NHAN': return 'Chờ xác nhận';
            case 'DA_XAC_NHAN': return 'Đã xác nhận';
            case 'HOAN_THANH': return 'Hoàn thành';
            case 'DA_HUY': return 'Đã hủy';
            default: return status;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const renderStatsCard = (title, value, icon, color) => (
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
                <MaterialIcons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
    );

    const renderTodayBooking = (booking) => (
        <TouchableOpacity
            key={booking._id}
            style={[styles.bookingCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('PTBookingDetail', { bookingId: booking._id })}
        >
            <View style={styles.bookingHeader}>
                <Text style={[styles.studentName, { color: colors.text }]}>
                    {booking.hoiVien?.hoTen || 'N/A'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.trangThai) }]}>
                    <Text style={styles.statusText}>{getStatusText(booking.trangThai)}</Text>
                </View>
            </View>
            <View style={styles.bookingInfo}>
                <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                <Text style={[styles.bookingTime, { color: colors.textSecondary }]}>
                    {formatTime(booking.ngayHen)} - {booking.thoiLuong || 60} phút
                </Text>
            </View>
            <View style={styles.bookingInfo}>
                <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                <Text style={[styles.bookingLocation, { color: colors.textSecondary }]}>
                    {booking.diaDiem || 'Phòng tập chính'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderUpcomingSession = (session) => (
        <TouchableOpacity
            key={session._id}
            style={[styles.sessionCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('PTBookingDetail', { bookingId: session._id })}
        >
            <View style={styles.sessionInfo}>
                <Text style={[styles.sessionStudent, { color: colors.text }]}>
                    {session.hoiVien?.hoTen || 'N/A'}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                    {formatDate(session.ngayHen)} - {formatTime(session.ngayHen)}
                </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View>
                    <Text style={styles.welcomeText}>Xin chào,</Text>
                    <Text style={styles.ptName}>{userInfo?.hoTen || userInfo?.tenDangNhap || 'PT'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.jumpTo('PTProfile')}
                >
                    <MaterialIcons name="person" size={24} color="white" />
                </TouchableOpacity>
            </View>
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                        {renderStatsCard('Học viên', dashboardData.totalStudents, 'people', '#4CAF50')}
                        {renderStatsCard('Lịch hẹn', dashboardData.activeBookings, 'event', '#2196F3')}
                    </View>
                    <View style={styles.statsRow}>
                        {renderStatsCard('Buổi hoàn thành', dashboardData.completedSessions, 'check-circle', '#FF9800')}
                        {renderStatsCard('Doanh thu tháng', `${dashboardData.monthlyRevenue.toLocaleString()}đ`, 'attach-money', '#9C27B0')}
                    </View>
                </View>
                {/* Today's Bookings */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Lịch hẹn hôm nay</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('PTBookings')}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData.todayBookings.length > 0 ? (
                        dashboardData.todayBookings.map(renderTodayBooking)
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                            <MaterialIcons name="event-available" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Không có lịch hẹn nào hôm nay
                            </Text>
                        </View>
                    )}
                </View>
                {/* Upcoming Sessions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sắp tới</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('PTBookings')}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData.upcomingSessions.length > 0 ? (
                        dashboardData.upcomingSessions.map(renderUpcomingSession)
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                            <MaterialIcons name="schedule" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Không có lịch hẹn sắp tới
                            </Text>
                        </View>
                    )}
                </View>
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Thao tác nhanh</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('PTBookings')}
                        >
                            <MaterialIcons name="event" size={24} color="white" />
                            <Text style={styles.actionText}>Quản lý lịch hẹn</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                            onPress={() => navigation.jumpTo('PTStudents')}
                        >
                            <MaterialIcons name="people" size={24} color="white" />
                            <Text style={styles.actionText}>Học viên</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                            onPress={() => navigation.jumpTo('PTRevenue')}
                        >
                            <MaterialIcons name="attach-money" size={24} color="white" />
                            <Text style={styles.actionText}>Doanh thu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                            onPress={() => navigation.jumpTo('PTSchedule')}
                        >
                            <MaterialIcons name="schedule" size={24} color="white" />
                            <Text style={styles.actionText}>Lịch làm việc</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
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
    ptName: {
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statsTitle: {
        fontSize: 12,
        textAlign: 'center',
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
    bookingCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
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
    bookingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bookingTime: {
        marginLeft: 8,
        fontSize: 14,
    },
    bookingLocation: {
        marginLeft: 8,
        fontSize: 14,
    },
    sessionCard: {
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
    sessionInfo: {
        flex: 1,
    },
    sessionStudent: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    sessionDate: {
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

export default PTDashboardScreen;
