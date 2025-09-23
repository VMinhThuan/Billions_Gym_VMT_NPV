// screens/ResetPasswordScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
const ResetPassword = () => {
    const { colors } = useTheme();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }
        setIsLoading(true);
        try {
            const user = auth().currentUser;
            if (user) {
                await user.updatePassword(newPassword);

                await auth().signOut();

                Alert.alert('Thành công', 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                throw new Error('Không tìm thấy người dùng để cập nhật.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.primary }]}>Tạo Mật Khẩu Mới</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="Mật khẩu mới"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
            />
            <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
                onPress={handleResetPassword}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>{isLoading ? 'Đang xử lý...' : 'Xác nhận'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
    title: { fontSize: 34, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
    input: { paddingHorizontal: 15, paddingVertical: 15, borderRadius: 15, fontSize: 18, marginBottom: 20, borderWidth: 1 },
    button: { padding: 15, borderRadius: 15, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    disabledButton: { backgroundColor: '#999' },
});

export default ResetPassword;