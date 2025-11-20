import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingDown } from "lucide-react";

const data = [
    { month: 'T1', weight: 85, target: 82 },
    { month: 'T2', weight: 84, target: 81 },
    { month: 'T3', weight: 82, target: 80 },
    { month: 'T4', weight: 81, target: 79 },
    { month: 'T5', weight: 80, target: 78 },
    { month: 'T6', weight: 78, target: 77 },
    { month: 'T7', weight: 78, target: 76 },
];

export function WeightChart() {
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
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                            domain={[75, 86]}
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
                    <p className="font-bold text-white">85 kg</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Hiện tại</p>
                    <p className="font-bold text-[#da2128]">78 kg</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Đã giảm</p>
                    <p className="font-bold text-green-400">-7 kg</p>
                </div>
            </div>
        </div>
    );
}
