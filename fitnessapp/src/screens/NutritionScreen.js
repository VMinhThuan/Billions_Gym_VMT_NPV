import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    RefreshControl,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const MEAL_CATEGORIES = ['Tất cả', 'Sáng', 'Trưa', 'Ăn nhẹ', 'Tối'];
const SORT_OPTIONS = [
    { label: 'Calo', value: 'calories' },
    { label: 'Đánh giá', value: 'rating' },
    { label: 'Tên A-Z', value: 'name' },
    { label: 'Điểm sức khỏe', value: 'healthScore' }
];
const ITEMS_PER_PAGE = 6;

const NutritionScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [sortBy, setSortBy] = useState('calories');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [filters, setFilters] = useState({
        difficulty: 'Tất cả',
        minCalories: '',
        maxCalories: '',
        minHealthScore: ''
    });
    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

    // AI Assistant states
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiRequest, setAiRequest] = useState({
        goal: '',
        calories: '',
        selectedDate: new Date().toISOString().split('T')[0],
        preferences: ''
    });

    // Meal data states
    const [allMeals, setAllMeals] = useState([]);
    const [featuredMeal, setFeaturedMeal] = useState(null);
    const [popularMeals, setPopularMeals] = useState([]);
    const [recommendedMeals, setRecommendedMeals] = useState([]);

    // Meal selection states
    const [selectedMealForAdd, setSelectedMealForAdd] = useState(null);
    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [addingMeal, setAddingMeal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState('Bữa trưa');
    const [showMealTypePicker, setShowMealTypePicker] = useState(false);

    // Calendar states
    const today = new Date();
    const [addToDate, setAddToDate] = useState(
        new Date(today.getTime() - today.getTimezoneOffset() * 60000)
            .toISOString().split('T')[0]
    );
    const [calendarMonth, setCalendarMonth] = useState({
        year: today.getFullYear(),
        month: today.getMonth()
    });

    // Constants
    const MEAL_TYPE_OPTIONS = ['Bữa sáng', 'Phụ 1', 'Bữa trưa', 'Phụ 2', 'Bữa tối', 'Phụ 3'];
    const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    // Load nutrition data
    const loadNutritionData = async () => {
        try {
            setLoading(true);
            const result = await apiService.apiCall('/nutrition/meals', 'GET', {}, true);

            if (result?.success) {
                const meals = result.data || [];
                setAllMeals(meals);

                // Set featured meal (highest rated)
                if (meals.length > 0) {
                    const featured = meals.reduce((prev, current) =>
                        (current.rating || 0) > (prev.rating || 0) ? current : prev
                    );
                    setFeaturedMeal(featured);
                }

                // Set popular meals (top 6 by rating)
                const popular = [...meals]
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 6);
                setPopularMeals(popular);

                // Set recommended meals (random selection)
                const recommended = [...meals]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);
                setRecommendedMeals(recommended);
            }
        } catch (error) {
            console.error('Error loading nutrition data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu dinh dưỡng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNutritionData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNutritionData();
        setRefreshing(false);
    };

    const handleAddToMealPlan = (meal) => {
        setSelectedMealForAdd(meal);
        // Nếu meal có mealType thì set đúng loại bữa ăn
        const mealTypeLabel = normalizeMealType(meal.mealType || meal.loaiMonAn || '');
        setSelectedMealType(mealTypeLabel);
        setShowMealTypeModal(true);
    };

    const confirmAddToMealPlan = async () => {
        if (!selectedMealForAdd) return;

        try {
            setAddingMeal(true);
            const result = await apiService.apiCall('/nutrition/meals/add-to-plan', 'POST', {
                mealId: selectedMealForAdd._id || selectedMealForAdd.id,
                mealType: selectedMealType,
                date: addToDate
            }, true);

            if (result?.success) {
                setShowMealTypeModal(false);
                Alert.alert(
                    'Thành công',
                    `Đã thêm "${selectedMealForAdd.name}" vào ${selectedMealType}`,
                    [
                        {
                            text: 'Xem kế hoạch',
                            onPress: () => navigation.navigate('MyMeals')
                        },
                        { text: 'Đóng', style: 'cancel' }
                    ]
                );
            } else {
                Alert.alert('Lỗi', result?.message || 'Không thể thêm món ăn');
            }
        } catch (error) {
            console.error('Error adding meal to plan:', error);
            Alert.alert('Lỗi', error.message || 'Không thể thêm món ăn vào kế hoạch');
        } finally {
            setAddingMeal(false);
        }
    };

    const handleMonthChange = (direction) => {
        setCalendarMonth(prev => {
            let newMonth = prev.month + direction;
            let newYear = prev.year;
            if (newMonth < 0) {
                newMonth = 11;
                newYear--;
            } else if (newMonth > 11) {
                newMonth = 0;
                newYear++;
            }
            return { year: newYear, month: newMonth };
        });
    };

    const handleDaySelect = (date) => {
        const localDateValue = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString().split('T')[0];
        setAddToDate(localDateValue);
    };

    const isDateDisabled = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    const generateCalendarDays = () => {
        const { year, month } = calendarMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        let startDay = firstDay.getDay();
        // Adjust: Monday = 0, Sunday = 6
        startDay = startDay === 0 ? 6 : startDay - 1;

        const daysInMonth = lastDay.getDate();
        const days = [];

        // Add empty slots for days before month starts
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const calendarMonthLabel = useMemo(() => {
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return `${monthNames[calendarMonth.month]} ${calendarMonth.year}`;
    }, [calendarMonth]);

    const formattedSelectedDate = useMemo(() => {
        if (!addToDate) return '';
        const date = new Date(addToDate + 'T00:00:00');
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }, [addToDate]);

    const handleMealClick = (meal) => {
        navigation.navigate('MealDetail', { meal });
    };

    const resetFilters = () => {
        setFilters({
            difficulty: 'Tất cả',
            minCalories: '',
            maxCalories: '',
            minHealthScore: ''
        });
        setSelectedCategory('Tất cả');
        setDisplayCount(ITEMS_PER_PAGE);
    };

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    };

    const handleGeneratePlan = async () => {
        if (!aiRequest.goal) {
            Alert.alert('Thông báo', 'Vui lòng nhập mục tiêu dinh dưỡng');
            return;
        }

        console.log('🤖 Bắt đầu tạo kế hoạch AI... (có thể mất 30-90 giây)');
        setIsGenerating(true);
        try {
            const selectedDate = new Date(aiRequest.selectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                Alert.alert('Thông báo', 'Vui lòng chọn ngày hôm nay hoặc ngày tương lai');
                return;
            }

            const result = await apiService.apiCall(
                '/nutrition/plan',
                'POST',
                {
                    goal: aiRequest.goal,
                    calories: aiRequest.calories || undefined,
                    period: 'daily',
                    preferences: aiRequest.preferences,
                    mealType: '',
                    date: aiRequest.selectedDate
                },
                true
            );

            if (result?.success) {
                setShowAIPanel(false);
                Alert.alert(
                    'Thành công',
                    'Đã tạo thực đơn thành công! Vui lòng xem trong trang "Bữa ăn của tôi".',
                    [
                        {
                            text: 'Xem ngay',
                            onPress: () => navigation.navigate('MyMeals')
                        },
                        { text: 'Đóng', style: 'cancel' }
                    ]
                );
                setAiRequest({
                    goal: '',
                    calories: '',
                    selectedDate: new Date().toISOString().split('T')[0],
                    preferences: ''
                });
            } else {
                Alert.alert('Lỗi', result?.message || 'Không thể tạo kế hoạch');
            }
        } catch (error) {
            console.error('Error generating plan:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tạo kế hoạch dinh dưỡng');
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter and sort meals with useMemo
    const filteredAndSortedMeals = useMemo(() => {
        let filtered = [...allMeals];

        // Filter by category
        if (selectedCategory !== 'Tất cả') {
            filtered = filtered.filter(m => {
                const mealType = m.mealType || m.loaiMonAn || '';

                // Map app categories to database mealType values
                if (selectedCategory === 'Sáng') {
                    return mealType === 'Bữa sáng' || mealType === 'Sáng' || mealType === 'Breakfast';
                }
                if (selectedCategory === 'Trưa') {
                    return mealType === 'Bữa trưa' || mealType === 'Trưa' || mealType === 'Lunch';
                }
                if (selectedCategory === 'Tối') {
                    return mealType === 'Bữa tối' || mealType === 'Tối' || mealType === 'Dinner';
                }
                if (selectedCategory === 'Ăn nhẹ') {
                    return mealType === 'Ăn nhẹ' || mealType === 'Phụ 1' || mealType === 'Phụ 2' || mealType === 'Phụ 3' || mealType === 'Snack';
                }

                return mealType === selectedCategory;
            });
        }

        // Filter by difficulty
        if (filters.difficulty !== 'Tất cả') {
            filtered = filtered.filter(m => (m.difficulty || 'Dễ') === filters.difficulty);
        }

        // Filter by calories
        if (filters.minCalories && filters.minCalories !== '') {
            const min = parseInt(filters.minCalories);
            if (!isNaN(min)) {
                filtered = filtered.filter(m => {
                    const calories = m.nutrition?.caloriesKcal || m.nutrition?.calories || 0;
                    return calories >= min;
                });
            }
        }

        if (filters.maxCalories && filters.maxCalories !== '') {
            const max = parseInt(filters.maxCalories);
            if (!isNaN(max)) {
                filtered = filtered.filter(m => {
                    const calories = m.nutrition?.caloriesKcal || m.nutrition?.calories || 0;
                    return calories <= max;
                });
            }
        }

        // Filter by health score
        if (filters.minHealthScore && filters.minHealthScore !== '') {
            const min = parseInt(filters.minHealthScore);
            if (!isNaN(min)) {
                filtered = filtered.filter(m => (m.healthScore || 0) >= min);
            }
        }

        // Sort
        let sorted = [...filtered];
        switch (sortBy) {
            case 'calories':
                sorted.sort((a, b) => {
                    const aVal = a.nutrition?.caloriesKcal || a.nutrition?.calories || 0;
                    const bVal = b.nutrition?.caloriesKcal || b.nutrition?.calories || 0;
                    return aVal - bVal;
                });
                break;
            case 'rating':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name':
                sorted.sort((a, b) => {
                    const aName = (a.name || a.tenMonAn || '').toLowerCase();
                    const bName = (b.name || b.tenMonAn || '').toLowerCase();
                    return aName.localeCompare(bName);
                });
                break;
            case 'healthScore':
                sorted.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));
                break;
            default:
                break;
        }

        return sorted;
    }, [allMeals, selectedCategory, filters, sortBy]);

    const renderFeaturedMenu = () => {
        if (!featuredMeal) return null;

        const meal = featuredMeal;
        const nutrition = meal.nutrition || {};

        return (
            <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Món nổi bật</Text>
                </View>

                <TouchableOpacity
                    style={[styles.featuredCard, { backgroundColor: '#1a1a1a' }]}
                    onPress={() => handleMealClick(meal)}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: meal.image || meal.anhMonAn || 'https://via.placeholder.com/400' }}
                        style={styles.featuredImage}
                        resizeMode="cover"
                    />

                    <View style={styles.featuredContent}>
                        <Text style={[styles.featuredTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
                            {meal.name || meal.tenMonAn}
                        </Text>

                        <View style={styles.featuredBadges}>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(meal.mealType || meal.loaiMonAn) }]}>
                                <Text style={[styles.categoryText, { color: '#000000' }]}>{meal.mealType || meal.loaiMonAn || 'Trưa'}</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={12} color="#FFCB65" />
                                <Text style={[styles.ratingText, { color: '#8A8C90' }]}>
                                    {meal.rating || 4.8}/5 ({meal.reviews || 125} reviews)
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featuredDetails}>
                            <View style={styles.detailRow}>
                                <View style={styles.detailItem}>
                                    <View style={[styles.detailIcon, { backgroundColor: '#2a2a2a' }]}>
                                        <MaterialIcons name="bar-chart" size={14} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text style={[styles.detailLabel, { color: '#8A8C90' }]}>Độ khó</Text>
                                        <Text style={[styles.detailValue, { color: '#fefcfb' }]}>{meal.difficulty || 'Trung bình'}</Text>
                                    </View>
                                </View>
                                <View style={styles.detailItem}>
                                    <View style={[styles.detailIcon, { backgroundColor: '#2a2a2a' }]}>
                                        <MaterialIcons name="favorite" size={14} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text style={[styles.detailLabel, { color: '#8A8C90' }]}>Điểm sức khỏe</Text>
                                        <Text style={[styles.detailValue, { color: '#fefcfb' }]}>{meal.healthScore || 9}/100</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.detailRow}>
                                <View style={styles.detailItem}>
                                    <View style={[styles.detailIcon, { backgroundColor: '#2a2a2a' }]}>
                                        <MaterialIcons name="restaurant" size={14} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text style={[styles.detailLabel, { color: '#8A8C90' }]}>Thời gian nấu</Text>
                                        <Text style={[styles.detailValue, { color: '#fefcfb' }]}>{meal.cookingTimeMinutes || 10} phút</Text>
                                    </View>
                                </View>
                                <View style={styles.detailItem}>
                                    <View style={[styles.detailIcon, { backgroundColor: '#2a2a2a' }]}>
                                        <MaterialIcons name="format-list-numbered" size={14} color="#FFFFFF" />
                                    </View>
                                    <View>
                                        <Text style={[styles.detailLabel, { color: '#8A8C90' }]}>Tổng số bước</Text>
                                        <Text style={[styles.detailValue, { color: '#fefcfb' }]}>{meal.stepCount || 4} bước</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleAddToMealPlan(meal);
                            }}
                        >
                            <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>Thêm vào thực đơn</Text>
                        </TouchableOpacity>

                        <View style={styles.nutritionGridSection}>
                            <View style={styles.nutritionRow}>
                                <View style={[styles.nutritionItem, { backgroundColor: '#C2E66E' }]}>
                                    <MaterialIcons name="local-fire-department" size={16} color="#272932" />
                                    <View>
                                        <Text style={[styles.nutritionLabel, { color: '#000000' }]}>Calo</Text>
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionAmount, { color: '#000000' }]}>{nutrition.caloriesKcal || 450}</Text>
                                            <Text style={[styles.nutritionUnit, { color: '#000000' }]}>kcal</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: '#FFCB65' }]}>
                                    <MaterialIcons name="bakery-dining" size={16} color="#272932" />
                                    <View>
                                        <Text style={[styles.nutritionLabel, { color: '#000000' }]}>Carbs</Text>
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionAmount, { color: '#000000' }]}>{nutrition.carbsGrams || 40}</Text>
                                            <Text style={[styles.nutritionUnit, { color: '#000000' }]}>gr</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.nutritionRow}>
                                <View style={[styles.nutritionItem, { backgroundColor: '#FFA257' }]}>
                                    <MaterialIcons name="egg" size={16} color="#272932" />
                                    <View>
                                        <Text style={[styles.nutritionLabel, { color: '#000000' }]}>Proteins</Text>
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionAmount, { color: '#000000' }]}>{nutrition.proteinGrams || 35}</Text>
                                            <Text style={[styles.nutritionUnit, { color: '#000000' }]}>gr</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: '#E1E1E2' }]}>
                                    <MaterialIcons name="opacity" size={16} color="#272932" />
                                    <View>
                                        <Text style={[styles.nutritionLabel, { color: '#000000' }]}>Chất béo</Text>
                                        <View style={styles.nutritionValue}>
                                            <Text style={[styles.nutritionAmount, { color: '#000000' }]}>{nutrition.fatGrams || 12}</Text>
                                            <Text style={[styles.nutritionUnit, { color: '#000000' }]}>gr</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }; const renderAllMenuSection = () => {
        const mealsToDisplay = filteredAndSortedMeals.slice(0, displayCount);
        const hasMore = displayCount < filteredAndSortedMeals.length;

        return (
            <View style={styles.allMenuSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Tất cả món ăn</Text>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: '#2a2a2a' }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <MaterialIcons name="tune" size={14} color="#8A8C90" />
                        <Text style={[styles.filterText, { color: '#8A8C90' }]}>Bộ lọc</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.categoryButtonsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.categoryButtons, { backgroundColor: '#2a2a2a' }]}>
                            {MEAL_CATEGORIES.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.categoryButton,
                                        selectedCategory === category && { backgroundColor: '#da2128' }
                                    ]}
                                    onPress={() => {
                                        setSelectedCategory(category);
                                        setDisplayCount(ITEMS_PER_PAGE);
                                    }}
                                >
                                    <Text style={[
                                        styles.categoryButtonText,
                                        { color: selectedCategory === category ? '#FFFFFF' : '#8A8C90' }
                                    ]}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.sortRow}>
                    <Text style={[styles.sortLabel, { color: '#8A8C90' }]}>Sắp xếp theo:</Text>
                    <TouchableOpacity
                        style={[styles.sortButton, { backgroundColor: '#2a2a2a' }]}
                        onPress={() => setShowSortDropdown(!showSortDropdown)}
                    >
                        <Text style={[styles.sortText, { color: '#8A8C90' }]}>
                            {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Calo'}
                        </Text>
                        <MaterialIcons name="keyboard-arrow-down" size={14} color="#8A8C90" />
                    </TouchableOpacity>
                </View>

                {/* Sort Dropdown */}
                {showSortDropdown && (
                    <View style={styles.sortDropdown}>
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.sortOption,
                                    sortBy === option.value && styles.sortOptionActive
                                ]}
                                onPress={() => {
                                    setSortBy(option.value);
                                    setShowSortDropdown(false);
                                }}
                            >
                                <Text style={[
                                    styles.sortOptionText,
                                    sortBy === option.value && styles.sortOptionTextActive
                                ]}>
                                    {option.label}
                                </Text>
                                {sortBy === option.value && (
                                    <MaterialIcons name="check" size={18} color="#da2128" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {mealsToDisplay.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="restaurant" size={48} color="#8A8C90" />
                        <Text style={[styles.emptyStateText, { color: '#8A8C90' }]}>Không tìm thấy món ăn</Text>
                        <TouchableOpacity
                            style={[styles.emptyStateButton, { backgroundColor: '#da2128' }]}
                            onPress={resetFilters}
                        >
                            <Text style={[styles.emptyStateButtonText, { color: '#FFFFFF' }]}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.mealsGrid}>
                        {mealsToDisplay.map((meal) => (
                            <MealCard
                                key={meal._id || meal.id}
                                meal={meal}
                                onAddToMealPlan={handleAddToMealPlan}
                                onMealClick={handleMealClick}
                                colors={colors}
                            />
                        ))}
                    </View>
                )}

                {hasMore && mealsToDisplay.length > 0 && (
                    <TouchableOpacity
                        style={[styles.loadMoreButton, { backgroundColor: '#2a2a2a' }]}
                        onPress={handleLoadMore}
                    >
                        <Text style={[styles.loadMoreText, { color: '#FFFFFF' }]}>Xem thêm</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderPopularMenu = () => {
        if (popularMeals.length === 0) return null;

        return (
            <View style={styles.popularSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Món phổ biến</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.popularScroll}>
                        {popularMeals.map((meal, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.popularCard, { backgroundColor: '#1a1a1a' }]}
                                onPress={() => handleMealClick(meal)}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: meal.image || meal.anhMonAn || 'https://via.placeholder.com/120' }}
                                    style={styles.popularImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.popularInfo}>
                                    <View style={styles.popularTop}>
                                        <Text style={[styles.popularTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
                                            {meal.name || meal.tenMonAn}
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.popularAddButton, { backgroundColor: '#da2128' }]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleAddToMealPlan(meal);
                                            }}
                                        >
                                            <MaterialIcons name="add" size={14} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.popularDetails}>
                                        <View style={[styles.popularRating, { backgroundColor: '#202020' }]}>
                                            <MaterialIcons name="star" size={10} color="#FFCB65" />
                                            <Text style={[styles.popularRatingText, { color: '#fefcfb' }]}>{meal.rating || 4.8}</Text>
                                            <Text style={[styles.popularRatingLimit, { color: '#8A8C90' }]}>/5</Text>
                                        </View>
                                        <View style={[styles.popularCategory, { backgroundColor: getCategoryColor(meal.mealType || meal.loaiMonAn) }]}>
                                            <Text style={[styles.popularCategoryText, { color: '#000000' }]}>{meal.mealType || meal.loaiMonAn}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderRecommendedMenu = () => {
        if (recommendedMeals.length === 0) return null;

        return (
            <View style={styles.recommendedSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Món được đề xuất</Text>
                </View>

                {recommendedMeals.map((meal, index) => (
                    <RecommendedCard
                        key={index}
                        meal={meal}
                        onAddToMealPlan={handleAddToMealPlan}
                        onMealClick={handleMealClick}
                        colors={colors}
                    />
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#0a0a0a' }]}>
                <ActivityIndicator size="large" color="#da2128" />
                <Text style={[styles.loadingText, { color: '#8A8C90' }]}>Đang tải dữ liệu dinh dưỡng...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
            <View style={[styles.header, { backgroundColor: '#0a0a0a', borderBottomColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={[styles.headerTitle, { color: '#FFFFFF', fontSize: 22, textAlign: 'center' }]}>Thực đơn dinh dưỡng</Text>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: '#667eea' }]}
                    onPress={() => setShowAIPanel(true)}
                >
                    <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
                    <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>
                        AI Trợ lý Dinh dưỡng
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: '#da2128' }]}
                    onPress={() => navigation.navigate('MyMeals')}
                >
                    <MaterialIcons name="restaurant-menu" size={20} color="#FFFFFF" />
                    <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>
                        Bữa ăn của tôi
                    </Text>
                </TouchableOpacity>
            </View>

            {/* AI Panel Modal */}
            <Modal
                visible={showAIPanel}
                transparent={true}
                animationType="slide"
                onRequestClose={() => !isGenerating && setShowAIPanel(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.aiModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🤖 AI Trợ lý Dinh dưỡng</Text>
                            <TouchableOpacity
                                onPress={() => setShowAIPanel(false)}
                                disabled={isGenerating}
                            >
                                <MaterialIcons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>
                                    <MaterialIcons name="flag" size={16} color="#da2128" /> Mục tiêu dinh dưỡng *
                                </Text>
                                <TextInput
                                    style={[styles.aiTextInput, { backgroundColor: '#2a2a2a', color: '#FFFFFF' }]}
                                    value={aiRequest.goal}
                                    onChangeText={(text) => setAiRequest({ ...aiRequest, goal: text })}
                                    placeholder="VD: Giảm cân, Tăng cơ, Ăn healthy..."
                                    placeholderTextColor="#666"
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>
                                    <MaterialIcons name="local-fire-department" size={16} color="#FFA257" /> Calo mong muốn (tùy chọn)
                                </Text>
                                <View style={styles.filterInputContainer}>
                                    <MaterialIcons name="local-fire-department" size={20} color="#8A8C90" />
                                    <TextInput
                                        style={styles.filterInput}
                                        value={aiRequest.calories}
                                        onChangeText={(text) => setAiRequest({ ...aiRequest, calories: text })}
                                        placeholder="VD: 2000"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.filterInputUnit, { color: '#8A8C90' }]}>kcal</Text>
                                </View>
                            </View>

                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>
                                    <MaterialIcons name="calendar-today" size={16} color="#667eea" /> Ngày áp dụng
                                </Text>
                                <TextInput
                                    style={[styles.aiTextInput, { backgroundColor: '#2a2a2a', color: '#FFFFFF' }]}
                                    value={aiRequest.selectedDate}
                                    onChangeText={(text) => setAiRequest({ ...aiRequest, selectedDate: text })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>
                                    <MaterialIcons name="restaurant" size={16} color="#C2E66E" /> Sở thích món ăn (tùy chọn)
                                </Text>
                                <TextInput
                                    style={[styles.aiTextInput, { backgroundColor: '#2a2a2a', color: '#FFFFFF' }]}
                                    value={aiRequest.preferences}
                                    onChangeText={(text) => setAiRequest({ ...aiRequest, preferences: text })}
                                    placeholder="VD: Không ăn hải sản, thích món Việt Nam..."
                                    placeholderTextColor="#666"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.aiInfoBox}>
                                <MaterialIcons name="info-outline" size={18} color="#667eea" />
                                <Text style={[styles.aiInfoText, { color: '#8A8C90' }]}>
                                    AI sẽ tạo thực đơn dựa trên mục tiêu và sở thích của bạn. Quá trình có thể mất vài giây.
                                </Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalButtonSecondary}
                                onPress={() => setShowAIPanel(false)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButtonPrimary, isGenerating && { opacity: 0.6 }]}
                                onPress={handleGeneratePlan}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                        <Text style={styles.modalButtonPrimaryText}>Đang tạo... (30-90s)</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>Tạo kế hoạch</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Meal Type Selection Modal */}
            <Modal
                visible={showMealTypeModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => !addingMeal && setShowMealTypeModal(false)}
            >
                <View style={styles.addMealModalOverlay}>
                    <View style={styles.addMealModal}>
                        {/* Header */}
                        <View style={styles.addMealModalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.addMealModalTitle}>Thêm vào thực đơn</Text>
                                <Text style={styles.addMealModalSubtitle}>
                                    Chọn ngày và loại bữa cho món "{selectedMealForAdd?.name || 'món ăn'}"
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addMealClose}
                                onPress={() => setShowMealTypeModal(false)}
                                disabled={addingMeal}
                            >
                                <MaterialIcons name="close" size={20} color="#aaaaaa" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 500 }}>
                            {/* Ngày thêm vào - Calendar */}
                            <View style={styles.addMealField}>
                                <Text style={styles.addMealLabel}>Ngày thêm vào</Text>
                                <View style={styles.addMealCalendar}>
                                    {/* Calendar Header */}
                                    <View style={styles.calendarHeader}>
                                        <TouchableOpacity
                                            style={styles.calendarNavBtn}
                                            onPress={() => handleMonthChange(-1)}
                                        >
                                            <Text style={styles.calendarNavText}>‹</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.calendarMonthLabel}>{calendarMonthLabel}</Text>
                                        <TouchableOpacity
                                            style={styles.calendarNavBtn}
                                            onPress={() => handleMonthChange(1)}
                                        >
                                            <Text style={styles.calendarNavText}>›</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Weekday Labels */}
                                    <View style={styles.calendarWeekdays}>
                                        {WEEKDAY_LABELS.map(label => (
                                            <Text key={label} style={styles.calendarWeekdayText}>{label}</Text>
                                        ))}
                                    </View>

                                    {/* Calendar Grid */}
                                    <View style={styles.calendarGrid}>
                                        {generateCalendarDays().map((dateObj, index) => {
                                            if (!dateObj) {
                                                return <View key={`empty-${index}`} style={styles.calendarDayEmpty} />;
                                            }
                                            const iso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
                                                .toISOString().split('T')[0];
                                            const disabled = isDateDisabled(dateObj);
                                            const selected = iso === addToDate;
                                            return (
                                                <TouchableOpacity
                                                    key={iso}
                                                    style={[
                                                        styles.calendarDay,
                                                        selected && styles.calendarDaySelected,
                                                        disabled && styles.calendarDayDisabled
                                                    ]}
                                                    onPress={() => !disabled && handleDaySelect(dateObj)}
                                                    disabled={disabled}
                                                >
                                                    <Text style={[
                                                        styles.calendarDayText,
                                                        selected && styles.calendarDayTextSelected,
                                                        disabled && styles.calendarDayTextDisabled
                                                    ]}>
                                                        {dateObj.getDate()}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Selected Date Label */}
                                    {formattedSelectedDate && (
                                        <Text style={styles.calendarSelectedLabel}>
                                            Ngày đã chọn: {formattedSelectedDate}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Loại bữa ăn - Picker */}
                            <View style={styles.addMealField}>
                                <Text style={styles.addMealLabel}>Loại bữa ăn</Text>
                                {Platform.OS === 'ios' ? (
                                    <>
                                        <TouchableOpacity
                                            style={styles.pickerButton}
                                            onPress={() => setShowMealTypePicker(true)}
                                        >
                                            <Text style={styles.pickerButtonText}>{selectedMealType}</Text>
                                            <MaterialIcons name="arrow-drop-down" size={24} color="#ffffff" />
                                        </TouchableOpacity>

                                        {/* iOS Picker Modal */}
                                        <Modal
                                            visible={showMealTypePicker}
                                            transparent={true}
                                            animationType="slide"
                                        >
                                            <View style={styles.pickerModalOverlay}>
                                                <View style={styles.pickerModalContent}>
                                                    <View style={styles.pickerModalHeader}>
                                                        <TouchableOpacity onPress={() => setShowMealTypePicker(false)}>
                                                            <Text style={styles.pickerModalDone}>Xong</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <Picker
                                                        selectedValue={selectedMealType}
                                                        onValueChange={(value) => setSelectedMealType(value)}
                                                        style={styles.iosPicker}
                                                    >
                                                        {MEAL_TYPE_OPTIONS.map((option) => (
                                                            <Picker.Item key={option} label={option} value={option} />
                                                        ))}
                                                    </Picker>
                                                </View>
                                            </View>
                                        </Modal>
                                    </>
                                ) : (
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedMealType}
                                            onValueChange={(value) => setSelectedMealType(value)}
                                            style={styles.androidPicker}
                                            dropdownIconColor="#ffffff"
                                        >
                                            {MEAL_TYPE_OPTIONS.map((option) => (
                                                <Picker.Item key={option} label={option} value={option} />
                                            ))}
                                        </Picker>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.addMealActions}>
                            <TouchableOpacity
                                style={styles.btnCancel}
                                onPress={() => setShowMealTypeModal(false)}
                                disabled={addingMeal}
                            >
                                <Text style={styles.btnCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnConfirm, addingMeal && { opacity: 0.6 }]}
                                onPress={confirmAddToMealPlan}
                                disabled={addingMeal}
                            >
                                <Text style={styles.btnConfirmText}>
                                    {addingMeal ? 'Đang thêm...' : 'Thêm vào ngày này'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bộ lọc</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <MaterialIcons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>Độ khó</Text>
                                <View style={styles.filterOptions}>
                                    {['Tất cả', 'Dễ', 'Trung bình', 'Khó'].map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.filterOption,
                                                filters.difficulty === option && styles.filterOptionActive
                                            ]}
                                            onPress={() => setFilters({ ...filters, difficulty: option })}
                                        >
                                            <Text style={[
                                                styles.filterOptionText,
                                                filters.difficulty === option && styles.filterOptionTextActive
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>Calo tối thiểu</Text>
                                <View style={styles.filterInputContainer}>
                                    <MaterialIcons name="local-fire-department" size={20} color="#8A8C90" />
                                    <TextInput
                                        style={styles.filterInput}
                                        value={filters.minCalories}
                                        onChangeText={(text) => setFilters({ ...filters, minCalories: text })}
                                        placeholder="0"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>Calo tối đa</Text>
                                <View style={styles.filterInputContainer}>
                                    <MaterialIcons name="local-fire-department" size={20} color="#8A8C90" />
                                    <TextInput
                                        style={styles.filterInput}
                                        value={filters.maxCalories}
                                        onChangeText={(text) => setFilters({ ...filters, maxCalories: text })}
                                        placeholder="2000"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.filterGroup}>
                                <Text style={styles.filterLabel}>Điểm sức khỏe tối thiểu (0-100)</Text>
                                <View style={styles.filterInputContainer}>
                                    <MaterialIcons name="favorite" size={20} color="#8A8C90" />
                                    <TextInput
                                        style={styles.filterInput}
                                        value={filters.minHealthScore}
                                        onChangeText={(text) => setFilters({ ...filters, minHealthScore: text })}
                                        placeholder="0"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalButtonSecondary}
                                onPress={resetFilters}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Xóa bộ lọc</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButtonPrimary}
                                onPress={() => {
                                    setShowFilterModal(false);
                                    setDisplayCount(ITEMS_PER_PAGE);
                                }}
                            >
                                <Text style={styles.modalButtonPrimaryText}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {renderFeaturedMenu()}
                {renderAllMenuSection()}
                {renderPopularMenu()}
                {renderRecommendedMenu()}
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper function to get category color
const getCategoryColor = (category) => {
    const colorMap = {
        'Bữa sáng': '#DFF9A2',
        'Breakfast': '#DFF9A2',
        'Sáng': '#DFF9A2',
        'Bữa trưa': '#FFE6B5',
        'Lunch': '#FFE6B5',
        'Trưa': '#FFE6B5',
        'Ăn nhẹ': '#FFE6B5',
        'Snack': '#FFE6B5',
        'Phụ 1': '#FFE6B5',
        'Phụ 2': '#FFE6B5',
        'Phụ 3': '#FFE6B5',
        'Bữa tối': '#FFBE8A',
        'Dinner': '#FFBE8A',
        'Tối': '#FFBE8A',
        'Tất cả': '#F6F6F7',
        'All': '#F6F6F7'
    };
    return colorMap[category] || '#F6F6F7';
};

// Helper function to get health score color (0-100 scale)
const getHealthScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green - Excellent
    if (score >= 60) return '#FFC107'; // Yellow/Amber - Good
    if (score >= 40) return '#FF9800'; // Orange - Fair
    return '#F44336'; // Red - Poor
};

// Helper function to calculate active segments (10 segments = 100 points)
const getActiveSegments = (score) => {
    const clampedScore = Math.max(0, Math.min(100, score || 0));
    return Math.ceil(clampedScore / 10);
};

// Helper: map mealType DB sang label picker
const normalizeMealType = (type) => {
    if (!type) return 'Bữa trưa';
    const t = type.toString().toLowerCase();
    if (t.includes('sáng') || t.includes('breakfast')) return 'Bữa sáng';
    if (t.includes('phụ 1') || t.includes('phu 1') || t.includes('snack 1')) return 'Phụ 1';
    if (t.includes('phụ 2') || t.includes('phu 2') || t.includes('snack 2')) return 'Phụ 2';
    if (t.includes('phụ 3') || t.includes('phu 3') || t.includes('snack 3')) return 'Phụ 3';
    if (t.includes('tối') || t.includes('dinner')) return 'Bữa tối';
    if (t.includes('trưa') || t.includes('lunch')) return 'Bữa trưa';
    return 'Bữa trưa';
};

// Meal Card Component
const MealCard = ({ meal, onAddToMealPlan, onMealClick, colors }) => {
    const nutrition = meal.nutrition || {};
    const healthScore = meal.healthScore || 85;
    const scoreColor = getHealthScoreColor(healthScore);
    const activeSegments = getActiveSegments(healthScore);

    return (
        <TouchableOpacity
            style={[styles.mealCard, { backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', borderWidth: 1 }]}
            onPress={() => onMealClick(meal)}
            activeOpacity={0.8}
        >
            <View style={styles.mealTop}>
                <Image
                    source={{ uri: meal.image || meal.anhMonAn || 'https://via.placeholder.com/150' }}
                    style={styles.mealImage}
                />
                <View style={styles.mealInfo}>
                    <Text style={[styles.mealTitle, { color: colors.text }]} numberOfLines={2}>
                        {meal.name || meal.tenMonAn}
                    </Text>
                    <TouchableOpacity
                        style={[styles.mealAddButton, { backgroundColor: colors.primary }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onAddToMealPlan(meal);
                        }}
                    >
                        <Text style={[styles.mealAddText, { color: '#FFFFFF' }]}>Thêm vào thực đơn</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.mealContent}>
                <View style={styles.mealBadges}>
                    <View style={[styles.mealCategoryBadge, { backgroundColor: getCategoryColor(meal.mealType || meal.loaiMonAn) }]}>
                        <Text style={[styles.mealCategoryText, { color: '#000000' }]}>{meal.mealType || meal.loaiMonAn}</Text>
                    </View>
                    <View style={[styles.mealDifficultyBadge, { backgroundColor: '#FFFFFF' }]}>
                        <MaterialIcons name="bar-chart" size={10} color="#8A8C90" />
                        <Text style={[styles.mealDifficultyText, { color: '#52545B' }]}>{meal.difficulty || 'Dễ'}</Text>
                    </View>
                </View>

                <View style={styles.healthScoreSection}>
                    <View style={styles.healthScoreHeader}>
                        <Text style={[styles.healthScoreLabel, { color: '#8A8C90' }]}>Điểm sức khỏe:</Text>
                        <View style={styles.healthScoreAmount}>
                            <Text style={[styles.healthScoreValue, { color: scoreColor }]}>{healthScore}</Text>
                            <Text style={[styles.healthScoreMax, { color: '#8A8C90' }]}>/100</Text>
                        </View>
                    </View>
                    <View style={styles.healthScoreBar}>
                        {[...Array(10)].map((_, index) => {
                            const isActive = index < activeSegments;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.healthScoreSegment,
                                        {
                                            backgroundColor: isActive ? scoreColor : '#FFE6B5',
                                            opacity: isActive ? 1 : 0.4
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>
                </View>
            </View>

            <View style={[styles.mealNutrition, { backgroundColor: '#2a2a2a' }]}>
                <View style={styles.nutritionFact}>
                    <MaterialIcons name="local-fire-department" size={10} color="#8A8C90" />
                    <Text style={[styles.nutritionFactText, { color: '#8A8C90' }]}>{nutrition.caloriesKcal || 320} kcal</Text>
                </View>
                <View style={[styles.separator, { backgroundColor: '#444' }]} />
                <View style={styles.nutritionFact}>
                    <MaterialIcons name="bakery-dining" size={10} color="#8A8C90" />
                    <Text style={[styles.nutritionFactText, { color: '#8A8C90' }]}>{nutrition.carbsGrams || 30}g C</Text>
                </View>
                <View style={[styles.separator, { backgroundColor: '#444' }]} />
                <View style={styles.nutritionFact}>
                    <MaterialIcons name="egg" size={10} color="#8A8C90" />
                    <Text style={[styles.nutritionFactText, { color: '#8A8C90' }]}>{nutrition.proteinGrams || 14}g P</Text>
                </View>
                <View style={[styles.separator, { backgroundColor: '#444' }]} />
                <View style={styles.nutritionFact}>
                    <MaterialIcons name="opacity" size={10} color="#8A8C90" />
                    <Text style={[styles.nutritionFactText, { color: '#8A8C90' }]}>{nutrition.fatGrams || 18}g F</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Recommended Card Component
const RecommendedCard = ({ meal, onAddToMealPlan, onMealClick, colors }) => {
    const nutrition = meal.nutrition || {};

    return (
        <TouchableOpacity
            style={[styles.recommendedCard, { backgroundColor: '#141414' }]}
            onPress={() => onMealClick(meal)}
            activeOpacity={0.8}
        >
            <View style={styles.recommendedMain}>
                <Image
                    source={{ uri: meal.image || meal.anhMonAn || 'https://via.placeholder.com/100' }}
                    style={styles.recommendedImage}
                />
                <View style={styles.recommendedInfo}>
                    <Text style={[styles.recommendedTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
                        {meal.name || meal.tenMonAn}
                    </Text>
                    <View style={styles.recommendedBottom}>
                        <View style={[styles.recommendedCategory, { backgroundColor: getCategoryColor(meal.mealType || meal.loaiMonAn) }]}>
                            <Text style={[styles.recommendedCategoryText, { color: '#000000' }]}>{meal.mealType || meal.loaiMonAn}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.recommendedAddButton, { backgroundColor: '#da2128' }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                onAddToMealPlan(meal);
                            }}
                        >
                            <MaterialIcons name="add" size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={[styles.recommendedDivider, { backgroundColor: '#2a2a2a' }]} />

            <View style={styles.recommendedNutrition}>
                <View style={styles.recommendedNutrientItem}>
                    <View style={styles.recommendedNutrientLabel}>
                        <MaterialIcons name="local-fire-department" size={10} color="#8A8C90" />
                        <Text style={[styles.recommendedNutrientLabelText, { color: '#8A8C90' }]}>C</Text>
                    </View>
                    <Text style={[styles.recommendedNutrientValue, { color: '#FFFFFF' }]}>{nutrition.caloriesKcal || 350} kcal</Text>
                </View>
                <View style={styles.recommendedNutrientItem}>
                    <View style={styles.recommendedNutrientLabel}>
                        <MaterialIcons name="bakery-dining" size={10} color="#8A8C90" />
                        <Text style={[styles.recommendedNutrientLabelText, { color: '#8A8C90' }]}>C</Text>
                    </View>
                    <Text style={[styles.recommendedNutrientValue, { color: '#FFFFFF' }]}>{nutrition.carbsGrams || 45}g</Text>
                </View>
                <View style={styles.recommendedNutrientItem}>
                    <View style={styles.recommendedNutrientLabel}>
                        <MaterialIcons name="egg" size={10} color="#8A8C90" />
                        <Text style={[styles.recommendedNutrientLabelText, { color: '#8A8C90' }]}>P</Text>
                    </View>
                    <Text style={[styles.recommendedNutrientValue, { color: '#FFFFFF' }]}>{nutrition.proteinGrams || 12}g</Text>
                </View>
                <View style={styles.recommendedNutrientItem}>
                    <View style={styles.recommendedNutrientLabel}>
                        <MaterialIcons name="opacity" size={10} color="#8A8C90" />
                        <Text style={[styles.recommendedNutrientLabelText, { color: '#8A8C90' }]}>F</Text>
                    </View>
                    <Text style={[styles.recommendedNutrientValue, { color: '#FFFFFF' }]}>{nutrition.fatGrams || 14}g</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E2',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#272932',

    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },

    // Featured Section
    featuredSection: {
        marginBottom: 32,
        paddingTop: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#272932',
    },
    featuredCard: {
        backgroundColor: '#F9F4F2',
        borderRadius: 14,
        marginHorizontal: 16,
        padding: 20,
    },
    featuredImage: {
        width: '100%',
        height: 200,
        borderRadius: 14,
        marginBottom: 20,
    },
    featuredContent: {
        paddingHorizontal: 4,
    },
    featuredTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#272932',
        lineHeight: 28,
        marginBottom: 12,
    },
    featuredBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 16,
    },
    categoryText: {
        fontSize: 12,
        color: '#52545B',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: '#52545B',
        marginLeft: 4,
    },
    featuredDetails: {
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202020',
        padding: 8,
        borderRadius: 8,
        marginRight: 12,
    },
    detailIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#F6F6F7',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    detailLabel: {
        fontSize: 11,
        color: '#8A8C90',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fefcfb',
    },
    nutritionGridSection: {
        marginTop: 24,
        marginBottom: 24,
    },
    nutritionRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    nutritionItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginRight: 12,
    },
    nutritionLabel: {
        fontSize: 11,
        color: '#52545B',
        marginLeft: 8,
    },
    nutritionValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginLeft: 8,
    },
    nutritionAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#272932',
    },
    nutritionUnit: {
        fontSize: 12,
        color: '#272932',
        marginLeft: 2,
    },
    addButton: {
        backgroundColor: '#C2E66E',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#272932',
    },

    // All Menu Section
    allMenuSection: {
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F6F6F7',
        borderRadius: 8,
    },
    filterText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#52545B',
        marginLeft: 2,
    },
    categoryButtonsContainer: {
        marginBottom: 16,
    },
    categoryButtons: {
        flexDirection: 'row',
        backgroundColor: '#F6F6F7',
        borderRadius: 10,
        padding: 2,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 2,
    },
    categoryButtonActive: {
        backgroundColor: '#C2E66E',
    },
    categoryButtonText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#52545B',
    },
    categoryButtonTextActive: {
        color: '#272932',
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sortLabel: {
        fontSize: 11,
        color: '#8A8C90',
        marginRight: 10,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F6F6F7',
        borderRadius: 8,
    },
    sortText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#52545B',
        marginRight: 2,
    },

    // Meal Card
    mealCard: {
        backgroundColor: '#F9F4F2',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    mealTop: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    mealImage: {
        width: 152,
        height: 104,
        borderRadius: 16,
        marginRight: 20,
    },
    mealInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    mealTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#272932',
    },
    mealAddButton: {
        backgroundColor: '#C2E66E',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    mealAddText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#272932',
    },
    mealContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    mealBadges: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealCategoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 11,
    },
    mealCategoryText: {
        fontSize: 10,
        color: '#000000',
    },
    mealDifficultyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
    },
    mealDifficultyText: {
        fontSize: 10,
        color: '#52545B',
        marginLeft: 4,
    },
    healthScore: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    healthScoreSection: {
        gap: 2,
        paddingBottom: 6,
    },
    healthScoreHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    },
    healthScoreAmount: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    healthScoreLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8A8C90',
        marginRight: 4,
    },
    healthScoreValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    healthScoreMax: {
        fontSize: 14,
        color: '#8A8C90',
    },
    healthScoreBar: {
        flexDirection: 'row',
        gap: 4,
        height: 5,
    },
    healthScoreSegment: {
        flex: 1,
        height: 5,
        borderRadius: 2.5,
    },
    mealNutrition: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 6,
    },
    nutritionFact: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nutritionFactText: {
        fontSize: 10,
        color: '#52545B',
        marginLeft: 4,
    },
    separator: {
        width: 1,
        height: '100%',
        backgroundColor: '#E1E1E2',
    },

    // Popular Section
    popularSection: {
        backgroundColor: '#0a0a0a',
        padding: 16,
        marginBottom: 16,
    },
    popularCard: {
        backgroundColor: '#141414',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignSelf: 'stretch',
    },
    popularImage: {
        width: 68,
        height: 68,
        borderRadius: 12,
        marginRight: 12,
    },
    popularInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    popularTop: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    popularTitle: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    popularAddButton: {
        width: 24,
        height: 24,
        backgroundColor: '#da2128',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    popularDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    popularRating: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
        backgroundColor: '#202020',
        borderRadius: 6,
    },
    popularRatingText: {
        fontSize: 11,
        color: '#fefcfb',
        marginLeft: 4,
    },
    popularRatingLimit: {
        fontSize: 10,
        color: '#8A8C90',
    },
    popularCategory: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
    },
    popularCategoryText: {
        fontSize: 11,
        color: '#000000',
    },

    // Recommended Section
    recommendedSection: {
        backgroundColor: '#0a0a0a',
        padding: 16,
        marginBottom: 16,
    },
    recommendedCard: {
        backgroundColor: '#141414',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    recommendedMain: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    recommendedImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginRight: 16,
    },
    recommendedInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    recommendedTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    recommendedBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    recommendedCategory: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recommendedCategoryText: {
        fontSize: 11,
        color: '#000000',
    },
    recommendedAddButton: {
        width: 20,
        height: 20,
        backgroundColor: '#da2128',
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recommendedDivider: {
        height: 1,
        backgroundColor: '#2a2a2a',
        marginBottom: 16,
    },
    recommendedNutrition: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    recommendedNutrientItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendedNutrientLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 6,
    },
    recommendedNutrientLabelText: {
        fontSize: 11,
        color: '#8A8C90',
        marginLeft: 2,
    },
    recommendedNutrientValue: {
        fontSize: 11,
        color: '#FFFFFF',
    },

    // Footer
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#52545B',
    },

    // Sort Dropdown
    sortDropdown: {
        position: 'absolute',
        top: 140,
        right: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 8,
        zIndex: 1000,
        minWidth: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    sortOptionActive: {
        backgroundColor: '#1a1a1a',
    },
    sortOptionText: {
        fontSize: 14,
        color: '#8A8C90',
        flex: 1,
    },
    sortOptionTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // Load More Button
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 24,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 8,
    },

    // Empty State
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8A8C90',
        textAlign: 'center',
        marginBottom: 16,
    },
    resetFiltersButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    resetFiltersText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
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
        borderBottomColor: '#2a2a2a',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalBody: {
        padding: 20,
    },
    filterGroup: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    filterOptionActive: {
        backgroundColor: '#da2128',
        borderColor: '#da2128',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#8A8C90',
    },
    filterOptionTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    filterInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    filterInput: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
    },
    modalButtonSecondary: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalButtonPrimary: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#da2128',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // AI Modal
    aiModalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
    },
    aiTextInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#FFFFFF',
        minHeight: 44,
        textAlignVertical: 'top',
    },
    filterInputUnit: {
        fontSize: 14,
        color: '#8A8C90',
        marginLeft: 8,
    },
    aiInfoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    aiInfoText: {
        flex: 1,
        fontSize: 12,
        color: '#8A8C90',
        lineHeight: 18,
    },
    // Add Meal Modal Styles (giống billions-gym web 100%)
    addMealModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    addMealModal: {
        backgroundColor: '#141414',
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderRadius: 16,
        width: '100%',
        maxWidth: 420,
        padding: 24,
    },
    addMealModalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    addMealModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    addMealModalSubtitle: {
        fontSize: 14,
        color: '#a7a7a7',
        marginTop: 4,
    },
    addMealClose: {
        padding: 4,
    },
    addMealField: {
        marginBottom: 16,
    },
    addMealLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#dddddd',
        marginBottom: 6,
    },
    addMealCalendar: {
        backgroundColor: '#1c1c1c',
        borderWidth: 1,
        borderColor: '#2f2f2f',
        borderRadius: 12,
        padding: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    calendarNavBtn: {
        backgroundColor: '#2a2a2a',
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarNavText: {
        color: '#ffffff',
        fontSize: 18,
        lineHeight: 18,
    },
    calendarMonthLabel: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    calendarWeekdays: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    calendarWeekdayText: {
        fontSize: 12,
        color: '#aaaaaa',
        width: 40,
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    calendarDay: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarDaySelected: {
        backgroundColor: '#da2128',
    },
    calendarDayDisabled: {
        opacity: 0.4,
    },
    calendarDayEmpty: {
        width: 40,
        height: 40,
    },
    calendarDayText: {
        color: '#ffffff',
        fontSize: 14,
    },
    calendarDayTextSelected: {
        color: '#ffffff',
        fontWeight: '600',
    },
    calendarDayTextDisabled: {
        color: '#666666',
    },
    calendarSelectedLabel: {
        fontSize: 13,
        color: '#bbbbbb',
        marginTop: 12,
    },
    // Add Meal Actions (giống web)
    addMealActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    btnCancel: {
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderWidth: 0,
    },
    btnCancelText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    btnConfirm: {
        backgroundColor: '#da2128',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderWidth: 0,
    },
    btnConfirmText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    addMealSelect: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    mealTypeOptionNew: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#1f1f1f',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
    },
    mealTypeOptionNewSelected: {
        backgroundColor: '#da2128',
        borderColor: '#da2128',
    },
    mealTypeOptionTextNew: {
        fontSize: 14,
        color: '#ffffff',
    },
    mealTypeOptionTextNewSelected: {
        color: '#ffffff',
        fontWeight: '600',
    },
    // Picker styles (giống web select)
    pickerButton: {
        backgroundColor: '#1f1f1f',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: {
        color: '#ffffff',
        fontSize: 14,
    },
    pickerContainer: {
        backgroundColor: '#1f1f1f',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        overflow: 'hidden',
    },
    androidPicker: {
        backgroundColor: '#1f1f1f',
        color: '#ffffff',
        height: 50,
    },
    iosPicker: {
        backgroundColor: '#181818',
        color: '#fff',
        height: 200,
    },
    pickerModalContent: {
        backgroundColor: '#181818',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    pickerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        backgroundColor: '#181818',
    },
    pickerModalDone: {
        color: '#da2128',
        fontSize: 16,
        fontWeight: '600',
    },
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8A8C90',
        marginTop: 16,
        marginBottom: 24,
    },
    emptyStateButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    mealsGrid: {
        paddingHorizontal: 16,
        gap: 16,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        gap: 8,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
    popularSection: {
        marginBottom: 32,
    },
    popularScroll: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    popularCard: {
        width: 160,
        borderRadius: 12,
        overflow: 'hidden',
    },
    popularImage: {
        width: '100%',
        height: 120,
    },
    popularInfo: {
        padding: 12,
    },
    popularTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    popularTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
    },
    popularAddButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    popularDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    popularRating: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    popularRatingText: {
        fontSize: 11,
        fontWeight: '600',
    },
    popularRatingLimit: {
        fontSize: 11,
    },
    popularCategory: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    popularCategoryText: {
        fontSize: 11,
    },
});

export default NutritionScreen;


