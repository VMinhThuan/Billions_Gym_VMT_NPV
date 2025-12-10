import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Alert,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const CheckoutScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [packageData, setPackageData] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        partnerPhone: ''
    });

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [branches, setBranches] = useState([]);

    const packageId = route.params?.packageId;

    useEffect(() => {
        fetchPackageData();
        fetchBranches();
        if (userInfo) {
            prefillUserData();
        }
    }, [packageId, userInfo]);

    const fetchPackageData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getPackageById(packageId);
            if (response && response.data) {
                setPackageData(response.data);
            } else {
                setPackageData(response);
            }
        } catch (err) {
            console.error('❌ Error fetching package:', err);
            setError('Không thể tải thông tin gói tập');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await apiService.apiCall('/chinhanh', 'GET', null, false);
            if (response && response.data) {
                setBranches(response.data);
                if (response.data.length > 0) {
                    setSelectedBranchId(response.data[0]._id);
                }
            } else if (Array.isArray(response)) {
                setBranches(response);
                if (response.length > 0) {
                    setSelectedBranchId(response[0]._id);
                }
            }
        } catch (err) {
            console.error('❌ Error fetching branches:', err);
        }
    };

    const prefillUserData = () => {
        if (!userInfo) return;

        const nameParts = userInfo.hoTen?.trim().split(' ') || [];
        setFormData({
            firstName: userInfo.ho || nameParts[0] || '',
            lastName: userInfo.ten || nameParts.slice(1).join(' ') || '',
            phone: userInfo.soDienThoai || userInfo.sdt || '',
            email: userInfo.email || '',
            partnerPhone: ''
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    const getDurationLabel = (thoiHan, donViThoiHan) => {
        const unitMap = {
            'Ngay': 'ngày',
            'Tuan': 'tuần',
            'Thang': 'tháng',
            'Nam': 'năm',
        };
        return unitMap[donViThoiHan] || donViThoiHan?.toLowerCase() || '';
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập họ');
            return false;
        }
        if (!formData.lastName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên');
            return false;
        }
        if (!formData.phone.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
            return false;
        }
        if (!formData.email.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập email');
            return false;
        }
        if (!selectedBranchId) {
            Alert.alert('Lỗi', 'Vui lòng chọn chi nhánh');
            return false;
        }
        if (!paymentMethod) {
            Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
            return false;
        }
        if (packageData?.soLuongNguoiThamGia === 2 && !formData.partnerPhone.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại người tập cùng');
            return false;
        }
        return true;
    };

    const handleCheckout = async () => {
        if (!validateForm()) return;

        try {
            setIsProcessing(true);

            const checkoutData = {
                packageId: packageId,
                branchId: selectedBranchId,
                startDate: startDate,
                paymentMethod: paymentMethod,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                partnerPhone: formData.partnerPhone || null
            };

            console.log('🛒 Checkout Data:', checkoutData);

            // Lấy userId từ userInfo
            const userId = userInfo?._id || userInfo?.id;
            if (!userId) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để thanh toán');
                setIsProcessing(false);
                return;
            }

            // Gọi API tạo thanh toán (MoMo / ZaloPay) - format giống web version
            const paymentResp = await apiService.createPayment({
                packageId: checkoutData.packageId,
                userId: userId,
                branchId: checkoutData.branchId,
                startDate: checkoutData.startDate,
                paymentMethod: checkoutData.paymentMethod,
                payload: {
                    firstName: checkoutData.firstName,
                    lastName: checkoutData.lastName,
                    phone: checkoutData.phone,
                    email: checkoutData.email,
                    partnerPhone: checkoutData.partnerPhone,
                    isUpgrade: false,
                    upgradeAmount: 0,
                    existingPackageId: null,
                    giaGoiTapGoc: packageData?.donGia || 0,
                    soTienBu: 0,
                    keepPreviousInfo: false,
                    previousBranchId: null,
                    previousPtId: null
                },
            });

            console.log('💳 Payment response:', paymentResp);

            if (paymentResp?.success && paymentResp?.data?.paymentUrl) {
                const url = paymentResp.data.paymentUrl;
                const orderId = paymentResp.data.orderId;

                // Navigate đến PaymentWebView screen để hiển thị thanh toán trong app
                navigation.navigate('PaymentWebView', {
                    paymentUrl: url,
                    orderId: orderId,
                    packageName: packageData?.tenGoiTap || 'Gói tập'
                });
            } else {
                const msg = paymentResp?.message || 'Không tạo được thanh toán';
                Alert.alert('Lỗi', msg);
            }

        } catch (err) {
            console.error('❌ Checkout error:', err);
            Alert.alert('Lỗi', 'Không thể xử lý thanh toán. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#da2128" />
                        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    if (error || !packageData) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={64} color="#da2128" />
                        <Text style={styles.errorText}>{error || 'Không tìm thấy gói tập'}</Text>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.backBtnText}>Quay lại</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Thanh toán</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. Thông tin hội viên */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionNumber}>1</Text>
                            <Text style={styles.sectionTitle}>Thông tin hội viên</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.firstName}
                                onChangeText={(text) => handleInputChange('firstName', text)}
                                placeholder="Nhập họ"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.lastName}
                                onChangeText={(text) => handleInputChange('lastName', text)}
                                placeholder="Nhập tên"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số điện thoại *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => handleInputChange('phone', text)}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                placeholder="Nhập email"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* 2. Thông tin gói tập */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionNumber}>2</Text>
                            <Text style={styles.sectionTitle}>Thông tin gói tập</Text>
                        </View>

                        <View style={styles.packageCard}>
                            <Text style={styles.packageName}>{packageData.tenGoiTap}</Text>
                            <View style={styles.packageDetail}>
                                <Text style={styles.packageDetailLabel}>Thời hạn:</Text>
                                <Text style={styles.packageDetailValue}>
                                    {packageData.thoiHan} {getDurationLabel(packageData.thoiHan, packageData.donViThoiHan)}
                                </Text>
                            </View>
                            <View style={styles.packageDetail}>
                                <Text style={styles.packageDetailLabel}>Số người tham gia:</Text>
                                <Text style={styles.packageDetailValue}>{packageData.soLuongNguoiThamGia || 1}</Text>
                            </View>
                            <View style={styles.priceInfo}>
                                {packageData.giaGoc && packageData.giaGoc > packageData.donGia && (
                                    <Text style={styles.originalPrice}>{formatPrice(packageData.giaGoc)}₫</Text>
                                )}
                                <Text style={styles.currentPrice}>{formatPrice(packageData.donGia)}₫</Text>
                            </View>
                        </View>

                        {packageData.soLuongNguoiThamGia === 2 && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Số điện thoại người tập cùng *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.partnerPhone}
                                    onChangeText={(text) => handleInputChange('partnerPhone', text)}
                                    placeholder="Nhập số điện thoại người tập cùng"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        )}
                    </View>

                    {/* 3. Chi nhánh */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionNumber}>3</Text>
                            <Text style={styles.sectionTitle}>Chọn chi nhánh</Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.branchScroll}
                        >
                            {branches.map((branch) => (
                                <TouchableOpacity
                                    key={branch._id}
                                    style={[
                                        styles.branchCard,
                                        selectedBranchId === branch._id && styles.branchCardSelected
                                    ]}
                                    onPress={() => setSelectedBranchId(branch._id)}
                                >
                                    <Text style={styles.branchName}>{branch.tenChiNhanh}</Text>
                                    <Text style={styles.branchAddress} numberOfLines={2}>
                                        {branch.diaChi}
                                    </Text>
                                    {selectedBranchId === branch._id && (
                                        <View style={styles.branchCheckmark}>
                                            <Ionicons name="checkmark-circle" size={24} color="#da2128" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 4. Phương thức thanh toán */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionNumber}>4</Text>
                            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                        </View>

                        <View style={styles.paymentMethods}>
                            <TouchableOpacity
                                style={[
                                    styles.paymentMethod,
                                    paymentMethod === 'zalopay' && styles.paymentMethodActive
                                ]}
                                onPress={() => setPaymentMethod('zalopay')}
                            >
                                <Image
                                    source={require('../../assets/zalopay.png')}
                                    style={styles.paymentLogo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.paymentMethodText}>ZaloPay</Text>
                                {paymentMethod === 'zalopay' && (
                                    <Ionicons name="checkmark-circle" size={24} color="#da2128" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.paymentMethod,
                                    paymentMethod === 'momo' && styles.paymentMethodActive
                                ]}
                                onPress={() => setPaymentMethod('momo')}
                            >
                                <Image
                                    source={require('../../assets/momo.png')}
                                    style={styles.paymentLogo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.paymentMethodText}>MoMo</Text>
                                {paymentMethod === 'momo' && (
                                    <Ionicons name="checkmark-circle" size={24} color="#da2128" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 5. Ngày bắt đầu */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionNumber}>5</Text>
                            <Text style={styles.sectionTitle}>Ngày bắt đầu tập</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Chọn ngày bắt đầu *</Text>
                            <View style={styles.dateInput}>
                                <Ionicons name="calendar-outline" size={20} color="#da2128" />
                                <Text style={styles.dateText}>{startDate}</Text>
                            </View>
                            <Text style={styles.helperText}>
                                Ngày bắt đầu mặc định là hôm nay
                            </Text>
                        </View>
                    </View>

                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tổng thanh toán:</Text>
                            <Text style={styles.summaryValue}>{formatPrice(packageData.donGia)}₫</Text>
                        </View>
                    </View>

                    {/* Checkout Button */}
                    <TouchableOpacity
                        style={[styles.checkoutBtn, isProcessing && styles.checkoutBtnDisabled]}
                        onPress={handleCheckout}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.checkoutBtnText}>Thanh toán ngay</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    backBtn: {
        backgroundColor: '#da2128',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    backBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1a1a1a',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#da2128',
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 32,
        marginRight: 12,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#d1d5db',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 16,
    },
    packageCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    packageName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    packageDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    packageDetailLabel: {
        color: '#9ca3af',
        fontSize: 14,
    },
    packageDetailValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    priceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    originalPrice: {
        color: '#9ca3af',
        fontSize: 16,
        textDecorationLine: 'line-through',
        marginRight: 12,
    },
    currentPrice: {
        color: '#da2128',
        fontSize: 24,
        fontWeight: '700',
    },
    branchScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    branchCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: width * 0.7,
        minHeight: 120,
        position: 'relative',
    },
    branchCardSelected: {
        borderColor: '#da2128',
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
    },
    branchName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    branchAddress: {
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 20,
    },
    branchCheckmark: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    paymentMethods: {
        gap: 12,
    },
    paymentMethod: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentMethodActive: {
        borderColor: '#da2128',
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
    },
    paymentLogo: {
        width: 48,
        height: 48,
        marginRight: 16,
    },
    paymentLogoMomo: {
        backgroundColor: '#D82D8B',
    },
    paymentLogoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
    },
    paymentMethodText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    dateInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        color: 'white',
        fontSize: 16,
    },
    helperText: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 6,
    },
    summaryCard: {
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
        borderWidth: 1,
        borderColor: '#da2128',
        borderRadius: 12,
        padding: 20,
        margin: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    summaryValue: {
        color: '#da2128',
        fontSize: 28,
        fontWeight: '700',
    },
    checkoutBtn: {
        backgroundColor: '#da2128',
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#da2128',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    checkoutBtnDisabled: {
        opacity: 0.6,
    },
    checkoutBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default CheckoutScreen;
