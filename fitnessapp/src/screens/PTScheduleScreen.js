import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Dimensions,
    ActivityIndicator,
    Modal
} from 'react-native';
import { SafeAreaFrameContext, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const PTScheduleScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const viewModes = [
        { key: 'day', label: 'Ngày' },
        { key: 'week', label: 'Tuần' },
        { key: 'month', label: 'Tháng' }
    ];

    useEffect(() => {
        fetchAppointments();
    }, [selectedDate, viewMode]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            
            // Lấy lịch hẹn PT từ API
            const response = await apiService.get('/api/lichhenpt');
            
            if (response.data && Array.isArray(response.data)) {
                // Filter appointments cho PT hiện tại và theo ngày/tuần/tháng được chọn
                const filteredAppointments = filterAppointmentsByDate(response.data, selectedDate, viewMode);
                setAppointments(filteredAppointments);
            } else {
                // Sử dụng demo data nếu không có dữ liệu
                const demoAppointments = generateDemoAppointments();
                const filteredAppointments = filterAppointmentsByDate(demoAppointments, selectedDate, viewMode);
                setAppointments(filteredAppointments);
            }
        } catch (error) {
            console.log('Error fetching appointments:', error);
            
            // Fallback to demo data
            const demoAppointments = generateDemoAppointments();
            const filteredAppointments = filterAppointmentsByDate(demoAppointments, selectedDate, viewMode);
            setAppointments(filteredAppointments);
        } finally {
            setLoading(false);
        }
    };

    const generateDemoAppointments = () => {
        const now = new Date();
        return [
            {
                _id: '1',
                ngayHen: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
                trangThai: 'DaXacNhan',
                ghiChu: 'PT session buổi sáng',
                hoiVien: { hoTen: 'Nguyễn Văn A' }
            },
            {
                _id: '2',
                ngayHen: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30).toISOString(),
                trangThai: 'ChoXacNhan',
                ghiChu: 'Tập luyện giảm cân',
                hoiVien: { hoTen: 'Trần Thị B' }
            },
            {
                _id: '3',
                ngayHen: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0).toISOString(),
                trangThai: 'DaXacNhan',
                ghiChu: 'Cardio workout',
                hoiVien: { hoTen: 'Lê Văn C' }
            },
            {
                _id: '4',
                ngayHen: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0).toISOString(),
                trangThai: 'HoanThanh',
                ghiChu: 'Strength training',
                hoiVien: { hoTen: 'Phạm Thị D' }
            }
        ];
    };

    const filterAppointmentsByDate = (appointments, date, mode) => {
        return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.ngayHen);
            const selectedDate = new Date(date);

            switch (mode) {
                case 'day':
                    return appointmentDate.toDateString() === selectedDate.toDateString();
                case 'week':
                    const weekStart = new Date(selectedDate);
                    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
                case 'month':
                    return appointmentDate.getMonth() === selectedDate.getMonth() &&
                           appointmentDate.getFullYear() === selectedDate.getFullYear();
                default:
                    return true;
            }
        });
    };

    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);
        
        switch (viewMode) {
            case 'day':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (direction * 7));
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + direction);
                break;
        }
        
        setSelectedDate(newDate);
    };

    const formatDateRange = (date, mode) => {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };

        switch (mode) {
            case 'day':
                return date.toLocaleDateString('vi-VN', options);
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return `${weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            case 'month':
                return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
            default:
                return '';
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
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DaXacNhan':
                return '#4CAF50';
            case 'ChoXacNhan':
                return '#FF9800';
            case 'DaHuy':
                return '#F44336';
            case 'HoanThanh':
                return '#2196F3';
            default:
                return '#9E9E9E';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'DaXacNhan':
                return 'Đã xác nhận';
            case 'ChoXacNhan':
                return 'Chờ xác nhận';
            case 'DaHuy':
                return 'Đã hủy';
            case 'HoanThanh':
                return 'Hoàn thành';
            default:
                return 'Không xác định';
        }
    };

    const handleAppointmentPress = (appointment) => {
        setSelectedAppointment(appointment);
        setModalVisible(true);
    };

    const handleConfirmAppointment = async (appointmentId) => {
        try {
            await apiService.put(`/api/lichhenpt/${appointmentId}`, {
                trangThai: 'DaXacNhan'
            });
            Alert.alert('Thành công', 'Đã xác nhận lịch hẹn');
            setModalVisible(false);
            fetchAppointments();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xác nhận lịch hẹn');
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        try {
            await apiService.put(`/api/lichhenpt/${appointmentId}`, {
                trangThai: 'DaHuy'
            });
            Alert.alert('Thành công', 'Đã hủy lịch hẹn');
            setModalVisible(false);
            fetchAppointments();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể hủy lịch hẹn');
        }
    };

    const getAppointmentStats = () => {
        const confirmed = appointments.filter(a => a.trangThai === 'DaXacNhan').length;
        const pending = appointments.filter(a => a.trangThai === 'ChoXacNhan').length;
        const completed = appointments.filter(a => a.trangThai === 'HoanThanh').length;
        
        return { confirmed, pending, completed, total: appointments.length };
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAppointments().finally(() => setRefreshing(false));
    };

    const stats = getAppointmentStats();
    const styles = getStyles(colors);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Lịch Làm Việc</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.emptyText, { marginTop: 10 }]}>Đang tải lịch hẹn...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lịch Làm Việc</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Thống kê */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Tổng số</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.confirmed}</Text>
                        <Text style={styles.statLabel}>Đã xác nhận</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.pending}</Text>
                        <Text style={styles.statLabel}>Chờ xác nhận</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.completed}</Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                </View>

                {/* Chế độ xem */}
                <View style={styles.viewModeContainer}>
                    {viewModes.map((mode) => (
                        <TouchableOpacity
                            key={mode.key}
                            style={[
                                styles.viewModeButton,
                                viewMode === mode.key && styles.viewModeButtonActive
                            ]}
                            onPress={() => setViewMode(mode.key)}
                        >
                            <Text
                                style={[
                                    styles.viewModeText,
                                    viewMode === mode.key && styles.viewModeTextActive
                                ]}
                            >
                                {mode.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Điều hướng ngày */}
                <View style={styles.dateNavigation}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateDate(-1)}
                    >
                        <MaterialIcons name="chevron-left" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <Text style={styles.dateText}>
                        {formatDateRange(selectedDate, viewMode)}
                    </Text>
                    
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateDate(1)}
                    >
                        <MaterialIcons name="chevron-right" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Danh sách lịch hẹn */}
                {appointments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons
                            name="event-note"
                            size={64}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.emptyText}>
                            Không có lịch hẹn nào trong thời gian này
                        </Text>
                    </View>
                ) : (
                    appointments
                        .sort((a, b) => new Date(a.ngayHen) - new Date(b.ngayHen))
                        .map((appointment, index) => (
                            <TouchableOpacity
                                key={appointment._id || index}
                                style={[
                                    styles.appointmentCard,
                                    { borderLeftColor: getStatusColor(appointment.trangThai) }
                                ]}
                                onPress={() => handleAppointmentPress(appointment)}
                            >
                                <View style={styles.appointmentHeader}>
                                    <Text style={styles.appointmentTime}>
                                        {formatTime(appointment.ngayHen)}
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(appointment.trangThai) }
                                        ]}
                                    >
                                        <Text style={styles.statusText}>
                                            {getStatusText(appointment.trangThai)}
                                        </Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.memberName}>
                                    {appointment.hoiVien?.hoTen || 'Hội viên'}
                                </Text>
                                
                                <Text style={styles.appointmentInfo}>
                                    📅 {formatDate(appointment.ngayHen)}
                                </Text>
                                
                                {appointment.ghiChu && (
                                    <Text style={styles.appointmentInfo}>
                                        📝 {appointment.ghiChu}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))
                )}
            </ScrollView>

            {/* Modal chi tiết lịch hẹn */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chi tiết lịch hẹn</Text>
                        
                        {selectedAppointment && (
                            <>
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Hội viên:</Text>
                                    <Text style={styles.modalValue}>
                                        {selectedAppointment.hoiVien?.hoTen || 'Chưa xác định'}
                                    </Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Thời gian:</Text>
                                    <Text style={styles.modalValue}>
                                        {formatTime(selectedAppointment.ngayHen)} - {formatDate(selectedAppointment.ngayHen)}
                                    </Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Trạng thái:</Text>
                                    <Text style={[styles.modalValue, { color: getStatusColor(selectedAppointment.trangThai) }]}>
                                        {getStatusText(selectedAppointment.trangThai)}
                                    </Text>
                                </View>

                                {selectedAppointment.ghiChu && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalLabel}>Ghi chú:</Text>
                                        <Text style={styles.modalValue}>{selectedAppointment.ghiChu}</Text>
                                    </View>
                                )}

                                <View style={styles.modalActions}>
                                    {selectedAppointment.trangThai === 'ChoXacNhan' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.confirmButton]}
                                                onPress={() => handleConfirmAppointment(selectedAppointment._id)}
                                            >
                                                <Text style={styles.actionButtonText}>Xác nhận</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.cancelButton]}
                                                onPress={() => handleCancelAppointment(selectedAppointment._id)}
                                            >
                                                <Text style={styles.actionButtonText}>Hủy</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.actionButtonText}>Đóng</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: colors.primary,
            padding: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
        },
        content: {
            flex: 1,
            padding: 20,
        },
        dateNavigation: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        dateText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
        },
        navButton: {
            padding: 10,
            borderRadius: 25,
            backgroundColor: colors.primary,
        },
        viewModeContainer: {
            flexDirection: 'row',
            marginBottom: 20,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 5,
        },
        viewModeButton: {
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 8,
            alignItems: 'center',
        },
        viewModeButtonActive: {
            backgroundColor: colors.primary,
        },
        viewModeText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        viewModeTextActive: {
            color: 'white',
        },
        appointmentCard: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
            marginBottom: 10,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            borderLeftWidth: 4,
        },
        appointmentHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        appointmentTime: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
        },
        memberName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 5,
        },
        appointmentInfo: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 3,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
        },
        statusText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: 'white',
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 50,
        },
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 20,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            width: width * 0.9,
            maxHeight: '80%',
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 15,
            textAlign: 'center',
        },
        modalSection: {
            marginBottom: 15,
        },
        modalLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 5,
        },
        modalValue: {
            fontSize: 16,
            color: colors.text,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 20,
        },
        actionButton: {
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginHorizontal: 5,
            alignItems: 'center',
        },
        confirmButton: {
            backgroundColor: '#4CAF50',
        },
        cancelButton: {
            backgroundColor: '#F44336',
        },
        closeButton: {
            backgroundColor: colors.textSecondary,
        },
        actionButtonText: {
            color: 'white',
            fontWeight: 'bold',
        },
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 20,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
        },
        statItem: {
            alignItems: 'center',
        },
        statNumber: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
        },
        statLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
    });

export default PTScheduleScreen;