// screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const ForgotPassword = () => {
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('error'); // 'success' | 'error'
    const [fadeAnim] = useState(new Animated.Value(0));

    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    // paddingTop động: safe-area + 6% chiều cao, tối thiểu 40
    const dynamicPaddingTop = insets.top + Math.max(20, height * 0.03);

    const showModal = (message, type = 'error') => {
        setModalMessage(message);
        setModalType(type);
        setModalVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };

    const handleSendOTP = async () => {
        if (!phone || phone.length < 9) {
            showModal('Vui lòng nhập số điện thoại hợp lệ.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            // Gọi API forgot password từ backend
            const response = await apiService.forgotPassword(phone);

            if (response.success) {
                showModal('Mã xác thực đã được gửi đến số điện thoại của bạn.', 'success');
                // Delay để user đọc được thông báo success trước khi navigate
                setTimeout(() => {
                    closeModal();
                    navigation.navigate('VerifyOTP', { phone });
                }, 1500);
            } else {
                showModal(response.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            let errorMessage = 'Không thể gửi mã OTP. Vui lòng kiểm tra lại số điện thoại hoặc thử lại sau.';

            // Xử lý các loại lỗi khác nhau
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errorCode === 'INVALID_PHONE_FORMAT') {
                errorMessage = 'Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại Việt Nam hợp lệ.';
            } else if (error.response?.data?.errorCode === 'SMS_SEND_FAILED') {
                errorMessage = 'Không thể gửi tin nhắn SMS. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
            } else if (error.response?.data?.errorCode === 'PHONE_NOT_REGISTERED') {
                errorMessage = 'Số điện thoại này chưa được đăng ký trong hệ thống.';
            } else if (error.message?.includes('network')) {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
            }

            showModal(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingTop: dynamicPaddingTop }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Nút back đơn giản */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: colors.primary }]}>Quên Mật Khẩu</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Bạn sẽ nhận được mã xác nhận qua số điện thoại đã đăng ký.
                    </Text>

                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="Số điện thoại"
                        placeholderTextColor={colors.textMuted}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
                        onPress={handleSendOTP}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal thông báo */}
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, { backgroundColor: colors.surface, opacity: fadeAnim }]}>
                        <Text style={[
                            styles.modalText,
                            { color: colors.text },
                            modalType === 'success' ? styles.successText : styles.errorText
                        ]}>
                            {modalMessage}
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: modalType === 'success' ? colors.success : colors.error }
                            ]}
                            onPress={closeModal}
                        >
                            <Text style={styles.modalButtonText}>
                                {modalType === 'success' ? 'Tiếp tục' : 'Đóng'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 10,
        marginBottom: 10,
        marginTop: -10,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 10,
        fontSize: 18,
        marginBottom: 20,
        borderWidth: 1,
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#999',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
        lineHeight: 24,
    },
    successText: {
        // Green color for success
    },
    errorText: {
        // Red color for error
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    successButton: {
        // Success button color
    },
    errorButton: {
        // Error button color
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForgotPassword;
