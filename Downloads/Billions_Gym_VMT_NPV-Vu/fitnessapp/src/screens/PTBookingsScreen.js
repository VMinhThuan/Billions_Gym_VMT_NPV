import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const PTBookingsScreen = ({ navigation }) => {
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [selectedTab, setSelectedTab] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMyPTBookings();
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
            Alert.alert(
                'Lỗi',
                error.message || 'Không thể tải danh sách lịch hẹn. Vui lòng thử lại.',
                [
                    {
                        text: 'Đăng nhập lại',
                        onPress: () => {
                            // Logout and redirect to login
                            AsyncStorage.removeItem('authToken');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    },
                    { text: 'Thử lại', onPress: loadBookings }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBookings();
        setRefreshing(false);
    };

    const getFilteredBookings = () => {
        switch (selectedTab) {
            case 'pending':
                return bookings.filter(booking => booking.trangThai === 'CHO_XAC_NHAN');
            case 'confirmed':
                return bookings.filter(booking => booking.trangThai === 'DA_XAC_NHAN');
            case 'completed':
                return bookings.filter(booking => booking.trangThai === 'HOAN_THANH');
            case 'cancelled':
                return bookings.filter(booking => booking.trangThai === 'DA_HUY');
            default:
                return bookings;
        }
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleConfirmBooking = async (bookingId) => {
        try {
            await apiService.confirmPTBooking(bookingId);
            Alert.alert('Thành công', 'Đã xác nhận lịch hẹn');
            loadBookings();
        } catch (error) {
            console.error('Error confirming booking:', error);
            Alert.alert('Lỗi', 'Không thể xác nhận lịch hẹn');
        }
    };

    const handleCompleteBooking = async (bookingId) => {
        try {
            await apiService.completePTBooking(bookingId);
            Alert.alert('Thành công', 'Đã hoàn thành buổi tập');
            loadBookings();
        } catch (error) {
            console.error('Error completing booking:', error);
            Alert.alert('Lỗi', 'Không thể hoàn thành buổi tập');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        Alert.alert(
            'Xác nhận hủy',
            'Bạn có chắc chắn muốn hủy lịch hẹn này?',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Có',
                    onPress: async () => {
                        try {
                            await apiService.cancelPTBooking(bookingId);
                            Alert.alert('Thành công', 'Đã hủy lịch hẹn');
                            loadBookings();
                        } catch (error) {
                            console.error('Error cancelling booking:', error);
                            Alert.alert('Lỗi', 'Không thể hủy lịch hẹn');
                        }
                    }
                }
            ]
        );
    };

    const renderTabButton = (tab, title, count) => (
        <TouchableOpacity
            style={[
                styles.tabButton,
                {
                    backgroundColor: selectedTab === tab ? colors.primary : colors.surface,
                    borderColor: colors.primary
                }
            ]}
            onPress={() => setSelectedTab(tab)}
        >
            <Text style={[
                styles.tabText,
                { color: selectedTab === tab ? 'white' : colors.primary }
            ]}>
                {title} ({count})
            </Text>
        </TouchableOpacity>
    );

    const renderBookingItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.bookingCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('PTBookingDetail', { bookingId: item._id })}
        >
            <View style={styles.bookingHeader}>
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                        {item.hoiVien?.hoTen || 'N/A'}
                    </Text>
                    <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>
                        {formatDate(item.ngayHen)} - {formatTime(item.ngayHen)}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.trangThai) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.trangThai)}</Text>
                </View>
            </View>

            <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {item.thoiLuong || 60} phút
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {item.diaDiem || 'Phòng tập chính'}
                    </Text>
                </View>
                {item.ghiChu && (
                    <View style={styles.detailRow}>
                        <MaterialIcons name="note" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {item.ghiChu}
                        </Text>
                    </View>
                )}
            </View>

            {item.trangThai === 'CHO_XAC_NHAN' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleConfirmBooking(item._id)}
                    >
                        <MaterialIcons name="check" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                        onPress={() => handleCancelBooking(item._id)}
                    >
                        <MaterialIcons name="close" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.trangThai === 'DA_XAC_NHAN' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => handleCompleteBooking(item._id)}
                    >
                        <MaterialIcons name="done" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Hoàn thành</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                        onPress={() => handleCancelBooking(item._id)}
                    >
                        <MaterialIcons name="close" size={16} color="white" />
                        <Text style={styles.actionButtonText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const filteredBookings = getFilteredBookings();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Lịch hẹn từ học viên</Text>
                    <Text style={styles.headerSubtitle}>
                        {bookings.length} lịch hẹn
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                >
                    <MaterialIcons name="refresh" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {renderTabButton('all', 'Tất cả', bookings.length)}
                    {renderTabButton('pending', 'Chờ xác nhận',
                        bookings.filter(b => b.trangThai === 'CHO_XAC_NHAN').length)}
                    {renderTabButton('confirmed', 'Đã xác nhận',
                        bookings.filter(b => b.trangThai === 'DA_XAC_NHAN').length)}
                    {renderTabButton('completed', 'Hoàn thành',
                        bookings.filter(b => b.trangThai === 'HOAN_THANH').length)}
                    {renderTabButton('cancelled', 'Đã hủy',
                        bookings.filter(b => b.trangThai === 'DA_HUY').length)}
                </ScrollView>
            </View>

            {/* Bookings List */}
            <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item._id}
                renderItem={renderBookingItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="event-busy" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {loading ? 'Đang tải...' : 'Không có lịch hẹn nào'}
                        </Text>
                    </View>
                }
            />
        </View>
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
        paddingTop: 50,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 50,
        padding: 8,
    },
    refreshButton: {
        position: 'absolute',
        right: 16,
        top: 50,
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',   
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    tabsContainer: {
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    listContainer: {
        padding: 16,
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
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bookingDate: {
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
    bookingDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actionButtonText: {
        color: 'white',
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default PTBookingsScreen;
