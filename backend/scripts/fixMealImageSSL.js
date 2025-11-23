const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Map các món ăn có link ảnh lỗi SSL với link mới an toàn
const mealImageFixMap = {
    // Một nắm óc chó - thay link saigonnhonews.com bằng Pexels
    'Một nắm óc chó': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800',

    // Các link HTTP cần chuyển sang HTTPS hoặc thay thế
    'Ức Gà Nướng Mật Ong & Khoai Lang Nghiền': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',

    'Cá hồi áp chảo với cơm gạo lứt và bơ': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',

    // Các link có thể có vấn đề khác - thay bằng Pexels hoặc Unsplash
    'Táo và một nắm hạt điều': 'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800',

    'Cà phê đen không đường': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',

    'Súp bí đỏ kem với bánh mì đen': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',

    'Thanh protein bar': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800'
};

async function fixMealImageSSL() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        let successCount = 0;
        let notFoundCount = 0;
        const notFoundMeals = [];

        // Update each meal
        for (const [mealName, imageUrl] of Object.entries(mealImageFixMap)) {
            try {
                const result = await Meal.findOneAndUpdate(
                    { name: mealName },
                    { $set: { image: imageUrl } },
                    { new: true }
                );

                if (result) {
                    console.log(`✅ Fixed: "${mealName}"`);
                    console.log(`   New URL: ${imageUrl}`);
                    successCount++;
                } else {
                    console.log(`⚠️  Not found: "${mealName}"`);
                    notFoundCount++;
                    notFoundMeals.push(mealName);
                }
            } catch (error) {
                console.error(`❌ Error updating "${mealName}":`, error.message);
                notFoundCount++;
                notFoundMeals.push(mealName);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 Summary:');
        console.log('='.repeat(80));
        console.log(`✅ Successfully fixed: ${successCount} meals`);
        console.log(`⚠️  Not found: ${notFoundCount} meals`);

        if (notFoundMeals.length > 0) {
            console.log('\n⚠️  Meals not found in database:');
            notFoundMeals.forEach((meal, index) => {
                console.log(`   ${index + 1}. ${meal}`);
            });
        }

        console.log('\n✅ SSL fix completed!');
        console.log('='.repeat(80));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run fix
fixMealImageSSL();

