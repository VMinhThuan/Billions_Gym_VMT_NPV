const mongoose = require('mongoose');
const Meal = require('../src/models/Meal');
require('dotenv').config();

const checkMealImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔍 Đang kiểm tra ảnh của các món ăn...\n');

        // Lấy tất cả món ăn
        const allMeals = await Meal.find({ status: 'ACTIVE' }).select('name image mealType isAIRecommended createdAt').lean();

        console.log(`📊 Tổng số món ăn: ${allMeals.length}\n`);

        // Phân loại
        const mealsWithoutImage = [];
        const mealsWithPlaceholder = [];
        const mealsWithInvalidUrl = [];
        const mealsWithValidUrl = [];

        for (const meal of allMeals) {
            const image = meal.image || '';

            // Không có image
            if (!image || image.trim() === '') {
                mealsWithoutImage.push(meal);
            }
            // Có placeholder
            else if (image.includes('placeholder') || image === '/placeholder-menu.jpg') {
                mealsWithPlaceholder.push(meal);
            }
            // URL không hợp lệ (không phải http/https và không phải đường dẫn local)
            else if (!image.startsWith('http://') && !image.startsWith('https://') && !image.startsWith('/')) {
                mealsWithInvalidUrl.push(meal);
            }
            // URL hợp lệ
            else {
                mealsWithValidUrl.push(meal);
            }
        }

        // In kết quả
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 BÁO CÁO ẢNH MÓN ĂN');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log(`✅ Món có ảnh hợp lệ: ${mealsWithValidUrl.length}`);
        console.log(`❌ Món không có ảnh: ${mealsWithoutImage.length}`);
        console.log(`🔄 Món dùng placeholder: ${mealsWithPlaceholder.length}`);
        console.log(`⚠️  Món có URL không hợp lệ: ${mealsWithInvalidUrl.length}\n`);

        // Chi tiết món không có ảnh
        if (mealsWithoutImage.length > 0) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('❌ DANH SÁCH MÓN KHÔNG CÓ ẢNH:');
            console.log('═══════════════════════════════════════════════════════════\n');
            mealsWithoutImage.forEach((meal, index) => {
                console.log(`${index + 1}. "${meal.name}"`);
                console.log(`   - Loại: ${meal.mealType}`);
                console.log(`   - AI tạo: ${meal.isAIRecommended ? 'Có' : 'Không'}`);
                console.log(`   - Ngày tạo: ${meal.createdAt ? new Date(meal.createdAt).toLocaleDateString('vi-VN') : 'N/A'}`);
                console.log(`   - Image: ${meal.image || '(rỗng)'}`);
                console.log('');
            });
        }

        // Chi tiết món dùng placeholder
        if (mealsWithPlaceholder.length > 0) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🔄 DANH SÁCH MÓN DÙNG PLACEHOLDER:');
            console.log('═══════════════════════════════════════════════════════════\n');
            mealsWithPlaceholder.forEach((meal, index) => {
                console.log(`${index + 1}. "${meal.name}"`);
                console.log(`   - Loại: ${meal.mealType}`);
                console.log(`   - AI tạo: ${meal.isAIRecommended ? 'Có' : 'Không'}`);
                console.log(`   - Image: ${meal.image}`);
                console.log('');
            });
        }

        // Chi tiết món có URL không hợp lệ
        if (mealsWithInvalidUrl.length > 0) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('⚠️  DANH SÁCH MÓN CÓ URL KHÔNG HỢP LỆ:');
            console.log('═══════════════════════════════════════════════════════════\n');
            mealsWithInvalidUrl.forEach((meal, index) => {
                console.log(`${index + 1}. "${meal.name}"`);
                console.log(`   - Loại: ${meal.mealType}`);
                console.log(`   - AI tạo: ${meal.isAIRecommended ? 'Có' : 'Không'}`);
                console.log(`   - Image: ${meal.image}`);
                console.log('');
            });
        }

        // Thống kê theo AI
        const aiMealsWithoutImage = mealsWithoutImage.filter(m => m.isAIRecommended).length;
        const aiMealsWithPlaceholder = mealsWithPlaceholder.filter(m => m.isAIRecommended).length;
        const aiMealsTotal = allMeals.filter(m => m.isAIRecommended).length;

        console.log('═══════════════════════════════════════════════════════════');
        console.log('🤖 THỐNG KÊ MÓN AI TẠO:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`Tổng món AI: ${aiMealsTotal}`);
        console.log(`Món AI không có ảnh: ${aiMealsWithoutImage}`);
        console.log(`Món AI dùng placeholder: ${aiMealsWithPlaceholder}`);
        console.log(`Tỷ lệ món AI có vấn đề ảnh: ${((aiMealsWithoutImage + aiMealsWithPlaceholder) / aiMealsTotal * 100).toFixed(1)}%\n`);

        // Nguyên nhân có thể
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 NGUYÊN NHÂN CÓ THỂ:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('1. AI không trả về image URL trong JSON response');
        console.log('2. Image URL từ AI không hợp lệ hoặc bị lỗi format');
        console.log('3. Image URL từ Unsplash không tồn tại hoặc đã bị xóa');
        console.log('4. Default value "/placeholder-menu.jpg" được sử dụng khi không có ảnh');
        console.log('5. Frontend không xử lý được một số format URL\n');

        await mongoose.disconnect();
        console.log('✅ Hoàn tất kiểm tra!');

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

checkMealImages();

