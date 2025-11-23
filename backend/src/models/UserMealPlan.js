const mongoose = require('mongoose');

const UserMealPlanSchema = new mongoose.Schema({
    hoiVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HoiVien',
        required: true
    },

    // Ngày của meal plan
    date: {
        type: Date,
        required: true,
        default: Date.now
    },

    // Các bữa ăn trong ngày
    meals: {
        buaSang: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            source: {
                type: String,
                enum: ['USER_SELECTED', 'AI_GENERATED'],
                required: true
            },
            addedAt: { type: Date, default: Date.now },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' } // Nếu từ AI plan
        }],
        phu1: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            source: {
                type: String,
                enum: ['USER_SELECTED', 'AI_GENERATED'],
                required: true
            },
            addedAt: { type: Date, default: Date.now },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' }
        }],
        buaTrua: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            source: {
                type: String,
                enum: ['USER_SELECTED', 'AI_GENERATED'],
                required: true
            },
            addedAt: { type: Date, default: Date.now },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' }
        }],
        phu2: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            source: {
                type: String,
                enum: ['USER_SELECTED', 'AI_GENERATED'],
                required: true
            },
            addedAt: { type: Date, default: Date.now },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' }
        }],
        buaToi: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            source: {
                type: String,
                enum: ['USER_SELECTED', 'AI_GENERATED'],
                required: true
            },
            addedAt: { type: Date, default: Date.now },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' }
        }],
        phu3: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            source: {
                type: String,
                enum: ['USER_SELECTED', 'AI_GENERATED'],
                required: true
            },
            addedAt: { type: Date, default: Date.now },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'NutritionPlan' }
        }]
    },

    // Tổng dinh dưỡng trong ngày
    totalNutrition: {
        calories: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        fat: { type: Number, default: 0 }
    },

    // Ghi chú
    notes: { type: String },

    // Trạng thái
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE'
    }
}, {
    collection: 'UserMealPlans',
    timestamps: true
});

// Indexes
UserMealPlanSchema.index({ hoiVien: 1, date: 1 }, { unique: true });
UserMealPlanSchema.index({ date: 1 });

module.exports = mongoose.model('UserMealPlan', UserMealPlanSchema);

