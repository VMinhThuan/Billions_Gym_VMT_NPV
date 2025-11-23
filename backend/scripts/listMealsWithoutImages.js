const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Danh sách 55 món đã có ảnh
const mealsWithImages = [
    'Tôm xào bông cải xanh và ớt chuông cay',
    'Một quả lê',
    'Bánh mì trứng ốp la và rau xanh',
    'Hạt bí rang',
    'Cơm gà xé phay cay',
    'Dưa chuột và cà rốt cắt lát',
    'Thịt bò xào măng tây và nấm',
    'Trà hoa cúc',
    'Bánh pancake yến mạch với trái cây',
    'Nước dừa tươi',
    'Mì Ý nguyên cám sốt cà chua thịt băm',
    'Đậu phộng rang',
    'Cháo yến mạch cá hồi',
    'Bánh gạo lứt',
    'Trứng cuộn rau củ',
    'Hạt hướng dương',
    'Phở gà (ít bánh phở, nhiều rau)',
    'Một quả cam',
    'Đậu phụ sốt cà chua thịt băm',
    'Sữa hạt không đường',
    'Bột yến mạch với trứng luộc',
    'Nước chanh không đường',
    'Gỏi cuốn tôm thịt',
    'Cà chua bi',
    'Canh chua cá lóc (ít dầu, nhiều rau)',
    'Một ít hạt dưa',
    'Cháo yến mạch mặn với nấm và thịt băm',
    'Trà gừng mật ong (không đường)',
    'Cơm gạo lứt với cá thu sốt cà chua',
    'Sữa chua Hy Lạp với quả mọng',
    'Salad ức gà và rau củ nướng',
    'Gelatin không đường',
    'Trứng ốp la, bánh mì nguyên cám và bơ',
    'Salad ức gà nướng với quinoa',
    'Táo và một nắm hạnh nhân',
    'Cá hồi áp chảo với măng tây',
    'Nước protein whey',
    'Yến Mạch Trái Cây Hạt Chia',
    'Sữa Chua Không Đường Hạnh Nhân',
    'Ức Gà Áp Chảo, Cơm Gạo Lứt & Bông Cải Xanh',
    'Trứng Luộc & Dưa Chuột',
    'Salad Cá Ngừ với Bánh Mì Nguyên Cám',
    'Táo Tươi',
    'Trứng ốp la, thịt xông khói áp chảo & bánh mì nguyên cám',
    'Sữa chua Hy Lạp không đường với hạt chia và quả mọng',
    'Gà nướng sốt mật ong với cơm gạo lứt',
    'Thanh protein bar ít đường',
    'Cá hồi áp chảo với khoai lang nghiền',
    'Sữa hạnh nhân không đường',
    'Mì Pasta Với Sốt Cà Chua',
    'Sushi Tổng Hợp',
    'Pizza Margherita',
    'Phở Bò',
    'Bánh Ngọt Chocolate',
    'Salad Rau Củ Tươi'
];

async function listMealsWithoutImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all meals
        const allMeals = await Meal.find({}, 'name image mealType');

        console.log(`\n📊 Total meals in database: ${allMeals.length}`);
        console.log(`📸 Meals with images provided: ${mealsWithImages.length}\n`);

        // Find meals without images or with placeholder/default images
        const mealsWithoutImages = allMeals.filter(meal => {
            // Check if meal is not in the list of meals with images
            const hasProvidedImage = mealsWithImages.includes(meal.name);

            // Check if image is missing, placeholder, or empty
            const hasValidImage = meal.image &&
                meal.image !== '/placeholder-menu.jpg' &&
                meal.image.trim() !== '' &&
                !meal.image.includes('placeholder');

            return !hasProvidedImage || !hasValidImage;
        });

        // Separate into categories
        const missingFromList = allMeals.filter(meal => !mealsWithImages.includes(meal.name));
        const withPlaceholder = allMeals.filter(meal =>
            !meal.image ||
            meal.image === '/placeholder-menu.jpg' ||
            meal.image.includes('placeholder')
        );
        const withEmptyImage = allMeals.filter(meal => !meal.image || meal.image.trim() === '');

        console.log('='.repeat(80));
        console.log('📋 MEALS WITHOUT IMAGES OR NOT IN PROVIDED LIST');
        console.log('='.repeat(80));

        console.log(`\n🔍 Meals not in the 55 provided list: ${missingFromList.length}`);
        if (missingFromList.length > 0) {
            console.log('\n📝 List of meals:');
            missingFromList.forEach((meal, index) => {
                console.log(`${index + 1}. ${meal.name}`);
                console.log(`   - Meal Type: ${meal.mealType}`);
                console.log(`   - Current Image: ${meal.image || '(empty)'}`);
                console.log('');
            });
        }

        console.log(`\n🖼️  Meals with placeholder/default image: ${withPlaceholder.length}`);
        if (withPlaceholder.length > 0 && withPlaceholder.length <= 20) {
            console.log('\n📝 List of meals:');
            withPlaceholder.forEach((meal, index) => {
                console.log(`${index + 1}. ${meal.name}`);
                console.log(`   - Current Image: ${meal.image || '(empty)'}`);
                console.log('');
            });
        }

        console.log(`\n❌ Meals with empty image field: ${withEmptyImage.length}`);
        if (withEmptyImage.length > 0 && withEmptyImage.length <= 20) {
            console.log('\n📝 List of meals:');
            withEmptyImage.forEach((meal, index) => {
                console.log(`${index + 1}. ${meal.name}`);
                console.log('');
            });
        }

        // Summary by meal type
        console.log('\n' + '='.repeat(80));
        console.log('📊 SUMMARY BY MEAL TYPE');
        console.log('='.repeat(80));

        const byMealType = {};
        missingFromList.forEach(meal => {
            const type = meal.mealType || 'Unknown';
            byMealType[type] = (byMealType[type] || 0) + 1;
        });

        Object.entries(byMealType).forEach(([type, count]) => {
            console.log(`${type}: ${count} meals`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('✅ Analysis completed!');
        console.log('='.repeat(80));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run analysis
listMealsWithoutImages();

