const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Danh sách các domain có thể có vấn đề SSL hoặc không đáng tin cậy
const problematicDomains = [
    'saigonnhonews.com',
    'http://', // HTTP links
    'drive.gianhangvn.com',
    'production-cdn.pharmacity.io' // Signed URLs có thể hết hạn
];

// Map các món ăn với link ảnh mới từ Pexels/Unsplash (an toàn, có SSL)
const safeImageReplacements = {
    'Một nắm óc chó': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Ức Gà Nướng Mật Ong & Khoai Lang Nghiền': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Cá hồi áp chảo với cơm gạo lứt và bơ': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Táo và một nắm hạt điều': 'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Cà phê đen không đường': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Súp bí đỏ kem với bánh mì đen': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Thanh protein bar': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800'
};

async function fixAllMealImageSSL() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all meals
        const allMeals = await Meal.find({}, 'name image');
        console.log(`📊 Total meals in database: ${allMeals.length}\n`);

        let fixedCount = 0;
        const fixedMeals = [];
        const problematicMeals = [];

        // Check each meal for problematic image URLs
        for (const meal of allMeals) {
            if (!meal.image) continue;

            const imageUrl = meal.image;
            let isProblematic = false;

            // Check for HTTP (non-HTTPS)
            if (imageUrl.startsWith('http://')) {
                isProblematic = true;
            }

            // Check for problematic domains
            for (const domain of problematicDomains) {
                if (imageUrl.includes(domain)) {
                    isProblematic = true;
                    break;
                }
            }

            // Check for signed URLs (may expire)
            if (imageUrl.includes('X-Amz-Signature') || imageUrl.includes('X-Amz-Expires')) {
                isProblematic = true;
            }

            if (isProblematic) {
                problematicMeals.push({
                    name: meal.name,
                    oldUrl: imageUrl
                });

                // Try to find a replacement
                if (safeImageReplacements[meal.name]) {
                    try {
                        await Meal.findOneAndUpdate(
                            { _id: meal._id },
                            { $set: { image: safeImageReplacements[meal.name] } },
                            { new: true }
                        );
                        fixedMeals.push({
                            name: meal.name,
                            oldUrl: imageUrl,
                            newUrl: safeImageReplacements[meal.name]
                        });
                        fixedCount++;
                        console.log(`✅ Fixed: "${meal.name}"`);
                        console.log(`   Old: ${imageUrl.substring(0, 80)}...`);
                        console.log(`   New: ${safeImageReplacements[meal.name]}\n`);
                    } catch (error) {
                        console.error(`❌ Error fixing "${meal.name}":`, error.message);
                    }
                } else {
                    // Use a generic safe image from Pexels
                    const genericSafeImage = 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=800';
                    try {
                        await Meal.findOneAndUpdate(
                            { _id: meal._id },
                            { $set: { image: genericSafeImage } },
                            { new: true }
                        );
                        fixedMeals.push({
                            name: meal.name,
                            oldUrl: imageUrl,
                            newUrl: genericSafeImage
                        });
                        fixedCount++;
                        console.log(`✅ Fixed (generic): "${meal.name}"`);
                        console.log(`   Old: ${imageUrl.substring(0, 80)}...`);
                        console.log(`   New: ${genericSafeImage}\n`);
                    } catch (error) {
                        console.error(`❌ Error fixing "${meal.name}":`, error.message);
                    }
                }
            }
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 Summary:');
        console.log('='.repeat(80));
        console.log(`🔍 Found problematic images: ${problematicMeals.length}`);
        console.log(`✅ Successfully fixed: ${fixedCount} meals`);
        console.log(`⚠️  Not fixed: ${problematicMeals.length - fixedCount} meals`);

        if (fixedMeals.length > 0) {
            console.log('\n✅ Fixed meals:');
            fixedMeals.forEach((meal, index) => {
                console.log(`   ${index + 1}. ${meal.name}`);
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
fixAllMealImageSSL();

