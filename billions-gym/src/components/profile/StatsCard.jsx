export function StatsCard({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    trendUp,
    gradient = "from-[#da2128] to-[#9b1c1f]"
}) {
    return (
        <div className="relative bg-[#141414] rounded-xl p-6 overflow-hidden group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-[#da2128]/20">
            {/* Background Gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-300`}></div>

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
                        <Icon size={24} />
                    </div>
                    {trend && (
                        <div className={`px-3 py-1 rounded-lg text-sm ${trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </div>
                    )}
                </div>

                <p className="text-zinc-400 text-sm mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-bold text-white">{value}</h2>
                    <span className="text-zinc-500">{unit}</span>
                </div>
            </div>
        </div>
    );
}
