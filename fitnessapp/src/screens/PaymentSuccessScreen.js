import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentSuccessScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { orderId, paymentMethod, amount, packageName, resultCode } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [toastShown, setToastShown] = useState(false);

    useEffect(() => {
        if (!orderId) {
            setError('Không tìm thấy thông tin đơn hàng');
            setLoading(false);
            return;
        }

        // Optimistic success nếu resultCode=0 từ deep link (giống web)
        if ((resultCode === '0' || resultCode === 0) && !paymentStatus) {
            setPaymentStatus({
                orderId,
                status: 'DA_THANH_TOAN',
                paymentMethod: paymentMethod || 'momo',
                amount: amount || null,
            });
        }

        checkPaymentStatus();
    }, [orderId]);

    const confirmPaymentIfNeeded = async () => {
        if (!orderId) return;
        try {
            setConfirming(true);
            const body = {
                orderId,
                resultCode: '0',
                amount: amount || paymentStatus?.amount || null,
                paymentMethod: paymentMethod || paymentStatus?.paymentMethod || 'momo',
            };
            const confirmResponse = await apiService.apiCall('/payment/confirm', 'POST', body, true);
            console.log('✅ [PaymentSuccess] confirm response:', confirmResponse);
        } catch (err) {
            console.warn('⚠️ [PaymentSuccess] confirm payment fallback error:', err?.message || err);
        } finally {
            setConfirming(false);
        }
    };

    const checkPaymentStatus = async () => {
        try {
            console.log('🔍 Checking payment status for orderId:', orderId);
            const response = await apiService.apiCall(`/payment/status/${orderId}`, 'GET', null, true);

            if (response.success && response.data) {
                setPaymentStatus(response.data);
                console.log('✅ Payment status:', response.data);

                if (response.data.status === 'DA_THANH_TOAN') {
                    await handleSuccessSideEffects(response.data);
                }

                return response.data;
            } else {
                // Nếu không có data từ API, tạo paymentStatus từ params
                console.log('⚠️ No payment status from API, using params');
                setPaymentStatus({
                    orderId: orderId,
                    status: 'DA_THANH_TOAN', // Assume success if we reached this screen
                    paymentMethod: paymentMethod || 'momo',
                    amount: amount || null
                });
            }
        } catch (err) {
            console.error('❌ Error checking payment status:', err);
            // Nếu lỗi API, vẫn hiển thị success screen với data từ params
            console.log('⚠️ API error, using params for payment status');
            setPaymentStatus({
                orderId: orderId,
                status: 'DA_THANH_TOAN', // Assume success if we reached this screen
                paymentMethod: paymentMethod || 'momo',
                amount: amount || null
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessSideEffects = async (statusData) => {
        if (!orderId) return;
        const notificationKey = `payment_success_${orderId}`;
        const updateKey = `payment_updated_${orderId}`;

        // Hiển thị 2 thông báo giống web (mỗi order chỉ 1 lần)
        if (!toastShown) {
            try {
                const shownRaw = await AsyncStorage.getItem(notificationKey);
                const shown = shownRaw ? JSON.parse(shownRaw).shown === true : false;
                if (!shown) {
                    Alert.alert('Thanh toán thành công', 'Đơn hàng đã được thanh toán thành công.');
                    Alert.alert('Vui lòng hoàn tất đăng ký gói', 'Hãy hoàn tất các bước tiếp theo để kích hoạt gói tập.');
                    await AsyncStorage.setItem(notificationKey, JSON.stringify({ shown: true, timestamp: Date.now() }));
                    setToastShown(true);
                }
            } catch (e) {
                console.warn('⚠️ Cannot store notification flag:', e?.message || e);
            }
        }

        // Gọi manual-update giống web (chỉ 1 lần)
        try {
            const updatedRaw = await AsyncStorage.getItem(updateKey);
            const updated = updatedRaw ? JSON.parse(updatedRaw).updated === true : false;
            if (!updated) {
                const body = { orderId, status: 'DA_THANH_TOAN' };
                try {
                    await apiService.apiCall('/payment/manual-update', 'POST', body, true);
                } catch (authErr) {
                    // Thử không auth nếu cần (web gọi public)
                    try {
                        await apiService.apiCall('/payment/manual-update', 'POST', body, false);
                    } catch (inner) {
                        console.warn('⚠️ manual-update failed:', inner?.message || inner);
                    }
                }
                await AsyncStorage.setItem(updateKey, JSON.stringify({ updated: true, timestamp: Date.now() }));
            }
        } catch (e) {
            console.warn('⚠️ Cannot store update flag:', e?.message || e);
        }
    };

    // Nếu mở từ deep link và vẫn pending, thử confirm thủ công rồi check lại
    useEffect(() => {
        if (!route.params?.fromDeepLink) return;
        if (!paymentStatus) return;
        if (paymentStatus?.status === 'CHO_THANH_TOAN') {
            (async () => {
                await confirmPaymentIfNeeded();
                await checkPaymentStatus();
            })();
        } else if (paymentStatus?.status === 'DA_THANH_TOAN') {
            handleSuccessSideEffects(paymentStatus);
        }
    }, [paymentStatus, route.params?.fromDeepLink]);

    const handleContinue = () => {
        // Navigate về Home với paymentSuccess flag để hiển thị thông báo
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'Main',
                    state: {
                        routes: [
                            {
                                name: 'Home',
                                params: { paymentSuccess: true }
                            }
                        ]
                    }
                }
            ]
        });
    };

    const handleViewPackage = () => {
        // Navigate đến màn hình xem gói tập
        navigation.navigate('Main', {
            screen: 'Profile',
            params: { tab: 'packages' }
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E63946" />
                    <Text style={styles.loadingText}>Đang kiểm tra trạng thái thanh toán...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
                    <Text style={styles.errorTitle}>Lỗi xảy ra</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
                        <Text style={styles.primaryButtonText}>Quay về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const isSuccess = paymentStatus?.status === 'DA_THANH_TOAN';
    const isPending = paymentStatus?.status === 'CHO_THANH_TOAN';
    const isFailed = paymentStatus?.status === 'THANH_TOAN_THAT_BAI';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Icon */}
                <View style={[styles.statusIconContainer,
                isSuccess && styles.statusIconSuccess,
                isPending && styles.statusIconPending,
                isFailed && styles.statusIconFailed
                ]}>
                    {isSuccess && (
                        <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
                    )}
                    {isPending && (
                        <MaterialIcons name="schedule" size={80} color="#FF9800" />
                    )}
                    {isFailed && (
                        <MaterialIcons name="error" size={80} color="#F44336" />
                    )}
                </View>

                {/* Status Title */}
                <Text style={styles.statusTitle}>
                    {isSuccess && '🎉 Thanh toán thành công!'}
                    {isPending && '⏳ Đang chờ thanh toán'}
                    {isFailed && '❌ Thanh toán thất bại'}
                </Text>

                {/* Status Description */}
                <Text style={styles.statusDescription}>
                    {isSuccess && 'Cảm ơn bạn đã thanh toán. Gói tập của bạn đã được kích hoạt thành công!'}
                    {isPending && 'Vui lòng hoàn tất thanh toán để kích hoạt gói tập.'}
                    {isFailed && 'Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.'}
                </Text>

                {/* Payment Details */}
                {paymentStatus && (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailsTitle}>Chi tiết thanh toán</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
                            <Text style={styles.detailValue}>{paymentStatus.orderId || orderId}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Phương thức thanh toán:</Text>
                            <Text style={styles.detailValue}>
                                {paymentStatus.paymentMethod === 'momo' || paymentMethod === 'momo' ? 'MoMo' : 'ZaloPay'}
                            </Text>
                        </View>

                        {(paymentStatus.amount || amount) && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Số tiền:</Text>
                                <Text style={[styles.detailValue, styles.amountValue]}>
                                    {new Intl.NumberFormat('vi-VN').format(paymentStatus.amount || amount)}₫
                                </Text>
                            </View>
                        )}

                        {paymentStatus.registrationTime && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Thời gian đăng ký:</Text>
                                <Text style={styles.detailValue}>
                                    {new Date(paymentStatus.registrationTime).toLocaleString('vi-VN')}
                                </Text>
                            </View>
                        )}

                        {packageName && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Gói tập:</Text>
                                <Text style={styles.detailValue}>{packageName}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Success Info */}
                {isSuccess && (
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoTitle}>🎉 Chào mừng bạn đến với Billions Fitness & Gym!</Text>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="fitness-center" size={32} color="#E63946" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoItemTitle}>Bắt đầu tập luyện</Text>
                                <Text style={styles.infoItemText}>
                                    Gói tập của bạn đã được kích hoạt. Hãy đến phòng gym để bắt đầu hành trình fitness!
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="calendar-today" size={32} color="#E63946" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoItemTitle}>Quản lý lịch tập</Text>
                                <Text style={styles.infoItemText}>
                                    Đăng nhập vào tài khoản để xem lịch tập và quản lý thông tin cá nhân.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItem}>
                            <MaterialIcons name="support-agent" size={32} color="#E63946" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoItemTitle}>Hỗ trợ 24/7</Text>
                                <Text style={styles.infoItemText}>
                                    Đội ngũ PT và nhân viên luôn sẵn sàng hỗ trợ bạn trong suốt quá trình tập luyện.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {isSuccess && (
                        <>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleViewPackage}>
                                <Text style={styles.primaryButtonText}>Xem gói tập của tôi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={handleContinue}>
                                <Text style={styles.secondaryButtonText}>Tiếp tục mua sắm</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isPending && (
                        <>
                            <TouchableOpacity style={styles.primaryButton} onPress={checkPaymentStatus}>
                                <Text style={styles.primaryButtonText}>Kiểm tra lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={handleContinue}>
                                <Text style={styles.secondaryButtonText}>Quay về trang chủ</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isFailed && (
                        <>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
                                <Text style={styles.primaryButtonText}>Thử lại thanh toán</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={handleContinue}>
                                <Text style={styles.secondaryButtonText}>Quay về trang chủ</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Contact Support */}
                <View style={styles.supportContainer}>
                    <Text style={styles.supportText}>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ:</Text>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="phone" size={20} color="#666" />
                        <Text style={styles.contactText}>Hotline: 1900 123 456</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="email" size={20} color="#666" />
                        <Text style={styles.contactText}>Email: support@billionsfitness.com</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    statusIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
        backgroundColor: '#f0f0f0',
    },
    statusIconSuccess: {
        backgroundColor: '#E8F5E9',
    },
    statusIconPending: {
        backgroundColor: '#FFF3E0',
    },
    statusIconFailed: {
        backgroundColor: '#FFEBEE',
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    statusDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    detailsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    amountValue: {
        fontSize: 16,
        color: '#E63946',
        fontWeight: '700',
    },
    infoContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    infoItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    infoItemText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    buttonContainer: {
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#E63946',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    secondaryButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    supportContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginTop: 8,
    },
    supportText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
});

export default PaymentSuccessScreen;

