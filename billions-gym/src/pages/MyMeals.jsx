import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Trash, Plus, Star, Clock, X, Copy, CaretLeft, CaretRight } from '@phosphor-icons/react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { nutritionAPI } from '../services/api';
import './MyMeals.css';

const MyMeals = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealPlan, setMealPlan] = useState(null);
    const [loading, setLoading] = useState(true);
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
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [mealToDuplicate, setMealToDuplicate] = useState(null);
    const dateInputRef = useRef(null);

    const mealTypes = [
        { key: 'buaSang', label: 'Bữa sáng', icon: '🌅' },
        { key: 'phu1', label: 'Bữa phụ 1', icon: '🍎' },
        { key: 'buaTrua', label: 'Bữa trưa', icon: '☀️' },
        { key: 'phu2', label: 'Bữa phụ 2', icon: '🥗' },
        { key: 'buaToi', label: 'Bữa tối', icon: '🌙' },
        { key: 'phu3', label: 'Bữa phụ 3', icon: '🥛' }
    ];

    useEffect(() => {
        loadMealPlan();
    }, [selectedDate]);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };

        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    const loadMealPlan = async () => {
        setLoading(true);
        try {
            const result = await nutritionAPI.getMyMeals(selectedDate);
            if (result.success && result.data) {
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

    const navigateDate = (direction) => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + direction);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const handleRemoveMeal = (mealType, mealIndex, meal) => {
        setMealToDelete({ mealType, mealIndex, meal });
        setShowDeleteConfirm(true);
    };

    const confirmRemoveMeal = async () => {
        if (!mealToDelete) return;

        try {
            const result = await nutritionAPI.removeMealFromPlan(
                selectedDate,
                mealToDelete.mealType,
                mealToDelete.mealIndex
            );

            if (result.success) {
                await loadMealPlan();
                setShowDeleteConfirm(false);
                setMealToDelete(null);
            } else {
                alert('Lỗi: ' + (result.message || 'Không thể xóa món ăn'));
            }
        } catch (error) {
            console.error('Error removing meal:', error);
            alert('Lỗi: ' + (error.message || 'Không thể xóa món ăn'));
        }
    };

    const handleDuplicateMeal = (meal, mealType) => {
        setMealToDuplicate({ meal, mealType });
        setShowDuplicateModal(true);
    };

    const confirmDuplicateMeal = async (targetDate) => {
        if (!mealToDuplicate) return;

        try {
            const mealTypeMap = {
                'buaSang': 'Bữa sáng',
                'phu1': 'Phụ 1',
                'buaTrua': 'Bữa trưa',
                'phu2': 'Phụ 2',
                'buaToi': 'Bữa tối',
                'phu3': 'Phụ 3'
            };

            const result = await nutritionAPI.duplicateMeal(
                mealToDuplicate.meal._id,
                targetDate,
                mealTypeMap[mealToDuplicate.mealType] || mealToDuplicate.mealType
            );

            if (result.success) {
                if (targetDate === selectedDate) {
                    await loadMealPlan();
                }
                setShowDuplicateModal(false);
                setMealToDuplicate(null);
                alert('Đã thêm món ăn vào thực đơn!');
            } else {
                alert('Lỗi: ' + (result.message || 'Không thể thêm món ăn'));
            }
        } catch (error) {
            console.error('Error duplicating meal:', error);
            alert('Lỗi: ' + (error.message || 'Không thể thêm món ăn'));
        }
    };


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const handleMealClick = (meal) => {
        setSelectedMeal(meal);
        setShowMealModal(true);
        setActiveTab('ingredients');
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = null;
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }
        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch) {
            videoId = shortMatch[1];
        }
        const embedMatch = url.match(/embed\/([^?&]+)/);
        if (embedMatch) {
            videoId = embedMatch[1];
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return null;
    };

    const renderDailyView = () => {
        return (
            <>
                <div className="date-display">
                    <h2 className="text-2xl font-semibold text-white">
                        {formatDate(selectedDate)}
                    </h2>
                </div>

                <div className="meals-container">
                    {mealTypes.map((mealType) => {
                        const meals = mealPlan?.meals?.[mealType.key] || [];
                        return (
                            <div key={mealType.key} className="meal-section">
                                <div className="meal-section-header">
                                    <h3 className="meal-section-title">
                                        <span className="meal-icon">{mealType.icon}</span>
                                        {mealType.label}
                                    </h3>
                                    <span className="meal-count">
                                        {meals.length} món
                                    </span>
                                </div>

                                <div className="meals-list">
                                    {meals.length === 0 ? (
                                        <div className="empty-meal">
                                            <p className="text-gray-400">Chưa có món ăn nào</p>
                                            <p className="text-gray-500 text-sm">
                                                Thêm món ăn từ trang Dinh dưỡng
                                            </p>
                                        </div>
                                    ) : (
                                        meals.map((mealItem, index) => {
                                            const meal = mealItem.meal;
                                            if (!meal) return null;

                                            return (
                                                <div key={index} className="meal-card" onClick={() => handleMealClick(meal)} style={{ cursor: 'pointer' }}>
                                                    <div className="meal-card-header">
                                                        <div className="meal-info">
                                                            <h4 className="meal-name">{meal.name}</h4>
                                                            <div className="meal-meta">
                                                                {meal.rating && (
                                                                    <div className="meal-rating">
                                                                        <Star size={14} weight="fill" color="#FFA257" />
                                                                        <span>{meal.rating}/5</span>
                                                                    </div>
                                                                )}
                                                                {meal.cookingTimeMinutes && (
                                                                    <div className="meal-time">
                                                                        <Clock size={14} weight="regular" />
                                                                        <span>{meal.cookingTimeMinutes} phút</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="meal-actions">
                                                            <span className={`source-badge ${mealItem.source === 'AI_GENERATED' ? 'ai-badge' : 'user-badge'}`}>
                                                                {mealItem.source === 'AI_GENERATED' ? 'AI' : 'Bạn chọn'}
                                                            </span>
                                                            <button
                                                                className="btn-action-meal"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicateMeal(meal, mealType.key);
                                                                }}
                                                                title="Thêm vào ngày khác"
                                                            >
                                                                <Copy size={16} weight="regular" />
                                                            </button>
                                                            <button
                                                                className="btn-remove-meal"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveMeal(mealType.key, index, meal);
                                                                }}
                                                                title="Xóa món ăn"
                                                            >
                                                                <Trash size={16} weight="regular" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {meal.nutrition && (
                                                        <div className="meal-nutrition">
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-label">Calo</span>
                                                                <span className="nutrition-value">
                                                                    {meal.nutrition.caloriesKcal} kcal
                                                                </span>
                                                            </div>
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-label">Carbs</span>
                                                                <span className="nutrition-value">
                                                                    {meal.nutrition.carbsGrams}g
                                                                </span>
                                                            </div>
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-label">Protein</span>
                                                                <span className="nutrition-value">
                                                                    {meal.nutrition.proteinGrams}g
                                                                </span>
                                                            </div>
                                                            <div className="nutrition-item">
                                                                <span className="nutrition-label">Fat</span>
                                                                <span className="nutrition-value">
                                                                    {meal.nutrition.fatGrams}g
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="total-nutrition-card">
                    <h3 className="total-nutrition-title">Tổng Dinh Dưỡng Trong Ngày</h3>
                    <div className="total-nutrition-grid">
                        <div className="total-nutrition-item">
                            <span className="total-label">Tổng Calo</span>
                            <span className="total-value calories">{totalNutrition.calories} kcal</span>
                        </div>
                        <div className="total-nutrition-item">
                            <span className="total-label">Tổng Carbs</span>
                            <span className="total-value carbs">{totalNutrition.carbs}g</span>
                        </div>
                        <div className="total-nutrition-item">
                            <span className="total-label">Tổng Protein</span>
                            <span className="total-value protein">{totalNutrition.protein}g</span>
                        </div>
                        <div className="total-nutrition-item">
                            <span className="total-label">Tổng Fat</span>
                            <span className="total-value fat">{totalNutrition.fat}g</span>
                        </div>
                    </div>
                </div>
            </>
        );
    };


    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`my-meals-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <div className="my-meals-header">
                    <h1 className="text-4xl font-bold text-white">Bữa Ăn Của Tôi</h1>
                    <div className="header-controls">
                        <div className="date-navigation">
                            <button
                                className="date-nav-btn"
                                onClick={() => navigateDate(-1)}
                                title="Ngày trước"
                            >
                                <CaretLeft size={20} weight="bold" />
                            </button>
                            <div
                                className="date-picker"
                                onClick={() => {
                                    if (dateInputRef.current) {
                                        dateInputRef.current.showPicker?.();
                                        // Fallback: click directly if showPicker is not supported
                                        if (typeof dateInputRef.current.showPicker !== 'function') {
                                            dateInputRef.current.click();
                                        }
                                    }
                                }}
                            >
                                <Calendar size={20} weight="regular" />
                                <span className="date-display-text">{formatDate(selectedDate)}</span>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                            <button
                                className="date-nav-btn"
                                onClick={() => navigateDate(1)}
                                title="Ngày sau"
                            >
                                <CaretRight size={20} weight="bold" />
                            </button>
                            <button
                                className="date-today-btn"
                                onClick={goToToday}
                                title="Hôm nay"
                            >
                                Hôm nay
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p className="text-white">Đang tải...</p>
                    </div>
                ) : (
                    renderDailyView()
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && mealToDelete && (
                <>
                    <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="confirm-modal">
                        <h3>Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa món ăn "{mealToDelete.meal.name}" khỏi thực đơn?</p>
                        <div className="confirm-modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                                Hủy
                            </button>
                            <button className="btn-confirm" onClick={confirmRemoveMeal}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Duplicate Meal Modal */}
            {showDuplicateModal && mealToDuplicate && (
                <>
                    <div className="modal-overlay" onClick={() => setShowDuplicateModal(false)} />
                    <div className="duplicate-modal">
                        <h3>Thêm món ăn vào ngày khác</h3>
                        <p>Chọn ngày để thêm món "{mealToDuplicate.meal.name}"</p>
                        <input
                            type="date"
                            className="duplicate-date-input"
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                if (e.target.value) {
                                    confirmDuplicateMeal(e.target.value);
                                }
                            }}
                        />
                        <div className="duplicate-modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDuplicateModal(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Meal Detail Modal */}
            {showMealModal && selectedMeal && (
                <>
                    <div
                        className="meal-modal-overlay"
                        onClick={() => setShowMealModal(false)}
                    />

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
                                                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
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

export default MyMeals;
