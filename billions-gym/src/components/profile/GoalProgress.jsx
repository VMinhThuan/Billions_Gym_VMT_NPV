import { Target, TrendingUp, Calendar } from "lucide-react";

export function GoalProgress() {
    const goals = [
        {
            title: "Giảm cân",
            current: 78,
            target: 75,
            unit: "kg",
            deadline: "31/12/2025"
        },
        {
            title: "Tăng cơ",
            current: 12,
            target: 15,
            unit: "%",
            deadline: "31/03/2026"
        },
        {
            title: "Giảm mỡ",
            current: 18,
            target: 15,
            unit: "%",
            deadline: "31/01/2026"
        }
    ];

    return (
        <div className="bg-[#141414] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                    <Target size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Mục tiêu của tôi</h3>
            </div>

            <div className="space-y-5">
                {goals.map((goal, index) => {
                    const progress = (goal.current / goal.target) * 100;

                    return (
                        <div key={index} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-white">{goal.title}</span>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <Calendar size={12} />
                                        <span>{goal.deadline}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white">
                                        {goal.current}{goal.unit}
                                    </span>
                                    <span className="text-zinc-500">/</span>
                                    <span className="text-zinc-400">
                                        {goal.target}{goal.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[#da2128] to-[#ff4147] rounded-full transition-all duration-700 group-hover:shadow-lg group-hover:shadow-[#da2128]/50`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-[#da2128]/10 to-transparent rounded-xl border border-[#da2128]/20">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#da2128]/20 rounded-lg">
                        <TrendingUp size={18} className="text-[#da2128]" />
                    </div>
                    <div>
                        <p className="text-white text-sm mb-1">Tiến độ tốt!</p>
                        <p className="text-zinc-400 text-xs">
                            Bạn đang đạt 85% mục tiêu đề ra. Tiếp tục duy trì!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
