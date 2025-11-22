const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

const mealsData = [
    // Featured meal
    {
        name: 'Gà Tây Nướng Với Măng Tây Hấp Và Gạo Lứt',
        description: 'Món ăn giàu protein với gà tây nướng thơm ngon, măng tây hấp và gạo lứt bổ dưỡng',
        mealType: 'Bữa trưa',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        goals: ['TANG_CO', 'DUY_TRI'],
        difficulty: 'Trung bình',
        cookingTimeMinutes: 10,
        stepCount: 4,
        rating: 4.8,
        ratingCount: 125,
        healthScore: 85,
        nutrition: {
            caloriesKcal: 450,
            carbsGrams: 40,
            proteinGrams: 35,
            fatGrams: 12,
            fiberGrams: 4,
            sugarGrams: 2,
            sodiumMg: 350
        },
        tags: ['high-protein', 'low-fat', 'balanced'],
        cuisineType: 'Vietnamese',
        dietaryRestrictions: [],
        allergens: [],
        isFeatured: true,
        isPopular: true,
        isRecommended: true,
        ingredients: [
            { name: 'Gà tây', amount: 150, unit: 'g' },
            { name: 'Măng tây', amount: 100, unit: 'g' },
            { name: 'Gạo lứt', amount: 80, unit: 'g' }
        ],
        instructions: [
            'Nướng gà tây với gia vị trong 15 phút ở nhiệt độ 180°C',
            'Hấp măng tây trong 5 phút cho đến khi mềm',
            'Nấu gạo lứt với nước theo tỷ lệ 1:2 trong 30 phút',
            'Trình bày gà tây, măng tây và gạo lứt trên đĩa, thưởng thức khi còn nóng'
        ],
        cookingVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'ACTIVE'
    },
    // All meals
    {
        name: 'Tacos Tôm Nướng Với Xoài Salsa',
        description: 'Tacos tôm nướng với xoài salsa tươi mát',
        mealType: 'Ăn nhẹ',
        image: 'https://images.unsplash.com/photo-1565299585323-38174c2e6e0e?w=800',
        goals: ['GIAM_CAN', 'DUY_TRI'],
        difficulty: 'Trung bình',
        cookingTimeMinutes: 15,
        stepCount: 5,
        rating: 4.6,
        ratingCount: 89,
        healthScore: 80,
        nutrition: {
            caloriesKcal: 400,
            carbsGrams: 45,
            proteinGrams: 28,
            fatGrams: 12,
            fiberGrams: 3,
            sugarGrams: 8,
            sodiumMg: 420
        },
        tags: ['low-calorie', 'high-protein', 'fresh'],
        cuisineType: 'Mexican',
        dietaryRestrictions: [],
        allergens: ['shellfish'],
        isPopular: true,
        ingredients: [
            { name: 'Tôm', amount: 120, unit: 'g', notes: 'Tôm tươi, bóc vỏ' },
            { name: 'Xoài', amount: 100, unit: 'g', notes: 'Xoài chín, cắt hạt lựu' },
            { name: 'Bánh taco', amount: 2, unit: 'cái' },
            { name: 'Rau thơm', amount: 20, unit: 'g', notes: 'Ngò, hành lá' }
        ],
        instructions: [
            'Nướng tôm trên chảo nóng với dầu oliu trong 3-4 phút mỗi mặt',
            'Làm salsa xoài: cắt xoài hạt lựu, trộn với hành tím, ớt, nước cốt chanh',
            'Hâm nóng bánh taco trong lò vi sóng 30 giây',
            'Cho tôm nướng và salsa xoài vào bánh taco',
            'Trang trí với rau thơm và thưởng thức ngay'
        ],
        cookingVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'ACTIVE'
    },
    {
        name: 'Gà Nướng Với Quinoa Và Cải Xoăn',
        description: 'Gà nướng thơm lừng với quinoa và cải xoăn giàu dinh dưỡng',
        mealType: 'Bữa tối',
        goals: ['TANG_CO', 'TANG_CAN_BAP'],
        difficulty: 'Trung bình',
        cookingTimeMinutes: 20,
        stepCount: 6,
        rating: 4.7,
        ratingCount: 102,
        healthScore: 90,
        nutrition: {
            caloriesKcal: 480,
            carbsGrams: 50,
            proteinGrams: 40,
            fatGrams: 15,
            fiberGrams: 5,
            sugarGrams: 3,
            sodiumMg: 380
        },
        tags: ['high-protein', 'superfood', 'balanced'],
        cuisineType: 'Western',
        dietaryRestrictions: [],
        allergens: [],
        isRecommended: true,
        ingredients: [
            { name: 'Ức gà', amount: 150, unit: 'g' },
            { name: 'Quinoa', amount: 100, unit: 'g' },
            { name: 'Cải xoăn', amount: 80, unit: 'g' }
        ],
        instructions: [
            'Ướp gà với gia vị',
            'Nướng gà',
            'Nấu quinoa',
            'Xào cải xoăn',
            'Trình bày',
            'Thưởng thức'
        ],
        status: 'ACTIVE'
    },
    // Popular meals
    {
        name: 'Salad Hy Lạp Với Phô Mai Feta Và Ô Liu',
        description: 'Salad tươi ngon kiểu Hy Lạp với phô mai feta và ô liu',
        mealType: 'Bữa trưa',
        goals: ['GIAM_CAN', 'DUY_TRI'],
        difficulty: 'Dễ',
        cookingTimeMinutes: 10,
        stepCount: 3,
        rating: 4.9,
        ratingCount: 156,
        healthScore: 88,
        nutrition: {
            caloriesKcal: 320,
            carbsGrams: 25,
            proteinGrams: 15,
            fatGrams: 20,
            fiberGrams: 6,
            sugarGrams: 5,
            sodiumMg: 450
        },
        tags: ['low-calorie', 'fresh', 'vegetarian'],
        cuisineType: 'Mediterranean',
        dietaryRestrictions: ['vegetarian'],
        allergens: ['dairy'],
        isPopular: true,
        isRecommended: true,
        ingredients: [
            { name: 'Rau xanh', amount: 150, unit: 'g' },
            { name: 'Phô mai feta', amount: 50, unit: 'g' },
            { name: 'Ô liu', amount: 30, unit: 'g' }
        ],
        instructions: [
            'Rửa và cắt rau',
            'Thêm phô mai và ô liu',
            'Trộn đều và thưởng thức'
        ],
        status: 'ACTIVE'
    },
    {
        name: 'Sinh Tố Protein Việt Quất',
        description: 'Sinh tố protein việt quất bổ dưỡng cho bữa sáng',
        mealType: 'Bữa sáng',
        goals: ['TANG_CO', 'TANG_CAN'],
        difficulty: 'Dễ',
        cookingTimeMinutes: 5,
        stepCount: 2,
        rating: 4.8,
        ratingCount: 134,
        healthScore: 82,
        nutrition: {
            caloriesKcal: 280,
            carbsGrams: 35,
            proteinGrams: 25,
            fatGrams: 8,
            fiberGrams: 4,
            sugarGrams: 20,
            sodiumMg: 50
        },
        tags: ['high-protein', 'quick', 'breakfast'],
        cuisineType: 'Western',
        dietaryRestrictions: [],
        allergens: ['dairy'],
        isPopular: true,
        ingredients: [
            { name: 'Việt quất', amount: 100, unit: 'g' },
            { name: 'Whey protein', amount: 30, unit: 'g' },
            { name: 'Sữa', amount: 200, unit: 'ml' }
        ],
        instructions: [
            'Cho tất cả vào máy xay',
            'Xay nhuyễn và thưởng thức'
        ],
        status: 'ACTIVE'
    },
    {
        name: 'Cá Hồi Nướng Với Chanh Và Măng Tây',
        description: 'Cá hồi nướng thơm ngon với chanh và măng tây',
        mealType: 'Bữa tối',
        goals: ['TANG_CO', 'DUY_TRI', 'GIAM_MO'],
        difficulty: 'Trung bình',
        cookingTimeMinutes: 15,
        stepCount: 4,
        rating: 4.9,
        ratingCount: 178,
        healthScore: 92,
        nutrition: {
            caloriesKcal: 420,
            carbsGrams: 20,
            proteinGrams: 38,
            fatGrams: 22,
            fiberGrams: 3,
            sugarGrams: 2,
            sodiumMg: 320
        },
        tags: ['high-protein', 'omega-3', 'low-carb'],
        cuisineType: 'Western',
        dietaryRestrictions: [],
        allergens: ['fish'],
        isPopular: true,
        isRecommended: true,
        ingredients: [
            { name: 'Cá hồi', amount: 150, unit: 'g' },
            { name: 'Chanh', amount: 1, unit: 'quả' },
            { name: 'Măng tây', amount: 100, unit: 'g' }
        ],
        instructions: [
            'Nướng cá hồi',
            'Vắt chanh lên cá',
            'Hấp măng tây',
            'Trình bày'
        ],
        status: 'ACTIVE'
    },
    // Recommended meals
    {
        name: 'Yến Mạch Với Bơ Hạnh Nhân Và Quả Mọng',
        description: 'Yến mạch bổ dưỡng với bơ hạnh nhân và quả mọng',
        mealType: 'Bữa sáng',
        goals: ['DUY_TRI', 'GIAM_CAN'],
        difficulty: 'Dễ',
        cookingTimeMinutes: 8,
        stepCount: 3,
        rating: 4.7,
        ratingCount: 98,
        healthScore: 85,
        nutrition: {
            caloriesKcal: 350,
            carbsGrams: 45,
            proteinGrams: 12,
            fatGrams: 14,
            fiberGrams: 7,
            sugarGrams: 12,
            sodiumMg: 80
        },
        tags: ['high-fiber', 'healthy-fats', 'breakfast'],
        cuisineType: 'Western',
        dietaryRestrictions: ['vegetarian'],
        allergens: ['nuts'],
        isRecommended: true,
        ingredients: [
            { name: 'Yến mạch', amount: 50, unit: 'g' },
            { name: 'Bơ hạnh nhân', amount: 20, unit: 'g' },
            { name: 'Quả mọng', amount: 80, unit: 'g' }
        ],
        instructions: [
            'Nấu yến mạch',
            'Thêm bơ hạnh nhân',
            'Rắc quả mọng lên'
        ],
        status: 'ACTIVE'
    },
    {
        name: 'Bánh Cuốn Gà Với Bơ Và Rau Bina',
        description: 'Bánh cuốn gà với bơ và rau bina tươi ngon',
        mealType: 'Bữa trưa',
        goals: ['TANG_CO', 'DUY_TRI'],
        difficulty: 'Trung bình',
        cookingTimeMinutes: 12,
        stepCount: 5,
        rating: 4.6,
        ratingCount: 87,
        healthScore: 83,
        nutrition: {
            caloriesKcal: 450,
            carbsGrams: 40,
            proteinGrams: 30,
            fatGrams: 18,
            fiberGrams: 5,
            sugarGrams: 3,
            sodiumMg: 400
        },
        tags: ['high-protein', 'balanced'],
        cuisineType: 'Vietnamese',
        dietaryRestrictions: [],
        allergens: [],
        isRecommended: true,
        ingredients: [
            { name: 'Bánh cuốn', amount: 3, unit: 'lá' },
            { name: 'Thịt gà', amount: 100, unit: 'g' },
            { name: 'Bơ', amount: 50, unit: 'g' },
            { name: 'Rau bina', amount: 60, unit: 'g' }
        ],
        instructions: [
            'Chuẩn bị bánh cuốn',
            'Xào thịt gà',
            'Cắt bơ và rau bina',
            'Cuốn bánh',
            'Trình bày'
        ],
        status: 'ACTIVE'
    },
    {
        name: 'Salad Quinoa Với Rau Củ Nướng Và Phô Mai Feta',
        description: 'Salad quinoa với rau củ nướng và phô mai feta',
        mealType: 'Bữa tối',
        goals: ['GIAM_CAN', 'DUY_TRI'],
        difficulty: 'Trung bình',
        cookingTimeMinutes: 25,
        stepCount: 6,
        rating: 4.5,
        ratingCount: 76,
        healthScore: 80,
        nutrition: {
            caloriesKcal: 400,
            carbsGrams: 50,
            proteinGrams: 15,
            fatGrams: 12,
            fiberGrams: 8,
            sugarGrams: 6,
            sodiumMg: 380
        },
        tags: ['vegetarian', 'high-fiber', 'superfood'],
        cuisineType: 'Mediterranean',
        dietaryRestrictions: ['vegetarian'],
        allergens: ['dairy'],
        isRecommended: true,
        ingredients: [
            { name: 'Quinoa', amount: 100, unit: 'g' },
            { name: 'Rau củ', amount: 200, unit: 'g' },
            { name: 'Phô mai feta', amount: 40, unit: 'g' }
        ],
        instructions: [
            'Nấu quinoa',
            'Nướng rau củ',
            'Cắt phô mai',
            'Trộn quinoa và rau củ',
            'Thêm phô mai',
            'Trình bày'
        ],
        status: 'ACTIVE'
    }
];

async function seedMeals() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing meals (optional - comment out if you want to keep existing data)
        // await Meal.deleteMany({});
        // console.log('✅ Cleared existing meals');

        // Insert meals
        const insertedMeals = await Meal.insertMany(mealsData);
        console.log(`✅ Inserted ${insertedMeals.length} meals`);

        // Display summary
        console.log('\n📊 Summary:');
        const byType = {};
        const byGoal = {};
        insertedMeals.forEach(meal => {
            byType[meal.mealType] = (byType[meal.mealType] || 0) + 1;
            meal.goals.forEach(goal => {
                byGoal[goal] = (byGoal[goal] || 0) + 1;
            });
        });

        console.log('\nBy Meal Type:');
        Object.entries(byType).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        console.log('\nBy Goals:');
        Object.entries(byGoal).forEach(([goal, count]) => {
            console.log(`  ${goal}: ${count}`);
        });

        console.log('\n✅ Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding meals:', error);
        process.exit(1);
    }
}

// Run seed
seedMeals();

