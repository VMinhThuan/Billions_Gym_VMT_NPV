const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Map 55 món ăn với link video YouTube mới
const mealVideoMap = {
    'Tôm xào bông cải xanh và ớt chuông cay': 'https://www.youtube.com/watch?v=8tPIEdBcdX0',
    'Một quả lê': 'https://www.youtube.com/shorts/LyHYNjEuHek',
    'Bánh mì trứng ốp la và rau xanh': 'https://www.youtube.com/watch?v=u8XNbE-YsIs',
    'Hạt bí rang': 'https://www.youtube.com/watch?v=OQPZTmTb3dc',
    'Cơm gà xé phay cay': 'https://www.youtube.com/watch?v=biRhpdVnEGI',
    'Dưa chuột và cà rốt cắt lát': 'https://www.youtube.com/watch?v=GwtVzZ3wAZc',
    'Thịt bò xào măng tây và nấm': 'https://www.youtube.com/watch?v=8WVNnZVuORQ',
    'Trà hoa cúc': 'https://www.youtube.com/watch?v=Dtb_hLYJF50',
    'Bánh pancake yến mạch với trái cây': 'https://www.youtube.com/watch?v=UziwI7ZvnUg',
    'Nước dừa tươi': 'https://www.youtube.com/watch?v=WC6IEdAV6mI',
    'Mì Ý nguyên cám sốt cà chua thịt băm': 'https://www.youtube.com/watch?v=boeWR-pkSxc',
    'Đậu phộng rang': 'https://www.youtube.com/watch?v=q2RsJyBi01A',
    'Cháo yến mạch cá hồi': 'https://www.youtube.com/watch?v=O4hmd6U41js',
    'Bánh gạo lứt': 'https://www.youtube.com/watch?v=5d0Jf8s5rDs',
    'Trứng cuộn rau củ': 'https://www.youtube.com/watch?v=FuBeya41L5Y',
    'Hạt hướng dương': 'https://www.youtube.com/watch?v=_uVhLFWirR8',
    'Phở gà (ít bánh phở, nhiều rau)': 'https://www.youtube.com/watch?v=cuSdctA5z-U',
    'Một quả cam': 'https://www.youtube.com/watch?v=2XJ8PukTXIo',
    'Đậu phụ sốt cà chua thịt băm': 'https://www.youtube.com/watch?v=udIGv2C3P08',
    'Sữa hạt không đường': 'https://www.youtube.com/watch?v=HT5H-g-yiqc',
    'Bột yến mạch với trứng luộc': 'https://www.youtube.com/watch?v=Xf91jwk5OG0',
    'Nước chanh không đường': 'https://www.youtube.com/watch?v=H5xnCBQW4ao',
    'Gỏi cuốn tôm thịt': 'https://www.youtube.com/watch?v=w34Qnc-9KBU',
    'Cà chua bi': 'https://www.youtube.com/watch?v=5gwbzmp5Oxw',
    'Canh chua cá lóc (ít dầu, nhiều rau)': 'https://www.youtube.com/watch?v=iVBoygPa2G8',
    'Một ít hạt dưa': 'https://www.youtube.com/watch?v=CDCob_GdqbI',
    'Cháo yến mạch mặn với nấm và thịt băm': 'https://www.youtube.com/watch?v=gxrrygBDiwk',
    'Trà gừng mật ong (không đường)': 'https://www.youtube.com/watch?v=LKKap8nO45Q',
    'Cơm gạo lứt với cá thu sốt cà chua': 'https://www.youtube.com/watch?v=7zoCjAJO0NM',
    'Sữa chua Hy Lạp với quả mọng': 'https://www.youtube.com/watch?v=hZhvtII_a58',
    'Salad ức gà và rau củ nướng': 'https://www.youtube.com/watch?v=akSISzOm9Y4',
    'Gelatin không đường': 'https://www.youtube.com/watch?v=zFQDCpxJtwI',
    'Trứng ốp la, bánh mì nguyên cám và bơ': 'https://www.youtube.com/watch?v=QAmQUQWZkhg',
    'Salad ức gà nướng với quinoa': 'https://www.youtube.com/watch?v=PHMmoBKlYJE',
    'Táo và một nắm hạnh nhân': 'https://www.youtube.com/watch?v=T_bhaAimvJ4',
    'Cá hồi áp chảo với măng tây': 'https://www.youtube.com/watch?v=juwaQcPpDtI',
    'Nước protein whey': 'https://www.youtube.com/watch?v=pRB8g-Bf3bY',
    'Yến Mạch Trái Cây Hạt Chia': 'https://www.youtube.com/watch?v=XySgd7zMXZE',
    'Sữa Chua Không Đường Hạnh Nhân': 'https://www.youtube.com/watch?v=HT5H-g-yiqc',
    'Ức Gà Áp Chảo, Cơm Gạo Lứt & Bông Cải Xanh': 'https://www.youtube.com/watch?v=2NhXowN-R5o',
    'Trứng Luộc & Dưa Chuột': 'https://www.youtube.com/watch?v=sBJWiduiODM',
    'Salad Cá Ngừ với Bánh Mì Nguyên Cám': 'https://www.youtube.com/watch?v=dzldkSWxudk',
    'Táo Tươi': 'https://www.youtube.com/watch?v=fiLS0XJUb9U',
    'Trứng ốp la, thịt xông khói áp chảo & bánh mì nguyên cám': 'https://www.youtube.com/watch?v=3kogdmUHapU',
    'Sữa chua Hy Lạp không đường với hạt chia và quả mọng': 'https://www.youtube.com/watch?v=UsveRngRwjU',
    'Gà nướng sốt mật ong với cơm gạo lứt': 'https://www.youtube.com/watch?v=tR5Q0ZhNnTA',
    'Thanh protein bar ít đường': 'https://www.youtube.com/watch?v=dgFah2FrJ6c',
    'Cá hồi áp chảo với khoai lang nghiền': 'https://www.youtube.com/watch?v=wL7IymLQoq0',
    'Sữa hạnh nhân không đường': 'https://www.youtube.com/watch?v=HT5H-g-yiqc',
    'Mì Pasta Với Sốt Cà Chua': 'https://www.youtube.com/watch?v=oY5wSMsFaXg',
    'Sushi Tổng Hợp': 'https://www.youtube.com/watch?v=LXKJ9O6lT_g',
    'Pizza Margherita': 'https://www.youtube.com/watch?v=ft97dd4amUI',
    'Phở Bò': 'https://www.youtube.com/watch?v=c9GfHgMk1ac',
    'Bánh Ngọt Chocolate': 'https://www.youtube.com/watch?v=wafAVdgLmjQ',
    'Salad Rau Củ Tươi': 'https://www.youtube.com/watch?v=M28fb5Ja9g4'
};

async function updateMealVideoUrls() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        let successCount = 0;
        let notFoundCount = 0;
        const notFoundMeals = [];

        // Update each meal
        for (const [mealName, videoUrl] of Object.entries(mealVideoMap)) {
            try {
                const result = await Meal.findOneAndUpdate(
                    { name: mealName },
                    { $set: { cookingVideoUrl: videoUrl } },
                    { new: true }
                );

                if (result) {
                    console.log(`✅ Updated: "${mealName}"`);
                    console.log(`   Video URL: ${videoUrl}`);
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
        console.log(`✅ Successfully updated: ${successCount} meals`);
        console.log(`⚠️  Not found: ${notFoundCount} meals`);

        if (notFoundMeals.length > 0) {
            console.log('\n⚠️  Meals not found in database:');
            notFoundMeals.forEach((meal, index) => {
                console.log(`   ${index + 1}. ${meal}`);
            });
        }

        console.log('\n✅ Video URL update completed!');
        console.log('='.repeat(80));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run update
updateMealVideoUrls();

