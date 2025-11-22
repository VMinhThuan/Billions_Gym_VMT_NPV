const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
    // Thông tin cơ bản
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String, default: '/placeholder-menu.jpg' },

    // Phân loại
    mealType: {
        type: String,
        enum: ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Ăn nhẹ', 'Phụ 1', 'Phụ 2', 'Phụ 3'],
        required: true
    },

    // Mục tiêu dinh dưỡng
    goals: [{
        type: String,
        enum: ['GIAM_CAN', 'TANG_CAN', 'TANG_CO', 'DUY_TRI', 'GIAM_MO', 'TANG_CAN_BAP']
    }],

    // Độ khó và thời gian
    difficulty: {
        type: String,
        enum: ['Dễ', 'Trung bình', 'Khó'],
        default: 'Trung bình'
    },
    cookingTimeMinutes: { type: Number, default: 15 },
    stepCount: { type: Number, default: 4 },

    // Đánh giá
    rating: { type: Number, min: 0, max: 5, default: 4.8 },
    ratingCount: { type: Number, default: 125 },

    // Điểm sức khỏe
    healthScore: { type: Number, min: 0, max: 100, default: 85 },

    // Thông tin dinh dưỡng
    nutrition: {
        caloriesKcal: { type: Number, required: true },
        carbsGrams: { type: Number, required: true },
        proteinGrams: { type: Number, required: true },
        fatGrams: { type: Number, required: true },
        fiberGrams: { type: Number, default: 0 },
        sugarGrams: { type: Number, default: 0 },
        sodiumMg: { type: Number, default: 0 }
    },

    // Tags và phân loại
    tags: [{ type: String }], // VD: ['low-fat', 'high-protein', 'keto', 'vegan']
    cuisineType: { type: String, default: 'Vietnamese' }, // Vietnamese, Western, Mediterranean, etc.
    dietaryRestrictions: [{
        type: String,
        enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'halal']
    }],
    allergens: [{ type: String }], // VD: ['nuts', 'dairy', 'shellfish', 'eggs']

    // Flags
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    isAIRecommended: { type: Boolean, default: false },

    // Công thức
    ingredients: [{
        name: { type: String, required: true },
        amount: { type: Number },
        unit: { type: String },
        notes: { type: String }
    }],
    instructions: [{ type: String }], // Các bước nấu
    cookingVideoUrl: { type: String }, // Link YouTube hướng dẫn nấu

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Trạng thái
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
        default: 'ACTIVE'
    }
}, {
    collection: 'Meals',
    timestamps: true
});

// Indexes
MealSchema.index({ mealType: 1, status: 1 });
MealSchema.index({ goals: 1 });
MealSchema.index({ isFeatured: 1, isPopular: 1, isRecommended: 1 });
MealSchema.index({ 'nutrition.caloriesKcal': 1 });
MealSchema.index({ isAIRecommended: 1, createdBy: 1 }); // Index for filtering AI-generated meals by user
MealSchema.index({ createdBy: 1, status: 1 }); // Index for user's meals

module.exports = mongoose.model('Meal', MealSchema);

