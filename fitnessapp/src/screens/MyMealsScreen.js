import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Modal,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';
import { WebView } from 'react-native-webview';

const MEAL_TYPES = [
    { key: 'buaSang', label: 'Bữa sáng', icon: '🌅' },
    { key: 'phu1', label: 'Bữa phụ 1', icon: '🍎' },
    { key: 'buaTrua', label: 'Bữa trưa', icon: '☀️' },
    { key: 'phu2', label: 'Bữa phụ 2', icon: '🥗' },
    { key: 'buaToi', label: 'Bữa tối', icon: '🌙' },
    { key: 'phu3', label: 'Bữa phụ 3', icon: '🥛' }
];

const MyMealsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealPlan, setMealPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalNutrition, setTotalNutrition] = useState({
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0
    });
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [showMealModal, setShowMealModal] = useState(false);
    const [activeTab, setActiveTab] = useState('ingredients');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mealToDelete, setMealToDelete] = useState(null);

    useEffect(() => {
        loadMealPlan();
    }, [selectedDate]);

    const loadMealPlan = async () => {
        try {
            setLoading(true);
            const result = await apiService.apiCall(
                `/nutrition/my-meals?date=${selectedDate}`,
                'GET',
                null,
                true
            );

            if (result?.success && result.data) {
                setMealPlan(result.data);
                setTotalNutrition(result.data.totalNutrition || {
                    calories: 0,
                    carbs: 0,
                    protein: 0,
                    fat: 0
                });
            } else {
                setMealPlan(null);
                setTotalNutrition({ calories: 0, carbs: 0, protein: 0, fat: 0 });
            }
        } catch (error) {
            console.error('Error loading meal plan:', error);
            setMealPlan(null);
            setTotalNutrition({ calories: 0, carbs: 0, protein: 0, fat: 0 });
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMealPlan();
        setRefreshing(false);
    };

    const navigateDate = (direction) => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + direction);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const handleRemoveMeal = (mealType, mealIndex, meal) => {
        setMealToDelete({ mealType, mealIndex, meal });
        setShowDeleteConfirm(true);
    };

    const confirmRemoveMeal = async () => {
        if (!mealToDelete) {
            console.log('❌ Không có mealToDelete');
            return;
        }

        const requestData = {
            date: selectedDate,
            mealType: mealToDelete.mealType,
            mealIndex: Number(mealToDelete.mealIndex) // Chuyển sang number
        };

        console.log('🗑️ Xóa món ăn - Request data:', requestData);
        console.log('📅 Date:', requestData.date);
        console.log('🍽️ MealType:', requestData.mealType);
        console.log('🔢 MealIndex:', requestData.mealIndex, '(type:', typeof requestData.mealIndex, ')');

        // Validate dữ liệu trước khi gửi
        if (!requestData.date || !requestData.mealType || requestData.mealIndex === undefined || requestData.mealIndex === null) {
            console.error('❌ Thiếu thông tin:', requestData);
            Alert.alert('Lỗi', 'Thiếu thông tin để xóa món ăn');
            return;
        }

        try {
            const result = await apiService.apiCall(
                '/nutrition/my-meals/remove',
                'DELETE',
                requestData,
                true
            );

            console.log('✅ Kết quả xóa:', result);

            if (result?.success) {
                await loadMealPlan();
                setShowDeleteConfirm(false);
                setMealToDelete(null);
                Alert.alert('Thành công', 'Đã xóa món ăn');
            } else {
                console.error('❌ Xóa thất bại:', result?.message);
                Alert.alert('Lỗi', result?.message || 'Không thể xóa món ăn');
            }
        } catch (error) {
            console.error('❌ Error removing meal:', error);
            Alert.alert('Lỗi', error.message || 'Không thể xóa món ăn');
        }
    };

    const handleMealClick = (meal) => {
        setSelectedMeal(meal);
        setShowMealModal(true);
        setActiveTab('ingredients');
    };

    const getYouTubeEmbedUrl = (url, meal) => {
        if (url) {
            let videoId = null;
            const watchMatch = url.match(/[?&]v=([^&]+)/);
            if (watchMatch) videoId = watchMatch[1];
            const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
            if (shortMatch) videoId = shortMatch[1];
            const embedMatch = url.match(/embed\/([^?&]+)/);
            if (embedMatch) videoId = embedMatch[1];

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }

        if (meal && meal.name) {
            const query = encodeURIComponent(`cách nấu ${meal.name}`);
            return `https://www.youtube.com/embed?listType=search&list=${query}`;
        }

        return null;
    };

    const renderMealModal = () => {
        if (!selectedMeal) return null;

        const embedUrl = getYouTubeEmbedUrl(selectedMeal.cookingVideoUrl, selectedMeal);

        return (
            <Modal
                visible={showMealModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowMealModal(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: '#0a0a0a' }]}>
                    <View style={[styles.modalHeader, { backgroundColor: '#0a0a0a', borderBottomColor: '#2a2a2a' }]}>
                        <TouchableOpacity onPress={() => setShowMealModal(false)}>
                            <MaterialIcons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>Chi tiết món ăn</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.modalTabs}>
                        <TouchableOpacity
                            style={[styles.modalTab, activeTab === 'ingredients' && styles.modalTabActive]}
                            onPress={() => setActiveTab('ingredients')}
                        >
                            <Text style={[styles.modalTabText, activeTab === 'ingredients' && styles.modalTabTextActive]}>
                                Nguyên liệu
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalTab, activeTab === 'instructions' && styles.modalTabActive]}
                            onPress={() => setActiveTab('instructions')}
                        >
                            <Text style={[styles.modalTabText, activeTab === 'instructions' && styles.modalTabTextActive]}>
                                Cách làm
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalTab, activeTab === 'video' && styles.modalTabActive]}
                            onPress={() => setActiveTab('video')}
                        >
                            <Text style={[styles.modalTabText, activeTab === 'video' && styles.modalTabTextActive]}>
                                Video
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {activeTab === 'ingredients' && (
                            <View style={styles.tabContent}>
                                <Text style={[styles.mealName, { color: '#FFFFFF' }]}>{selectedMeal.name}</Text>
                                {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 ? (
                                    selectedMeal.ingredients.map((ingredient, index) => {
                                        // Handle both string and object format
                                        let ingredientText = '';
                                        if (typeof ingredient === 'string') {
                                            ingredientText = ingredient;
                                        } else if (ingredient && typeof ingredient === 'object') {
                                            const { name, amount, unit, notes } = ingredient;
                                            ingredientText = name || '';
                                            if (amount) ingredientText += ` - ${amount}`;
                                            if (unit) ingredientText += ` ${unit}`;
                                            if (notes) ingredientText += ` (${notes})`;
                                        }

                                        return (
                                            <View key={index} style={styles.ingredientItem}>
                                                <MaterialIcons name="circle" size={6} color="#da2128" />
                                                <Text style={[styles.ingredientText, { color: '#FFFFFF' }]}>{ingredientText}</Text>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={[styles.emptyText, { color: '#8A8C90' }]}>Chưa có thông tin nguyên liệu</Text>
                                )}
                            </View>
                        )}

                        {activeTab === 'instructions' && (
                            <View style={styles.tabContent}>
                                <Text style={[styles.mealName, { color: '#FFFFFF' }]}>{selectedMeal.name}</Text>
                                {selectedMeal.instructions && selectedMeal.instructions.length > 0 ? (
                                    selectedMeal.instructions.map((instruction, index) => (
                                        <View key={index} style={styles.instructionItem}>
                                            <View style={styles.stepNumber}>
                                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                                            </View>
                                            <Text style={[styles.instructionText, { color: '#FFFFFF' }]}>{instruction}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={[styles.emptyText, { color: '#8A8C90' }]}>Chưa có hướng dẫn nấu ăn</Text>
                                )}
                            </View>
                        )}

                        {activeTab === 'video' && (
                            <View style={styles.tabContent}>
                                <Text style={[styles.mealName, { color: '#FFFFFF' }]}>{selectedMeal.name}</Text>
                                {embedUrl ? (
                                    <View style={styles.videoContainer}>
                                        <WebView
                                            source={{ uri: embedUrl }}
                                            style={styles.video}
                                            allowsFullscreenVideo
                                            javaScriptEnabled
                                            domStorageEnabled
                                        />
                                    </View>
                                ) : (
                                    <Text style={[styles.emptyText, { color: '#8A8C90' }]}>Chưa có video hướng dẫn</Text>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#0a0a0a' }]}>
                <ActivityIndicator size="large" color="#da2128" />
                <Text style={[styles.loadingText, { color: '#8A8C90' }]}>Đang tải thực đơn...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
            <View style={[styles.header, { backgroundColor: '#0a0a0a', borderBottomColor: '#2a2a2a' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Bữa ăn của tôi</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.dateNavigation}>
                <TouchableOpacity
                    style={[styles.dateNavBtn, { backgroundColor: '#2a2a2a' }]}
                    onPress={() => navigateDate(-1)}
                >
                    <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.dateTodayBtn, { backgroundColor: '#da2128' }]}
                    onPress={goToToday}
                >
                    <Text style={[styles.dateTodayText, { color: '#FFFFFF' }]}>Hôm nay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.dateNavBtn, { backgroundColor: '#2a2a2a' }]}
                    onPress={() => navigateDate(1)}
                >
                    <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <Text style={[styles.dateDisplay, { color: '#FFFFFF' }]}>{formatDate(selectedDate)}</Text>

            {/* Total Nutrition Summary */}
            <View style={[styles.nutritionSummary, { backgroundColor: '#1a1a1a' }]}>
                <View style={styles.nutritionItem}>
                    <MaterialIcons name="local-fire-department" size={20} color="#da2128" />
                    <View style={styles.nutritionInfo}>
                        <Text style={[styles.nutritionLabel, { color: '#8A8C90' }]}>Calo</Text>
                        <Text style={[styles.nutritionValue, { color: '#FFFFFF' }]}>
                            {totalNutrition.calories || 0} kcal
                        </Text>
                    </View>
                </View>
                <View style={styles.nutritionItem}>
                    <MaterialIcons name="bakery-dining" size={20} color="#FFCB65" />
                    <View style={styles.nutritionInfo}>
                        <Text style={[styles.nutritionLabel, { color: '#8A8C90' }]}>Carbs</Text>
                        <Text style={[styles.nutritionValue, { color: '#FFFFFF' }]}>
                            {totalNutrition.carbs || 0}g
                        </Text>
                    </View>
                </View>
                <View style={styles.nutritionItem}>
                    <MaterialIcons name="egg" size={20} color="#FFA257" />
                    <View style={styles.nutritionInfo}>
                        <Text style={[styles.nutritionLabel, { color: '#8A8C90' }]}>Protein</Text>
                        <Text style={[styles.nutritionValue, { color: '#FFFFFF' }]}>
                            {totalNutrition.protein || 0}g
                        </Text>
                    </View>
                </View>
                <View style={styles.nutritionItem}>
                    <MaterialIcons name="opacity" size={20} color="#C2E66E" />
                    <View style={styles.nutritionInfo}>
                        <Text style={[styles.nutritionLabel, { color: '#8A8C90' }]}>Chất béo</Text>
                        <Text style={[styles.nutritionValue, { color: '#FFFFFF' }]}>
                            {totalNutrition.fat || 0}g
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {MEAL_TYPES.map((mealType) => {
                    const meals = mealPlan?.meals?.[mealType.key] || [];
                    return (
                        <View key={mealType.key} style={[styles.mealSection, { backgroundColor: '#0a0a0a' }]}>
                            <View style={styles.mealSectionHeader}>
                                <View style={styles.mealSectionTitle}>
                                    <Text style={styles.mealIcon}>{mealType.icon}</Text>
                                    <Text style={[styles.mealLabel, { color: '#FFFFFF' }]}>{mealType.label}</Text>
                                </View>
                                <Text style={[styles.mealCount, { color: '#8A8C90' }]}>
                                    {meals.length} món
                                </Text>
                            </View>

                            {meals.length === 0 ? (
                                <View style={[styles.emptyMeal, { backgroundColor: '#1a1a1a' }]}>
                                    <Text style={[styles.emptyMealText, { color: '#8A8C90' }]}>
                                        Chưa có món ăn nào
                                    </Text>
                                    <Text style={[styles.emptyMealHint, { color: '#666' }]}>
                                        Thêm món ăn từ trang Dinh dưỡng
                                    </Text>
                                </View>
                            ) : (
                                meals.map((mealItem, index) => {
                                    const meal = mealItem.meal;
                                    if (!meal) return null;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.mealCard, { backgroundColor: '#1a1a1a' }]}
                                            onPress={() => handleMealClick(meal)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.mealCardHeader}>
                                                <Image
                                                    source={{ uri: meal.image || 'https://via.placeholder.com/80' }}
                                                    style={styles.mealImage}
                                                />
                                                <View style={styles.mealCardInfo}>
                                                    <Text style={[styles.mealCardName, { color: '#FFFFFF' }]} numberOfLines={2}>
                                                        {meal.name}
                                                    </Text>
                                                    <View style={styles.mealMeta}>
                                                        {meal.rating && (
                                                            <View style={styles.mealRating}>
                                                                <MaterialIcons name="star" size={12} color="#FFCB65" />
                                                                <Text style={[styles.mealRatingText, { color: '#8A8C90' }]}>
                                                                    {meal.rating}/5
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {meal.cookingTimeMinutes && (
                                                            <View style={styles.mealTime}>
                                                                <MaterialIcons name="access-time" size={12} color="#8A8C90" />
                                                                <Text style={[styles.mealTimeText, { color: '#8A8C90' }]}>
                                                                    {meal.cookingTimeMinutes} phút
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <View style={styles.sourceBadgeContainer}>
                                                        <View
                                                            style={[
                                                                styles.sourceBadge,
                                                                mealItem.source === 'AI_GENERATED'
                                                                    ? { backgroundColor: '#667eea' }
                                                                    : { backgroundColor: '#da2128' }
                                                            ]}
                                                        >
                                                            <Text style={[styles.sourceBadgeText, { color: '#FFFFFF' }]}>
                                                                {mealItem.source === 'AI_GENERATED' ? 'AI' : 'Bạn chọn'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.removeBtn, { backgroundColor: '#2a2a2a' }]}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMeal(mealType.key, index, meal);
                                                    }}
                                                >
                                                    <MaterialIcons name="delete-outline" size={18} color="#da2128" />
                                                </TouchableOpacity>
                                            </View>

                                            {meal.nutrition && (
                                                <View style={[styles.mealNutrition, { backgroundColor: '#2a2a2a' }]}>
                                                    <View style={styles.nutritionFact}>
                                                        <Text style={[styles.nutritionFactLabel, { color: '#8A8C90' }]}>
                                                            Calo
                                                        </Text>
                                                        <Text style={[styles.nutritionFactValue, { color: '#FFFFFF' }]}>
                                                            {meal.nutrition.caloriesKcal} kcal
                                                        </Text>
                                                    </View>
                                                    <View style={styles.nutritionFact}>
                                                        <Text style={[styles.nutritionFactLabel, { color: '#8A8C90' }]}>
                                                            Carbs
                                                        </Text>
                                                        <Text style={[styles.nutritionFactValue, { color: '#FFFFFF' }]}>
                                                            {meal.nutrition.carbsGrams}g
                                                        </Text>
                                                    </View>
                                                    <View style={styles.nutritionFact}>
                                                        <Text style={[styles.nutritionFactLabel, { color: '#8A8C90' }]}>
                                                            Protein
                                                        </Text>
                                                        <Text style={[styles.nutritionFactValue, { color: '#FFFFFF' }]}>
                                                            {meal.nutrition.proteinGrams}g
                                                        </Text>
                                                    </View>
                                                    <View style={styles.nutritionFact}>
                                                        <Text style={[styles.nutritionFactLabel, { color: '#8A8C90' }]}>
                                                            Fat
                                                        </Text>
                                                        <Text style={[styles.nutritionFactValue, { color: '#FFFFFF' }]}>
                                                            {meal.nutrition.fatGrams}g
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirm}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDeleteConfirm(false)}
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={[styles.deleteModalContent, { backgroundColor: '#1a1a1a' }]}>
                        <Text style={[styles.deleteModalTitle, { color: '#FFFFFF' }]}>Xác nhận xóa</Text>
                        <Text style={[styles.deleteModalText, { color: '#8A8C90' }]}>
                            Bạn có chắc chắn muốn xóa món ăn này khỏi thực đơn?
                        </Text>
                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, { backgroundColor: '#2a2a2a' }]}
                                onPress={() => setShowDeleteConfirm(false)}
                            >
                                <Text style={[styles.deleteModalButtonText, { color: '#FFFFFF' }]}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, { backgroundColor: '#da2128' }]}
                                onPress={confirmRemoveMeal}
                            >
                                <Text style={[styles.deleteModalButtonText, { color: '#FFFFFF' }]}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {renderMealModal()}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dateNavigation: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    dateNavBtn: {
        backgroundColor: '#2a2a2a',
        padding: 10,
        borderRadius: 8,
    },
    dateTodayBtn: {
        backgroundColor: '#da2128',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    dateTodayText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    dateDisplay: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    nutritionSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#1a1a1a',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    nutritionItem: {
        alignItems: 'center',
        gap: 4,
    },
    nutritionInfo: {
        alignItems: 'center',
    },
    nutritionLabel: {
        fontSize: 11,
        color: '#8A8C90',
    },
    nutritionValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    mealSection: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    mealSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mealSectionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mealIcon: {
        fontSize: 20,
    },
    mealLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    mealCount: {
        fontSize: 14,
        color: '#8A8C90',
    },
    emptyMeal: {
        backgroundColor: '#1a1a1a',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyMealText: {
        fontSize: 14,
        color: '#8A8C90',
        marginBottom: 4,
    },
    emptyMealHint: {
        fontSize: 12,
        color: '#666',
    },
    mealCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    mealCardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    mealImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    mealCardInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    mealCardName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    mealMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    mealRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mealRatingText: {
        fontSize: 12,
        color: '#8A8C90',
    },
    mealTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mealTimeText: {
        fontSize: 12,
        color: '#8A8C90',
    },
    sourceBadgeContainer: {
        marginTop: 4,
    },
    sourceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    sourceBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    removeBtn: {
        backgroundColor: '#2a2a2a',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    mealNutrition: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2a2a2a',
        padding: 12,
        borderRadius: 8,
    },
    nutritionFact: {
        alignItems: 'center',
    },
    nutritionFactLabel: {
        fontSize: 11,
        color: '#8A8C90',
        marginBottom: 2,
    },
    nutritionFactValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Delete Modal
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 320,
    },
    deleteModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    deleteModalText: {
        fontSize: 14,
        color: '#8A8C90',
        marginBottom: 20,
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteModalButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Meal Detail Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalTabs: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        padding: 4,
        margin: 16,
        borderRadius: 8,
    },
    modalTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    modalTabActive: {
        backgroundColor: '#da2128',
    },
    modalTabText: {
        fontSize: 14,
        color: '#8A8C90',
    },
    modalTabTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
    },
    tabContent: {
        padding: 16,
    },
    mealName: {
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
        paddingLeft: 8,
    },
    ingredientText: {
        fontSize: 15,
        color: '#FFFFFF',
        flex: 1,
        lineHeight: 22,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 20,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#da2128',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    instructionText: {
        fontSize: 15,
        color: '#FFFFFF',
        flex: 1,
        lineHeight: 22,
    },
    videoContainer: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    },
    emptyText: {
        fontSize: 15,
        color: '#8A8C90',
        textAlign: 'center',
        marginTop: 40,
    },
});

export default MyMealsScreen;
