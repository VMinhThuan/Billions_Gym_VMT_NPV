import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingDown } from "lucide-react";

export function WeightChart({ bodyStats, bodyMetrics }) {
    const parseWeightData = () => {
        if (!bodyStats || !bodyStats.lichSuChiSo) {
            // Fallback to bodyMetrics if available
            if (bodyMetrics) {
                return {
                    chartData: [{
                        month: 'Hiện tại',
                        weight: bodyMetrics.canNang || 0,
                        target: bodyMetrics.mucTieuCanNang || 0
                    }],
                    startWeight: bodyMetrics.canNang || 0,
                    currentWeight: bodyMetrics.canNang || 0,
                    targetWeight: bodyMetrics.mucTieuCanNang || 0,
                    totalChange: 0
                };
            }
            return {
                chartData: [],
                startWeight: 0,
                currentWeight: 0,
                targetWeight: 0,
                totalChange: 0
            };
        }

        const history = Array.isArray(bodyStats.lichSuChiSo) ? bodyStats.lichSuChiSo : [];
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        // Get last 7 records, reverse to show oldest to newest
        const recentHistory = history.slice(0, 7).reverse();
        const chartData = recentHistory.map((record, index) => {
            const weight = record.canNang || 0;
            const target = record.mucTieuCanNang || bodyStats?.chiSoHienTai?.mucTieuCanNang || bodyMetrics?.mucTieuCanNang || 0;
            return {
                month: months[index] || `T${index + 1}`,
                weight,
                target
            };
        });

        // Fill remaining months if needed
        while (chartData.length < 7) {
            const index = chartData.length;
            chartData.push({
                month: months[index] || `T${index + 1}`,
                weight: bodyStats?.chiSoHienTai?.canNang || bodyMetrics?.canNang || 0,
                target: bodyStats?.chiSoHienTai?.mucTieuCanNang || bodyMetrics?.mucTieuCanNang || 0
            });
        }

        const oldest = history.length > 0 ? history[history.length - 1] : null;
        const latest = history.length > 0 ? history[0] : bodyStats?.chiSoHienTai;
        const startWeight = oldest?.canNang || latest?.canNang || bodyMetrics?.canNang || 0;
        const currentWeight = latest?.canNang || bodyMetrics?.canNang || startWeight;
        const targetWeight = latest?.mucTieuCanNang || bodyMetrics?.mucTieuCanNang || 0;
        const totalChange = currentWeight - startWeight;

        return { chartData, startWeight, currentWeight, targetWeight, totalChange };
    };

    const { chartData, startWeight, currentWeight, targetWeight, totalChange } = parseWeightData();

    // Calculate Y-axis domain
    const allWeights = chartData.map(d => d.weight).filter(w => w > 0);
    const minWeight = allWeights.length > 0 ? Math.min(...allWeights) - 5 : 70;
    const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) + 5 : 90;
    return (
        <div className="bg-[#141414] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-[#da2128] to-[#9b1c1f] rounded-lg">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Biểu đồ cân nặng</h3>
                        <p className="text-zinc-500 text-sm">6 tháng gần đây</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-[#da2128] to-[#ff4147] rounded-full"></div>
                        <span className="text-sm text-zinc-400">Thực tế</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-zinc-600 rounded-full"></div>
                        <span className="text-sm text-zinc-400">Mục tiêu</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#da2128" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#da2128" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis
                            dataKey="month"
                            stroke="#666"
                            style={{ fontSize: '12px', fontFamily: 'Poppins' }}
                        />
                        <YAxis
                            stroke="#666"
                            style={{ fontSize: '12px', fontFamily: 'Poppins' }}
                            domain={[minWeight, maxWeight]}
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
                        />
                        <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#da2128"
                            strokeWidth={3}
                            fill="url(#weightGradient)"
                        />
                        <Line
                            type="monotone"
                            dataKey="target"
                            stroke="#666"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Bắt đầu</p>
                    <p className="font-bold text-white">{startWeight > 0 ? `${startWeight} kg` : '--'}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Hiện tại</p>
                    <p className="font-bold text-[#da2128]">{currentWeight > 0 ? `${currentWeight} kg` : '--'}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">{totalChange > 0 ? 'Đã tăng' : 'Đã giảm'}</p>
                    <p className={`font-bold ${totalChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {totalChange !== 0 ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg` : '--'}
                    </p>
                </div>
            </div>
        </div>
    );
}
