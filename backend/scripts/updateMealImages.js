const mongoose = require('mongoose');
require('dotenv').config();
const Meal = require('../src/models/Meal');

// 100 image links provided by user
const imageLinks = [
    'https://media.gettyimages.com/id/1316145932/photo/table-top-view-of-spicy-food.jpg?s=612x612&w=gi&k=20&c=f-hk_ABcJZiEDNxUfAq-Tqxg0kdE01MbMWkBXhBobl0=',
    'https://c8.alamy.com/comp/2T5WMMP/brunch-table-setting-with-different-delicious-food-in-restaurant-2T5WMMP.jpg',
    'https://media.gettyimages.com/id/1829241109/photo/enjoying-a-brunch-together.jpg?s=612x612&w=gi&k=20&c=SFRYlKrWD84RMNV_c8fIliBep7WHoV-0s6IBc5FJsmE=',
    'https://media.gettyimages.com/id/531306158/photo/breakfast-feast.jpg?s=612x612&w=gi&k=20&c=gMJ9oySO0YtFrEAgf8DZilmYlONvvyjwtwfVZyCVZHM=',
    'https://t3.ftcdn.net/jpg/02/60/12/88/360_F_260128861_Q2ttKHoVw2VrmvItxyCVBnEyM1852MoJ.jpg',
    'https://media.gettyimages.com/id/1363638825/photo/vegan-plant-based-asian-food-recipes-with-rice-and-brown-rice-as.jpg?s=612x612&w=gi&k=20&c=QuqQ2wgvQazlitFvRhMuR2_nWZEf5CB3xa3FS4R0ffM=',
    'https://www.shutterstock.com/image-photo/diverse-buffet-featuring-traditional-dishes-260nw-2452665395.jpg',
    'https://media.istockphoto.com/id/637790866/photo/100-lamb-greek-burger.jpg?s=612x612&w=0&k=20&c=cYxRAfU7OdjJCK4M7dbH4YUIk7SGqETlDvONBEOATuw=',
    'https://res.cloudinary.com/hz3gmuqw6/image/upload/c_fill,f_auto,q_60,w_750/v1/classpop/679a768f61781',
    'https://t3.ftcdn.net/jpg/02/68/78/28/360_F_268782859_fmLoMazNerGOYNUwwLDZStYyaHOLQvyv.jpg',
    'https://c8.alamy.com/comp/F814TD/delicious-food-from-the-polynesian-buffet-at-the-gathering-of-kings-F814TD.jpg',
    'https://media.cnn.com/api/v1/images/stellar/prod/140430115517-06-comfort-foods.jpg?q=w_1280,h_720,x_0,y_0,c_fill',
    'https://img.freepik.com/premium-photo/delicious-food-platter_1199678-476.jpg?semt=ais_hybrid&w=740&q=80',
    'https://img.freepik.com/free-photo/fried-chicken-breast-cheese-tomato-french-fries-ketchup-green-salad-side-view-jpg_141793-1782.jpg?semt=ais_hybrid&w=740&q=80',
    'https://www.truefoodkitchen.com/wp-content/uploads/2025/09/Fall-Category.jpg',
    'https://www.tastingtable.com/img/gallery/scientists-say-this-is-why-we-love-looking-at-delicious-food-pics/l-intro-1664833413.jpg',
    'https://i.ytimg.com/vi/BEyloCJlpm0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCoEPxZq8bT2MZxRWDOTPrG6Zx8Nw',
    'https://www.shutterstock.com/image-photo/table-scene-variety-delicious-foods-260nw-2274282793.jpg',
    'https://loveincorporated.blob.core.windows.net/contentimages/gallery/a0919621-f148-488d-8a74-e1f67224e2b5-deliciousdishes_periperi_ss.jpg',
    'https://media.istockphoto.com/id/944478708/photo/couple-eating-lunch-with-fresh-salad-and-appetizers.jpg?s=612x612&w=0&k=20&c=xZdIIHvakQrYCbR59RM8nrhEnw-xu4nE-BOeOhQPnck=',
    'https://thumbs.dreamstime.com/b/dinner-table-cafe-above-view-delicious-food-set-four-restaurant-100975067.jpg',
    'https://images.food52.com/aEUW6boFkYt1kWbhy1mMrs5XZZs=/37372633-86db-411c-ab88-7359b37af3a6--2018-0207_netflix_pork-tacos_f52-recipe-hero_3x2_james-ransom_172.jpg',
    'https://static01.nyt.com/images/2021/11/10/dining/03mostpop-roundup-19/merlin_196956333_02cc2407-e7c1-469c-880f-6d022f97593c-articleLarge.jpg?quality=75&auto=webp&disable=upscale',
    'https://media.istockphoto.com/id/1165399909/photo/delicious-meal-on-a-black-plate-top-view-copy-space.jpg?s=612x612&w=0&k=20&c=vrMzS4pY_QjiDtCzpVE3ClKqbU636fb4CKH0nlsduC4=',
    'https://media.cnn.com/api/v1/images/stellar/prod/191206115304-00-egyptian-ramadan-feast-photo-courtesy-emeco-travel-etpb.jpg?q=w_1110,c_fill',
    'https://res.cloudinary.com/hz3gmuqw6/image/upload/c_fill,q_30,w_750/f_auto/tk-traditional-indian-foods-to-taste-in-2022-phpEXAXNS',
    'https://i0.wp.com/theawkwardtraveller.com/wp-content/uploads/2024/12/Generic-Image-Size-2024-12-07T230103.871.png?resize=500%2C375&ssl=1',
    'https://media.cnn.com/api/v1/images/stellar/prod/170302150230-som-tam.jpg?q=w_1110,c_fill',
    'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_487/k%2FPhoto%2FRecipes%2F2023-12-honey-garlic-salmon%2Fhoney-garlic-salmon-248-horizontal',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGVsaWNpb3VzJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D',
    'https://thumbs.dreamstime.com/b/friends-eating-dinner-table-above-view-four-people-delicious-food-festive-cafe-celebrating-holidays-103732480.jpg',
    'https://images.unsplash.com/photo-1628294895950-9805252327bc?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZGVsaWNpb3VzJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D',
    'https://www.shutterstock.com/image-photo/variety-delicious-dishes-on-table-600nw-2565841051.jpg',
    'https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_4:3/k%2FPhoto%2FRecipes%2F2024-11-lasagna-recipe%2Flasagna-recipe-115',
    'https://i.ytimg.com/vi/GawEradT2Jo/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAzpvVk0UAgVAENya2qO_DbxVDYrA',
    'https://media.gettyimages.com/id/2153041320/photo/bowl-with-healthy-food-fresh-vegetables-beef-and-rice-in-a-big-plate-sunny-day-serving-a-meal.jpg?s=612x612&w=gi&k=20&c=wy5-yJykYc08EDF0vZKMWvG3oiLcZDH8zLidwMfYmqs=',
    'https://img.freepik.com/premium-photo/many-different-delicious-dishes-table-restaurant_128442-270.jpg?semt=ais_hybrid&w=740&q=80',
    'https://www.shutterstock.com/image-photo/table-full-various-fresh-food-600nw-2253583819.jpg',
    'https://media.gettyimages.com/id/1428412216/photo/a-male-chef-pouring-sauce-on-meal.jpg?s=612x612&w=gi&k=20&c=4-pLQvOkObmweltR5C77m-eL2KqwLxnU8ArvmTeoEek=',
    'https://t3.ftcdn.net/jpg/02/55/53/44/360_F_255534476_n8JzjZtzOFW5g3TXTLMd6QGVnToi6hqj.jpg',
    'https://img.freepik.com/premium-photo/top-view-various-freshly-made-delicious-food-plates-gray-surface_665346-13767.jpg?semt=ais_hybrid&w=740&q=80',
    'https://media.gettyimages.com/id/1428409514/photo/a-male-chef-serving-a-fine-dining-dish-in-a-restaurant.jpg?s=612x612&w=gi&k=20&c=JZgoT39tLGLahJtZgYFNEKbbjnc5tf79063YA6oYto0=',
    'https://byfood.b-cdn.net/api/public/assets/9595/content?optimizer=image',
    'https://steemitimages.com/DQmccKzqNJG1jFxNpVf4ZpoAjcBHKd4cM1jkUmw99YuKiVb/image.png',
    'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_548/k%2FPhoto%2FRecipes%2F2025-02-creamy-broccoli-pasta-bake%2Fcreamy-broccoli-pasta-bake-683_1',
    'https://c8.alamy.com/comp/2Y5WX1G/outdoor-picnic-table-decorated-for-a-birthday-celebration-with-a-happy-50th-birthday-banner-and-trays-of-delicious-food-in-the-warm-sunlight-florida-usa-2Y5WX1G.jpg',
    'https://t3.ftcdn.net/jpg/00/70/83/86/360_F_70838661_7vARopX4m7Q9etR7mVDvkFTMrp1v0ZYx.jpg',
    'https://c8.alamy.com/comp/2H8HCBP/composite-image-of-various-delicious-food-at-thanksgiving-party-and-autumn-leaves-copy-space-2H8HCBP.jpg',
    'https://c8.alamy.com/comp/2C8TP8J/top-view-of-delicious-food-with-various-ingredients-on-round-table-in-a-restaurant-or-hotel-high-quality-photo-2C8TP8J.jpg',
    'https://www.shutterstock.com/image-photo/sizzling-steak-on-hot-grill-600nw-2647428111.jpg',
    'https://thumbs.dreamstime.com/b/various-traditional-dishes-different-countries-served-colorful-plates-ethnic-food-presentation-cookery-diversity-gastronomy-367426375.jpg',
    'https://www.shutterstock.com/image-photo/millcreek-utah-usa-may-29th-260nw-2653045125.jpg',
    'https://media.istockphoto.com/id/1217807835/photo/this-is-delicious.jpg?s=612x612&w=0&k=20&c=bZwHAut0-1C1ysN7kSF5-ApSe1SHDTNUVNRqlRgftmo=',
    'https://www.shutterstock.com/image-photo/png-concept-delicious-food-pasta-260nw-2487521433.jpg',
    'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=10235360390369733',
    'https://i.ytimg.com/vi/jmRn98gIzoM/maxresdefault.jpg',
    'https://c8.alamy.com/comp/2H8HCBK/composite-image-of-people-having-delicious-food-at-thanksgiving-party-and-autumn-leaves-copy-space-2H8HCBK.jpg',
    'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=10163175871789154',
    'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1019587296281767',
    'https://www.southernliving.com/thmb/YhD2FppFCcWaiOlLgvKHXzaXikg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Sweet_Potato_Casserole_012-645181ab4cab4adba3bf043ee4994c54.jpg',
    'https://lookaside.instagram.com/seo/google_widget/crawler/?media_id=3726934979608431130',
    'https://static01.nyt.com/images/2025/11/13/multimedia/13FD-HEALTHY-TG-ROUNDUP-topart-roastedlemoncaperbrusselssprouts-bthv/13FD-HEALTHY-TG-ROUNDUP-topart-roastedlemoncaperbrusselssprouts-bthv-superJumbo.jpg?format=pjpg&quality=75&auto=webp&disable=upscale',
    'https://migrationology.com/wp-content/uploads/2016/04/jordanian-food-maqluba.jpg',
    'https://www.japanhousela.com/wp-content/uploads/2025/06/Brunch-Sampuru-Food-Replicas.jpg',
    'https://wallpapers.com/images/featured/delicious-food-pictures-i5wjpvjqrk3qroy0.jpg',
    'https://loveincorporated.blob.core.windows.net/contentimages/gallery/cfa36edf-68d9-49e7-b4f7-6e0c034dc51e-deliciousdishes_sushi_ss.jpg',
    'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_487/k%2FPhoto%2FRecipes%2F2023-12-slow-cooker-beef-stew%2Fslow-cooker-beef-stew-129-horizontal',
    'https://amazingfoodanddrink.com/wp-content/uploads/2023/12/depositphotos_372549536-stock-photo-top-view-korean-traditional-dishes.webp',
    'https://www.tastemade.com/_next/image?url=https%3A%2F%2Fassets.tastemadecdn.net%2Fimages%2F10380d%2F309d82495d837af2dead%2Fb6b5a0.jpg&w=3840&q=75',
    'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2021/02/25/0/FNK_Chana-Masala_H2_s4x3.jpg.rend.hgtvcom.616.462.85.suffix/1614271965516.webp',
    'https://freedesignfile.com/upload/2017/08/The-table-is-full-of-delicious-food-Stock-Photo-01.jpg',
    'https://www.tamron.com/article/article_file/file/article-how-to-take-delicious-looking-food-photos-en/01-en.webp',
    'https://img.taste.com.au/usDoXvoa/taste/2018/01/healthy-chicken-chow-mein-134805-1.jpg',
    'https://www.japanhousela.com/wp-content/uploads/2025/06/Looks-Delicious-London-Exhibition-40.jpg',
    'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2021/09/23/0/FNK_Skillet-Chicken-Thighs_H1_s4x3.jpg.rend.hgtvcom.616.462.85.suffix/1632420651769.webp',
    'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1507935187245229',
    'https://img.freepik.com/free-photo/delicious-indian-food-tray_23-2148723505.jpg',
    'https://thumbs.dreamstime.com/b/nigerian-food-delicious-efo-riro-soup-white-plate-nigerian-food-delicious-efo-riro-soup-white-plate-dining-concept-n-185024627.jpg',
    'https://www.mashed.com/img/gallery/indian-dishes-you-wont-find-in-india/intro-1687200720.jpg',
    'https://static.vecteezy.com/system/resources/thumbnails/049/395/831/small/delicious-steaming-bowl-of-ramen-with-perfectly-placed-toppings-foodgraphy-free-photo.jpg',
    'https://img.lovepik.com/free-png/20210922/lovepik-a-plate-of-delicious-food-png-image_401087379_wh1200.png',
    'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_548/tk%2Fphoto%2F2025%2F08-2025%2F2025-08-butternut-squash-curry%2Fbutternut-squash-curry-121',
    'https://i0.wp.com/theawkwardtraveller.com/wp-content/uploads/2024/12/Generic-Image-Size-2024-12-07T222633.094.png?resize=500%2C375&ssl=1',
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    'https://thumbs.dreamstime.com/b/indian-vegetarian-food-flat-lay-white-rice-matar-paneer-naan-roti-aloo-gobi-delicious-bowls-plates-fresh-meal-rustic-387029432.jpg',
    'https://blog.resy.com/wp-content/uploads/2024/03/Meju-image4-2000x1125.jpeg',
    'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1172685208239180',
    'https://luggageandlipstick.com/wp-content/uploads/2021/10/0-Jordan-food_Patti-Morrow_luggageandlipstick.com_.jpg',
    'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_548/k%2FPhoto%2FRecipes%2F2024-05-filipino-barbecue-chicken%2Ffilipino-barbecue-chicken-315-horizontal',
    'https://img-cdn.tnwcdn.com/image?fit=1280%2C720&url=https%3A%2F%2Fcdn0.tnwcdn.com%2Fwp-content%2Fblogs.dir%2F1%2Ffiles%2F2019%2F01%2Faifood.jpg&signature=be99f464b6048986b23d5879c21d3960',
    'https://img.freepik.com/free-photo/top-view-table-full-delicious-food-composition_23-2149141353.jpg?semt=ais_hybrid&w=740&q=80',
    'https://www.bombaykitchen.com/wp-content/uploads/2022/09/Make-these-Delicious-Kathiyawadi-Dishes-at-home-with-Namkeens-from-image-768x561-1.webp',
    'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1121751984965253',
    'https://thumbs.dreamstime.com/b/african-chef-delicious-attractive-young-pasta-dish-32896684.jpg',
    'https://res.cloudinary.com/jerrick/image/upload/d_642250b563292b35f27461a7.png,f_jpg,fl_progressive,q_auto,w_1024/64e5ad7354da90001d121efe.jpg',
    'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_548/k%2FPhoto%2FSeries%2F2020-06-Snapshot-Spaghetti-Squash%2FSpaghetti-Squash-Kale-Stuffed%2FSnapshot_Spaghetti-Squash-Kale-Stuffed985_d2ce9d_landscape',
    'https://res.cloudinary.com/hz3gmuqw6/image/upload/c_fill,q_30,w_750/f_auto/middle-eastern-foods-phpRsP1Pn',
    'https://noblepig.com/images/2013/02/80-Easy-Dinners-You-Can-Make-Tonight.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/500px-Good_Food_Display_-_NCI_Visuals_Online.jpg'
];

async function updateMealImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all meals
        const allMeals = await Meal.find({});
        console.log(`📊 Found ${allMeals.length} meals in database`);

        if (allMeals.length === 0) {
            console.log('❌ No meals found in database');
            process.exit(1);
        }

        // Update each meal with a new image
        let updatedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < allMeals.length; i++) {
            const meal = allMeals[i];
            // Cycle through image links if we have more meals than images
            const imageIndex = i % imageLinks.length;
            const newImage = imageLinks[imageIndex];

            try {
                await Meal.findByIdAndUpdate(meal._id, { image: newImage });
                updatedCount++;
                console.log(`✅ Updated meal "${meal.name}" with image ${imageIndex + 1}/${imageLinks.length}`);
            } catch (error) {
                console.error(`❌ Error updating meal "${meal.name}":`, error.message);
                skippedCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`✅ Successfully updated: ${updatedCount} meals`);
        if (skippedCount > 0) {
            console.log(`⚠️  Skipped: ${skippedCount} meals`);
        }
        console.log(`📸 Total images used: ${imageLinks.length}`);
        console.log(`🔄 Images will cycle if there are more meals than images`);

        console.log('\n✅ Image update completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating meal images:', error);
        process.exit(1);
    }
}

// Run update
updateMealImages();

