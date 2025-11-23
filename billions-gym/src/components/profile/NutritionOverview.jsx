import { Apple, Beef, Droplet } from "lucide-react";

export function NutritionOverview() {
    const macros = [
        {
            name: 'Carbs',
            icon: Apple,
            current: 245,
            target: 300,
            unit: 'g',
            color: '#3b82f6'
        },
        {
            name: 'Protein',
            icon: Beef,
            current: 165,
            target: 180,
            unit: 'g',
            color: '#da2128'
        },
        {
            name: 'Fat',
            icon: Droplet,
            current: 68,
            target: 70,
            unit: 'g',
            color: '#eab308'
        }
    ];

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
                            strokeDasharray={`${(2100 / 2500) * 552.9} 552.9`}
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
                        <p className="text-3xl font-bold text-white mt-1">2,100</p>
                        <p className="text-zinc-500 text-sm">/ 2,500 kcal</p>
                        <div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
                            84% đạt được
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
                    <p className="text-white">2.5L / 3L</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs mb-1">Bữa ăn</p>
                    <p className="text-white">4 / 5</p>
                </div>
            </div>
        </div>
    );
}
