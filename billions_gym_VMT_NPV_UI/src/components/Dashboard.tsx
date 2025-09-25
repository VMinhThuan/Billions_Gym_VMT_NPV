import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface DashboardProps {
    stats: any[];
    recentAppointments: any[];
    recentPayments: any[];
    topPTs: any[];
    isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
    stats,
    recentAppointments,
    recentPayments,
    topPTs,
    isLoading
}) => {
    // Dữ liệu mẫu cho biểu đồ
    const memberGrowthData = [
        { month: 'T1', members: 45, newMembers: 12 },
        { month: 'T2', members: 52, newMembers: 8 },
        { month: 'T3', members: 48, newMembers: 6 },
        { month: 'T4', members: 61, newMembers: 15 },
        { month: 'T5', members: 67, newMembers: 9 },
        { month: 'T6', members: 73, newMembers: 11 },
        { month: 'T7', members: 78, newMembers: 8 },
        { month: 'T8', members: 82, newMembers: 7 },
        { month: 'T9', members: 89, newMembers: 12 },
        { month: 'T10', members: 95, newMembers: 9 },
        { month: 'T11', members: 98, newMembers: 6 },
        { month: 'T12', members: 105, newMembers: 10 }
    ];

    const revenueData = [
        { month: 'T1', revenue: 45000000, expenses: 28000000 },
        { month: 'T2', revenue: 52000000, expenses: 32000000 },
        { month: 'T3', revenue: 48000000, expenses: 30000000 },
        { month: 'T4', revenue: 61000000, expenses: 35000000 },
        { month: 'T5', revenue: 67000000, expenses: 38000000 },
        { month: 'T6', revenue: 73000000, expenses: 42000000 },
        { month: 'T7', revenue: 78000000, expenses: 45000000 },
        { month: 'T8', revenue: 82000000, expenses: 48000000 },
        { month: 'T9', revenue: 89000000, expenses: 52000000 },
        { month: 'T10', revenue: 95000000, expenses: 55000000 },
        { month: 'T11', revenue: 98000000, expenses: 58000000 },
        { month: 'T12', revenue: 105000000, expenses: 62000000 }
    ];

    const memberStatusData = [
        { name: 'Đang hoạt động', value: 78, color: '#10b981' },
        { name: 'Tạm ngừng', value: 12, color: '#f59e0b' },
        { name: 'Hết hạn', value: 8, color: '#ef4444' }
    ];

    const packagePopularityData = [
        { name: 'Gói 1 tháng', value: 35, color: '#ff6b6b' },      // Coral Red
        { name: 'Gói 3 tháng', value: 28, color: '#4ecdc4' },      // Turquoise  
        { name: 'Gói 6 tháng', value: 20, color: '#45b7d1' },      // Sky Blue
        { name: 'Gói 12 tháng', value: 17, color: '#ffa726' }      // Orange (thay vì vàng)
    ];

    const workoutFrequencyData = [
        { day: 'T2', sessions: 45 },
        { day: 'T3', sessions: 52 },
        { day: 'T4', sessions: 48 },
        { day: 'T5', sessions: 61 },
        { day: 'T6', sessions: 67 },
        { day: 'T7', sessions: 73 },
        { day: 'CN', sessions: 38 }
    ];

    const packageRevenueData = [
        { name: 'Gói 1 tháng', revenue: 45000000, subscribers: 35, color: '#ff6b6b' },
        { name: 'Gói 3 tháng', revenue: 78000000, subscribers: 28, color: '#4ecdc4' },
        { name: 'Gói 6 tháng', revenue: 95000000, subscribers: 20, color: '#45b7d1' },
        { name: 'Gói 12 tháng', revenue: 125000000, subscribers: 17, color: '#ffa726' }
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <p className="tooltip-label">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.name.includes('revenue') || entry.name.includes('expenses')
                                ? formatCurrency(entry.value)
                                : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu biểu đồ...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Biểu đồ tăng trưởng hội viên */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3>Tăng trưởng hội viên theo tháng</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={memberGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="members"
                                stackId="1"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.6}
                                name="Tổng hội viên"
                            />
                            <Area
                                type="monotone"
                                dataKey="newMembers"
                                stackId="2"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.8}
                                name="Hội viên mới"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ doanh thu */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3>Doanh thu và chi phí theo tháng</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
                            <Bar dataKey="expenses" fill="#ef4444" name="Chi phí" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ trạng thái hội viên */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3>Trạng thái hội viên</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={memberStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, value, percent }) => `${name}: ${value} (${((percent as number) * 100).toFixed(0)}%)`}
                                outerRadius={90}
                                innerRadius={45}
                                stroke="none"
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {memberStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                layout="horizontal"
                                wrapperStyle={{ 
                                    paddingTop: '20px',
                                    fontSize: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ gói tập phổ biến */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3>Gói tập phổ biến</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={packagePopularityData}
                                cx="45%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                stroke="none"
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {packagePopularityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                                verticalAlign="middle" 
                                align="right"
                                layout="vertical"
                                wrapperStyle={{ 
                                    paddingLeft: '0px',
                                    fontSize: '13px',
                                    lineHeight: '22px',
                                    width: '35%',
                                    marginLeft: '-10px'
                                }}
                                formatter={(value, entry: any) => `${value} ${entry?.payload?.value || 0}%`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ tần suất tập luyện */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3>Tần suất tập luyện trong tuần</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={workoutFrequencyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="sessions"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                                name="Số buổi tập"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ phân tích doanh thu theo gói tập */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3>Phân tích doanh thu theo gói tập</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={packageRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                            <Tooltip 
                                formatter={(value: any) => [`${formatCurrency(value)}`, 'Doanh thu']}
                                labelStyle={{ color: 'var(--text-primary)' }}
                                cursor={false}
                                contentStyle={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Legend 
                                wrapperStyle={{
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    fontWeight: '700'
                                }}
                                formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '700' }}>{value}</span>}
                            />
                            <Bar dataKey="revenue" name="Doanh thu">
                                {packageRevenueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
