import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const ExercisesScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState([]);
    const [workoutHistory, setWorkoutHistory] = useState([]);

    const categories = [
        { id: 'all', name: 'Tất cả', icon: 'apps-outline' },
        { id: 'chest', name: 'Ngực', icon: 'fitness-outline' },
        { id: 'back', name: 'Lưng', icon: 'body-outline' },
        { id: 'legs', name: 'Chân', icon: 'walk-outline' },
        { id: 'arms', name: 'Tay', icon: 'hand-left-outline' },
        { id: 'core', name: 'Core', icon: 'ellipse-outline' },
        { id: 'cardio', name: 'Cardio', icon: 'heart-outline' }
    ];

    useEffect(() => {
        fetchExercises();
        fetchWorkoutHistory();
    }, []);

    const fetchExercises = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllBaiTap();
            setExercises(data || []);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách bài tập');
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkoutHistory = async () => {
        try {
            const data = await apiService.getMyWorkoutHistory();
            setWorkoutHistory(data || []);
        } catch (error) {
            console.error('Error fetching workout history:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchExercises(), fetchWorkoutHistory()]);
        setRefreshing(false);
    };

    const getCategoryIcon = (category) => {
        const categoryMap = {
            'Ngực': 'fitness-outline',
            'Lưng': 'body-outline',
            'Chân': 'walk-outline',
            'Tay': 'hand-left-outline',
            'Core': 'ellipse-outline',
            'Cardio': 'heart-outline'
        };
        return categoryMap[category] || 'fitness-outline';
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Dễ': return '#4CAF50';
            case 'Trung bình': return '#FF9800';
            case 'Khó': return '#F44336';
            default: return colors.primary;
        }
    };

    const getDifficultyIcon = (difficulty) => {
        switch (difficulty) {
            case 'Dễ': return 'checkmark-circle-outline';
            case 'Trung bình': return 'alert-circle-outline';
            case 'Khó': return 'warning-outline';
            default: return 'help-circle-outline';
        }
    };

    const filteredExercises = exercises.filter(exercise => {
        const matchesCategory = selectedCategory === 'Tất cả' || exercise.nhomCo === selectedCategory;
        const matchesSearch = exercise.tenBaiTap.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exercise.moTa.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const renderCategoryFilter = () => (
        <View style={styles.categoryContainer}>
            <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryButton,
                            {
                                backgroundColor: selectedCategory === item.name ? colors.primary : colors.surface,
                                borderColor: selectedCategory === item.name ? colors.primary : colors.border
                            }
                        ]}
                        onPress={() => setSelectedCategory(item.name)}
                    >
                        <Ionicons
                            name={item.icon}
                            size={20}
                            color={selectedCategory === item.name ? '#fff' : colors.textSecondary}
                        />
                        <Text
                            style={[
                                styles.categoryText,
                                {
                                    color: selectedCategory === item.name ? '#fff' : colors.textSecondary
                                }
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const renderSearchBar = () => (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Tìm kiếm bài tập..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderExerciseCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.exerciseCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
        >
            <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIconContainer}>
                    <Ionicons
                        name={getCategoryIcon(item.nhomCo)}
                        size={24}
                        color={colors.primary}
                    />
                </View>
                <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                        {item.tenBaiTap}
                    </Text>
                    <Text style={[styles.exerciseCategory, { color: colors.textSecondary }]}>
                        {item.nhomCo}
                    </Text>
                </View>
                <View style={styles.exerciseBadges}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.mucDo) }]}>
                        <Ionicons
                            name={getDifficultyIcon(item.mucDo)}
                            size={12}
                            color="#fff"
                        />
                        <Text style={styles.difficultyText}>{item.mucDo}</Text>
                    </View>
                </View>
            </View>

            <Text style={[styles.exerciseDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.moTa}
            </Text>

            <View style={styles.exerciseStats}>
                <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {item.thoiGian} phút
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {item.soLanLap} lần
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {item.soSet} set
                    </Text>
                </View>
            </View>

            <View style={styles.exerciseActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
                >
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Xem chi tiết</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                    onPress={() => navigation.navigate('WorkoutTracking')}
                >
                    <Ionicons name="play-outline" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Bắt đầu</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Không tìm thấy bài tập
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Đang tải bài tập...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Bài Tập
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {filteredExercises.length} bài tập có sẵn
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('WorkoutTracking')}
                    >
                        <Ionicons name="time-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            {renderSearchBar()}

            {/* Category Filters */}
            {renderCategoryFilter()}

            {/* Exercises List */}
            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item._id}
                renderItem={renderExerciseCard}
                contentContainerStyle={styles.exercisesList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    categoryContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    exercisesList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    exerciseCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    exerciseIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    exerciseCategory: {
        fontSize: 14,
    },
    exerciseBadges: {
        flexDirection: 'row',
    },
    difficultyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    exerciseDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    exerciseStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 6,
        fontSize: 12,
    },
    exerciseActions: {
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
    },
});

export default ExercisesScreen;