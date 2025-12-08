import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Modal, Animated, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const PasswordDots = ({ value, isVisible, colors }) => {
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
            {value ? value.split('').map((_, index) => '●').join('') : ''}
        </Text>
    );
};

const LoginScreen = () => {
    const navigation = useNavigation();
    const { colors, isDarkMode } = useTheme();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [fadeAnim] = useState(new Animated.Value(0));
    const passwordInputRef = useRef(null);
    const { login, isLoading } = useAuth();

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

    const handleLogin = async () => {
        Keyboard.dismiss();

        if (!phone.trim()) {
            showAlert('Vui lòng nhập số điện thoại');
            return;
        }

        if (!password.trim()) {
            showAlert('Vui lòng nhập mật khẩu');
            return;
        }

        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone.trim())) {
            showAlert('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số');
            return;
        }

        try {

            const loginPromise = apiService.login(phone.trim(), password);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Login timeout after 30 seconds')), 30000)
            );

            const data = await Promise.race([loginPromise, timeoutPromise]);

            if (data && typeof data === 'object') {
                const token = data.token || data.accessToken;
                const user = data.nguoiDung || data.user || data;

                if (token && user) {
                    if (!user.vaiTro) {
                        user.vaiTro = 'HoiVien';
                    }

                    try {
                        await login(token, user);

                        setTimeout(() => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        }, 300);
                    } catch (authError) {
                        showAlert('Lỗi xử lý thông tin đăng nhập. Vui lòng thử lại.');
                    }
                } else {
                    const errorMsg = data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
                    showAlert(errorMsg);
                }
            } else {
                showAlert('Phản hồi từ server không hợp lệ. Vui lòng thử lại.');
            }
        } catch (error) {

            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

            if (error.message) {
                if (error.message.includes('thất bại') || error.message.includes('mật khẩu')) {
                    errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.';
                } else if (error.message.includes('Authentication failed') || error.message.includes('401')) {
                    errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.';
                } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                    errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Kết nối quá chậm. Vui lòng thử lại.';
                } else {
                    errorMessage = error.message;
                }
            }

            showAlert(errorMessage);
        }
    };


    return (
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
            <ImageBackground
                source={require('../../assets/images/login-background.jpg')}
                style={styles.background}
            >
                <TouchableWithoutFeedback onPress={handleBackgroundPress}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
                <View style={styles.container}>
                    <TouchableWithoutFeedback onPress={handleBackgroundPress}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoTitle}>BILLIONS</Text>
                            <Text style={styles.logoSubtitle}>FITNESS & GYM</Text>
                        </View>
                    </TouchableWithoutFeedback>

                    <View style={styles.formContainer}>
                        <TextInput
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
                            onSubmitEditing={() => {
                                passwordInputRef.current?.focus();
                            }}
                        />

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
                                                    colors={colors}
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
                                        returnKeyType="done"
                                        onBlur={dismissKeyboard}
                                        onSubmitEditing={handleLogin}
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

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginButtonText}>
                                {isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.forgotContainer}
                            onPress={() => {
                                Keyboard.dismiss();
                                navigation.navigate('ForgotPassword');
                            }}
                        >
                            <Text style={[styles.forgotText, { color: colors.text }]}>Quên mật khẩu?</Text>
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={[styles.signupText, { color: colors.text }]}>
                                Chưa có tài khoản?{' '}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Keyboard.dismiss();
                                    navigation.navigate('Signup');
                                }}
                            >
                                <Text style={[styles.signupLink, { color: '#00BFFF' }]}>
                                    Đăng ký ngay
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

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
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 20,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
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
        color: '#DA2128'
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
        marginBottom: 25,
        color: '#fff',
    },
    passwordContainer: {
        marginBottom: 25,
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
    passwordText: {
        fontSize: 18,
        color: '#fff',
        textAlignVertical: 'center',
    },
    placeholderText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlignVertical: 'center',
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
    loginButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 5,
        backgroundColor: '#DA2128',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginTop: 20,
    },
    forgotText: {
        fontSize: 16,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        fontSize: 16,
    },
    signupLink: {
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

export default LoginScreen;