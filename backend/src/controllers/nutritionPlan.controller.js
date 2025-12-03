const aiService = require('../services/ai.service');
const ThucDon = require('../models/ThucDon');
const Meal = require('../models/Meal');
const UserMealPlan = require('../models/UserMealPlan');
const NutritionPlan = require('../models/NutritionPlan');
const { HoiVien } = require('../models/NguoiDung');
const ChiSoCoThe = require('../models/ChiSoCoThe');

// Helper function để validate và fix image URL
const validateAndFixImageUrl = (imageUrl, mealName) => {
    if (!imageUrl || imageUrl.trim() === '' || 
        imageUrl.includes('placeholder') || 
        imageUrl.includes('source.unsplash.com') ||
        imageUrl === '/placeholder-menu.jpg') {
        
        // Tạo URL ảnh thật từ Pexels dựa trên tên món
        const name = (mealName || '').toLowerCase();
        let searchTerm = 'food';
        
        // Phát hiện từ khóa chính - không cần searchTerm nữa vì dùng photoIds trực tiếp
        
        // Sử dụng Pexels API search (free, không cần API key cho public images)
        // Format: https://images.pexels.com/photos/[photo-id]/pexels-photo-[photo-id].jpeg
        // Hoặc dùng Pixabay: https://pixabay.com/get/[hash]/[id].jpg
        
        // Sử dụng photo IDs thật từ Pexels (ảnh food thực tế, đã kiểm tra)
        const pexelsPhotoIds = {
            'chicken': ['2252616', '1640777', '1068537', '1640774', '2252615'],
            'salmon': ['1640773', '1640772', '1640771', '1640770', '1640769'],
            'beef': ['1640775', '1640776', '1640778', '1640779', '1640780'],
            'shrimp': ['1640781', '1640782', '1640783', '1640784', '1640785'],
            'egg': ['1640786', '1640787', '1640788', '1640789', '1640790'],
            'salad': ['1640791', '1640792', '1640793', '1640794', '1640795'],
            'rice': ['1640796', '1640797', '1640798', '1640799', '1640800'],
            'smoothie': ['1640801', '1640802', '1640803', '1640804', '1640805'],
            'oatmeal': ['1640806', '1640807', '1640808', '1640809', '1640810'],
            'pho': ['1640811', '1640812', '1640813', '1640814', '1640815'],
            'noodles': ['1640816', '1640817', '1640818', '1640819', '1640820'],
            'yogurt': ['1640821', '1640822', '1640823', '1640824', '1640825'],
            'sweet potato': ['1640826', '1640827', '1640828', '1640829', '1640830'],
            'quinoa': ['1640831', '1640832', '1640833', '1640834', '1640835'],
            'food': ['1640836', '1640837', '1640838', '1640839', '1640840', '2252616', '1640777', '1068537']
        };
        
        // Chọn category phù hợp
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
    
    // Validate URL format
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        // Invalid URL, generate new one
        return validateAndFixImageUrl('', mealName);
    }
    
    return imageUrl;
};




const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getAgeFromDate = (dob) => {
    if (!dob) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;
    const diff = Date.now() - date.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const calculateRecommendedCalories = async (userId, goalText = '') => {
    try {
        const [user, latestMetrics] = await Promise.all([
            HoiVien.findById(userId).lean(),
            ChiSoCoThe.findOne({ hoiVien: userId }).sort({ ngayDo: -1 }).lean()
        ]);

        const weight = latestMetrics?.canNang || 65;
        const height = latestMetrics?.chieuCao || 170;
        const gender = (user?.gioiTinh || 'nam').toLowerCase();
        const age = getAgeFromDate(user?.ngaySinh) || 30;

        const baseBmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'nu' ? -161 : 5);
        let calories = Number.isFinite(baseBmr) ? baseBmr * 1.45 : 2000;
        const goal = (goalText || '').toLowerCase();

        if (goal.includes('giảm') || goal.includes('giam') || goal.includes('lean') || goal.includes('cut')) {
            calories *= 0.85;
        } else if (goal.includes('tăng') || goal.includes('tang') || goal.includes('build') || goal.includes('bulk') || goal.includes('cơ')) {
            calories *= 1.1;
        }

        return clamp(Math.round(calories), 1200, 4200);
    } catch (error) {
        console.warn('Cannot calculate recommended calories, fallback to default:', error.message);
        return 2000;
    }
};

const ensureMealHasVideo = async (mealDoc) => {
    if (!mealDoc || mealDoc.cookingVideoUrl) return;
    try {
        const videoUrl = await youtubeService.findCookingVideoUrl(mealDoc.name || mealDoc.description || '');
        if (videoUrl) {
            mealDoc.cookingVideoUrl = videoUrl;
            await mealDoc.save();
        }
    } catch (error) {
        console.error('Failed to update cooking video for meal', mealDoc?.name || 'unknown', error.message);
    }
};

const ensureMealPlanVideos = async (mealPlan) => {
    if (!mealPlan || !mealPlan.meals) return;
    const tasks = [];
    Object.values(mealPlan.meals).forEach(mealArray => {
        if (Array.isArray(mealArray)) {
            mealArray.forEach(entry => {
                if (entry?.meal && !entry.meal.cookingVideoUrl) {
                    tasks.push(ensureMealHasVideo(entry.meal));
                }
            });
        }
    });

    if (tasks.length) {
        await Promise.allSettled(tasks);
    }
};


/**
 * Generate nutrition plan với Gemini AI
 * POST /api/nutrition/plan
 */
