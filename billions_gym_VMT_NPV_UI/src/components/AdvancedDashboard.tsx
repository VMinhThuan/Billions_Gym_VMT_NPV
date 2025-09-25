import React, { useState, useEffect } from 'react';
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
    ResponsiveContainer,
    ComposedChart,
    Scatter,
    ScatterChart,
    RadialBarChart,
    RadialBar
} from 'recharts';

interface AdvancedDashboardProps {
    stats: any[];
    recentAppointments: any[];
    recentPayments: any[];
    topPTs: any[];
    isLoading: boolean;
}

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
    stats,
    recentAppointments,
    recentPayments,
    topPTs,
    isLoading
}) => {
    const [selectedPeriod, setSelectedPeriod] = useState('6months');
    const [selectedChart, setSelectedChart] = useState('all');
    const [timeRange, setTimeRange] = useState('6'); // New state for time range

    // Dữ liệu đầy đủ 12 tháng
    const fullWorkoutTimeData = [
        { month: 'T1', avgTime: 1.2, sessions: 15 },
        { month: 'T2', avgTime: 1.4, sessions: 18 },
        { month: 'T3', avgTime: 1.6, sessions: 22 },
        { month: 'T4', avgTime: 1.8, sessions: 25 },
        { month: 'T5', avgTime: 1.5, sessions: 20 },
        { month: 'T6', avgTime: 1.7, sessions: 24 },
        { month: 'T7', avgTime: 1.9, sessions: 28 },
        { month: 'T8', avgTime: 2.1, sessions: 30 },
        { month: 'T9', avgTime: 1.8, sessions: 26 },
        { month: 'T10', avgTime: 1.6, sessions: 22 },
        { month: 'T11', avgTime: 1.4, sessions: 19 },
        { month: 'T12', avgTime: 1.3, sessions: 16 }
    ];

    const fullMemberEngagementData = [
        { month: 'T1', activeMembers: 45, newMembers: 12, churnedMembers: 3, engagement: 78 },
        { month: 'T2', activeMembers: 52, newMembers: 8, churnedMembers: 1, engagement: 82 },
        { month: 'T3', activeMembers: 48, newMembers: 6, churnedMembers: 4, engagement: 75 },
        { month: 'T4', activeMembers: 61, newMembers: 15, churnedMembers: 2, engagement: 85 },
        { month: 'T5', activeMembers: 67, newMembers: 9, churnedMembers: 3, engagement: 88 },
        { month: 'T6', activeMembers: 73, newMembers: 11, churnedMembers: 5, engagement: 90 },
        { month: 'T7', activeMembers: 78, newMembers: 13, churnedMembers: 4, engagement: 92 },
        { month: 'T8', activeMembers: 82, newMembers: 10, churnedMembers: 2, engagement: 94 },
        { month: 'T9', activeMembers: 79, newMembers: 7, churnedMembers: 6, engagement: 89 },
        { month: 'T10', activeMembers: 75, newMembers: 5, churnedMembers: 3, engagement: 87 },
        { month: 'T11', activeMembers: 71, newMembers: 4, churnedMembers: 2, engagement: 85 },
        { month: 'T12', activeMembers: 68, newMembers: 6, churnedMembers: 1, engagement: 83 }
    ];

    // Function to filter data based on selected time range
    const getFilteredData = (data: any[], months: number) => {
        return data.slice(-months);
    };

    // Get filtered data based on timeRange
    const workoutTimeData = getFilteredData(fullWorkoutTimeData, parseInt(timeRange));
    const memberEngagementData = getFilteredData(fullMemberEngagementData, parseInt(timeRange));

    const workoutIntensityData = [
        { time: '6:00', intensity: 20, members: 5 },
        { time: '7:00', intensity: 45, members: 12 },
        { time: '8:00', intensity: 60, members: 18 },
        { time: '9:00', intensity: 40, members: 8 },
        { time: '10:00', intensity: 30, members: 6 },
        { time: '11:00', intensity: 25, members: 4 },
        { time: '12:00', intensity: 15, members: 2 },
        { time: '13:00', intensity: 20, members: 3 },
        { time: '14:00', intensity: 35, members: 7 },
        { time: '15:00', intensity: 50, members: 14 },
        { time: '16:00', intensity: 70, members: 22 },
        { time: '17:00', intensity: 85, members: 28 },
        { time: '18:00', intensity: 90, members: 32 },
        { time: '19:00', intensity: 80, members: 25 },
        { time: '20:00', intensity: 60, members: 18 },
        { time: '21:00', intensity: 40, members: 12 },
        { time: '22:00', intensity: 20, members: 5 }
    ];

    const ptPerformanceData = [
        { name: 'Nguyễn Văn A', rating: 4.8, sessions: 45, revenue: 12000000 },
        { name: 'Trần Thị B', rating: 4.6, sessions: 38, revenue: 9500000 },
        { name: 'Lê Văn C', rating: 4.7, sessions: 42, revenue: 11000000 },
        { name: 'Phạm Thị D', rating: 4.5, sessions: 35, revenue: 8800000 },
        { name: 'Hoàng Văn E', rating: 4.9, sessions: 48, revenue: 13000000 }
    ];

    const memberRetentionData = [
        { name: 'Tháng 1', retention: 85 },
        { name: 'Tháng 2', retention: 88 },
        { name: 'Tháng 3', retention: 82 },
        { name: 'Tháng 4', retention: 90 },
        { name: 'Tháng 5', retention: 87 },
        { name: 'Tháng 6', retention: 92 }
    ];

    const packageComparisonData = [
        { name: 'Gói 1 tháng', price: 500000, members: 35, satisfaction: 78 },
        { name: 'Gói 3 tháng', price: 1200000, members: 28, satisfaction: 85 },
        { name: 'Gói 6 tháng', price: 2000000, members: 20, satisfaction: 92 },
        { name: 'Gói 12 tháng', price: 3500000, members: 17, satisfaction: 95 }
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
                            {entry.name}: {entry.name.includes('revenue') || entry.name.includes('price')
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
                <p>Đang tải dữ liệu biểu đồ nâng cao...</p>
            </div>
        );
    }

    return (
        <div className="advanced-dashboard">
            {/* Controls */}
            <div className="dashboard-controls">
                <div className="control-group">
                    <label>Thời gian hiển thị:</label>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="control-select"
                    >
                        <option value="1">1 tháng</option>
                        <option value="3">3 tháng</option>
                        <option value="6">6 tháng</option>
                        <option value="12">1 năm</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>Loại biểu đồ:</label>
                    <select
                        value={selectedChart}
                        onChange={(e) => setSelectedChart(e.target.value)}
                        className="control-select"
                    >
                        <option value="all">Tất cả</option>
                        <option value="revenue">Doanh thu</option>
                        <option value="members">Hội viên</option>
                        <option value="workout">Tập luyện</option>
                    </select>
                </div>
            </div>

            {/* Biểu đồ tương tác */}
            <div className="interactive-charts">
                {/* Biểu đồ tương tác hội viên */}
                {(selectedChart === 'all' || selectedChart === 'members') && (
                    <div className="chart-section interactive">
                        <div className="chart-card">
                            <h3>Tương tác hội viên theo thời gian</h3>
                            <ResponsiveContainer width="100%" height={450}>
                                <ComposedChart data={memberEngagementData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="activeMembers" fill="#3b82f6" name="Hội viên hoạt động" />
                                    <Bar yAxisId="left" dataKey="newMembers" fill="#10b981" name="Hội viên mới" />
                                    <Bar yAxisId="left" dataKey="churnedMembers" fill="#ef4444" name="Hội viên rời đi" />
                                    <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={3} name="Tỷ lệ tương tác (%)" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Biểu đồ cường độ tập luyện */}
                {(selectedChart === 'all' || selectedChart === 'workout') && (
                    <div className="chart-section interactive">
                        <div className="chart-card">
                            <h3>Cường độ tập luyện theo giờ</h3>
                            <ResponsiveContainer width="100%" height={450}>
                                <ScatterChart data={workoutIntensityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis dataKey="intensity" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Scatter
                                        dataKey="members"
                                        fill="#f59e0b"
                                        name="Số hội viên"
                                        r={6}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Biểu đồ doanh thu phân loại */}
                {(selectedChart === 'all' || selectedChart === 'revenue') && (
                    <div className="chart-section interactive">
                        <div className="chart-card">
                            <h3>Thời gian tập luyện trung bình theo tháng</h3>
                            <ResponsiveContainer width="100%" height={450}>
                                <LineChart data={workoutTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `${value}h`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="avgTime" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                                        name="Thời gian TB (giờ)" 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="sessions" 
                                        stroke="#f59e0b" 
                                        strokeWidth={2}
                                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                                        name="Số buổi tập" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Biểu đồ hiệu suất PT */}
                <div className="chart-section interactive">
                    <div className="chart-card">
                        <h3>Hiệu suất PT (Rating vs Doanh thu)</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <ScatterChart data={ptPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="rating" name="Đánh giá" />
                                <YAxis dataKey="revenue" name="Doanh thu" tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Scatter
                                    dataKey="sessions"
                                    fill="#8b5cf6"
                                    name="Số buổi tập"
                                    r={8}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ giữ chân hội viên */}
                <div className="chart-section interactive">
                    <div className="chart-card">
                        <h3>Tỷ lệ giữ chân hội viên</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <AreaChart data={memberRetentionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="retention"
                                    stroke="#06b6d4"
                                    fill="#06b6d4"
                                    fillOpacity={0.6}
                                    name="Tỷ lệ giữ chân (%)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Biểu đồ so sánh gói tập */}
                <div className="chart-section interactive">
                    <div className="chart-card">
                        <h3>So sánh gói tập (Giá vs Số lượng vs Hài lòng)</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <ComposedChart data={packageComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="members" fill="#3b82f6" name="Số hội viên" />
                                <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#10b981" strokeWidth={3} name="Độ hài lòng (%)" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedDashboard;
