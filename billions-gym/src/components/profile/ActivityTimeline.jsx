import { Dumbbell, Utensils, Trophy, Calendar } from "lucide-react";

export function ActivityTimeline() {
    const activities = [
        {
            type: 'workout',
            title: 'Hoàn thành buổi tập Chest & Triceps',
            description: '45 phút • 350 kcal đốt cháy',
            time: '2 giờ trước',
            imageUrl: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dCUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzU4NDQ5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        },
        {
            type: 'meal',
            title: 'Bữa trưa - Ức gà nướng & Salad',
            description: '520 kcal • 45g protein',
            time: '4 giờ trước',
            imageUrl: 'https://images.unsplash.com/photo-1543352632-5a4b24e4d2a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbWVhbCUyMHByZXB8ZW58MXx8fHwxNzYzNTA5NDI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        },
        {
            type: 'achievement',
            title: 'Đạt thành tích mới: Deadlift 120kg',
            description: 'Tăng 10kg so với lần trước',
            time: '1 ngày trước',
            imageUrl: 'https://images.unsplash.com/photo-1706193589333-da530df63ecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBhY2hpZXZlbWVudCUyMHRyb3BoeXxlbnwxfHx8fDE3NjM2MzA5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
        },
        {
            type: 'workout',
            title: 'Buổi tập HIIT Cardio',
            description: '30 phút • 420 kcal đốt cháy',
            time: '2 ngày trước'
        },
        {
            type: 'meal',
            title: 'Bữa sáng - Yến mạch & Trứng',
            description: '380 kcal • 25g protein',
            time: '2 ngày trước'
        }
    ];

    const getIcon = (type) => {
        switch (type) {
            case 'workout':
                return Dumbbell;
            case 'meal':
                return Utensils;
            case 'achievement':
                return Trophy;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'workout':
                return 'from-[#da2128] to-[#9b1c1f]';
            case 'meal':
                return 'from-green-500 to-green-700';
            case 'achievement':
                return 'from-yellow-500 to-yellow-700';
        }
    };

    return (
        <div className="bg-[#141414] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                    <Calendar size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Hoạt động gần đây</h3>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                {activities.map((activity, index) => {
                    const Icon = getIcon(activity.type);
                    const gradient = getColor(activity.type);

                    return (
                        <div
                            key={index}
                            className="relative flex gap-4 group hover:bg-zinc-900/50 p-3 rounded-xl transition-all duration-300 cursor-pointer"
                        >
                            {/* Timeline line */}
                            {index < activities.length - 1 && (
                                <div className="absolute left-[22px] top-[50px] w-0.5 h-[calc(100%-30px)] bg-zinc-800"></div>
                            )}

                            {/* Icon */}
                            <div className={`relative flex-shrink-0 w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                                <Icon size={20} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="text-white mb-1 group-hover:text-[#da2128] transition-colors">
                                            {activity.title}
                                        </h4>
                                        <p className="text-zinc-400 text-sm">{activity.description}</p>
                                        <p className="text-zinc-600 text-xs mt-1">{activity.time}</p>
                                    </div>

                                    {activity.imageUrl && (
                                        <img
                                            src={activity.imageUrl}
                                            alt={activity.title}
                                            className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="w-full mt-4 py-3 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-[#da2128] transition-all duration-300">
                Xem tất cả hoạt động
            </button>
        </div>
    );
}