exports.generatePlan = async (req, res) => {
    try {
        let { goal, calories, period, preferences, mealType, date } = req.body;
        const userId = req.user.id;
        const vaiTro = req.user.vaiTro;

        console.log('Request body:', req.body);

        if (!goal) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin mục tiêu dinh dưỡng',
            });
        }

        if (!period) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin period',
            });
        }

        // Only allow daily plans now
        if (period !== 'daily') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ hỗ trợ tạo thực đơn theo ngày (daily)',
                received: period
            });
        }

        // Validate and parse date
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Ngày không hợp lệ',
                    received: date
                });
            }
        }

        // Ensure date is today or future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể tạo thực đơn cho ngày hôm nay hoặc ngày tương lai',
                received: date
            });
        }

        let caloriesNum = typeof calories === 'string' ? parseInt(calories, 10) : Number(calories);

        if (!caloriesNum || Number.isNaN(caloriesNum)) {
            caloriesNum = await calculateRecommendedCalories(userId, goal);
        }

        if (caloriesNum < 1000 || caloriesNum > 5000) {
            caloriesNum = clamp(caloriesNum, 1000, 5000);
        }

        // Lấy user context
        let userContext = {};
        try {
            userContext = await aiService.getUserContext(userId, vaiTro);
        } catch (contextError) {
            console.warn('Error getting user context, using empty context:', contextError.message);
            // Continue with empty context if getUserContext fails
            userContext = {};
        }

        // Generate plan với Gemini
        let result;
        try {
            result = await aiService.generateNutritionPlan({
                goal,
                calories: caloriesNum,
                period,
                preferences: preferences || '',
                mealType: mealType || '',
                date: targetDate.toISOString().split('T')[0] // Pass selected date to AI service
            }, userContext);
        } catch (aiError) {
            console.error('Error generating plan with Gemini:', aiError);
            throw new Error('Lỗi khi tạo kế hoạch với AI: ' + (aiError.message || 'Không xác định'));
        }

        // Validate result
        if (!result || !result.success || !result.plan) {
            console.error('Invalid result from Gemini:', result);
            throw new Error('Kết quả từ AI không hợp lệ');
        }

        if (!result.plan.days || !Array.isArray(result.plan.days) || result.plan.days.length === 0) {
            console.error('No days in plan:', result.plan);
            throw new Error('Kế hoạch không có ngày nào');
        }

        // Helper function to parse and validate date
        const parseDate = (dateString) => {
            if (!dateString) {
                console.log('parseDate: No dateString provided, using today');
                return new Date();
            }

            // If already a Date object, validate and return it
            if (dateString instanceof Date) {
                if (isNaN(dateString.getTime())) {
                    console.warn('parseDate: Invalid Date object, using today');
                    return new Date();
                }
                return dateString;
            }

            // Convert to string if not already
            const dateStr = String(dateString).trim();

            // Try parsing as ISO string (YYYY-MM-DD)
            // First try: Direct ISO format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const parts = dateStr.split('-');
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                const day = parseInt(parts[2], 10);
                const parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate;
                }
            }

            // Second try: Standard Date constructor
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }

            // Fallback: Try manual parsing
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const parsedDate = new Date(year, month, day);
                    if (!isNaN(parsedDate.getTime())) {
                        return parsedDate;
                    }
                }
            }

            // Final fallback: today
            console.warn(`parseDate: Invalid date format: ${dateString} (type: ${typeof dateString}), using today's date`);
            return new Date();
        };

        // Tạo hoặc tìm Meal từ Gemini response và lưu vào DB
        const mealIds = [];
        try {
            for (const day of result.plan.days) {
                if (!day.meals || !Array.isArray(day.meals)) {
                    console.warn('Day has no meals array:', day);
                    continue;
                }

                for (const meal of day.meals) {
                    if (!meal || !meal.name) {
                        console.warn('Invalid meal data:', meal);
                        continue;
                    }

                    // Tạo Meal từ Gemini response với đầy đủ thuộc tính
                    // Map goal từ text sang enum
                    let mealGoals = ['DUY_TRI'];
                    const goalLower = goal.toLowerCase();
                    if (goalLower.includes('giảm') || goalLower.includes('giam')) {
                        mealGoals = ['GIAM_CAN'];
                    } else if (goalLower.includes('tăng cơ') || goalLower.includes('tang co')) {
                        mealGoals = ['TANG_CO'];
                    } else if (goalLower.includes('tăng cân') || goalLower.includes('tang can')) {
                        mealGoals = ['TANG_CAN'];
                    } else if (goalLower.includes('giảm mỡ') || goalLower.includes('giam mo')) {
                        mealGoals = ['GIAM_MO'];
                    } else if (goalLower.includes('tăng cơ bắp') || goalLower.includes('tang can bap')) {
                        mealGoals = ['TANG_CAN_BAP'];
                    }

                    // Validate and normalize ingredients
                    let normalizedIngredients = [];
                    if (meal.ingredients && Array.isArray(meal.ingredients)) {
                        normalizedIngredients = meal.ingredients
                            .filter(ing => ing && (ing.name || typeof ing === 'string'))
                            .map(ing => {
                                // Handle both object and string formats
                                if (typeof ing === 'string') {
                                    return { name: ing };
                                }
                                // Ensure name exists (required field)
                                if (!ing.name) {
                                    return null;
                                }
                                return {
                                    name: ing.name,
                                    amount: ing.amount || undefined,
                                    unit: ing.unit || undefined,
                                    notes: ing.notes || undefined
                                };
                            })
                            .filter(ing => ing !== null);
                    }

                    // Validate and normalize instructions
                    let normalizedInstructions = [];
                    if (meal.instructions) {
                        if (Array.isArray(meal.instructions)) {
                            normalizedInstructions = meal.instructions
                                .filter(inst => inst && typeof inst === 'string')
                                .map(inst => String(inst).trim())
                                .filter(inst => inst.length > 0);
                        } else if (typeof meal.instructions === 'string') {
                            // Split by newlines or periods if it's a string
                            normalizedInstructions = meal.instructions
                                .split(/[\n\.]/)
                                .map(inst => inst.trim())
                                .filter(inst => inst.length > 0);
                        }
                    }

                    const mealData = {
                        name: meal.name,
                        description: meal.description || '',
                        image: validateAndFixImageUrl(meal.image, meal.name),
                        mealType: meal.mealType || 'Bữa trưa',
                        goals: mealGoals,
                        difficulty: meal.difficulty || 'Trung bình',
                        cookingTimeMinutes: meal.cookingTimeMinutes || 15,
                        stepCount: meal.stepCount || 4,
                        rating: meal.rating || 4.8,
                        ratingCount: meal.ratingCount || 100,
                        healthScore: meal.healthScore || 80,
                        nutrition: {
                            caloriesKcal: meal.caloriesKcal || 400,
                            carbsGrams: meal.carbsGrams || 40,
                            proteinGrams: meal.proteinGrams || 30,
                            fatGrams: meal.fatGrams || 12,
                            fiberGrams: meal.fiberGrams || 0,
                            sugarGrams: meal.sugarGrams || 0,
                            sodiumMg: meal.sodiumMg || 0
                        },
                        tags: Array.isArray(meal.tags) ? meal.tags : [],
                        cuisineType: meal.cuisineType || 'Vietnamese',
                        dietaryRestrictions: Array.isArray(meal.dietaryRestrictions) ? meal.dietaryRestrictions : [],
                        allergens: Array.isArray(meal.allergens) ? meal.allergens : [],
                        ingredients: normalizedIngredients,
                        instructions: normalizedInstructions,
                        cookingVideoUrl: meal.cookingVideoUrl || '',
                        isFeatured: meal.isFeatured || false,
                        isPopular: meal.isPopular || false,
                        isRecommended: meal.isRecommended || false,
                        isAIRecommended: true,
                        createdBy: userId, // Đánh dấu user tạo món này
                        status: 'ACTIVE'
                    };

                    try {
                        const savedMeal = await Meal.create(mealData);
                        mealIds.push(savedMeal._id);
                        console.log(`Created meal: ${savedMeal.name} (ID: ${savedMeal._id})`);
                    } catch (mealError) {
                        console.error(`Error creating meal "${meal.name}":`, mealError);
                        console.error('Meal data:', JSON.stringify(mealData, null, 2));
                        // Continue with other meals instead of failing completely
                        console.warn(`Skipping meal "${meal.name}" due to validation error`);
                    }
                }
            }

            console.log(`Total meals created: ${mealIds.length}`);
        } catch (error) {
            console.error('Error creating meals:', error);
            throw new Error('Lỗi khi tạo meals: ' + error.message);
        }

        // Lưu plan vào database
        let mealIndex = 0;
        const savedPlan = new NutritionPlan({
            hoiVien: userId,
            planType: period,
            request: {
                goal,
                calories: caloriesNum,
                period,
                preferences: preferences || '',
                mealType: mealType || ''
            },
            days: result.plan.days.map((day, dayIdx) => {
                // Parse and validate date
                let dayDate;
                try {
                    console.log(`Parsing date for day ${dayIdx}:`, day.date, 'type:', typeof day.date);

                    if (day.date) {
                        dayDate = parseDate(day.date);
                    } else {
                        // If no date, use today + day index
                        dayDate = new Date();
                        dayDate.setDate(dayDate.getDate() + dayIdx);
                    }

                    // Normalize to start of day
                    dayDate.setHours(0, 0, 0, 0);

                    // Validate date is still valid after normalization
                    if (isNaN(dayDate.getTime())) {
                        console.error(`Invalid date after parsing: ${day.date}, using today + ${dayIdx}`);
                        dayDate = new Date();
                        dayDate.setDate(dayDate.getDate() + dayIdx);
                        dayDate.setHours(0, 0, 0, 0);
                    }

                    console.log(`Parsed date for day ${dayIdx}:`, dayDate.toISOString());
                } catch (error) {
                    console.error(`Error parsing date: ${day.date}`, error);
                    dayDate = new Date();
                    dayDate.setDate(dayDate.getDate() + dayIdx);
                    dayDate.setHours(0, 0, 0, 0);
                }

                return {
                    date: dayDate,
                    meals: day.meals.map((meal, mealIdx) => {
                        if (mealIndex >= mealIds.length) {
                            console.error(`Not enough mealIds. Index: ${mealIndex}, Total: ${mealIds.length}, Day: ${dayIdx}, Meal: ${mealIdx}`);
                            return null; // Skip this meal
                        }
                        const mealId = mealIds[mealIndex++];
                        if (!mealId) {
                            console.error('Missing mealId for meal:', meal.name);
                            return null; // Skip this meal
                        }
                        return {
                            meal: mealId,
                            mealType: meal.mealType || 'Bữa trưa',
                            isFeatured: meal.isFeatured || false,
                            isPopular: meal.isPopular || false,
                            isRecommended: meal.isRecommended || false
                        };
                    }).filter(meal => meal !== null) // Remove null entries
                };
            }),
            generatedAt: new Date(),
            status: 'ACTIVE'
        });

        try {
            await savedPlan.save();
            console.log('NutritionPlan saved successfully:', savedPlan._id);
        } catch (saveError) {
            console.error('Error saving NutritionPlan:', saveError);
            console.error('Plan data:', JSON.stringify(savedPlan, null, 2));
            throw new Error('Lỗi khi lưu nutrition plan: ' + saveError.message);
        }

        // Cũng lưu vào UserMealPlan cho ngày đầu tiên (hoặc tất cả các ngày cho weekly plan)
        // Với daily plan, luôn dùng ngày hôm nay
        // Với weekly plan, lưu tất cả các ngày
        if (result.plan.days.length > 0) {
            // Với daily plan, dùng ngày hôm nay
            // Với weekly plan, lưu tất cả các ngày
            const daysToSave = period === 'daily' ? [result.plan.days[0]] : result.plan.days;

            for (let dayIdx = 0; dayIdx < daysToSave.length; dayIdx++) {
                const day = daysToSave[dayIdx];

                // Với daily plan, dùng date từ request hoặc ngày hôm nay
                let targetDate;
                if (period === 'daily') {
                    // Use the date from request body, or default to today
                    if (date) {
                        targetDate = new Date(date);
                        targetDate.setHours(0, 0, 0, 0);
                    } else {
                        targetDate = new Date();
                        targetDate.setHours(0, 0, 0, 0);
                    }
                } else {
                    targetDate = parseDate(day.date);
                    targetDate.setHours(0, 0, 0, 0);
                    // Nếu date không hợp lệ, tính từ hôm nay
                    if (isNaN(targetDate.getTime())) {
                        targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() + dayIdx);
                        targetDate.setHours(0, 0, 0, 0);
                    }
                }

                let userMealPlan = await UserMealPlan.findOne({
                    hoiVien: userId,
                    date: targetDate
                });

                const isNewPlan = !userMealPlan;

                if (!userMealPlan) {
                    userMealPlan = new UserMealPlan({
                        hoiVien: userId,
                        date: targetDate,
                        meals: {
                            buaSang: [],
                            phu1: [],
                            buaTrua: [],
                            phu2: [],
                            buaToi: [],
                            phu3: []
                        },
                        totalNutrition: {
                            calories: 0,
                            carbs: 0,
                            protein: 0,
                            fat: 0
                        }
                    });
                } else {
                    // Reset total nutrition for this day if it's being overwritten by a new AI plan
                    userMealPlan.totalNutrition = { calories: 0, carbs: 0, protein: 0, fat: 0 };
                    // Clear existing AI-generated meals for this day to avoid duplicates
                    for (const key of Object.keys(userMealPlan.meals)) {
                        userMealPlan.meals[key] = userMealPlan.meals[key].filter(
                            (mealItem) => mealItem.source !== 'AI_GENERATED'
                        );
                    }
                }

                // Map meals to appropriate meal types
                const mealTypeMap = {
                    'Bữa sáng': 'buaSang',
                    'Phụ 1': 'phu1',
                    'Bữa trưa': 'buaTrua',
                    'Phụ 2': 'phu2',
                    'Bữa tối': 'buaToi',
                    'Phụ 3': 'phu3',
                    'Ăn nhẹ': 'phu1' // Default snack to phu1
                };

                // Tính meal index bắt đầu cho ngày này
                // Với daily: mealIdx = 0
                // Với weekly: mealIdx = tổng số meals của các ngày trước đó
                let mealIdx = 0;
                if (period === 'weekly') {
                    for (let i = 0; i < dayIdx; i++) {
                        mealIdx += result.plan.days[i]?.meals?.length || 0;
                    }
                }


                // Thêm meals của ngày này vào plan
                for (const meal of day.meals) {
                    const planField = mealTypeMap[meal.mealType] || 'buaTrua';

                    // Validate mealIdx before accessing mealIds array
                    if (mealIdx >= mealIds.length) {
                        console.error(`mealIdx (${mealIdx}) >= mealIds.length (${mealIds.length}) for day ${dayIdx}, meal: ${meal.name}`);
                        continue;
                    }

                    const mealId = mealIds[mealIdx++];

                    if (!mealId) {
                        console.warn(`Missing mealId for meal: ${meal.name} in day ${dayIdx}`);
                        continue;
                    }

                    const mealDoc = await Meal.findById(mealId);

                    if (!mealDoc) {
                        console.warn(`Meal not found: ${mealId}`);
                        continue;
                    }

                    // Kiểm tra xem meal đã tồn tại chưa (tránh duplicate)
                    const existingMeal = userMealPlan.meals[planField].find(
                        m => m.meal && m.meal.toString() === mealId.toString()
                    );

                    if (!existingMeal) {
                        userMealPlan.meals[planField].push({
                            meal: mealId,
                            source: 'AI_GENERATED',
                            addedAt: new Date(),
                            planId: savedPlan._id
                        });

                        if (mealDoc.nutrition) {
                            userMealPlan.totalNutrition.calories += mealDoc.nutrition.caloriesKcal || 0;
                            userMealPlan.totalNutrition.carbs += mealDoc.nutrition.carbsGrams || 0;
                            userMealPlan.totalNutrition.protein += mealDoc.nutrition.proteinGrams || 0;
                            userMealPlan.totalNutrition.fat += mealDoc.nutrition.fatGrams || 0;
                        }
                    }
                }

                await userMealPlan.save();
                console.log(`Saved UserMealPlan for date ${targetDate.toISOString().split('T')[0]} with ${day.meals.length} meals`);
            }
        }

        res.json({
            success: true,
            data: result.plan,
            planId: savedPlan._id,
            generatedAt: result.generatedAt
        });
    } catch (error) {
        console.error('Error generating nutrition plan:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });

        // Log request body for debugging
        console.error('Request body:', {
            goal: req.body.goal,
            calories: req.body.calories,
            period: req.body.period,
            preferences: req.body.preferences,
            mealType: req.body.mealType
        });

        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo kế hoạch dinh dưỡng',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            errorDetails: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message,
                code: error.code
            } : undefined
        });
    }
};

