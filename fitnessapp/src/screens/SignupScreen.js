import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    Modal,
    Animated,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const PasswordDots = ({ value, isVisible }) => {
    if (isVisible) {
        return (
            <Text style={{
                fontSize: 18,
                letterSpacing: 2,
                textAlign: 'left',
                color: '#fff',
                textAlignVertical: 'center',
                lineHeight: 20
            }}>
                {value}
            </Text>
        );
    }

    return (
        <Text style={{
            fontSize: 18,
            letterSpacing: 2,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'left',
            textAlignVertical: 'center',
            lineHeight: 20
        }}>
            {value ? value.split('').map(() => '●').join('') : ''}
        </Text>
    );
};

const SignupScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [hoTen, setHoTen] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [isLoading, setIsLoading] = useState(false);

    const phoneInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);

    const showAlert = (message) => {
        setModalMessage(message);
        setModalVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const handleBackgroundPress = () => {
        Keyboard.dismiss();
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignup = async () => {
        Keyboard.dismiss();

        // Validate required fields
        if (!hoTen.trim()) {
            showAlert('Vui lòng nhập họ và tên');
            return;
        }

        if (!phone.trim()) {
            showAlert('Vui lòng nhập số điện thoại');
            return;
        }

        if (!password.trim()) {
            showAlert('Vui lòng nhập mật khẩu');
            return;
        }

        if (!confirmPassword.trim()) {
            showAlert('Vui lòng xác nhận mật khẩu');
            return;
        }

        // Validate phone format
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone.trim())) {
            showAlert('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số');
            return;
        }

        // Validate email if provided
        if (email.trim() && !validateEmail(email.trim())) {
            showAlert('Email không hợp lệ');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showAlert('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            showAlert('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);

        try {
            const signupData = {
                hoTen: hoTen.trim(),
                sdt: phone.trim(),
                matKhau: password,
                vaiTro: 'HoiVien'
            };

            // Add email if provided
            if (email.trim()) {
                signupData.email = email.trim();
            }

            const response = await apiService.register(signupData);

            if (response.success) {
                showAlert('Đăng ký thành công! Vui lòng đăng nhập.');
                
                // Navigate to login after 2 seconds
                setTimeout(() => {
                    closeModal();
                    navigation.navigate('Login');
                }, 2000);
            } else {
                showAlert(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

            if (error.message) {
                if (error.message.includes('Số điện thoại đã tồn tại')) {
                    errorMessage = 'Số điện thoại này đã được đăng ký. Vui lòng sử dụng số khác.';
                } else if (error.message.includes('Email đã tồn tại')) {
                    errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác.';
                } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                    errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
                } else {
                    errorMessage = error.message;
                }
            }

            showAlert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
            <ImageBackground
                source={require('../../assets/images/signup-background.jpg')}
                style={styles.background}
            >
                <TouchableWithoutFeedback onPress={handleBackgroundPress}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.container}>
                        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoTitle}>BILLIONS</Text>
                                <Text style={styles.logoSubtitle}>FITNESS & GYM</Text>
                                <Text style={styles.signupTitle}>ĐĂNG KÝ TÀI KHOẢN</Text>
                            </View>
                        </TouchableWithoutFeedback>

                        <View style={styles.formContainer}>
                            {/* Họ và tên */}
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}
                                placeholder="Họ và tên"
                                placeholderTextColor='#fff'
                                value={hoTen}
                                onChangeText={setHoTen}
                                returnKeyType="next"
                                onBlur={dismissKeyboard}
                                selectionColor="#00BFFF"
                                cursorColor="#00BFFF"
                                onSubmitEditing={() => phoneInputRef.current?.focus()}
                            />

                            {/* Số điện thoại */}
                            <TextInput
                                ref={phoneInputRef}
                                style={[styles.input, { backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}
                                placeholder="Số điện thoại"
                                placeholderTextColor='#fff'
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                returnKeyType="next"
                                onBlur={dismissKeyboard}
                                selectionColor="#00BFFF"
                                cursorColor="#00BFFF"
                                onSubmitEditing={() => emailInputRef.current?.focus()}
                            />

                            {/* Email (optional) */}
                            <TextInput
                                ref={emailInputRef}
                                style={[styles.input, { backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}
                                placeholder="Email (không bắt buộc)"
                                placeholderTextColor='#fff'
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                returnKeyType="next"
                                onBlur={dismissKeyboard}
                                selectionColor="#00BFFF"
                                cursorColor="#00BFFF"
                                autoCapitalize="none"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                            />

                            {/* Mật khẩu */}
                            <View style={styles.passwordContainer}>
                                <View style={[styles.passwordInputWrapper, { backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}>
                                    <View style={{ flex: 1, minHeight: 20, position: 'relative', justifyContent: 'center', alignItems: 'flex-start' }}>
                                        {password ? (
                                            showPassword ? (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                                                    <Text style={{
                                                        color: '#fff',
                                                        fontSize: 18,
                                                        textAlign: 'left',
                                                        textAlignVertical: 'center',
                                                        lineHeight: 20
                                                    }}>
                                                        {password}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                                                    <PasswordDots
                                                        value={password}
                                                        isVisible={false}
                                                    />
                                                </View>
                                            )
                                        ) : (
                                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                                                <Text style={{
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    fontSize: 18,
                                                    textAlign: 'left',
                                                    textAlignVertical: 'center',
                                                    lineHeight: 20
                                                }}>
                                                    Mật khẩu
                                                </Text>
                                            </View>
                                        )}
                                        <TextInput
                                            ref={passwordInputRef}
                                            style={[
                                                styles.hiddenPasswordInput,
                                                {
                                                    color: 'transparent',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    zIndex: 1,
                                                    paddingHorizontal: 20,
                                                    paddingVertical: 16,
                                                }
                                            ]}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={false}
                                            returnKeyType="next"
                                            onBlur={dismissKeyboard}
                                            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            selectionColor="#00BFFF"
                                            cursorColor="#00BFFF"
                                        />
                                    </View>
                                    {password.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.eyeButton}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <MaterialIcons
                                                name={showPassword ? 'visibility-off' : 'visibility'}
                                                size={24}
                                                color="rgba(255, 255, 255, 0.7)"
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Xác nhận mật khẩu */}
                            <View style={styles.passwordContainer}>
                                <View style={[styles.passwordInputWrapper, { backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}>
                                    <View style={{ flex: 1, minHeight: 20, position: 'relative', justifyContent: 'center', alignItems: 'flex-start' }}>
                                        {confirmPassword ? (
                                            showConfirmPassword ? (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                                                    <Text style={{
                                                        color: '#fff',
                                                        fontSize: 18,
                                                        textAlign: 'left',
                                                        textAlignVertical: 'center',
                                                        lineHeight: 20
                                                    }}>
                                                        {confirmPassword}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                                                    <PasswordDots
                                                        value={confirmPassword}
                                                        isVisible={false}
                                                    />
                                                </View>
                                            )
                                        ) : (
                                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                                                <Text style={{
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    fontSize: 18,
                                                    textAlign: 'left',
                                                    textAlignVertical: 'center',
                                                    lineHeight: 20
                                                }}>
                                                    Xác nhận mật khẩu
                                                </Text>
                                            </View>
                                        )}
                                        <TextInput
                                            ref={confirmPasswordInputRef}
                                            style={[
                                                styles.hiddenPasswordInput,
                                                {
                                                    color: 'transparent',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    zIndex: 1,
                                                    paddingHorizontal: 20,
                                                    paddingVertical: 16,
                                                }
                                            ]}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={false}
                                            returnKeyType="done"
                                            onBlur={dismissKeyboard}
                                            onSubmitEditing={handleSignup}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            selectionColor="#00BFFF"
                                            cursorColor="#00BFFF"
                                        />
                                    </View>
                                    {confirmPassword.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.eyeButton}
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <MaterialIcons
                                                name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                                                size={24}
                                                color="rgba(255, 255, 255, 0.7)"
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Nút đăng ký */}
                            <TouchableOpacity
                                style={styles.signupButton}
                                onPress={handleSignup}
                                disabled={isLoading}
                            >
                                <Text style={styles.signupButtonText}>
                                    {isLoading ? 'Đang đăng ký...' : 'ĐĂNG KÝ'}
                                </Text>
                            </TouchableOpacity>

                            {/* Link đến màn hình đăng nhập */}
                            <View style={styles.loginContainer}>
                                <Text style={[styles.loginText, { color: colors.text }]}>
                                    Đã có tài khoản?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        navigation.navigate('Login');
                                    }}
                                >
                                    <Text style={[styles.loginLink, { color: '#00BFFF' }]}>
                                        Đăng nhập
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Modal thông báo */}
                <Modal
                    animationType="none"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View style={styles.modalContainer}>
                            <Text style={styles.modalText}>{modalMessage}</Text>
                            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                                <Text style={styles.modalButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>
            </ImageBackground>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    logoTitle: {
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: 5,
        marginBottom: 10,
        color: '#fff',
    },
    logoSubtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 10,
        color: '#DA2128',
        marginBottom: 20,
    },
    signupTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    formContainer: {
        marginBottom: 30,
    },
    input: {
        width: '100%',
        borderRadius: 15,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 18,
        marginBottom: 20,
        color: '#fff',
    },
    passwordContainer: {
        marginBottom: 20,
    },
    passwordInputWrapper: {
        width: '100%',
        borderRadius: 15,
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    hiddenPasswordInput: {
        fontSize: 18,
        textAlignVertical: 'center',
        lineHeight: 20,
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    signupButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#DA2128',
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        fontSize: 16,
    },
    loginLink: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
        color: '#000',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
        backgroundColor: '#DA2128',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SignupScreen;
