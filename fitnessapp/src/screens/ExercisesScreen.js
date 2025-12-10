import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
    Image,
    Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import apiService from '../api/apiService';

const { width, height } = Dimensions.get('window');

const PHASES = [
    { id: 'warmup', label: 'Khởi động', icon: 'whatshot', color: '#FF9800' },
    { id: 'main', label: 'Chính', icon: 'fitness-center', color: '#00E676' },
    { id: 'cooldown', label: 'Hồi phục', icon: 'self-improvement', color: '#2196F3' }
];

const ExercisesScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState([]);
    const [muscleGroups, setMuscleGroups] = useState(['Tất cả']);
    const [completedExercises, setCompletedExercises] = useState({});
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const scrollViewRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        loadExercises();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    const loadExercises = async () => {
        try {
            setLoading(true);
            const result = await apiService.apiCall('/baitap', 'GET', null, true);

            if (result?.success && result.data) {
                const exercisesData = result.data;
                setExercises(exercisesData);

                // Extract unique muscle groups
                const groups = ['Tất cả', ...new Set(exercisesData.map(ex => ex.nhomCo).filter(Boolean))];
                setMuscleGroups(groups);
            }
        } catch (error) {
            console.error('Error loading exercises:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách bài tập');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadExercises();
        setRefreshing(false);
    };

    // Group exercises by phase (warm-up, main, cool-down)
    const groupExercisesByPhase = () => {
        const filtered = exercises.filter(ex => {
            const matchesFilter = selectedFilter === 'Tất cả' || ex.nhomCo === selectedFilter;
            const matchesSearch = (ex.tenBaiTap || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });

        // Simple grouping: first 20% warm-up, middle 60% main, last 20% cool-down
        const total = filtered.length;
        const warmupCount = Math.ceil(total * 0.2);
        const cooldownCount = Math.ceil(total * 0.2);

        return {
            warmup: filtered.slice(0, warmupCount),
            main: filtered.slice(warmupCount, total - cooldownCount),
            cooldown: filtered.slice(total - cooldownCount)
        };
    };

    const groupedExercises = groupExercisesByPhase();

    const toggleComplete = (exerciseId) => {
        setCompletedExercises(prev => ({
            ...prev,
            [exerciseId]: !prev[exerciseId]
        }));
    };

    const calculateTotalStats = () => {
        const allExercises = [...groupedExercises.warmup, ...groupedExercises.main, ...groupedExercises.cooldown];
        const totalTime = allExercises.reduce((sum, ex) => sum + (ex.thoiGian || 0), 0);
        const totalCalories = allExercises.reduce((sum, ex) => sum + (ex.kcal || 0), 0);
        const completedCount = Object.values(completedExercises).filter(Boolean).length;

        return { totalTime, totalCalories, completedCount, total: allExercises.length };
    };

    const stats = calculateTotalStats();

    const scrollToPhase = (phaseId) => {
        // Find position and scroll
        let yOffset = 0;
        if (phaseId === 'warmup') yOffset = 0;
        else if (phaseId === 'main') yOffset = 300;
        else if (phaseId === 'cooldown') yOffset = 600;

        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>BÀI TẬP HÔM NAY</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#8A8C90" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm squat, plank..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={20} color="#8A8C90" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                {muscleGroups.map((group) => (
                    <TouchableOpacity
                        key={group}
                        style={[
                            styles.filterChip,
                            selectedFilter === group && styles.filterChipActive
                        ]}
                        onPress={() => setSelectedFilter(group)}
                    >
                        <Text style={[
                            styles.filterChipText,
                            selectedFilter === group && styles.filterChipTextActive
                        ]}>
                            {group}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderTimeline = (phase, phaseExercises) => {
        const phaseConfig = PHASES.find(p => p.id === phase);
        if (!phaseExercises || phaseExercises.length === 0) return null;

        return (
            <View style={styles.timelineBlock} key={phase}>
                {/* Timeline Header */}
                <View style={styles.timelineHeader}>
                    <View style={[styles.phaseIcon, { backgroundColor: phaseConfig.color + '20' }]}>
                        <MaterialIcons name={phaseConfig.icon} size={20} color={phaseConfig.color} />
                    </View>
                    <Text style={styles.phaseLabel}>{phaseConfig.label}</Text>
                    <Text style={styles.phaseCount}>{phaseExercises.length} bài</Text>
                </View>

                {/* Timeline Line with Dots */}
                <View style={styles.timelineLine}>
                    <View style={[styles.timelineBar, { backgroundColor: phaseConfig.color }]} />
                    {phaseExercises.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.timelineDot,
                                {
                                    backgroundColor: phaseConfig.color,
                                    left: `${(index / Math.max(phaseExercises.length - 1, 1)) * 100}%`
                                }
                            ]}
                        >
                            <Text style={styles.dotNumber}>{index + 1}</Text>
                        </View>
                    ))}
                </View>

                {/* Exercise Grid Cards */}
                <View style={styles.exerciseGrid}>
                    {phaseExercises.map((exercise, index) => renderExerciseCard(exercise, index, phaseConfig.color))}
                </View>
            </View>
        );
    };

    const renderExerciseCard = (exercise, index, phaseColor) => {
        const isCompleted = completedExercises[exercise._id];
        const progress = isCompleted ? 100 : 0;

        return (
            <Animated.View
                key={exercise._id}
                style={[
                    styles.exerciseCard,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                ]}
            >
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
                    activeOpacity={0.8}
                >
                    {/* Left: Thumbnail */}
                    <View style={styles.cardLeft}>
                        <View style={styles.thumbnail}>
                            <MaterialIcons name="fitness-center" size={40} color={phaseColor} />
                        </View>
                        <View style={[styles.completeBadge, isCompleted && styles.completeBadgeActive]}>
                            <MaterialIcons
                                name={isCompleted ? "check-circle" : "radio-button-unchecked"}
                                size={20}
                                color={isCompleted ? phaseColor : "#666"}
                            />
                        </View>
                    </View>

                    {/* Right: Details */}
                    <View style={styles.cardRight}>
                        <Text style={styles.exerciseName} numberOfLines={2}>{exercise.tenBaiTap}</Text>

                        <View style={styles.exerciseMetrics}>
                            <View style={[styles.metricBadge, { backgroundColor: '#667eea20' }]}>
                                <MaterialIcons name="repeat" size={14} color="#667eea" />
                                <Text style={styles.metricText}>{exercise.soSet || 3}×{exercise.soLanLap || 10}</Text>
                            </View>

                            <View style={[styles.metricBadge, { backgroundColor: '#FF980020' }]}>
                                <MaterialIcons name="local-fire-department" size={14} color="#FF9800" />
                                <Text style={styles.metricText}>{exercise.kcal || 150} kcal</Text>
                            </View>
                        </View>

                        <View style={styles.restTimer}>
                            <MaterialIcons name="timer" size={14} color="#2196F3" />
                            <Text style={styles.restText}>Nghỉ {exercise.thoiGianNghi || 60}s</Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: phaseColor }]} />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.completeButton, isCompleted && { backgroundColor: phaseColor }]}
                                onPress={() => toggleComplete(exercise._id)}
                            >
                                <MaterialIcons name={isCompleted ? "check" : "play-arrow"} size={16} color="#fff" />
                                <Text style={styles.completeButtonText}>
                                    {isCompleted ? 'Hoàn thành' : 'Bắt đầu'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderFooter = () => (
        <View style={styles.footer}>
            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <MaterialIcons name="access-time" size={20} color="#00E676" />
                    <Text style={styles.statValue}>{stats.totalTime}</Text>
                    <Text style={styles.statLabel}>phút</Text>
                </View>

                <View style={styles.statCard}>
                    <MaterialIcons name="local-fire-department" size={20} color="#FF9800" />
                    <Text style={styles.statValue}>{stats.totalCalories}</Text>
                    <Text style={styles.statLabel}>kcal</Text>
                </View>

                <View style={styles.statCard}>
                    <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
                    <Text style={styles.statValue}>{stats.completedCount}/{stats.total}</Text>
                    <Text style={styles.statLabel}>hoàn thành</Text>
                </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate('WorkoutTracking')}
            >
                <Text style={styles.ctaButtonText}>BẮT ĐẦU BUỔI TẬP</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Streak Badge */}
            <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 5 Ngày Liên Tiếp</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#0a0a0a' }]}>
                <ActivityIndicator size="large" color="#00E676" />
                <Text style={styles.loadingText}>Đang tải bài tập...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderHeader()}

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E676" />
                }
            >
                {renderTimeline('warmup', groupedExercises.warmup)}
                {renderTimeline('main', groupedExercises.main)}
                {renderTimeline('cooldown', groupedExercises.cooldown)}
            </ScrollView>

            {renderFooter()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#8A8C90',
    },

    // Header Styles
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        letterSpacing: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 8,
    },
    filterContainer: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    filterChipActive: {
        backgroundColor: '#00E676',
        borderColor: '#00E676',
    },
    filterChipText: {
        fontSize: 13,
        color: '#8A8C90',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#000000',
        fontWeight: '600',
    },

    // Content Styles
    content: {
        flex: 1,
    },

    // Timeline Styles
    timelineBlock: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    phaseIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    phaseLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
    },
    phaseCount: {
        fontSize: 12,
        color: '#8A8C90',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timelineLine: {
        height: 40,
        marginBottom: 16,
        position: 'relative',
    },
    timelineBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 19,
        height: 2,
    },
    timelineDot: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        top: 4,
        marginLeft: -16,
        borderWidth: 3,
        borderColor: '#0a0a0a',
    },
    dotNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },

    // Exercise Grid Styles
    exerciseGrid: {
        gap: 12,
    },
    exerciseCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    cardContent: {
        flexDirection: 'row',
    },
    cardLeft: {
        width: '40%',
        marginRight: 12,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 1.5,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        padding: 2,
    },
    completeBadgeActive: {
        backgroundColor: '#00E67620',
    },
    cardRight: {
        flex: 1,
        justifyContent: 'space-between',
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    exerciseMetrics: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    metricBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    metricText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    restTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    restText: {
        fontSize: 11,
        color: '#2196F3',
        fontWeight: '500',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: '#2a2a2a',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    completeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 4,
    },
    completeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Footer Styles
    footer: {
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statCard: {
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 90,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#8A8C90',
        marginTop: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00E676',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 0.5,
    },
    streakBadge: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    streakText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFD700',
    },
});

export default ExercisesScreen;
