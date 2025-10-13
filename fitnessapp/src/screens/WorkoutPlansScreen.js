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
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTab, setSelectedTab] = useState('workout');
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [myWorkouts, setMyWorkouts] = useState([]);
    const [allExercises, setAllExercises] = useState([]);
    // userRank removed — membership rank UI no longer shown on this screen

    useEffect(() => {
        fetchWorkoutData();
    }, []);

    const fetchWorkoutData = async () => {
        try {
            setLoading(true);

            // Fetch both my assigned workouts and all available workout plans
            const [myWorkoutsData, allWorkoutsData, allExercisesData] = await Promise.allSettled([
                apiService.getMyWorkoutPlans(),
                apiService.getAllWorkoutPlans(),
                apiService.getAllBaiTap()
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
                    exercises: workout.danhSachBaiTap?.map(bt => ({
                        tenBaiTap: bt.tenBaiTap,
                        hinhAnh: bt.hinhAnh || bt.hinhAnhMinhHoa?.[0] || 'https://via.placeholder.com/128',
                        nhomCo: bt.nhomCo,
                        mucTieuBaiTap: bt.mucTieuBaiTap
                    })) || [],
                    ngayTap: workout.ngayTap,
                    trangThai: workout.trangThai
                }));

                setWorkoutPlans(transformedWorkouts);
            }

            if (allExercisesData && allExercisesData.status === 'fulfilled') {
                console.log('allExercisesData from API:', allExercisesData.value);
                setAllExercises(allExercisesData.value || []);
            } else {
                console.log('allExercisesData failed, trying fallback...');
                // Try unauthenticated fallback if available (some dev setups expose /baitap publicly)
                try {
                    const fallback = await apiService.apiCall('/baitap', 'GET', null, false);
                    console.log('Fallback exercises data:', fallback);
                    setAllExercises(Array.isArray(fallback) ? fallback : []);
                } catch (fallbackErr) {
                    console.warn('Failed to fetch exercises (unauthenticated fallback):', fallbackErr.message || fallbackErr);
                    // Create mock data if API fails
                    const mockExercises = [
                        {
                            _id: 'mock1',
                            tenBaiTap: 'Push-up',
                            hinhAnh: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
                            nhomCo: 'Ngực',
                            mucDoKho: 'Trung bình'
                        },
                        {
                            _id: 'mock2',
                            tenBaiTap: 'Squat',
                            hinhAnh: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400',
                            nhomCo: 'Chân',
                            mucDoKho: 'Dễ'
                        },
                        {
                            _id: 'mock3',
                            tenBaiTap: 'Plank',
                            hinhAnh: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
                            nhomCo: 'Bụng',
                            mucDoKho: 'Trung bình'
                        }
                    ];
                    setAllExercises(mockExercises);
                }
            }

        } catch (error) {
            console.error('Error fetching workout data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu buổi tập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // fetchUserRank removed — not used on this screen

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

    // Estimate kcal for a single exercise. Prefer explicit thoiGian, otherwise fallback to difficulty.
    const computeExerciseKcal = (ex = {}) => {
        try {
            const thoiGian = ex?.thoiGian || ex?.thoiGianTap || 0; // some shapes
            if (thoiGian && Number(thoiGian) > 0) {
                return Math.round(Number(thoiGian) * 8);
            }

            const diff = (ex?.mucDoKho || ex?.mucDo || '').toLowerCase();
            if (diff.includes('de') || diff.includes('dễ')) return 50;
            if (diff.includes('khó') || diff.includes('kho')) return 150;
            // trung bình
            return 100;
        } catch (e) {
            return 100;
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWorkoutData();
        setRefreshing(false);
    };

    const filteredWorkouts = selectedCategory === 'all'
        ? workoutPlans
        : workoutPlans.filter(plan => plan.category === selectedCategory);

    const renderSegmentTabs = () => (
        <View style={styles.segmentContainer}>
            {(() => {
                // determine if the current theme is light by measuring background brightness (works for hex colors)
                const isLightTheme = (() => {
                    try {
                        const bg = (colors.background || '').replace('#', '').trim();
                        if (!bg) return false;
                        const hex = bg.length === 3 ? bg.split('').map(c => c + c).join('') : bg.slice(0, 6);
                        const r = parseInt(hex.slice(0, 2), 16) / 255;
                        const g = parseInt(hex.slice(2, 4), 16) / 255;
                        const b = parseInt(hex.slice(4, 6), 16) / 255;
                        // luminance
                        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                        return lum > 0.7;
                    } catch (e) {
                        return false;
                    }
                })();

                const activeBg = isLightTheme ? '#da2128' : colors.primary;
                const activeText = '#FFFFFF';
                const inactiveBg = isLightTheme ? '#F3F6F9' : 'transparent';
                const inactiveBorder = isLightTheme ? 'transparent' : colors.border;
                const inactiveText = isLightTheme ? '#111827' : colors.text;

                return ['workout', 'tutorials', 'activity'].map(tab => {
                    const isActive = selectedTab === tab;
                    const label = tab === 'workout' ? 'workout' : tab === 'tutorials' ? 'Tutorials' : 'Activity';
                    return (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedTab(tab)}
                            activeOpacity={0.9}
                            style={[
                                styles.segmentButton,
                                isActive
                                    ? { backgroundColor: activeBg, borderWidth: isLightTheme ? 0 : 1 }
                                    : { backgroundColor: inactiveBg, borderColor: inactiveBorder, borderWidth: isLightTheme ? 0 : 1 }
                            ]}
                        >
                            <Text style={[
                                styles.segmentText,
                                isActive ? { color: activeText } : { color: inactiveText }
                            ]}>{label}</Text>
                        </TouchableOpacity>
                    );
                });
            })()}
        </View>
    );

    const renderExerciseCard = (exercise, idx) => {
        if (!exercise) {
            return null;
        }

        return (
            <TouchableOpacity
                key={exercise._id || idx}
                style={[styles.cardWrapper, { borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise._id })}
            >
                <Image
                    source={{ uri: exercise?.hinhAnh || exercise?.hinhAnhMinhHoa?.[0] || 'https://via.placeholder.com/800x400?text=Exercise' }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                <View style={styles.cardOverlay} />
                <View style={styles.cardContentRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: '#fff' }]} numberOfLines={1}>{exercise?.tenBaiTap || 'Bài tập'}</Text>
                        <View style={styles.cardMetaRow}>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="fitness-center" size={14} color="#fff" />
                                <Text style={styles.metaText}>{exercise?.nhomCo || 'Tập luyện'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="local-fire-department" size={14} color="#fff" />
                                <Text style={styles.metaText}>{(exercise?.kcal ?? computeExerciseKcal(exercise)) + ' kcal'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="speed" size={14} color="#fff" />
                                <Text style={styles.metaText}>{exercise?.mucDoKho || 'Trung bình'}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: exercise._id })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={[styles.viewLink, { color: colors.primary }]}>View Details</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderWorkoutCard = (workout, idx) => (
        <TouchableOpacity
            key={workout.id || idx}
            style={[styles.cardWrapper, { borderWidth: 1, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => { /* navigate if needed */ }}
        >
            <Image
                source={{ uri: workout.image || 'https://via.placeholder.com/800x400?text=Workout' }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardOverlay} />
            <View style={styles.cardContentRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: '#fff' }]} numberOfLines={1}>{workout.title}</Text>
                    <View style={styles.cardMetaRow}>
                        <View style={styles.metaItem}>
                            <MaterialIcons name="local-fire-department" size={14} color="#fff" />
                            <Text style={styles.metaText}>{workout.calories} kcal</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MaterialIcons name="schedule" size={14} color="#fff" />
                            <Text style={styles.metaText}>{workout.duration}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetail', { workoutId: workout.id })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.viewLink, { color: colors.primary }]}>View Exercises</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const getFormattedDate = (d = new Date()) => {
        try {
            const day = d.getDate();
            const weekday = d.toLocaleString(undefined, { weekday: 'short' });
            const month = d.toLocaleString(undefined, { month: 'long' });
            const year = d.getFullYear();
            return `${day} ${weekday}, ${month}, ${year}`;
        } catch (e) {
            return '';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Buổi tập</Text>
                </View>

                <TouchableOpacity style={styles.iconButton} onPress={() => { /* notifications */ }}>
                    <Ionicons name="notifications-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.dateRow}>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{getFormattedDate(new Date())}</Text>
                </View>

                {renderSegmentTabs()}

                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 20, marginTop: 16 }]}>Danh sách bài tập</Text>

                <View style={styles.workoutList}>
                    {(() => {
                        console.log('Current selectedTab:', selectedTab);
                        console.log('allExercises:', allExercises);
                        console.log('allExercises length:', allExercises?.length);

                        if (selectedTab === 'workout') {
                            if (allExercises && allExercises.length > 0) {
                                return allExercises
                                    .filter(exercise => exercise && exercise._id)
                                    .map(renderExerciseCard);
                            } else {
                                return <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>Không có bài tập để hiển thị</Text>;
                            }
                        } else {
                            return filteredWorkouts.map(renderWorkoutCard);
                        }
                    })()}
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
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    iconButton: {
        padding: 8,
        width: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dateText: {
        fontSize: 16,
        marginTop: 6,
    },
    dateRow: {
        alignItems: 'start',
        marginTop: 8,
        marginBottom: 6,
        paddingHorizontal: 20,
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
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 0,
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
    exercisesSection: {
        paddingVertical: 12,
        marginHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    exerciseTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    exercisesListContainer: {
        paddingHorizontal: 20,
        marginTop: 12,
        marginBottom: 28,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 10,
    },
    exerciseThumb: {
        width: 64,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#eee'
    },
    exerciseTitle: {
        fontSize: 15,
        fontWeight: '600'
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
    segmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 12,
    },
    segmentButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        marginHorizontal: 6,
        borderWidth: 1,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    segmentText: {
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'capitalize'
    },
    cardWrapper: {
        height: 160,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 14,
        marginHorizontal: 20,
    },
    cardImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)'
    },
    cardContent: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContentRow: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    viewLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    metaText: {
        color: '#fff',
        marginLeft: 6,
        fontSize: 14,
    },
    viewButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginLeft: 12,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    rankContainer: {
        padding: 16,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        margin: 20,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    rankText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
    },
});

export default WorkoutPlansScreen;