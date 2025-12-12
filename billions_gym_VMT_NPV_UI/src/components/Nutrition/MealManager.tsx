import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import './MealManager.css';

interface Meal {
    _id?: string;
    name: string;
    description?: string;
    mealType: 'Bữa sáng' | 'Bữa trưa' | 'Bữa tối' | 'Phụ 1' | 'Phụ 2' | 'Phụ 3';
    image?: string;
    difficulty?: 'Dễ' | 'Trung bình' | 'Khó';
    cookingTimeMinutes?: number;
    healthScore?: number;
    rating?: number;
    ratingCount?: number;
    nutrition?: {
        caloriesKcal: number;
        carbsGrams: number;
        proteinGrams: number;
        fatGrams: number;
        fiberGrams?: number;
        sugarGrams?: number;
        sodiumMg?: number;
    };
    ingredients?: Array<{
        name: string;
        amount?: number;
        unit?: string;
        notes?: string;
    }>;
    instructions?: string[];
    cookingVideoUrl?: string;
    tags?: string[];
    cuisineType?: string;
    dietaryRestrictions?: string[];
    allergens?: string[];
    isFeatured?: boolean;
    isPopular?: boolean;
    isRecommended?: boolean;
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

const MealManager: React.FC = () => {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMealType, setFilterMealType] = useState<string>('Tất cả');
    const { showSuccess, showError } = useNotification();

    const mealTypes = ['Tất cả', 'Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Phụ 1', 'Phụ 2', 'Phụ 3'];

    useEffect(() => {
        loadMeals();
    }, [filterMealType, searchQuery]);

    const loadMeals = async () => {
        setLoading(true);
        try {
            const query: any = {};
            if (filterMealType !== 'Tất cả') {
                query.mealType = filterMealType;
            }
            if (searchQuery) {
                query.search = searchQuery;
            }
            query.limit = 100;

            const result = await api.nutrition.getAllMeals(query);
            if (result.success) {
                setMeals(result.data || []);
            }
        } catch (error: any) {
            showError('Không thể tải danh sách món ăn: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedMeal({
            name: '',
            mealType: 'Bữa sáng',
            nutrition: {
                caloriesKcal: 0,
                carbsGrams: 0,
                proteinGrams: 0,
                fatGrams: 0
            },
            ingredients: [],
            instructions: [],
            status: 'ACTIVE'
        });
        setShowForm(true);
    };

    const handleEdit = (meal: Meal) => {
        setSelectedMeal({ ...meal });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;

        try {
            const result = await api.nutrition.deleteMeal(id);
            if (result.success) {
                showSuccess('Đã xóa món ăn thành công');
                loadMeals();
            }
        } catch (error: any) {
            showError('Không thể xóa món ăn: ' + error.message);
        }
    };

    const handleSave = async (meal: Meal) => {
        try {
            if (meal._id) {
                const result = await api.nutrition.updateMeal(meal._id, meal);
                if (result.success) {
                    showSuccess('Đã cập nhật món ăn thành công');
                    setShowForm(false);
                    loadMeals();
                }
            } else {
                const result = await api.nutrition.createMeal(meal);
                if (result.success) {
                    showSuccess('Đã tạo món ăn thành công');
                    setShowForm(false);
                    loadMeals();
                }
            }
        } catch (error: any) {
            showError('Không thể lưu món ăn: ' + error.message);
        }
    };

    if (loading) {
        return <div className="loading-container">Đang tải...</div>;
    }

