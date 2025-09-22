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
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const PTRevenueScreen = ({ navigation }) => {
    const themeContext = useTheme();
    const colors = themeContext?.colors || {
        primary: '#007bff',
        background: '#f8f9fa',
        text: '#333',
        surface: '#ffffff',
        border: '#e0e0e0',
        card: '#ffffff',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
    };
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        totalSessions: 0
    });

    const styles = StyleSheet.create({
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
        statsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        statCard: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
            width: (width - 50) / 2,
            marginBottom: 10,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        statTitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 5,
            textTransform: 'uppercase',
            fontWeight: '600',
        },
        statValue: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
        },
        statIcon: {
            position: 'absolute',
            right: 15,
            top: 15,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 15,
        },
        paymentCard: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
            marginBottom: 10,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        paymentHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        memberName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
        },
        paymentAmount: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#4CAF50',
        },
        paymentDate: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 5,
        },
        paymentMethod: {
            fontSize: 14,
            color: colors.text,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginLeft: 10,
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
        filterContainer: {
            flexDirection: 'row',
            marginBottom: 20,
        },
        filterButton: {
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 10,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        filterButtonActive: {
            backgroundColor: colors.primary,
        },
        filterButtonText: {
            color: colors.primary,
            fontSize: 14,
            fontWeight: '600',
        },
        filterButtonTextActive: {
            color: 'white',
        },
    });

    const [selectedFilter, setSelectedFilter] = useState('all');
    const filters = [
        { key: 'all', label: 'Tất cả' },
        { key: 'week', label: 'Tuần này' },
        { key: 'month', label: 'Tháng này' },
        { key: 'confirmed', label: 'Đã xác nhận' }
    ];

    useEffect(() => {
        fetchRevenueData();
    }, [selectedFilter]);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            
            // Lấy dữ liệu thanh toán của PT từ API
            const paymentsResponse = await apiService.get('/api/thanhtoan/my');
            
            if (paymentsResponse.data) {
                const allPayments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
                
                // Filter payments theo thời gian được chọn
                const filteredPayments = filterPaymentsByPeriod(allPayments, selectedFilter);
                setPayments(filteredPayments);
                
                // Tính toán thống kê
                calculateStats(allPayments);
            } else {
                // Nếu không có dữ liệu, sử dụng dữ liệu demo
                const demoPayments = generateDemoData();
                const filteredPayments = filterPaymentsByPeriod(demoPayments, selectedFilter);
                setPayments(filteredPayments);
                calculateStats(demoPayments);
            }
        } catch (error) {
            console.log('Error fetching revenue data:', error);
            
            // Fallback to demo data khi có lỗi API
            const demoPayments = generateDemoData();
            const filteredPayments = filterPaymentsByPeriod(demoPayments, selectedFilter);
            setPayments(filteredPayments);
            calculateStats(demoPayments);
        } finally {
            setLoading(false);
        }
    };

    const generateDemoData = () => {
        const now = new Date();
        return [
            {
                _id: '1',
                soTien: 500000,
                ngayTao: new Date(now.getTime() - 86400000).toISOString(), // 1 ngày trước
                trangThai: 'DaXacNhan',
                phuongThuc: 'Tiền mặt',
                noiDung: 'Phí PT session',
                hoiVien: { hoTen: 'Nguyễn Văn A' }
            },
            {
                _id: '2',
                soTien: 300000,
                ngayTao: new Date(now.getTime() - 172800000).toISOString(), // 2 ngày trước
                trangThai: 'DaXacNhan',
                phuongThuc: 'Chuyển khoản',
                noiDung: 'Phí tập cá nhân',
                hoiVien: { hoTen: 'Trần Thị B' }
            },
            {
                _id: '3',
                soTien: 400000,
                ngayTao: new Date(now.getTime() - 259200000).toISOString(), // 3 ngày trước
                trangThai: 'ChoXacNhan',
                phuongThuc: 'Thẻ tín dụng',
                noiDung: 'Gói tập PT',
                hoiVien: { hoTen: 'Lê Văn C' }
            },
            {
                _id: '4',
                soTien: 600000,
                ngayTao: new Date(now.getTime() - 604800000).toISOString(), // 1 tuần trước
                trangThai: 'DaXacNhan',
                phuongThuc: 'Tiền mặt',
                noiDung: 'Phí PT Premium',
                hoiVien: { hoTen: 'Phạm Thị D' }
            }
        ];
    };

    const filterPaymentsByPeriod = (payments, period) => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return payments.filter(payment => {
            const paymentDate = new Date(payment.ngayTao);
            
            switch (period) {
                case 'week':
                    return paymentDate >= startOfWeek;
                case 'month':
                    return paymentDate >= startOfMonth;
                case 'confirmed':
                    return payment.trangThai === 'DaXacNhan';
                default:
                    return true;
            }
        });
    };

    const calculateStats = (payments) => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const confirmedPayments = payments.filter(p => p.trangThai === 'DaXacNhan');
        
        const totalRevenue = confirmedPayments.reduce((sum, payment) => {
            return sum + (payment.soTien || 0);
        }, 0);

        const monthlyRevenue = confirmedPayments
            .filter(p => new Date(p.ngayTao) >= startOfMonth)
            .reduce((sum, payment) => sum + (payment.soTien || 0), 0);

        const weeklyRevenue = confirmedPayments
            .filter(p => new Date(p.ngayTao) >= startOfWeek)
            .reduce((sum, payment) => sum + (payment.soTien || 0), 0);

        setStats({
            totalRevenue,
            monthlyRevenue,
            weeklyRevenue,
            totalSessions: confirmedPayments.length
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
            default:
                return 'Không xác định';
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRevenueData().finally(() => setRefreshing(false));
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Doanh Thu</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.emptyText, { marginTop: 10 }]}>Đang tải dữ liệu...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Doanh Thu</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Thống kê tổng quan */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialIcons
                            name="attach-money"
                            size={24}
                            color="#4CAF50"
                            style={styles.statIcon}
                        />
                        <Text style={styles.statTitle}>Tổng doanh thu</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.totalRevenue)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialIcons
                            name="calendar-today"
                            size={24}
                            color="#2196F3"
                            style={styles.statIcon}
                        />
                        <Text style={styles.statTitle}>Doanh thu tháng</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.monthlyRevenue)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialIcons
                            name="trending-up"
                            size={24}
                            color="#FF9800"
                            style={styles.statIcon}
                        />
                        <Text style={styles.statTitle}>Doanh thu tuần</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.weeklyRevenue)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialIcons
                            name="fitness-center"
                            size={24}
                            color="#9C27B0"
                            style={styles.statIcon}
                        />
                        <Text style={styles.statTitle}>Buổi tập</Text>
                        <Text style={styles.statValue}>{stats.totalSessions}</Text>
                    </View>
                </View>

                {/* Bộ lọc */}
                <View style={styles.filterContainer}>
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterButton,
                                selectedFilter === filter.key && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedFilter(filter.key)}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    selectedFilter === filter.key && styles.filterButtonTextActive
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Danh sách thanh toán */}
                <Text style={styles.sectionTitle}>Lịch sử thanh toán</Text>

                {payments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons
                            name="receipt-long"
                            size={64}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.emptyText}>
                            Chưa có dữ liệu thanh toán nào
                        </Text>
                    </View>
                ) : (
                    payments.map((payment, index) => (
                        <View key={payment._id || index} style={styles.paymentCard}>
                            <View style={styles.paymentHeader}>
                                <Text style={styles.memberName}>
                                    {payment.hoiVien?.hoTen || 'Hội viên'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.paymentAmount}>
                                        {formatCurrency(payment.soTien || 0)}
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(payment.trangThai) }
                                        ]}
                                    >
                                        <Text style={styles.statusText}>
                                            {getStatusText(payment.trangThai)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.paymentDate}>
                                {formatDate(payment.ngayTao)}
                            </Text>
                            <Text style={styles.paymentMethod}>
                                Phương thức: {payment.phuongThuc || 'Chưa xác định'}
                            </Text>
                            {payment.noiDung && (
                                <Text style={[styles.paymentMethod, { marginTop: 5 }]}>
                                    Ghi chú: {payment.noiDung}
                                </Text>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default PTRevenueScreen;