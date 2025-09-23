import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import apiService from '../api/apiService';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { userInfo, userToken, login } = useAuth();
    const { colors } = useTheme();

    console.log('📱 DEBUG - Current userInfo from AuthContext:', JSON.stringify(userInfo, null, 2));
    console.log('📱 DEBUG - Current userToken from AuthContext:', userToken ? 'Exists' : 'Missing');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        hoTen: '',
        email: '',
        sdt: '',
        gioiTinh: 'Nữ',
        ngaySinh: '',
        diaChi: '',
        avatar: ''
    });

    // Validation errors
    const [errors, setErrors] = useState({});

    // Focus states for inputs
    const [focusedField, setFocusedField] = useState(null);
    const [imageUri, setImageUri] = useState(null);

    // Refs for date input auto-focus
    const dayRef = React.useRef(null);
    const monthRef = React.useRef(null);
    const yearRef = React.useRef(null);

    useEffect(() => {
        if (route.params?.userProfile) {
            const profile = route.params.userProfile;
            setFormData({
                hoTen: profile.name || '',
                email: profile.email || '',
                sdt: profile.phone || '',
                gioiTinh: profile.gioiTinh || 'Nam',
                ngaySinh: profile.ngaySinh || '',
                diaChi: profile.diaChi || '',
                avatar: profile.avatar || ''
            });
            if (profile.avatar) {
                setImageUri(profile.avatar);
            }
        } else {
            // Load current user data
            loadUserData();
        }
    }, []);

    // ✅ THÊM: Reload data khi focus vào screen
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('📱 DEBUG - EditProfileScreen focused, reloading data...');
            // Luôn reload để đảm bảo dữ liệu mới nhất
            loadUserData();
        });

        return unsubscribe;
    }, [navigation]);

    // ✅ THÊM: Debug khi formData thay đổi
    useEffect(() => {
        console.log('📱 DEBUG - formData changed:', JSON.stringify(formData, null, 2));
    }, [formData]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const profile = await apiService.getMyProfile();
            console.log('📱 DEBUG - Profile response:', JSON.stringify(profile, null, 2));
            console.log('📱 DEBUG - Profile gioiTinh:', profile.gioiTinh);

            if (profile) {
                // ✅ SỬA: Set userInfo với tất cả các cách có thể có ID
                const userId = profile._id || profile.id || profile.maHoiVien;
                console.log('📱 DEBUG - User ID found:', userId);

                // Convert ngaySinh from ISO format to DD/MM/YYYY format
                let formattedNgaySinh = '';
                if (profile.ngaySinh) {
                    const date = new Date(profile.ngaySinh);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    formattedNgaySinh = `${day}/${month}/${year}`;
                }

                const newFormData = {
                    hoTen: profile.hoTen || '',
                    email: profile.email || '',
                    sdt: profile.sdt || '',
                    gioiTinh: profile.gioiTinh || 'Nam',
                    ngaySinh: formattedNgaySinh,
                    diaChi: profile.diaChi || '',
                    avatar: profile.avatar || ''
                };

                console.log('📱 DEBUG - Set formData with gioiTinh:', profile.gioiTinh);
                console.log('📱 DEBUG - Final formData gioiTinh:', newFormData.gioiTinh);
                console.log('📱 DEBUG - Full newFormData:', JSON.stringify(newFormData, null, 2));

                setFormData(newFormData);
                if (profile.avatar) {
                    setImageUri(profile.avatar);
                }
            }
        } catch (error) {
            console.log('📱 ERROR - Load profile failed:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = async () => {
        const newErrors = {};

        // ✅ SỬA: Bắt buộc các trường quan trọng
        if (!formData.hoTen.trim()) {
            newErrors.hoTen = 'Họ tên không được để trống';
        }

        if (!formData.sdt.trim()) {
            newErrors.sdt = 'Số điện thoại không được để trống';
        } else if (!/^[0-9]{10,11}$/.test(formData.sdt.replace(/\s/g, ''))) {
            newErrors.sdt = 'Số điện thoại không hợp lệ';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.gioiTinh) {
            newErrors.gioiTinh = 'Vui lòng chọn giới tính';
        }

        // ✅ THÊM: Validate ngày sinh
        if (formData.ngaySinh && formData.ngaySinh.includes('/')) {
            const [day, month, year] = formData.ngaySinh.split('/');

            // Check if any part is filled but incomplete
            if (day || month || year) {
                if (!day || !month || !year) {
                    newErrors.ngaySinh = 'Vui lòng nhập đầy đủ ngày, tháng, năm';
                } else {
                    const dayNum = parseInt(day);
                    const monthNum = parseInt(month);
                    const yearNum = parseInt(year);

                    // Basic validation
                    if (dayNum < 1 || dayNum > 31) {
                        newErrors.ngaySinh = 'Ngày không hợp lệ (1-31)';
                    } else if (monthNum < 1 || monthNum > 12) {
                        newErrors.ngaySinh = 'Tháng không hợp lệ (1-12)';
                    } else if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
                        newErrors.ngaySinh = 'Năm không hợp lệ (1900-' + new Date().getFullYear() + ')';
                    } else {
                        // Check if date is valid
                        const date = new Date(yearNum, monthNum - 1, dayNum);
                        if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
                            newErrors.ngaySinh = 'Ngày tháng năm không tồn tại';
                        }
                    }
                }
            }
        }

        // Kiểm tra trùng lặp email và số điện thoại
        try {
            if (formData.email.trim()) {
                const emailExists = await checkEmailExists(formData.email);
                if (emailExists) {
                    newErrors.email = 'Email đã tồn tại';
                }
            }

            if (formData.sdt.trim()) {
                const phoneExists = await checkPhoneExists(formData.sdt);
                if (phoneExists) {
                    newErrors.sdt = 'Số điện thoại đã tồn tại';
                }
            }
        } catch (error) {
            console.error('Error checking duplicates:', error);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkEmailExists = async (email) => {
        try {
            // Gọi API để kiểm tra email tồn tại
            const response = await apiService.apiCall('/user/check-email', 'POST', { email });
            return response.exists;
        } catch (error) {
            return false;
        }
    };

    const checkPhoneExists = async (phone) => {
        try {
            // Gọi API để kiểm tra số điện thoại tồn tại
            const response = await apiService.apiCall('/user/check-phone', 'POST', { sdt: phone });
            return response.exists;
        } catch (error) {
            return false;
        }
    };

    const handleSave = async () => {
        if (!(await validateForm())) {
            return;
        }

        try {
            setSaving(true);

            console.log('📱 DEBUG - Save button pressed');
            console.log('📱 DEBUG - userInfo:', JSON.stringify(userInfo, null, 2));

            // ✅ SỬA: Lấy user ID từ nhiều nguồn có thể
            const userId = userInfo?.id || userInfo?._id || userInfo?.maHoiVien;
            console.log('📱 DEBUG - Final userId:', userId);

            if (!userId) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                return;
            }

            // Convert ngaySinh from DD/MM/YYYY to ISO format
            let isoNgaySinh = null;
            if (formData.ngaySinh && formData.ngaySinh.includes('/')) {
                const [day, month, year] = formData.ngaySinh.split('/');
                if (day && month && year) {
                    // Validate date before converting
                    const dayNum = parseInt(day);
                    const monthNum = parseInt(month);
                    const yearNum = parseInt(year);

                    // Create date in local timezone
                    const date = new Date(yearNum, monthNum - 1, dayNum);

                    // Double check if date is valid
                    if (date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum) {
                        isoNgaySinh = date.toISOString();
                        console.log('📱 DEBUG - Converted date:', {
                            input: formData.ngaySinh,
                            day: dayNum,
                            month: monthNum,
                            year: yearNum,
                            iso: isoNgaySinh
                        });
                    } else {
                        console.log('❌ ERROR - Invalid date conversion:', {
                            input: formData.ngaySinh,
                            day: dayNum,
                            month: monthNum,
                            year: yearNum
                        });
                        Alert.alert('Lỗi', 'Ngày sinh không hợp lệ');
                        return;
                    }
                }
            }

            const updateData = {
                hoTen: formData.hoTen.trim(),
                email: formData.email.trim(),
                sdt: formData.sdt.trim(),
                gioiTinh: formData.gioiTinh,
                ngaySinh: isoNgaySinh,
                diaChi: formData.diaChi.trim(),
                avatar: formData.avatar.trim()
            };

            console.log('📱 DEBUG - Update data:', JSON.stringify(updateData, null, 2));

            // ✅ THÊM: Test với flexible update trước
            console.log('📱 DEBUG - Testing with flexible update first...');
            try {
                const testResult = await apiService.testFlexibleUpdate(userId, updateData);
                console.log('📱 DEBUG - Flexible test API response:', JSON.stringify(testResult, null, 2));

                if (testResult && testResult.success) {
                    console.log('✅ Flexible test successful, now trying full update...');
                }
            } catch (testError) {
                console.log('❌ Flexible test failed:', testError.message);
            }

            console.log('📱 DEBUG - Calling updateProfile API...');
            const result = await apiService.updateProfile(userId, updateData);
            console.log('📱 DEBUG - API response:', JSON.stringify(result, null, 2));

            if (result) {
                console.log('📱 DEBUG - Update successful, updating context...');

                // ✅ SỬA: Kiểm tra token trước khi update context
                if (!userToken) {
                    console.log('❌ ERROR - No token found, cannot update context');
                    Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                    return;
                }

                // Update user info in context
                const updatedUserInfo = {
                    ...userInfo,
                    ...updateData
                };

                console.log('📱 DEBUG - Updated userInfo:', JSON.stringify(updatedUserInfo, null, 2));
                await login(userToken, updatedUserInfo);

                Alert.alert(
                    'Thành công',
                    'Cập nhật thông tin thành công',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                console.log('📱 DEBUG - Update failed, result is falsy');
                Alert.alert('Lỗi', 'Cập nhật thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.log('📱 ERROR - Update failed with error:', error.message);
            console.log('📱 ERROR - Full error:', JSON.stringify(error, null, 2));
            Alert.alert('Lỗi', `Không thể cập nhật thông tin: ${error.message}`);
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

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setFormData(prev => ({
                ...prev,
                avatar: result.assets[0].uri
            }));
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setFormData(prev => ({
                ...prev,
                avatar: result.assets[0].uri
            }));
        }
    };

    const showImagePicker = () => {
        Alert.alert(
            'Chọn ảnh đại diện',
            'Bạn muốn chọn ảnh từ đâu?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Thư viện ảnh', onPress: pickImage },
                { text: 'Chụp ảnh mới', onPress: takePhoto }
            ]
        );
    };

    const renderInput = (label, field, placeholder, keyboardType = 'default', multiline = false) => {
        const isFocused = focusedField === field;

        return (
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: errors[field] ? '#ff4444' : (isFocused ? '#6376ca' : colors.border),
                                shadowColor: errors[field] ? '#ff4444' : (isFocused ? '#6376ca' : colors.primary),
                                elevation: errors[field] ? 8 : (isFocused ? 6 : 1),
                                shadowOpacity: errors[field] ? 0.5 : (isFocused ? 0.4 : 0.1),
                            }
                        ]}
                        value={formData[field]}
                        onChangeText={(value) => handleInputChange(field, value)}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        numberOfLines={multiline ? 3 : 1}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>
                {errors[field] && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="warning" size={24} color="#ff4444" />
                        <Text style={styles.errorText}>{errors[field]}</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderDateInput = () => {
        const [day, month, year] = formData.ngaySinh ? formData.ngaySinh.split('/') : ['', '', ''];
        const isFocused = focusedField === 'ngaySinh';

        const validateDate = (day, month, year) => {
            if (!day || !month || !year) return true; // Allow partial dates

            const dayNum = parseInt(day);
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);

            // Basic validation
            if (dayNum < 1 || dayNum > 31) return false;
            if (monthNum < 1 || monthNum > 12) return false;
            if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;

            // Check if date is valid
            const date = new Date(yearNum, monthNum - 1, dayNum);
            return date.getDate() === dayNum &&
                date.getMonth() === monthNum - 1 &&
                date.getFullYear() === yearNum;
        };

        const handleDateChange = (part, value) => {
            let newDay = day;
            let newMonth = month;
            let newYear = year;

            if (part === 'day') {
                newDay = value.replace(/\D/g, '').slice(0, 2);
                // Auto focus to month when day is complete
                if (newDay.length === 2) {
                    setTimeout(() => monthRef.current?.focus(), 100);
                }
            } else if (part === 'month') {
                newMonth = value.replace(/\D/g, '').slice(0, 2);
                // Auto focus to year when month is complete
                if (newMonth.length === 2) {
                    setTimeout(() => yearRef.current?.focus(), 100);
                }
            } else if (part === 'year') {
                newYear = value.replace(/\D/g, '').slice(0, 4);
            }

            // Validate date - check if any part is filled but incomplete
            if (newDay || newMonth || newYear) {
                // If any part is filled, all parts must be filled
                if (!newDay || !newMonth || !newYear) {
                    setErrors(prev => ({
                        ...prev,
                        ngaySinh: 'Vui lòng nhập đầy đủ ngày, tháng, năm'
                    }));
                } else if (!validateDate(newDay, newMonth, newYear)) {
                    // Show error for invalid date
                    setErrors(prev => ({
                        ...prev,
                        ngaySinh: 'Ngày tháng năm không hợp lệ'
                    }));
                } else {
                    // Clear error if date is valid
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.ngaySinh;
                        return newErrors;
                    });
                }
            } else {
                // Clear error if no date is entered
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.ngaySinh;
                    return newErrors;
                });
            }

            const newDate = `${newDay}/${newMonth}/${newYear}`;
            handleInputChange('ngaySinh', newDate);
        };

        return (
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Ngày sinh</Text>
                <View style={styles.dateInputContainer}>
                    <TextInput
                        ref={dayRef}
                        style={[
                            styles.dateInput,
                            {
                                color: colors.text,
                                borderColor: errors.ngaySinh ? '#ff4444' : (isFocused ? '#6376ca' : colors.border),
                                backgroundColor: colors.card,
                                shadowColor: errors.ngaySinh ? '#ff4444' : (isFocused ? '#6376ca' : colors.primary),
                                elevation: errors.ngaySinh ? 8 : (isFocused ? 6 : 1),
                                shadowOpacity: errors.ngaySinh ? 0.5 : (isFocused ? 0.4 : 0.1),
                            }
                        ]}
                        placeholder="DD"
                        placeholderTextColor={colors.textMuted}
                        value={day}
                        onChangeText={(value) => handleDateChange('day', value)}
                        keyboardType="numeric"
                        maxLength={2}
                        textAlignVertical="center"
                        includeFontPadding={false}
                        paddingHorizontal={12}
                        onFocus={() => setFocusedField('ngaySinh')}
                        onBlur={() => setFocusedField(null)}
                    />
                    <Text style={[styles.dateSeparator, { color: colors.text }]}>/</Text>
                    <TextInput
                        ref={monthRef}
                        style={[
                            styles.dateInput,
                            {
                                color: colors.text,
                                borderColor: errors.ngaySinh ? '#ff4444' : (isFocused ? '#6376ca' : colors.border),
                                backgroundColor: colors.card,
                                shadowColor: errors.ngaySinh ? '#ff4444' : (isFocused ? '#6376ca' : colors.primary),
                                elevation: errors.ngaySinh ? 8 : (isFocused ? 10 : 1),
                                shadowOpacity: errors.ngaySinh ? 0.5 : (isFocused ? 0.6 : 0.1),
                            }
                        ]}
                        placeholder="MM"
                        placeholderTextColor={colors.textMuted}
                        value={month}
                        onChangeText={(value) => handleDateChange('month', value)}
                        keyboardType="numeric"
                        maxLength={2}
                        textAlignVertical="center"
                        includeFontPadding={false}
                        paddingHorizontal={12}
                        onFocus={() => setFocusedField('ngaySinh')}
                        onBlur={() => setFocusedField(null)}
                    />
                    <Text style={[styles.dateSeparator, { color: colors.text }]}>/</Text>
                    <TextInput
                        ref={yearRef}
                        style={[
                            styles.dateInput,
                            {
                                color: colors.text,
                                borderColor: errors.ngaySinh ? '#ff4444' : (isFocused ? '#6376ca' : colors.border),
                                backgroundColor: colors.card,
                                shadowColor: errors.ngaySinh ? '#ff4444' : (isFocused ? '#6376ca' : colors.primary),
                                elevation: errors.ngaySinh ? 8 : (isFocused ? 6 : 1),
                                shadowOpacity: errors.ngaySinh ? 0.5 : (isFocused ? 0.4 : 0.1),
                            }
                        ]}
                        placeholder="YYYY"
                        placeholderTextColor={colors.textMuted}
                        value={year}
                        onChangeText={(value) => handleDateChange('year', value)}
                        keyboardType="numeric"
                        maxLength={4}
                        textAlignVertical="center"
                        includeFontPadding={false}
                        paddingHorizontal={12}
                        onFocus={() => setFocusedField('ngaySinh')}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>
                {errors.ngaySinh && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="warning" size={16} color="#ff4444" />
                        <Text style={styles.errorText}>{errors.ngaySinh}</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderGenderSelector = () => {
        console.log('📱 DEBUG - renderGenderSelector - formData.gioiTinh:', formData.gioiTinh);
        console.log('📱 DEBUG - renderGenderSelector - formData:', JSON.stringify(formData, null, 2));

        const genderOptions = [
            {
                value: 'Nam',
                label: 'Nam',
                icon: 'male',
                iconColor: '#4A90E2',
                selectedBg: '#4A90E2',
                unselectedBg: colors.card,
                selectedText: '#fff',
                unselectedText: '#4A90E2'
            },
            {
                value: 'Nữ',
                label: 'Nữ',
                icon: 'female',
                iconColor: '#E91E63',
                selectedBg: '#E91E63',
                unselectedBg: colors.card,
                selectedText: '#fff',
                unselectedText: '#E91E63'
            },
            {
                value: 'Khác',
                label: 'Khác',
                icon: 'transgender',
                iconColor: '#9C27B0',
                selectedBg: '#9C27B0',
                unselectedBg: colors.card,
                selectedText: '#fff',
                unselectedText: '#9C27B0'
            }
        ];

        return (
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Giới tính</Text>
                <View style={styles.genderContainer}>
                    {genderOptions.map((option, index) => {
                        const isSelected = formData.gioiTinh === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.genderButton,
                                    {
                                        backgroundColor: isSelected ? option.selectedBg : option.unselectedBg,
                                        borderColor: isSelected ? option.selectedBg : option.iconColor,
                                        transform: [{ scale: isSelected ? 1.02 : 1 }],
                                        shadowColor: isSelected ? option.selectedBg : 'transparent',
                                        elevation: isSelected ? 8 : 2,
                                    }
                                ]}
                                onPress={() => handleInputChange('gioiTinh', option.value)}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.genderIconContainer,
                                    {
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : option.iconColor + '20',
                                        borderColor: isSelected ? 'rgba(255,255,255,0.3)' : option.iconColor + '40'
                                    }
                                ]}>
                                    <MaterialIcons
                                        name={option.icon}
                                        size={16}
                                        color={isSelected ? '#fff' : option.iconColor}
                                    />
                                </View>
                                <Text style={[
                                    styles.genderText,
                                    {
                                        color: isSelected ? option.selectedText : option.unselectedText,
                                        fontWeight: isSelected ? 'bold' : '600'
                                    }
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

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
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Chỉnh sửa thông tin</Text>
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
                        {/* Avatar Section */}
                        <View style={styles.avatarSection}>
                            <View style={[styles.avatarContainer, { backgroundColor: colors.card }]}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <MaterialIcons name="person" size={40} color="#fff" />
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}
                                    onPress={showImagePicker}
                                >
                                    <MaterialIcons name="border-color" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            {/* <Text style={[styles.avatarLabel, { color: colors.text }]}>Ảnh đại diện</Text> */}
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formFields}>
                            {renderInput('Họ và tên', 'hoTen', 'Nhập họ và tên')}
                            {renderInput('Email', 'email', 'Nhập email', 'email-address')}
                            {renderInput('Số điện thoại', 'sdt', 'Nhập số điện thoại', 'phone-pad')}
                            {renderGenderSelector()}
                            {renderDateInput()}
                            {renderInput('Địa chỉ', 'diaChi', 'Nhập địa chỉ', 'default', true)}
                        </View>
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        minWidth: 70,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
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
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    avatarLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    formFields: {
        gap: 20,
    },
    inputGroup: {
        marginBottom: 0,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 16,
        minHeight: 52,
        elevation: 1,
        shadowColor: '#ccc',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: 8,
        gap: 12,
    },
    genderButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 1.5,
        position: 'relative',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        minHeight: 65,
        justifyContent: 'center',
    },
    genderIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 1,
    },
    genderText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        marginLeft: 5,
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
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 0,
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        marginHorizontal: 4,
    },
    dateSeparator: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 8,
        color: '#333',
    },
});

export default EditProfileScreen;
