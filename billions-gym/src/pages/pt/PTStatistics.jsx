import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import {
    TrendingUp, TrendingDown, Users, Calendar, DollarSign,
    Activity, Star, Target, Award, Clock, Download,
    Filter, ChevronDown, BarChart3, PieChart, LineChart,
    UserCheck, Flame, CheckCircle, AlertCircle, ArrowUp, ArrowDown
} from 'lucide-react';
import ptService from '../../services/pt.service';

const PTStatistics = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('month'); // day, week, month, year
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Mock data - Replace with API calls
    const [statsData, setStatsData] = useState({
        quickStats: {
            sessionsToday: 4,
            sessionsChange: 15.3,
            revenueWeek: 12500000,
            revenueChange: 8.7,
            activeClients: 28,
            clientsChange: 12.0,
            avgRating: 4.8,
            ratingChange: 2.1
        },
        performance: {
            totalSessions: 156,
            completionRate: 94.2,
            avgDuration: 58, // minutes
            cancelRate: 5.8,
            sessionsData: [
                { date: '01/12', sessions: 5 },
                { date: '02/12', sessions: 6 },
                { date: '03/12', sessions: 4 },
                { date: '04/12', sessions: 7 },
                { date: '05/12', sessions: 5 },
                { date: '06/12', sessions: 12 },
                { date: '07/12', sessions: 6 }
            ]
        },
        clientManagement: {
            retentionRate: 92,
            topClients: [
                { id: 1, name: 'Nguyễn Văn An', sessions: 24, revenue: 15000000, progress: 85, status: 'active' },
                { id: 2, name: 'Phạm Thu Hà', sessions: 27, revenue: 18000000, progress: 90, status: 'active' },
                { id: 3, name: 'Trần Thị Bích', sessions: 18, revenue: 12000000, progress: 65, status: 'active' },
                { id: 4, name: 'Lê Minh Tuấn', sessions: 20, revenue: 13500000, progress: 75, status: 'warning' },
                { id: 5, name: 'Hoàng Đức Minh', sessions: 16, revenue: 10000000, progress: 60, status: 'warning' }
            ],
            clientProgress: {
                onTrack: 22,
                needsAttention: 4,
                atRisk: 2
            }
        },
        revenue: {
            monthlyRevenue: 45000000,
            commission: 13500000,
            commissionRate: 30,
            forecast: 48000000,
            breakdown: [
                { type: 'Premium PT', count: 18, revenue: 27000000, percentage: 60 },
                { type: 'Standard PT', count: 10, revenue: 12000000, percentage: 27 },
                { type: 'Trial PT', count: 4, revenue: 6000000, percentage: 13 }
            ],
            monthlyTrend: [
                { month: 'T7', revenue: 38000000 },
                { month: 'T8', revenue: 42000000 },
                { month: 'T9', revenue: 40000000 },
                { month: 'T10', revenue: 43000000 },
                { month: 'T11', revenue: 44000000 },
                { month: 'T12', revenue: 45000000 }
            ]
        },
        sessionAnalysis: {
            byType: [
                { type: 'HIIT', count: 45, percentage: 28.8 },
                { type: 'Strength', count: 52, percentage: 33.3 },
                { type: 'Cardio', count: 35, percentage: 22.4 },
                { type: 'Yoga', count: 24, percentage: 15.4 }
            ],
            ratingDistribution: {
                5: 65,
                4: 25,
                3: 7,
                2: 2,
                1: 1
            },
            feedback: [
                { client: 'Nguyễn Văn An', rating: 5, comment: 'PT rất nhiệt tình và chuyên nghiệp!', date: '2025-12-02' },
                { client: 'Phạm Thu Hà', rating: 5, comment: 'Kết quả rất tốt, cảm ơn PT!', date: '2025-12-01' },
                { client: 'Trần Thị Bích', rating: 4, comment: 'Tốt, nhưng muốn có thêm bài tập mới', date: '2025-11-30' }
            ]
        },
        insights: {
            summary: 'Tháng này bạn tăng 15% số buổi tập so với tháng trước. Retention rate cao 92%. Tiếp tục duy trì!',
            actions: [
                { type: 'warning', text: 'Có 3 khách hàng sắp hết gói tập', action: 'Liên hệ ngay' },
                { type: 'info', text: '2 khách hàng cần theo dõi tiến độ', action: 'Xem chi tiết' },
                { type: 'success', text: '5 khách hàng đạt mục tiêu tháng này', action: 'Gửi lời chúc' }
            ]
        }
    });

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadStatistics();
    }, [timeFilter]);

    const loadStatistics = async () => {
        setLoading(true);
        try {
            // TODO: API Integration - Thay thế mock data bằng API thực
            // Ví dụ:
            // const response = await ptService.getDetailedStatistics({ 
            //     period: timeFilter,  // 'day', 'week', 'month', 'year'
            //     startDate: startDate,
            //     endDate: endDate
            // });
            // 
            // Response format:
            // {
            //   quickStats: { sessionsToday, revenueWeek, activeClients, avgRating, ... },
            //   performance: { totalSessions, completionRate, sessionsData: [{ date, sessions }, ...] },
            //   clientManagement: { retentionRate, topClients: [...], clientProgress: {...} },
            //   revenue: { monthlyRevenue, commission, breakdown: [...], monthlyTrend: [...] },
            //   sessionAnalysis: { byType: [...], ratingDistribution: {...}, feedback: [...] },
            //   insights: { summary, actions: [...] }
            // }
            // setStatsData(response.data);

            // Simulate API delay (REMOVE when using real API)
            setTimeout(() => {
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Error loading statistics:', error);
            setLoading(false);
        }
    };

    const handleExportReport = (format) => {
        // TODO: Implement export functionality
        alert(`Xuất báo cáo ${format.toUpperCase()} - Tính năng đang phát triển`);
    };

    const sidebarWidth = sidebarCollapsed ? 80 : 320;
    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    const timeFilterOptions = [
        { value: 'day', label: 'Hôm nay' },
        { value: 'week', label: 'Tuần này' },
        { value: 'month', label: 'Tháng này' },
        { value: 'year', label: 'Năm nay' }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-[1600px] mx-auto">
                    {/* Header Section with Filters */}
                    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#141414] rounded-2xl p-6 mb-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Thống Kê & Báo Cáo</h1>
                                <p className="text-gray-400 text-sm">Theo dõi hiệu suất, khách hàng và doanh thu của bạn</p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Time Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white hover:border-[#da2128] transition-all cursor-pointer"
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span>{timeFilterOptions.find(opt => opt.value === timeFilter)?.label}</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showFilterDropdown && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50 overflow-hidden">
                                            {timeFilterOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setTimeFilter(option.value);
                                                        setShowFilterDropdown(false);
                                                    }}
                                                    className={`w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] transition-colors ${timeFilter === option.value ? 'text-[#da2128] bg-[#2a2a2a]' : 'text-white'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Export Buttons */}
                                <button
                                    onClick={() => handleExportReport('pdf')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#da2128] hover:bg-[#ff3842] text-white rounded-xl transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Xuất PDF</span>
                                </button>

                                <button
                                    onClick={() => handleExportReport('excel')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] border border-[#2a2a2a] text-white hover:border-[#da2128] rounded-xl transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Xuất Excel</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-12 gap-6">
                            {/* Left Sidebar - Quick Stats */}
                            <div className="col-span-12 lg:col-span-3 space-y-4">
                                {/* Sessions Today */}
                                <div className="bg-[#141414] rounded-2xl p-5 hover:border-[#da2128]/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#da2128] to-[#ff3842] rounded-xl flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-white" />
                                        </div>
                                        <span className={`flex items-center gap-1 text-sm font-medium ${statsData.quickStats.sessionsChange >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {statsData.quickStats.sessionsChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(statsData.quickStats.sessionsChange)}%
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-1">Buổi tập hôm nay</p>
                                    <h3 className="text-3xl font-bold text-white">{statsData.quickStats.sessionsToday}</h3>
                                </div>

                                {/* Revenue This Week */}
                                <div className="bg-[#141414] rounded-2xl p-5 hover:border-[#da2128]/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-green-500" />
                                        </div>
                                        <span className={`flex items-center gap-1 text-sm font-medium ${statsData.quickStats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {statsData.quickStats.revenueChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(statsData.quickStats.revenueChange)}%
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-1">Doanh thu tuần</p>
                                    <h3 className="text-2xl font-bold text-white">{(statsData.quickStats.revenueWeek / 1000000).toFixed(1)}M</h3>
                                </div>

                                {/* Active Clients */}
                                <div className="bg-[#141414] rounded-2xl p-5 hover:border-[#da2128]/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <span className={`flex items-center gap-1 text-sm font-medium ${statsData.quickStats.clientsChange >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {statsData.quickStats.clientsChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(statsData.quickStats.clientsChange)}%
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-1">Khách hàng active</p>
                                    <h3 className="text-3xl font-bold text-white">{statsData.quickStats.activeClients}</h3>
                                </div>

                                {/* Average Rating */}
                                <div className="bg-[#141414] rounded-2xl p-5 hover:border-[#da2128]/50 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                            <Star className="w-6 h-6 text-yellow-500" />
                                        </div>
                                        <span className={`flex items-center gap-1 text-sm font-medium ${statsData.quickStats.ratingChange >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {statsData.quickStats.ratingChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {Math.abs(statsData.quickStats.ratingChange)}%
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-1">Đánh giá TB</p>
                                    <h3 className="text-3xl font-bold text-white">{statsData.quickStats.avgRating}<span className="text-lg text-gray-400">/5</span></h3>
                                </div>
                            </div>

                            {/* Center - Main Charts */}
                            <div className="col-span-12 lg:col-span-6 space-y-6">
                                {/* Performance Chart */}
                                <div className="bg-[#141414] rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Hiệu Suất Cá Nhân</h2>
                                            <p className="text-gray-400 text-sm">Số buổi tập theo thời gian</p>
                                        </div>
                                        <LineChart className="w-6 h-6 text-[#da2128]" />
                                    </div>

                                    {/* Bar Chart */}
                                    <div className="space-y-4">
                                        <div className="relative h-48 flex items-end justify-between gap-2 px-2">
                                            {statsData.performance.sessionsData.map((day, index) => {
                                                // Tìm giá trị max để scale biểu đồ
                                                const maxSessions = Math.max(...statsData.performance.sessionsData.map(d => d.sessions));
                                                const heightPercentage = (day.sessions / maxSessions) * 100;

                                                return (
                                                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                                                        <div className="w-full h-full flex items-end justify-center">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-[#da2128] to-[#ff3842] rounded-t-lg hover:opacity-80 transition-all cursor-pointer relative group"
                                                                style={{ height: `${heightPercentage}%` }}
                                                            >
                                                                {/* Tooltip */}
                                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-10">
                                                                    <span className="font-bold text-[#da2128]">{day.sessions}</span> buổi tập
                                                                </div>
                                                                {/* Số trên thanh */}
                                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-white">
                                                                    {day.sessions}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-medium">{day.date}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Performance Metrics */}
                                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6">
                                        <div className="text-center">
                                            <p className="text-gray-400 text-xs mb-1">Tổng buổi</p>
                                            <p className="text-2xl font-bold text-white">{statsData.performance.totalSessions}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-400 text-xs mb-1">Hoàn thành</p>
                                            <p className="text-2xl font-bold text-green-500">{statsData.performance.completionRate}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-400 text-xs mb-1">Thời gian TB</p>
                                            <p className="text-2xl font-bold text-white">{statsData.performance.avgDuration}<span className="text-sm text-gray-400">ph</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Breakdown */}
                                <div className="bg-[#141414] rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Doanh Thu & KPI</h2>
                                            <p className="text-gray-400 text-sm">Phân tích tài chính</p>
                                        </div>
                                        <PieChart className="w-6 h-6 text-[#da2128]" />
                                    </div>

                                    {/* Revenue Cards */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-[#1a1a1a] rounded-xl p-4">
                                            <p className="text-gray-400 text-xs mb-2">Doanh thu tháng</p>
                                            <p className="text-2xl font-bold text-white">{(statsData.revenue.monthlyRevenue / 1000000).toFixed(1)}M</p>
                                        </div>
                                        <div className="bg-[#1a1a1a] rounded-xl p-4">
                                            <p className="text-gray-400 text-xs mb-2">Hoa hồng ({statsData.revenue.commissionRate}%)</p>
                                            <p className="text-2xl font-bold text-green-500">{(statsData.revenue.commission / 1000000).toFixed(1)}M</p>
                                        </div>
                                    </div>

                                    {/* Package Breakdown */}
                                    <div className="space-y-3">
                                        {statsData.revenue.breakdown.map((item, index) => (
                                            <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-white font-medium">{item.type}</span>
                                                    <span className="text-[#da2128] font-bold">{(item.revenue / 1000000).toFixed(1)}M</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#da2128] to-[#ff3842] rounded-full"
                                                            style={{ width: `${item.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-400">{item.count} khách</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Session Analysis */}
                                <div className="bg-[#141414] rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Phân Tích Buổi Tập</h2>
                                            <p className="text-gray-400 text-sm">Theo loại và đánh giá</p>
                                        </div>
                                        <BarChart3 className="w-6 h-6 text-[#da2128]" />
                                    </div>

                                    {/* Session Types */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {statsData.sessionAnalysis.byType.map((type, index) => (
                                            <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-white text-sm font-medium">{type.type}</span>
                                                    <span className="text-[#da2128] font-bold">{type.count}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#da2128] to-[#ff3842] rounded-full"
                                                            style={{ width: `${type.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{type.percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Rating Distribution */}
                                    <div className="pt-4 border-t border-[#2a2a2a]">
                                        <p className="text-white font-medium mb-3">Phân bổ đánh giá</p>
                                        {[5, 4, 3, 2, 1].map(rating => (
                                            <div key={rating} className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-1 w-16">
                                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                    <span className="text-sm text-white">{rating}</span>
                                                </div>
                                                <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                                                        style={{ width: `${statsData.sessionAnalysis.ratingDistribution[rating]}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-400 w-12 text-right">{statsData.sessionAnalysis.ratingDistribution[rating]}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Insights & Actions */}
                            <div className="col-span-12 lg:col-span-3 space-y-6">
                                {/* AI Summary */}
                                <div className="bg-gradient-to-br from-[#da2128] to-[#ff3842] rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <Flame className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-white font-bold">Insights</h3>
                                    </div>
                                    <p className="text-white/90 text-sm leading-relaxed">{statsData.insights.summary}</p>
                                </div>

                                {/* Action Items */}
                                <div className="bg-[#141414] rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-[#da2128]" />
                                        Cần chú ý
                                    </h3>
                                    <div className="space-y-3">
                                        {statsData.insights.actions.map((action, index) => (
                                            <div key={index} className={`p-3 rounded-xl border ${action.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                                                action.type === 'info' ? 'bg-blue-500/5 border-blue-500/20' :
                                                    'bg-green-500/5 border-green-500/20'
                                                }`}>
                                                <div className="flex items-start gap-2 mb-2">
                                                    {action.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                                                    {action.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
                                                    {action.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                                                    <p className={`text-sm flex-1 ${action.type === 'warning' ? 'text-yellow-200' :
                                                        action.type === 'info' ? 'text-blue-200' :
                                                            'text-green-200'
                                                        }`}>{action.text}</p>
                                                </div>
                                                <button className={`text-xs font-medium hover:underline ${action.type === 'warning' ? 'text-yellow-400' :
                                                    action.type === 'info' ? 'text-blue-400' :
                                                        'text-green-400'
                                                    }`}>
                                                    {action.action} →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Clients */}
                                <div className="bg-[#141414] rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-[#da2128]" />
                                        Top 5 Khách Hàng
                                    </h3>
                                    <div className="space-y-3">
                                        {statsData.clientManagement.topClients.map((client, index) => (
                                            <div key={client.id} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3 hover:bg-[#2a2a2a] transition-all cursor-pointer group">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800' :
                                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                                            'bg-[#2a2a2a] text-gray-400'
                                                    }`}>
                                                    #{index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate group-hover:text-[#da2128] transition-colors">{client.name}</p>
                                                    <p className="text-gray-400 text-xs">{client.sessions} buổi</p>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                                                    }`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Client Progress Summary */}
                                <div className="bg-[#141414] rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <UserCheck className="w-5 h-5 text-[#da2128]" />
                                        Tình trạng khách hàng
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl">
                                            <span className="text-green-400 text-sm">Đúng lộ trình</span>
                                            <span className="text-green-400 font-bold text-lg">{statsData.clientManagement.clientProgress.onTrack}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl">
                                            <span className="text-yellow-400 text-sm">Cần theo dõi</span>
                                            <span className="text-yellow-400 font-bold text-lg">{statsData.clientManagement.clientProgress.needsAttention}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl">
                                            <span className="text-red-400 text-sm">Có nguy cơ</span>
                                            <span className="text-red-400 font-bold text-lg">{statsData.clientManagement.clientProgress.atRisk}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Feedback */}
                                <div className="bg-[#141414] rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-[#da2128]" />
                                        Phản hồi gần đây
                                    </h3>
                                    <div className="space-y-3">
                                        {statsData.sessionAnalysis.feedback.map((fb, index) => (
                                            <div key={index} className="bg-[#1a1a1a] rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-white text-sm font-medium">{fb.client}</span>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(fb.rating)].map((_, i) => (
                                                            <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-xs mb-2">{fb.comment}</p>
                                                <p className="text-gray-500 text-xs">{new Date(fb.date).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTStatistics;
