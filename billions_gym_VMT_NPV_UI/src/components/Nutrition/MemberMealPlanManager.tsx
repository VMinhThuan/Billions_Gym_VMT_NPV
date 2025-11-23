import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCrudNotifications } from '../../hooks/useNotification';
import './MemberMealPlanManager.css';

interface Member {
    _id: string;
    hoTen: string;
    email?: string;
    sdt?: string;
}

interface Meal {
    _id: string;
    name: string;
    mealType: string;
    nutrition?: {
        caloriesKcal: number;
        carbsGrams: number;
        proteinGrams: number;
        fatGrams: number;
    };
}

interface MealPlanItem {
    meal: Meal;
    source: 'USER_SELECTED' | 'AI_GENERATED';
    addedAt: Date;
}

interface MealPlan {
    _id?: string;
    hoiVien: string;
    date: string;
    meals: {
        buaSang: MealPlanItem[];
        phu1: MealPlanItem[];
        buaTrua: MealPlanItem[];
        phu2: MealPlanItem[];
        buaToi: MealPlanItem[];
        phu3: MealPlanItem[];
    };
    totalNutrition: {
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
    };
}

const MemberMealPlanManager: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddMealModal, setShowAddMealModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<string>('buaSang');
    const { showSuccess, showError } = useCrudNotifications();

    const mealTypes = [
        { key: 'buaSang', label: 'Bữa sáng' },
        { key: 'phu1', label: 'Phụ 1' },
        { key: 'buaTrua', label: 'Bữa trưa' },
        { key: 'phu2', label: 'Phụ 2' },
        { key: 'buaToi', label: 'Bữa tối' },
        { key: 'phu3', label: 'Phụ 3' }
    ];

    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        if (selectedMember) {
            loadMealPlan();
        }
    }, [selectedMember, selectedDate]);

    useEffect(() => {
        loadAvailableMeals();
    }, []);

    const loadMembers = async () => {
        try {
            const result = await api.get<any>('/api/user/hoivien');
            console.log('Members API response:', result);

            // Handle both response formats: direct array or { success, data }
            let membersList: Member[] = [];

            if (Array.isArray(result)) {
                membersList = result;
            } else if (result && result.success && Array.isArray(result.data)) {
                membersList = result.data;
            } else if (result && Array.isArray(result.data)) {
                membersList = result.data;
            } else if (result && result.data && Array.isArray(result.data)) {
                membersList = result.data;
            } else {
                console.warn('Unexpected API response format:', result);
                membersList = [];
            }

            console.log('Loaded members:', membersList.length, membersList);
            setMembers(membersList);
        } catch (error: any) {
            console.error('Error loading members:', error);
            showError('Không thể tải danh sách hội viên: ' + (error.message || 'Lỗi không xác định'));
            setMembers([]);
        }
    };

    const loadMealPlan = async () => {
        if (!selectedMember) return;
        setLoading(true);
        try {
            const result = await api.nutrition.getMemberMealPlan(selectedMember, selectedDate);
            if (result.success) {
                setMealPlan(result.data);
            } else {
                setMealPlan(null);
            }
        } catch (error: any) {
            setMealPlan(null);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableMeals = async () => {
        try {
            const result = await api.nutrition.getAllMeals({ limit: 200 });
            if (result.success) {
                setAvailableMeals(result.data || []);
            }
        } catch (error: any) {
            console.error('Error loading meals:', error);
        }
    };

    const handleAddMeal = async (mealId: string) => {
        if (!selectedMember) {
            showError('Vui lòng chọn hội viên');
            return;
        }

        const mealTypeMap: Record<string, string> = {
            'buaSang': 'Bữa sáng',
            'phu1': 'Phụ 1',
            'buaTrua': 'Bữa trưa',
            'phu2': 'Phụ 2',
            'buaToi': 'Bữa tối',
            'phu3': 'Phụ 3'
        };

        try {
            const result = await api.nutrition.addMealToMemberPlan(
                selectedMember,
                mealId,
                mealTypeMap[selectedMealType],
                selectedDate
            );
            if (result.success) {
                showSuccess('Đã thêm món ăn vào thực đơn');
                setShowAddMealModal(false);
                loadMealPlan();
            }
        } catch (error: any) {
            showError('Không thể thêm món ăn: ' + error.message);
        }
    };

    const handleRemoveMeal = async (mealType: string, mealIndex: number) => {
        if (!selectedMember) return;

        if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;

        try {
            const result = await api.nutrition.removeMealFromMemberPlan(
                selectedMember,
                selectedDate,
                mealType,
                mealIndex
            );
            if (result.success) {
                showSuccess('Đã xóa món ăn khỏi thực đơn');
                loadMealPlan();
            }
        } catch (error: any) {
            showError('Không thể xóa món ăn: ' + error.message);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const navigateDate = (direction: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + direction);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    return (
        <div className="member-meal-plan-manager">
            <div className="manager-header">
                <h2>Quản Lý Thực Đơn Hội Viên</h2>
            </div>

            <div className="manager-controls">
                <div className="control-group">
                    <label>Chọn hội viên:</label>
                    <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        style={{
                            appearance: 'auto',
                            WebkitAppearance: 'menulist',
                            MozAppearance: 'menulist'
                        }}
                    >
                        <option value="">-- Chọn hội viên --</option>
                        {members.length > 0 ? (
                            members.map(member => (
                                <option key={member._id} value={member._id}>
                                    {member.hoTen} {member.email && `(${member.email})`} {member.sdt && `- ${member.sdt}`}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Đang tải danh sách hội viên...</option>
                        )}
                    </select>
                </div>

                <div className="control-group date-controls">
                    <button onClick={() => navigateDate(-1)} className="btn-nav">←</button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                    <button onClick={() => navigateDate(1)} className="btn-nav">→</button>
                    <button
                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                        className="btn-today"
                    >
                        Hôm nay
                    </button>
                </div>
            </div>

            {selectedMember && (
                <>
                    <div className="date-display">
                        <h3>{formatDate(selectedDate)}</h3>
                    </div>

                    {loading ? (
                        <div className="loading-container">Đang tải...</div>
                    ) : (
                        <div className="meal-plan-container">
                            {mealTypes.map(mealType => {
                                const meals = mealPlan?.meals[mealType.key as keyof typeof mealPlan.meals] || [];
                                return (
                                    <div key={mealType.key} className="meal-section">
                                        <div className="meal-section-header">
                                            <h4>{mealType.label}</h4>
                                            <button
                                                onClick={() => {
                                                    setSelectedMealType(mealType.key);
                                                    setShowAddMealModal(true);
                                                }}
                                                className="btn-add-meal"
                                            >
                                                + Thêm món
                                            </button>
                                        </div>
                                        <div className="meals-list">
                                            {meals.length === 0 ? (
                                                <div className="empty-meal">Chưa có món ăn</div>
                                            ) : (
                                                meals.map((mealItem, index) => (
                                                    <div key={index} className="meal-item">
                                                        <div className="meal-info">
                                                            <span className="meal-name">{mealItem.meal.name}</span>
                                                            {mealItem.meal.nutrition && (
                                                                <span className="meal-calories">
                                                                    {mealItem.meal.nutrition.caloriesKcal} kcal
                                                                </span>
                                                            )}
                                                            <span className={`meal-source ${mealItem.source === 'AI_GENERATED' ? 'ai' : 'user'}`}>
                                                                {mealItem.source === 'AI_GENERATED' ? 'AI' : 'Thủ công'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveMeal(mealType.key, index)}
                                                            className="btn-remove"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {mealPlan && (
                                <div className="total-nutrition">
                                    <h4>Tổng Dinh Dưỡng</h4>
                                    <div className="nutrition-summary">
                                        <div className="nutrition-item">
                                            <span>Calories:</span>
                                            <strong>{mealPlan.totalNutrition.calories} kcal</strong>
                                        </div>
                                        <div className="nutrition-item">
                                            <span>Carbs:</span>
                                            <strong>{mealPlan.totalNutrition.carbs}g</strong>
                                        </div>
                                        <div className="nutrition-item">
                                            <span>Protein:</span>
                                            <strong>{mealPlan.totalNutrition.protein}g</strong>
                                        </div>
                                        <div className="nutrition-item">
                                            <span>Fat:</span>
                                            <strong>{mealPlan.totalNutrition.fat}g</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {showAddMealModal && (
                <div className="modal-overlay" onClick={() => setShowAddMealModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Thêm Món Ăn - {mealTypes.find(m => m.key === selectedMealType)?.label}</h3>
                            <button onClick={() => setShowAddMealModal(false)} className="btn-close">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="meals-grid">
                                {availableMeals
                                    .filter(meal => {
                                        const mealTypeMap: Record<string, string> = {
                                            'buaSang': 'Bữa sáng',
                                            'phu1': 'Phụ 1',
                                            'buaTrua': 'Bữa trưa',
                                            'phu2': 'Phụ 2',
                                            'buaToi': 'Bữa tối',
                                            'phu3': 'Phụ 3'
                                        };
                                        return meal.mealType === mealTypeMap[selectedMealType];
                                    })
                                    .map(meal => (
                                        <div key={meal._id} className="available-meal-card">
                                            <h4>{meal.name}</h4>
                                            {meal.nutrition && (
                                                <div className="meal-nutrition-mini">
                                                    <span>{meal.nutrition.caloriesKcal} kcal</span>
                                                    <span>{meal.nutrition.proteinGrams}g protein</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleAddMeal(meal._id)}
                                                className="btn-select-meal"
                                            >
                                                Chọn
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberMealPlanManager;

