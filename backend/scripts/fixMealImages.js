const mongoose = require('mongoose');
const Meal = require('../src/models/Meal');
require('dotenv').config();

// Hàm tạo URL Unsplash dựa trên tên món
const generateUnsplashUrl = (mealName) => {
    const name = mealName.toLowerCase();

    // Từ khóa chính
    let keywords = [];

    // Phát hiện nguyên liệu chính
    if (name.includes('gà') || name.includes('chicken')) {
        keywords.push('chicken', 'food', 'healthy');
    } else if (name.includes('cá') || name.includes('salmon') || name.includes('fish')) {
        keywords.push('salmon', 'fish', 'food', 'healthy');
    } else if (name.includes('bò') || name.includes('beef') || name.includes('steak')) {
        keywords.push('beef', 'steak', 'food');
    } else if (name.includes('tôm') || name.includes('shrimp')) {
        keywords.push('shrimp', 'seafood', 'food');
    } else if (name.includes('trứng') || name.includes('egg')) {
        keywords.push('egg', 'breakfast', 'food');
    } else if (name.includes('salad') || name.includes('rau') || name.includes('vegetable')) {
        keywords.push('salad', 'vegetables', 'healthy');
    } else if (name.includes('cơm') || name.includes('rice')) {
        keywords.push('rice', 'bowl', 'food');
    } else if (name.includes('sinh tố') || name.includes('smoothie')) {
        keywords.push('smoothie', 'drink', 'healthy');
    } else if (name.includes('yến mạch') || name.includes('oats') || name.includes('oatmeal')) {
        keywords.push('oats', 'breakfast', 'healthy');
    } else if (name.includes('phở') || name.includes('pho')) {
        keywords.push('pho', 'vietnamese', 'food');
    } else if (name.includes('bún') || name.includes('bun')) {
        keywords.push('vietnamese', 'noodles', 'food');
    } else if (name.includes('sữa chua') || name.includes('yogurt')) {
        keywords.push('yogurt', 'breakfast', 'healthy');
    } else if (name.includes('khoai lang') || name.includes('sweet potato')) {
        keywords.push('sweet', 'potato', 'food');
    } else if (name.includes('quinoa')) {
        keywords.push('quinoa', 'healthy', 'food');
    } else {
        // Mặc định
        keywords.push('food', 'healthy', 'meal');
    }

    // Phát hiện loại bữa
    if (name.includes('sáng') || name.includes('breakfast')) {
        keywords.push('breakfast');
    } else if (name.includes('trưa') || name.includes('lunch')) {
        keywords.push('lunch');
    } else if (name.includes('tối') || name.includes('dinner')) {
        keywords.push('dinner');
    }

    // Tạo URL Unsplash
    const query = keywords.slice(0, 3).join(',');
    return `https://source.unsplash.com/800x600/?${query}`;
};

const fixMealImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔧 Đang sửa ảnh cho các món ăn...\n');

        // Tìm các món dùng placeholder
        const mealsToFix = await Meal.find({
            status: 'ACTIVE',
            $or: [
                { image: '/placeholder-menu.jpg' },
                { image: { $exists: false } },
                { image: '' },
                { image: null }
            ]
        }).select('name image mealType');

        console.log(`📋 Tìm thấy ${mealsToFix.length} món cần sửa ảnh\n`);

        let fixed = 0;
        let skipped = 0;

        for (const meal of mealsToFix) {
            const newImageUrl = generateUnsplashUrl(meal.name);

            try {
                await Meal.updateOne(
                    { _id: meal._id },
                    { $set: { image: newImageUrl } }
                );
                console.log(`✅ Đã cập nhật: "${meal.name}"`);
                console.log(`   URL mới: ${newImageUrl}\n`);
                fixed++;
            } catch (error) {
                console.error(`❌ Lỗi khi cập nhật "${meal.name}":`, error.message);
                skipped++;
            }
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 KẾT QUẢ:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`✅ Đã sửa: ${fixed} món`);
        console.log(`❌ Bỏ qua: ${skipped} món\n`);

        await mongoose.disconnect();
        console.log('✅ Hoàn tất!');

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

fixMealImages();

