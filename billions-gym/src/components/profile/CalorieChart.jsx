import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame } from "lucide-react";

const data = [
    { day: 'T2', calories: 2200, target: 2500 },
    { day: 'T3', calories: 2400, target: 2500 },
    { day: 'T4', calories: 2600, target: 2500 },
    { day: 'T5', calories: 2300, target: 2500 },
    { day: 'T6', calories: 2500, target: 2500 },
    { day: 'T7', calories: 2100, target: 2500 },
    { day: 'CN', calories: 2350, target: 2500 },
];

export function CalorieChart() {
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
                    <p className="font-bold text-white">2,500 kcal</p>
                </div>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                            {data.map((entry, index) => (
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
                    <p className="font-bold text-white">2,350 kcal</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Cao nhất</p>
                    <p className="font-bold text-[#da2128]">2,600 kcal</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-400 text-sm mb-1">Thấp nhất</p>
                    <p className="font-bold text-blue-400">2,100 kcal</p>
                </div>
            </div>
        </div>
    );
}
