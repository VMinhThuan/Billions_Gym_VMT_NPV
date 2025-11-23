const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

async function checkMeals() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const total = await Meal.countDocuments({});
        const withAI = await Meal.countDocuments({ isAIRecommended: true });
        const withoutAI = await Meal.countDocuments({ isAIRecommended: { $ne: true } });
        const noField = await Meal.countDocuments({ isAIRecommended: { $exists: false } });
        const active = await Meal.countDocuments({ status: 'ACTIVE' });
        const inactive = await Meal.countDocuments({ status: { $ne: 'ACTIVE' } });

        console.log('\n📊 Meal Statistics:');
        console.log('Total meals:', total);
        console.log('With isAIRecommended=true:', withAI);
        console.log('With isAIRecommended!=true:', withoutAI);
        console.log('Without isAIRecommended field:', noField);
        console.log('Active meals:', active);
        console.log('Inactive meals:', inactive);

        const sample = await Meal.findOne({});
        if (sample) {
            console.log('\n📝 Sample meal:');
            console.log({
                name: sample.name,
                isAIRecommended: sample.isAIRecommended,
                createdBy: sample.createdBy,
                status: sample.status,
                mealType: sample.mealType
            });
        }

        // Check meals that should be visible (public)
        const publicMeals = await Meal.countDocuments({
            status: 'ACTIVE',
            $or: [
                { isAIRecommended: { $exists: false } },
                { isAIRecommended: false },
                { isAIRecommended: null }
            ]
        });
        console.log('\n🌐 Public meals (should be visible):', publicMeals);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkMeals();

