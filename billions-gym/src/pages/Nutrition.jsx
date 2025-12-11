import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MagnifyingGlass, Funnel, Plus, Star, ChartBar, Clock, Sparkle, X, Calendar, BookOpen, Calculator, List, FileText } from '@phosphor-icons/react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { nutritionAPI } from '../services/api';
import './Nutrition.css';

const MEAL_TYPE_OPTIONS = ['Bữa sáng', 'Phụ 1', 'Bữa trưa', 'Phụ 2', 'Bữa tối', 'Phụ 3'];

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const getLocalDateValue = (date = new Date()) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().split('T')[0];
};

const deriveMealTypeLabel = (type = '') => {
    const normalized = type.toString().toLowerCase();

    if (normalized.includes('sáng') || normalized.includes('sang') || normalized.includes('breakfast')) return 'Bữa sáng';
    if (normalized.includes('phụ 1') || normalized.includes('phu 1') || normalized.includes('snack 1')) return 'Phụ 1';
    if (normalized.includes('phụ 2') || normalized.includes('phu 2') || normalized.includes('snack 2')) return 'Phụ 2';
    if (normalized.includes('phụ 3') || normalized.includes('phu 3') || normalized.includes('snack 3')) return 'Phụ 3';
    if (normalized.includes('tối') || normalized.includes('toi') || normalized.includes('dinner')) return 'Bữa tối';
    if (normalized.includes('trưa') || normalized.includes('trua') || normalized.includes('lunch')) return 'Bữa trưa';

    return 'Bữa trưa';
};

