import { Apple, Beef, Droplet } from "lucide-react";

export function NutritionOverview({ nutritionData }) {
    // Parse nutrition data from API
    const parseNutritionData = () => {
        // Default values
        const defaults = {
            calories: { current: 0, target: 2500 },
            macros: [
                { name: 'Carbs', icon: Apple, current: 0, target: 300, unit: 'g', color: '#3b82f6' },
                { name: 'Protein', icon: Beef, current: 0, target: 180, unit: 'g', color: '#da2128' },
                { name: 'Fat', icon: Droplet, current: 0, target: 70, unit: 'g', color: '#eab308' }
            ],
            water: { current: 0, target: 3 },
            meals: { current: 0, target: 5 }
        };

        if (!nutritionData) {
            return defaults;
        }

        // Use totalNutrition if available (pre-calculated by backend)
        let totalCalories = 0;
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let mealCount = 0;

        if (nutritionData.totalNutrition) {
            // Use pre-calculated totals from backend
            totalCalories = nutritionData.totalNutrition.calories || 0;
            totalCarbs = nutritionData.totalNutrition.carbs || 0;
            totalProtein = nutritionData.totalNutrition.protein || 0;
            totalFat = nutritionData.totalNutrition.fat || 0;
        } else if (nutritionData.meals) {
            // Calculate from meals if totalNutrition not available
            const mealTypes = ['buaSang', 'phu1', 'buaTrua', 'phu2', 'buaToi', 'phu3'];

            mealTypes.forEach(mealType => {
                if (nutritionData.meals[mealType] && Array.isArray(nutritionData.meals[mealType])) {
                    nutritionData.meals[mealType].forEach(mealItem => {
                        if (mealItem.meal) {
                            // Meal model uses nutrition.caloriesKcal, nutrition.carbsGrams, etc.
                            const nutrition = mealItem.meal.nutrition || {};
                            totalCalories += nutrition.caloriesKcal || mealItem.meal.calories || 0;
                            totalCarbs += nutrition.carbsGrams || mealItem.meal.carbs || 0;
                            totalProtein += nutrition.proteinGrams || mealItem.meal.protein || 0;
                            totalFat += nutrition.fatGrams || mealItem.meal.fat || 0;
                            mealCount++;
                        }
                    });
                }
            });
        }

        // Count total meals
        if (nutritionData.meals) {
            const mealTypes = ['buaSang', 'phu1', 'buaTrua', 'phu2', 'buaToi', 'phu3'];
            mealCount = mealTypes.reduce((count, mealType) => {
                return count + (Array.isArray(nutritionData.meals[mealType]) ? nutritionData.meals[mealType].length : 0);
            }, 0);
        }

        // Target values - can be from user profile, nutrition plan, or defaults
        // TODO: Fetch from user nutrition goals API if available
        const targetCalories = nutritionData.targetCalories || 2500;
        const targetCarbs = nutritionData.targetCarbs || 300;
        const targetProtein = nutritionData.targetProtein || 180;
        const targetFat = nutritionData.targetFat || 70;
        const targetWater = nutritionData.targetWater || 3; // liters
        const targetMeals = nutritionData.targetMeals || 5;

        // Water intake - if not in API, default to 0 (can be tracked separately)
        const waterIntake = nutritionData.waterIntake || nutritionData.soLuongNuocUong ? (nutritionData.soLuongNuocUong / 1000) : 0;

        return {
            calories: { current: totalCalories, target: targetCalories },
            macros: [
                { name: 'Carbs', icon: Apple, current: Math.round(totalCarbs), target: targetCarbs, unit: 'g', color: '#3b82f6' },
                { name: 'Protein', icon: Beef, current: Math.round(totalProtein), target: targetProtein, unit: 'g', color: '#da2128' },
                { name: 'Fat', icon: Droplet, current: Math.round(totalFat), target: targetFat, unit: 'g', color: '#eab308' }
            ],
            water: { current: waterIntake, target: targetWater },
            meals: { current: mealCount, target: targetMeals }
        };
    };

    const nutrition = parseNutritionData();
    const macros = nutrition.macros;
    const caloriePercentage = nutrition.calories.target > 0
        ? (nutrition.calories.current / nutrition.calories.target) * 100
        : 0;

    return (
        <div className="bg-[#141414] rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Dinh dưỡng hôm nay</h3>

            {/* Calorie Ring */}
            <div className="flex items-center justify-center mb-8">
                <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="#2a2a2a"
                            strokeWidth="12"
                            fill="none"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="url(#calorieGradient)"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${(caloriePercentage / 100) * 552.9} 552.9`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                        <defs>
                            <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#da2128" />
                                <stop offset="100%" stopColor="#ff4147" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-zinc-400 text-sm">Calories</p>
                        <p className="text-3xl font-bold text-white mt-1">
                            {nutrition.calories.current.toLocaleString('vi-VN')}
                        </p>
                        <p className="text-zinc-500 text-sm">/ {nutrition.calories.target.toLocaleString('vi-VN')} kcal</p>
                        <div className={`mt-2 px-3 py-1 rounded-lg text-xs ${caloriePercentage >= 80 ? 'bg-green-500/20 text-green-400' :
                            caloriePercentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                            {Math.round(caloriePercentage)}% đạt được
                        </div>
                    </div>
                </div>
            </div>

            {/* Macros */}
            <div className="space-y-4">
                {macros.map((macro, index) => {
                    const Icon = macro.icon;
                    const percentage = (macro.current / macro.target) * 100;

                    return (
                        <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon size={16} style={{ color: macro.color }} />
                                    <span className="text-white text-sm">{macro.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white">
                                        {macro.current}{macro.unit}
                                    </span>
                                    <span className="text-zinc-500">/</span>
                                    <span className="text-zinc-400">
                                        {macro.target}{macro.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(percentage, 100)}%`,
                                        backgroundColor: macro.color
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-zinc-800">
                <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">Nước uống</p>
                    <p className="text-white">{nutrition.water.current}L / {nutrition.water.target}L</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">Bữa ăn</p>
                    <p className="text-white">{nutrition.meals.current} / {nutrition.meals.target}</p>
                </div>
            </div>
        </div>
    );
}
