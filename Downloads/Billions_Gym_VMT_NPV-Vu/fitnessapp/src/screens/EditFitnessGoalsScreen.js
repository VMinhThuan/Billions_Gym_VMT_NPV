import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const EditFitnessGoalsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userInfo } = useAuth();
    const themeContext = useTheme();
    const colors = themeContext.colors;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        primaryGoal: '',
        targetWeight: '',
        currentWeight: '',
        weeklyWorkouts: 3,
        preferredWorkoutTime: '',
        fitnessLevel: 'BEGINNER'
    });

    // Validation errors
    const [errors, setErrors] = useState({});

    const fitnessGoals = [
        { value: 'TANG_CAN', label: 'Tăng cân' },
        { value: 'GIAM_CAN', label: 'Giảm cân' },
        { value: 'TANG_CO_BAP', label: 'Tăng cơ bắp' },
        { value: 'GIAM_MO', label: 'Giảm mỡ' },
        { value: 'DUY_TRI', label: 'Duy trì' }
    ];

    const fitnessLevels = [
        { value: 'BEGINNER', label: 'Người mới bắt đầu' },
        { value: 'INTERMEDIATE', label: 'Trung bình' },
        { value: 'ADVANCED', label: 'Nâng cao' }
    ];

    const workoutTimes = [
        { value: 'MORNING', label: 'Sáng sớm (6-8h)' },
        { value: 'AFTERNOON', label: 'Chiều (14-16h)' },
        { value: 'EVENING', label: 'Tối (18-20h)' },
        { value: 'NIGHT', label: 'Đêm (20-22h)' }
    ];

    useEffect(() => {
        if (route.params?.fitnessGoals) {
            setFormData(route.params.fitnessGoals);
        } else {
            loadFitnessGoals();
        }
    }, []);

    const loadFitnessGoals = async () => {
        try {
            setLoading(true);
            // Load from user profile or body stats
            const [profile, bodyStats] = await Promise.allSettled([
                apiService.getMyProfile(),
                apiService.getMyLatestBodyStats()
            ]);

            if (bodyStats.status === 'fulfilled' && bodyStats.value) {
                const stats = bodyStats.value;
                setFormData(prev => ({
                    ...prev,
                    currentWeight: stats.canNang ? stats.canNang.toString() : '',
                    targetWeight: stats.canNangMucTieu ? stats.canNangMucTieu.toString() : ''
                }));
            }
        } catch (error) {
            console.error('Error loading fitness goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.primaryGoal) {
            newErrors.primaryGoal = 'Vui lòng chọn mục tiêu chính';
        }

        if (formData.currentWeight && (isNaN(formData.currentWeight) || parseFloat(formData.currentWeight) <= 0)) {
            newErrors.currentWeight = 'Cân nặng hiện tại không hợp lệ';
        }

        if (formData.targetWeight && (isNaN(formData.targetWeight) || parseFloat(formData.targetWeight) <= 0)) {
            newErrors.targetWeight = 'Cân nặng mục tiêu không hợp lệ';
        }

        if (formData.weeklyWorkouts < 1 || formData.weeklyWorkouts > 7) {
            newErrors.weeklyWorkouts = 'Số buổi tập phải từ 1-7';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            // Update body stats if weight information is provided
            if (formData.currentWeight || formData.targetWeight) {
                const bodyStatsData = {};
                if (formData.currentWeight) {
                    bodyStatsData.canNang = parseFloat(formData.currentWeight);
                }
                if (formData.targetWeight) {
                    bodyStatsData.canNangMucTieu = parseFloat(formData.targetWeight);
                }

                try {
                    await apiService.createBodyStats(bodyStatsData);
                } catch (error) {
                    console.error('Error updating body stats:', error);
                }
            }

            // Here you could save other fitness goals to a separate API endpoint
            // For now, we'll just show success message
            Alert.alert(
                'Thành công',
                'Cập nhật mục tiêu fitness thành công',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật mục tiêu. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

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

    const renderSelector = (label, field, options, error) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
            <View style={styles.selectorContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.selectorButton,
                            {
                                backgroundColor: formData[field] === option.value ? colors.primary : colors.card,
                                borderColor: formData[field] === option.value ? colors.primary : colors.border
                            }
                        ]}
                        onPress={() => handleInputChange(field, option.value)}
                    >
                        <Text style={[
                            styles.selectorText,
                            { color: formData[field] === option.value ? '#fff' : colors.text }
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    const renderInput = (label, field, placeholder, keyboardType = 'default') => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: errors[field] ? '#ff4444' : colors.border
                    }
                ]}
                value={formData[field]}
                onChangeText={(value) => handleInputChange(field, value)}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={keyboardType}
            />
            {errors[field] && (
                <Text style={styles.errorText}>{errors[field]}</Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải thông tin...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Mục tiêu fitness</Text>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Lưu</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.formContainer}>
                        {renderSelector('Mục tiêu chính *', 'primaryGoal', fitnessGoals, errors.primaryGoal)}
                        {renderSelector('Trình độ hiện tại', 'fitnessLevel', fitnessLevels)}
                        {renderInput('Cân nặng hiện tại (kg)', 'currentWeight', 'Nhập cân nặng hiện tại', 'numeric')}
                        {renderInput('Cân nặng mục tiêu (kg)', 'targetWeight', 'Nhập cân nặng mục tiêu', 'numeric')}
                        {renderInput('Số buổi tập/tuần', 'weeklyWorkouts', '3', 'numeric')}
                        {renderSelector('Thời gian tập ưa thích', 'preferredWorkoutTime', workoutTimes)}
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
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 48,
    },
    selectorContainer: {
        gap: 8,
    },
    selectorButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
});

export default EditFitnessGoalsScreen;
