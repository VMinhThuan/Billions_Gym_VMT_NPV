const mongoose = require('mongoose');

const NutritionPlanSchema = new mongoose.Schema({
    hoiVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HoiVien',
        required: true
    },

    // Loại plan
    planType: {
        type: String,
        enum: ['daily', 'weekly'],
        required: true
    },

    // Thông tin request từ user
    request: {
        goal: { type: String, required: true },
        calories: { type: Number, required: true },
        period: { type: String, enum: ['daily', 'weekly'] },
        preferences: { type: String },
        mealType: { type: String }
    },

    // Các ngày trong plan
    days: [{
        date: { type: Date, required: true },
        meals: [{
            meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
            mealType: { type: String, required: true },
            isFeatured: { type: Boolean, default: false },
            isPopular: { type: Boolean, default: false },
            isRecommended: { type: Boolean, default: false }
        }]
    }],

    // Metadata
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: String, default: 'GEMINI_AI' },

    // Trạng thái
    status: {
        type: String,
        enum: ['ACTIVE', 'ARCHIVED', 'DELETED'],
        default: 'ACTIVE'
    }
}, {
    collection: 'NutritionPlans',
    timestamps: true
});

// Indexes
NutritionPlanSchema.index({ hoiVien: 1, status: 1 });
NutritionPlanSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('NutritionPlan', NutritionPlanSchema);

