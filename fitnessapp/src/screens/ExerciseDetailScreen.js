import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const ExerciseDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { exercise } = route.params;
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [isLoading, setIsLoading] = useState(false);

    const getMuscleGroupColor = (muscleGroup) => {
        const colorMap = {
            'Ngực': '#FF6B6B',
            'Lưng': '#4ECDC4',
            'Tay': '#45B7D1',
            'Chân': '#96CEB4',
            'Vai': '#FFEAA7',
            'Bụng': '#DDA0DD',
            'Toàn thân': '#98D8C8'
        };
        return colorMap[muscleGroup] || colors.primary;
    };

    const getMuscleGroupIcon = (muscleGroup) => {
        const iconMap = {
            'Ngực': 'fitness-outline',
            'Lưng': 'body-outline',
            'Tay': 'hand-left-outline',
            'Chân': 'walk-outline',
            'Vai': 'ellipse-outline',
            'Bụng': 'ellipse-outline',
            'Toàn thân': 'fitness-outline'
        };
        return iconMap[muscleGroup] || 'fitness-outline';
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

    const handleStartWorkout = async () => {
        try {
            setIsLoading(true);
            // Navigate to workout tracking screen
            navigation.navigate('WorkoutTracking', { exercise });
        } catch (error) {
            console.error('Error starting workout:', error);
            Alert.alert('Lỗi', 'Không thể bắt đầu bài tập');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWatchVideo = () => {
        if (exercise.videoURL) {
            Linking.openURL(exercise.videoURL);
        } else {
            Alert.alert('Thông báo', 'Video hướng dẫn chưa có sẵn');
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.background }]}
                onPress={() => {
                    console.log('Back button pressed');
                    try {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Exercises');
                        }
                    } catch (error) {
                        console.log('Navigation error:', error);
                        navigation.navigate('Exercises');
                    }
                }}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: colors.background }]}
                onPress={() => Alert.alert('Chia sẻ', 'Tính năng chia sẻ đang phát triển')}
            >
                <Ionicons name="share-outline" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );

    const renderExerciseInfo = () => (
        <View style={[styles.exerciseInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIconContainer}>
                    <Ionicons
                        name={getMuscleGroupIcon(exercise.nhomCo)}
                        size={32}
                        color={getMuscleGroupColor(exercise.nhomCo)}
                    />
                </View>
                <View style={styles.exerciseTitleContainer}>
                    <Text style={[styles.exerciseTitle, { color: colors.text }]}>
                        {exercise.tenBaiTap}
                    </Text>
                    <Text style={[styles.exerciseCategory, { color: colors.textSecondary }]}>
                        {exercise.nhomCo}
                    </Text>
                </View>
            </View>

            <View style={styles.exerciseBadges}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.mucDo) }]}>
                    <Ionicons
                        name={getDifficultyIcon(exercise.mucDo)}
                        size={16}
                        color="#fff"
                    />
                    <Text style={styles.difficultyText}>{exercise.mucDo}</Text>
                </View>
                <View style={[styles.muscleGroupBadge, { backgroundColor: getMuscleGroupColor(exercise.nhomCo) }]}>
                    <Text style={styles.muscleGroupText}>{exercise.nhomCo}</Text>
                </View>
            </View>
        </View>
    );

    const renderExerciseStats = () => (
        <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin bài tập</Text>
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{exercise.thoiGian}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thời gian (phút)</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="repeat-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{exercise.soLanLap}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Số lần lặp</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="layers-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{exercise.soSet}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Số set</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="flame-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>~{Math.round(exercise.thoiGian * 8)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
                </View>
            </View>
        </View>
    );

    const renderDescription = () => (
        <View style={[styles.descriptionContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
                {exercise.moTa}
            </Text>
        </View>
    );

    const renderInstructions = () => (
        <View style={[styles.instructionsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hướng dẫn thực hiện</Text>
            <Text style={[styles.instructions, { color: colors.textSecondary }]}>
                {exercise.huongDan}
            </Text>
        </View>
    );

    const renderVideoSection = () => (
        <View style={[styles.videoContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Video hướng dẫn</Text>
            <TouchableOpacity
                style={[styles.videoButton, { backgroundColor: colors.primary }]}
                onPress={handleWatchVideo}
            >
                <Ionicons name="play-circle-outline" size={24} color="#fff" />
                <Text style={styles.videoButtonText}>Xem video hướng dẫn</Text>
            </TouchableOpacity>
        </View>
    );

    const renderActionButtons = () => (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={[styles.startButton, { backgroundColor: colors.primary }]}
                onPress={handleStartWorkout}
                disabled={isLoading}
            >
                <Ionicons name="play-outline" size={20} color="#fff" />
                <Text style={styles.startButtonText}>
                    {isLoading ? 'Đang tải...' : 'Bắt đầu tập'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.addToPlanButton, { borderColor: colors.primary }]}
                onPress={() => Alert.alert('Thông báo', 'Tính năng thêm vào kế hoạch đang phát triển')}
            >
                <Ionicons name="add-outline" size={20} color={colors.primary} />
                <Text style={[styles.addToPlanButtonText, { color: colors.primary }]}>
                    Thêm vào kế hoạch
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {renderExerciseInfo()}
                {renderExerciseStats()}
                {renderDescription()}
                {renderInstructions()}
                {renderVideoSection()}
            </ScrollView>

            {renderActionButtons()}
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
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    exerciseInfo: {
        padding: 20,
        marginBottom: 16,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    exerciseIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    exerciseTitleContainer: {
        flex: 1,
    },
    exerciseTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    exerciseCategory: {
        fontSize: 16,
    },
    exerciseBadges: {
        flexDirection: 'row',
        gap: 12,
    },
    difficultyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    difficultyText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    muscleGroupBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    muscleGroupText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        padding: 20,
        marginBottom: 16,
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
    descriptionContainer: {
        padding: 20,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    instructionsContainer: {
        padding: 20,
        marginBottom: 16,
    },
    instructions: {
        fontSize: 16,
        lineHeight: 24,
    },
    videoContainer: {
        padding: 20,
        marginBottom: 16,
    },
    videoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    videoButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    actionButtonsContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    addToPlanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    addToPlanButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default ExerciseDetailScreen;