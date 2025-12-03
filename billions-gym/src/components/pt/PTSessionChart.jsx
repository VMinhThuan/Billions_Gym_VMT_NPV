import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PTSessionChart = ({ data, title = "Thống kê buổi tập" }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
                <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    Chưa có dữ liệu
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#141414] rounded-xl p-6 border border-[#2a2a2a]">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#da2128" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#da2128" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis
                        dataKey="date"
                        stroke="#8A8C90"
                        tick={{ fill: '#8A8C90', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#8A8C90"
                        tick={{ fill: '#8A8C90', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="soBuoiTap"
                        stroke="#da2128"
                        fillOpacity={1}
                        fill="url(#colorSessions)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PTSessionChart;
