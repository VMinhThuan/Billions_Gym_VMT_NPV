import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Linking,
    Alert,
    FlatList,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import apiService from '../api/apiService';

const { width, height } = Dimensions.get('window');
const VISIBLE_COUNT = 4;

const WorkoutPlansScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [topExercises, setTopExercises] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [watchedExercises, setWatchedExercises] = useState({});
    const [pts, setPts] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const bannerFlatListRef = useRef(null);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [currentVideoId, setCurrentVideoId] = useState('');

    useEffect(() => {
        loadData();
        loadWatchProgress();
    }, []);

    // Auto-scroll banner every 3 seconds
    useEffect(() => {
        if (topExercises.length === 0) return;

        const interval = setInterval(() => {
            setCurrentBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % topExercises.length;
                bannerFlatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
                return nextIndex;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [topExercises.length]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load session templates (playlists)
            const templatesResponse = await apiService.apiCall('/session-templates/public', 'GET', null, false);
            let templatesData = [];
            if (Array.isArray(templatesResponse)) {
                templatesData = templatesResponse;
            } else if (templatesResponse?.data && Array.isArray(templatesResponse.data)) {
                templatesData = templatesResponse.data;
            }
            setTemplates(templatesData);

            // Load top 4 exercises by rating
            const exercisesResponse = await apiService.apiCall('/baitap', 'GET', null, false);
            let exercisesData = [];
            if (Array.isArray(exercisesResponse)) {
                exercisesData = exercisesResponse;
            } else if (exercisesResponse?.data && Array.isArray(exercisesResponse.data)) {
                exercisesData = exercisesResponse.data;
            }

            // Sort by rating and get top 4
            const sortedExercises = exercisesData
                .filter(ex => ex.ratings?.averageRating > 0)
                .sort((a, b) => (b.ratings?.averageRating || 0) - (a.ratings?.averageRating || 0))
                .slice(0, 4);

            console.log('🏆 Top 4 exercises:', sortedExercises.map(ex => ({
                name: ex.tenBaiTap,
                rating: ex.ratings?.averageRating,
                hinhAnh: ex.hinhAnh,
                hinhAnhMinhHoa: ex.hinhAnhMinhHoa?.[0]
            })));

            setTopExercises(sortedExercises);

            // Bỏ qua API /user/pt vì thường xuyên timeout và không bắt buộc
            // FlatList đã có ListEmptyComponent để hiển thị "Chưa có huấn luyện viên" khi rỗng
            // Nếu cần load PT, có thể dùng getAllPT() từ HomeScreen sau này
            setPts([]);

        } catch (error) {
            console.error('Error loading workout data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWatchProgress = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const result = {};

            for (const key of keys) {
                if (key.startsWith('watched_exercises_')) {
                    const templateId = key.replace('watched_exercises_', '');
                    const data = await AsyncStorage.getItem(key);
                    if (data) {
                        result[templateId] = new Set(JSON.parse(data));
                    }
                }
            }

            setWatchedExercises(result);
        } catch (error) {
            console.error('Error loading watch progress:', error);
        }
    };

    const markAsWatched = async (templateId, exerciseId) => {
        try {
            const key = `watched_exercises_${templateId}`;
            const existing = await AsyncStorage.getItem(key);
            const watchedSet = existing ? new Set(JSON.parse(existing)) : new Set();
            watchedSet.add(exerciseId);

            await AsyncStorage.setItem(key, JSON.stringify([...watchedSet]));

            setWatchedExercises(prev => ({
                ...prev,
                [templateId]: watchedSet
            }));
        } catch (error) {
            console.error('Error marking as watched:', error);
        }
    };

    const getProgress = (template) => {
        const totalVideos = (template.baiTap && template.baiTap.length) || 0;
        if (totalVideos === 0) return 0;

        const watchedSet = watchedExercises[template._id];
        const watchedCount = watchedSet ? watchedSet.size : 0;
        return Math.min(Math.round((watchedCount / totalVideos) * 100), 100);
    };

    const handleTemplateClick = async (template) => {
        if (selectedTemplate?._id === template._id) {
            setSelectedTemplate(null);
            setSelectedExercise(null);
            setSearchTerm('');
            setFilterDifficulty('all');
            return;
        }

        try {
            const detail = await apiService.apiCall(
                `/session-templates/public/${template._id}?populateExercises=true`,
                'GET',
                null,
                false
            );

            setSelectedTemplate(detail);
            if (detail.baiTap && detail.baiTap.length > 0) {
                setSelectedExercise(detail.baiTap[0]);
            }
        } catch (error) {
            console.error('Error loading template:', error);
            Alert.alert('Lỗi', 'Không thể tải chi tiết khóa học');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getVideoUrl = (exercise) => {
        if (!exercise) return null;

        if (exercise.type === 'external_link' && exercise.source_url) {
            if (exercise.source_url.includes('youtube.com') || exercise.source_url.includes('youtu.be')) {
                const videoId = exercise.source_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
                return videoId ? `https://www.youtube.com/embed/${videoId}` : exercise.source_url;
            }
            return exercise.source_url;
        }

        if (exercise.videoHuongDan) {
            return exercise.videoHuongDan;
        }

        return null;
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = {
            'DE': 'Dễ',
            'TRUNG_BINH': 'Trung bình',
            'KHO': 'Khó'
        };
        return labels[difficulty] || difficulty;
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'DE': '#10b981',
            'TRUNG_BINH': '#f59e0b',
            'KHO': '#ef4444'
        };
        return colors[difficulty] || '#6b7280';
    };

    const filteredExercises = selectedTemplate?.baiTap ? selectedTemplate.baiTap.filter(exercise => {
        const matchesSearch = !searchTerm || exercise.tenBaiTap?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || exercise.mucDoKho === filterDifficulty;
        return matchesSearch && matchesDifficulty;
    }) : [];

    const openVideo = (url) => {
        if (url) {
            console.log('🎥 Opening video URL:', url);

            // Extract video ID and create embed URL
            let videoId = '';
            let originalUrl = url;

            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1]?.split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0];
            }

            if (videoId) {
                console.log('📹 Extracted video ID:', videoId);
                setCurrentVideoId(videoId);
                setVideoModalVisible(true);
            } else {
                // Nếu không phải YouTube, thử mở link trực tiếp
                Alert.alert(
                    'Mở video',
                    'Không thể phát video trong app. Bạn có muốn mở trong trình duyệt?',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Mở',
                            onPress: () => {
                                Linking.openURL(url).catch(err => {
                                    console.error('Error opening URL:', err);
                                    Alert.alert('Lỗi', 'Không thể mở link');
                                });
                            }
                        }
                    ]
                );
            }
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === 0) return '0s';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}p `;
        if (secs > 0 || result === '') result += `${secs}s`;

        return result.trim();
    };

    // Helper function to get full image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return 'https://via.placeholder.com/400x180';
        if (imageUrl.startsWith('http')) return imageUrl;
        return `http://192.168.1.8:4000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    };

    const handleBannerScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (width * 0.9));
        setCurrentBannerIndex(index);
    };

    const renderTopExercises = () => (
        <View style={styles.topExercisesContainer}>
            <FlatList
                ref={bannerFlatListRef}
                horizontal
                data={topExercises}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToInterval={width * 0.9 + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.exerciseBannerList}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        bannerFlatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.exerciseBanner}
                        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item._id })}
                        activeOpacity={0.9}
                    >
                        {/* Blurred Background Image */}
                        <Image
                            source={{ uri: getImageUrl(item.hinhAnh || item.hinhAnhMinhHoa?.[0]) }}
                            style={styles.exerciseBannerImage}
                            resizeMode="cover"
                            blurRadius={3}
                        />

                        {/* Dark Overlay */}
                        <View style={styles.exerciseBannerOverlay} />

                        {/* Content Overlay */}
                        <View style={styles.exerciseBannerContentOverlay}>
                            {/* Title */}
                            <Text style={styles.exerciseBannerTitleOverlay} numberOfLines={2}>
                                {item.tenBaiTap}
                            </Text>

                            {/* Stats Row */}
                            <View style={styles.exerciseBannerStatsRow}>
                                {/* Rating */}
                                <View style={styles.ratingBadgeOverlay}>
                                    <MaterialIcons name="star" size={18} color="#FFD700" />
                                    <Text style={styles.ratingTextOverlay}>
                                        {item.ratings?.averageRating?.toFixed(1) || '0.0'}
                                    </Text>
                                </View>

                                {/* Time */}
                                {item.thoiGian && (
                                    <View style={styles.exerciseBannerStatOverlay}>
                                        <MaterialIcons name="access-time" size={16} color="#fff" />
                                        <Text style={styles.exerciseBannerStatTextOverlay}>
                                            {formatTime(item.thoiGian)}
                                        </Text>
                                    </View>
                                )}

                                {/* Calories */}
                                {item.kcal && (
                                    <View style={styles.exerciseBannerStatOverlay}>
                                        <MaterialIcons name="local-fire-department" size={16} color="#da2128" />
                                        <Text style={styles.exerciseBannerStatTextOverlay}>
                                            {item.kcal} kcal
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyBanner}>
                        <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
                    </View>
                }
            />

            {/* Pagination Dots */}
            {topExercises.length > 1 && (
                <View style={styles.paginationContainer}>
                    {topExercises.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                index === currentBannerIndex && styles.paginationDotActive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );

    const renderTemplatesList = () => (
        <View style={styles.templatesSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Các khóa học và bài tập phổ biến</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAllLink}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.templatesList}>
                {templates.slice(0, VISIBLE_COUNT).map(template => (
                    <View key={template._id} style={styles.templateCard}>
                        <TouchableOpacity
                            style={styles.templateHeader}
                            onPress={() => handleTemplateClick(template)}
                        >
                            <View style={styles.templateHeaderContent}>
                                <View style={styles.thumbnailContainer}>
                                    <Image
                                        source={{ uri: template.hinhAnh || 'https://via.placeholder.com/160x90' }}
                                        style={styles.thumbnail}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.playIconOverlay}>
                                        <View style={styles.playIconCircle}>
                                            <MaterialIcons name="play-arrow" size={20} color="#fff" />
                                        </View>
                                    </View>
                                    <View style={styles.videoCountBadge}>
                                        <Text style={styles.videoCountText}>
                                            {(template.baiTap && template.baiTap.length) || 0} videos
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.templateInfo}>
                                    <Text style={styles.templateName}>{template.ten}</Text>
                                    <Text style={styles.templateDescription} numberOfLines={2}>
                                        {template.moTa || 'Xem danh sách bài tập'}
                                    </Text>

                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressHeader}>
                                            <Text style={styles.progressLabel}>Tiến độ</Text>
                                            <Text style={styles.progressPercent}>{getProgress(template)}%</Text>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                            <View
                                                style={[styles.progressBarFill, { width: `${getProgress(template)}%` }]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <MaterialIcons
                                    name={selectedTemplate?._id === template._id ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                    size={24}
                                    color="#8A8C90"
                                />
                            </View>
                        </TouchableOpacity>

                        {selectedTemplate?._id === template._id && (
                            <View style={styles.expandedContent}>
                                {/* Search and Filter */}
                                <View style={styles.searchFilterRow}>
                                    <View style={styles.searchBox}>
                                        <MaterialIcons name="search" size={20} color="#8A8C90" />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Tìm kiếm bài tập..."
                                            placeholderTextColor="#666"
                                            value={searchTerm}
                                            onChangeText={setSearchTerm}
                                        />
                                    </View>
                                    <View style={styles.filterPicker}>
                                        <TouchableOpacity
                                            style={styles.pickerButton}
                                            onPress={() => {
                                                Alert.alert(
                                                    'Chọn mức độ',
                                                    '',
                                                    [
                                                        { text: 'Tất cả mức độ', onPress: () => setFilterDifficulty('all') },
                                                        { text: 'Dễ', onPress: () => setFilterDifficulty('DE') },
                                                        { text: 'Trung bình', onPress: () => setFilterDifficulty('TRUNG_BINH') },
                                                        { text: 'Khó', onPress: () => setFilterDifficulty('KHO') },
                                                        { text: 'Hủy', style: 'cancel' }
                                                    ]
                                                );
                                            }}
                                        >
                                            <Text style={styles.pickerText}>
                                                {filterDifficulty === 'all' ? 'Tất cả mức độ' : getDifficultyLabel(filterDifficulty)}
                                            </Text>
                                            <MaterialIcons name="arrow-drop-down" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Video Player Placeholder */}
                                <View style={styles.videoSection}>
                                    {selectedExercise && getVideoUrl(selectedExercise) ? (
                                        <TouchableOpacity
                                            style={styles.videoPlaceholder}
                                            onPress={() => openVideo(getVideoUrl(selectedExercise))}
                                        >
                                            <Image
                                                source={{ uri: selectedExercise.hinhAnh || 'https://via.placeholder.com/800x450' }}
                                                style={styles.videoThumbnail}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.videoPlayOverlay}>
                                                <View style={styles.videoPlayButton}>
                                                    <MaterialIcons name="play-arrow" size={48} color="#fff" />
                                                </View>
                                            </View>
                                            <View style={styles.videoInfo}>
                                                <Text style={styles.videoTitle}>{selectedExercise.tenBaiTap}</Text>
                                                <View style={styles.videoBadges}>
                                                    {selectedExercise.mucDoKho && (
                                                        <View
                                                            style={[
                                                                styles.videoBadge,
                                                                { backgroundColor: getDifficultyColor(selectedExercise.mucDoKho) }
                                                            ]}
                                                        >
                                                            <Text style={styles.videoBadgeText}>
                                                                {getDifficultyLabel(selectedExercise.mucDoKho)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {selectedExercise.thoiGian && (
                                                        <View style={[styles.videoBadge, { backgroundColor: '#2196F3' }]}>
                                                            <MaterialIcons name="timer" size={14} color="#fff" />
                                                            <Text style={styles.videoBadgeText}>{selectedExercise.thoiGian}s</Text>
                                                        </View>
                                                    )}
                                                    {selectedExercise.kcal && (
                                                        <View style={[styles.videoBadge, { backgroundColor: '#FF9800' }]}>
                                                            <MaterialIcons name="local-fire-department" size={14} color="#fff" />
                                                            <Text style={styles.videoBadgeText}>{selectedExercise.kcal} kcal</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {selectedExercise.moTa && (
                                                    <Text style={styles.videoDescription} numberOfLines={2}>
                                                        {selectedExercise.moTa}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.videoPlaceholder}>
                                            <Text style={styles.videoPlaceholderText}>
                                                Chọn một bài tập để xem video
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Exercise List */}
                                <View style={styles.exerciseList}>
                                    <Text style={styles.exerciseListTitle}>
                                        Danh sách bài tập ({filteredExercises.length})
                                    </Text>
                                    <ScrollView style={styles.exerciseScrollView}>
                                        {filteredExercises.map((exercise, index) => (
                                            <TouchableOpacity
                                                key={exercise._id || index}
                                                style={[
                                                    styles.exerciseItem,
                                                    selectedExercise?._id === exercise._id && styles.exerciseItemActive
                                                ]}
                                                onPress={() => {
                                                    setSelectedExercise(exercise);
                                                    if (selectedTemplate && exercise._id) {
                                                        markAsWatched(selectedTemplate._id, exercise._id);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                                                <Image
                                                    source={{
                                                        uri: exercise.hinhAnh || exercise.hinhAnhMinhHoa?.[0] || 'https://via.placeholder.com/64x48'
                                                    }}
                                                    style={styles.exerciseThumbnail}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.exerciseItemInfo}>
                                                    <Text style={styles.exerciseItemTitle} numberOfLines={1}>
                                                        {exercise.tenBaiTap}
                                                    </Text>
                                                    <View style={styles.exerciseItemMeta}>
                                                        {exercise.thoiGian && (
                                                            <Text style={styles.exerciseItemMetaText}>
                                                                {exercise.thoiGian}s
                                                            </Text>
                                                        )}
                                                        {exercise.mucDoKho && (
                                                            <Text
                                                                style={[
                                                                    styles.exerciseItemMetaText,
                                                                    { color: getDifficultyColor(exercise.mucDoKho) }
                                                                ]}
                                                            >
                                                                {getDifficultyLabel(exercise.mucDoKho)}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                                {selectedTemplate && watchedExercises[selectedTemplate._id]?.has(exercise._id) && (
                                                    <MaterialIcons name="check-circle" size={20} color="#10b981" />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );

    const renderPTList = () => (
        <View style={styles.ptSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Huấn Luyện Viên Nổi Bật</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAllLink}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                horizontal
                data={pts}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ptListHorizontal}
                renderItem={({ item: pt }) => (
                    <View style={styles.ptCard}>
                        <View style={styles.ptCardHeader}>
                            <Image
                                source={{ uri: pt.anhDaiDien || 'https://via.placeholder.com/80' }}
                                style={styles.ptAvatar}
                                resizeMode="cover"
                            />
                            <View style={styles.ptInfo}>
                                <Text style={styles.ptName} numberOfLines={1}>{pt.hoTen}</Text>
                                <Text style={styles.ptSpecialty} numberOfLines={1}>{pt.chuyenMon || 'Gym Trainer'}</Text>
                            </View>
                        </View>
                        <View style={styles.ptActions}>
                            <TouchableOpacity style={styles.ptProfileButton}>
                                <Text style={styles.ptProfileButtonText}>Xem hồ sơ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ptMessageButton}>
                                <MaterialIcons name="chat" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyPTList}>
                        <Text style={styles.emptyText}>Chưa có huấn luyện viên</Text>
                    </View>
                }
            />
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#da2128" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E676" />
                }
            >
                {renderTopExercises()}
                {renderTemplatesList()}
                {renderPTList()}
            </ScrollView>

            {/* Video Player Modal */}
            <Modal
                visible={videoModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setVideoModalVisible(false)}
            >
                <SafeAreaView style={styles.videoModalContainer}>
                    <View style={styles.videoModalHeader}>
                        <TouchableOpacity
                            onPress={() => setVideoModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <MaterialIcons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.videoModalTitle}>Video Player</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (currentVideoId) {
                                        // Thử mở YouTube app trước
                                        const youtubeAppUrl = `vnd.youtube:${currentVideoId}`;
                                        const youtubeWebUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;

                                        Linking.canOpenURL(youtubeAppUrl).then(supported => {
                                            if (supported) {
                                                return Linking.openURL(youtubeAppUrl);
                                            } else {
                                                return Linking.openURL(youtubeWebUrl);
                                            }
                                        }).catch(err => {
                                            console.error('Error opening YouTube:', err);
                                            // Fallback: mở web
                                            Linking.openURL(youtubeWebUrl).catch(() => {
                                                Alert.alert('Lỗi', 'Không thể mở YouTube');
                                            });
                                        });
                                    }
                                }}
                                style={[styles.openYouTubeButton, { marginRight: 8 }]}
                            >
                                <MaterialIcons name="open-in-new" size={20} color="#fff" />
                                <Text style={{ color: '#fff', marginLeft: 4, fontSize: 12 }}>YouTube</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {currentVideoId && (
                        <View style={styles.videoPlayerContainer}>
                            <WebView
                                source={{
                                    html: `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                            <style>
                                                * {
                                                    margin: 0;
                                                    padding: 0;
                                                    box-sizing: border-box;
                                                }
                                                html, body {
                                                    width: 100%;
                                                    height: 100%;
                                                    overflow: hidden;
                                                    background-color: #000;
                                                }
                                                .video-wrapper {
                                                    position: relative;
                                                    width: 100%;
                                                    height: 100%;
                                                    display: flex;
                                                    justify-content: center;
                                                    align-items: center;
                                                }
                                                iframe {
                                                    width: 100%;
                                                    height: 100%;
                                                    border: none;
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="video-wrapper">
                                                <iframe
                                                    id="youtube-iframe"
                                                    src="https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&fs=1&enablejsapi=1&iv_load_policy=3&cc_load_policy=0"
                                                    frameborder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowfullscreen
                                                    webkitallowfullscreen
                                                    mozallowfullscreen
                                                ></iframe>
                                            </div>
                                        </body>
                                        </html>
                                    `
                                }}
                                style={styles.videoWebView}
                                allowsFullscreenVideo={true}
                                mediaPlaybackRequiresUserAction={false}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                startInLoadingState={true}
                                scalesPageToFit={false}
                                mixedContentMode="always"
                                onError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent;
                                    console.error('WebView error:', nativeEvent);
                                    Alert.alert(
                                        'Lỗi phát video',
                                        'Không thể phát video trong app. Bạn có muốn mở trong YouTube?',
                                        [
                                            { text: 'Hủy', style: 'cancel' },
                                            {
                                                text: 'Mở YouTube',
                                                onPress: () => {
                                                    if (currentVideoId) {
                                                        const youtubeUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
                                                        setVideoModalVisible(false);
                                                        Linking.openURL(youtubeUrl).catch(err => {
                                                            console.error('Error opening YouTube:', err);
                                                            Alert.alert('Lỗi', 'Không thể mở YouTube');
                                                        });
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                                onHttpError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent;
                                    console.error('WebView HTTP error:', nativeEvent);
                                    if (nativeEvent.statusCode >= 400) {
                                        Alert.alert(
                                            'Lỗi phát video',
                                            'Không thể tải video. Bạn có muốn mở trong YouTube?',
                                            [
                                                { text: 'Hủy', style: 'cancel' },
                                                {
                                                    text: 'Mở YouTube',
                                                    onPress: () => {
                                                        if (currentVideoId) {
                                                            const youtubeUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
                                                            setVideoModalVisible(false);
                                                            Linking.openURL(youtubeUrl).catch(err => {
                                                                console.error('Error opening YouTube:', err);
                                                            });
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                    }
                                }}
                            />
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
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
        color: '#8A8C90',
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },

    // Top Exercises Styles
    topExercisesContainer: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    exerciseBannerList: {
        paddingHorizontal: (width - (width * 0.9)) / 2,
    },
    exerciseBanner: {
        width: width * 0.9,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    exerciseBannerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    exerciseBannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    exerciseBannerContentOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        justifyContent: 'flex-end',
    },
    exerciseBannerTitleOverlay: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    exerciseBannerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ratingBadgeOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ratingTextOverlay: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFD700',
    },
    exerciseBannerStatOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    exerciseBannerStatTextOverlay: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },

    // Pagination Dots
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3a3a3a',
        transition: 'all 0.3s ease',
    },
    paginationDotActive: {
        width: 24,
        backgroundColor: '#da2128',
    },
    emptyBanner: {
        width: width * 0.9,
        height: 200,
        borderRadius: 16,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
    },

    // Templates Section
    templatesSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    viewAllLink: {
        fontSize: 13,
        color: '#da2128',
        fontWeight: '500',
    },
    templatesList: {
        gap: 12,
    },
    templateCard: {
        backgroundColor: '#141414',
        borderRadius: 12,
        overflow: 'hidden',
    },
    templateHeader: {
        padding: 12,
    },
    templateHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    thumbnailContainer: {
        width: 140,
        height: 84,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    playIconOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoCountBadge: {
        position: 'absolute',
        left: 8,
        bottom: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    videoCountText: {
        color: '#fff',
        fontSize: 11,
    },
    templateInfo: {
        flex: 1,
    },
    templateName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    templateDescription: {
        fontSize: 13,
        color: '#8A8C90',
        marginBottom: 8,
    },
    progressContainer: {
        marginTop: 4,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressLabel: {
        fontSize: 11,
        color: '#8A8C90',
    },
    progressPercent: {
        fontSize: 11,
        color: '#8A8C90',
    },
    progressBarBg: {
        height: 4,
        backgroundColor: '#2a2a2a',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#da2128',
        borderRadius: 2,
    },
    expandedContent: {
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
        padding: 16,
    },
    searchFilterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#fff',
    },
    filterPicker: {
        minWidth: 140,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    pickerText: {
        fontSize: 14,
        color: '#fff',
    },
    videoSection: {
        marginBottom: 16,
    },
    videoPlaceholder: {
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 200,
    },
    videoThumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    videoPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoPlayButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoInfo: {
        padding: 12,
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    videoBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    videoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    videoBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    videoDescription: {
        fontSize: 13,
        color: '#8A8C90',
        lineHeight: 18,
    },
    videoPlaceholderText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingVertical: 80,
    },
    exerciseList: {
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        padding: 12,
    },
    exerciseListTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    exerciseScrollView: {
        maxHeight: 400,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    exerciseItemActive: {
        backgroundColor: 'rgba(218, 33, 40, 0.15)',
        borderWidth: 1,
        borderColor: '#da2128',
    },
    exerciseNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        width: 24,
        textAlign: 'center',
    },
    exerciseThumbnail: {
        width: 56,
        height: 42,
        borderRadius: 6,
    },
    exerciseItemInfo: {
        flex: 1,
    },
    exerciseItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    exerciseItemMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    exerciseItemMetaText: {
        fontSize: 11,
        color: '#8A8C90',
    },

    // PT Section
    ptSection: {
        paddingTop: 24,
        paddingBottom: 100,
    },
    ptListHorizontal: {
        paddingHorizontal: 16,
        gap: 12,
    },
    ptCard: {
        backgroundColor: '#141414',
        borderRadius: 12,
        padding: 12,
        width: 200,
        marginRight: 12,
    },
    ptCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    ptAvatar: {
        width: 64,
        height: 64,
        borderRadius: 8,
    },
    ptInfo: {
        flex: 1,
    },
    ptName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    ptSpecialty: {
        fontSize: 12,
        color: '#8A8C90',
    },
    ptActions: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-end',
    },
    ptProfileButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#da2128',
    },
    ptProfileButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#da2128',
    },
    ptMessageButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
    },
    emptyPTList: {
        width: 200,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
    },

    // Video Modal Styles
    videoModalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#141414',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    closeButton: {
        padding: 8,
        marginRight: 12,
    },
    videoModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
    },
    openYouTubeButton: {
        padding: 8,
        marginLeft: 8,
    },
    videoPlayerContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoWebView: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
    },
});

export default WorkoutPlansScreen;
