import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

const PTPaymentScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { userInfo } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // pending, completed, all
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');

    useEffect(() => {
        fetchPayments();
    }, [activeTab]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Mock data based on active tab
            let mockData = [
                {
                    id: 'pay001',
                    memberName: 'Nguyễn Văn A',
                    memberPhone: '0123456789',
                    ptName: 'Trainer Smith',
                    packageName: 'Gói PT 8 buổi',
                    sessions: 8,
                    completedSessions: 3,
                    pricePerSession: 300000,
                    totalAmount: 2400000,
                    paidAmount: 1200000,
                    remainingAmount: 1200000,
                    status: 'PARTIALLY_PAID',
                    createdAt: '2024-03-15',
                    dueDate: '2024-03-30',
                    paymentHistory: [
                        {
                            date: '2024-03-15',
                            amount: 1200000,
                            method: 'Tiền mặt',
                            note: 'Thanh toán 50% trước'
                        }
                    ]
                },
                {
                    id: 'pay002',
                    memberName: 'Trần Thị B',
                    memberPhone: '0987654321',
                    ptName: 'Trainer Johnson',
                    packageName: 'Gói PT 12 buổi',
                    sessions: 12,
                    completedSessions: 0,
                    pricePerSession: 350000,
                    totalAmount: 4200000,
                    paidAmount: 0,
                    remainingAmount: 4200000,
                    status: 'PENDING',
                    createdAt: '2024-03-14',
                    dueDate: '2024-03-28',
                    paymentHistory: []
                },
                {
                    id: 'pay003',
                    memberName: 'Lê Văn C',
                    memberPhone: '0111222333',
                    ptName: 'Trainer Lee',
                    packageName: 'Gói PT 6 buổi',
                    sessions: 6,
                    completedSessions: 6,
                    pricePerSession: 320000,
                    totalAmount: 1920000,
                    paidAmount: 1920000,
                    remainingAmount: 0,
                    status: 'COMPLETED',
                    createdAt: '2024-03-01',
                    dueDate: '2024-03-15',
                    completedAt: '2024-03-14',
                    paymentHistory: [
                        {
                            date: '2024-03-01',
                            amount: 1920000,
                            method: 'Chuyển khoản',
                            note: 'Thanh toán đầy đủ'
                        }
                    ]
                },
                {
                    id: 'pay004',
                    memberName: 'Phạm Thị D',
                    memberPhone: '0555666777',
                    ptName: 'Trainer Brown',
                    packageName: 'Gói PT 4 buổi',
                    sessions: 4,
                    completedSessions: 4,
                    pricePerSession: 280000,
                    totalAmount: 1120000,
                    paidAmount: 0,
                    remainingAmount: 1120000,
                    status: 'OVERDUE',
                    createdAt: '2024-02-20',
                    dueDate: '2024-03-05',
                    paymentHistory: []
                }
            ];

            // Filter based on active tab
            if (activeTab === 'pending') {
                mockData = mockData.filter(p => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(p.status));
            } else if (activeTab === 'completed') {
                mockData = mockData.filter(p => p.status === 'COMPLETED');
            }

            setPayments(mockData);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPayments();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#FF9800';
            case 'PARTIALLY_PAID': return '#2196F3';
            case 'COMPLETED': return '#4CAF50';
            case 'OVERDUE': return '#F44336';
            case 'CANCELLED': return '#666';
            default: return '#666';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PARTIALLY_PAID': return 'Thanh toán 1 phần';
            case 'COMPLETED': return 'Hoàn thành';
            case 'OVERDUE': return 'Quá hạn';
            case 'CANCELLED': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const handlePaymentPress = (payment) => {
        setSelectedPayment(payment);
        setModalVisible(true);
    };

    const handleMakePayment = (payment) => {
        setSelectedPayment(payment);
        setPaymentModalVisible(true);
    };

    const processPayment = async (amount, method, note) => {
        try {
            setLoading(true);
            // TODO: Call API to process payment

            Alert.alert(
                'Thanh toán thành công',
                `Đã thanh toán ${amount.toLocaleString()}đ cho ${selectedPayment.memberName}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setPaymentModalVisible(false);
                            fetchPayments();
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xử lý thanh toán');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = (payment) => {
        Alert.alert(
            'Gửi nhắc nhở',
            `Bạn có muốn gửi nhắc nhở thanh toán đến ${payment.memberName}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Gửi',
                    onPress: () => {
                        // TODO: Send reminder notification/SMS
                        Alert.alert('Thành công', 'Đã gửi nhắc nhở thanh toán');
                    }
                }
            ]
        );
    };

    const renderTabButton = (tab, title, count) => (
        <TouchableOpacity
            style={[
                styles.tabButton,
                { backgroundColor: activeTab === tab ? colors.surface : 'transparent' },
                activeTab === tab && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.textSecondary },
                activeTab === tab && { fontWeight: '500' }
            ]}>
                {title}
            </Text>
            {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderPaymentCard = ({ item }) => (
        <TouchableOpacity style={[styles.paymentCard, { backgroundColor: colors.surface }]} onPress={() => handlePaymentPress(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{item.memberName}</Text>
                    <Text style={[styles.memberPhone, { color: colors.textSecondary }]}>{item.memberPhone}</Text>
                    <Text style={[styles.ptName, { color: colors.textSecondary }]}>PT: {item.ptName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
            </View>

            <View style={[styles.packageInfo, { backgroundColor: colors.background }]}>
                <Text style={[styles.packageName, { color: colors.text }]}>{item.packageName}</Text>
                <Text style={[styles.sessionInfo, { color: colors.textSecondary }]}>
                    {item.completedSessions}/{item.sessions} buổi đã tập
                </Text>
            </View>

            <View style={styles.paymentInfo}>
                <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Tổng tiền:</Text>
                    <Text style={[styles.totalAmount, { color: colors.text }]}>{item.totalAmount.toLocaleString()}đ</Text>
                </View>
                <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Đã thanh toán:</Text>
                    <Text style={[styles.paidAmount, { color: '#4CAF50' }]}>{item.paidAmount.toLocaleString()}đ</Text>
                </View>
                <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Còn lại:</Text>
                    <Text style={[
                        styles.remainingAmount,
                        { color: item.remainingAmount > 0 ? '#F44336' : '#4CAF50' }
                    ]}>
                        {item.remainingAmount.toLocaleString()}đ
                    </Text>
                </View>
            </View>

            <View style={styles.dateInfo}>
                <View style={styles.dateRow}>
                    <MaterialIcons name="event" size={16} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>Tạo: {item.createdAt}</Text>
                </View>
                <View style={styles.dateRow}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={[
                        styles.dateText,
                        { color: item.status === 'OVERDUE' ? '#F44336' : colors.textSecondary }
                    ]}>
                        Hạn: {item.dueDate}
                    </Text>
                </View>
            </View>

            {item.remainingAmount > 0 && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.payButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleMakePayment(item)}
                    >
                        <MaterialIcons name="payment" size={16} color="white" />
                        <Text style={styles.payButtonText}>Thanh toán</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.reminderButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                        onPress={() => handleSendReminder(item)}
                    >
                        <MaterialIcons name="notifications" size={16} color={colors.primary} />
                        <Text style={[styles.reminderButtonText, { color: colors.primary }]}>Nhắc nhở</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderPaymentDetailModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Chi tiết thanh toán</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {selectedPayment && (
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.modalSection}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin thành viên</Text>
                                <View style={styles.modalRow}>
                                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Họ tên:</Text>
                                    <Text style={[styles.modalValue, { color: colors.text }]}>{selectedPayment.memberName}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Số điện thoại:</Text>
                                    <Text style={styles.modalValue}>{selectedPayment.memberPhone}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>PT:</Text>
                                    <Text style={styles.modalValue}>{selectedPayment.ptName}</Text>
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.sectionTitle}>Chi tiết gói tập</Text>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Gói tập:</Text>
                                    <Text style={styles.modalValue}>{selectedPayment.packageName}</Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Số buổi:</Text>
                                    <Text style={styles.modalValue}>
                                        {selectedPayment.completedSessions}/{selectedPayment.sessions} buổi
                                    </Text>
                                </View>
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Giá/buổi:</Text>
                                    <Text style={styles.modalValue}>
                                        {selectedPayment.pricePerSession.toLocaleString()}đ
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.sectionTitle}>Lịch sử thanh toán</Text>
                                {selectedPayment.paymentHistory.length > 0 ? (
                                    selectedPayment.paymentHistory.map((history, index) => (
                                        <View key={index} style={styles.historyItem}>
                                            <View style={styles.historyHeader}>
                                                <Text style={styles.historyDate}>{history.date}</Text>
                                                <Text style={styles.historyAmount}>
                                                    {history.amount.toLocaleString()}đ
                                                </Text>
                                            </View>
                                            <Text style={styles.historyMethod}>
                                                Phương thức: {history.method}
                                            </Text>
                                            {history.note && (
                                                <Text style={styles.historyNote}>
                                                    Ghi chú: {history.note}
                                                </Text>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noHistory}>Chưa có lịch sử thanh toán</Text>
                                )}
                            </View>
                        </ScrollView>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Đóng</Text>
                        </TouchableOpacity>
                        {selectedPayment?.remainingAmount > 0 && (
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    handleMakePayment(selectedPayment);
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                                    Thanh toán
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderPaymentModal = () => (
        <Modal
            visible={paymentModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setPaymentModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Xử lý thanh toán</Text>
                        <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {selectedPayment && (
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.paymentForm}>
                                <Text style={styles.paymentMember}>
                                    Thành viên: {selectedPayment.memberName}
                                </Text>
                                <Text style={styles.paymentRemaining}>
                                    Số tiền cần thanh toán: {selectedPayment.remainingAmount.toLocaleString()}đ
                                </Text>

                                <View style={styles.quickAmountButtons}>
                                    <TouchableOpacity
                                        style={styles.quickAmountButton}
                                        onPress={() => processPayment(selectedPayment.remainingAmount, 'Tiền mặt', 'Thanh toán đầy đủ')}
                                    >
                                        <Text style={styles.quickAmountText}>Thanh toán đầy đủ</Text>
                                        <Text style={styles.quickAmountValue}>
                                            {selectedPayment.remainingAmount.toLocaleString()}đ
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.quickAmountButton}
                                        onPress={() => processPayment(Math.round(selectedPayment.remainingAmount / 2), 'Tiền mặt', 'Thanh toán 50%')}
                                    >
                                        <Text style={styles.quickAmountText}>Thanh toán 50%</Text>
                                        <Text style={styles.quickAmountValue}>
                                            {Math.round(selectedPayment.remainingAmount / 2).toLocaleString()}đ
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.paymentMethods}>
                                    <Text style={styles.methodTitle}>Phương thức thanh toán:</Text>
                                    <TouchableOpacity
                                        style={styles.methodButton}
                                        onPress={() => processPayment(selectedPayment.remainingAmount, 'Tiền mặt', 'Thanh toán tiền mặt')}
                                    >
                                        <MaterialIcons name="money" size={20} color="#4CAF50" />
                                        <Text style={styles.methodText}>Tiền mặt</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.methodButton}
                                        onPress={() => processPayment(selectedPayment.remainingAmount, 'Chuyển khoản', 'Thanh toán chuyển khoản')}
                                    >
                                        <MaterialIcons name="account-balance" size={20} color="#2196F3" />
                                        <Text style={styles.methodText}>Chuyển khoản</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.methodButton}
                                        onPress={() => processPayment(selectedPayment.remainingAmount, 'Thẻ', 'Thanh toán bằng thẻ')}
                                    >
                                        <MaterialIcons name="credit-card" size={20} color="#FF9800" />
                                        <Text style={styles.methodText}>Thẻ</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );

    const pendingCount = payments.filter(p => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(p.status)).length;
    const completedCount = payments.filter(p => p.status === 'COMPLETED').length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Quản lý thanh toán</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        {payments.length} giao dịch
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                >
                    <MaterialIcons name="refresh" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                {renderTabButton('pending', 'Chờ thanh toán', pendingCount)}
                {renderTabButton('completed', 'Hoàn thành', completedCount)}
                {renderTabButton('all', 'Tất cả', payments.length)}
            </View>

            {/* Stats */}
            <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                        {payments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}đ
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng doanh thu</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                        {payments.reduce((sum, p) => sum + p.paidAmount, 0).toLocaleString()}đ
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã thu</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#F44336' }]}>
                        {payments.reduce((sum, p) => sum + p.remainingAmount, 0).toLocaleString()}đ
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Còn lại</Text>
                </View>
            </View>

            {/* Payment List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DA2128" />
                </View>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPaymentCard}
                    style={styles.paymentList}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="payment" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {activeTab === 'pending' && 'Không có thanh toán nào đang chờ'}
                                {activeTab === 'completed' && 'Chưa có thanh toán nào hoàn thành'}
                                {activeTab === 'all' && 'Chưa có dữ liệu thanh toán'}
                            </Text>
                        </View>
                    }
                />
            )}

            {renderPaymentDetailModal()}
            {renderPaymentModal()}
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
    },
    refreshButton: {
        padding: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 2,
        position: 'relative',
    },
    activeTab: {
        backgroundColor: '#f5f5f5',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#DA2128',
        fontWeight: '500',
    },
    tabBadge: {
        backgroundColor: '#DA2128',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 5,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 15,
        marginBottom: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    paymentList: {
        flex: 1,
    },
    listContent: {
        padding: 20,
    },
    paymentCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    memberPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    ptName: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    packageInfo: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    packageName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    sessionInfo: {
        fontSize: 12,
        color: '#666',
    },
    paymentInfo: {
        marginBottom: 10,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    paidAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    remainingAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    dateInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    payButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 5,
    },
    payButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 5,
    },
    reminderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#DA2128',
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 5,
    },
    reminderButtonText: {
        color: '#DA2128',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        maxHeight: 400,
    },
    modalSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    modalLabel: {
        fontSize: 14,
        color: '#666',
        width: 120,
    },
    modalValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        fontWeight: '500',
    },
    historyItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    historyMethod: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    historyNote: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    noHistory: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DA2128',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    primaryButton: {
        backgroundColor: '#DA2128',
    },
    modalButtonText: {
        fontSize: 16,
        color: '#DA2128',
        fontWeight: '500',
    },
    paymentForm: {
        padding: 10,
    },
    paymentMember: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    paymentRemaining: {
        fontSize: 14,
        color: '#F44336',
        marginBottom: 20,
    },
    quickAmountButtons: {
        marginBottom: 20,
    },
    quickAmountButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    quickAmountValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#DA2128',
    },
    paymentMethods: {
        marginTop: 10,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    methodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
    },
    methodText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
});

export default PTPaymentScreen;