    return (
        <div className="meal-manager">
            <div className="meal-manager-header">
                <h2>Quản Lý Món Ăn</h2>
                <button className="btn-primary" onClick={handleCreate}>
                    + Thêm Món Ăn
                </button>
            </div>

            <div className="meal-manager-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm món ăn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    {mealTypes.map(type => (
                        <button
                            key={type}
                            className={`filter-tab ${filterMealType === type ? 'active' : ''}`}
                            onClick={() => setFilterMealType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="meal-grid">
                {meals.map(meal => (
                    <div key={meal._id} className="meal-card">
                        <div className="meal-card-header">
                            <h3>{meal.name}</h3>
                            <div className="meal-actions">
                                <button onClick={() => handleEdit(meal)} className="btn-edit">Sửa</button>
                                <button onClick={() => meal._id && handleDelete(meal._id)} className="btn-delete">Xóa</button>
                            </div>
                        </div>
                        <div className="meal-card-body">
                            <div className="meal-badge">{meal.mealType}</div>
                            {meal.description && <p className="meal-description">{meal.description}</p>}
                            {meal.nutrition && (
                                <div className="meal-nutrition">
                                    <div className="nutrition-item">
                                        <span>Calo:</span>
                                        <strong>{meal.nutrition.caloriesKcal} kcal</strong>
                                    </div>
                                    <div className="nutrition-item">
                                        <span>Carbs:</span>
                                        <strong>{meal.nutrition.carbsGrams}g</strong>
                                    </div>
                                    <div className="nutrition-item">
                                        <span>Protein:</span>
                                        <strong>{meal.nutrition.proteinGrams}g</strong>
                                    </div>
                                    <div className="nutrition-item">
                                        <span>Fat:</span>
                                        <strong>{meal.nutrition.fatGrams}g</strong>
                                    </div>
                                </div>
                            )}
                            {meal.difficulty && (
                                <div className="meal-meta">
                                    <span>Độ khó: {meal.difficulty}</span>
                                    {meal.cookingTimeMinutes && <span>Thời gian: {meal.cookingTimeMinutes} phút</span>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showForm && selectedMeal && (
                <MealForm
                    meal={selectedMeal}
                    onSave={handleSave}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

interface MealFormProps {
    meal: Meal;
    onSave: (meal: Meal) => void;
    onCancel: () => void;
}

const MealForm: React.FC<MealFormProps> = ({ meal, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Meal>(meal);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const updateNutrition = (field: string, value: number) => {
        setFormData({
            ...formData,
            nutrition: {
                ...formData.nutrition!,
                [field]: value
            }
        });
    };

    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...(formData.ingredients || []), { name: '' }]
        });
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        const ingredients = [...(formData.ingredients || [])];
        ingredients[index] = { ...ingredients[index], [field]: value };
        setFormData({ ...formData, ingredients });
    };

    const removeIngredient = (index: number) => {
        const ingredients = formData.ingredients?.filter((_, i) => i !== index) || [];
        setFormData({ ...formData, ingredients });
    };

    const addInstruction = () => {
        setFormData({
            ...formData,
            instructions: [...(formData.instructions || []), '']
        });
    };

    const updateInstruction = (index: number, value: string) => {
        const instructions = [...(formData.instructions || [])];
        instructions[index] = value;
        setFormData({ ...formData, instructions });
    };

    const removeInstruction = (index: number) => {
        const instructions = formData.instructions?.filter((_, i) => i !== index) || [];
        setFormData({ ...formData, instructions });
    };

    return (
        <div className="meal-form-overlay">
            <div className="meal-form-modal">
                <div className="meal-form-header">
                    <h3>{meal._id ? 'Sửa Món Ăn' : 'Thêm Món Ăn'}</h3>
                    <button onClick={onCancel} className="btn-close">×</button>
                </div>
                <form onSubmit={handleSubmit} className="meal-form">
                    <div className="form-group">
                        <label>Tên món ăn *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Loại món ăn *</label>
                        <select
                            value={formData.mealType}
                            onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
                            required
                        >
                            <option value="Bữa sáng">Bữa sáng</option>
                            <option value="Bữa trưa">Bữa trưa</option>
                            <option value="Bữa tối">Bữa tối</option>
                            <option value="Phụ 1">Phụ 1</option>
                            <option value="Phụ 2">Phụ 2</option>
                            <option value="Phụ 3">Phụ 3</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Calories (kcal) *</label>
                            <input
                                type="number"
                                value={formData.nutrition?.caloriesKcal || 0}
                                onChange={(e) => updateNutrition('caloriesKcal', parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Carbs (g) *</label>
                            <input
                                type="number"
                                value={formData.nutrition?.carbsGrams || 0}
                                onChange={(e) => updateNutrition('carbsGrams', parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Protein (g) *</label>
                            <input
                                type="number"
                                value={formData.nutrition?.proteinGrams || 0}
                                onChange={(e) => updateNutrition('proteinGrams', parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Fat (g) *</label>
                            <input
                                type="number"
                                value={formData.nutrition?.fatGrams || 0}
                                onChange={(e) => updateNutrition('fatGrams', parseInt(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nguyên liệu</label>
                        {formData.ingredients?.map((ing, index) => (
                            <div key={index} className="ingredient-row">
                                <input
                                    type="text"
                                    placeholder="Tên nguyên liệu"
                                    value={ing.name}
                                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Số lượng"
                                    value={ing.amount || ''}
                                    onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value))}
                                />
                                <input
                                    type="text"
                                    placeholder="Đơn vị"
                                    value={ing.unit || ''}
                                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                />
                                <button type="button" onClick={() => removeIngredient(index)}>Xóa</button>
                            </div>
                        ))}
                        <button type="button" onClick={addIngredient} className="btn-add">+ Thêm nguyên liệu</button>
                    </div>

                    <div className="form-group">
                        <label>Hướng dẫn nấu</label>
                        {formData.instructions?.map((inst, index) => (
                            <div key={index} className="instruction-row">
                                <span className="step-number">{index + 1}</span>
                                <textarea
                                    value={inst}
                                    onChange={(e) => updateInstruction(index, e.target.value)}
                                    rows={2}
                                />
                                <button type="button" onClick={() => removeInstruction(index)}>Xóa</button>
                            </div>
                        ))}
                        <button type="button" onClick={addInstruction} className="btn-add">+ Thêm bước</button>
                    </div>

                    <div className="form-group">
                        <label>Link video hướng dẫn</label>
                        <input
                            type="url"
                            value={formData.cookingVideoUrl || ''}
                            onChange={(e) => setFormData({ ...formData, cookingVideoUrl: e.target.value })}
                            placeholder="https://youtube.com/..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Link hình ảnh</label>
                        <input
                            type="url"
                            value={formData.image || ''}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="btn-cancel">Hủy</button>
                        <button type="submit" className="btn-save">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MealManager;

