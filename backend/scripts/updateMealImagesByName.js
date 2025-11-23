const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Mapping tên món ăn với link ảnh
const mealImageMap = {
    'Tôm xào bông cải xanh và ớt chuông cay': 'https://i.ytimg.com/vi/S6vZROTuChk/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBPX8vn8zqcMyqEwxloQvvBpHh5ow',
    'Một quả lê': 'https://cdn.tienphong.vn/images/a6bf4f60924201126af6849ca45a398000817fa5dd6fb0c23f843852a5fadf4da9d5d3872327300e16576af3445eb57c006fd530e521ce6713abd62651aa76b71b9e65ee098c3e8b68cb6964fd2cea4413d4d89e4ae4e2f18f78a79274dc5607714ef85a15986e12ec866c53661a093d/nhung-cong-dung-cua-qua-le-voi-suc-khoe-con-nguoi-1044.jpg',
    'Bánh mì trứng ốp la và rau xanh': 'https://www.veggiesfirst.com/sites/default/files/misc/bread_toasts_with_fried_eggs_and_fresh_vegetables.jpg',
    'Hạt bí rang': 'https://hrencoffee.vn/wp-content/uploads/2022/03/cach-rang-ha%CC%A3t-bi-do%CC%89-02.jpg',
    'Cơm gà xé phay cay': 'https://i.ytimg.com/vi/biRhpdVnEGI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDkd3M_3j4WJOwCoYZCstbFnGZNEg',
    'Dưa chuột và cà rốt cắt lát': 'https://pixnio.com/free-images/2020/01/23/2020-01-23-11-11-02-1200x800.jpg',
    'Thịt bò xào măng tây và nấm': 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=761066882713543',
    'Trà hoa cúc': 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2023/10/25/photo-1698223963413-16982239648961756973201.jpg',
    'Bánh pancake yến mạch với trái cây': 'https://bizweb.dktcdn.net/100/004/714/files/thuc-an-cho-be5-879c0734-4cc4-439a-ad5e-f5781e9b7b59.jpg?v=1625625801919',
    'Nước dừa tươi': 'https://media.vov.vn/sites/default/files/styles/large/public/2023-08/20200513_094457_911488_loi-ich-cua-nuoc-du.max-1800x1800.jpg',
    'Mì Ý nguyên cám sốt cà chua thịt băm': 'http://file.hstatic.net/200000700229/article/mi-y-sot-ca-chua-thit-heo-bam-thumb_b5ba04d741394513a144db4c60645925.jpg',
    'Đậu phộng rang': 'https://media-cdn-v2.laodong.vn/storage/newsportal/2022/6/2/1052010/Dau-Phong-Rang.jpg',
    'Cháo yến mạch cá hồi': 'https://cdn.tgdd.vn/2022/03/CookRecipe/Avatar/chao-yen-mach-ca-hoi-bi-do-thumbnail.jpg',
    'Bánh gạo lứt': 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_2_10_638431262760695571_cach-lam-banh-gao-lut.jpg',
    'Trứng cuộn rau củ': 'https://cdn.tgdd.vn/2021/03/CookRecipe/Avatar/trung-cuon-rau-cu-thumbnail.jpg',
    'Hạt hướng dương': 'https://cdn.tgdd.vn/2021/05/CookProduct/Tac-dung-cua-hat-huong-duong-doi-voi-suc-khoe-va-cach-an-hat-huong-duong-0-1200x676-1200x676-1.jpg',
    'Phở gà (ít bánh phở, nhiều rau)': 'https://banhmilienhoa1987.com/wp-content/uploads/2025/10/cach-nau-pho-ga-ha-noi-ngon-tai-nha-03a4a4.webp',
    'Một quả cam': 'https://img.lovepik.com/free-png/20211119/lovepik-an-orange-png-image_401038024_wh1200.png',
    'Đậu phụ sốt cà chua thịt băm': 'https://img-global.cpcdn.com/recipes/af4a00ea96579b35/1200x630cq80/photo.jpg',
    'Sữa hạt không đường': 'https://fujimart.vn/wp-content/uploads/2025/08/Loc-Sua-9-Loai-Hat-180ml-front-view-003.png',
    'Bột yến mạch với trứng luộc': 'https://cdn.tgdd.vn/2020/12/CookProduct/thumbcn-1200x676-19.jpg',
    'Nước chanh không đường': 'https://media.vov.vn/sites/default/files/styles/large/public/2023-06/nuoc_chanh_5.jpg',
    'Gỏi cuốn tôm thịt': 'https://i.ytimg.com/vi/w34Qnc-9KBU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAzXE6ASDMpVme1qsjbkQx4v-KaYA',
    'Cà chua bi': 'https://nongsanhaugiang.com.vn/images/10012020/af016b3d2384d8f39cad4c0819aecf39.jpg',
    'Canh chua cá lóc (ít dầu, nhiều rau)': 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_3_23_638467922672032197_batch_cach-nau-canh-chua-ca-loc.jpg',
    'Một ít hạt dưa': 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2024/1/29/base64-17065472093582001531744.jpeg',
    'Cháo yến mạch mặn với nấm và thịt băm': 'https://img-global.cpcdn.com/recipes/eb6a9f62d1d7e7af/1200x630cq80/photo.jpg',
    'Trà gừng mật ong (không đường)': 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/5/21/1047672/Mat-Ong-Va-Gung.jpg',
    'Cơm gạo lứt với cá thu sốt cà chua': 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=3168352253241591',
    'Sữa chua Hy Lạp với quả mọng': 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2024/07/44-1024x683.png',
    'Salad ức gà và rau củ nướng': 'https://beptruong.edu.vn/wp-content/uploads/2017/11/salad-uc-ga-600x400.jpg',
    'Gelatin không đường': 'https://img.lazcdn.com/g/p/ebdde04b90db09079b3f1ebb69ce4dbc.jpg_720x720q80.jpg',
    'Trứng ốp la, bánh mì nguyên cám và bơ': 'https://cdn.tgdd.vn/Files/2020/07/21/1272477/cach-lam-sandwich-trai-bo-vua-ngon-vua-giau-nang-luong-cho-ngay-dai-202202151413205080.jpg',
    'Salad ức gà nướng với quinoa': 'https://monngonmoingay.com/wp-content/uploads/2025/11/uc-ga-tron-quinoa.jpg',
    'Táo và một nắm hạnh nhân': 'https://login.medlatec.vn//ImagePath/images/20220808/20220808_Nhung-cong-dung-bat-ngo-cua-hat-hanh-nhan-doi-voi-suc-khoe.jpg',
    'Cá hồi áp chảo với măng tây': 'https://gofood.vn//upload/r/tong-hop-tin-tuc/huong-dan-mon-ngon/ca-hoi-ap-chao-mang-tay-chanh-leo.jpg',
    'Nước protein whey': 'https://www.vinmec.com/static/uploads/medium_20190829_063758_523105_whey_protein_la_gi_max_1800x1800_png_db1e0235ba.png',
    'Yến Mạch Trái Cây Hạt Chia': 'https://gimme.vn/wp-content/uploads/yen-mach-hat-chia.jpg',
    'Sữa Chua Không Đường Hạnh Nhân': 'https://suckhoedoisong.qltns.mediacdn.vn/Images/haiyen/2017/03/13/hanh_nhan.jpg',
    'Ức Gà Áp Chảo, Cơm Gạo Lứt & Bông Cải Xanh': 'https://i.ytimg.com/vi/m8V3ULygdoI/maxresdefault.jpg',
    'Trứng Luộc & Dưa Chuột': 'https://toshiko.vn/storage/images/2021/10/giam-can-voi-trung-va-dua-leo-2.jpg',
    'Salad Cá Ngừ với Bánh Mì Nguyên Cám': 'https://greengood.vn/wp-content/uploads/2025/08/95.webp',
    'Táo Tươi': 'https://cdn.tgdd.vn/2021/05/CookProduct/0-1200x676-13.jpg',
    'Trứng ốp la, thịt xông khói áp chảo & bánh mì nguyên cám': 'https://img-global.cpcdn.com/recipes/c363417b365759cc/1200x630cq80/photo.jpg',
    'Sữa chua Hy Lạp không đường với hạt chia và quả mọng': 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/7/3/1063468/72A89CE3-C98C-45FD-A.jpeg',
    'Gà nướng sốt mật ong với cơm gạo lứt': 'https://vnhaisantuoingon.com/wp-content/uploads/2023/03/C%C6%A1m-g%E1%BA%A1o-l%E1%BB%A9t-%E1%BB%A9c-g%C3%A0-n%C6%B0%E1%BB%9Bng-m%E1%BA%ADt-ong.jpg',
    'Thanh protein bar ít đường': 'https://www.wheystore.vn/upload_images/images/2024/03/21/banh-warrior-crunch-protein(1).jpg',
    'Cá hồi áp chảo với khoai lang nghiền': 'https://i.ytimg.com/vi/wL7IymLQoq0/maxresdefault.jpg',
    'Sữa hạnh nhân không đường': 'https://cdn.tgdd.vn/Products/Images/2943/157946/bhx/loc-3-hop-sua-hanh-nhan-khong-duong-137-degrees-180ml-202104140028045152.jpg',
    'Mì Pasta Với Sốt Cà Chua': 'https://i-giadinh.vnecdn.net/2022/04/20/Buoc-9-9-3230-1650439557.jpg',
    'Sushi Tổng Hợp': 'https://hatoyama.vn/wp-content/uploads/2020/05/sushi-tong-hop-lon-12-8-1200.jpg',
    'Pizza Margherita': 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Pizza_Margherita_stu_spivack.jpg',
    'Phở Bò': 'http://farm8.staticflickr.com/7087/7174177733_6c0af1a0b2_b.jpg',
    'Bánh Ngọt Chocolate': 'http://www.savourydays.com/wp-content/uploads/2013/01/ChocolateCake.jpg',
    'Salad Rau Củ Tươi': 'https://cdn.zsoft.solutions/poseidon-web/app/media/Kham-pha-am-thuc/04.2024/120424-3-mon-salad-buffet-poseidon-04.jpg'
};

