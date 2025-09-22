// screens/VerifyOTPScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

const VerifyOTPScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const { confirmation } = route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const inputs = useRef([]);

    useEffect(() => {
        const otpString = otp.join('');
        if (otpString.length === 6) {
            Keyboard.dismiss();
            handleVerifyOTP(otpString);
        }
    }, [otp]);

    const handleTextChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleVerifyOTP = async (otpString) => {
        if (!otpString || otpString.length !== 6) return;
        setIsLoading(true);
        try {
            await confirmation.confirm(otpString);

            navigation.navigate('ResetPassword');

        } catch (error) {
            Alert.alert('Lỗi', 'Mã OTP không chính xác hoặc đã hết hạn.');
            setOtp(['', '', '', '', '', '']);
            inputs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.primary }]}>Xác thực OTP</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Nhập mã 6 chữ số đã được gửi đến điện thoại của bạn.</Text>
            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={el => (inputs.current[index] = el)}
                        style={[styles.otpInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        keyboardType="number-pad"
                        maxLength={1}
                        onChangeText={text => handleTextChange(text, index)}
                        onKeyPress={e => handleKeyPress(e, index)}
                        value={digit}
                        autoFocus={index === 0}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
    title: { fontSize: 34, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40 },
    otpContainer: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 40 },
    otpInput: { width: 50, height: 60, borderRadius: 10, textAlign: 'center', fontSize: 22, borderWidth: 1 },
});

export default VerifyOTPScreen;