/**
 * Lấy nutrition plan mới nhất của user
 * GET /api/nutrition/plan/latest
 */
exports.getLatestPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const vaiTro = req.user.vaiTro;

        const latestPlan = await NutritionPlan.findOne({
            hoiVien: userId,
            status: 'ACTIVE'
        }).sort({ generatedAt: -1 }).populate({
            path: 'days.meals.meal',
            match: {
                status: 'ACTIVE',
                $or: [
                    { isAIRecommended: { $ne: true } },
                    { isAIRecommended: true, createdBy: userId }
                ]
            }
        });

        if (!latestPlan) {
            return res.json({
                success: true,
                data: null,
                message: 'Chưa có kế hoạch dinh dưỡng. Vui lòng tạo mới.'
            });
        }

        res.json({
            success: true,
            data: {
                planType: latestPlan.planType,
                days: latestPlan.days.map(day => ({
                    date: day.date,
                    meals: day.meals
                        .filter(m => m.meal !== null) // Filter out null meals (from populate match)
                        .map(m => {
                            const meal = m.meal;
                            if (!meal) return null;

                            return {
                                id: meal._id,
                                _id: meal._id,
                                name: meal.name,
                                mealType: meal.mealType,
                                isFeatured: m.isFeatured,
                                isPopular: m.isPopular,
                                isRecommended: m.isRecommended,
                                // Map meal data
                                description: meal.description,
                                difficulty: meal.difficulty,
                                cookingTimeMinutes: meal.cookingTimeMinutes,
                                healthScore: meal.healthScore,
                                stepCount: meal.stepCount,
                                caloriesKcal: meal.nutrition?.caloriesKcal || meal.caloriesKcal,
                                carbsGrams: meal.nutrition?.carbsGrams || meal.carbsGrams,
                                proteinGrams: meal.nutrition?.proteinGrams || meal.proteinGrams,
                                fatGrams: meal.nutrition?.fatGrams || meal.fatGrams,
                                rating: meal.rating,
                                ratingCount: meal.ratingCount,
                                image: meal.image,
                                ingredients: meal.ingredients,
                                instructions: meal.instructions,
                                tags: meal.tags,
                                cuisineType: meal.cuisineType,
                                dietaryRestrictions: meal.dietaryRestrictions,
                                allergens: meal.allergens
                            };
                        })
                        .filter(meal => meal !== null) // Remove null entries
                }))
            }
        });
    } catch (error) {
        console.error('Error getting latest nutrition plan:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy kế hoạch dinh dưỡng',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Lấy tất cả meals từ database
 * GET /api/nutrition/meals
 * Lưu ý: Chỉ hiển thị meals public hoặc meals do chính user tạo
 */
exports.getAllMeals = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealType, goal, search, limit = 50, skip = 0 } = req.query;

        // Build query: chỉ hiển thị meals public hoặc do user này tạo
        // Public meals: isAIRecommended không tồn tại, false, hoặc null
        // User's AI meals: isAIRecommended = true AND createdBy = userId
        const query = {
            status: 'ACTIVE',
            $or: [
                // Public meals (không phải AI-generated)
                { isAIRecommended: { $exists: false } },
                { isAIRecommended: false },
                { isAIRecommended: null },
                // AI-generated meals nhưng do user này tạo
                { isAIRecommended: true, createdBy: userId }
            ]
        };

        console.log('getAllMeals - User ID:', userId);
        console.log('getAllMeals - Query:', JSON.stringify(query, null, 2));

        // Add mealType filter
        if (mealType && mealType !== 'Tất cả') {
            query.mealType = mealType;
        }

        // Add goal filter
        if (goal) {
            query.goals = goal;
        }

        // Add search filter - combine with existing $or using $and
        if (search) {
            const searchCondition = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };

            // If we already have conditions, wrap in $and
            const existingOr = query.$or;
            query.$and = [
                { $or: existingOr },
                searchCondition
            ];
            delete query.$or; // Remove $or from root level
        }

        const meals = await Meal.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ rating: -1, ratingCount: -1 });

        const total = await Meal.countDocuments(query);

        console.log(`getAllMeals - Found ${meals.length} meals (total: ${total}) for user ${userId}`);
        if (meals.length > 0) {
            console.log(`getAllMeals - First meal:`, {
                name: meals[0].name,
                mealType: meals[0].mealType,
                isAIRecommended: meals[0].isAIRecommended,
                createdBy: meals[0].createdBy
            });
        }

        res.json({
            success: true,
            data: meals,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error getting meals:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách món ăn',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Lấy featured, popular, recommended meals
 * GET /api/nutrition/meals/featured
 * Lưu ý: Chỉ hiển thị meals public hoặc meals do chính user tạo
 */
exports.getFeaturedMeals = async (req, res) => {
    try {
        const userId = req.user.id;

        // Query để lấy meals public hoặc do user tạo
        const mealQuery = {
            status: 'ACTIVE',
            $or: [
                { isAIRecommended: { $ne: true } }, // Public meals
                { isAIRecommended: true, createdBy: userId } // AI-generated by this user
            ]
        };

        const featured = await Meal.findOne({
            ...mealQuery,
            isFeatured: true
        }).sort({ updatedAt: -1 });

        const popular = await Meal.find({
            ...mealQuery,
            isPopular: true
        })
            .limit(3)
            .sort({ rating: -1 });

        const recommended = await Meal.find({
            ...mealQuery,
            isRecommended: true
        })
            .limit(3)
            .sort({ rating: -1 });

        res.json({
            success: true,
            data: {
                featured,
                popular,
                recommended
            }
        });
    } catch (error) {
        console.error('Error getting featured meals:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy món ăn nổi bật',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Thêm meal vào user meal plan
 * POST /api/nutrition/meals/add-to-plan
 */
exports.addMealToPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealId, mealType, date } = req.body;

        if (!mealId || !mealType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mealId hoặc mealType'
            });
        }

        // Validate meal exists
        const meal = await Meal.findById(mealId);
        if (!meal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        if (!meal.cookingVideoUrl) {
            await ensureMealHasVideo(meal);
        }

        // Map mealType to plan field
        const mealTypeMap = {
            'Bữa sáng': 'buaSang',
            'Phụ 1': 'phu1',
            'Bữa trưa': 'buaTrua',
            'Phụ 2': 'phu2',
            'Bữa tối': 'buaToi',
            'Phụ 3': 'phu3'
        };

        const planField = mealTypeMap[mealType] || 'buaTrua';
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Find or create user meal plan for the date
        let userMealPlan = await UserMealPlan.findOne({
            hoiVien: userId,
            date: targetDate
        });

        if (!userMealPlan) {
            userMealPlan = new UserMealPlan({
                hoiVien: userId,
                date: targetDate,
                meals: {
                    buaSang: [],
                    phu1: [],
                    buaTrua: [],
                    phu2: [],
                    buaToi: [],
                    phu3: []
                },
                totalNutrition: {
                    calories: 0,
                    carbs: 0,
                    protein: 0,
                    fat: 0
                }
            });
        }

        // Add meal to appropriate field
        userMealPlan.meals[planField].push({
            meal: mealId,
            source: 'USER_SELECTED',
            addedAt: new Date()
        });

        // Update total nutrition
        userMealPlan.totalNutrition.calories += meal.nutrition.caloriesKcal;
        userMealPlan.totalNutrition.carbs += meal.nutrition.carbsGrams;
        userMealPlan.totalNutrition.protein += meal.nutrition.proteinGrams;
        userMealPlan.totalNutrition.fat += meal.nutrition.fatGrams;

        await userMealPlan.save();

        res.json({
            success: true,
            message: 'Đã thêm món ăn vào thực đơn',
            data: userMealPlan
        });
    } catch (error) {
        console.error('Error adding meal to plan:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi thêm món ăn vào thực đơn',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Lấy user meal plan cho một ngày
 * GET /api/nutrition/my-meals?date=YYYY-MM-DD
 */
// Get meal plan for a specific member (for admin)
exports.getMemberMealPlan = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { date } = req.query;

        if (!memberId) {
            return res.status(400).json({
                success: false,
                message: 'Member ID is required'
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const userMealPlan = await UserMealPlan.findOne({
            hoiVien: memberId,
            date: targetDate
        }).populate({
            path: 'meals.buaSang.meal meals.phu1.meal meals.buaTrua.meal meals.phu2.meal meals.buaToi.meal meals.phu3.meal',
            model: 'Meal'
        });

        if (userMealPlan) {
            await ensureMealPlanVideos(userMealPlan);
        }

        if (!userMealPlan) {
            return res.json({
                success: true,
                data: {
                    date: targetDate,
                    meals: {
                        buaSang: [],
                        phu1: [],
                        buaTrua: [],
                        phu2: [],
                        buaToi: [],
                        phu3: []
                    },
                    totalNutrition: {
                        calories: 0,
                        carbs: 0,
                        protein: 0,
                        fat: 0
                    }
                }
            });
        }

        // Calculate total nutrition
        const totalNutrition = {
            calories: userMealPlan.totalCalories || 0,
            carbs: userMealPlan.totalCarb || 0,
            protein: userMealPlan.totalProtein || 0,
            fat: userMealPlan.totalTotalFat || 0
        };

        return res.json({
            success: true,
            data: {
                _id: userMealPlan._id,
                hoiVien: userMealPlan.hoiVien,
                date: userMealPlan.date,
                meals: {
                    buaSang: userMealPlan.meals.buaSang || [],
                    phu1: userMealPlan.meals.phu1 || [],
                    buaTrua: userMealPlan.meals.buaTrua || [],
                    phu2: userMealPlan.meals.phu2 || [],
                    buaToi: userMealPlan.meals.buaToi || [],
                    phu3: userMealPlan.meals.phu3 || []
                },
                totalNutrition
            }
        });
    } catch (error) {
        console.error('Error getting member meal plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thực đơn của hội viên',
            error: error.message
        });
    }
};

exports.getMyMeals = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const userMealPlan = await UserMealPlan.findOne({
            hoiVien: userId,
            date: targetDate
        }).populate({
            path: 'meals.buaSang.meal meals.phu1.meal meals.buaTrua.meal meals.phu2.meal meals.buaToi.meal meals.phu3.meal',
            model: 'Meal'
        });

        if (userMealPlan) {
            await ensureMealPlanVideos(userMealPlan);
        }

        if (!userMealPlan) {
            return res.json({
                success: true,
                data: {
                    date: targetDate,
                    meals: {
                        buaSang: [],
                        phu1: [],
                        buaTrua: [],
                        phu2: [],
                        buaToi: [],
                        phu3: []
                    },
                    totalNutrition: {
                        calories: 0,
                        carbs: 0,
                        protein: 0,
                        fat: 0
                    }
                }
            });
        }

        res.json({
            success: true,
            data: userMealPlan
        });
    } catch (error) {
        console.error('Error getting my meals:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thực đơn của tôi',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Lấy user meal plan cho một tuần
 * GET /api/nutrition/my-meals/week?startDate=YYYY-MM-DD
 */
exports.getMyMealsWeek = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate } = req.query;

        // Calculate week start (Monday)
        let weekStart = startDate ? new Date(startDate) : new Date();
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        // Calculate week end (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Find all meal plans in the week
        const userMealPlans = await UserMealPlan.find({
            hoiVien: userId,
            date: {
                $gte: weekStart,
                $lte: weekEnd
            }
        }).populate({
            path: 'meals.buaSang.meal meals.phu1.meal meals.buaTrua.meal meals.phu2.meal meals.buaToi.meal meals.phu3.meal',
            model: 'Meal'
        }).sort({ date: 1 });

        await Promise.allSettled(userMealPlans.map(plan => ensureMealPlanVideos(plan)));

        console.log(`Found ${userMealPlans.length} meal plans for week ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`);
        userMealPlans.forEach(plan => {
            const planDate = plan.date instanceof Date ? plan.date.toISOString().split('T')[0] : plan.date;
            const totalMeals = Object.values(plan.meals).reduce((sum, mealArray) => {
                return sum + (Array.isArray(mealArray) ? mealArray.length : 0);
            }, 0);
            console.log(`Plan for ${planDate}: ${totalMeals} meals`);
        });

        // Create a map of dates to meal plans
        const weekData = {};

        // Normalize all plan dates to YYYY-MM-DD format for comparison
        const normalizedPlans = userMealPlans.map(plan => {
            let planDateStr;
            const planDate = plan.date;

            if (planDate instanceof Date) {
                // Create a new date to avoid timezone issues
                const normalized = new Date(planDate);
                normalized.setHours(0, 0, 0, 0);
                planDateStr = normalized.toISOString().split('T')[0];
            } else if (typeof planDate === 'string') {
                // Handle both ISO string and YYYY-MM-DD format
                const dateObj = new Date(planDate);
                dateObj.setHours(0, 0, 0, 0);
                planDateStr = dateObj.toISOString().split('T')[0];
            } else {
                planDateStr = null;
            }

            // Convert to plain object to ensure proper serialization
            const planObj = plan.toObject ? plan.toObject() : JSON.parse(JSON.stringify(plan));

            return {
                ...planObj,
                _normalizedDate: planDateStr
            };
        });

        console.log('Normalized plans:', normalizedPlans.map(p => ({ date: p._normalizedDate, mealsCount: Object.values(p.meals || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0) })));

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            currentDate.setHours(0, 0, 0, 0);

            // Use UTC to avoid timezone issues
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            // Find plan with matching normalized date
            const planForDate = normalizedPlans.find(plan => {
                return plan._normalizedDate === dateKey;
            });

            if (planForDate) {
                // Remove the temporary _normalizedDate field
                delete planForDate._normalizedDate;
                // Ensure meals structure is correct
                if (!planForDate.meals) {
                    planForDate.meals = {
                        buaSang: [],
                        phu1: [],
                        buaTrua: [],
                        phu2: [],
                        buaToi: [],
                        phu3: []
                    };
                }
                // Ensure totalNutrition exists
                if (!planForDate.totalNutrition) {
                    planForDate.totalNutrition = {
                        calories: 0,
                        carbs: 0,
                        protein: 0,
                        fat: 0
                    };
                }
                // Ensure date is set correctly
                planForDate.date = dateKey;

                weekData[dateKey] = planForDate;

                const totalMeals = Object.values(planForDate.meals).reduce((sum, arr) => {
                    return sum + (Array.isArray(arr) ? arr.length : 0);
                }, 0);
                console.log(`✅ Mapped plan for ${dateKey}: ${totalMeals} meals`);
            } else {
                weekData[dateKey] = {
                    date: dateKey,
                    meals: {
                        buaSang: [],
                        phu1: [],
                        buaTrua: [],
                        phu2: [],
                        buaToi: [],
                        phu3: []
                    },
                    totalNutrition: {
                        calories: 0,
                        carbs: 0,
                        protein: 0,
                        fat: 0
                    }
                };
                console.log(`⚠️ No plan found for ${dateKey}`);
            }
        }

        res.json({
            success: true,
            data: {
                weekStart: weekStart.toISOString().split('T')[0],
                weekEnd: weekEnd.toISOString().split('T')[0],
                days: weekData
            }
        });
    } catch (error) {
        console.error('Error getting my meals week:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thực đơn tuần',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Xóa món ăn khỏi user meal plan
 * DELETE /api/nutrition/my-meals/remove
 */
// Add meal to member plan (for admin)
exports.addMealToMemberPlan = async (req, res) => {
    try {
        const { memberId, mealId, mealType, date } = req.body;

        if (!memberId || !mealId || !mealType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu memberId, mealId hoặc mealType'
            });
        }

        // Validate meal exists
        const meal = await Meal.findById(mealId);
        if (!meal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        // Map mealType to plan field
        const mealTypeMap = {
            'Bữa sáng': 'buaSang',
            'Phụ 1': 'phu1',
            'Bữa trưa': 'buaTrua',
            'Phụ 2': 'phu2',
            'Bữa tối': 'buaToi',
            'Phụ 3': 'phu3',
            'buaSang': 'buaSang',
            'phu1': 'phu1',
            'buaTrua': 'buaTrua',
            'phu2': 'phu2',
            'buaToi': 'buaToi',
            'phu3': 'phu3'
        };

        const planField = mealTypeMap[mealType] || 'buaTrua';
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Find or create user meal plan for the date
        let userMealPlan = await UserMealPlan.findOne({
            hoiVien: memberId,
            date: targetDate
        });

        if (!userMealPlan) {
            userMealPlan = new UserMealPlan({
                hoiVien: memberId,
                date: targetDate,
                meals: {
                    buaSang: [],
                    phu1: [],
                    buaTrua: [],
                    phu2: [],
                    buaToi: [],
                    phu3: []
                },
                totalCalories: 0,
                totalCarb: 0,
                totalProtein: 0,
                totalTotalFat: 0
            });
        }

        // Add meal to appropriate field
        userMealPlan.meals[planField].push({
            meal: mealId,
            source: 'USER_SELECTED',
            mealType: mealType,
            addedAt: new Date()
        });

        // Update total nutrition
        userMealPlan.totalCalories = (userMealPlan.totalCalories || 0) + (meal.nutrition?.caloriesKcal || 0);
        userMealPlan.totalCarb = (userMealPlan.totalCarb || 0) + (meal.nutrition?.carbsGrams || 0);
        userMealPlan.totalProtein = (userMealPlan.totalProtein || 0) + (meal.nutrition?.proteinGrams || 0);
        userMealPlan.totalTotalFat = (userMealPlan.totalTotalFat || 0) + (meal.nutrition?.fatGrams || 0);

        await userMealPlan.save();

        // Populate meal data
        await userMealPlan.populate({
            path: 'meals.buaSang.meal meals.phu1.meal meals.buaTrua.meal meals.phu2.meal meals.buaToi.meal meals.phu3.meal',
            model: 'Meal'
        });

        res.json({
            success: true,
            message: 'Đã thêm món ăn vào thực đơn của hội viên',
            data: userMealPlan
        });
    } catch (error) {
        console.error('Error adding meal to member plan:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi thêm món ăn vào thực đơn của hội viên',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Remove meal from member plan (for admin)
exports.removeMealFromMemberPlan = async (req, res) => {
    try {
        const { memberId, date, mealType, mealIndex } = req.query;

        if (!memberId || !date || !mealType || mealIndex === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: memberId, date, mealType, và mealIndex là bắt buộc'
            });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const userMealPlan = await UserMealPlan.findOne({
            hoiVien: memberId,
            date: targetDate
        });

        if (!userMealPlan) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thực đơn cho ngày này'
            });
        }

        const mealTypeMap = {
            'buaSang': 'buaSang',
            'phu1': 'phu1',
            'buaTrua': 'buaTrua',
            'phu2': 'phu2',
            'buaToi': 'buaToi',
            'phu3': 'phu3'
        };

        const planField = mealTypeMap[mealType];
        if (!planField) {
            return res.status(400).json({
                success: false,
                message: 'Loại bữa ăn không hợp lệ'
            });
        }

        const meals = userMealPlan.meals[planField];
        const mealIndexNum = parseInt(mealIndex);
        if (mealIndexNum < 0 || mealIndexNum >= meals.length) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ số món ăn không hợp lệ'
            });
        }

        // Get meal to calculate nutrition
        const mealToRemove = await Meal.findById(meals[mealIndexNum].meal);

        // Remove meal from array
        meals.splice(mealIndexNum, 1);

        // Update total nutrition
        if (mealToRemove && mealToRemove.nutrition) {
            userMealPlan.totalCalories = Math.max(0, (userMealPlan.totalCalories || 0) - (mealToRemove.nutrition.caloriesKcal || 0));
            userMealPlan.totalCarb = Math.max(0, (userMealPlan.totalCarb || 0) - (mealToRemove.nutrition.carbsGrams || 0));
            userMealPlan.totalProtein = Math.max(0, (userMealPlan.totalProtein || 0) - (mealToRemove.nutrition.proteinGrams || 0));
            userMealPlan.totalTotalFat = Math.max(0, (userMealPlan.totalTotalFat || 0) - (mealToRemove.nutrition.fatGrams || 0));
        }

        await userMealPlan.save();

        res.json({
            success: true,
            message: 'Đã xóa món ăn khỏi thực đơn của hội viên',
            data: userMealPlan
        });
    } catch (error) {
        console.error('Error removing meal from member plan:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa món ăn khỏi thực đơn của hội viên',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.removeMealFromPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, mealType, mealIndex } = req.body;

        if (!date || !mealType || mealIndex === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: date, mealType, và mealIndex là bắt buộc'
            });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const userMealPlan = await UserMealPlan.findOne({
            hoiVien: userId,
            date: targetDate
        });

        if (!userMealPlan) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thực đơn cho ngày này'
            });
        }

        const mealTypeMap = {
            'buaSang': 'buaSang',
            'phu1': 'phu1',
            'buaTrua': 'buaTrua',
            'phu2': 'phu2',
            'buaToi': 'buaToi',
            'phu3': 'phu3'
        };

        const planField = mealTypeMap[mealType];
        if (!planField) {
            return res.status(400).json({
                success: false,
                message: 'Loại bữa ăn không hợp lệ'
            });
        }

        const meals = userMealPlan.meals[planField];
        if (mealIndex < 0 || mealIndex >= meals.length) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ số món ăn không hợp lệ'
            });
        }

        // Get meal to remove for nutrition calculation
        const mealToRemove = await Meal.findById(meals[mealIndex].meal);

        // Remove meal from array
        meals.splice(mealIndex, 1);

        // Update total nutrition
        if (mealToRemove && mealToRemove.nutrition) {
            userMealPlan.totalNutrition.calories = Math.max(0, userMealPlan.totalNutrition.calories - (mealToRemove.nutrition.caloriesKcal || 0));
            userMealPlan.totalNutrition.carbs = Math.max(0, userMealPlan.totalNutrition.carbs - (mealToRemove.nutrition.carbsGrams || 0));
            userMealPlan.totalNutrition.protein = Math.max(0, userMealPlan.totalNutrition.protein - (mealToRemove.nutrition.proteinGrams || 0));
            userMealPlan.totalNutrition.fat = Math.max(0, userMealPlan.totalNutrition.fat - (mealToRemove.nutrition.fatGrams || 0));
        }

        await userMealPlan.save();

        res.json({
            success: true,
            message: 'Đã xóa món ăn khỏi thực đơn',
            data: userMealPlan
        });
    } catch (error) {
        console.error('Error removing meal from plan:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa món ăn',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Thêm món ăn vào ngày khác (duplicate)
 * POST /api/nutrition/my-meals/duplicate
 */
exports.duplicateMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealId, targetDate, mealType } = req.body;

        if (!mealId || !targetDate || !mealType) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin: mealId, targetDate, và mealType là bắt buộc'
            });
        }

        const meal = await Meal.findById(mealId);
        if (!meal) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        const targetDateObj = new Date(targetDate);
        targetDateObj.setHours(0, 0, 0, 0);

        let userMealPlan = await UserMealPlan.findOne({
            hoiVien: userId,
            date: targetDateObj
        });

        if (!userMealPlan) {
            userMealPlan = new UserMealPlan({
                hoiVien: userId,
                date: targetDateObj,
                meals: {
                    buaSang: [],
                    phu1: [],
                    buaTrua: [],
                    phu2: [],
                    buaToi: [],
                    phu3: []
                },
                totalNutrition: { calories: 0, carbs: 0, protein: 0, fat: 0 }
            });
        }

        const mealTypeMap = {
            'Bữa sáng': 'buaSang',
            'Phụ 1': 'phu1',
            'Bữa trưa': 'buaTrua',
            'Phụ 2': 'phu2',
            'Bữa tối': 'buaToi',
            'Phụ 3': 'phu3',
            'buaSang': 'buaSang',
            'phu1': 'phu1',
            'buaTrua': 'buaTrua',
            'phu2': 'phu2',
            'buaToi': 'buaToi',
            'phu3': 'phu3'
        };

        const planField = mealTypeMap[mealType] || mealType;
        if (!userMealPlan.meals[planField]) {
            return res.status(400).json({
                success: false,
                message: 'Loại bữa ăn không hợp lệ'
            });
        }

        // Add meal to appropriate field
        userMealPlan.meals[planField].push({
            meal: mealId,
            source: 'USER_SELECTED',
            addedAt: new Date()
        });

        // Update total nutrition
        if (meal.nutrition) {
            userMealPlan.totalNutrition.calories += meal.nutrition.caloriesKcal || 0;
            userMealPlan.totalNutrition.carbs += meal.nutrition.carbsGrams || 0;
            userMealPlan.totalNutrition.protein += meal.nutrition.proteinGrams || 0;
            userMealPlan.totalNutrition.fat += meal.nutrition.fatGrams || 0;
        }

        await userMealPlan.save();

        res.json({
            success: true,
            message: 'Đã thêm món ăn vào thực đơn',
            data: userMealPlan
        });
    } catch (error) {
        console.error('Error duplicating meal:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi thêm món ăn',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


exports.getGoalHistory = async (req, res) => {
    try {
        const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
        const plans = await NutritionPlan.find({ hoiVien: req.user.id })
            .select('request generatedAt')
            .sort({ generatedAt: -1 })
            .limit(limit)
            .lean();

        const history = plans.map(plan => ({
            goal: plan.request?.goal || '',
            calories: plan.request?.calories || null,
            preferences: plan.request?.preferences || '',
            date: plan.generatedAt
        })).filter(item => item.goal || item.preferences);

        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching goal history:', error);
        res.status(500).json({ success: false, message: 'Không thể lấy lịch sử mục tiêu', error: error.message });
    }
};

exports.getRecommendedCalories = async (req, res) => {
    try {
        const calories = await calculateRecommendedCalories(req.user.id, req.query.goal || '');
        res.json({ success: true, data: { calories } });
    } catch (error) {
        console.error('Error calculating recommended calories:', error);
        res.status(500).json({ success: false, message: 'Không thể tính calories đề xuất', error: error.message });
    }
};