async function updateMealImagesByName() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        let updatedCount = 0;
        let notFoundCount = 0;
        const notFoundMeals = [];

        // Update each meal by name
        for (const [mealName, imageUrl] of Object.entries(mealImageMap)) {
            try {
                const result = await Meal.findOneAndUpdate(
                    { name: mealName },
                    { $set: { image: imageUrl } },
                    { new: true }
                );

                if (result) {
                    updatedCount++;
                    console.log(`✅ Updated: "${mealName}"`);
                } else {
                    notFoundCount++;
                    notFoundMeals.push(mealName);
                    console.log(`⚠️  Not found: "${mealName}"`);
                }
            } catch (error) {
                console.error(`❌ Error updating "${mealName}":`, error.message);
                notFoundCount++;
                notFoundMeals.push(mealName);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`✅ Successfully updated: ${updatedCount} meals`);
        console.log(`⚠️  Not found: ${notFoundCount} meals`);

        if (notFoundMeals.length > 0) {
            console.log('\n⚠️  Meals not found in database:');
            notFoundMeals.forEach(meal => console.log(`   - ${meal}`));
        }

        // Check if there are similar names (fuzzy matching)
        if (notFoundMeals.length > 0) {
            console.log('\n🔍 Checking for similar meal names...');
            const allMeals = await Meal.find({}, 'name');
            const allMealNames = allMeals.map(m => m.name);

            notFoundMeals.forEach(notFoundName => {
                const similar = allMealNames.filter(name =>
                    name.toLowerCase().includes(notFoundName.toLowerCase().substring(0, 10)) ||
                    notFoundName.toLowerCase().includes(name.toLowerCase().substring(0, 10))
                );
                if (similar.length > 0) {
                    console.log(`   "${notFoundName}" might match: ${similar.join(', ')}`);
                }
            });
        }

        console.log('\n✅ Image update completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating meal images:', error);
        process.exit(1);
    }
}

// Run update
updateMealImagesByName();

