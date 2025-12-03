require('dotenv').config();
const mongoose = require('mongoose');
const Meal = require('../src/models/Meal');

// Map tên món với link ảnh mới
const mealImageMap = {
    'Phở Gà Thanh Đạm': 'https://cdn.zsoft.solutions/poseidon-web/app/media/uploaded-files/200823-cach-lam-pho-ga-buffet-poseidon.jpg',
    'Sinh tố Chuối Yến Mạch': 'https://thanhanfood.com.vn/wp-content/uploads/2024/08/cach-lam-yen-mach-sua-chua-an-sang-4.jpg',
    'Cơm Gạo Lứt, Cá Diêu Hồng Hấp Gừng, Rau Luộc': 'https://img-global.cpcdn.com/recipes/e276c175d20ca9b3/1200x630cq80/photo.jpg',
    'Khoai Lang Luộc': 'https://i.ytimg.com/vi/ybF0RQdDAK8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBF5flrR4aNmIyGAex6Vf_GC3zkLQ',
    'Gỏi Cuốn Tôm Thịt': 'https://i.ytimg.com/vi/w34Qnc-9KBU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAzXE6ASDMpVme1qsjbkQx4v-KaYA',
    'Sữa Chua Không Đường với Hạt Chia': 'https://cdn.tgdd.vn/2021/09/CookDish/cach-lam-sua-chua-hat-chia-giam-can-tot-cho-suc-khoe-avt-1200x676.jpg',
    'Bánh mì trứng ốp la và bơ đậu phộng': 'https://img-global.cpcdn.com/recipes/b97fd01daca41b4e/1200x630cq80/photo.jpg',
    'Sinh tố chuối yến mạch protein': 'https://cdn.tgdd.vn//News/1499794//sinh-to-yen-mach-giam-can-voi-chuoi-845x564.jpg',
    'Cơm gạo lứt ức gà nướng và rau xanh': 'https://i.ytimg.com/vi/m8V3ULygdoI/maxresdefault.jpg',
    'Sữa chua Hy Lạp với hạt chia và quả mọng': 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/7/3/1063468/72A89CE3-C98C-45FD-A.jpeg',
    'Cá hồi áp chảo với khoai lang nghiền và măng tây': 'https://img-global.cpcdn.com/recipes/581f3c5dbd8e49dd/1200x630cq80/photo.jpg',
    'Trứng luộc và một nắm hạnh nhân': 'https://i.ytimg.com/vi/CoY8-hZakcg/maxresdefault.jpg',
    'Trứng cuộn rau củ và ức gà áp chảo': 'https://cdn.tgdd.vn/2020/12/CookProduct/Untitled-8-1200x676.jpg',
    'Cơm gạo lứt với bò xào bông cải xanh': 'https://img-global.cpcdn.com/recipes/55dab39ed392be74/1200x630cq80/photo.jpg',
    'Sinh tố protein chuối yến mạch': 'https://thanhanfood.com.vn/wp-content/uploads/2024/08/cach-lam-yen-mach-sua-chua-an-sang-4.jpg',
    'Salad quinoa ức gà nướng và rau củ': 'https://i.ytimg.com/vi/PHMmoBKlYJE/sddefault.jpg',
    'Hạnh nhân và óc chó rang': 'https://nugafood.vn/wp-content/uploads/2023/06/hanh-nhan-va-oc-cho-2.jpg',
    'Trứng cuộn rau củ và ức gà': 'https://cdn.tgdd.vn/2021/10/CookDish/2-cach-lam-trung-cuon-rau-cu-thom-ngon-bo-duong-cho-gia-dinh-avt-1200x676.jpg',
    'Salad ức gà nướng và hạt quinoa': 'https://beptruong.edu.vn/wp-content/uploads/2017/11/salad-uc-ga.jpg',
    'Khoai lang nướng và bơ đậu phộng': 'https://monchayvietnam.wordpress.com/wp-content/uploads/2015/05/khoailangnuong.jpg?w=640',
    'Bít tết bò với măng tây và khoai tây nghiền bông cải': 'https://core.afg.vn/uploads/images/STEAK-&-PRAWNS-2.jpg',
    'Bát Yến Mạch Chuối Hạt Chia': 'https://media.istockphoto.com/id/1069729708/vi/anh/y%E1%BA%BFn-m%E1%BA%A1ch-chu%E1%BB%91i-qua-%C4%91%C3%AAm-quinoa-b%C3%A1nh-pudding-h%E1%BA%A1t-chia-%C4%91%C6%B0%E1%BB%A3c-trang-tr%C3%AD-v%E1%BB%9Bi-l%C3%A1t-chu%E1%BB%91i-t%C6%B0%C6%A1i-v%C3%A0-s%C3%B4-c%C3%B4.jpg?s=612x612&w=is&k=20&c=DwdC0cDn1pEwwAfE7a4eX3C5nqc8vZ3QNtz_o6UyXLU=',
    'Sữa Chua Không Đường với Quả Mọng': 'https://media.thuonghieucongluan.vn/resize_640x360/uploads/2025/9/15/sua-1757908841.jpg',
    'Ức Gà Nướng, Cơm Gạo Lứt và Bông Cải Xanh Hấp': 'https://i.ytimg.com/vi/m8V3ULygdoI/sddefault.jpg',
    'Trứng Luộc và Táo': 'https://lirp.cdn-website.com/ad0ecff6/dms3rep/multi/opt/imagsgdxe-640w.png',
    'Cá Hồi Áp Chảo và Salad Rau Xanh': 'https://i.ytimg.com/vi/0qlp4bnlUMw/maxresdefault.jpg',
    'Hạnh Nhân Rang Muối': 'https://deluxnuts.com/wp-content/uploads/2018/12/T%C3%9AI-KRAFT-H%E1%BA%A0NH-NH%C3%82N-RANG-MU%E1%BB%90I-40G-1024x1024.jpg',
    'Bít Tết Bò Trứng Ốp La Kèm Khoai Tây': 'https://ngochieu.com.vn/l4z3wp16k6xbuq2p/bit-tet-trung-op-la-va-khoai-tay-chien-khon-kho-cuong.jpg',
    'Thịt Gà Luộc Xé Sợi': 'https://helenrecipes.com/wp-content/uploads/2018/02/Ga-luoc-2-640x370-1.jpg',
    'Cơm Gà Nướng Mật Ong': 'https://vietnamesefood.com.vn/pictures/VietnameseFood2/Grilled_Chicken_with_Honey_and_Boiled_Rice_Recipe_(C%C6%A1m_G%C3%A0_N%C6%B0%E1%BB%9Bng_M%E1%BA%ADt_Ong)_1.jpg',
    'Thịt Bò Khô Tự Làm': 'https://i.ytimg.com/vi/Gzu0lz2STsU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCx40JcWuetRokAl9IRHdcSJBUktw',
    'Cá Hồi Áp Chảo Kèm Cơm': 'https://cdn.tgdd.vn/2021/05/CookProduct/mafuddejp1200-1200x676.jpg',
    'Ức Gà Luộc Lạnh Xé Nhỏ': 'https://cdn-www.vinid.net/41d6e60d-cover-16.jpg',
    'Bún Gà Trộn Rau Thơm': 'https://i0.wp.com/mmbonappetit.com/wp-content/uploads/2024/07/Pho-ga-tron-featured.jpg?resize=800%2C530&ssl=1',
    'Sữa chua không đường với trái cây tươi': 'https://kemmerino.com/wp-content/uploads/2020/07/IR5nfnFmqvncZkhFT7qbBlSlcGr6hZ9sy3GqdmbP.jpeg',
    'Cá Diêu Hồng Hấp Gừng, Cơm Gạo Lứt và Rau Cải Xanh Luộc': 'https://vcdn1-giadinh.vnecdn.net/2022/12/29/Bc4Thnhphm4-1672298218-7464-1672298342.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=ZgCFMvF_OnS2bcroAGF7mw',
    'Nước ép ổi và hạt điều rang': 'https://cdn.nhathuoclongchau.com.vn/unsafe/800x0/nuoc_ep_oi_co_tac_dung_gi_3_2d202b378c.jpg',
    'Canh Bí Đao Thịt Băm và Rau Luộc': 'https://i.ytimg.com/vi/aqj5-MlQNj0/sddefault.jpg',
    'Táo đỏ nhỏ và trà hoa đậu biếc': 'https://bachhoaxelam.com/wp-content/uploads/2021/12/100-Cach-pha-tra-hoa-cuc-tao-do-ky-tu.jpg',
    'Phở Gà Nấm': 'https://i.ytimg.com/vi/yS9lsukJgSU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB5O83PhIEDo8BGg91OV3N9sEylRQ',
    'Sinh tố Chuối Bơ Đậu phộng': 'https://www.datfoods.vn/storage/2024/03/Post-recipe-peanut-butter-banana-smothie.webp',
    'Cơm Gạo lứt với Cá Hồi Áp Chảo và Rau Luộc': 'https://mrecohealthy.com/wp-content/uploads/2022/11/photo-1.png',
    'Sữa chua không đường với trái cây và hạt': 'https://kemmerino.com/wp-content/uploads/2020/07/IR5nfnFmqvncZkhFT7qbBlSlcGr6hZ9sy3GqdmbP.jpeg',
    'Gà Xào Sả Ớt với Bông Cải Xanh': 'https://cdn.tgdd.vn/2020/10/CookRecipe/Avatar/bong-cai-xao-thit-ga-thumbnail.jpg',
    'Trứng luộc và Sữa tươi không đường': 'https://yobite.vn/wp-content/uploads/2024/11/Website-Yobite-36.png',
    'Bún Gà Trộn Rau Củ': 'https://133748497.cdn6.editmysite.com/uploads/1/3/3/7/133748497/3UONFWW3VHFRWKPTJENW52E4.jpeg?width=2400&optimize=medium',
    'Sinh Tố Chuối Yến Mạch': 'https://thanhanfood.com.vn/wp-content/uploads/2024/08/cach-lam-yen-mach-sua-chua-an-sang-4.jpg',
    'Cơm Gạo Lứt Cá Hồi Áp Chảo và Salad Rau Xanh': 'https://i.ytimg.com/vi/QCUTNVjOGqE/maxresdefault.jpg',
    'Trứng Luộc và Dưa Chuột': 'https://toshiko.vn/storage/images/2021/10/giam-can-voi-trung-va-dua-leo-2.jpg',
    'Thịt Bò Xào Bông Cải Xanh': 'https://i.ytimg.com/vi/yezaMSXSlmU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBnGvI04Uv-yg6ixLSUpFQ7nIt89w',
    'Yến Mạch Trứng Ốp La Rau Cải Bó Xôi': 'https://daotaovuabep.com/wp-content/uploads/2024/11/trung-cai-bo-xoi.jpg',
    'Sinh Tố Chuối Cải Bó Xôi Hạt Chia': 'https://cdn.tgdd.vn/2020/09/CookProduct/1-1200x676-31.jpg',
    'Cơm Gạo Lứt Ức Gà Xào Bông Cải Xanh Canh Mồng Tơi': 'https://img-global.cpcdn.com/recipes/0806f1897e2e5b20/1200x630cq80/photo.jpg',
    'Sữa Chua Không Đường Quả Mọng Hạt Điều': 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2025/8/13/82f2053c94291c774538-1755073941856947720249.jpg',
    'Trứng Luộc': 'https://i.ytimg.com/vi/uRbEkB3kf-o/sddefault.jpg',
    'Phở Bò Thập Cẩm': 'https://phovihoang.vn/wp-content/uploads/2018/01/48267.png',
    'Sinh tố Chuối Yến Mạch Bơ Đậu Phộng': 'https://nineshield.com.vn/wp-content/uploads/2024/06/sinh-to-bo-chuoi-dau-phong.jpg',
    'Cơm Gà Nướng Mật Ong với Rau Củ Luộc': 'https://i.ytimg.com/vi/tR5Q0ZhNnTA/maxresdefault.jpg',
    'Khoai Lang Luộc và Trứng Gà Luộc': 'https://bizweb.dktcdn.net/100/011/344/files/thuc-don-giam-can-7-ngay-voi-trung-khoai-lang.jpg?v=1653021389865',
    'Gà Xào Sả Ớt với Rau Muống Luộc và Cơm Gạo Lứt': 'https://bepsangtao.com/wp-content/uploads/2025/09/com-gao-lut-ga-gung-sa-ot.webp',
    'Sữa Chua Không Đường với Hạt Chia và Trái Cây': 'https://cdn.tgdd.vn/Files/2021/08/27/1378152/cach-lam-sua-chua-hat-chia-trai-cay-ngu-coc-du-vi-thom-ngon-cuc-de-tai-nha-202209071425505722.jpg'
};

const updateMealImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billions_gym', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔄 Đang cập nhật ảnh cho các món ăn do AI tạo...\n');

        let updated = 0;
        let notFound = 0;
        const notFoundMeals = [];

        // Lấy tất cả các món do AI tạo
        const aiMeals = await Meal.find({
            isAIRecommended: true,
            status: 'ACTIVE'
        }).select('name image');

        console.log(`📋 Tìm thấy ${aiMeals.length} món do AI tạo\n`);

        // Cập nhật từng món
        for (const meal of aiMeals) {
            const newImageUrl = mealImageMap[meal.name];

            if (newImageUrl) {
                await Meal.updateOne(
                    { _id: meal._id },
                    { $set: { image: newImageUrl } }
                );
                console.log(`✅ Đã cập nhật: "${meal.name}"`);
                console.log(`   Ảnh mới: ${newImageUrl.substring(0, 80)}...\n`);
                updated++;
            } else {
                console.log(`⚠️  Không tìm thấy ảnh cho: "${meal.name}"`);
                notFoundMeals.push(meal.name);
                notFound++;
            }
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 KẾT QUẢ:');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ Đã cập nhật: ${updated} món`);
        console.log(`⚠️  Không tìm thấy: ${notFound} món`);

        if (notFoundMeals.length > 0) {
            console.log('\n📝 Danh sách món chưa có ảnh:');
            notFoundMeals.forEach((name, index) => {
                console.log(`   ${index + 1}. ${name}`);
            });
        }

        console.log('═══════════════════════════════════════════════════════\n');

        await mongoose.disconnect();
        console.log('✅ Hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

updateMealImages();

