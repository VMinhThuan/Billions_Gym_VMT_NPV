import { Trophy, Crown, Star, Target, Zap, Award } from "lucide-react";

export function AchievementBadges() {
    const badges = [
        {
            icon: Trophy,
            title: 'Chiến binh 30 ngày',
            description: 'Tập luyện liên tục 30 ngày',
            date: '15/11/2025',
            unlocked: true,
            gradient: 'from-yellow-500 to-yellow-700'
        },
        {
            icon: Crown,
            title: 'Vua Deadlift',
            description: 'Deadlift 120kg',
            date: '19/11/2025',
            unlocked: true,
            gradient: 'from-purple-500 to-purple-700'
        },
        {
            icon: Star,
            title: 'Sao dinh dưỡng',
            description: 'Đạt mục tiêu calo 7 ngày liên tục',
            date: '18/11/2025',
            unlocked: true,
            gradient: 'from-[#da2128] to-[#9b1c1f]'
        },
        {
            icon: Zap,
            title: 'Tốc độ ánh sáng',
            description: 'Chạy 10km dưới 50 phút',
            date: '10/11/2025',
            unlocked: true,
            gradient: 'from-blue-500 to-blue-700'
        },
        {
            icon: Target,
            title: 'Mục tiêu cân nặng',
            description: 'Đạt cân nặng mục tiêu',
            date: 'Chưa mở khóa',
            unlocked: false,
            gradient: 'from-zinc-700 to-zinc-800'
        },
        {
            icon: Award,
            title: 'Huyền thoại 100 ngày',
            description: 'Tập luyện liên tục 100 ngày',
            date: 'Chưa mở khóa',
            unlocked: false,
            gradient: 'from-zinc-700 to-zinc-800'
        }
    ];

    return (
        <div className="bg-[#141414] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg">
                        <Award size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Thành tích</h3>
                        <p className="text-zinc-500 text-sm">4 / 6 huy hiệu đã mở khóa</p>
                    </div>
                </div>

                {/* Progress Ring */}
                <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#2a2a2a"
                            strokeWidth="6"
                            fill="none"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="url(#achievementGradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${(4 / 6) * 175.9} 175.9`}
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#da2128" />
                                <stop offset="100%" stopColor="#9b1c1f" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-sm">67%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {badges.map((badge, index) => {
                    const Icon = badge.icon;

                    return (
                        <div
                            key={index}
                            className={`relative p-4 rounded-xl border transition-all duration-300 ${badge.unlocked
                                    ? 'bg-zinc-900/50 border-zinc-800 hover:border-[#da2128] hover:scale-105 cursor-pointer'
                                    : 'bg-zinc-900/20 border-zinc-900 opacity-50'
                                }`}
                        >
                            <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${badge.gradient} rounded-xl flex items-center justify-center shadow-lg ${badge.unlocked ? '' : 'grayscale'}`}>
                                <Icon size={24} />
                            </div>

                            <h4 className="text-white text-center text-sm mb-1">
                                {badge.title}
                            </h4>
                            <p className="text-zinc-500 text-xs text-center mb-2">
                                {badge.description}
                            </p>
                            <p className={`text-xs text-center ${badge.unlocked ? 'text-[#da2128]' : 'text-zinc-600'}`}>
                                {badge.date}
                            </p>

                            {badge.unlocked && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