const Nutrition = () => {
    const [allMenus, setAllMenus] = useState([]); // Store all meals from API
    const [featuredMenu, setFeaturedMenu] = useState(null);
    const [popularMenus, setPopularMenus] = useState([]);
    const [recommendedMenus, setRecommendedMenus] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Đánh giá');
    const [viewMode, setViewMode] = useState('grid');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAddMealModal, setShowAddMealModal] = useState(false);
    const [mealToAdd, setMealToAdd] = useState(null);
    const [addMealDate, setAddMealDate] = useState(() => getLocalDateValue());
    const [selectedMealType, setSelectedMealType] = useState('Bữa trưa');
    const [addingMeal, setAddingMeal] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        difficulty: 'Tất cả',
        minCalories: '',
        maxCalories: '',
        minHealthScore: '',
        goals: [],
        cuisineType: 'Tất cả'
    });
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [aiRequest, setAiRequest] = useState({
        goal: '',
        calories: '',
        selectedDate: new Date().toISOString().split('T')[0], // Default: today
        preferences: ''
    });
    const [goalHistory, setGoalHistory] = useState([]);
    const [showGoalHistory, setShowGoalHistory] = useState(false);
    const goalHistoryTimeout = useRef(null);
    const [caloriesLoading, setCaloriesLoading] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null); // For meal detail modal
    const [showMealModal, setShowMealModal] = useState(false);
    const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients', 'instructions', 'video' - for meal modal
    const [activePageTab, setActivePageTab] = useState('menu'); // 'menu', 'plans', 'info', 'calculator', 'stats' - for page tabs
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const todayISO = useMemo(() => getLocalDateValue(), []);
    const todayStart = useMemo(() => {
        const base = new Date(todayISO);
        base.setHours(0, 0, 0, 0);
        return base;
    }, [todayISO]);

    // Load data from API
    useEffect(() => {
        loadNutritionData();
    }, []); // Load once on mount, filtering is done on frontend

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            // Search is handled in useMemo filteredMenus
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadNutritionData = async () => {
        try {
            // Load featured, popular, recommended meals from database
            const featuredResult = await nutritionAPI.getFeaturedMeals();
            if (featuredResult.success && featuredResult.data) {
                const { featured, popular, recommended } = featuredResult.data;

                if (featured) {
                    setFeaturedMenu(mapMealToMenu(featured));
                } else {
                    setFeaturedMenu(null);
                }

                if (popular && popular.length > 0) {
                    setPopularMenus(popular.map(mapMealToMenu));
                } else {
                    setPopularMenus([]);
                }

                if (recommended && recommended.length > 0) {
                    setRecommendedMenus(recommended.map(mapMealToMenu));
                } else {
                    setRecommendedMenus([]);
                }
            } else {
                // No featured meals available
                setFeaturedMenu(null);
                setPopularMenus([]);
                setRecommendedMenus([]);
            }

            // Load all meals (load more to allow filtering/sorting on frontend)
            console.log('Calling getAllMeals API...');
            const params = {
                limit: 200 // Load more meals for filtering
            };
            // Only add mealType if it's defined and not 'Tất cả'
            if (selectedCategory && selectedCategory !== 'Tất cả') {
                params.mealType = selectedCategory;
            }
            const mealsResult = await nutritionAPI.getAllMeals(params);

            console.log('getAllMeals API response:', mealsResult);

            if (mealsResult && mealsResult.success && mealsResult.data) {
                console.log('Raw meals data:', mealsResult.data);
                const mappedMeals = mealsResult.data.map(mapMealToMenu);
                console.log('Loaded meals:', mappedMeals.length);
                console.log('First meal sample:', mappedMeals[0]);
                setAllMenus(mappedMeals);
            } else {
                console.log('No meals data or error:', mealsResult);
                setAllMenus([]);
            }
        } catch (error) {
            console.error('Error loading nutrition data:', error);
            // Set empty states instead of mock data
            setFeaturedMenu(null);
            setPopularMenus([]);
            setRecommendedMenus([]);
            setAllMenus([]);
        }
    };

    // Filter and sort meals
    const filteredAndSortedMenus = useMemo(() => {
        console.log('Filtering meals. Total:', allMenus.length, 'Category:', selectedCategory, 'Search:', searchQuery, 'Filters:', filters);
        let filtered = [...allMenus];

        // Filter by category
        if (selectedCategory !== 'Tất cả') {
            filtered = filtered.filter(meal => {
                const mealType = meal.mealType || meal.category;
                // Map "Ăn nhẹ" to all snack types
                if (selectedCategory === 'Ăn nhẹ') {
                    return mealType === 'Ăn nhẹ' || mealType === 'Phụ 1' || mealType === 'Phụ 2' || mealType === 'Phụ 3';
                }
                return mealType === selectedCategory;
            });
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(meal => {
                const name = (meal.name || '').toLowerCase();
                const description = (meal.description || '').toLowerCase();
                return name.includes(query) || description.includes(query);
            });
        }

        // Filter by difficulty
        if (filters.difficulty && filters.difficulty !== 'Tất cả') {
            filtered = filtered.filter(meal => meal.difficulty === filters.difficulty);
        }

        // Filter by calories range
        if (filters.minCalories && filters.minCalories !== '') {
            const min = parseInt(filters.minCalories);
            if (!isNaN(min)) {
                filtered = filtered.filter(meal => {
                    const calories = meal.nutrition?.calories || 0;
                    return calories >= min;
                });
            }
        }
        if (filters.maxCalories && filters.maxCalories !== '') {
            const max = parseInt(filters.maxCalories);
            if (!isNaN(max)) {
                filtered = filtered.filter(meal => {
                    const calories = meal.nutrition?.calories || 0;
                    return calories <= max;
                });
            }
        }

        // Filter by health score
        if (filters.minHealthScore && filters.minHealthScore !== '') {
            const min = parseInt(filters.minHealthScore);
            if (!isNaN(min)) {
                filtered = filtered.filter(meal => (meal.healthScore || 0) >= min);
            }
        }

        // Sort meals
        const sorted = [...filtered];
        switch (sortBy) {
            case 'Đánh giá':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'Calories tăng dần':
                sorted.sort((a, b) => (a.nutrition.calories || 0) - (b.nutrition.calories || 0));
                break;
            case 'Calories giảm dần':
                sorted.sort((a, b) => (b.nutrition.calories || 0) - (a.nutrition.calories || 0));
                break;
            case 'Điểm sức khỏe':
                sorted.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));
                break;
            case 'Thời gian nấu':
                sorted.sort((a, b) => {
                    // Parse cookDuration from "120 phút" format
                    const parseTime = (timeStr) => {
                        if (!timeStr) return 0;
                        const match = timeStr.toString().match(/(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };
                    const timeA = parseTime(a.cookDuration);
                    const timeB = parseTime(b.cookDuration);
                    return timeA - timeB;
                });
                break;
            case 'Tên A-Z':
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'Tên Z-A':
                sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            default:
                break;
        }

        console.log('Filtered and sorted meals:', sorted.length);
        return sorted;
    }, [allMenus, selectedCategory, searchQuery, sortBy, filters]);

    // Get menus for display with pagination
    const totalPages = Math.ceil(filteredAndSortedMenus.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMenus = filteredAndSortedMenus.slice(startIndex, endIndex);
    const menus = selectedCategory === 'Tất cả' ? paginatedMenus : filteredAndSortedMenus;

    const mapMealToMenu = (meal) => {
        // Map both Gemini meal format and DB Meal model to UI format
        const categoryMap = {
            'Bữa sáng': 'Bữa sáng',
            'Bữa trưa': 'Bữa trưa',
            'Bữa tối': 'Bữa tối',
            'Ăn nhẹ': 'Ăn nhẹ',
            'Phụ 1': 'Phụ 1',
            'Phụ 2': 'Phụ 2',
            'Phụ 3': 'Phụ 3'
        };

        const difficultyMap = {
            'Dễ': 'Dễ',
            'Trung bình': 'Trung bình',
            'Khó': 'Khó'
        };

        // Handle both DB model (with _id) and Gemini response (with id)
        const mealId = meal._id || meal.id;
        // Handle both DB format (tenMonAn) and API format (name)
        const mealName = meal.tenMonAn || meal.name || '';
        // Handle both DB format (loaiMonAn) and API format (mealType)
        const mealType = meal.loaiMonAn || meal.mealType;
        // Handle both DB format (thongTinDinhDuong) and API format (nutrition)
        const nutrition = meal.thongTinDinhDuong || meal.nutrition || {};

        // Ensure nutrition object exists
        if (!nutrition || typeof nutrition !== 'object') {
            console.warn('Meal missing nutrition:', meal);
        }

        // Debug: Log if meal name is missing
        if (!mealName) {
            console.warn('Meal missing name:', meal);
        }

        // Handle different nutrition formats
        const calories = nutrition.caloriesKcal || meal.caloriesKcal || meal.calories || 450;
        const carbs = nutrition.carbsGrams || meal.carbsGrams || meal.carbs || 40;
        const proteins = nutrition.proteinGrams || meal.proteinGrams || meal.proteins || 35;
        const fats = nutrition.fatGrams || meal.fatGrams || meal.fats || 12;

        return {
            id: mealId,
            _id: mealId, // Keep _id for DB operations
            name: mealName,
            category: categoryMap[mealType] || mealType || 'Bữa trưa',
            mealType: mealType, // Keep original mealType
            rating: meal.rating || 4.8,
            reviews: meal.ratingCount || meal.reviews || 125,
            image: meal.image || '/placeholder-menu.jpg',
            difficulty: difficultyMap[meal.difficulty] || meal.difficulty || 'Trung bình',
            healthScore: meal.healthScore || 85,
            cookDuration: `${meal.cookingTimeMinutes || 10} phút`,
            totalSteps: meal.stepCount || 4,
            description: meal.description || '',
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || [],
            cookingVideoUrl: meal.cookingVideoUrl || '',
            nutrition: {
                calories: calories,
                carbs: carbs,
                proteins: proteins,
                fats: fats
            }
        };
    };

    const openAddMealModal = (meal, event) => {
        if (event) {
            event.stopPropagation();
        }
        if (!meal) return;

        setMealToAdd(meal);
        setSelectedMealType(deriveMealTypeLabel(meal.mealType || meal.category));
        const baseDate = new Date(todayISO);
        setAddMealDate(getLocalDateValue(baseDate));
        setCalendarMonth({ year: baseDate.getFullYear(), month: baseDate.getMonth() });
        setShowAddMealModal(true);
    };

    const closeAddMealModal = () => {
        if (addingMeal) return;
        setShowAddMealModal(false);
        setMealToAdd(null);
    };

    const handleAddToMealPlan = async () => {
        if (!mealToAdd) return;
        try {
            setAddingMeal(true);
            const mealId = mealToAdd._id || mealToAdd.id;

            if (!mealId) {
                alert('Không thể thêm món ăn: thiếu ID');
                return;
            }

            const result = await nutritionAPI.addMealToPlan(mealId, selectedMealType, addMealDate);

            if (result.success) {
                alert('Đã thêm món ăn vào thực đơn của bạn!');
                closeAddMealModal();
            } else {
                alert('Lỗi: ' + (result.message || 'Không thể thêm món ăn'));
            }
        } catch (error) {
            console.error('Error adding meal to plan:', error);
            alert('Lỗi: ' + (error.message || 'Không thể thêm món ăn vào thực đơn'));
        } finally {
            setAddingMeal(false);
        }
    };

    const handleMealClick = (meal) => {
        setSelectedMeal(meal);
        setShowMealModal(true);
        setActiveTab('ingredients'); // Reset to first tab when opening modal
    };

    // Convert YouTube URL to embed format
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        // Handle different YouTube URL formats
        let videoId = null;

        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }

        // Format: https://youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch) {
            videoId = shortMatch[1];
        }

        // Format: https://www.youtube.com/embed/VIDEO_ID
        const embedMatch = url.match(/embed\/([^?&]+)/);
        if (embedMatch) {
            videoId = embedMatch[1];
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return null;
    };


    const handleGeneratePlan = async () => {
        if (!aiRequest.goal) {
            alert('Vui lòng nhập mục tiêu dinh dưỡng');
            return;
        }

        setIsGenerating(true);
        try {
            const selectedDate = new Date(aiRequest.selectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                alert('Vui lòng chọn ngày hôm nay hoặc ngày tương lai');
                return;
            }

            console.log('Generating plan with:', aiRequest);
            const result = await nutritionAPI.generatePlan(
                aiRequest.goal,
                aiRequest.calories || undefined,
                'daily',
                aiRequest.preferences,
                '',
                aiRequest.selectedDate
            );

            console.log('Plan generation result:', result);

            if (result && result.success && result.data) {
                setShowAIPanel(false);
                alert('Đã tạo thực đơn thành công! Vui lòng xem trong trang "Bữa ăn của tôi".');
                setAiRequest({
                    goal: '',
                    calories: '',
                    selectedDate: new Date().toISOString().split('T')[0],
                    preferences: ''
                });
            } else {
                const errorMsg = result?.message || 'Không thể tạo kế hoạch';
                console.error('Plan generation failed:', result);
                alert('Lỗi: ' + errorMsg);
            }
        } catch (error) {
            console.error('Error generating plan:', error);
            let errorMessage = 'Không thể tạo kế hoạch dinh dưỡng';

            if (error.message) {
                if (error.message.includes('quota') || error.message.includes('hết quota') || error.message.includes('429')) {
                    errorMessage = error.message + '\n\n💡 Giải pháp:\n- Đợi vài phút rồi thử lại\n- Hoặc đợi đến ngày mai (quota reset mỗi ngày)\n- Nếu cần sử dụng nhiều, vui lòng nâng cấp API key';
                } else if (error.message.includes('overload') || error.message.includes('quá tải') || error.message.includes('503')) {
                    errorMessage = error.message + '\n\n💡 Vui lòng đợi vài phút rồi thử lại.';
                } else if (error.message.includes('CONNECTION_REFUSED') || error.message.includes('fetch')) {
                    errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend server có đang chạy không?\n2. Server có chạy ở port 4000 không?\n3. Kiểm tra console của backend để xem có lỗi gì không.';
                } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
                } else {
                    errorMessage = error.message;
                }
            }

            alert('Lỗi: ' + errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchGoalHistory = useCallback(async () => {
        try {
            const response = await nutritionAPI.getGoalHistory();
            if (response?.success && Array.isArray(response.data)) {
                setGoalHistory(response.data);
            } else {
                setGoalHistory([]);
            }
        } catch (error) {
            console.error('Error fetching goal history:', error);
        }
    }, []);

    const fetchRecommendedCalories = useCallback(async (goalText) => {
        if (!goalText || goalText.trim().length < 3) {
            return;
        }
        const normalizedGoal = goalText.trim().toLowerCase();
        try {
            setCaloriesLoading(true);
            const response = await nutritionAPI.getRecommendedCalories(goalText);
            if (response?.success && response.data?.calories) {
                setAiRequest(prev => {
                    if (prev.goal.trim().toLowerCase() !== normalizedGoal) {
                        return prev;
                    }
                    return { ...prev, calories: String(response.data.calories) };
                });
            }
        } catch (error) {
            console.error('Error fetching recommended calories:', error);
        } finally {
            setCaloriesLoading(false);
        }
    }, []);

    const handleGoalFocus = () => {
        if (goalHistory.length === 0) {
            fetchGoalHistory();
        }
        setShowGoalHistory(true);
    };

    const handleGoalBlur = () => {
        if (goalHistoryTimeout.current) {
            clearTimeout(goalHistoryTimeout.current);
        }
        goalHistoryTimeout.current = setTimeout(() => setShowGoalHistory(false), 150);
    };

    const handleGoalSelect = (item) => {
        if (goalHistoryTimeout.current) {
            clearTimeout(goalHistoryTimeout.current);
        }
        setAiRequest(prev => ({
            ...prev,
            goal: item.goal,
            preferences: prev.preferences || item.preferences || ''
        }));
        setShowGoalHistory(false);
        fetchRecommendedCalories(item.goal);
    };

    useEffect(() => {
        return () => {
            if (goalHistoryTimeout.current) {
                clearTimeout(goalHistoryTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!showAIPanel) {
            setShowGoalHistory(false);
            return;
        }
        fetchGoalHistory();
    }, [showAIPanel, fetchGoalHistory]);

    useEffect(() => {
        if (!showAIPanel) return;
        if (!aiRequest.goal || aiRequest.goal.trim().length < 3) {
            setAiRequest(prev => (prev.calories ? { ...prev, calories: '' } : prev));
            return;
        }
        const timer = setTimeout(() => fetchRecommendedCalories(aiRequest.goal), 500);
        return () => clearTimeout(timer);
    }, [aiRequest.goal, showAIPanel, fetchRecommendedCalories]);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };

        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        if (!showAddMealModal) return;
        const baseDate = addMealDate ? new Date(addMealDate) : new Date(todayISO);
        if (!Number.isNaN(baseDate.getTime())) {
            setCalendarMonth({ year: baseDate.getFullYear(), month: baseDate.getMonth() });
        }
    }, [showAddMealModal, addMealDate, todayISO]);

    const calendarDays = useMemo(() => {
        const { year, month } = calendarMonth;
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        const daysInMonth = end.getDate();
        const firstDayIndex = (start.getDay() + 6) % 7;
        const cells = [];

        for (let i = 0; i < firstDayIndex; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(new Date(year, month, day));
        }
        while (cells.length % 7 !== 0) {
            cells.push(null);
        }

        return cells;
    }, [calendarMonth]);

    const calendarMonthLabel = useMemo(() => {
        return new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    }, [calendarMonth]);

    const isDateDisabled = (dateObj) => {
        if (!dateObj) return true;
        const candidate = new Date(dateObj);
        candidate.setHours(0, 0, 0, 0);
        return candidate < todayStart;
    };

    const handleMonthChange = (offset) => {
        setCalendarMonth(prev => {
            const target = new Date(prev.year, prev.month + offset, 1);
            return { year: target.getFullYear(), month: target.getMonth() };
        });
    };

    const handleDaySelect = (dateObj) => {
        if (!dateObj || isDateDisabled(dateObj)) return;
        setAddMealDate(getLocalDateValue(dateObj));
    };

    const formattedSelectedDate = useMemo(() => {
        if (!addMealDate) return '';
        const date = new Date(addMealDate);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    }, [addMealDate]);

    const categories = ['Tất cả', 'Bữa sáng', 'Bữa trưa', 'Ăn nhẹ', 'Bữa tối'];
    const sortOptions = [
        'Đánh giá',
        'Calories tăng dần',
        'Calories giảm dần',
        'Điểm sức khỏe',
        'Thời gian nấu',
        'Tên A-Z',
        'Tên Z-A'
    ];
    const difficultyOptions = ['Tất cả', 'Dễ', 'Trung bình', 'Khó'];

    const getCategoryColor = (category) => {
        const colors = {
            'Bữa sáng': '#DFF9A2',
            'Bữa trưa': '#FFE6B5',
            'Ăn nhẹ': '#FFE6B5',
            'Bữa tối': '#FFBE8A'
        };
        return colors[category] || '#F6F6F7';
    };

    // Get health score color based on score (0-100)
    const getHealthScoreColor = (score) => {
        if (score >= 80) return '#4CAF50'; // Green - Excellent
        if (score >= 60) return '#FFC107'; // Yellow/Amber - Good
        if (score >= 40) return '#FF9800'; // Orange - Fair
        return '#F44336'; // Red - Poor
    };

    // Calculate number of active segments (10 segments = 100 points, each segment = 10 points)
    const getActiveSegments = (score) => {
        // Clamp score between 0 and 100
        const clampedScore = Math.max(0, Math.min(100, score || 0));
        // Each segment represents 10 points
        return Math.ceil(clampedScore / 10);
    };

    const handleSortChange = (option) => {
        setSortBy(option);
        setShowSortDropdown(false);
    };

    const toggleFilterPanel = () => {
        setShowFilterPanel(!showFilterPanel);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset current page when category or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery, sortBy, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetFilters = () => {
        setFilters({
            difficulty: 'Tất cả',
            minCalories: '',
            maxCalories: '',
            minHealthScore: '',
            goals: [],
            cuisineType: 'Tất cả'
        });
        setSearchQuery('');
        setSelectedCategory('Tất cả');
        setSortBy('đánh giá');
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.difficulty !== 'Tất cả') count++;
        if (filters.minCalories) count++;
        if (filters.maxCalories) count++;
        if (filters.minHealthScore) count++;
        if (filters.goals.length > 0) count++;
        if (filters.cuisineType !== 'Tất cả') count++;
        return count;
    };

    const getDifficultyIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 12.5H13.5V2.5C13.5 2.36739 13.4473 2.24021 13.3536 2.14645C13.2598 2.05268 13.1326 2 13 2H9.5C9.36739 2 9.24021 2.05268 9.14645 2.14645C9.05268 2.24021 9 2.36739 9 2.5V5H6C5.86739 5 5.74021 5.05268 5.64645 5.14645C5.55268 5.24021 5.5 5.36739 5.5 5.5V8H3C2.86739 8 2.74021 8.05268 2.64645 8.14645C2.55268 8.24021 2.5 8.36739 2.5 8.5V12.5H2C1.86739 12.5 1.74021 12.5527 1.64645 12.6464C1.55268 12.7402 1.5 12.8674 1.5 13C1.5 13.1326 1.55268 13.2598 1.64645 13.3536C1.74021 13.4473 1.86739 13.5 2 13.5H14C14.1326 13.5 14.2598 13.4473 14.3536 13.3536C14.4473 13.2598 14.5 13.1326 14.5 13C14.5 12.8674 14.4473 12.7402 14.3536 12.6464C14.2598 12.5527 14.1326 12.5 14 12.5ZM10 3H12.5V12.5H10V3ZM6.5 6H9V12.5H6.5V6ZM3.5 9H5.5V12.5H3.5V9Z" fill="rgba(254, 252, 251, 1)" />
    </svg>;

    // Kcal icon for featured menu
    const getKcalIcon = () => (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.4931 9.58365C11.3635 10.3078 11.0151 10.9749 10.4948 11.4951C9.9745 12.0153 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4999 8.25375 12.4527 8.16148 12.3678C8.06921 12.2828 8.01223 12.1663 8.00185 12.0413C7.99146 11.9163 8.02843 11.792 8.10542 11.693C8.18242 11.594 8.2938 11.5275 8.4175 11.5068C9.45312 11.3324 10.3319 10.4536 10.5075 9.41615C10.5297 9.28536 10.603 9.16876 10.7112 9.09199C10.8193 9.01521 10.9536 8.98456 11.0844 9.00677C11.2152 9.02899 11.3318 9.10224 11.4085 9.21043C11.4853 9.31861 11.516 9.45286 11.4937 9.58365H11.4931ZM13.5 8.9999C13.5 10.4586 12.9205 11.8575 11.8891 12.889C10.8576 13.9204 9.45869 14.4999 8 14.4999C6.54131 14.4999 5.14236 13.9204 4.11091 12.889C3.07946 11.8575 2.5 10.4586 2.5 8.9999C2.5 7.2549 3.1875 5.47052 4.54125 3.69677C4.5841 3.64061 4.63837 3.59416 4.70047 3.56049C4.76258 3.52683 4.83112 3.5067 4.90157 3.50145C4.97201 3.49619 5.04278 3.50592 5.10919 3.53C5.17561 3.55408 5.23616 3.59196 5.28687 3.64115L6.79437 5.10427L8.16938 1.32865C8.19685 1.25334 8.24202 1.18575 8.30108 1.13156C8.36015 1.07737 8.43138 1.03818 8.50877 1.01728C8.58616 0.996391 8.66743 0.994409 8.74574 1.01151C8.82406 1.0286 8.89711 1.06428 8.95875 1.11552C10.3256 2.2499 13.5 5.28427 13.5 8.9999ZM12.5 8.9999C12.5 6.11927 10.2631 3.6299 8.86187 2.35427L7.47 6.17115C7.44143 6.24954 7.3937 6.31954 7.33116 6.37477C7.26861 6.42999 7.19324 6.46869 7.11191 6.48733C7.03059 6.50596 6.94589 6.50395 6.86553 6.48148C6.78518 6.459 6.71173 6.41678 6.65188 6.35865L5.00375 4.7599C4.00562 6.20052 3.5 7.6249 3.5 8.9999C3.5 10.1934 3.97411 11.338 4.81802 12.1819C5.66193 13.0258 6.80653 13.4999 8 13.4999C9.19347 13.4999 10.3381 13.0258 11.182 12.1819C12.0259 11.338 12.5 10.1934 12.5 8.9999Z" fill="rgba(254, 252, 251, 1)"></path>
        </svg>
    );

    const getClockIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_4027_3239)">
            <path d="M5.5 3V1C5.5 0.867392 5.55268 0.740215 5.64645 0.646447C5.74022 0.552678 5.86739 0.5 6 0.5C6.13261 0.5 6.25979 0.552678 6.35356 0.646447C6.44732 0.740215 6.5 0.867392 6.5 1V3C6.5 3.13261 6.44732 3.25979 6.35356 3.35355C6.25979 3.44732 6.13261 3.5 6 3.5C5.86739 3.5 5.74022 3.44732 5.64645 3.35355C5.55268 3.25979 5.5 3.13261 5.5 3ZM8 3.5C8.13261 3.5 8.25979 3.44732 8.35356 3.35355C8.44732 3.25979 8.5 3.13261 8.5 3V1C8.5 0.867392 8.44732 0.740215 8.35356 0.646447C8.25979 0.552678 8.13261 0.5 8 0.5C7.86739 0.5 7.74022 0.552678 7.64645 0.646447C7.55268 0.740215 7.5 0.867392 7.5 1V3C7.5 3.13261 7.55268 3.25979 7.64645 3.35355C7.74022 3.44732 7.86739 3.5 8 3.5ZM10 3.5C10.1326 3.5 10.2598 3.44732 10.3536 3.35355C10.4473 3.25979 10.5 3.13261 10.5 3V1C10.5 0.867392 10.4473 0.740215 10.3536 0.646447C10.2598 0.552678 10.1326 0.5 10 0.5C9.86739 0.5 9.74022 0.552678 9.64645 0.646447C9.55268 0.740215 9.5 0.867392 9.5 1V3C9.5 3.13261 9.55268 3.25979 9.64645 3.35355C9.74022 3.44732 9.86739 3.5 10 3.5ZM15.8 6.4L14 7.75V11.5C14 12.0304 13.7893 12.5391 13.4142 12.9142C13.0391 13.2893 12.5304 13.5 12 13.5H4C3.46957 13.5 2.96086 13.2893 2.58579 12.9142C2.21072 12.5391 2 12.0304 2 11.5V7.75L0.200002 6.4C0.0939154 6.32044 0.0237809 6.20199 0.0050273 6.07071C-0.0137263 5.93944 0.0204371 5.80609 0.100002 5.7C0.179567 5.59391 0.298016 5.52378 0.429291 5.50503C0.560567 5.48627 0.693915 5.52043 0.800002 5.6L2 6.5V5C2 4.86739 2.05268 4.74021 2.14645 4.64645C2.24022 4.55268 2.36739 4.5 2.5 4.5H13.5C13.6326 4.5 13.7598 4.55268 13.8536 4.64645C13.9473 4.74021 14 4.86739 14 5V6.5L15.2 5.6C15.3061 5.52043 15.4394 5.48627 15.5707 5.50503C15.702 5.52378 15.8204 5.59391 15.9 5.7C15.9796 5.80609 16.0137 5.93944 15.995 6.07071C15.9762 6.20199 15.9061 6.32044 15.8 6.4ZM13 5.5H3V11.5C3 11.7652 3.10536 12.0196 3.2929 12.2071C3.48043 12.3946 3.73479 12.5 4 12.5H12C12.2652 12.5 12.5196 12.3946 12.7071 12.2071C12.8946 12.0196 13 11.7652 13 11.5V5.5Z" fill="rgba(254, 252, 251, 1)" />
        </g>
        <defs>
            <clipPath id="clip0_4027_3239">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>;

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`nutrition-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                {/* Header */}
                <div className="nutrition-header">
                    <h1 className='text-4xl font-bold text-white text-center'>Dinh Dưỡng</h1>
                    <div className="header-actions">
                        {activePageTab === 'menu' && (
                            <>
                                <div className="search-input">
                                    <MagnifyingGlass size={18} weight="regular" />
                                    <input type="text" placeholder="Tìm kiếm món ăn" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                                <button
                                    className="btn-filter"
                                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                                    style={{ position: 'relative' }}
                                >
                                    <Funnel size={22} weight="regular" />
                                    {getActiveFilterCount() > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            background: '#da2128',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '18px',
                                            height: '18px',
                                            fontSize: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}>
                                            {getActiveFilterCount()}
                                        </span>
                                    )}
                                </button>
                            </>
                        )}
                        {activePageTab === 'menu' && (
                            <button
                                className="btn-ai-assistant"
                                onClick={() => setShowAIPanel(!showAIPanel)}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '500'
                                }}
                            >
                                <Sparkle size={20} weight="fill" />
                                <span>AI Trợ Lý</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="nutrition-tabs">
                    <button
                        className={`nutrition-tab ${activePageTab === 'menu' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('menu')}
                    >
                        <List size={20} weight="regular" />
                        <span>Thực đơn</span>
                    </button>
                    <button
                        className={`nutrition-tab ${activePageTab === 'plans' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('plans')}
                    >
                        <Calendar size={20} weight="regular" />
                        <span>Kế hoạch</span>
                    </button>
                    <button
                        className={`nutrition-tab ${activePageTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('info')}
                    >
                        <BookOpen size={20} weight="regular" />
                        <span>Thông tin</span>
                    </button>
                    <button
                        className={`nutrition-tab ${activePageTab === 'calculator' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('calculator')}
                    >
                        <Calculator size={20} weight="regular" />
                        <span>Tính toán</span>
                    </button>
                    <button
                        className={`nutrition-tab ${activePageTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('stats')}
                    >
                        <ChartBar size={20} weight="regular" />
                        <span>Thống kê</span>
                    </button>
                </div>

                {/* AI Nutrition Assistant Panel */}
                {showAIPanel && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '16px',
                        padding: '24px',
                        zIndex: 1000,
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Sparkle size={24} weight="fill" color="#667eea" />
                                AI Nutrition Assistant
                            </h2>
                            <button
                                onClick={() => setShowAIPanel(false)}
                                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                    Mục tiêu dinh dưỡng *
                                </label>
                                <div className="goal-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="VD: Giảm cân, tăng cơ, duy trì..."
                                        value={aiRequest.goal}
                                        autoComplete="off"
                                        spellCheck={false}
                                        onFocus={handleGoalFocus}
                                        onBlur={handleGoalBlur}
                                        onChange={(e) => setAiRequest({ ...aiRequest, goal: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: '#2a2a2a',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                    {showGoalHistory && (
                                        <div className="goal-history-dropdown">
                                            {goalHistory.length === 0 ? (
                                                <div className="goal-history-empty">Chưa có lịch sử gần đây</div>
                                            ) : (
                                                goalHistory.map((item, index) => {
                                                    const historyDate = item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '';
                                                    return (
                                                        <div
                                                            key={`${item.goal}-${index}`}
                                                            className="goal-history-item"
                                                            onMouseDown={() => handleGoalSelect(item)}
                                                        >
                                                            <div className="goal-history-goal">{item.goal || 'Không xác định'}</div>
                                                            <div className="goal-history-meta">
                                                                {item.calories ? `${item.calories} kcal` : 'Chưa rõ calories'}
                                                                {historyDate ? ` • ${historyDate}` : ''}
                                                            </div>
                                                            {item.preferences && (<div className="goal-history-meta">Sở thích: {item.preferences}</div>)}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                    Calories gợi ý (AI tự tính)
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="AI sẽ tự tính dựa trên mục tiêu và chỉ số cơ thể"
                                    value={caloriesLoading ? 'Đang tính...' : (aiRequest.calories ? `${aiRequest.calories}` : '')}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#222',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: caloriesLoading ? '#b5b5b5' : 'white',
                                        fontSize: '14px',
                                        cursor: 'not-allowed'
                                    }}
                                />
                                <small className="calories-note">AI dựa trên BMI, giới tính và lịch sử đo gần nhất để tính lượng calories khuyến nghị.</small>
                            </div>

                            <div>
                                <label style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                    Chọn ngày
                                </label>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <button
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setAiRequest({ ...aiRequest, selectedDate: today });
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: aiRequest.selectedDate === new Date().toISOString().split('T')[0] ? '#da2128' : '#2a2a2a',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Hôm nay
                                    </button>
                                    <button
                                        onClick={() => {
                                            const tomorrow = new Date();
                                            tomorrow.setDate(tomorrow.getDate() + 1);
                                            setAiRequest({ ...aiRequest, selectedDate: tomorrow.toISOString().split('T')[0] });
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: (() => {
                                                const tomorrow = new Date();
                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                return aiRequest.selectedDate === tomorrow.toISOString().split('T')[0] ? '#da2128' : '#2a2a2a';
                                            })(),
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Ngày mai
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2a2a2a', padding: '10px', borderRadius: '8px', border: '1px solid #444' }}>
                                    <Calendar size={18} weight="regular" color="#999" />
                                    <input
                                        type="date"
                                        value={aiRequest.selectedDate}
                                        min={todayISO}
                                        onChange={(e) => setAiRequest({ ...aiRequest, selectedDate: e.target.value })}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '14px',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            colorScheme: 'dark'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                    Sở thích / Yêu cầu đặc biệt (tùy chọn)
                                </label>
                                <textarea
                                    placeholder="VD: Ăn chay, không thích cá, ưu tiên món Việt..."
                                    value={aiRequest.preferences}
                                    onChange={(e) => setAiRequest({ ...aiRequest, preferences: e.target.value })}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleGeneratePlan}
                                disabled={isGenerating}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: isGenerating ? '#555' : '#da2128',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <div style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTop: 'none', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        <span>Đang tạo kế hoạch...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkle size={20} weight="fill" />
                                        <span>Tạo Kế Hoạch Dinh Dưỡng</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {showAddMealModal && mealToAdd && (
                    <div className="add-meal-modal-overlay" onClick={closeAddMealModal}>
                        <div className="add-meal-modal" onClick={(event) => event.stopPropagation()}>
                            <div className="add-meal-modal-header">
                                <div>
                                    <h3>Thêm vào thực đơn</h3>
                                    <p>Chọn ngày và loại bữa cho món "{mealToAdd?.name || mealToAdd?.tenMon || 'món ăn'}"</p>
                                </div>
                                <button className="add-meal-close" onClick={closeAddMealModal} disabled={addingMeal}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="add-meal-field">
                                <label>Ngày thêm vào</label>
                                <div className="add-meal-calendar">
                                    <div className="calendar-header">
                                        <button type="button" className="calendar-nav-btn" onClick={() => handleMonthChange(-1)}>‹</button>
                                        <span className="calendar-month-label">{calendarMonthLabel}</span>
                                        <button type="button" className="calendar-nav-btn" onClick={() => handleMonthChange(1)}>›</button>
                                    </div>
                                    <div className="calendar-weekdays">
                                        {WEEKDAY_LABELS.map(label => (
                                            <span key={label}>{label}</span>
                                        ))}
                                    </div>
                                    <div className="calendar-grid">
                                        {calendarDays.map((dateObj, index) => {
                                            if (!dateObj) {
                                                return <span key={`empty-${index}`} className="calendar-day empty" />;
                                            }
                                            const iso = getLocalDateValue(dateObj);
                                            const disabled = isDateDisabled(dateObj);
                                            const selected = iso === addMealDate;
                                            return (
                                                <button
                                                    key={iso}
                                                    type="button"
                                                    className={`calendar-day${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                                                    onClick={() => handleDaySelect(dateObj)}
                                                    disabled={disabled}
                                                >
                                                    {dateObj.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {formattedSelectedDate && (
                                        <div className="calendar-selected-label">Ngày đã chọn: {formattedSelectedDate}</div>
                                    )}
                                </div>
                            </div>

                            <div className="add-meal-field">
                                <label>Loại bữa ăn</label>
                                <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)}>
                                    {MEAL_TYPE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="add-meal-actions">
                                <button className="btn-cancel" onClick={closeAddMealModal} disabled={addingMeal}>Hủy</button>
                                <button className="btn-confirm" onClick={handleAddToMealPlan} disabled={addingMeal}>
                                    {addingMeal ? 'Đang thêm...' : 'Thêm vào ngày này'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Panel */}
                {showFilterPanel && (
                    <>
                        <div
                            onClick={() => setShowFilterPanel(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.7)',
                                zIndex: 998
                            }}
                        />
                        <div style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '16px',
                            padding: '24px',
                            zIndex: 999,
                            width: '90%',
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: '#fff', margin: 0 }}>Bộ Lọc</h3>
                                <button onClick={() => setShowFilterPanel(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Độ khó</label>
                                <select
                                    value={filters.difficulty}
                                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                >
                                    {difficultyOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Calories (kcal)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        placeholder="Tối thiểu"
                                        value={filters.minCalories}
                                        onChange={(e) => handleFilterChange('minCalories', e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#2a2a2a',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Tối đa"
                                        value={filters.maxCalories}
                                        onChange={(e) => handleFilterChange('maxCalories', e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#2a2a2a',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '14px' }}>Điểm sức khỏe tối thiểu</label>
                                <input
                                    type="number"
                                    placeholder="0-100"
                                    min="0"
                                    max="100"
                                    value={filters.minHealthScore}
                                    onChange={(e) => handleFilterChange('minHealthScore', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                                <button
                                    onClick={resetFilters}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Đặt lại
                                </button>
                                <button
                                    onClick={() => setShowFilterPanel(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#da2128',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Overlay khi mở AI panel */}
                {showAIPanel && (
                    <div
                        onClick={() => setShowAIPanel(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 999
                        }}
                    />
                )}

                {/* Tab Content */}
                <div className="nutrition-tab-content">
                    {/* Tab: Thực đơn */}
                    {activePageTab === 'menu' && (
                        <div className="nutrition-content">
                            {/* Main Content */}
                            <div className="nutrition-main">
                                {/* Featured Menu */}
                                {featuredMenu && (
                                    <div className="featured-menu-section">
                                        <h2 className='flex justify-between items-center mb-4 text-white font-semibold text-lg'>Món Nổi Bật</h2>
                                        <div className="featured-menu-card" onClick={() => handleMealClick(featuredMenu)} style={{ cursor: 'pointer' }}>
                                            <div className="featured-main">
                                                <div className="featured-image">
                                                    {featuredMenu.image ? (
                                                        <img src={featuredMenu.image} alt={featuredMenu.name} onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }} />
                                                    ) : null}
                                                    <div className="image-placeholder" style={{ display: featuredMenu.image ? 'none' : 'block' }}></div>
                                                </div>
                                                <div className="featured-content">
                                                    <h3>{featuredMenu.name}</h3>
                                                    <div className="featured-badges">
                                                        <span
                                                            className={`badge-category${featuredMenu.category === 'Bữa trưa' ? ' lunch' : ''}`}
                                                            style={featuredMenu.category !== 'Bữa trưa' ? { backgroundColor: getCategoryColor(featuredMenu.category) } : {}}
                                                        >
                                                            {featuredMenu.category}
                                                        </span>
                                                        {featuredMenu.isAIRecommended && (
                                                            <span className="badge-ai" style={{
                                                                backgroundColor: '#6366f1',
                                                                color: '#fff',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <Sparkle size={12} weight="fill" />
                                                                AI
                                                            </span>
                                                        )}
                                                        <div className="badge-rating">
                                                            <Star size={14} weight="fill" color="#FFA257" />
                                                            <span>{featuredMenu.rating}/5 ({featuredMenu.reviews} đánh giá)</span>
                                                        </div>
                                                    </div>
                                                    <div className="featured-details">
                                                        <div className="nutrition-detail-row">
                                                            <div className="nutrition-detail-item">
                                                                <div className="nutrition-detail-icon">
                                                                    {getDifficultyIcon()}
                                                                </div>
                                                                <div className="nutrition-detail-info">
                                                                    <div className="nutrition-detail-label">Độ khó</div>
                                                                    <div className="nutrition-detail-value">{featuredMenu.difficulty}</div>
                                                                </div>
                                                            </div>
                                                            <div className="nutrition-detail-item">
                                                                <div className="nutrition-detail-icon">
                                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M4.5 9H2C1.86739 9 1.74021 8.94732 1.64645 8.85355C1.55268 8.75979 1.5 8.63261 1.5 8.5C1.5 8.36739 1.55268 8.24021 1.64645 8.14645C1.74021 8.05268 1.86739 8 2 8H4.2325L5.08375 6.7225C5.12939 6.65392 5.19127 6.59767 5.26389 6.55877C5.33651 6.51987 5.41762 6.49951 5.5 6.49951C5.58238 6.49951 5.66349 6.51987 5.73611 6.55877C5.80873 6.59767 5.87061 6.65392 5.91625 6.7225L7.5 9.0975L8.08375 8.2225C8.12945 8.15401 8.19135 8.09786 8.26397 8.05904C8.33658 8.02023 8.41766 7.99995 8.5 8H10C10.1326 8 10.2598 8.05268 10.3536 8.14645C10.4473 8.24021 10.5 8.36739 10.5 8.5C10.5 8.63261 10.4473 8.75979 10.3536 8.85355C10.2598 8.94732 10.1326 9 10 9H8.7675L7.91625 10.2775C7.87061 10.3461 7.80873 10.4023 7.73611 10.4412C7.66349 10.4801 7.58238 10.5005 7.5 10.5005C7.41762 10.5005 7.33651 10.4801 7.26389 10.4412C7.19127 10.4023 7.12939 10.3461 7.08375 10.2775L5.5 7.90125L4.91625 8.77625C4.8707 8.84497 4.80885 8.90137 4.73623 8.94041C4.6636 8.97944 4.58245 8.99992 4.5 9ZM11.125 2.5C9.83438 2.5 8.70438 3.055 8 3.99312C7.29562 3.055 6.16562 2.5 4.875 2.5C3.84764 2.50116 2.86269 2.90979 2.13624 3.63624C1.40979 4.36269 1.00116 5.34764 1 6.375C1 6.42187 1 6.46875 1 6.51562C1.00414 6.64823 1.0608 6.77376 1.1575 6.8646C1.25419 6.95544 1.38302 7.00414 1.51562 7C1.64823 6.99586 1.77376 6.9392 1.8646 6.8425C1.95544 6.74581 2.00414 6.61698 2 6.48437C2 6.44812 2 6.41125 2 6.375C2.00099 5.61281 2.30421 4.88212 2.84316 4.34316C3.38212 3.80421 4.11281 3.50099 4.875 3.5C6.09063 3.5 7.11125 4.1475 7.5375 5.1875C7.57517 5.27921 7.63925 5.35764 7.7216 5.41284C7.80396 5.46804 7.90086 5.49752 8 5.49752C8.09914 5.49752 8.19604 5.46804 8.2784 5.41284C8.36075 5.35764 8.42483 5.27921 8.4625 5.1875C8.88875 4.14562 9.90937 3.5 11.125 3.5C11.8872 3.50099 12.6179 3.80421 13.1568 4.34316C13.6958 4.88212 13.999 5.61281 14 6.375C14 9.72562 9.14 12.7594 8 13.425C7.32313 13.0306 5.33562 11.8 3.8325 10.1619C3.7881 10.1134 3.73459 10.0742 3.67504 10.0465C3.61548 10.0188 3.55104 10.003 3.48541 10.0002C3.41977 9.99732 3.35421 10.0074 3.29248 10.0299C3.23075 10.0524 3.17405 10.0868 3.12562 10.1312C3.0772 10.1757 3.038 10.2292 3.01025 10.2887C2.9825 10.3483 2.96676 10.4127 2.96391 10.4783C2.96107 10.544 2.97118 10.6095 2.99367 10.6713C3.01617 10.733 3.0506 10.7897 3.095 10.8381C5.04313 12.9631 7.65312 14.3806 7.76312 14.44C7.83594 14.4792 7.91732 14.4997 8 14.4997C8.08268 14.4997 8.16406 14.4792 8.23687 14.44C8.51312 14.2912 15 10.75 15 6.375C14.9988 5.34764 14.5902 4.36269 13.8638 3.63624C13.1373 2.90979 12.1524 2.50116 11.125 2.5Z" fill="rgba(254, 252, 251, 1)" />
                                                                    </svg>

                                                                </div>
                                                                <div className="nutrition-detail-info">
                                                                    <div className="nutrition-detail-label">Điểm sức khỏe</div>
                                                                    <div className="nutrition-detail-value">{featuredMenu.healthScore}/100</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="nutrition-detail-row">
                                                            <div className="nutrition-detail-item">
                                                                <div className="nutrition-detail-icon">
                                                                    {getClockIcon()}
                                                                </div>
                                                                <div className="nutrition-detail-info">
                                                                    <div className="nutrition-detail-label">Thời gian nấu</div>
                                                                    <div className="nutrition-detail-value">{featuredMenu.cookDuration}</div>
                                                                </div>
                                                            </div>
                                                            <div className="nutrition-detail-item">
                                                                <div className="nutrition-detail-icon">
                                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M14 7.99987C14 8.13248 13.9473 8.25966 13.8536 8.35342C13.7598 8.44719 13.6326 8.49987 13.5 8.49987H6.50003C6.36742 8.49987 6.24024 8.44719 6.14647 8.35342C6.05271 8.25966 6.00003 8.13248 6.00003 7.99987C6.00003 7.86726 6.05271 7.74008 6.14647 7.64632C6.24024 7.55255 6.36742 7.49987 6.50003 7.49987H13.5C13.6326 7.49987 13.7598 7.55255 13.8536 7.64632C13.9473 7.74008 14 7.86726 14 7.99987ZM6.50003 4.49987H13.5C13.6326 4.49987 13.7598 4.44719 13.8536 4.35342C13.9473 4.25965 14 4.13248 14 3.99987C14 3.86726 13.9473 3.74008 13.8536 3.64632C13.7598 3.55255 13.6326 3.49987 13.5 3.49987H6.50003C6.36742 3.49987 6.24024 3.55255 6.14647 3.64632C6.05271 3.74008 6.00003 3.86726 6.00003 3.99987C6.00003 4.13248 6.05271 4.25965 6.14647 4.35342C6.24024 4.44719 6.36742 4.49987 6.50003 4.49987ZM13.5 11.4999H6.50003C6.36742 11.4999 6.24024 11.5525 6.14647 11.6463C6.05271 11.7401 6.00003 11.8673 6.00003 11.9999C6.00003 12.1325 6.05271 12.2597 6.14647 12.3534C6.24024 12.4472 6.36742 12.4999 6.50003 12.4999H13.5C13.6326 12.4999 13.7598 12.4472 13.8536 12.3534C13.9473 12.2597 14 12.1325 14 11.9999C14 11.8673 13.9473 11.7401 13.8536 11.6463C13.7598 11.5525 13.6326 11.4999 13.5 11.4999ZM2.72378 3.44737L3.00003 3.30862V6.49987C3.00003 6.63248 3.05271 6.75965 3.14647 6.85342C3.24024 6.94719 3.36742 6.99987 3.50003 6.99987C3.63264 6.99987 3.75981 6.94719 3.85358 6.85342C3.94735 6.75965 4.00003 6.63248 4.00003 6.49987V2.49987C4.00009 2.4146 3.97834 2.33073 3.93685 2.25623C3.89536 2.18173 3.83551 2.11908 3.76298 2.07424C3.69045 2.02939 3.60766 2.00384 3.52247 2.00002C3.43729 1.99619 3.35254 2.01421 3.27628 2.05237L2.27628 2.55237C2.15759 2.61171 2.06734 2.71577 2.02538 2.84165C2.00461 2.90399 1.99631 2.9698 2.00097 3.03534C2.00562 3.10087 2.02314 3.16485 2.05253 3.22362C2.08191 3.28239 2.12258 3.33479 2.17222 3.37784C2.22185 3.42089 2.27948 3.45374 2.34181 3.47452C2.4677 3.51648 2.60509 3.50671 2.72378 3.44737ZM4.98565 9.79487C4.958 9.59684 4.8906 9.40645 4.78749 9.23514C4.68438 9.06383 4.5477 8.91513 4.38565 8.798C4.06109 8.56232 3.65797 8.46129 3.26063 8.51604C2.86328 8.57079 2.5025 8.77708 2.25378 9.09174C2.15871 9.21381 2.08342 9.35005 2.03065 9.49549C2.0031 9.55809 1.98868 9.62568 1.98829 9.69408C1.9879 9.76247 2.00154 9.83022 2.02838 9.89313C2.05522 9.95604 2.09468 10.0128 2.14432 10.0598C2.19396 10.1069 2.25273 10.1432 2.31698 10.1667C2.38124 10.1901 2.44962 10.2001 2.51789 10.1961C2.58617 10.192 2.65289 10.174 2.71392 10.1431C2.77496 10.1123 2.82901 10.0692 2.87274 10.0166C2.91647 9.96402 2.94894 9.90301 2.96815 9.83737C2.98565 9.78942 3.01054 9.74451 3.0419 9.70425C3.1301 9.59435 3.25728 9.52269 3.39698 9.50418C3.53667 9.48567 3.67812 9.52173 3.7919 9.60487C3.84663 9.64358 3.89292 9.69302 3.92795 9.75018C3.96297 9.80734 3.98601 9.87103 3.99565 9.93737C4.00447 10.0011 4.00033 10.0659 3.98347 10.128C3.9666 10.1901 3.93737 10.2481 3.89753 10.2986C3.89571 10.3008 3.89404 10.3031 3.89253 10.3055L2.0994 12.7005C2.04384 12.7748 2.01005 12.8632 2.00184 12.9556C1.99362 13.048 2.01129 13.1409 2.05287 13.2239C2.09445 13.3069 2.1583 13.3766 2.23727 13.4254C2.31624 13.4741 2.40722 13.4999 2.50003 13.4999H4.50003C4.63264 13.4999 4.75981 13.4472 4.85358 13.3534C4.94735 13.2597 5.00003 13.1325 5.00003 12.9999C5.00003 12.8673 4.94735 12.7401 4.85358 12.6463C4.75981 12.5525 4.63264 12.4999 4.50003 12.4999H3.50003L4.69253 10.9042C4.81343 10.7485 4.9017 10.57 4.95206 10.3794C5.00243 10.1888 5.01385 9.98999 4.98565 9.79487Z" fill="rgba(254, 252, 251, 1)" />
                                                                    </svg>
                                                                </div>
                                                                <div className="nutrition-detail-info">
                                                                    <div className="nutrition-detail-label">Tổng số bước</div>
                                                                    <div className="nutrition-detail-value">{featuredMenu.totalSteps} bước</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn-add-meal-plan text-white"
                                                        onClick={(event) => openAddMealModal(featuredMenu, event)}
                                                    >
                                                        Thêm vào thực đơn
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="featured-nutrition">
                                                <div className="nutrition-item calories">
                                                    <div className="nutrition-icon">
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M11.4931 9.58365C11.3635 10.3078 11.0151 10.9749 10.4948 11.4951C9.9745 12.0153 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4999 8.25375 12.4527 8.16148 12.3678C8.06921 12.2828 8.01223 12.1663 8.00185 12.0413C7.99146 11.9163 8.02843 11.792 8.10542 11.693C8.18242 11.594 8.2938 11.5275 8.4175 11.5068C9.45312 11.3324 10.3319 10.4536 10.5075 9.41615C10.5297 9.28536 10.603 9.16876 10.7112 9.09199C10.8193 9.01521 10.9536 8.98456 11.0844 9.00677C11.2152 9.02899 11.3318 9.10224 11.4085 9.21043C11.4853 9.31861 11.516 9.45286 11.4937 9.58365H11.4931ZM13.5 8.9999C13.5 10.4586 12.9205 11.8575 11.8891 12.889C10.8576 13.9204 9.45869 14.4999 8 14.4999C6.54131 14.4999 5.14236 13.9204 4.11091 12.889C3.07946 11.8575 2.5 10.4586 2.5 8.9999C2.5 7.2549 3.1875 5.47052 4.54125 3.69677C4.5841 3.64061 4.63837 3.59416 4.70047 3.56049C4.76258 3.52683 4.83112 3.5067 4.90157 3.50145C4.97201 3.49619 5.04278 3.50592 5.10919 3.53C5.17561 3.55408 5.23616 3.59196 5.28687 3.64115L6.79437 5.10427L8.16938 1.32865C8.19685 1.25334 8.24202 1.18575 8.30108 1.13156C8.36015 1.07737 8.43138 1.03818 8.50877 1.01728C8.58616 0.996391 8.66743 0.994409 8.74574 1.01151C8.82406 1.0286 8.89711 1.06428 8.95875 1.11552C10.3256 2.2499 13.5 5.28427 13.5 8.9999ZM12.5 8.9999C12.5 6.11927 10.2631 3.6299 8.86187 2.35427L7.47 6.17115C7.44143 6.24954 7.3937 6.31954 7.33116 6.37477C7.26861 6.42999 7.19324 6.46869 7.11191 6.48733C7.03059 6.50596 6.94589 6.50395 6.86553 6.48148C6.78518 6.459 6.71173 6.41678 6.65188 6.35865L5.00375 4.7599C4.00562 6.20052 3.5 7.6249 3.5 8.9999C3.5 10.1934 3.97411 11.338 4.81802 12.1819C5.66193 13.0258 6.80653 13.4999 8 13.4999C9.19347 13.4999 10.3381 13.0258 11.182 12.1819C12.0259 11.338 12.5 10.1934 12.5 8.9999Z" fill="#272932" />
                                                        </svg>
                                                    </div>
                                                    <div className="nutrition-info">
                                                        <div className="nutrition-label">Calo</div>
                                                        <div className="nutrition-amount">
                                                            <span className="nutrition-value">{featuredMenu.nutrition.calories}</span>
                                                            <span className="nutrition-unit">kcal</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="nutrition-item carbs">
                                                    <div className="nutrition-icon">
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M15 5C15 4.33696 14.7366 3.70107 14.2678 3.23223C13.7989 2.76339 13.1631 2.5 12.5 2.5H3.00001C2.42593 2.50035 1.86947 2.69826 1.42409 3.06049C0.978721 3.42272 0.671583 3.92719 0.554278 4.48916C0.436972 5.05112 0.516648 5.63634 0.779918 6.14649C1.04319 6.65664 1.47401 7.06065 2.00001 7.29063V12.5C2.00001 12.7652 2.10537 13.0196 2.29291 13.2071C2.48044 13.3946 2.7348 13.5 3.00001 13.5H12.5C12.7652 13.5 13.0196 13.3946 13.2071 13.2071C13.3947 13.0196 13.5 12.7652 13.5 12.5V7.29063C13.9455 7.0957 14.3245 6.77529 14.5909 6.36852C14.8572 5.96175 14.9994 5.48622 15 5ZM3.00001 7.5C3.13262 7.5 3.2598 7.44732 3.35357 7.35355C3.44733 7.25979 3.50001 7.13261 3.50001 7C3.50001 6.86739 3.44733 6.74021 3.35357 6.64645C3.2598 6.55268 3.13262 6.5 3.00001 6.5C2.60219 6.5 2.22066 6.34196 1.93935 6.06066C1.65805 5.77936 1.50001 5.39782 1.50001 5C1.50001 4.60218 1.65805 4.22064 1.93935 3.93934C2.22066 3.65804 2.60219 3.5 3.00001 3.5H9.00001C9.39784 3.5 9.77937 3.65804 10.0607 3.93934C10.342 4.22064 10.5 4.60218 10.5 5C10.5 5.39782 10.342 5.77936 10.0607 6.06066C9.77937 6.34196 9.39784 6.5 9.00001 6.5C8.8674 6.5 8.74023 6.55268 8.64646 6.64645C8.55269 6.74021 8.50001 6.86739 8.50001 7C8.50001 7.13261 8.55269 7.25979 8.64646 7.35355C8.74023 7.44732 8.8674 7.5 9.00001 7.5V12.5H3.00001V7.5ZM12.5 6.5C12.3674 6.5 12.2402 6.55268 12.1465 6.64645C12.0527 6.74021 12 6.86739 12 7C12 7.13261 12.0527 7.25979 12.1465 7.35355C12.2402 7.44732 12.3674 7.5 12.5 7.5V12.5H10V7.29063C10.3456 7.13973 10.6526 6.91262 10.8979 6.62629C11.1433 6.33995 11.3207 6.00182 11.4169 5.63721C11.5131 5.27259 11.5256 4.89094 11.4534 4.52083C11.3812 4.15071 11.2262 3.80173 11 3.5H12.5C12.8978 3.5 13.2794 3.65804 13.5607 3.93934C13.842 4.22064 14 4.60218 14 5C14 5.39782 13.842 5.77936 13.5607 6.06066C13.2794 6.34196 12.8978 6.5 12.5 6.5Z" fill="#272932" />
                                                        </svg>
                                                    </div>
                                                    <div className="nutrition-info">
                                                        <div className="nutrition-label">Carbs</div>
                                                        <div className="nutrition-amount">
                                                            <span className="nutrition-value">{featuredMenu.nutrition.carbs}</span>
                                                            <span className="nutrition-unit">gr</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="nutrition-item proteins">
                                                    <div className="nutrition-icon">
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <g clip-path="url(#clip0_4027_227)">
                                                                <path d="M10.5 4.74978C10.5 4.89811 10.456 5.04312 10.3736 5.16645C10.2912 5.28979 10.1741 5.38592 10.037 5.44268C9.89997 5.49945 9.74917 5.5143 9.60369 5.48536C9.4582 5.45643 9.32457 5.38499 9.21968 5.28011C9.11479 5.17522 9.04336 5.04158 9.01442 4.89609C8.98548 4.75061 9.00033 4.59981 9.0571 4.46276C9.11386 4.32572 9.20999 4.20858 9.33333 4.12617C9.45667 4.04376 9.60167 3.99977 9.75001 3.99977C9.94892 3.99977 10.1397 4.07879 10.2803 4.21944C10.421 4.3601 10.5 4.55086 10.5 4.74978ZM13.545 8.97728C12.3344 11.1585 10.08 12.3373 6.84251 12.4835L5.46751 15.6967C5.42886 15.7869 5.36452 15.8637 5.2825 15.9176C5.20048 15.9715 5.1044 16.0001 5.00626 15.9998H4.97438C4.87135 15.9933 4.77284 15.9551 4.69238 15.8904C4.61192 15.8258 4.55345 15.7378 4.52501 15.6385L3.60001 12.3992L0.362507 11.4723C0.262988 11.4443 0.17458 11.3862 0.109448 11.3059C0.044317 11.2257 0.00566485 11.1272 -0.00118842 11.0241C-0.00804169 10.9209 0.0172409 10.8182 0.0711795 10.73C0.125118 10.6418 0.205061 10.5725 0.300007 10.5317L3.51313 9.15665C3.66001 5.9204 4.83876 3.66665 7.01876 2.4554C8.56563 1.59665 10.315 1.4654 11.5113 1.50665C12.6763 1.54665 13.7613 1.77352 13.94 1.88165C14.013 1.92467 14.0739 1.98553 14.1169 2.05852C14.2225 2.23665 14.45 3.32165 14.4919 4.48665C14.5344 5.6804 14.4038 7.4304 13.545 8.97728ZM10.0963 10.7898C9.51853 10.5695 9.01544 10.1894 8.64578 9.69377C8.27612 9.19816 8.05517 8.60757 8.00876 7.99103C7.39235 7.9447 6.80188 7.72385 6.30637 7.35429C5.81086 6.98474 5.4308 6.48175 5.21063 5.90415C4.77522 6.8954 4.5398 8.09519 4.50438 9.50353C4.50217 9.59943 4.47241 9.69267 4.41866 9.77213C4.36492 9.85159 4.28945 9.9139 4.20126 9.95165L1.98938 10.8979L4.14251 11.5142C4.2242 11.5376 4.29858 11.5814 4.35861 11.6416C4.41865 11.7017 4.46236 11.7762 4.48563 11.8579L5.10063 14.0104L6.04813 11.7979C6.08597 11.7098 6.14833 11.6345 6.22778 11.5809C6.30723 11.5272 6.40042 11.4976 6.49626 11.4954C7.90334 11.4617 9.10334 11.2264 10.0963 10.7898ZM13.2763 2.7229C12.3919 2.5354 9.27001 2.0354 7.00751 3.64477C6.63303 3.91197 6.29662 4.22883 6.00751 4.58665C5.98382 4.91315 6.03166 5.24089 6.1477 5.547C6.26373 5.85311 6.44516 6.13021 6.67934 6.35896C6.91351 6.58772 7.19478 6.76262 7.50351 6.87147C7.81225 6.98031 8.14102 7.02047 8.46688 6.98915C8.54029 6.98208 8.61435 6.99134 8.68377 7.01626C8.75318 7.04118 8.81621 7.08115 8.86836 7.13329C8.92051 7.18544 8.96048 7.24848 8.9854 7.31789C9.01032 7.3873 9.01958 7.46137 9.01251 7.53478C8.98125 7.86075 9.02152 8.18963 9.13051 8.49843C9.23951 8.80724 9.4146 9.08853 9.64355 9.32266C9.87251 9.55679 10.1498 9.73813 10.4561 9.854C10.7624 9.96987 11.0903 10.0175 11.4169 9.99353C11.7734 9.70434 12.0888 9.36791 12.3544 8.99352C13.9638 6.7329 13.4638 3.60852 13.2763 2.7229Z" fill="#272932" />
                                                            </g>
                                                            <defs>
                                                                <clipPath id="clip0_4027_227">
                                                                    <rect width="16" height="16" fill="white" />
                                                                </clipPath>
                                                            </defs>
                                                        </svg>
                                                    </div>
                                                    <div className="nutrition-info">
                                                        <div className="nutrition-label">Protein</div>
                                                        <div className="nutrition-amount">
                                                            <span className="nutrition-value">{featuredMenu.nutrition.proteins}</span>
                                                            <span className="nutrition-unit">gr</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="nutrition-item fats">
                                                    <div className="nutrition-icon">
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <g clip-path="url(#clip0_4027_207)">
                                                                <path d="M10.875 2.98423C10.103 2.09263 9.23409 1.28977 8.28438 0.590485C8.20031 0.531592 8.10015 0.5 7.9975 0.5C7.89485 0.5 7.7947 0.531592 7.71063 0.590485C6.76266 1.29006 5.89545 2.09291 5.125 2.98423C3.40688 4.95736 2.5 7.03736 2.5 8.99986C2.5 10.4586 3.07946 11.8575 4.11091 12.8889C5.14236 13.9204 6.54131 14.4999 8 14.4999C9.45869 14.4999 10.8576 13.9204 11.8891 12.8889C12.9205 11.8575 13.5 10.4586 13.5 8.99986C13.5 7.03736 12.5931 4.95736 10.875 2.98423ZM8 13.4999C6.80693 13.4985 5.66311 13.024 4.81948 12.1804C3.97585 11.3368 3.50132 10.1929 3.5 8.99986C3.5 5.42298 6.96687 2.43736 8 1.62486C9.03313 2.43736 12.5 5.42173 12.5 8.99986C12.4987 10.1929 12.0241 11.3368 11.1805 12.1804C10.3369 13.024 9.19307 13.4985 8 13.4999ZM11.4931 9.58361C11.3635 10.3078 11.0151 10.9749 10.4948 11.495C9.9745 12.0152 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4998 8.25375 12.4527 8.16148 12.3677C8.06921 12.2828 8.01223 12.1662 8.00185 12.0413C7.99146 11.9163 8.02843 11.7919 8.10542 11.6929C8.18242 11.5939 8.2938 11.5275 8.4175 11.5067C9.45312 11.3324 10.3319 10.4536 10.5075 9.41611C10.5297 9.28533 10.603 9.16872 10.7112 9.09195C10.8193 9.01517 10.9536 8.98452 11.0844 9.00673C11.2152 9.02895 11.3318 9.1022 11.4085 9.21039C11.4853 9.31857 11.516 9.45282 11.4937 9.58361H11.4931Z" fill="#272932" />
                                                            </g>
                                                            <defs>
                                                                <clipPath id="clip0_4027_207">
                                                                    <rect width="16" height="16" fill="white" />
                                                                </clipPath>
                                                            </defs>
                                                        </svg>
                                                    </div>
                                                    <div className="nutrition-info">
                                                        <div className="nutrition-label">Chất béo</div>
                                                        <div className="nutrition-amount">
                                                            <span className="nutrition-value">{featuredMenu.nutrition.fats}</span>
                                                            <span className="nutrition-unit">gr</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* All Menu */}
                                <div className="all-menu-section">
                                    <div className="section-header">
                                        <h2 className='flex justify-between items-center mb-4 text-white font-semibold text-lg'>Tất cả món ăn</h2>
                                        <div className="section-actions">
                                            <button className="btn-filter-small" onClick={toggleFilterPanel}>
                                                <Funnel size={14} weight="regular" />
                                                Lọc {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                                            </button>
                                            <div className="view-toggle">
                                                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                        <rect x="2" y="2" width="5" height="5" fill="currentColor" />
                                                        <rect x="11" y="2" width="5" height="5" fill="currentColor" />
                                                        <rect x="2" y="11" width="5" height="5" fill="currentColor" />
                                                        <rect x="11" y="11" width="5" height="5" fill="currentColor" />
                                                    </svg>
                                                </button>
                                                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                        <rect x="2" y="3" width="14" height="2" fill="currentColor" />
                                                        <rect x="2" y="8" width="14" height="2" fill="currentColor" />
                                                        <rect x="2" y="13" width="14" height="2" fill="currentColor" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="category-filters">
                                        <div className="category-tabs">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                                                    onClick={() => setSelectedCategory(cat)}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="sort-by" style={{ position: 'relative' }}>
                                            <span>Sắp xếp theo:</span>
                                            <button
                                                className="btn-sort"
                                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                            >
                                                {sortBy}
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M4 6L7 9L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            {showSortDropdown && (
                                                <>
                                                    <div
                                                        onClick={() => setShowSortDropdown(false)}
                                                        style={{
                                                            position: 'fixed',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            zIndex: 997
                                                        }}
                                                    />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        marginTop: '8px',
                                                        background: '#1a1a1a',
                                                        border: '1px solid #333',
                                                        borderRadius: '8px',
                                                        padding: '8px 0',
                                                        minWidth: '200px',
                                                        zIndex: 998,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                    }}>
                                                        {sortOptions.map(option => (
                                                            <button
                                                                key={option}
                                                                onClick={() => handleSortChange(option)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 16px',
                                                                    background: sortBy === option ? '#2a2a2a' : 'transparent',
                                                                    border: 'none',
                                                                    color: '#fff',
                                                                    fontSize: '14px',
                                                                    textAlign: 'left',
                                                                    cursor: 'pointer',
                                                                    transition: 'background 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (sortBy !== option) e.target.style.background = '#2a2a2a';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (sortBy !== option) e.target.style.background = 'transparent';
                                                                }}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Filter Panel */}
                                    {showFilterPanel && (
                                        <div className="filter-panel" style={{
                                            background: '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>Bộ lọc</h3>
                                                <button onClick={() => setShowFilterPanel(false)} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer' }}>
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                <div>
                                                    <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px' }}>Độ khó</label>
                                                    <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })} style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        background: '#2a2a2a',
                                                        border: '1px solid #444',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px'
                                                    }}>
                                                        <option value="Tất cả">Tất cả</option>
                                                        <option value="Dễ">Dễ</option>
                                                        <option value="Trung bình">Trung bình</option>
                                                        <option value="Khó">Khó</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px' }}>Calo tối thiểu</label>
                                                    <input type="number" value={filters.minCalories} onChange={(e) => setFilters({ ...filters, minCalories: e.target.value })} placeholder="0" style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        background: '#2a2a2a',
                                                        border: '1px solid #444',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px'
                                                    }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px' }}>Calo tối đa</label>
                                                    <input type="number" value={filters.maxCalories} onChange={(e) => setFilters({ ...filters, maxCalories: e.target.value })} placeholder="2000" style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        background: '#2a2a2a',
                                                        border: '1px solid #444',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px'
                                                    }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: '#999', fontSize: '12px', marginBottom: '8px' }}>Điểm sức khỏe tối thiểu</label>
                                                    <input type="number" value={filters.minHealthScore} onChange={(e) => setFilters({ ...filters, minHealthScore: e.target.value })} placeholder="0" min="0" max="100" style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        background: '#2a2a2a',
                                                        border: '1px solid #444',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px'
                                                    }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                <button onClick={resetFilters} style={{
                                                    padding: '10px 20px',
                                                    background: '#2a2a2a',
                                                    border: '1px solid #444',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}>Xóa bộ lọc</button>
                                                <button onClick={() => setShowFilterPanel(false)} style={{
                                                    padding: '10px 20px',
                                                    background: '#da2128',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}>Áp dụng</button>
                                            </div>
                                        </div>
                                    )}

                                    {menus.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '60px 20px',
                                            color: '#8A8C90'
                                        }}>
                                            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Không tìm thấy món ăn nào</p>
                                            <p style={{ fontSize: '14px' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                            {(searchQuery || getActiveFilterCount() > 0) && (
                                                <button
                                                    onClick={resetFilters}
                                                    style={{
                                                        marginTop: '16px',
                                                        padding: '10px 20px',
                                                        background: '#2a2a2a',
                                                        border: '1px solid #444',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Xóa bộ lọc
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`menu-list ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`} style={{
                                                display: viewMode === 'grid' ? 'grid' : 'flex',
                                                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : 'unset',
                                                flexDirection: viewMode === 'list' ? 'column' : 'unset',
                                                gap: '16px'
                                            }}>
                                                {menus.map(menu => (
                                                    <div key={menu.id} className="menu-card" onClick={() => handleMealClick(menu)} style={{ cursor: 'pointer' }}>
                                                        <div className="menu-image">
                                                            {menu.image ? (
                                                                <img src={menu.image} alt={menu.name} onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    if (e.target.nextSibling) {
                                                                        e.target.nextSibling.style.display = 'block';
                                                                    }
                                                                }} />
                                                            ) : null}
                                                            <div className="image-placeholder" style={{ display: menu.image ? 'none' : 'block' }}></div>
                                                        </div>
                                                        <div className="menu-content">
                                                            <div className="menu-header">
                                                                <div className="menu-badges">
                                                                    <span className="badge-category" style={{ backgroundColor: getCategoryColor(menu.category) }}>
                                                                        {menu.category}
                                                                    </span>
                                                                    {menu.isAIRecommended && (
                                                                        <span className="badge-ai" style={{
                                                                            backgroundColor: '#6366f1',
                                                                            color: '#fff',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}>
                                                                            <Sparkle size={12} weight="fill" />
                                                                            AI
                                                                        </span>
                                                                    )}
                                                                    <div className="badge-difficulty">
                                                                        <ChartBar size={12} weight="fill" />
                                                                        <span>{menu.difficulty}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="menu-health-score">
                                                                    <div className="score-header">
                                                                        <span className="score-label">Điểm sức khỏe:</span>
                                                                        <div className="score-value">
                                                                            <span className="score" style={{ color: getHealthScoreColor(menu.healthScore) }}>
                                                                                {menu.healthScore}
                                                                            </span>
                                                                            <span className="score-max">/100</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="score-bar-custom">
                                                                        {[...Array(10)].map((_, i) => {
                                                                            const isActive = i < getActiveSegments(menu.healthScore);
                                                                            const segmentColor = isActive ? getHealthScoreColor(menu.healthScore) : '#FFE6B5';
                                                                            return (
                                                                                <span
                                                                                    key={i}
                                                                                    className={`score-segment${isActive ? ' active' : ''}`}
                                                                                    style={{
                                                                                        background: isActive ? segmentColor : '#FFE6B5',
                                                                                        opacity: isActive ? 1 : 0.4
                                                                                    }}
                                                                                ></span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <h3>{menu.name}</h3>
                                                            <div className="menu-footer">
                                                                <div className="menu-nutrition">
                                                                    <div className="nutrition-mini">
                                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M11.4931 9.58365C11.3635 10.3078 11.0151 10.9749 10.4948 11.4951C9.9745 12.0153 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4999 8.25375 12.4527 8.16148 12.3678C8.06921 12.2828 8.01223 12.1663 8.00185 12.0413C7.99146 11.9163 8.02843 11.792 8.10542 11.693C8.18242 11.594 8.2938 11.5275 8.4175 11.5068C9.45312 11.3324 10.3319 10.4536 10.5075 9.41615C10.5297 9.28536 10.603 9.16876 10.7112 9.09199C10.8193 9.01521 10.9536 8.98456 11.0844 9.00677C11.2152 9.02899 11.3318 9.10224 11.4085 9.21043C11.4853 9.31861 11.516 9.45286 11.4937 9.58365H11.4931ZM13.5 8.9999C13.5 10.4586 12.9205 11.8575 11.8891 12.889C10.8576 13.9204 9.45869 14.4999 8 14.4999C6.54131 14.4999 5.14236 13.9204 4.11091 12.889C3.07946 11.8575 2.5 10.4586 2.5 8.9999C2.5 7.2549 3.1875 5.47052 4.54125 3.69677C4.5841 3.64061 4.63837 3.59416 4.70047 3.56049C4.76258 3.52683 4.83112 3.5067 4.90157 3.50145C4.97201 3.49619 5.04278 3.50592 5.10919 3.53C5.17561 3.55408 5.23616 3.59196 5.28687 3.64115L6.79437 5.10427L8.16938 1.32865C8.19685 1.25334 8.24202 1.18575 8.30108 1.13156C8.36015 1.07737 8.43138 1.03818 8.50877 1.01728C8.58616 0.996391 8.66743 0.994409 8.74574 1.01151C8.82406 1.0286 8.89711 1.06428 8.95875 1.11552C10.3256 2.2499 13.5 5.28427 13.5 8.9999ZM12.5 8.9999C12.5 6.11927 10.2631 3.6299 8.86187 2.35427L7.47 6.17115C7.44143 6.24954 7.3937 6.31954 7.33116 6.37477C7.26861 6.42999 7.19324 6.46869 7.11191 6.48733C7.03059 6.50596 6.94589 6.50395 6.86553 6.48148C6.78518 6.459 6.71173 6.41678 6.65188 6.35865L5.00375 4.7599C4.00562 6.20052 3.5 7.6249 3.5 8.9999C3.5 10.1934 3.97411 11.338 4.81802 12.1819C5.66193 13.0258 6.80653 13.4999 8 13.4999C9.19347 13.4999 10.3381 13.0258 11.182 12.1819C12.0259 11.338 12.5 10.1934 12.5 8.9999Z" fill="rgba(254, 252, 251, 1)" />
                                                                        </svg>
                                                                        <span>{menu.nutrition.calories} kcal</span>
                                                                    </div>
                                                                    <div className="separator"></div>
                                                                    <div className="nutrition-mini">
                                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M15 5C15 4.33696 14.7366 3.70107 14.2678 3.23223C13.7989 2.76339 13.1631 2.5 12.5 2.5H3.00001C2.42593 2.50035 1.86947 2.69826 1.42409 3.06049C0.978721 3.42272 0.671583 3.92719 0.554278 4.48916C0.436972 5.05112 0.516648 5.63634 0.779918 6.14649C1.04319 6.65664 1.47401 7.06065 2.00001 7.29063V12.5C2.00001 12.7652 2.10537 13.0196 2.29291 13.2071C2.48044 13.3946 2.7348 13.5 3.00001 13.5H12.5C12.7652 13.5 13.0196 13.3946 13.2071 13.2071C13.3947 13.0196 13.5 12.7652 13.5 12.5V7.29063C13.9455 7.0957 14.3245 6.77529 14.5909 6.36852C14.8572 5.96175 14.9994 5.48622 15 5ZM3.00001 7.5C3.13262 7.5 3.2598 7.44732 3.35357 7.35355C3.44733 7.25979 3.50001 7.13261 3.50001 7C3.50001 6.86739 3.44733 6.74021 3.35357 6.64645C3.2598 6.55268 3.13262 6.5 3.00001 6.5C2.60219 6.5 2.22066 6.34196 1.93935 6.06066C1.65805 5.77936 1.50001 5.39782 1.50001 5C1.50001 4.60218 1.65805 4.22064 1.93935 3.93934C2.22066 3.65804 2.60219 3.5 3.00001 3.5H9.00001C9.39784 3.5 9.77937 3.65804 10.0607 3.93934C10.342 4.22064 10.5 4.60218 10.5 5C10.5 5.39782 10.342 5.77936 10.0607 6.06066C9.77937 6.34196 9.39784 6.5 9.00001 6.5C8.8674 6.5 8.74023 6.55268 8.64646 6.64645C8.55269 6.74021 8.50001 6.86739 8.50001 7C8.50001 7.13261 8.55269 7.25979 8.64646 7.35355C8.74023 7.44732 8.8674 7.5 9.00001 7.5V12.5H3.00001V7.5ZM12.5 6.5C12.3674 6.5 12.2402 6.55268 12.1465 6.64645C12.0527 6.74021 12 6.86739 12 7C12 7.13261 12.0527 7.25979 12.1465 7.35355C12.2402 7.44732 12.3674 7.5 12.5 7.5V12.5H10V7.29063C10.3456 7.13973 10.6526 6.91262 10.8979 6.62629C11.1433 6.33995 11.3207 6.00182 11.4169 5.63721C11.5131 5.27259 11.5256 4.89094 11.4534 4.52083C11.3812 4.15071 11.2262 3.80173 11 3.5H12.5C12.8978 3.5 13.2794 3.65804 13.5607 3.93934C13.842 4.22064 14 4.60218 14 5C14 5.39782 13.842 5.77936 13.5607 6.06066C13.2794 6.34196 12.8978 6.5 12.5 6.5Z" fill="rgba(254, 252, 251, 1)" />
                                                                        </svg>
                                                                        <span>{menu.nutrition.carbs} carbs</span>
                                                                    </div>
                                                                    <div className="separator"></div>
                                                                    <div className="nutrition-mini">
                                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <g clip-path="url(#clip0_4027_227)">
                                                                                <path d="M10.5 4.74978C10.5 4.89811 10.456 5.04312 10.3736 5.16645C10.2912 5.28979 10.1741 5.38592 10.037 5.44268C9.89997 5.49945 9.74917 5.5143 9.60369 5.48536C9.4582 5.45643 9.32457 5.38499 9.21968 5.28011C9.11479 5.17522 9.04336 5.04158 9.01442 4.89609C8.98548 4.75061 9.00033 4.59981 9.0571 4.46276C9.11386 4.32572 9.20999 4.20858 9.33333 4.12617C9.45667 4.04376 9.60167 3.99977 9.75001 3.99977C9.94892 3.99977 10.1397 4.07879 10.2803 4.21944C10.421 4.3601 10.5 4.55086 10.5 4.74978ZM13.545 8.97728C12.3344 11.1585 10.08 12.3373 6.84251 12.4835L5.46751 15.6967C5.42886 15.7869 5.36452 15.8637 5.2825 15.9176C5.20048 15.9715 5.1044 16.0001 5.00626 15.9998H4.97438C4.87135 15.9933 4.77284 15.9551 4.69238 15.8904C4.61192 15.8258 4.55345 15.7378 4.52501 15.6385L3.60001 12.3992L0.362507 11.4723C0.262988 11.4443 0.17458 11.3862 0.109448 11.3059C0.044317 11.2257 0.00566485 11.1272 -0.00118842 11.0241C-0.00804169 10.9209 0.0172409 10.8182 0.0711795 10.73C0.125118 10.6418 0.205061 10.5725 0.300007 10.5317L3.51313 9.15665C3.66001 5.9204 4.83876 3.66665 7.01876 2.4554C8.56563 1.59665 10.315 1.4654 11.5113 1.50665C12.6763 1.54665 13.7613 1.77352 13.94 1.88165C14.013 1.92467 14.0739 1.98553 14.1169 2.05852C14.2225 2.23665 14.45 3.32165 14.4919 4.48665C14.5344 5.6804 14.4038 7.4304 13.545 8.97728ZM10.0963 10.7898C9.51853 10.5695 9.01544 10.1894 8.64578 9.69377C8.27612 9.19816 8.05517 8.60757 8.00876 7.99103C7.39235 7.9447 6.80188 7.72385 6.30637 7.35429C5.81086 6.98474 5.4308 6.48175 5.21063 5.90415C4.77522 6.8954 4.5398 8.09519 4.50438 9.50353C4.50217 9.59943 4.47241 9.69267 4.41866 9.77213C4.36492 9.85159 4.28945 9.9139 4.20126 9.95165L1.98938 10.8979L4.14251 11.5142C4.2242 11.5376 4.29858 11.5814 4.35861 11.6416C4.41865 11.7017 4.46236 11.7762 4.48563 11.8579L5.10063 14.0104L6.04813 11.7979C6.08597 11.7098 6.14833 11.6345 6.22778 11.5809C6.30723 11.5272 6.40042 11.4976 6.49626 11.4954C7.90334 11.4617 9.10334 11.2264 10.0963 10.7898ZM13.2763 2.7229C12.3919 2.5354 9.27001 2.0354 7.00751 3.64477C6.63303 3.91197 6.29662 4.22883 6.00751 4.58665C5.98382 4.91315 6.03166 5.24089 6.1477 5.547C6.26373 5.85311 6.44516 6.13021 6.67934 6.35896C6.91351 6.58772 7.19478 6.76262 7.50351 6.87147C7.81225 6.98031 8.14102 7.02047 8.46688 6.98915C8.54029 6.98208 8.61435 6.99134 8.68377 7.01626C8.75318 7.04118 8.81621 7.08115 8.86836 7.13329C8.92051 7.18544 8.96048 7.24848 8.9854 7.31789C9.01032 7.3873 9.01958 7.46137 9.01251 7.53478C8.98125 7.86075 9.02152 8.18963 9.13051 8.49843C9.23951 8.80724 9.4146 9.08853 9.64355 9.32266C9.87251 9.55679 10.1498 9.73813 10.4561 9.854C10.7624 9.96987 11.0903 10.0175 11.4169 9.99353C11.7734 9.70434 12.0888 9.36791 12.3544 8.99352C13.9638 6.7329 13.4638 3.60852 13.2763 2.7229Z" fill="rgba(254, 252, 251, 1)" />
                                                                            </g>
                                                                            <defs>
                                                                                <clipPath id="clip0_4027_227">
                                                                                    <rect width="16" height="16" fill="white" />
                                                                                </clipPath>
                                                                            </defs>
                                                                        </svg>
                                                                        <span>{menu.nutrition.proteins} protein</span>
                                                                    </div>
                                                                    <div className="separator"></div>
                                                                    <div className="nutrition-mini">
                                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <g clip-path="url(#clip0_4027_207)">
                                                                                <path d="M10.875 2.98423C10.103 2.09263 9.23409 1.28977 8.28438 0.590485C8.20031 0.531592 8.10015 0.5 7.9975 0.5C7.89485 0.5 7.7947 0.531592 7.71063 0.590485C6.76266 1.29006 5.89545 2.09291 5.125 2.98423C3.40688 4.95736 2.5 7.03736 2.5 8.99986C2.5 10.4586 3.07946 11.8575 4.11091 12.8889C5.14236 13.9204 6.54131 14.4999 8 14.4999C9.45869 14.4999 10.8576 13.9204 11.8891 12.8889C12.9205 11.8575 13.5 10.4586 13.5 8.99986C13.5 7.03736 12.5931 4.95736 10.875 2.98423ZM8 13.4999C6.80693 13.4985 5.66311 13.024 4.81948 12.1804C3.97585 11.3368 3.50132 10.1929 3.5 8.99986C3.5 5.42298 6.96687 2.43736 8 1.62486C9.03313 2.43736 12.5 5.42173 12.5 8.99986C12.4987 10.1929 12.0241 11.3368 11.1805 12.1804C10.3369 13.024 9.19307 13.4985 8 13.4999ZM11.4931 9.58361C11.3635 10.3078 11.0151 10.9749 10.4948 11.495C9.9745 12.0152 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4998 8.25375 12.4527 8.16148 12.3677C8.06921 12.2828 8.01223 12.1662 8.00185 12.0413C7.99146 11.9163 8.02843 11.7919 8.10542 11.6929C8.18242 11.5939 8.2938 11.5275 8.4175 11.5067C9.45312 11.3324 10.3319 10.4536 10.5075 9.41611C10.5297 9.28533 10.603 9.16872 10.7112 9.09195C10.8193 9.01517 10.9536 8.98452 11.0844 9.00673C11.2152 9.02895 11.3318 9.1022 11.4085 9.21039C11.4853 9.31857 11.516 9.45282 11.4937 9.58361H11.4931Z" fill="rgba(254, 252, 251, 1)" />
                                                                            </g>
                                                                            <defs>
                                                                                <clipPath id="clip0_4027_207">
                                                                                    <rect width="16" height="16" fill="white" />
                                                                                </clipPath>
                                                                            </defs>
                                                                        </svg>
                                                                        <span>{menu.nutrition.fats} fats</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    className="btn-add-small"
                                                                    onClick={(event) => openAddMealModal(menu, event)}
                                                                >
                                                                    Thêm vào thực đơn
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pagination - only show for 'Tất cả' category */}
                                            {selectedCategory === 'Tất cả' && totalPages > 1 && (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginTop: '32px',
                                                    paddingTop: '24px',
                                                    borderTop: '1px solid #333'
                                                }}>
                                                    <button
                                                        className="pagination-button"
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                    >
                                                        Trước
                                                    </button>

                                                    {[...Array(totalPages)].map((_, index) => {
                                                        const page = index + 1;
                                                        // Show first page, last page, current page, and pages around current
                                                        if (
                                                            page === 1 ||
                                                            page === totalPages ||
                                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                                                                    onClick={() => handlePageChange(page)}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        } else if (
                                                            page === currentPage - 2 ||
                                                            page === currentPage + 2
                                                        ) {
                                                            return <span key={page} className="pagination-ellipsis">...</span>;
                                                        }
                                                        return null;
                                                    })}

                                                    <button
                                                        className="pagination-button"
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                    >
                                                        Sau
                                                    </button>

                                                    <span className="pagination-info">
                                                        Trang {currentPage} / {totalPages}
                                                    </span>
                                                </div>
                                            )}

                                            {menus.length > 0 && (
                                                <div style={{
                                                    marginTop: '24px',
                                                    textAlign: 'center',
                                                    color: '#8A8C90',
                                                    fontSize: '14px'
                                                }}>
                                                    Hiển thị {menus.length} món ăn
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Sidebar */}
                            <div className="nutrition-sidebar">
                                {/* Popular Menu */}
                                <div className="sidebar-section">
                                    <h2 className='flex justify-between items-center mb-4 text-white font-semibold text-lg'>Món phổ biến</h2>
                                    <div className="popular-menu-list">
                                        {popularMenus.map(menu => (
                                            <div key={menu.id} className="popular-menu-item" onClick={() => handleMealClick(menu)} style={{ cursor: 'pointer' }}>
                                                <div className="popular-image">
                                                    {menu.image ? (
                                                        <img src={menu.image} alt={menu.name} onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            if (e.target.nextSibling) {
                                                                e.target.nextSibling.style.display = 'block';
                                                            }
                                                        }} />
                                                    ) : null}
                                                    <div className="image-placeholder" style={{ display: menu.image ? 'none' : 'block' }}></div>
                                                </div>
                                                <div className="popular-info">
                                                    <div className="popular-header">
                                                        <h4>{menu.name}</h4>
                                                        <button
                                                            className="btn-add-mini"
                                                            onClick={(event) => openAddMealModal(menu, event)}
                                                        >
                                                            <Plus size={18} weight="bold" />
                                                        </button>
                                                    </div>
                                                    <div className="popular-details">
                                                        <div className="popular-rating">
                                                            <Star size={14} weight="fill" color="#FFA257" />
                                                            <span className="rating">{menu.rating}</span>
                                                            <span className="rating-max">/5</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <span className="popular-category" style={{ backgroundColor: getCategoryColor(menu.category) }}>
                                                                {menu.category}
                                                            </span>
                                                            {menu.isAIRecommended && (
                                                                <span className="badge-ai" style={{
                                                                    backgroundColor: '#6366f1',
                                                                    color: '#fff',
                                                                    padding: '3px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '10px',
                                                                    fontWeight: '600',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px'
                                                                }}>
                                                                    <Sparkle size={10} weight="fill" />
                                                                    AI
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommended Menu */}
                                <div className="sidebar-section">
                                    <h2 className='flex justify-between items-center mb-4 text-white font-semibold text-lg'>Món được đề xuất</h2>
                                    <div className="recommended-menu-list">
                                        {recommendedMenus.map(menu => (
                                            <div key={menu.id} className="recommended-menu-item" onClick={() => handleMealClick(menu)} style={{ cursor: 'pointer' }}>
                                                <div className="recommended-main">
                                                    <div className="recommended-image">
                                                        {menu.image ? (
                                                            <img src={menu.image} alt={menu.name} onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                if (e.target.nextSibling) {
                                                                    e.target.nextSibling.style.display = 'block';
                                                                }
                                                            }} />
                                                        ) : null}
                                                        <div className="image-placeholder" style={{ display: menu.image ? 'none' : 'block' }}></div>
                                                    </div>
                                                    <div className="recommended-info">
                                                        <h4>{menu.name}</h4>
                                                        <div className="recommended-bottom">
                                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <span className="recommended-category" style={{ backgroundColor: getCategoryColor(menu.category) }}>
                                                                    {menu.category}
                                                                </span>
                                                                {menu.isAIRecommended && (
                                                                    <span className="badge-ai" style={{
                                                                        backgroundColor: '#6366f1',
                                                                        color: '#fff',
                                                                        padding: '3px 6px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '10px',
                                                                        fontWeight: '600',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '3px'
                                                                    }}>
                                                                        <Sparkle size={10} weight="fill" />
                                                                        AI
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                className="btn-add-tiny"
                                                                onClick={(event) => openAddMealModal(menu, event)}
                                                            >
                                                                <Plus size={16} weight="bold" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="recommended-divider"></div>
                                                <div className="recommended-nutrition">
                                                    <div className="nutrition-row">
                                                        <div className="nutrition-label-small">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4931 9.58365C11.3635 10.3078 11.0151 10.9749 10.4948 11.4951C9.9745 12.0153 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4999 8.25375 12.4527 8.16148 12.3678C8.06921 12.2828 8.01223 12.1663 8.00185 12.0413C7.99146 11.9163 8.02843 11.792 8.10542 11.693C8.18242 11.594 8.2938 11.5275 8.4175 11.5068C9.45312 11.3324 10.3319 10.4536 10.5075 9.41615C10.5297 9.28536 10.603 9.16876 10.7112 9.09199C10.8193 9.01521 10.9536 8.98456 11.0844 9.00677C11.2152 9.02899 11.3318 9.10224 11.4085 9.21043C11.4853 9.31861 11.516 9.45286 11.4937 9.58365H11.4931ZM13.5 8.9999C13.5 10.4586 12.9205 11.8575 11.8891 12.889C10.8576 13.9204 9.45869 14.4999 8 14.4999C6.54131 14.4999 5.14236 13.9204 4.11091 12.889C3.07946 11.8575 2.5 10.4586 2.5 8.9999C2.5 7.2549 3.1875 5.47052 4.54125 3.69677C4.5841 3.64061 4.63837 3.59416 4.70047 3.56049C4.76258 3.52683 4.83112 3.5067 4.90157 3.50145C4.97201 3.49619 5.04278 3.50592 5.10919 3.53C5.17561 3.55408 5.23616 3.59196 5.28687 3.64115L6.79437 5.10427L8.16938 1.32865C8.19685 1.25334 8.24202 1.18575 8.30108 1.13156C8.36015 1.07737 8.43138 1.03818 8.50877 1.01728C8.58616 0.996391 8.66743 0.994409 8.74574 1.01151C8.82406 1.0286 8.89711 1.06428 8.95875 1.11552C10.3256 2.2499 13.5 5.28427 13.5 8.9999ZM12.5 8.9999C12.5 6.11927 10.2631 3.6299 8.86187 2.35427L7.47 6.17115C7.44143 6.24954 7.3937 6.31954 7.33116 6.37477C7.26861 6.42999 7.19324 6.46869 7.11191 6.48733C7.03059 6.50596 6.94589 6.50395 6.86553 6.48148C6.78518 6.459 6.71173 6.41678 6.65188 6.35865L5.00375 4.7599C4.00562 6.20052 3.5 7.6249 3.5 8.9999C3.5 10.1934 3.97411 11.338 4.81802 12.1819C5.66193 13.0258 6.80653 13.4999 8 13.4999C9.19347 13.4999 10.3381 13.0258 11.182 12.1819C12.0259 11.338 12.5 10.1934 12.5 8.9999Z" fill="rgba(254, 252, 251, 1)"></path></svg>
                                                            <span className='text-[#fefcfb]'>C</span>
                                                        </div>
                                                        <span className="nutrition-value-small">{menu.nutrition.calories}</span>
                                                    </div>
                                                    <div className="nutrition-row">
                                                        <div className="nutrition-label-small">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5C15 4.33696 14.7366 3.70107 14.2678 3.23223C13.7989 2.76339 13.1631 2.5 12.5 2.5H3.00001C2.42593 2.50035 1.86947 2.69826 1.42409 3.06049C0.978721 3.42272 0.671583 3.92719 0.554278 4.48916C0.436972 5.05112 0.516648 5.63634 0.779918 6.14649C1.04319 6.65664 1.47401 7.06065 2.00001 7.29063V12.5C2.00001 12.7652 2.10537 13.0196 2.29291 13.2071C2.48044 13.3946 2.7348 13.5 3.00001 13.5H12.5C12.7652 13.5 13.0196 13.3946 13.2071 13.2071C13.3947 13.0196 13.5 12.7652 13.5 12.5V7.29063C13.9455 7.0957 14.3245 6.77529 14.5909 6.36852C14.8572 5.96175 14.9994 5.48622 15 5ZM3.00001 7.5C3.13262 7.5 3.2598 7.44732 3.35357 7.35355C3.44733 7.25979 3.50001 7.13261 3.50001 7C3.50001 6.86739 3.44733 6.74021 3.35357 6.64645C3.2598 6.55268 3.13262 6.5 3.00001 6.5C2.60219 6.5 2.22066 6.34196 1.93935 6.06066C1.65805 5.77936 1.50001 5.39782 1.50001 5C1.50001 4.60218 1.65805 4.22064 1.93935 3.93934C2.22066 3.65804 2.60219 3.5 3.00001 3.5H9.00001C9.39784 3.5 9.77937 3.65804 10.0607 3.93934C10.342 4.22064 10.5 4.60218 10.5 5C10.5 5.39782 10.342 5.77936 10.0607 6.06066C9.77937 6.34196 9.39784 6.5 9.00001 6.5C8.8674 6.5 8.74023 6.55268 8.64646 6.64645C8.55269 6.74021 8.50001 6.86739 8.50001 7C8.50001 7.13261 8.55269 7.25979 8.64646 7.35355C8.74023 7.44732 8.8674 7.5 9.00001 7.5V12.5H3.00001V7.5ZM12.5 6.5C12.3674 6.5 12.2402 6.55268 12.1465 6.64645C12.0527 6.74021 12 6.86739 12 7C12 7.13261 12.0527 7.25979 12.1465 7.35355C12.2402 7.44732 12.3674 7.5 12.5 7.5V12.5H10V7.29063C10.3456 7.13973 10.6526 6.91262 10.8979 6.62629C11.1433 6.33995 11.3207 6.00182 11.4169 5.63721C11.5131 5.27259 11.5256 4.89094 11.4534 4.52083C11.3812 4.15071 11.2262 3.80173 11 3.5H12.5C12.8978 3.5 13.2794 3.65804 13.5607 3.93934C13.842 4.22064 14 4.60218 14 5C14 5.39782 13.842 5.77936 13.5607 6.06066C13.2794 6.34196 12.8978 6.5 12.5 6.5Z" fill="rgba(254, 252, 251, 1)"></path></svg>
                                                            <span className='text-[#fefcfb]'>C</span>
                                                        </div>
                                                        <span className="nutrition-value-small">{menu.nutrition.carbs}</span>
                                                    </div>
                                                    <div className="nutrition-row">
                                                        <div className="nutrition-label-small">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_4027_227)"><path d="M10.5 4.74978C10.5 4.89811 10.456 5.04312 10.3736 5.16645C10.2912 5.28979 10.1741 5.38592 10.037 5.44268C9.89997 5.49945 9.74917 5.5143 9.60369 5.48536C9.4582 5.45643 9.32457 5.38499 9.21968 5.28011C9.11479 5.17522 9.04336 5.04158 9.01442 4.89609C8.98548 4.75061 9.00033 4.59981 9.0571 4.46276C9.11386 4.32572 9.20999 4.20858 9.33333 4.12617C9.45667 4.04376 9.60167 3.99977 9.75001 3.99977C9.94892 3.99977 10.1397 4.07879 10.2803 4.21944C10.421 4.3601 10.5 4.55086 10.5 4.74978ZM13.545 8.97728C12.3344 11.1585 10.08 12.3373 6.84251 12.4835L5.46751 15.6967C5.42886 15.7869 5.36452 15.8637 5.2825 15.9176C5.20048 15.9715 5.1044 16.0001 5.00626 15.9998H4.97438C4.87135 15.9933 4.77284 15.9551 4.69238 15.8904C4.61192 15.8258 4.55345 15.7378 4.52501 15.6385L3.60001 12.3992L0.362507 11.4723C0.262988 11.4443 0.17458 11.3862 0.109448 11.3059C0.044317 11.2257 0.00566485 11.1272 -0.00118842 11.0241C-0.00804169 10.9209 0.0172409 10.8182 0.0711795 10.73C0.125118 10.6418 0.205061 10.5725 0.300007 10.5317L3.51313 9.15665C3.66001 5.9204 4.83876 3.66665 7.01876 2.4554C8.56563 1.59665 10.315 1.4654 11.5113 1.50665C12.6763 1.54665 13.7613 1.77352 13.94 1.88165C14.013 1.92467 14.0739 1.98553 14.1169 2.05852C14.2225 2.23665 14.45 3.32165 14.4919 4.48665C14.5344 5.6804 14.4038 7.4304 13.545 8.97728ZM10.0963 10.7898C9.51853 10.5695 9.01544 10.1894 8.64578 9.69377C8.27612 9.19816 8.05517 8.60757 8.00876 7.99103C7.39235 7.9447 6.80188 7.72385 6.30637 7.35429C5.81086 6.98474 5.4308 6.48175 5.21063 5.90415C4.77522 6.8954 4.5398 8.09519 4.50438 9.50353C4.50217 9.59943 4.47241 9.69267 4.41866 9.77213C4.36492 9.85159 4.28945 9.9139 4.20126 9.95165L1.98938 10.8979L4.14251 11.5142C4.2242 11.5376 4.29858 11.5814 4.35861 11.6416C4.41865 11.7017 4.46236 11.7762 4.48563 11.8579L5.10063 14.0104L6.04813 11.7979C6.08597 11.7098 6.14833 11.6345 6.22778 11.5809C6.30723 11.5272 6.40042 11.4976 6.49626 11.4954C7.90334 11.4617 9.10334 11.2264 10.0963 10.7898ZM13.2763 2.7229C12.3919 2.5354 9.27001 2.0354 7.00751 3.64477C6.63303 3.91197 6.29662 4.22883 6.00751 4.58665C5.98382 4.91315 6.03166 5.24089 6.1477 5.547C6.26373 5.85311 6.44516 6.13021 6.67934 6.35896C6.91351 6.58772 7.19478 6.76262 7.50351 6.87147C7.81225 6.98031 8.14102 7.02047 8.46688 6.98915C8.54029 6.98208 8.61435 6.99134 8.68377 7.01626C8.75318 7.04118 8.81621 7.08115 8.86836 7.13329C8.92051 7.18544 8.96048 7.24848 8.9854 7.31789C9.01032 7.3873 9.01958 7.46137 9.01251 7.53478C8.98125 7.86075 9.02152 8.18963 9.13051 8.49843C9.23951 8.80724 9.4146 9.08853 9.64355 9.32266C9.87251 9.55679 10.1498 9.73813 10.4561 9.854C10.7624 9.96987 11.0903 10.0175 11.4169 9.99353C11.7734 9.70434 12.0888 9.36791 12.3544 8.99352C13.9638 6.7329 13.4638 3.60852 13.2763 2.7229Z" fill="rgba(254, 252, 251, 1)"></path></g><defs><clipPath id="clip0_4027_227"><rect width="16" height="16" fill="rgba(254, 252, 251, 1)"></rect></clipPath></defs></svg>
                                                            <span className='text-[#fefcfb]'>P</span>
                                                        </div>
                                                        <span className="nutrition-value-small">{menu.nutrition.proteins}</span>
                                                    </div>
                                                    <div className="nutrition-row">
                                                        <div className="nutrition-label-small">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_4027_207)"><path d="M10.875 2.98423C10.103 2.09263 9.23409 1.28977 8.28438 0.590485C8.20031 0.531592 8.10015 0.5 7.9975 0.5C7.89485 0.5 7.7947 0.531592 7.71063 0.590485C6.76266 1.29006 5.89545 2.09291 5.125 2.98423C3.40688 4.95736 2.5 7.03736 2.5 8.99986C2.5 10.4586 3.07946 11.8575 4.11091 12.8889C5.14236 13.9204 6.54131 14.4999 8 14.4999C9.45869 14.4999 10.8576 13.9204 11.8891 12.8889C12.9205 11.8575 13.5 10.4586 13.5 8.99986C13.5 7.03736 12.5931 4.95736 10.875 2.98423ZM8 13.4999C6.80693 13.4985 5.66311 13.024 4.81948 12.1804C3.97585 11.3368 3.50132 10.1929 3.5 8.99986C3.5 5.42298 6.96687 2.43736 8 1.62486C9.03313 2.43736 12.5 5.42173 12.5 8.99986C12.4987 10.1929 12.0241 11.3368 11.1805 12.1804C10.3369 13.024 9.19307 13.4985 8 13.4999ZM11.4931 9.58361C11.3635 10.3078 11.0151 10.9749 10.4948 11.495C9.9745 12.0152 9.30734 12.3635 8.58313 12.493C8.55563 12.4974 8.52784 12.4997 8.5 12.4999C8.37458 12.4998 8.25375 12.4527 8.16148 12.3677C8.06921 12.2828 8.01223 12.1662 8.00185 12.0413C7.99146 11.9163 8.02843 11.7919 8.10542 11.6929C8.18242 11.5939 8.2938 11.5275 8.4175 11.5067C9.45312 11.3324 10.3319 10.4536 10.5075 9.41611C10.5297 9.28533 10.603 9.16872 10.7112 9.09195C10.8193 9.01517 10.9536 8.98452 11.0844 9.00673C11.2152 9.02895 11.3318 9.1022 11.4085 9.21039C11.4853 9.31857 11.516 9.45282 11.4937 9.58361H11.4931Z" fill="rgba(254, 252, 251, 1)"></path></g><defs><clipPath id="clip0_4027_207"><rect width="16" height="16" fill="rgba(254, 252, 251, 1)"></rect></clipPath></defs></svg>
                                                            <span className='text-[#fefcfb]'>F</span>
                                                        </div>
                                                        <span className="nutrition-value-small">{menu.nutrition.fats}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Kế hoạch dinh dưỡng */}
                    {activePageTab === 'plans' && (
                        <div className="nutrition-tab-panel">
                            <h2 className="tab-panel-title">Kế hoạch dinh dưỡng của tôi</h2>
                            <div className="plans-container">
                                <div className="plan-card">
                                    <div className="plan-header">
                                        <Calendar size={24} weight="regular" />
                                        <h3>Kế hoạch hôm nay</h3>
                                    </div>
                                    <p className="plan-description">Xem và quản lý kế hoạch dinh dưỡng của bạn trong trang "Bữa ăn của tôi"</p>
                                    <button
                                        className="btn-view-plan"
                                        onClick={() => window.location.href = '/my-meals'}
                                    >
                                        Xem kế hoạch
                                    </button>
                                </div>
                                <div className="plan-card">
                                    <div className="plan-header">
                                        <Sparkle size={24} weight="regular" />
                                        <h3>Tạo kế hoạch mới</h3>
                                    </div>
                                    <p className="plan-description">Sử dụng AI để tạo kế hoạch dinh dưỡng phù hợp với mục tiêu của bạn</p>
                                    <button
                                        className="btn-create-plan"
                                        onClick={() => {
                                            setActivePageTab('menu');
                                            setShowAIPanel(true);
                                        }}
                                    >
                                        Tạo kế hoạch
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Thông tin dinh dưỡng */}
                    {activePageTab === 'info' && (
                        <div className="nutrition-tab-panel">
                            <h2 className="tab-panel-title">Thông tin dinh dưỡng</h2>
                            <div className="info-articles">
                                <div className="info-card">
                                    <BookOpen size={32} weight="regular" />
                                    <h3>Macro Nutrients là gì?</h3>
                                    <p>Macro nutrients (đạm, tinh bột, chất béo) là những chất dinh dưỡng cần thiết cho cơ thể với số lượng lớn. Hiểu rõ về macro giúp bạn xây dựng chế độ ăn phù hợp.</p>
                                </div>
                                <div className="info-card">
                                    <ChartBar size={32} weight="regular" />
                                    <h3>Cách tính Macro cho mục tiêu</h3>
                                    <p>Tùy vào mục tiêu (giảm cân, tăng cơ, duy trì), tỷ lệ macro sẽ khác nhau. Sử dụng công cụ tính toán macro để tìm ra tỷ lệ phù hợp nhất.</p>
                                </div>
                                <div className="info-card">
                                    <Clock size={32} weight="regular" />
                                    <h3>Thời điểm ăn uống</h3>
                                    <p>Thời điểm ăn uống quan trọng không kém số lượng. Ăn đúng giờ giúp cơ thể hấp thu dinh dưỡng tốt hơn và duy trì năng lượng ổn định.</p>
                                </div>
                                <div className="info-card">
                                    <Star size={32} weight="regular" />
                                    <h3>Chất lượng thực phẩm</h3>
                                    <p>Không chỉ số lượng, chất lượng thực phẩm cũng rất quan trọng. Ưu tiên thực phẩm tươi, tự nhiên và ít chế biến.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Tính toán Macro */}
                    {activePageTab === 'calculator' && (
                        <div className="nutrition-tab-panel">
                            <h2 className="tab-panel-title">Tính toán Macro Nutrients</h2>
                            <div className="calculator-container">
                                <div className="calculator-form">
                                    <div className="form-group">
                                        <label>Cân nặng (kg)</label>
                                        <input type="number" placeholder="VD: 70" />
                                    </div>
                                    <div className="form-group">
                                        <label>Chiều cao (cm)</label>
                                        <input type="number" placeholder="VD: 175" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tuổi</label>
                                        <input type="number" placeholder="VD: 25" />
                                    </div>
                                    <div className="form-group">
                                        <label>Giới tính</label>
                                        <select>
                                            <option>Nam</option>
                                            <option>Nữ</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Mức độ hoạt động</label>
                                        <select>
                                            <option>Ít vận động</option>
                                            <option>Vận động nhẹ (1-3 lần/tuần)</option>
                                            <option>Vận động vừa (3-5 lần/tuần)</option>
                                            <option>Vận động nhiều (6-7 lần/tuần)</option>
                                            <option>Rất nhiều (2 lần/ngày)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Mục tiêu</label>
                                        <select>
                                            <option>Giảm cân</option>
                                            <option>Tăng cân</option>
                                            <option>Duy trì</option>
                                            <option>Tăng cơ</option>
                                        </select>
                                    </div>
                                    <button className="btn-calculate">Tính toán</button>
                                </div>
                                <div className="calculator-result">
                                    <h3>Kết quả tính toán</h3>
                                    <div className="result-card">
                                        <div className="result-item">
                                            <span className="result-label">Calories/ngày</span>
                                            <span className="result-value">-</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Protein (g)</span>
                                            <span className="result-value">-</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Carbs (g)</span>
                                            <span className="result-value">-</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Fat (g)</span>
                                            <span className="result-value">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Thống kê */}
                    {activePageTab === 'stats' && (
                        <div className="nutrition-tab-panel">
                            <h2 className="tab-panel-title">Thống kê dinh dưỡng</h2>
                            <div className="stats-container">
                                <div className="stats-card">
                                    <ChartBar size={32} weight="regular" />
                                    <h3>Hôm nay</h3>
                                    <div className="stats-details">
                                        <div className="stat-item">
                                            <span>Calories</span>
                                            <span>0 / 2000</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Protein</span>
                                            <span>0g / 150g</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Carbs</span>
                                            <span>0g / 250g</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Fat</span>
                                            <span>0g / 65g</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stats-card">
                                    <Calendar size={32} weight="regular" />
                                    <h3>Tuần này</h3>
                                    <div className="stats-details">
                                        <div className="stat-item">
                                            <span>Trung bình Calories/ngày</span>
                                            <span>0</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Số bữa ăn</span>
                                            <span>0</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>Mục tiêu đạt được</span>
                                            <span>0%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stats-note">
                                    <p>Thống kê sẽ được cập nhật khi bạn thêm món ăn vào kế hoạch dinh dưỡng.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Meal Detail Modal */}
            {showMealModal && selectedMeal && (
                <>
                    {/* Overlay */}
                    <div
                        className="meal-modal-overlay"
                        onClick={() => setShowMealModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="meal-modal">
                        <div className="meal-modal-header">
                            <div className="meal-modal-title-section">
                                <h2>{selectedMeal.name}</h2>
                                {selectedMeal.description && (
                                    <p className="meal-modal-description">{selectedMeal.description}</p>
                                )}
                            </div>
                            <button
                                className="meal-modal-close"
                                onClick={() => setShowMealModal(false)}
                            >
                                <X size={24} weight="bold" />
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="meal-modal-tabs">
                            <button
                                className={`meal-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ingredients')}
                            >
                                Nguyên liệu
                            </button>
                            <button
                                className={`meal-tab ${activeTab === 'instructions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('instructions')}
                            >
                                Hướng dẫn nấu
                            </button>
                            <button
                                className={`meal-tab ${activeTab === 'video' ? 'active' : ''}`}
                                onClick={() => setActiveTab('video')}
                                disabled={!selectedMeal.cookingVideoUrl}
                            >
                                Video hướng dẫn
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="meal-modal-content">
                            {activeTab === 'ingredients' && selectedMeal.ingredients && selectedMeal.ingredients.length > 0 && (
                                <div className="meal-tab-content">
                                    <ul className="ingredients-list">
                                        {selectedMeal.ingredients.map((ingredient, index) => (
                                            <li key={index} className="ingredient-item">
                                                <span className="ingredient-name">{ingredient.name}</span>
                                                {ingredient.amount && ingredient.unit && (
                                                    <span className="ingredient-amount">
                                                        {ingredient.amount} {ingredient.unit}
                                                    </span>
                                                )}
                                                {ingredient.notes && (
                                                    <span className="ingredient-notes">{ingredient.notes}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'instructions' && selectedMeal.instructions && selectedMeal.instructions.length > 0 && (
                                <div className="meal-tab-content">
                                    <ol className="instructions-list">
                                        {selectedMeal.instructions.map((instruction, index) => (
                                            <li key={index} className="instruction-item">
                                                <span className="instruction-number">{index + 1}</span>
                                                <span className="instruction-text">{instruction}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {activeTab === 'video' && selectedMeal.cookingVideoUrl && (
                                <div className="meal-tab-content">
                                    <div className="video-container">
                                        {getYouTubeEmbedUrl(selectedMeal.cookingVideoUrl) ? (
                                            <iframe
                                                width="100%"
                                                height="500"
                                                src={getYouTubeEmbedUrl(selectedMeal.cookingVideoUrl)}
                                                title="Cooking Video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                onError={(e) => {
                                                    console.error('Video load error:', e);
                                                    e.target.style.display = 'none';
                                                    const errorDiv = document.createElement('div');
                                                    errorDiv.className = 'video-error';
                                                    errorDiv.innerHTML = `
                                                        <p style="color: #999; text-align: center; padding: 20px;">
                                                            Video không có sẵn hoặc không hoạt động.<br/>
                                                            <a href="${selectedMeal.cookingVideoUrl}" target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: underline;">
                                                                Mở video trên YouTube
                                                            </a>
                                                        </p>
                                                    `;
                                                    e.target.parentElement.appendChild(errorDiv);
                                                }}
                                            />
                                        ) : (
                                            <div className="video-error">
                                                <p style="color: #999; text-align: center; padding: 20px;">
                                                    Video không có sẵn hoặc không hoạt động.<br />
                                                    {selectedMeal.cookingVideoUrl && (
                                                        <a
                                                            href={selectedMeal.cookingVideoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#667eea', textDecoration: 'underline' }}
                                                        >
                                                            Mở video trên YouTube
                                                        </a>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ingredients' && (!selectedMeal.ingredients || selectedMeal.ingredients.length === 0) && (
                                <div className="meal-tab-content empty-state">
                                    <p>Chưa có thông tin nguyên liệu</p>
                                </div>
                            )}

                            {activeTab === 'instructions' && (!selectedMeal.instructions || selectedMeal.instructions.length === 0) && (
                                <div className="meal-tab-content empty-state">
                                    <p>Chưa có hướng dẫn nấu</p>
                                </div>
                            )}

                            {activeTab === 'video' && !selectedMeal.cookingVideoUrl && (
                                <div className="meal-tab-content empty-state">
                                    <p>Chưa có video hướng dẫn</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Nutrition;
