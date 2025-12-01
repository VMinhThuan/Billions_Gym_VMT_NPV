import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PTStudentChart = ({ data, title = "Thống kê học viên" }) => {
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
                <BarChart data={data}>
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
                    <Legend
                        wrapperStyle={{ color: '#8A8C90' }}
                        iconType="circle"
                    />
                    <Bar
                        dataKey="soHoiVien"
                        fill="#da2128"
                        radius={[8, 8, 0, 0]}
                        name="Số học viên"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PTStudentChart;
