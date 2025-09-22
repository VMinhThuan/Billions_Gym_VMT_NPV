import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

// Component để hiển thị mật khẩu với dấu chấm tròn
const PasswordDots = ({ value, isVisible, colors }) => {
    if (isVisible) {
        return (
            <Text style={{
                fontSize: 16,
                letterSpacing: 2,
                textAlign: 'left',
                color: colors.text,
                textAlignVertical: 'center'
            }}>
                {value}
            </Text>
        );
    }

    return (
        <Text style={{
            fontSize: 18,
            letterSpacing: 2,
            color: colors.isDarkMode ? '#999' : '#666',
            textAlign: 'left',
            textAlignVertical: 'center'
        }}>
            {value.split('').map((_, index) => '●').join('')}
        </Text>
    );
};

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext?.colors || {
        background: '#f5f5f5',
        surface: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        primary: '#DA2128',
        border: '#eee'
    };
    const isDarkMode = themeContext?.isDarkMode || false;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [focusedField, setFocusedField] = useState(null);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword.trim()) {
            newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        }

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        if (formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const result = await apiService.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            console.log('Change password result:', result);

            if (result && result.success) {
                Alert.alert(
                    'Thành công',
                    'Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Navigate to login screen
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Lỗi', result?.message || 'Không thể thay đổi mật khẩu');
            }
        } catch (error) {
            console.error('Change password error:', error);
            console.error('Error message:', error.message);
            console.error('Error type:', typeof error.message);

            // Handle specific error messages from backend
            if (error.message && error.message.includes('Mật khẩu hiện tại không đúng')) {
                Alert.alert('Lỗi', 'Mật khẩu hiện tại không đúng');
            } else if (error.message && error.message.includes('Mật khẩu mới phải có ít nhất 6 ký tự')) {
                Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            } else if (error.message && error.message.includes('Vui lòng nhập đầy đủ thông tin')) {
                Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            } else if (error.message && error.message.includes('Không tìm thấy tài khoản')) {
                Alert.alert('Lỗi', 'Không tìm thấy tài khoản');
            } else {
                // Show the actual error message from backend
                Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi thay đổi mật khẩu');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label, field, placeholder, secureTextEntry = false) => {
        const isPassword = secureTextEntry;
        const passwordKey = field.replace('Password', '');
        const showPassword = isPassword ? showPasswords[passwordKey] : false;

        return (
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
                <View style={styles.inputContainer}>
                    <View
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: errors[field] ? '#ff4444' : colors.border,
                                shadowColor: errors[field] ? '#ff4444' : colors.primary,
                                elevation: errors[field] ? 5 : 1,
                                shadowOpacity: errors[field] ? 0.3 : 0.1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }
                        ]}
                    >
                        <View style={{ flex: 1, minHeight: 20, position: 'relative', justifyContent: 'center' }}>
                            {formData[field] ? (
                                isPassword && !showPassword ? (
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }}>
                                        <PasswordDots
                                            value={formData[field]}
                                            isVisible={false}
                                            colors={{ ...colors, isDarkMode }}
                                        />
                                    </View>
                                ) : (
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }}>
                                        <Text style={{
                                            color: colors.text,
                                            fontSize: 16,
                                            textAlign: 'left',
                                            textAlignVertical: 'center'
                                        }}>
                                            {formData[field]}
                                        </Text>
                                    </View>
                                )
                            ) : (
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }}>
                                    <Text style={{
                                        color: colors.textMuted,
                                        fontSize: 16,
                                        textAlign: 'left',
                                        textAlignVertical: 'center'
                                    }}>
                                        {placeholder}
                                    </Text>
                                </View>
                            )}
                            <TextInput
                                style={[
                                    styles.hiddenInput,
                                    {
                                        color: 'transparent',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 1,
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                    }
                                ]}
                                value={formData[field]}
                                onChangeText={(value) => handleInputChange(field, value)}
                                secureTextEntry={false}
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedField(field)}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                        {isPassword && (
                            <TouchableOpacity
                                style={[styles.eyeIcon]}
                                onPress={() => setShowPasswords(prev => ({
                                    ...prev,
                                    [passwordKey]: !showPassword
                                }))}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={24}
                                    color={colors.textMuted}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {errors[field] && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="warning" size={16} color="#ff4444" />
                        <Text style={styles.errorText}>{errors[field]}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Đổi mật khẩu</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.form}>
                        {renderInput(
                            'Mật khẩu hiện tại',
                            'currentPassword',
                            'Nhập mật khẩu hiện tại',
                            true
                        )}

                        {renderInput(
                            'Mật khẩu mới',
                            'newPassword',
                            'Nhập mật khẩu mới',
                            true
                        )}

                        {renderInput(
                            'Xác nhận mật khẩu mới',
                            'confirmPassword',
                            'Nhập lại mật khẩu mới',
                            true
                        )}

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: loading ? 0.7 : 1
                                }
                            ]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>Thay đổi mật khẩu</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 34,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    form: {
        paddingTop: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        borderWidth: 1,
        borderRadius: 40,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        paddingRight: 50,
        letterSpacing: 2,
        height: 55,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginLeft: 5,
    },
    saveButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    hiddenInput: {
        fontSize: 16,
        textAlignVertical: 'center',
    },
});

export default ChangePasswordScreen;