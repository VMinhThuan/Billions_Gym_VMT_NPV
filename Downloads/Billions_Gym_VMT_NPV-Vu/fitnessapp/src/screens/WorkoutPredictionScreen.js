import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const WorkoutPredictionScreen = ({ navigation }) => {
    const themeContext = useTheme();
    const colors = themeContext?.colors || {
        background: '#f5f5f5',
        surface: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        primary: '#DA2128',
        border: '#eee'
    };
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [predictionData, setPredictionData] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState('GIAM_CAN');
    const [selectedFrequency, setSelectedFrequency] = useState(3);

    const goals = [
        { key: 'GIAM_CAN', label: 'Giảm cân', icon: 'trending-down' },
        { key: 'TANG_CO_BAP', label: 'Tăng cơ bắp', icon: 'fitness' },
        { key: 'TANG_CAN', label: 'Tăng cân', icon: 'trending-up' },
        { key: 'DUY_TRI', label: 'Duy trì sức khỏe', icon: 'heart' }
    ];

    const frequencies = [
        { value: 2, label: '2 buổi/tuần' },
        { value: 3, label: '3 buổi/tuần' },
        { value: 4, label: '4 buổi/tuần' },
        { value: 5, label: '5 buổi/tuần' }
    ];

    useEffect(() => {
        loadPredictionData();
    }, [selectedGoal, selectedFrequency, user]);

    const loadPredictionData = async () => {
        try {
            setLoading(true);

            // Lấy userId từ token thay vì từ user object
            const userId = await apiService.getCurrentUserId();
            if (!userId) {
                Alert.alert('Lỗi', 'Không thể xác định người dùng. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await apiService.apiCall(
                '/workout-prediction/du-bao-thoi-gian-va-phuong-phap',
                'POST',
                {
                    hoiVienId: userId,
                    mucTieu: selectedGoal,
                    soBuoiTapTuan: selectedFrequency
                }
            );

            if (response.success) {
                setPredictionData(response.data);
            } else {
                Alert.alert('Lỗi', response.message || 'Không thể tải dữ liệu dự báo');
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu dự báo:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu dự báo');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPredictionData();
        setRefreshing(false);
    };

    const getGoalColor = (goal) => {
        const colors = {
            'GIAM_CAN': '#FF6B6B',
            'TANG_CO_BAP': '#4ECDC4',
            'TANG_CAN': '#45B7D1',
            'DUY_TRI': '#96CEB4'
        };
        return colors[goal] || '#96CEB4';
    };

    const renderGoalSelector = () => (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.goalGrid}>
                {goals.map((goal) => (
                    <TouchableOpacity
                        key={goal.key}
                        style={[
                            styles.goalCard,
                            {
                                backgroundColor: selectedGoal === goal.key ? getGoalColor(goal.key) : colors.background,
                                borderColor: getGoalColor(goal.key)
                            }
                        ]}
                        onPress={() => setSelectedGoal(goal.key)}
                    >
                        <Ionicons
                            name={goal.icon}
                            size={24}
                            color={selectedGoal === goal.key ? '#fff' : getGoalColor(goal.key)}
                        />
                        <Text style={[
                            styles.goalText,
                            { color: selectedGoal === goal.key ? '#fff' : colors.text }
                        ]}>
                            {goal.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderFrequencySelector = () => (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tần suất tập luyện</Text>
            <View style={styles.frequencyContainer}>
                {frequencies.map((freq) => (
                    <TouchableOpacity
                        key={freq.value}
                        style={[
                            styles.frequencyButton,
                            {
                                backgroundColor: selectedFrequency === freq.value ? colors.primary : colors.background,
                                borderColor: colors.primary
                            }
                        ]}
                        onPress={() => setSelectedFrequency(freq.value)}
                    >
                        <Text style={[
                            styles.frequencyText,
                            { color: selectedFrequency === freq.value ? '#fff' : colors.text }
                        ]}>
                            {freq.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderOptimalTime = () => {
        if (!predictionData?.thoiGianToiUu) return null;

        const { thoiGianToiUu, thoiGianToiThieu, thoiGianToiDa, lyDo } = predictionData.thoiGianToiUu;

        return (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Thời gian tập luyện tối ưu</Text>
                <View style={[styles.timeCard, { backgroundColor: colors.background }]}>
                    <View style={styles.timeMain}>
                        <Text style={[styles.timeValue, { color: colors.primary }]}>{thoiGianToiUu}</Text>
                        <Text style={[styles.timeUnit, { color: colors.textSecondary }]}>phút</Text>
                    </View>
                    <View style={styles.timeRange}>
                        <Text style={[styles.timeRangeText, { color: colors.textSecondary }]}>
                            Khoảng: {thoiGianToiThieu} - {thoiGianToiDa} phút
                        </Text>
                    </View>
                </View>
                <View style={styles.reasonsContainer}>
                    <Text style={[styles.reasonsTitle, { color: colors.text }]}>Lý do:</Text>
                    {lyDo.map((reason, index) => (
                        <Text key={index} style={[styles.reasonText, { color: colors.textSecondary }]}>
                            • {reason}
                        </Text>
                    ))}
                </View>
            </View>
        );
    };

    const renderProgressPrediction = () => {
        if (!predictionData?.duBaoTienDo) return null;

        const { duBaoTuan, caloTieuHaoDuBao, thoiGianDatMucTieu, khaNangThanhCong } = predictionData.duBaoTienDo;

        return (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Dự báo tiến độ</Text>
                <View style={styles.progressGrid}>
                    <View style={[styles.progressItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.progressValue, { color: colors.primary }]}>{duBaoTuan}</Text>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Buổi/tuần</Text>
                    </View>
                    <View style={[styles.progressItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.progressValue, { color: colors.primary }]}>{caloTieuHaoDuBao}</Text>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Calo/tuần</Text>
                    </View>
                    <View style={[styles.progressItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.progressValue, { color: colors.primary }]}>{thoiGianDatMucTieu.tuan}</Text>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Tuần đạt mục tiêu</Text>
                    </View>
                    <View style={[styles.progressItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.progressValue, { color: colors.primary }]}>{khaNangThanhCong}%</Text>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Khả năng thành công</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderTrainingMethods = () => {
        if (!predictionData?.phuongPhapTap) return null;

        const { phuongPhapChinh, baiTapGopY, lichTapGopY, luuY, thoiDiemTap, cheDoNghi } = predictionData.phuongPhapTap;

        return (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Phương pháp tập luyện</Text>

                <View style={[styles.methodCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Phương pháp chính:</Text>
                    <Text style={[styles.methodText, { color: colors.textSecondary }]}>{phuongPhapChinh}</Text>
                </View>

                <View style={[styles.methodCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Bài tập gợi ý:</Text>
                    {baiTapGopY.map((baiTap, index) => (
                        <Text key={index} style={[styles.methodText, { color: colors.textSecondary }]}>
                            • {baiTap}
                        </Text>
                    ))}
                </View>

                <View style={[styles.methodCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Lịch tập gợi ý:</Text>
                    {Object.entries(lichTapGopY).map(([ngay, noiDung]) => (
                        <Text key={ngay} style={[styles.methodText, { color: colors.textSecondary }]}>
                            {ngay}: {noiDung}
                        </Text>
                    ))}
                </View>

                <View style={[styles.methodCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Thời điểm tập:</Text>
                    <Text style={[styles.methodText, { color: colors.textSecondary }]}>{thoiDiemTap}</Text>
                </View>

                <View style={[styles.methodCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Chế độ nghỉ:</Text>
                    <Text style={[styles.methodText, { color: colors.textSecondary }]}>{cheDoNghi}</Text>
                </View>

                {luuY.length > 0 && (
                    <View style={[styles.methodCard, { backgroundColor: colors.background }]}>
                        <Text style={[styles.methodTitle, { color: colors.text }]}>Lưu ý:</Text>
                        {luuY.map((note, index) => (
                            <Text key={index} style={[styles.methodText, { color: colors.textSecondary }]}>
                                • {note}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderHistoryAnalysis = () => {
        if (!predictionData?.phanTichLichSu) return null;

        const { soBuoiTap, thoiGianTrungBinh, caloTieuHaoTrungBinh, tanSuatTap, xuHuong, doKhoTap } = predictionData.phanTichLichSu;

        return (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Phân tích lịch sử tập luyện</Text>
                <View style={styles.historyGrid}>
                    <View style={[styles.historyItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.historyValue, { color: colors.primary }]}>{soBuoiTap}</Text>
                        <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>Buổi tập (30 ngày)</Text>
                    </View>
                    <View style={[styles.historyItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.historyValue, { color: colors.primary }]}>{thoiGianTrungBinh}</Text>
                        <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>Phút/buổi</Text>
                    </View>
                    <View style={[styles.historyItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.historyValue, { color: colors.primary }]}>{caloTieuHaoTrungBinh}</Text>
                        <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>Calo/buổi</Text>
                    </View>
                    <View style={[styles.historyItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.historyValue, { color: colors.primary }]}>{tanSuatTap}</Text>
                        <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>Buổi/tuần</Text>
                    </View>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.statusLabel, { color: colors.text }]}>Xu hướng:</Text>
                        <Text style={[styles.statusValue, { color: getStatusColor(xuHuong) }]}>
                            {getStatusText(xuHuong)}
                        </Text>
                    </View>
                    <View style={[styles.statusItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.statusLabel, { color: colors.text }]}>Độ khó:</Text>
                        <Text style={[styles.statusValue, { color: getStatusColor(doKhoTap) }]}>
                            {getStatusText(doKhoTap)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const getStatusColor = (status) => {
        const colors = {
            'tang_truong': '#4CAF50',
            'on_dinh': '#2196F3',
            'giam_sut': '#FF9800',
            'DE': '#4CAF50',
            'TRUNG_BINH': '#2196F3',
            'KHO': '#FF9800',
            'RAT_KHO': '#F44336'
        };
        return colors[status] || colors.text;
    };

    const getStatusText = (status) => {
        const texts = {
            'tang_truong': 'Tăng trưởng',
            'on_dinh': 'Ổn định',
            'giam_sut': 'Giảm sút',
            'DE': 'Dễ',
            'TRUNG_BINH': 'Trung bình',
            'KHO': 'Khó',
            'RAT_KHO': 'Rất khó'
        };
        return texts[status] || status;
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
                <StatusBar style="auto" backgroundColor={colors.background} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Đang phân tích dữ liệu...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style="auto" backgroundColor={colors.background} />

            {/* Fixed Header */}
            <View style={[styles.headerContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.goalSectionTitle, { color: colors.primary }]}>Mục tiêu tập luyện</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderGoalSelector()}
                {renderFrequencySelector()}
                {predictionData && (
                    <>
                        {renderOptimalTime()}
                        {renderProgressPrediction()}
                        {renderTrainingMethods()}
                        {renderHistoryAnalysis()}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        padding: 16,
        paddingBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    section: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    goalSectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    goalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    goalCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
    },
    goalText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    frequencyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    frequencyButton: {
        width: '48%',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
    },
    frequencyText: {
        fontSize: 14,
        fontWeight: '600',
    },
    timeCard: {
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
    },
    timeMain: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    timeValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    timeUnit: {
        fontSize: 18,
        marginLeft: 8,
    },
    timeRange: {
        marginTop: 8,
    },
    timeRangeText: {
        fontSize: 14,
    },
    reasonsContainer: {
        marginTop: 16,
    },
    reasonsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 20,
    },
    progressGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    progressItem: {
        width: '48%',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    progressValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressLabel: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    methodCard: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    methodText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    historyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    historyItem: {
        width: '48%',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    historyValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    historyLabel: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    statusLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default WorkoutPredictionScreen;
