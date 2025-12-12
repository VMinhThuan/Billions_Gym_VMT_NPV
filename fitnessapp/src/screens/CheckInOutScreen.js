import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { GLView } from 'expo-gl';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import jsQR from 'jsqr';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const { width, height } = Dimensions.get('window');

const CheckInOutScreen = () => {
    const navigation = useNavigation();
    const { userInfo } = useAuth();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [todaySessions, setTodaySessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [hasFaceEncoding, setHasFaceEncoding] = useState(null);
    const [checkInMode, setCheckInMode] = useState('qr'); // 'face' or 'qr'
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [qrCodeLoading, setQrCodeLoading] = useState(false);
    const [showQRCodeDisplay, setShowQRCodeDisplay] = useState(false);
    const [checkInSuccessData, setCheckInSuccessData] = useState(null);
    const [checkOutSuccessData, setCheckOutSuccessData] = useState(null);
    const isProcessingRef = useRef(false);
    const [refreshing, setRefreshing] = useState(false);
    const qrCodeRef = useRef(null);
    const [savingQR, setSavingQR] = useState(false);

    useFocusEffect(
        useCallback(() => {
            checkFaceEncodingStatus();
            loadTodaySessions();
            return () => {
                setShowQRScanner(false);
                setScanned(false);
            };
        }, [])
    );

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const checkFaceEncodingStatus = async () => {
        try {
            const result = await apiService.checkFaceEncoding();
            if (result && result.success !== false) {
                setHasFaceEncoding(result.hasFaceEncoding);
            } else {
                setHasFaceEncoding(false);
            }
        } catch (err) {
            console.error('Error checking face encoding:', err);
            setHasFaceEncoding(false);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTodaySessions = async () => {
        try {
            const result = await apiService.getTodaySessions();
            if (result && result.success) {
                setTodaySessions(result.data || []);
            }
        } catch (err) {
            console.error('Error loading today sessions:', err);
            setError('Không thể tải danh sách buổi tập');
        }
    };

    const loadHistory = async () => {
        try {
            const result = await apiService.getCheckInHistory(20);
            if (result && result.success) {
                setHistory(result.data || []);
            }
        } catch (err) {
            console.error('Error loading history:', err);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTodaySessions();
        if (showHistory) {
            await loadHistory();
        }
        setRefreshing(false);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString;
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()];
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${dayName}, ${day}/${month}/${year}`;
    };

    const getStatusText = (status) => {
        const statusMap = {
            'DUNG_GIO': 'Đúng giờ',
            'SOM': 'Sớm',
            'MUON': 'Muộn',
            'CHUA_CHECKOUT': 'Chưa check-out'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'DUNG_GIO': '#22c55e',
            'SOM': '#f59e0b',
            'MUON': '#ef4444',
            'CHUA_CHECKOUT': '#6b7280'
        };
        return colorMap[status] || '#6b7280';
    };

    const loadQRCode = async () => {
        try {
            setQrCodeLoading(true);
            const result = await apiService.getQRCode();
            if (result && result.success) {
                setQrCode(result.data.qrCode);
            } else {
                setError('Không thể tải mã QR. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Error loading QR code:', err);
            setError('Lỗi khi tải mã QR: ' + (err.message || 'Unknown error'));
        } finally {
            setQrCodeLoading(false);
        }
    };

    const handleQRScanSuccess = useCallback(async (decodedText) => {
        if (isProcessingRef.current) {
            console.log('Already processing, ignoring duplicate scan');
            return;
        }

        if (!selectedSession) {
            setError('Vui lòng chọn buổi tập trước khi quét mã QR');
            setScanned(false);
            return;
        }

        if (!decodedText || typeof decodedText !== 'string' || decodedText.length < 10) {
            setError('Mã QR không hợp lệ');
            setScanned(false);
            return;
        }

        if (selectedSession.hasCheckedIn &&
            selectedSession.checkInRecord &&
            selectedSession.checkInRecord.checkOutTime) {
            setError('Buổi tập này đã được hoàn thành. Không thể check-in/check-out lại.');
            setScanned(false);
            return;
        }

        console.log('QR code scanned, processing...', decodedText.substring(0, 20) + '...');

        isProcessingRef.current = true;
        setError(null);
        setCheckInStatus('processing');
        setScanned(true);

        try {
            const isCheckOut = selectedSession.hasCheckedIn &&
                selectedSession.checkInRecord &&
                !selectedSession.checkInRecord.checkOutTime;

            let result;
            if (isCheckOut) {
                result = await apiService.checkOutWithQR(selectedSession._id, decodedText);
            } else {
                result = await apiService.checkInWithQR(selectedSession._id, decodedText);
            }

            if (result && result.success) {
                setCheckInStatus('success');
                setError(null);
                setScanned(false);
                setShowQRScanner(false);

                if (isCheckOut) {
                    setCheckOutSuccessData(result.data || null);
                    setCheckInSuccessData(null);
                } else {
                    setCheckInSuccessData(result.data || null);
                    setCheckOutSuccessData(null);
                }

                await loadTodaySessions();

                setTimeout(() => {
                    setCheckInStatus(null);
                    setCheckInSuccessData(null);
                    setCheckOutSuccessData(null);
                }, 5000);
            } else {
                const errorMessage = result?.message || 'Check-in/Check-out thất bại';
                setError(errorMessage);
                setCheckInStatus(null);
                setScanned(false);
            }
        } catch (err) {
            console.error('Exception in handleQRScanSuccess:', err);
            let errorMessage = 'Lỗi khi check-in/check-out bằng QR code';
            if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            setCheckInStatus(null);
            setScanned(false);
        } finally {
            isProcessingRef.current = false;
        }
    }, [selectedSession]);

    const handleBarCodeScanned = ({ data }) => {
        if (scanned) return;
        handleQRScanSuccess(data);
    };

    const handleShowQRCode = async () => {
        setShowQRCodeDisplay(true);
        if (!qrCode || qrCodeLoading) {
            await loadQRCode();
        }
    };

    // Helper function to decode QR code from image
    const decodeQRFromImage = async (imageUri, base64Data, width, height) => {
        // For web platform - use jsQR with canvas
        if (typeof document !== 'undefined' && typeof Image !== 'undefined') {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const imageData = ctx.getImageData(0, 0, width, height);
                        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
                        resolve(qrCode);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = reject;
                img.src = `data:image/jpeg;base64,${base64Data}`;
            });
        } else {
            // For React Native - use react-native-qr-decode-image-camera
            try {
                const QRDecode = require('react-native-qr-decode-image-camera');
                const decoded = await QRDecode.decodeImage(imageUri);
                if (decoded && decoded.data) {
                    return { data: decoded.data };
                }
                return null;
            } catch (err) {
                console.error('Error decoding QR with react-native-qr-decode-image-camera:', err);
                return null;
            }
        }
    };

    const handlePickImage = async () => {
        if (!selectedSession) {
            setError('Vui lòng chọn buổi tập trước khi chọn ảnh');
            return;
        }

        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
                return;
            }

            // Pick image with base64
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                base64: true,
                quality: 1.0,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                let imageUri = asset.uri;

                // Resize image to ~800px width for better QR detection
                let manipulatedImage;
                try {
                    manipulatedImage = await ImageManipulator.manipulateAsync(
                        imageUri,
                        [{ resize: { width: 800 } }],
                        { base64: true, compress: 1.0 }
                    );
                } catch (manipulateError) {
                    console.warn('Error manipulating image:', manipulateError);
                    // If manipulation fails, try to get base64 from original
                    const base64 = await FileSystem.readAsStringAsync(imageUri, {
                        encoding: 'base64',
                    });
                    manipulatedImage = {
                        base64,
                        width: asset.width || 800,
                        height: asset.height || 800
                    };
                }

                // Decode QR code from image
                try {
                    const base64Data = manipulatedImage.base64;
                    const width = manipulatedImage.width;
                    const height = manipulatedImage.height;

                    // Decode QR code using appropriate method for platform
                    const qrCode = await decodeQRFromImage(imageUri, base64Data, width, height);

                    if (qrCode && qrCode.data) {
                        console.log('[handlePickImage] ✅ Đã quét được QR code từ ảnh');
                        // Use the same flow as camera scan
                        await handleQRScanSuccess(qrCode.data);
                    } else {
                        // No QR code found
                        setError('Không tìm thấy QR trong ảnh hoặc ảnh bị mờ/nén. Vui lòng thử lại với ảnh rõ hơn.');
                        setCheckInStatus(null);
                    }
                } catch (decodeError) {
                    console.error('Error decoding QR from image:', decodeError);
                    setError('Không tìm thấy QR trong ảnh hoặc ảnh bị mờ/nén. Vui lòng thử lại với ảnh rõ hơn.');
                    setCheckInStatus(null);
                }
            }
        } catch (err) {
            console.error('Error picking image:', err);
            setError('Lỗi khi chọn ảnh. Vui lòng thử lại.');
            setCheckInStatus(null);
        }
    };


    const handleSaveQRCode = async () => {
        if (!qrCode || !qrCodeRef.current) {
            Alert.alert('Lỗi', 'Không có mã QR để lưu');
            return;
        }

        try {
            setSavingQR(true);

            // Request media library permission
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để lưu mã QR');
                return;
            }

            // Capture QR code as image
            const uri = await captureRef(qrCodeRef.current, {
                format: 'png',
                quality: 1.0,
            });

            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('Billions Gym', asset, false);

            Alert.alert('Thành công', 'Đã lưu mã QR vào thư viện ảnh');
        } catch (error) {
            console.error('Error saving QR code:', error);
            Alert.alert('Lỗi', 'Không thể lưu mã QR. Vui lòng thử lại.');
        } finally {
            setSavingQR(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Check-in / Check-out</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Check-in / Check-out</Text>
                <TouchableOpacity onPress={handleShowQRCode} style={styles.qrCodeButton}>
                    <MaterialIcons name="qr-code" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#da2128"]} tintColor="#da2128" />
                }
            >
                <View style={styles.content}>
                    <View style={styles.dateDisplay}>
                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                            📅 Hôm nay: {formatDate(new Date())}
                        </Text>
                        <Text style={[styles.greetingText, { color: colors.text }]}>
                            Chào mừng, {userInfo?.hoTen || 'Hội viên'}!
                        </Text>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {checkInStatus === 'success' && (
                        <View style={styles.successContainer}>
                            <MaterialIcons name="check-circle" size={48} color="#22c55e" />
                            <Text style={styles.successText}>Thành công!</Text>
                            {checkInSuccessData && checkInSuccessData.checkInRecord && (
                                <Text style={styles.successDetail}>
                                    Check-in: {new Date(checkInSuccessData.checkInRecord.checkInTime).toLocaleString('vi-VN')}
                                </Text>
                            )}
                            {checkOutSuccessData && checkOutSuccessData.checkInRecord && (
                                <Text style={styles.successDetail}>
                                    Check-out: {new Date(checkOutSuccessData.checkInRecord.checkOutTime).toLocaleString('vi-VN')}
                                </Text>
                            )}
                        </View>
                    )}

                    <View style={styles.sessionsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Buổi tập hôm nay</Text>
                        {todaySessions.length === 0 ? (
                            <View style={styles.noSessionsContainer}>
                                <Text style={[styles.noSessionsText, { color: colors.textSecondary }]}>
                                    Không có buổi tập nào hôm nay
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.sessionsList}>
                                {todaySessions.map((session) => {
                                    const hasActiveCheckIn = todaySessions.some(s =>
                                        s._id !== session._id &&
                                        s.hasCheckedIn &&
                                        s.checkInRecord &&
                                        !s.checkInRecord.checkOutTime
                                    );

                                    const canCheckIn = session.attendanceStatus === 'DA_DANG_KY' &&
                                        !session.hasCheckedIn &&
                                        !hasActiveCheckIn;

                                    const canCheckOut = session.hasCheckedIn &&
                                        session.checkInRecord &&
                                        !session.checkInRecord.checkOutTime;

                                    const isSelected = selectedSession?._id === session._id;

                                    return (
                                        <TouchableOpacity
                                            key={session._id}
                                            style={[
                                                styles.sessionCard,
                                                isSelected && { borderColor: colors.primary, borderWidth: 2 },
                                                (canCheckIn || canCheckOut) && styles.sessionCardClickable
                                            ]}
                                            onPress={() => {
                                                setSelectedSession(session);
                                                setError(null);
                                                setCheckInStatus(null);
                                                setCheckInSuccessData(null);
                                                setCheckOutSuccessData(null);
                                                if (canCheckIn || canCheckOut) {
                                                    setShowQRScanner(true);
                                                    setScanned(false);
                                                }
                                            }}
                                        >
                                            <View style={styles.sessionCardHeader}>
                                                <View style={styles.sessionInfo}>
                                                    <Text style={[styles.sessionName, { color: colors.text }]}>
                                                        {session.tenBuoiTap}
                                                    </Text>
                                                    <Text style={[styles.sessionTime, { color: colors.textSecondary }]}>
                                                        {formatTime(session.gioBatDau)} - {formatTime(session.gioKetThuc)}
                                                    </Text>
                                                    {session.chiNhanh && (
                                                        <Text style={[styles.sessionBranch, { color: colors.textSecondary }]}>
                                                            {session.chiNhanh.tenChiNhanh}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={styles.sessionStatus}>
                                                    {session.hasCheckedIn ? (
                                                        session.checkInRecord && session.checkInRecord.checkOutTime ? (
                                                            <View style={[styles.statusBadge, { backgroundColor: '#22c55e' }]}>
                                                                <Text style={styles.statusBadgeText}>✅ Đã hoàn thành</Text>
                                                            </View>
                                                        ) : (
                                                            <View style={[styles.statusBadge, { backgroundColor: '#3b82f6' }]}>
                                                                <Text style={styles.statusBadgeText}>🟢 Đang tập</Text>
                                                            </View>
                                                        )
                                                    ) : canCheckIn ? (
                                                        <View style={[styles.statusBadge, { backgroundColor: '#6b7280' }]}>
                                                            <Text style={styles.statusBadgeText}>⏳ Chưa check-in</Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </View>

                                            {session.hasCheckedIn && session.checkInRecord && (
                                                <View style={styles.sessionDetails}>
                                                    {session.checkInRecord.checkInTime && (
                                                        <View style={styles.sessionDetailRow}>
                                                            <Text style={[styles.sessionDetailLabel, { color: colors.textSecondary }]}>
                                                                Check-in:
                                                            </Text>
                                                            <Text style={[styles.sessionDetailValue, { color: colors.text }]}>
                                                                {new Date(session.checkInRecord.checkInTime).toLocaleTimeString('vi-VN')}
                                                                {session.checkInRecord.checkInStatus && (
                                                                    <Text style={[styles.statusText, { color: getStatusColor(session.checkInRecord.checkInStatus) }]}>
                                                                        {' '}({getStatusText(session.checkInRecord.checkInStatus)})
                                                                    </Text>
                                                                )}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {session.checkInRecord.checkOutTime && (
                                                        <View style={styles.sessionDetailRow}>
                                                            <Text style={[styles.sessionDetailLabel, { color: colors.textSecondary }]}>
                                                                Check-out:
                                                            </Text>
                                                            <Text style={[styles.sessionDetailValue, { color: colors.text }]}>
                                                                {new Date(session.checkInRecord.checkOutTime).toLocaleTimeString('vi-VN')}
                                                                {session.checkInRecord.checkOutStatus && (
                                                                    <Text style={[styles.statusText, { color: getStatusColor(session.checkInRecord.checkOutStatus) }]}>
                                                                        {' '}({getStatusText(session.checkInRecord.checkOutStatus)})
                                                                    </Text>
                                                                )}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}

                                            {(canCheckIn || canCheckOut) && (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.actionButton,
                                                        canCheckOut ? styles.checkOutButton : styles.checkInButton,
                                                        { backgroundColor: canCheckOut ? '#f59e0b' : colors.primary }
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedSession(session);
                                                        setError(null);
                                                        setCheckInStatus(null);
                                                        setShowQRScanner(true);
                                                        setScanned(false);
                                                    }}
                                                >
                                                    <Text style={styles.actionButtonText}>
                                                        {canCheckOut ? '🚪 Check-out ngay' : '✅ Check-in ngay'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <View style={styles.historySection}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Lịch sử check-in</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowHistory(!showHistory);
                                    if (!showHistory) {
                                        loadHistory();
                                    }
                                }}
                                style={styles.toggleHistoryButton}
                            >
                                <Text style={[styles.toggleHistoryText, { color: colors.primary }]}>
                                    {showHistory ? 'Ẩn' : 'Xem'} lịch sử
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {showHistory && (
                            <View style={styles.historyList}>
                                {history.length === 0 ? (
                                    <Text style={[styles.noHistoryText, { color: colors.textSecondary }]}>
                                        Chưa có lịch sử check-in
                                    </Text>
                                ) : (
                                    history.map((record) => (
                                        <View key={record._id} style={styles.historyItem}>
                                            <View style={styles.historyInfo}>
                                                <Text style={[styles.historySessionName, { color: colors.text }]}>
                                                    {record.buoiTap?.tenBuoiTap || 'Buổi tập'}
                                                </Text>
                                                <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                                                    Check-in: {new Date(record.checkInTime).toLocaleString('vi-VN')}
                                                </Text>
                                                {record.checkOutTime && (
                                                    <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                                                        Check-out: {new Date(record.checkOutTime).toLocaleString('vi-VN')}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.historyStatus}>
                                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.checkInStatus) }]}>
                                                    <Text style={styles.statusBadgeText}>
                                                        {getStatusText(record.checkInStatus)}
                                                    </Text>
                                                </View>
                                                {record.checkOutStatus && (
                                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.checkOutStatus) }]}>
                                                        <Text style={styles.statusBadgeText}>
                                                            {getStatusText(record.checkOutStatus)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* QR Scanner Modal */}
            <Modal
                visible={showQRScanner}
                animationType="slide"
                onRequestClose={() => {
                    setShowQRScanner(false);
                    setScanned(false);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 20) }]}>
                        <Text style={styles.modalTitle}>Check-in / Check-out</Text>
                        <View style={styles.modalHeaderButtons}>
                            <TouchableOpacity
                                onPress={handlePickImage}
                                style={styles.pickImageButton}
                            >
                                <MaterialIcons name="image" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowQRScanner(false);
                                    setScanned(false);
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {hasPermission === null ? (
                        <View style={styles.cameraPlaceholder}>
                            <Text style={styles.cameraPlaceholderText}>Đang yêu cầu quyền camera...</Text>
                        </View>
                    ) : hasPermission === false ? (
                        <View style={styles.cameraPlaceholder}>
                            <Text style={styles.cameraPlaceholderText}>Không có quyền truy cập camera</Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    const { status } = await Camera.requestCameraPermissionsAsync();
                                    setHasPermission(status === 'granted');
                                }}
                                style={styles.permissionButton}
                            >
                                <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.cameraContainer}>
                            <CameraView
                                style={StyleSheet.absoluteFillObject}
                                facing="back"
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr'],
                                }}
                            />
                            <View style={styles.scannerOverlay}>
                                <View style={styles.scannerFrame} />
                                <Text style={styles.scannerHint}>
                                    Đưa mã QR vào khung để quét
                                </Text>
                            </View>
                            <View style={styles.cameraActions}>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    style={styles.pickImageButtonBottom}
                                >
                                    <MaterialIcons name="image" size={24} color="#fff" />
                                    <Text style={styles.pickImageButtonText}>Chọn ảnh</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    {checkInStatus === 'processing' && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.processingText}>Đang xử lý...</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* QR Code Display Modal */}
            <Modal
                visible={showQRCodeDisplay}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowQRCodeDisplay(false)}
            >
                <View style={styles.qrDisplayModal}>
                    <View style={styles.qrDisplayContent}>
                        <View style={styles.qrDisplayHeader}>
                            <Text style={styles.qrDisplayTitle}>Mã QR của tôi</Text>
                            <TouchableOpacity
                                onPress={() => setShowQRCodeDisplay(false)}
                                style={styles.qrDisplayCloseButton}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        {qrCodeLoading ? (
                            <View style={styles.qrDisplayLoading}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.qrDisplayLoadingText, { color: colors.textSecondary }]}>
                                    Đang tải mã QR...
                                </Text>
                            </View>
                        ) : qrCode ? (
                            <View style={styles.qrDisplayBody}>
                                {userInfo?.hoTen && (
                                    <Text style={[styles.qrDisplayName, { color: colors.text }]}>
                                        {userInfo.hoTen}
                                    </Text>
                                )}
                                <View
                                    ref={qrCodeRef}
                                    style={styles.qrCodeContainer}
                                    collapsable={false}
                                >
                                    <QRCode
                                        value={qrCode}
                                        size={250}
                                        color="#000000"
                                        backgroundColor="#FFFFFF"
                                        logoSize={60}
                                        logoMargin={2}
                                        logoBackgroundColor="#FFFFFF"
                                        logoBorderRadius={30}
                                    />
                                </View>
                                <Text style={[styles.qrDisplayHint, { color: colors.textSecondary }]}>
                                    Hiển thị mã QR này cho nhân viên để quét
                                </Text>
                                <Text style={[styles.qrDisplayHint, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
                                    Bạn có thể lưu ảnh mã QR để sử dụng sau
                                </Text>
                                <TouchableOpacity
                                    style={[styles.saveQRButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveQRCode}
                                    disabled={savingQR}
                                >
                                    {savingQR ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="download" size={20} color="#fff" />
                                            <Text style={styles.saveQRButtonText}>Lưu ảnh QR</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.qrDisplayError}>
                                <Text style={[styles.qrDisplayErrorText, { color: colors.textSecondary }]}>
                                    Không thể tải mã QR
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    qrCodeButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    dateDisplay: {
        marginBottom: 20,
    },
    dateText: {
        fontSize: 16,
        marginBottom: 4,
    },
    greetingText: {
        fontSize: 18,
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: '#ef4444',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
    },
    successContainer: {
        backgroundColor: '#22c55e',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    successText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
    },
    successDetail: {
        color: '#fff',
        fontSize: 14,
        marginTop: 4,
    },
    sessionsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    noSessionsContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noSessionsText: {
        fontSize: 16,
    },
    sessionsList: {
        gap: 12,
    },
    sessionCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    sessionCardClickable: {
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    sessionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sessionTime: {
        fontSize: 14,
        marginBottom: 4,
    },
    sessionBranch: {
        fontSize: 12,
    },
    sessionStatus: {
        marginLeft: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sessionDetails: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    sessionDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sessionDetailLabel: {
        fontSize: 14,
    },
    sessionDetailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    checkInButton: {
        backgroundColor: '#22c55e',
    },
    checkOutButton: {
        backgroundColor: '#f59e0b',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    historySection: {
        marginBottom: 24,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    toggleHistoryButton: {
        padding: 8,
    },
    toggleHistoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historySessionName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    historyTime: {
        fontSize: 14,
        marginBottom: 4,
    },
    historyStatus: {
        marginLeft: 12,
        gap: 8,
    },
    noHistoryText: {
        fontSize: 14,
        textAlign: 'center',
        padding: 20,
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
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 20,
        backgroundColor: '#1C1C1E',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    modalHeaderButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pickImageButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    closeButton: {
        padding: 4,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    cameraPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    cameraPlaceholderText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#da2128',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#da2128',
        borderRadius: 12,
    },
    scannerHint: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    cameraActions: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    pickImageButtonBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(218, 33, 40, 0.9)',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 25,
        gap: 8,
    },
    pickImageButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
    },
    qrDisplayModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrDisplayContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        width: width * 0.9,
        maxHeight: height * 0.7,
    },
    qrDisplayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    qrDisplayTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    qrDisplayCloseButton: {
        padding: 4,
    },
    qrDisplayBody: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    qrDisplayName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    qrCodeContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrDisplayText: {
        fontSize: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    qrDisplayHint: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    saveQRButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    saveQRButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    qrDisplayLoading: {
        padding: 40,
        alignItems: 'center',
    },
    qrDisplayLoadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    qrDisplayError: {
        padding: 40,
        alignItems: 'center',
    },
    qrDisplayErrorText: {
        fontSize: 14,
    },
});

export default CheckInOutScreen;

