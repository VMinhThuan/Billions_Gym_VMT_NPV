import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    RefreshControl,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const WorkoutPlansScreen = () => {
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
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [myWorkouts, setMyWorkouts] = useState([]);

    useEffect(() => {
        fetchWorkoutData();
    }, []);

    const fetchWorkoutData = async () => {
        try {
            setLoading(true);

            // Fetch both my assigned workouts and all available workout plans
            const [myWorkoutsData, allWorkoutsData] = await Promise.allSettled([
                apiService.getMyWorkoutPlans(),
                apiService.getAllWorkoutPlans()
            ]);

            if (myWorkoutsData.status === 'fulfilled') {
                setMyWorkouts(myWorkoutsData.value || []);
            }

            if (allWorkoutsData.status === 'fulfilled') {
                const workouts = allWorkoutsData.value || [];

                // Transform backend data to frontend format
                const transformedWorkouts = workouts.map(workout => ({
                    id: workout._id,
                    title: workout.tenBuoiTap || 'Buổi tập',
                    duration: `${workout.thoiLuong || 60} phút`,
                    difficulty: mapDifficulty(workout.mucDo),
                    calories: estimateCalories(workout.mucDo, workout.thoiLuong),
                    category: mapCategory(workout.loaiBuoiTap),
                    completed: workout.trangThai === 'DaHoanThanh',
                    description: workout.moTa || 'Buổi tập luyện',
                    exercises: workout.danhSachBaiTap?.map(bt => bt.tenBaiTap) || [],
                    ngayTap: workout.ngayTap,
                    trangThai: workout.trangThai
                }));

                setWorkoutPlans(transformedWorkouts);
            }

        } catch (error) {
            console.error('Error fetching workout data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu buổi tập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const mapDifficulty = (mucDo) => {
        switch (mucDo) {
            case 'De': return 'Dễ';
            case 'TrungBinh': return 'Trung bình';
            case 'Kho': return 'Khó';
            default: return 'Trung bình';
        }
    };

    const mapCategory = (loaiBuoiTap) => {
        switch (loaiBuoiTap) {
            case 'Cardio': return 'cardio';
            case 'SucManh': return 'strength';
            case 'DeoDai': return 'flexibility';
            case 'HIIT': return 'cardio';
            default: return 'strength';
        }
    };

    const estimateCalories = (mucDo, thoiLuong = 60) => {
        const baseCalories = {
            'De': 3,
            'TrungBinh': 5,
            'Kho': 7
        };
        const caloriesPerMinute = baseCalories[mucDo] || 5;
        const totalCalories = caloriesPerMinute * thoiLuong;
        return `${Math.round(totalCalories * 0.8)}-${Math.round(totalCalories * 1.2)}`;
    };

    const handleCompleteWorkout = async (workoutId) => {
        try {
            await apiService.completeWorkout(workoutId);
            Alert.alert('Thành công', 'Đã đánh dấu hoàn thành buổi tập!');
            fetchWorkoutData(); // Refresh data
        } catch (error) {
            console.error('Error completing workout:', error);
            Alert.alert('Lỗi', 'Không thể hoàn thành buổi tập. Vui lòng thử lại.');
        }
    };

    const categories = [
        { id: 'all', name: 'Tất cả', icon: 'fitness-center' },
        { id: 'cardio', name: 'Cardio', icon: 'favorite' },
        { id: 'strength', name: 'Sức mạnh', icon: 'self-improvement' },
        { id: 'flexibility', name: 'Dẻo dai', icon: 'spa' }
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWorkoutData();
        setRefreshing(false);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Dễ': return '#4CAF50';
            case 'Trung bình': return '#FF9800';
            case 'Khó': return '#DA2128';
            default: return '#666';
        }
    };

    const filteredWorkouts = selectedCategory === 'all'
        ? workoutPlans
        : workoutPlans.filter(plan => plan.category === selectedCategory);

    const renderCategoryTabs = () => (
        <View style={[styles.categoryContainer, { backgroundColor: colors.surface }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryTab,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            selectedCategory === category.id && [styles.categoryTabActive, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                    >
                        <MaterialIcons
                            name={category.icon}
                            size={20}
                            color={selectedCategory === category.id ? '#fff' : colors.textSecondary}
                        />
                        <Text style={[
                            styles.categoryText,
                            { color: colors.text },
                            selectedCategory === category.id && [styles.categoryTextActive, { color: '#fff' }]
                        ]}>
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderWorkoutCard = (workout) => (
        <TouchableOpacity key={workout.id} style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutTitle, { color: colors.text }]}>{workout.title}</Text>
                    <Text style={[styles.workoutDescription, { color: colors.textSecondary }]}>{workout.description}</Text>
                </View>
                {workout.completed && (
                    <View style={styles.completedBadge}>
                        <MaterialIcons name="check-circle" size={24} color={colors.success} />
                    </View>
                )}
            </View>

            <View style={styles.workoutDetails}>
                <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{workout.duration}</Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialIcons name="trending-up" size={16} color={getDifficultyColor(workout.difficulty)} />
                    <Text style={[styles.detailText, { color: getDifficultyColor(workout.difficulty) }]}>
                        {workout.difficulty}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <MaterialIcons name="local-fire-department" size={16} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{workout.calories} cal</Text>
                </View>
            </View>

            <View style={styles.exercisesList}>
                <Text style={[styles.exercisesTitle, { color: colors.text }]}>Bài tập:</Text>
                <View style={styles.exerciseTags}>
                    {workout.exercises.slice(0, 3).map((exercise, index) => (
                        <View key={index} style={[styles.exerciseTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.exerciseTagText, { color: colors.text }]}>{exercise}</Text>
                        </View>
                    ))}
                    {workout.exercises.length > 3 && (
                        <View style={[styles.exerciseTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.exerciseTagText, { color: colors.text }]}>+{workout.exercises.length - 3}</Text>
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={() => handleCompleteWorkout(workout.id)}
            >
                <MaterialIcons name="play-arrow" size={20} color="#fff" />
                <Text style={styles.startButtonText}>
                    {workout.completed ? 'Tập lại' : 'Bắt đầu'}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Lịch tập</Text>
                <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.surface }]}>
                    <MaterialIcons name="search" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderCategoryTabs()}

                <View style={[styles.aiRecommendation, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.aiIcon}>
                        <Ionicons name="bulb" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.aiContent}>
                        <Text style={[styles.aiTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>
                        <Text style={[styles.aiText, { color: colors.textSecondary }]}>
                            Dựa trên mục tiêu của bạn, hãy thử "Cardio Burn" để đốt cháy mỡ thừa hiệu quả
                        </Text>
                    </View>
                </View>

                <View style={styles.workoutList}>
                    {filteredWorkouts.map(renderWorkoutCard)}
                </View>

                <View style={styles.progressSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tiến độ tuần này</Text>
                    <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.progressStats}>
                            <View style={styles.progressItem}>
                                <Text style={[styles.progressValue, { color: colors.primary }]}>3</Text>
                                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Buổi tập</Text>
                            </View>
                            <View style={styles.progressItem}>
                                <Text style={[styles.progressValue, { color: colors.primary }]}>150</Text>
                                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Phút</Text>
                            </View>
                            <View style={styles.progressItem}>
                                <Text style={[styles.progressValue, { color: colors.primary }]}>1,200</Text>
                                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Calories</Text>
                            </View>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                            <View style={[styles.progressFill, { width: '60%', backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.progressText, { color: colors.textSecondary }]}>Bạn đã hoàn thành 60% mục tiêu tuần</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchButton: {
        padding: 8,
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    categoryContainer: {
        paddingVertical: 20,
        paddingLeft: 20,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryTabActive: {
        // Active background color
    },
    categoryText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#fff',
    },
    aiRecommendation: {
        flexDirection: 'row',
        margin: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#DA2128',
        borderWidth: 1,
    },
    aiIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    aiContent: {
        flex: 1,
    },
    aiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#141414',
        marginBottom: 4,
    },
    aiText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    workoutList: {
        paddingHorizontal: 20,
    },
    workoutCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
    workoutDescription: {
        fontSize: 14,
        lineHeight: 18,
    },
    completedBadge: {
        marginLeft: 12,
    },
    workoutDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    exercisesList: {
        marginBottom: 16,
    },
    exercisesTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    exerciseTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    exerciseTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
        borderWidth: 1,
    },
    exerciseTagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    startButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    progressSection: {
        margin: 20,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#141414',
        marginBottom: 16,
    },
    progressCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    progressItem: {
        alignItems: 'center',
    },
    progressValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    progressLabel: {
        fontSize: 12,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        textAlign: 'center',
    },
});

export default WorkoutPlansScreen;
