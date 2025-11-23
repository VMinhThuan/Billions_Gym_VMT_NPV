const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// Map 57 món ăn với link ảnh tương ứng
const mealImageMap = {
    'Gà Tây Nướng Với Măng Tây Hấp Và Gạo Lứt': 'https://img-global.cpcdn.com/recipes/b917a501a310ceac/1200x630cq80/photo.jpg',
    'Tacos Tôm Nướng Với Xoài Salsa': 'https://i.ytimg.com/vi/9iLifoUx7S0/maxresdefault.jpg',
    'Gà Nướng Với Quinoa Và Cải Xoăn': 'https://www.lemon8-app.com/seo/image?item_id=7527464346515948040&index=0&sign=f1f0a86bad2207ac9bb318689b1a43a5',
    'Salad Hy Lạp Với Phô Mai Feta Và Ô Liu': 'https://img.lovepik.com/photo/60326/8142.jpg_wh860.jpg',
    'Sinh Tố Protein Việt Quất': 'https://www.herbalife.com/dmassets/global-reusable-assets/images/recipes/ri_blueberry_protein_shake_299995920.jpeg',
    'Cá Hồi Nướng Với Chanh Và Măng Tây': 'https://gofood.vn//upload/r/tong-hop-tin-tuc/huong-dan-mon-ngon/ca-hoi-ap-chao-mang-tay-chanh-leo.jpg',
    'Yến Mạch Với Bơ Hạnh Nhân Và Quả Mọng': 'https://kim.com.vn/wp-content/uploads/2025/02/yen-mach-bot-protein-vani-qua-dem-voi-hon-hop-qua-mong.jpg',
    'Bánh Cuốn Gà Với Bơ Và Rau Bina': 'https://cdn.tgdd.vn/2021/02/CookProduct/maxresdefault-(12)-1200x676.jpg',
    'Salad Quinoa Với Rau Củ Nướng Và Phô Mai Feta': 'https://yogaismylife.vn/wp-content/uploads/2025/02/huong-dan-lam-bua-trua-rau-cu-nuong-cho-nguoi-tap-yoga.webp',
    'Trứng cuộn thịt băm và khoai lang luộc': 'https://cdn.tgdd.vn/2020/07/CookRecipe/Avatar/trung-cuon-thit-thumbnail.jpg',
    'Ức gà nướng sốt tiêu đen với cơm gạo lứt': 'https://vnhaisantuoingon.com/wp-content/uploads/2023/03/C%C6%A1m-g%E1%BA%A1o-l%E1%BB%A9t-%E1%BB%A9c-g%C3%A0-n%C6%B0%E1%BB%9Bng-m%E1%BA%ADt-ong.jpg',
    'Bò xào hành tây và nấm với khoai tây nghiền': 'https://img-global.cpcdn.com/recipes/fd7db564d24ff43e/1200x630cq80/photo.jpg',
    'Sữa chua Hy Lạp với hạt chia và vài lát thịt nguội': 'https://nauchuananngon.vn/wp-content/uploads/2025/08/sua-chua-hy-lap-an-kem-trai-cay-tuoi-va-cac-loai-hat-dinh-duong.jpg',
    'Trứng ốp la và bánh mì nguyên cám với rau xanh': 'https://s.cmx-cdn.com/tiepthigiadinh.vn/files/0979652901/2024/10/30/6721a88cbcf82.jpg',
    'Ức gà áp chảo với cơm gạo lứt và salad rau củ': 'https://vnhaisantuoingon.com/wp-content/uploads/2023/03/C%C6%A1m-g%E1%BA%A1o-l%E1%BB%A9t-%E1%BB%A9c-g%C3%A0-n%C6%B0%E1%BB%9Bng-m%E1%BA%ADt-ong.jpg',
    'Sữa chua không đường với hạt chia và vài lát trái cây tươi': 'https://yobite.vn/wp-content/uploads/2024/09/Sua-chua-voi-hat-chia-va-trai-cay.png',
    'Cá hồi nướng rau củ': 'https://thanhnien.mediacdn.vn/Uploaded/2014/saigonamthuc.thanhnien.com.vn/Pictures201407/NgocLinh/cahoirau-b.jpg',
    'Bò Né Ốp La với Bánh Mì và Salad': 'https://cdn-ilbhomn.nitrocdn.com/uBjgZMvzumShtSIbrsxbnpauzKsmuliE/assets/images/optimized/rev-15ee097/thucphamquocte.vn/wp-content/uploads/2022/10/2022-08-31-TPQT-Cach-lam-banh-mi-ap-chao-thit-bo.jpg',
    'Ức Gà Áp Chảo Sốt Tiêu Xanh, Cơm Gạo Lứt và Rau Củ Luộc': 'https://vnhaisantuoingon.com/wp-content/uploads/2023/03/C%C6%A1m-g%E1%BA%A1o-l%E1%BB%A9t-%E1%BB%A9c-g%C3%A0-n%C6%B0%E1%BB%9Bng-m%E1%BA%ADt-ong.jpg',
    'Sữa Chua Hy Lạp Không Đường với Quả Mọng và Hạt Chia': 'https://media-cdn-v2.laodong.vn/storage/newsportal/2022/7/3/1063468/72A89CE3-C98C-45FD-A.jpeg',
    'Cá Hồi Nướng Sốt Chanh Mật Ong, Măng Tây và Khoai Lang Nghiền': 'https://duylinhfood.com/wp-content/uploads/2019/10/ca-hoi-sot-kem-chanh-1280x720.jpg',
    'Trứng Cuộn Thịt Băm Thơm Ngon': 'https://cdn.giaoducthoidai.vn/images/e68bd0ae7e0a4d2e84e451c6db68f2d41049cd649750106449638326b118a6d22827f12baa77878692823ff75305d143b3b67b2632bcc5f462775131a0effe51/111-MYNB.jpg.webp',
    'Ức Gà Nướng Mật Ong & Khoai Lang Nghiền': 'http://file.hstatic.net/200000700229/article/uc-ga-nuong-1_4c3f729735b24946ab780bd9c4d7b73b.jpeg',
    'Sữa Chua Hy Lạp Không Đường & Quả Mọng': 'https://storage.googleapis.com/onelife-public/blog.onelife.vn/2024/07/44-1024x683.png',
    'Thịt Bò Xào Nấm và Hành Tây Kèm Cơm Gạo Lứt': 'https://i.ytimg.com/vi/HCyL9n2pRw0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDZC7kL1tGAvFf89A3k_h3Oe3UFkQ',
    'Yến mạch hạt chia với quả mọng và hạt': 'https://media-cdn-v2.laodong.vn/storage/newsportal/2022/5/25/1048869/Sinh-To-Hat-Chia.jpg',
    'Ức gà nướng sốt chanh mật ong kèm khoai lang': 'https://cdn-www.vinid.net/657c840f-uc-ga-sot-mat-ong-1.jpg',
    'Cá hồi áp chảo với cơm gạo lứt và bơ': 'http://giavihanhphuc.com/files/folder_1785/images/com%20gao%20lut%20ca%20hoi%20ap%20chao%20sot%20sua%20chua-UHo600.jpg',
    'Sữa chua Hy Lạp không đường với một quả táo': 'https://maydonggoi.edu.vn/wp-content/uploads/2021/11/sua-chua-hy-lap-22-e1637123959893.jpg',
    'Trứng cuộn rau củ và ức gà xé': 'https://cdn.tgdd.vn/2021/10/CookDish/2-cach-lam-trung-cuon-rau-cu-thom-ngon-bo-duong-cho-gia-dinh-avt-1200x676.jpg',
    'Bún gạo lứt xào thịt bò và bông cải xanh': 'https://cdn.tgdd.vn/2021/04/CookProduct/2-1200x676-12.jpg',
    'Ức gà luộc xé phay với dưa chuột': 'https://i.ytimg.com/vi/kVIMDjoMXGY/maxresdefault.jpg',
    'Cá hồi áp chảo sốt chanh leo, khoai lang nướng và salad rau xanh': 'https://hungtruongsa.vn/wp-content/uploads/2025/10/thanh-pham-mon-ca-hoi-sot-chanh-leo.jpg',
    'Trứng ốp la, thịt gà tây xông khói và bánh mì nguyên cám': 'https://cdnv2.tgdd.vn/mwg-static/common/Common/cach-lam-banh-mi-trung-op-la-ngon-an-sang-kieu-moi-day-dui.jpg',
    'Ức gà nướng sốt tiêu đen với cơm gạo lứt': 'https://vnhaisantuoingon.com/wp-content/uploads/2023/03/C%C6%A1m-g%E1%BA%A1o-l%E1%BB%A9t-%E1%BB%A9c-g%C3%A0-n%C6%B0%E1%BB%9Bng-m%E1%BA%ADt-ong.jpg',
    'Sinh tố protein chuối và hạt chia': 'https://dodoto.vn/wp-content/uploads/2024/02/cach-lam-sinh-to-chuoi-va-hat-lanh-dodoto.vn_.jpg.webp',
    'Cá hồi áp chảo với khoai lang nghiền và măng tây nướng': 'https://photo.znews.vn/w660/Uploaded/tmuitg/2021_07_03/2.jpg',
    'Trứng Cuộn Thịt Nguội và Sữa Tươi': 'https://cdn.tgdd.vn/2021/11/CookDish/cach-lam-trung-cuon-thit-bo-rau-cu-ngon-bo-duong-de-lam-cho-avt-1200x676.jpg',
    'Cơm Gà Nướng Mật Ong': 'https://vietnamesefood.com.vn/pictures/VietnameseFood2/Grilled_Chicken_with_Honey_and_Boiled_Rice_Recipe_(C%C6%A1m_G%C3%A0_N%C6%B0%E1%BB%9Bng_M%E1%BA%ADt_Ong)_1.jpg',
    'Bò Lúc Lắc và Cơm': 'https://chopstixpho.net/uploads/article/com-bo-luc-lac-shaking-beef-rice-plate-1654328683.jpg',
    'Sinh Tố Chuối Bơ Đậu Phộng': 'https://media-cdn-v2.laodong.vn/storage/newsportal/2023/3/26/1171823/Chuoidau.jpg',
    'Yến mạch ấm với quả mọng và hạt chia': 'https://media-cdn-v2.laodong.vn/storage/newsportal/2022/5/25/1048869/Sinh-To-Hat-Chia.jpg',
    'Sữa chua Hy Lạp không đường với hạnh nhân': 'https://cdn.nhathuoclongchau.com.vn/unsafe/800x0/4_buoc_lam_sua_chua_hy_lap_tu_sua_hat_hanh_nhan_va_hat_dieu_2_a708e42be4.jpeg',
    'Salad gà nướng sốt cay chanh ớt': 'https://monngonmoingay.com/wp-content/uploads/2021/03/salad-ga-nuong-880.webp',
    'Táo và một nắm hạt điều': 'https://production-cdn.pharmacity.io/digital/original/plain/blog/d937c30b7df31c5c5584c04e13612e2c1747034965-scaled-1.jpg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAUYXZVMJM5QUYWSVO%2F20250612%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20250612T093842Z&X-Amz-SignedHeaders=host&X-Amz-Expires=600&X-Amz-Signature=e80e498ef442e306008a1489e563626858b15706118ca23efed22b54495c2fc9',
    'Cá hồi áp chảo với măng tây và khoai lang nghiền': 'https://photo.znews.vn/w660/Uploaded/tmuitg/2021_07_03/2.jpg',
    'Quýt tươi': 'https://cdn.tgdd.vn/2021/04/CookProduct/CacgiongquytcachchonquytngonvaphanbietquytTrungQuocVietNam1200-1200x676.jpg',
    'Trứng ốp la với bánh mì nguyên cám và bơ': 'https://cdn.tgdd.vn/Files/2020/07/21/1272477/cach-lam-sandwich-trai-bo-vua-ngon-vua-giau-nang-luong-cho-ngay-dai-202007211448472914.jpg',
    'Nước ép rau xanh': 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2023/10/16/uong-nuoc-ep-can-tay-dung-cach-1697431462427594391293.jpg',
    'Bún gà nướng cay': 'https://tayho.com/wp-content/uploads/2020/05/BunGaNuong.jpg',
    'Một nắm óc chó': 'https://saigonnhonews.com/wp-content/uploads/2025/05/Hat-oc-cho-Sahand-Babali-Unsplash-1280x734.jpg',
    'Ức gà nướng thảo mộc với rau củ luộc': 'https://img-global.cpcdn.com/recipes/99fc0a9a13888d9c/1200x630cq80/photo.jpg',
    'Sữa chua không đường': 'https://cdn.lottemart.vn/media/description/product/cache/8934673605823-DT-1.jpg.webp',
    'Sinh tố protein chuối bơ đậu phộng': 'https://nineshield.com.vn/wp-content/uploads/2024/06/sinh-to-bo-chuoi-dau-phong.jpg',
    'Cà phê đen không đường': 'https://drive.gianhangvn.com/image/ca-phe-hoa-tan-den-hop-50-goi-2660979j19274.jpg',
    'Súp bí đỏ kem với bánh mì đen': 'https://shop.annam-gourmet.com/pub/media/wysiwyg/pumpkin-soup-recipe-annam-gourmet-breads.jpg',
    'Thanh protein bar': 'https://cdnplaynutrition.b-cdn.net/wp-content/uploads/2025/08/kiotviet_37975309733a5a3f4d2af2d3896e9bab.jpg'
};

async function updateRemainingMealImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        let successCount = 0;
        let notFoundCount = 0;
        const notFoundMeals = [];

        // Update each meal
        for (const [mealName, imageUrl] of Object.entries(mealImageMap)) {
            try {
                const result = await Meal.findOneAndUpdate(
                    { name: mealName },
                    { $set: { image: imageUrl } },
                    { new: true }
                );

                if (result) {
                    console.log(`✅ Updated: "${mealName}"`);
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

        console.log('\n✅ Image update completed!');
        console.log('='.repeat(80));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run update
updateRemainingMealImages();

