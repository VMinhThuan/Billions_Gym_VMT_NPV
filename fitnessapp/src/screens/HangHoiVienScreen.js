import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const HangHoiVienScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hangHoiViens, setHangHoiViens] = useState([]);
    const [thongKe, setThongKe] = useState([]);
    const [selectedHang, setSelectedHang] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [hangData, thongKeData] = await Promise.allSettled([
                apiService.getAllHangHoiVien(),
                apiService.getThongKeHangHoiVien()
            ]);

            if (hangData.status === 'fulfilled' && hangData.value) {
                setHangHoiViens(hangData.value);
            }

            if (thongKeData.status === 'fulfilled' && thongKeData.value) {
                setThongKe(thongKeData.value);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleHangPress = (hang) => {
        setSelectedHang(hang);
        setModalVisible(true);
    };

    const renderHangCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.hangCard, { backgroundColor: colors.card }]}
            onPress={() => handleHangPress(item)}
        >
            <View style={styles.hangHeader}>
                <View style={[styles.hangIcon, { backgroundColor: item.mauSac }]}>
                    <Text style={styles.hangIconText}>{item.icon}</Text>
                </View>
                <View style={styles.hangInfo}>
                    <Text style={[styles.hangName, { color: colors.text }]}>{item.tenHienThi}</Text>
                    <Text style={[styles.hangDescription, { color: colors.textSecondary }]}>
                        {item.moTa}
                    </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color={colors.textMuted} />
            </View>

            <View style={styles.hangStats}>
                <View style={styles.hangStatItem}>
                    <Text style={[styles.hangStatValue, { color: colors.text }]}>
                        {item.dieuKienDatHang.soTienTichLuy.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text style={[styles.hangStatLabel, { color: colors.textSecondary }]}>Tích lũy</Text>
                </View>
                <View style={styles.hangStatItem}>
                    <Text style={[styles.hangStatValue, { color: colors.text }]}>
                        {item.dieuKienDatHang.soThangLienTuc} tháng
                    </Text>
                    <Text style={[styles.hangStatLabel, { color: colors.textSecondary }]}>Liên tục</Text>
                </View>
                <View style={styles.hangStatItem}>
                    <Text style={[styles.hangStatValue, { color: colors.text }]}>
                        {item.dieuKienDatHang.soBuoiTapToiThieu} buổi
                    </Text>
                    <Text style={[styles.hangStatLabel, { color: colors.textSecondary }]}>Tập luyện</Text>
                </View>
            </View>

            <View style={styles.quyenLoiPreview}>
                <Text style={[styles.quyenLoiTitle, { color: colors.text }]}>Quyền lợi:</Text>
                {item.quyenLoi.slice(0, 2).map((quyenLoi, index) => (
                    <View key={index} style={styles.quyenLoiItem}>
                        <MaterialIcons name="check-circle" size={14} color={colors.success} />
                        <Text style={[styles.quyenLoiText, { color: colors.text }]}>{quyenLoi.tenQuyenLoi}</Text>
                    </View>
                ))}
                {item.quyenLoi.length > 2 && (
                    <Text style={[styles.quyenLoiMore, { color: colors.primary }]}>
                        +{item.quyenLoi.length - 2} quyền lợi khác
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderThongKeCard = ({ item }) => (
        <View style={[styles.thongKeCard, { backgroundColor: colors.card }]}>
            <View style={styles.thongKeHeader}>
                <View style={[styles.thongKeIcon, { backgroundColor: item.mauSac }]}>
                    <Text style={styles.thongKeIconText}>🏆</Text>
                </View>
                <View style={styles.thongKeInfo}>
                    <Text style={[styles.thongKeName, { color: colors.text }]}>{item.tenHang}</Text>
                    <Text style={[styles.thongKeCount, { color: colors.textSecondary }]}>
                        {item.soLuong} hội viên
                    </Text>
                </View>
            </View>
            <View style={styles.thongKeStats}>
                <Text style={[styles.thongKeValue, { color: colors.text }]}>
                    {item.tongTienTichLuy.toLocaleString('vi-VN')}đ
                </Text>
                <Text style={[styles.thongKeLabel, { color: colors.textSecondary }]}>Tổng tích lũy</Text>
            </View>
        </View>
    );

    const renderHangDetailModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <MaterialIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Chi tiết hạng</Text>
                    <View style={styles.modalPlaceholder} />
                </View>

                {selectedHang && (
                    <ScrollView style={styles.modalContent}>
                        <View style={[styles.hangDetailCard, { backgroundColor: colors.card }]}>
                            <View style={styles.hangDetailHeader}>
                                <View style={[styles.hangDetailIcon, { backgroundColor: selectedHang.mauSac }]}>
                                    <Text style={styles.hangDetailIconText}>{selectedHang.icon}</Text>
                                </View>
                                <View style={styles.hangDetailInfo}>
                                    <Text style={[styles.hangDetailName, { color: colors.text }]}>
                                        {selectedHang.tenHienThi}
                                    </Text>
                                    <Text style={[styles.hangDetailDescription, { color: colors.textSecondary }]}>
                                        {selectedHang.moTa}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.dieuKienSection}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Điều kiện đạt hạng</Text>
                                <View style={styles.dieuKienItem}>
                                    <MaterialIcons name="attach-money" size={20} color={colors.primary} />
                                    <Text style={[styles.dieuKienText, { color: colors.text }]}>
                                        Tích lũy: {selectedHang.dieuKienDatHang.soTienTichLuy.toLocaleString('vi-VN')}đ
                                    </Text>
                                </View>
                                <View style={styles.dieuKienItem}>
                                    <MaterialIcons name="schedule" size={20} color={colors.primary} />
                                    <Text style={[styles.dieuKienText, { color: colors.text }]}>
                                        Liên tục: {selectedHang.dieuKienDatHang.soThangLienTuc} tháng
                                    </Text>
                                </View>
                                <View style={styles.dieuKienItem}>
                                    <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
                                    <Text style={[styles.dieuKienText, { color: colors.text }]}>
                                        Tập luyện: {selectedHang.dieuKienDatHang.soBuoiTapToiThieu} buổi
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.quyenLoiSection}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quyền lợi</Text>
                                {selectedHang.quyenLoi.map((quyenLoi, index) => (
                                    <View key={index} style={styles.quyenLoiDetailItem}>
                                        <MaterialIcons name="check-circle" size={20} color={colors.success} />
                                        <View style={styles.quyenLoiDetailInfo}>
                                            <Text style={[styles.quyenLoiDetailName, { color: colors.text }]}>
                                                {quyenLoi.tenQuyenLoi}
                                            </Text>
                                            {quyenLoi.moTa && (
                                                <Text style={[styles.quyenLoiDetailDescription, { color: colors.textSecondary }]}>
                                                    {quyenLoi.moTa}
                                                </Text>
                                            )}
                                            {quyenLoi.giaTri > 0 && (
                                                <Text style={[styles.quyenLoiDetailValue, { color: colors.primary }]}>
                                                    {quyenLoi.loaiQuyenLoi === 'GIAM_GIA' ? `${quyenLoi.giaTri}%` : `${quyenLoi.giaTri.toLocaleString('vi-VN')}đ`}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Hạng hội viên</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Thống kê tổng quan</Text>
                    <FlatList
                        data={thongKe}
                        renderItem={renderThongKeCard}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thongKeList}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh sách hạng</Text>
                    <FlatList
                        data={hangHoiViens}
                        renderItem={renderHangCard}
                        keyExtractor={(item) => item._id}
                        scrollEnabled={false}
                    />
                </View>
            </ScrollView>

            {renderHangDetailModal()}
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
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginHorizontal: 20,
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    // Hạng card styles
    hangCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    hangHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    hangIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    hangIconText: {
        fontSize: 24,
    },
    hangInfo: {
        flex: 1,
    },
    hangName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    hangDescription: {
        fontSize: 14,
    },
    hangStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    hangStatItem: {
        alignItems: 'center',
    },
    hangStatValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    hangStatLabel: {
        fontSize: 12,
    },
    quyenLoiPreview: {
        marginTop: 8,
    },
    quyenLoiTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    quyenLoiItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    quyenLoiText: {
        marginLeft: 8,
        fontSize: 12,
    },
    quyenLoiMore: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    // Thống kê card styles
    thongKeList: {
        paddingRight: 20,
    },
    thongKeCard: {
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    thongKeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    thongKeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    thongKeIconText: {
        fontSize: 20,
    },
    thongKeInfo: {
        flex: 1,
    },
    thongKeName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    thongKeCount: {
        fontSize: 12,
    },
    thongKeStats: {
        alignItems: 'center',
    },
    thongKeValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    thongKeLabel: {
        fontSize: 10,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalCloseButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalPlaceholder: {
        width: 40,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    hangDetailCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    hangDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    hangDetailIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    hangDetailIconText: {
        fontSize: 36,
    },
    hangDetailInfo: {
        flex: 1,
    },
    hangDetailName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    hangDetailDescription: {
        fontSize: 16,
        lineHeight: 22,
    },
    dieuKienSection: {
        marginBottom: 24,
    },
    dieuKienItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dieuKienText: {
        marginLeft: 12,
        fontSize: 16,
    },
    quyenLoiSection: {
        marginBottom: 24,
    },
    quyenLoiDetailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    quyenLoiDetailInfo: {
        flex: 1,
        marginLeft: 12,
    },
    quyenLoiDetailName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    quyenLoiDetailDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    quyenLoiDetailValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default HangHoiVienScreen;
