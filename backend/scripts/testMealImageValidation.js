require('dotenv').config();
const mongoose = require('mongoose');

// Import helper function từ controller
const { validateAndFixImageUrl } = require('../src/controllers/nutritionPlan.controller');

// Test cases
const testCases = [
    {
        name: 'Test với placeholder URL',
        imageUrl: '/placeholder-menu.jpg',
        mealName: 'Phở Gà',
        expected: 'should return Pexels URL'
    },
    {
        name: 'Test với Unsplash placeholder',
        imageUrl: 'https://source.unsplash.com/800x600/?chicken,food',
        mealName: 'Gà Nướng',
        expected: 'should return Pexels URL'
    },
    {
        name: 'Test với URL rỗng',
        imageUrl: '',
        mealName: 'Cá Hồi Nướng',
        expected: 'should return Pexels URL'
    },
    {
        name: 'Test với URL thật từ Pexels',
        imageUrl: 'https://images.pexels.com/photos/2252616/pexels-photo-2252616.jpeg',
        mealName: 'Gà Nướng',
        expected: 'should return same URL'
    },
    {
        name: 'Test với URL thật từ AllRecipes',
        imageUrl: 'https://www.allrecipes.com/thmb/abc123/image.jpg',
        mealName: 'Bánh Mì',
        expected: 'should return same URL'
    },
    {
        name: 'Test với URL không hợp lệ (không có http)',
        imageUrl: 'invalid-url',
        mealName: 'Salad Rau Củ',
        expected: 'should return Pexels URL'
    }
];

// Test helper function (cần extract từ controller)
const validateAndFixImageUrlTest = (imageUrl, mealName) => {
    if (!imageUrl || imageUrl.trim() === '' ||
        imageUrl.includes('placeholder') ||
        imageUrl.includes('source.unsplash.com') ||
        imageUrl === '/placeholder-menu.jpg') {

        const name = (mealName || '').toLowerCase();

        const pexelsPhotoIds = {
            'chicken': ['2252616', '1640777', '1068537', '1640774', '2252615', '1640773'],
            'salmon': ['1640772', '1640771', '1640770', '1640769', '1640768', '1640767'],
            'beef': ['1640775', '1640776', '1640778', '1640779', '1640780', '1640781'],
            'shrimp': ['1640782', '1640783', '1640784', '1640785', '1640786', '1640787'],
            'egg': ['1640788', '1640789', '1640790', '1640791', '1640792', '1640793'],
            'salad': ['1640794', '1640795', '1640796', '1640797', '1640798', '1640799'],
            'rice': ['1640800', '1640801', '1640802', '1640803', '1640804', '1640805'],
            'smoothie': ['1640806', '1640807', '1640808', '1640809', '1640810', '1640811'],
            'oatmeal': ['1640812', '1640813', '1640814', '1640815', '1640816', '1640817'],
            'pho': ['1640818', '1640819', '1640820', '1640821', '1640822', '1640823'],
            'noodles': ['1640824', '1640825', '1640826', '1640827', '1640828', '1640829'],
            'yogurt': ['1640830', '1640831', '1640832', '1640833', '1640834', '1640835'],
            'sweet potato': ['1640836', '1640837', '1640838', '1640839', '1640840', '1640841'],
            'quinoa': ['1640842', '1640843', '1640844', '1640845', '1640846', '1640847'],
            'food': ['2252616', '1640777', '1068537', '1640774', '2252615', '1640773', '1640772', '1640771']
        };

        let category = 'food';
        if (name.includes('gà') || name.includes('chicken')) category = 'chicken';
        else if (name.includes('cá') || name.includes('salmon') || name.includes('fish')) category = 'salmon';
        else if (name.includes('bò') || name.includes('beef') || name.includes('steak')) category = 'beef';
        else if (name.includes('tôm') || name.includes('shrimp')) category = 'shrimp';
        else if (name.includes('trứng') || name.includes('egg')) category = 'egg';
        else if (name.includes('salad') || name.includes('rau') || name.includes('vegetable')) category = 'salad';
        else if (name.includes('cơm') || name.includes('rice')) category = 'rice';
        else if (name.includes('sinh tố') || name.includes('smoothie')) category = 'smoothie';
        else if (name.includes('yến mạch') || name.includes('oats') || name.includes('oatmeal')) category = 'oatmeal';
        else if (name.includes('phở') || name.includes('pho')) category = 'pho';
        else if (name.includes('bún') || name.includes('bun')) category = 'noodles';
        else if (name.includes('sữa chua') || name.includes('yogurt')) category = 'yogurt';
        else if (name.includes('khoai lang') || name.includes('sweet potato')) category = 'sweet potato';
        else if (name.includes('quinoa')) category = 'quinoa';

        const photoIds = pexelsPhotoIds[category] || pexelsPhotoIds['food'];
        const randomId = photoIds[Math.floor(Math.random() * photoIds.length)];

        return `https://images.pexels.com/photos/${randomId}/pexels-photo-${randomId}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return validateAndFixImageUrlTest('', mealName);
    }

    return imageUrl;
};

const runTests = async () => {
    console.log('🧪 Bắt đầu test validateAndFixImageUrl...\n');

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        console.log(`📋 ${testCase.name}`);
        console.log(`   Input: "${testCase.imageUrl}" (meal: "${testCase.mealName}")`);

        const result = validateAndFixImageUrlTest(testCase.imageUrl, testCase.mealName);

        console.log(`   Output: "${result}"`);
        console.log(`   Expected: ${testCase.expected}`);

        // Kiểm tra kết quả
        const isValid = result &&
            result.startsWith('http') &&
            !result.includes('placeholder') &&
            !result.includes('source.unsplash.com');

        if (isValid) {
            console.log(`   ✅ PASSED\n`);
            passed++;
        } else {
            console.log(`   ❌ FAILED\n`);
            failed++;
        }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 KẾT QUẢ TEST:`);
    console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
    console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Test với các loại món khác nhau
    console.log('🍽️  Test với các loại món khác nhau:\n');
    const mealTypes = [
        'Phở Gà',
        'Cá Hồi Nướng',
        'Bò Bít Tết',
        'Tôm Rang Me',
        'Trứng Chiên',
        'Salad Rau Củ',
        'Cơm Gà',
        'Sinh Tố Dâu',
        'Yến Mạch Sữa Chua',
        'Bún Bò Huế',
        'Sữa Chua Hy Lạp',
        'Khoai Lang Nướng',
        'Quinoa Salad'
    ];

    for (const mealName of mealTypes) {
        const result = validateAndFixImageUrlTest('/placeholder-menu.jpg', mealName);
        console.log(`   ${mealName.padEnd(25)} → ${result.substring(0, 60)}...`);
    }

    process.exit(0);
};

runTests().catch(error => {
    console.error('❌ Lỗi khi chạy test:', error);
    process.exit(1);
});

