const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Map 57 món ăn với link video YouTube mới
const mealVideoMap = {
    'Gà Tây Nướng Với Măng Tây Hấp Và Gạo Lứt': 'https://www.youtube.com/watch?v=WRHz5FLWk3g',
    'Tacos Tôm Nướng Với Xoài Salsa': 'https://www.youtube.com/watch?v=9iLifoUx7S0',
    'Gà Nướng Với Quinoa Và Cải Xoăn': 'https://www.youtube.com/watch?v=f9zv2ngqK2w',
    'Salad Hy Lạp Với Phô Mai Feta Và Ô Liu': 'https://www.youtube.com/watch?v=9aHqE63nIFM',
    'Sinh Tố Protein Việt Quất': 'https://www.youtube.com/watch?v=3Mdeb5JxVEc',
    'Cá Hồi Nướng Với Chanh Và Măng Tây': 'https://www.youtube.com/watch?v=kjYjW1leXow',
    'Yến Mạch Với Bơ Hạnh Nhân Và Quả Mọng': 'https://www.youtube.com/shorts/gF7LuKs4xVE',
    'Bánh Cuốn Gà Với Bơ Và Rau Bina': 'https://www.youtube.com/watch?v=R38xPrliCwo',
    'Salad Quinoa Với Rau Củ Nướng Và Phô Mai Feta': 'https://www.youtube.com/watch?v=NI3t_kHdu1s',
    'Trứng cuộn thịt băm và khoai lang luộc': 'https://www.youtube.com/watch?v=_9qeffPjI7w',
    'Ức gà nướng sốt tiêu đen với cơm gạo lứt': 'https://www.youtube.com/watch?v=H0kEIlqvaLM',
    'Bò xào hành tây và nấm với khoai tây nghiền': 'https://www.youtube.com/watch?v=ihye19h2JH0',
    'Sữa chua Hy Lạp với hạt chia và vài lát thịt nguội': 'https://www.youtube.com/watch?v=Ept4OVeVsvo',
    'Trứng ốp la và bánh mì nguyên cám với rau xanh': 'https://www.youtube.com/watch?v=6I9f99AG7Hw',
    'Ức gà áp chảo với cơm gạo lứt và salad rau củ': 'https://www.youtube.com/watch?v=4l9Pp5uv-Yc',
    'Sữa chua không đường với hạt chia và vài lát trái cây tươi': 'https://www.youtube.com/watch?v=u35kESF-r28',
    'Cá hồi nướng rau củ': 'https://www.youtube.com/watch?v=UkfHA1PvDqU',
    'Bò Né Ốp La với Bánh Mì và Salad': 'https://www.youtube.com/watch?v=l6-xpQKGV-g',
    'Ức Gà Áp Chảo Sốt Tiêu Xanh, Cơm Gạo Lứt và Rau Củ Luộc': 'https://www.youtube.com/watch?v=m8V3ULygdoI',
    'Sữa Chua Hy Lạp Không Đường với Quả Mọng và Hạt Chia': 'https://www.youtube.com/watch?v=hZhvtII_a58',
    'Cá Hồi Nướng Sốt Chanh Mật Ong, Măng Tây và Khoai Lang Nghiền': 'https://www.youtube.com/watch?v=V8NkdDW9dh0',
    'Trứng Cuộn Thịt Băm Thơm Ngon': 'https://www.youtube.com/watch?v=OO9SFcNCZfU',
    'Ức Gà Nướng Mật Ong & Khoai Lang Nghiền': 'https://www.youtube.com/watch?v=M-x5RUbwggs',
    'Sữa Chua Hy Lạp Không Đường & Quả Mọng': 'https://www.youtube.com/watch?v=hZhvtII_a58',
    'Thịt Bò Xào Nấm và Hành Tây Kèm Cơm Gạo Lứt': 'https://www.youtube.com/watch?v=2TI-vaWhms4',
    'Yến mạch hạt chia với quả mọng và hạt': 'https://www.youtube.com/watch?v=XySgd7zMXZE',
    'Ức gà nướng sốt chanh mật ong kèm khoai lang': 'https://www.youtube.com/watch?v=Cgv7kOyPRLU',
    'Cá hồi áp chảo với cơm gạo lứt và bơ': 'https://www.youtube.com/watch?v=QCUTNVjOGqE',
    'Sữa chua Hy Lạp không đường với một quả táo': 'https://www.youtube.com/watch?v=QoeA6DCTWqw',
    'Trứng cuộn rau củ và ức gà xé': 'https://www.youtube.com/watch?v=fC2nloAyzqc',
    'Bún gạo lứt xào thịt bò và bông cải xanh': 'https://www.youtube.com/watch?v=DtEopJzqjDU',
    'Ức gà luộc xé phay với dưa chuột': 'https://www.youtube.com/watch?v=kVIMDjoMXGY',
    'Cá hồi áp chảo sốt chanh leo, khoai lang nướng và salad rau xanh': 'https://www.youtube.com/watch?v=zOg9yTQQ20U',
    'Trứng ốp la, thịt gà tây xông khói và bánh mì nguyên cám': 'https://www.youtube.com/shorts/L1TBg6w56BI',
    'Ức gà nướng sốt tiêu đen với cơm gạo lứt': 'https://www.youtube.com/watch?v=H0kEIlqvaLM',
    'Sinh tố protein chuối và hạt chia': 'https://www.youtube.com/watch?v=0NFWR-ij0rA',
    'Cá hồi áp chảo với khoai lang nghiền và măng tây nướng': 'https://www.youtube.com/watch?v=wL7IymLQoq0',
    'Trứng Cuộn Thịt Nguội và Sữa Tươi': 'https://www.youtube.com/watch?v=TVG6NvVye1Q',
    'Cơm Gà Nướng Mật Ong': 'https://www.youtube.com/watch?v=6qxsd_vBWx4',
    'Bò Lúc Lắc và Cơm': 'https://www.youtube.com/watch?v=KzkL10uKSAY',
    'Sinh Tố Chuối Bơ Đậu Phộng': 'https://www.youtube.com/watch?v=PqFLu_qjuVM',
    'Yến mạch ấm với quả mọng và hạt chia': 'https://www.youtube.com/watch?v=XySgd7zMXZE',
    'Sữa chua Hy Lạp không đường với hạnh nhân': 'https://www.youtube.com/watch?v=3gy7UwTQZD8',
    'Salad gà nướng sốt cay chanh ớt': 'https://www.youtube.com/watch?v=raenj8--GuI',
    'Táo và một nắm hạt điều': 'https://www.youtube.com/watch?v=_R6YFZSO2rE',
    'Cá hồi áp chảo với măng tây và khoai lang nghiền': 'https://www.youtube.com/watch?v=juwaQcPpDtI',
    'Quýt tươi': 'https://m.youtube.com/shorts/EeS7QQGM26g',
    'Trứng ốp la với bánh mì nguyên cám và bơ': 'https://www.youtube.com/watch?v=QAmQUQWZkhg',
    'Nước ép rau xanh': 'https://www.youtube.com/watch?v=DZx7PXYGxJA',
    'Bún gà nướng cay': 'https://www.youtube.com/watch?v=L-sukP-6jXg',
    'Một nắm óc chó': 'https://www.youtube.com/watch?v=b4odhMTiZwU',
    'Ức gà nướng thảo mộc với rau củ luộc': 'https://www.youtube.com/watch?v=15iKQhSDTTg',
    'Sữa chua không đường': 'https://www.youtube.com/watch?v=gMwhB9tTDT4',
    'Sinh tố protein chuối bơ đậu phộng': 'https://www.youtube.com/watch?v=PqFLu_qjuVM',
    'Cà phê đen không đường': 'https://www.youtube.com/watch?v=LImkI9UvJCY',
    'Súp bí đỏ kem với bánh mì đen': 'https://www.youtube.com/watch?v=OGY1qdj8Nf0',
    'Thanh protein bar': 'https://www.youtube.com/shorts/dgFah2FrJ6c'
};

async function updateRemainingMealVideoUrls() {
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
                // Normalize video URL (convert m.youtube.com to www.youtube.com)
                let normalizedUrl = videoUrl;
                if (videoUrl.includes('m.youtube.com')) {
                    normalizedUrl = videoUrl.replace('m.youtube.com', 'www.youtube.com');
                }

                const result = await Meal.findOneAndUpdate(
                    { name: mealName },
                    { $set: { cookingVideoUrl: normalizedUrl } },
                    { new: true }
                );

                if (result) {
                    console.log(`✅ Updated: "${mealName}"`);
                    console.log(`   Video URL: ${normalizedUrl}`);
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
updateRemainingMealVideoUrls();

