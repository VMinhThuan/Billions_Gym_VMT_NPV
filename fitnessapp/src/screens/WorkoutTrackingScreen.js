import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const WorkoutTrackingScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalCalories: 0,
        averageRating: 0,
        streak: 0,
        thisWeek: 0,
        thisMonth: 0
    });

    useEffect(() => {
        fetchWorkoutData();
    }, []);

    const fetchWorkoutData = async () => {
        try {
            setLoading(true);
            const [historyData, statsData] = await Promise.allSettled([
                apiService.getMyWorkoutHistory(),
                apiService.getWorkoutHistoryStats()
            ]);

            if (historyData.status === 'fulfilled') {
                setWorkoutHistory(historyData.value || []);
            }

            if (statsData.status === 'fulfilled') {
                const statsInfo = statsData.value;
                setStats({
                    totalWorkouts: statsInfo.tongSoBuoiTap || 0,
                    totalCalories: statsInfo.tongCaloTieuHao || 0,
                    averageRating: statsInfo.danhGiaTrungBinh || 0,
                    streak: statsInfo.streak || 0,
                    thisWeek: statsInfo.tuanNay || 0,
                    thisMonth: statsInfo.thangNay || 0
                });
            }
        } catch (error) {
            console.error('Error fetching workout data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu tập luyện');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWorkoutData();
        setRefreshing(false);
    };

    const getRatingStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }
        if (hasHalfStar) {
            stars.push('☆');
        }
        while (stars.length < 5) {
            stars.push('☆');
        }
        return stars.join('');
    };

    const getWorkoutDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    };

    const renderStatsCards = () => (
        <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thống kê tập luyện</Text>
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalWorkouts}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng buổi tập</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="flame-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalCalories.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="star-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.averageRating.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đánh giá TB</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.streak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
                </View>
            </View>
        </View>
    );

    const renderWeeklyStats = () => (
        <View style={[styles.weeklyStatsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tuần này</Text>
            <View style={styles.weeklyStatsGrid}>
                <View style={[styles.weeklyStatCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.weeklyStatValue, { color: colors.primary }]}>{stats.thisWeek}</Text>
                    <Text style={[styles.weeklyStatLabel, { color: colors.textSecondary }]}>Buổi tập</Text>
                </View>
                <View style={[styles.weeklyStatCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.weeklyStatValue, { color: colors.primary }]}>{stats.thisMonth}</Text>
                    <Text style={[styles.weeklyStatLabel, { color: colors.textSecondary }]}>Tháng này</Text>
                </View>
            </View>
        </View>
    );

    const renderWorkoutHistoryItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.workoutItem, { backgroundColor: colors.surface }]}
            onPress={() => Alert.alert('Chi tiết', 'Xem chi tiết buổi tập')}
        >
            <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutTitle, { color: colors.text }]}>
                        {item.buoiTap?.tenBuoiTap || 'Buổi tập'}
                    </Text>
                    <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
                        {getWorkoutDate(item.ngayTap)}
                    </Text>
                </View>
                <View style={styles.workoutRating}>
                    <Text style={[styles.ratingText, { color: colors.primary }]}>
                        {getRatingStars(item.danhGia || 0)}
                    </Text>
                </View>
            </View>

            <View style={styles.workoutStats}>
                <View style={styles.workoutStatItem}>
                    <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.workoutStatText, { color: colors.textSecondary }]}>
                        {item.caloTieuHao || 0} cal
                    </Text>
                </View>
                <View style={styles.workoutStatItem}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.workoutStatText, { color: colors.textSecondary }]}>
                        {item.thoiGianTap || 0} phút
                    </Text>
                </View>
                <View style={styles.workoutStatItem}>
                    <Ionicons name="fitness-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.workoutStatText, { color: colors.textSecondary }]}>
                        {item.soBaiTap || 0} bài
                    </Text>
                </View>
            </View>

            <View style={styles.workoutActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert('Lặp lại', 'Lặp lại buổi tập này')}
                >
                    <Ionicons name="refresh-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Lặp lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                    onPress={() => Alert.alert('Chia sẻ', 'Chia sẻ kết quả')}
                >
                    <Ionicons name="share-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Chia sẻ</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Chưa có lịch sử tập luyện
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Bắt đầu tập luyện để xem thống kê và lịch sử của bạn
            </Text>
            <TouchableOpacity
                style={[styles.startWorkoutButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Exercises')}
            >
                <Ionicons name="play-outline" size={20} color="#fff" />
                <Text style={styles.startWorkoutButtonText}>Bắt đầu tập luyện</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Đang tải dữ liệu...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Lịch sử tập luyện
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            Theo dõi tiến độ của bạn
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Exercises')}
                    >
                        <Ionicons name="add-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={workoutHistory}
                keyExtractor={(item, index) => item._id || index.toString()}
                renderItem={renderWorkoutHistoryItem}
                contentContainerStyle={styles.workoutList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListHeaderComponent={
                    <>
                        {renderStatsCards()}
                        {renderWeeklyStats()}
                    </>
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statsContainer: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: (width - 60) / 2,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    weeklyStatsContainer: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 16,
    },
    weeklyStatsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    weeklyStatCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    weeklyStatValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    weeklyStatLabel: {
        fontSize: 14,
        textAlign: 'center',
    },
    workoutItem: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    workoutDate: {
        fontSize: 14,
    },
    workoutRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    workoutStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    workoutStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    workoutStatText: {
        marginLeft: 6,
        fontSize: 12,
    },
    workoutActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        flex: 1,
        marginHorizontal: 4,
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    startWorkoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default WorkoutTrackingScreen;