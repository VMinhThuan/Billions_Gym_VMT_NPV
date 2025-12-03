import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame } from "lucide-react";

export function CalorieChart({ nutritionData }) {
    const parseCalorieData = () => {
        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const target = nutritionData?.targetCalories || 0;

        const weeklyEntries = (() => {
            if (!nutritionData) return [];
            if (Array.isArray(nutritionData.weeklyData)) return nutritionData.weeklyData;
            if (nutritionData.weeklyData && typeof nutritionData.weeklyData === 'object') {
                return Object.values(nutritionData.weeklyData);
            }
            if (Array.isArray(nutritionData.days)) return nutritionData.days;
            if (nutritionData.days && typeof nutritionData.days === 'object') {
                return Object.values(nutritionData.days);
            }
            return [];
        })();

        if (!weeklyEntries.length) {
            return {
                chartData: days.map(day => ({ day, calories: 0, target })),
                average: 0,
                max: 0,
                min: 0,
                target
            };
        }

        // Calculate calories for each day from meals
        const chartData = weeklyEntries.slice(0, 7).map((dayData, index) => {
            let totalCalories = 0;

            if (typeof dayData?.totalCalories === 'number') {
                totalCalories = dayData.totalCalories;
            } else if (dayData?.totalNutrition?.calories) {
                totalCalories = dayData.totalNutrition.calories;
            }

            if (dayData.meals) {
                const mealTypes = ['buaSang', 'phu1', 'buaTrua', 'phu2', 'buaToi', 'phu3'];
                mealTypes.forEach(mealType => {
                    if (dayData.meals[mealType] && Array.isArray(dayData.meals[mealType])) {
                        dayData.meals[mealType].forEach(mealItem => {
                            if (mealItem.meal && mealItem.meal.calories) {
                                totalCalories += mealItem.meal.calories;
                            }
                        });
                    }
                });
            }

            // Get day name from date
            let dayName = days[index] || `Ngày ${index + 1}`;
            if (dayData.date) {
                try {
                    const date = new Date(dayData.date);
                    if (!Number.isNaN(date.getTime())) {
                        const dayOfWeek = date.getDay();
                        dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1] || date.toLocaleDateString('vi-VN', { weekday: 'short' });
                    }
                } catch (e) {
                    // Use default
                }
            }

            return {
                day: dayName,
                calories: totalCalories,
                target
            };
        });

        // Fill remaining days if needed
        while (chartData.length < 7) {
            const index = chartData.length;
            chartData.push({
                day: days[index] || `Ngày ${index + 1}`,
                calories: 0,
                target
            });
        }

        const calories = chartData.map(d => d.calories).filter(c => c > 0);
        const average = calories.length > 0 ? calories.reduce((a, b) => a + b, 0) / calories.length : 0;
        const max = calories.length > 0 ? Math.max(...calories) : 0;
        const min = calories.length > 0 ? Math.min(...calories) : 0;

        return { chartData, average, max, min, target };
    };

    const { chartData, average, max, min, target } = parseCalorieData();
    return (
        <div className="bg-[#141414] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                        <Flame size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Lượng calo hàng ngày</h3>
                        <p className="text-zinc-500 text-sm">7 ngày gần đây</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-zinc-400 text-sm">Mục tiêu/ngày</p>
                    <p className="font-bold text-white">{target.toLocaleString('vi-VN')} kcal</p>
                </div>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#da2128" stopOpacity={1} />
                                <stop offset="100%" stopColor="#9b1c1f" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis
                            dataKey="day"
                            stroke="#666"
                            style={{ fontSize: '12px', fontFamily: 'Poppins' }}
                        />
                        <YAxis
                            stroke="#666"
                            style={{ fontSize: '12px', fontFamily: 'Poppins' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #2a2a2a',
                                borderRadius: '8px',
                                fontFamily: 'Poppins',
                                fontSize: '12px'
                            }}
                            labelStyle={{ color: '#fff' }}
                            cursor={{ fill: 'rgba(218, 33, 40, 0.1)' }}
                        />
                        <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.calories >= entry.target ? "url(#barGradient)" : "#444"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Trung bình</p>
                    <p className="font-bold text-white">{average > 0 ? `${Math.round(average).toLocaleString('vi-VN')} kcal` : '--'}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Cao nhất</p>
                    <p className="font-bold text-[#da2128]">{max > 0 ? `${max.toLocaleString('vi-VN')} kcal` : '--'}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Thấp nhất</p>
                    <p className="font-bold text-blue-400">{min > 0 ? `${min.toLocaleString('vi-VN')} kcal` : '--'}</p>
                </div>
            </div>
        </div>
    );
}
