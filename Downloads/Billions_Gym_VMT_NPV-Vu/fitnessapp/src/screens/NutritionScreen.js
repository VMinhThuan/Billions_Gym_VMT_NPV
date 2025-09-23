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
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const NutritionScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('today');
    const [addFoodModalVisible, setAddFoodModalVisible] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState('breakfast');

    const [dailyNutrition, setDailyNutrition] = useState({
        targetCalories: 2000,
        consumedCalories: 0,
        targetProtein: 150,
        consumedProtein: 0,
        targetCarbs: 250,
        consumedCarbs: 0,
        targetFat: 67,
        consumedFat: 0,
        waterTarget: 2500, // ml
        waterConsumed: 0 // ml
    });

    const [nutritionSuggestions, setNutritionSuggestions] = useState([]);
    const [menus, setMenus] = useState([]);

    useEffect(() => {
        fetchNutritionData();
    }, []);

    const fetchNutritionData = async () => {
        try {
            setLoading(true);

            // Fetch nutrition info and suggestions in parallel
            const [nutritionInfo, suggestions, menuData] = await Promise.allSettled([
                apiService.getMyNutritionInfo(),
                apiService.getMyNutritionSuggestions(),
                apiService.getMyMenus()
            ]);

            if (nutritionInfo.status === 'fulfilled' && nutritionInfo.value) {
                const nutrition = nutritionInfo.value;
                setDailyNutrition(prev => ({
                    ...prev,
                    targetCalories: nutrition.nhuCauCalories || 2000,
                    consumedCalories: nutrition.caloriesConsumed || 0,
                    targetProtein: nutrition.nhuCauProtein || 150,
                    consumedProtein: nutrition.proteinConsumed || 0,
                    targetCarbs: nutrition.nhuCauCarbs || 250,
                    consumedCarbs: nutrition.carbsConsumed || 0,
                    targetFat: nutrition.nhuCauFat || 67,
                    consumedFat: nutrition.fatConsumed || 0
                }));
            }

            if (suggestions.status === 'fulfilled' && suggestions.value) {
                const suggestionsData = suggestions.value;
                if (Array.isArray(suggestionsData)) {
                    setNutritionSuggestions(suggestionsData.map(suggestion => ({
                        id: suggestion._id,
                        title: suggestion.tieuDe || 'Gợi ý dinh dưỡng',
                        description: suggestion.noiDung || 'Gợi ý từ AI',
                        foods: suggestion.danhSachMonAn || [],
                        calories: suggestion.tongCalories || 0,
                        type: suggestion.loaiGoiY || 'general'
                    })));
                } else {
                    setNutritionSuggestions([]);
                }
            }

            if (menuData.status === 'fulfilled' && menuData.value) {
                setMenus(menuData.value || []);
            }

        } catch (error) {
            console.error('Error fetching nutrition data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu dinh dưỡng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const [todayMeals, setTodayMeals] = useState({
        breakfast: [
            {
                id: 1,
                name: "Bánh mì trứng",
                calories: 320,
                protein: 15,
                carbs: 35,
                fat: 12,
                time: "07:30"
            },
            {
                id: 2,
                name: "Cà phê sữa",
                calories: 150,
                protein: 8,
                carbs: 18,
                fat: 6,
                time: "07:45"
            }
        ],
        lunch: [
            {
                id: 3,
                name: "Cơm gà nướng",
                calories: 520,
                protein: 35,
                carbs: 55,
                fat: 15,
                time: "12:30"
            },
            {
                id: 4,
                name: "Salad rau củ",
                calories: 120,
                protein: 4,
                carbs: 20,
                fat: 3,
                time: "12:45"
            }
        ],
        dinner: [
            {
                id: 5,
                name: "Phở bò",
                calories: 340,
                protein: 25,
                carbs: 45,
                fat: 8,
                time: "19:00"
            }
        ],
        snacks: []
    });

    const [aiSuggestions, setAiSuggestions] = useState([
        {
            id: 1,
            title: "Bữa tối cân bằng",
            description: "Thêm protein và giảm carbs để đạt mục tiêu hôm nay",
            foods: ["Ức gà nướng", "Rau xanh", "Quinoa"],
            calories: 380,
            type: "dinner"
        },
        {
            id: 2,
            title: "Snack lành mạnh",
            description: "Bổ sung năng lượng giữa các bữa chính",
            foods: ["Hạnh nhân", "Táo", "Sữa chua Hy Lạp"],
            calories: 220,
            type: "snack"
        }
    ]);

    const mealTypes = [
        { id: 'breakfast', name: 'Sáng', icon: 'wb-sunny' },
        { id: 'lunch', name: 'Trưa', icon: 'wb-cloudy' },
        { id: 'dinner', name: 'Tối', icon: 'brightness-3' },
        { id: 'snacks', name: 'Phụ', icon: 'local-cafe' }
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNutritionData();
        setRefreshing(false);
    };

    const addWater = (amount) => {
        setDailyNutrition(prev => ({
            ...prev,
            waterConsumed: Math.min(prev.waterConsumed + amount, prev.waterTarget)
        }));
    };

    const renderNutritionSummary = () => (
        <View style={[styles.summaryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dinh dưỡng hôm nay</Text>

            {/* Calories */}
            <View style={[styles.macroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.macroHeader}>
                    <Text style={[styles.macroTitle, { color: colors.text }]}>Calories</Text>
                    <Text style={[styles.macroValue, { color: colors.text }]}>
                        {dailyNutrition.consumedCalories} / {dailyNutrition.targetCalories}
                    </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                    <View style={[
                        styles.progressFill,
                        {
                            width: `${Math.min((dailyNutrition.consumedCalories / dailyNutrition.targetCalories) * 100, 100)}%`,
                            backgroundColor: colors.primary
                        }
                    ]} />
                </View>
                <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                    Còn lại: {dailyNutrition.targetCalories - dailyNutrition.consumedCalories} kcal
                </Text>
            </View>

            {/* Macros */}
            <View style={styles.macrosGrid}>
                <View style={[styles.macroItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.macroName, { color: colors.text }]}>Protein</Text>
                    <Text style={[styles.macroNumbers, { color: colors.text }]}>
                        {dailyNutrition.consumedProtein}g / {dailyNutrition.targetProtein}g
                    </Text>
                    <View style={[styles.progressBarSmall, { backgroundColor: colors.surface }]}>
                        <View style={[
                            styles.progressFillSmall,
                            {
                                width: `${Math.min((dailyNutrition.consumedProtein / dailyNutrition.targetProtein) * 100, 100)}%`,
                                backgroundColor: colors.success
                            }
                        ]} />
                    </View>
                </View>

                <View style={[styles.macroItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.macroName, { color: colors.text }]}>Carbs</Text>
                    <Text style={[styles.macroNumbers, { color: colors.text }]}>
                        {dailyNutrition.consumedCarbs}g / {dailyNutrition.targetCarbs}g
                    </Text>
                    <View style={[styles.progressBarSmall, { backgroundColor: colors.surface }]}>
                        <View style={[
                            styles.progressFillSmall,
                            {
                                width: `${Math.min((dailyNutrition.consumedCarbs / dailyNutrition.targetCarbs) * 100, 100)}%`,
                                backgroundColor: colors.warning
                            }
                        ]} />
                    </View>
                </View>

                <View style={[styles.macroItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.macroName, { color: colors.text }]}>Fat</Text>
                    <Text style={[styles.macroNumbers, { color: colors.text }]}>
                        {dailyNutrition.consumedFat}g / {dailyNutrition.targetFat}g
                    </Text>
                    <View style={[styles.progressBarSmall, { backgroundColor: colors.surface }]}>
                        <View style={[
                            styles.progressFillSmall,
                            {
                                width: `${Math.min((dailyNutrition.consumedFat / dailyNutrition.targetFat) * 100, 100)}%`,
                                backgroundColor: colors.info
                            }
                        ]} />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderWaterTracker = () => (
        <View style={[styles.waterContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.waterHeader}>
                <MaterialIcons name="opacity" size={24} color={colors.info} />
                <Text style={[styles.waterTitle, { color: colors.text }]}>Nước uống</Text>
                <Text style={[styles.waterAmount, { color: colors.textSecondary }]}>
                    {dailyNutrition.waterConsumed}ml / {dailyNutrition.waterTarget}ml
                </Text>
            </View>

            <View style={[styles.waterProgress, { backgroundColor: colors.surface }]}>
                <View style={[
                    styles.waterFill,
                    {
                        height: `${(dailyNutrition.waterConsumed / dailyNutrition.waterTarget) * 100}%`,
                        backgroundColor: colors.info
                    }
                ]} />
            </View>

            <View style={styles.waterButtons}>
                <TouchableOpacity
                    style={[styles.waterButton, { backgroundColor: colors.info + '20', borderColor: colors.info }]}
                    onPress={() => addWater(250)}
                >
                    <Text style={[styles.waterButtonText, { color: colors.info }]}>+250ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.waterButton, { backgroundColor: colors.info + '20', borderColor: colors.info }]}
                    onPress={() => addWater(500)}
                >
                    <Text style={[styles.waterButtonText, { color: colors.info }]}>+500ml</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderMealSection = (mealType, meals) => (
        <View key={mealType} style={[styles.mealSection, { backgroundColor: colors.card }]}>
            <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                    <MaterialIcons
                        name={mealTypes.find(m => m.id === mealType)?.icon || 'restaurant'}
                        size={20}
                        color={colors.primary}
                    />
                    <Text style={[styles.mealTitle, { color: colors.text }]}>
                        {mealTypes.find(m => m.id === mealType)?.name || mealType}
                    </Text>
                    <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
                        {meals.reduce((sum, meal) => sum + meal.calories, 0)} kcal
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addFoodButton, { backgroundColor: colors.surface }]}
                    onPress={() => {
                        setSelectedMealType(mealType);
                        setAddFoodModalVisible(true);
                    }}
                >
                    <MaterialIcons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {meals.length === 0 ? (
                <View style={styles.emptyMeal}>
                    <Text style={[styles.emptyMealText, { color: colors.textMuted }]}>Chưa có món ăn nào</Text>
                </View>
            ) : (
                meals.map(meal => (
                    <View key={meal.id} style={[styles.mealItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.mealItemInfo}>
                            <Text style={[styles.mealItemName, { color: colors.text }]}>{meal.name}</Text>
                            <Text style={[styles.mealItemTime, { color: colors.textSecondary }]}>{meal.time}</Text>
                        </View>
                        <View style={styles.mealItemNutrition}>
                            <Text style={[styles.mealItemCalories, { color: colors.primary }]}>{meal.calories} kcal</Text>
                            <Text style={[styles.mealItemMacros, { color: colors.textSecondary }]}>
                                P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                            </Text>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    const renderAISuggestions = () => (
        <View style={styles.aiSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý từ AI</Text>
            {nutritionSuggestions.length === 0 ? (
                <View style={[styles.aiCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                    <View style={styles.aiHeader}>
                        <Ionicons name="bulb" size={20} color={colors.primary} />
                        <Text style={[styles.aiTitle, { color: colors.text }]}>Chưa có gợi ý</Text>
                    </View>
                    <Text style={[styles.aiDescription, { color: colors.textSecondary }]}>
                        Hãy cập nhật thông tin cơ thể và mục tiêu để nhận gợi ý dinh dưỡng từ AI
                    </Text>
                    <TouchableOpacity
                        style={[styles.aiAddButton, { backgroundColor: colors.primary }]}
                        onPress={createNutritionSuggestion}
                    >
                        <Text style={styles.aiAddText}>Tạo gợi ý</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                nutritionSuggestions.map(suggestion => (
                    <View key={suggestion.id} style={[styles.aiCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                        <View style={styles.aiHeader}>
                            <Ionicons name="bulb" size={20} color={colors.primary} />
                            <Text style={[styles.aiTitle, { color: colors.text }]}>{suggestion.title}</Text>
                        </View>
                        <Text style={[styles.aiDescription, { color: colors.textSecondary }]}>{suggestion.description}</Text>
                        <View style={styles.aiFoods}>
                            {suggestion.foods.map((food, index) => (
                                <View key={index} style={[styles.aiFoodTag, { backgroundColor: colors.surface }]}>
                                    <Text style={[styles.aiFoodText, { color: colors.text }]}>{food}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.aiFooter}>
                            <Text style={[styles.aiCalories, { color: colors.primary }]}>{suggestion.calories} kcal</Text>
                            <TouchableOpacity style={[styles.aiAddButton, { backgroundColor: colors.primary }]}>
                                <Text style={styles.aiAddText}>Thêm vào</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    const createNutritionSuggestion = async () => {
        try {
            const userId = await apiService.getCurrentUserId();
            const suggestionData = {
                maHoiVien: userId,
                mucTieu: 'GiamCan', // Default goal, could be dynamic
                thongTinThem: {
                    tuoi: 25,
                    gioiTinh: 'Nam',
                    hoatDong: 'TrungBinh'
                }
            };

            await apiService.createNutritionSuggestion(suggestionData);
            Alert.alert('Thành công', 'Đã tạo gợi ý dinh dưỡng mới!');
            fetchNutritionData(); // Refresh data
        } catch (error) {
            console.error('Error creating nutrition suggestion:', error);
            Alert.alert('Lỗi', 'Không thể tạo gợi ý dinh dưỡng. Vui lòng thử lại.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Dinh dưỡng</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface }]}>
                        <MaterialIcons name="search" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface }]}>
                        <MaterialIcons name="camera-alt" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderNutritionSummary()}

                <View style={styles.trackerRow}>
                    {renderWaterTracker()}
                </View>

                {renderAISuggestions()}

                <View style={styles.mealsContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Bữa ăn hôm nay</Text>
                    {Object.entries(todayMeals).map(([mealType, meals]) =>
                        renderMealSection(mealType, meals)
                    )}
                </View>
            </ScrollView>

            {/* Add Food Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addFoodModalVisible}
                onRequestClose={() => setAddFoodModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Thêm món ăn - {mealTypes.find(m => m.id === selectedMealType)?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setAddFoodModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            placeholder="Tìm kiếm món ăn..."
                            placeholderTextColor={colors.textMuted}
                        />

                        <ScrollView style={styles.foodList}>
                            {/* Quick add items */}
                            {[
                                { name: "Cơm trắng", calories: 130, protein: 3, carbs: 28, fat: 0 },
                                { name: "Ức gà nướng", calories: 165, protein: 31, carbs: 0, fat: 4 },
                                { name: "Salad rau củ", calories: 50, protein: 2, carbs: 10, fat: 1 },
                                { name: "Chuối", calories: 105, protein: 1, carbs: 27, fat: 0 }
                            ].map((food, index) => (
                                <TouchableOpacity key={index} style={[styles.foodItem, { borderBottomColor: colors.border }]}>
                                    <View style={styles.foodInfo}>
                                        <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                                        <Text style={[styles.foodNutrition, { color: colors.textSecondary }]}>
                                            {food.calories} kcal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.surface }]}>
                                        <MaterialIcons name="add" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    headerButtons: {
        flexDirection: 'row',
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    summaryContainer: {
        padding: 20,
        borderRadius: 16,
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    macroCard: {
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
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    macroTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    remainingText: {
        fontSize: 12,
    },
    macrosGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    macroItem: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
    },
    macroName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    macroNumbers: {
        fontSize: 10,
        marginBottom: 8,
    },
    progressBarSmall: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFillSmall: {
        height: '100%',
        borderRadius: 2,
    },
    trackerRow: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    waterContainer: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    waterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    waterTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    waterAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    waterProgress: {
        width: 60,
        height: 120,
        borderRadius: 30,
        alignSelf: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        flexDirection: 'column-reverse',
    },
    waterFill: {
        borderRadius: 30,
        width: '100%',
    },
    waterButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    waterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    waterButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    aiSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    aiCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    aiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    aiDescription: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 18,
    },
    aiFoods: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    aiFoodTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
    },
    aiFoodText: {
        fontSize: 12,
        fontWeight: '500',
    },
    aiFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    aiCalories: {
        fontSize: 14,
        fontWeight: '600',
    },
    aiAddButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    aiAddText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    mealsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    mealSection: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mealInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    mealTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    mealCalories: {
        fontSize: 14,
        marginLeft: 8,
    },
    addFoodButton: {
        padding: 4,
        borderRadius: 16,
    },
    emptyMeal: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyMealText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    mealItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    mealItemInfo: {
        flex: 1,
    },
    mealItemName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    mealItemTime: {
        fontSize: 12,
    },
    mealItemNutrition: {
        alignItems: 'flex-end',
    },
    mealItemCalories: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    mealItemMacros: {
        fontSize: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    searchInput: {
        margin: 20,
        marginBottom: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
    },
    foodList: {
        flex: 1,
        padding: 20,
    },
    foodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    foodNutrition: {
        fontSize: 12,
    },
    addButton: {
        padding: 8,
        borderRadius: 16,
        marginLeft: 12,
    },
});

export default NutritionScreen;
