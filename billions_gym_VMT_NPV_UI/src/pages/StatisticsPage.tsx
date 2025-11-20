import React, { useEffect, useMemo, useState } from 'react';
import { statisticsApi, OverallStats, MemberStatsByBranch, NewMemberStats, ExpiringPackages, RevenueStats, PackageStats, PTStats, CheckInStats, MemberStatusStats } from '../services/statistics';
import Loading from '../components/Loading';
import './StatisticsPage.css';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

const StatisticsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<OverallStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('overview');

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await statisticsApi.getOverallStats();
            setStats(data);
        } catch (err: any) {
            console.error('Error fetching statistics:', err);
            setError(err.message || 'Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const CHART_COLORS = ['#6366F1', '#22C55E', '#F97316', '#0EA5E9', '#A855F7', '#F43F5E', '#14B8A6'];

    const newMemberTrendData = useMemo(() => {
        if (!stats?.hoiVienMoi) return [];
        return [
            { label: 'Hôm qua', value: stats.hoiVienMoi.homNay?.soSanh || 0 },
            { label: 'Hôm nay', value: stats.hoiVienMoi.homNay?.soLuong || 0 },
            { label: 'Tuần này', value: stats.hoiVienMoi.tuanNay?.soLuong || 0 },
            { label: 'Tháng này', value: stats.hoiVienMoi.thangNay?.soLuong || 0 },
            { label: 'Năm này', value: stats.hoiVienMoi.namNay?.soLuong || 0 }
        ];
    }, [stats]);

    const branchChartData = useMemo(() => {
        return stats?.hoiVienTheoChiNhanh?.map(item => ({
            name: item.chiNhanh?.tenChiNhanh || 'N/A',
            total: item.tongSoHoiVien || 0,
            active: item.dangHoatDong || 0,
            inactive: (item.tamNgung || 0) + (item.hetHan || 0)
        })) || [];
    }, [stats]);

    const memberStatusData = useMemo(() => {
        return stats?.trangThaiHoiVien?.chiTiet?.map((item, index) => ({
            name: item.tenTrangThai || item.trangThai,
            value: item.soLuong || 0,
            color: CHART_COLORS[index % CHART_COLORS.length]
        })) || [];
    }, [stats]);

    const packagePieData = useMemo(() => {
        return stats?.goiTap?.theoGoiTap?.map((item, index) => ({
            name: item.goiTap?.tenGoiTap || 'N/A',
            value: item.soLuongDangKy || 0,
            color: CHART_COLORS[index % CHART_COLORS.length]
        })) || [];
    }, [stats]);

    const checkInBranchData = useMemo(() => {
        return stats?.checkIn?.theoChiNhanh?.map(item => ({
            name: item.tenChiNhanh || 'N/A',
            value: item.soLuongCheckIn || 0
        })) || [];
    }, [stats]);

    const topPackages = useMemo(() => {
        return (stats?.goiTap?.theoGoiTap || []).slice(0, 4);
    }, [stats]);

    const calendarInfo = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDate = new Date(year, month + 1, 0).getDate();
        const startWeekday = firstDay.getDay();
        const matrix: (number | null)[][] = [];
        let currentDay = 1;

        for (let row = 0; row < 6; row++) {
            const rowData: (number | null)[] = [];
            for (let col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;
                if (cellIndex < startWeekday || currentDay > lastDate) {
                    rowData.push(null);
                } else {
                    rowData.push(currentDay++);
                }
            }
            matrix.push(rowData);
            if (currentDay > lastDate) break;
        }

        return {
            matrix,
            today: today.getDate(),
            monthLabel: today.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
        };
    }, [stats]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="statistics-error">
                <p>❌ {error}</p>
                <button onClick={fetchStatistics}>Thử lại</button>
            </div>
        );
    }

    if (!stats) {
        return <div className="statistics-error">Không có dữ liệu</div>;
    }

    return (
        <div className="statistics-page">
            <div className="statistics-header">
                <h1>Thống kê</h1>
                <button onClick={fetchStatistics} className="refresh-btn">🔄 Làm mới</button>
            </div>

            <div className="statistics-tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Tổng quan
                </button>
                <button
                    className={activeTab === 'members' ? 'active' : ''}
                    onClick={() => setActiveTab('members')}
                >
                    Hội viên
                </button>
                <button
                    className={activeTab === 'revenue' ? 'active' : ''}
                    onClick={() => setActiveTab('revenue')}
                >
                    Doanh thu
                </button>
                <button
                    className={activeTab === 'packages' ? 'active' : ''}
                    onClick={() => setActiveTab('packages')}
                >
                    Gói tập
                </button>
                <button
                    className={activeTab === 'pt' ? 'active' : ''}
                    onClick={() => setActiveTab('pt')}
                >
                    PT
                </button>
                <button
                    className={activeTab === 'checkin' ? 'active' : ''}
                    onClick={() => setActiveTab('checkin')}
                >
                    Check-in
                </button>
            </div>

            <div className="statistics-content">
                {activeTab === 'overview' && (
                    <OverviewTab
                        stats={stats}
                        formatCurrency={formatCurrency}
                        formatNumber={formatNumber}
                        newMemberTrendData={newMemberTrendData}
                        branchChartData={branchChartData}
                        memberStatusData={memberStatusData}
                        packagePieData={packagePieData}
                        checkInBranchData={checkInBranchData}
                        calendarInfo={calendarInfo}
                        topPackages={topPackages}
                    />
                )}
                {activeTab === 'members' && (
                    <MembersTab
                        stats={stats}
                        formatNumber={formatNumber}
                        newMemberTrendData={newMemberTrendData}
                        branchChartData={branchChartData}
                    />
                )}
                {activeTab === 'revenue' && <RevenueTab stats={stats} formatCurrency={formatCurrency} formatNumber={formatNumber} />}
                {activeTab === 'packages' && <PackagesTab stats={stats} formatCurrency={formatCurrency} formatNumber={formatNumber} />}
                {activeTab === 'pt' && <PTTab stats={stats} formatNumber={formatNumber} />}
                {activeTab === 'checkin' && <CheckInTab stats={stats} formatNumber={formatNumber} />}
            </div>
        </div>
    );
};

// Overview Tab Component
interface OverviewTabProps {
    stats: OverallStats;
    formatCurrency: (n: number) => string;
    formatNumber: (n: number) => string;
    newMemberTrendData: Array<{ label: string; value: number }>;
    branchChartData: Array<{ name: string; total: number; active: number; inactive: number }>;
    memberStatusData: Array<{ name: string; value: number; color: string }>;
    packagePieData: Array<{ name: string; value: number; color: string }>;
    checkInBranchData: Array<{ name: string; value: number }>;
    calendarInfo: { matrix: (number | null)[][]; today: number; monthLabel: string };
    topPackages: any[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    stats,
    formatCurrency,
    formatNumber,
    newMemberTrendData,
    branchChartData,
    memberStatusData,
    packagePieData,
    checkInBranchData,
    calendarInfo,
    topPackages
}) => {
    const totalMembers = stats.trangThaiHoiVien?.tongSo || 0;
    const activeMembers = stats.trangThaiHoiVien?.chiTiet.find(s => s.trangThai === 'DANG_HOAT_DONG')?.soLuong || 0;
    const totalRevenue = stats.doanhThu?.hienTai?.doanhThu || 0;
    const expiringSoon = (stats.goiSapHetHan?.trong7Ngay?.soLuong || 0) + (stats.goiSapHetHan?.trong15Ngay?.soLuong || 0);
    const totalPTs = stats.pt?.tongSoPT || 0;
    const checkIns = stats.checkIn?.thangNay?.soLuongCheckIn || 0;

    return (
        <div className="overview-tab">
            <div className="statistics-layout">
                <div className="statistics-main">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Tổng hội viên</h3>
                            <div className="stat-value">{formatNumber(totalMembers)}</div>
                            <div className="stat-sub">
                                {activeMembers} đang hoạt động
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Doanh thu tháng này</h3>
                            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
                            <div className="stat-sub">
                                {stats.doanhThu?.hienTai?.soLuong || 0} giao dịch
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Gói sắp hết hạn</h3>
                            <div className="stat-value">{formatNumber(expiringSoon)}</div>
                            <div className="stat-sub">
                                Trong 15 ngày tới
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Tổng PT</h3>
                            <div className="stat-value">{formatNumber(totalPTs)}</div>
                            <div className="stat-sub">
                                {stats.pt?.dangHoatDong || 0} đang hoạt động
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Check-in tháng này</h3>
                            <div className="stat-value">{formatNumber(checkIns)}</div>
                            <div className="stat-sub">
                                {stats.checkIn?.thangNay?.soHoiVien || 0} hội viên
                            </div>
                        </div>
                        <div className="stat-card">
                            <h3>Hội viên mới tháng này</h3>
                            <div className="stat-value">{formatNumber(stats.hoiVienMoi?.thangNay?.soLuong || 0)}</div>
                            <div className="stat-sub">
                                {stats.hoiVienMoi?.thangNay?.thayDoi && parseFloat(stats.hoiVienMoi.thangNay.thayDoi) >= 0 ? '↑' : '↓'} {stats.hoiVienMoi?.thangNay?.thayDoi || '0'}% so với tháng trước
                            </div>
                        </div>
                    </div>

                    <div className="chart-grid">
                        <ChartCard title="Tăng trưởng hội viên" subtitle="Theo giai đoạn">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={newMemberTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                    <XAxis dataKey="label" stroke="var(--text-secondary, #94a3b8)" />
                                    <YAxis stroke="var(--text-secondary, #94a3b8)" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Phân bổ hội viên theo chi nhánh" subtitle="Hội viên / chi nhánh">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={branchChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary, #94a3b8)" />
                                    <YAxis stroke="var(--text-secondary, #94a3b8)" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="active" fill="#22C55E" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="inactive" fill="#F97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div className="chart-grid triple">
                        <ChartCard title="Trạng thái hội viên">
                            <div className="chart-pie-wrapper">
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={memberStatusData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                        >
                                            {memberStatusData.map((entry, index) => (
                                                <Cell key={`status-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pie-legend">
                                    {memberStatusData.map((item, index) => (
                                        <div className="pie-legend-item" key={index}>
                                            <span className="dot" style={{ background: item.color }} />
                                            <span>{item.name}</span>
                                            <strong>{formatNumber(item.value)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ChartCard>

                        <ChartCard title="Tỷ lệ gói tập" subtitle="Theo số lượng đăng ký">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={packagePieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={3}
                                    >
                                        {packagePieData.map((entry, index) => (
                                            <Cell key={`pkg-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="package-legend">
                                {packagePieData.slice(0, 3).map((item, index) => (
                                    <div className="package-legend-item" key={index}>
                                        <span className="dot" style={{ background: item.color }} />
                                        <span>{item.name}</span>
                                        <strong>{formatNumber(item.value)}</strong>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>

                        <ChartCard title="Check-in theo chi nhánh" subtitle="Trong tháng này">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart layout="vertical" data={checkInBranchData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                    <XAxis type="number" stroke="var(--text-secondary, #94a3b8)" />
                                    <YAxis type="category" dataKey="name" stroke="var(--text-secondary, #94a3b8)" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#0EA5E9" radius={[0, 12, 12, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>

                <aside className="statistics-sidebar">
                    <SidebarCard title="Thẻ cá nhân">
                        <div className="personal-card">
                            <p>Hoạt động tháng {new Date().toLocaleString('vi-VN', { month: 'long' })}</p>
                            <h2>{formatNumber(stats.hoiVienMoi?.thangNay?.soLuong || 0)}</h2>
                            <span>Hội viên mới</span>
                            <ResponsiveContainer width="100%" height={80}>
                                <LineChart data={newMemberTrendData}>
                                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </SidebarCard>

                    <SidebarCard title={`Lịch - ${calendarInfo.monthLabel}`}>
                        <div className="calendar-grid">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                <span key={day} className="calendar-day-label">{day}</span>
                            ))}
                            {calendarInfo.matrix.map((row, rowIdx) =>
                                row.map((day, colIdx) => (
                                    <span
                                        key={`${rowIdx}-${colIdx}`}
                                        className={`calendar-cell ${day === calendarInfo.today ? 'active' : ''}`}
                                    >
                                        {day || ''}
                                    </span>
                                ))
                            )}
                        </div>
                    </SidebarCard>

                    <SidebarCard title="Top gói tập">
                        <ul className="sidebar-list">
                            {topPackages.length === 0 && <li>Chưa có dữ liệu</li>}
                            {topPackages.map((pkg, index) => (
                                <li key={pkg.goiTap?._id || index}>
                                    <div>
                                        <strong>{pkg.goiTap?.tenGoiTap || 'N/A'}</strong>
                                        <span>{formatNumber(pkg.soLuongDangKy || 0)} đăng ký</span>
                                    </div>
                                    <span className="list-point">{(pkg.tyLe || 0).toString()}%</span>
                                </li>
                            ))}
                        </ul>
                    </SidebarCard>
                </aside>
            </div>
        </div>
    );
};

interface MembersTabProps {
    stats: OverallStats;
    formatNumber: (n: number) => string;
    newMemberTrendData: Array<{ label: string; value: number }>;
    branchChartData: Array<{ name: string; total: number; active: number; inactive: number }>;
}

const MembersTab: React.FC<MembersTabProps> = ({
    stats,
    formatNumber,
    newMemberTrendData,
    branchChartData
}) => {
    const totalMembers = stats.trangThaiHoiVien?.tongSo || 0;
    const activeMembers = stats.trangThaiHoiVien?.chiTiet?.find(item => item.trangThai === 'DANG_HOAT_DONG')?.soLuong || 0;
    const engagement = stats.hoiVienMoi?.thangNay?.soLuong || 0;

    const summaryCards = [
        { label: 'Tổng hội viên', value: formatNumber(totalMembers), delta: '+4.8%', icon: '👁️' },
        { label: 'Đang hoạt động', value: formatNumber(activeMembers), delta: '+2.4%', icon: '💡' },
        { label: 'Hội viên mới (tháng)', value: formatNumber(engagement), delta: '+8%', icon: '⚡️' }
    ];

    const tableData = branchChartData.map((branch, index) => ({
        id: index,
        name: branch.name,
        total: branch.total,
        active: branch.active,
        inactive: branch.inactive,
        progress: branch.total ? Math.round((branch.active / branch.total) * 100) : 0
    }));

    return (
        <div className="member-analytics">
            <div className="member-analytics-top">
                <div className="member-hero card-white">
                    <div className="hero-header">
                        <div>
                            <h2>Analytics Dashboard</h2>
                            <p className="hero-subtitle">Theo dõi hiệu suất hội viên theo thời gian</p>
                        </div>
                        <div className="hero-actions">
                            <button className="ghost-btn">Báo cáo</button>
                            <button className="ghost-btn">Tùy chỉnh</button>
                        </div>
                    </div>
                    <div className="hero-chart">
                        <ResponsiveContainer width="100%" height={230}>
                            <AreaChart data={newMemberTrendData}>
                                <defs>
                                    <linearGradient id="memberArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.4)" />
                                <XAxis dataKey="label" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip />
                                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} fill="url(#memberArea)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="hero-footer">
                        <span>98.78% tỉ lệ duy trì</span>
                        <span>+12,158 hội viên trong năm</span>
                    </div>
                </div>
                <div className="member-summary card-white">
                    {summaryCards.map((card, idx) => (
                        <div key={idx} className="summary-row">
                            <div className="summary-icon">{card.icon}</div>
                            <div>
                                <p>{card.label}</p>
                                <strong>{card.value}</strong>
                                <span className="summary-delta">{card.delta}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="member-table card-white">
                <div className="table-toolbar">
                    <div>
                        <h3>Your Customers</h3>
                        <p className="hero-subtitle">Chi tiết từng chi nhánh</p>
                    </div>
                    <div className="table-controls">
                        <button className="ghost-btn">Filter</button>
                        <button className="ghost-btn">Settings</button>
                        <button className="primary-btn">Add branch</button>
                    </div>
                </div>
                <div className="table-scroll">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Tên chi nhánh</th>
                                <th>Đang hoạt động</th>
                                <th>Tạm ngưng + Hết hạn</th>
                                <th>Tổng hội viên</th>
                                <th>Tỉ lệ hoạt động</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map(row => (
                                <tr key={row.id}>
                                    <td>
                                        <div className="customer-info">
                                            <div className="avatar">{row.name?.charAt(0)}</div>
                                            <div>
                                                <strong>{row.name}</strong>
                                                <p>{row.total} hội viên</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatNumber(row.active)}</td>
                                    <td>{formatNumber(row.inactive)}</td>
                                    <td>{formatNumber(row.total)}</td>
                                    <td>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${row.progress}%` }} />
                                        </div>
                                        <span className="progress-value">{row.progress}%</span>
                                    </td>
                                    <td className="table-action-dots">•••</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Revenue Tab Component
const RevenueTab: React.FC<{ stats: OverallStats; formatCurrency: (n: number) => string; formatNumber: (n: number) => string }> = ({ stats, formatCurrency, formatNumber }) => {
    return (
        <div className="revenue-tab">
            <div className="section">
                <h2>Doanh thu tháng này</h2>
                <div className="revenue-summary">
                    <div className="revenue-card">
                        <h3>Doanh thu hiện tại</h3>
                        <div className="revenue-value">{formatCurrency(stats.doanhThu?.hienTai?.doanhThu || 0)}</div>
                        <div className="revenue-sub">{stats.doanhThu?.hienTai?.soLuong || 0} giao dịch</div>
                    </div>
                    <div className="revenue-card">
                        <h3>Kỳ trước</h3>
                        <div className="revenue-value">{formatCurrency(stats.doanhThu?.kyTruoc?.doanhThu || 0)}</div>
                        <div className="revenue-sub">{stats.doanhThu?.kyTruoc?.soLuong || 0} giao dịch</div>
                    </div>
                    <div className="revenue-card">
                        <h3>Thay đổi</h3>
                        <div className={`revenue-value ${stats.doanhThu?.trend === 'up' ? 'positive' : 'negative'}`}>
                            {stats.doanhThu?.trend === 'up' ? '↑' : '↓'} {Math.abs(stats.doanhThu?.thayDoi || 0)}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2>Doanh thu theo chi nhánh</h2>
                <div className="table-container">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Chi nhánh</th>
                                <th>Doanh thu</th>
                                <th>Số lượng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.doanhThu?.theoChiNhanh?.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td>{item.tenChiNhanh || 'N/A'}</td>
                                    <td>{formatCurrency(item.total || 0)}</td>
                                    <td>{formatNumber(item.count || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Packages Tab Component
const PackagesTab: React.FC<{ stats: OverallStats; formatCurrency: (n: number) => string; formatNumber: (n: number) => string }> = ({ stats, formatCurrency, formatNumber }) => {
    return (
        <div className="packages-tab">
            <div className="section">
                <h2>Thống kê gói tập</h2>
                <div className="package-summary">
                    <div className="package-summary-card">
                        <h3>Tổng số đăng ký</h3>
                        <div className="package-value">{formatNumber(stats.goiTap?.tongSoDangKy || 0)}</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2>Thống kê theo gói tập</h2>
                <div className="table-container">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Gói tập</th>
                                <th>Số lượng đăng ký</th>
                                <th>Tỷ lệ</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.goiTap?.theoGoiTap?.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td>{item.goiTap?.tenGoiTap || 'N/A'}</td>
                                    <td>{formatNumber(item.soLuongDangKy || 0)}</td>
                                    <td>{item.tyLe || '0'}%</td>
                                    <td>{formatCurrency(item.doanhThu || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// PT Tab Component
const PTTab: React.FC<{ stats: OverallStats; formatNumber: (n: number) => string }> = ({ stats, formatNumber }) => {
    return (
        <div className="pt-tab">
            <div className="section">
                <h2>Thống kê PT</h2>
                <div className="pt-summary">
                    <div className="pt-card">
                        <h3>Tổng số PT</h3>
                        <div className="pt-value">{formatNumber(stats.pt?.tongSoPT || 0)}</div>
                    </div>
                    <div className="pt-card">
                        <h3>Đang hoạt động</h3>
                        <div className="pt-value">{formatNumber(stats.pt?.dangHoatDong || 0)}</div>
                    </div>
                    <div className="pt-card">
                        <h3>Tạm ngưng</h3>
                        <div className="pt-value">{formatNumber(stats.pt?.tamNgung || 0)}</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2>Top PT theo số học viên</h2>
                <div className="table-container">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>PT</th>
                                <th>Số học viên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.pt?.topPT?.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td>{item.ptInfo?.hoTen || 'N/A'}</td>
                                    <td>{formatNumber(item.soLuongHocVien || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Check-in Tab Component
const CheckInTab: React.FC<{ stats: OverallStats; formatNumber: (n: number) => string }> = ({ stats, formatNumber }) => {
    return (
        <div className="checkin-tab">
            <div className="section">
                <h2>Thống kê check-in tháng này</h2>
                <div className="checkin-summary">
                    <div className="checkin-card">
                        <h3>Số lượng check-in</h3>
                        <div className="checkin-value">{formatNumber(stats.checkIn?.thangNay?.soLuongCheckIn || 0)}</div>
                        <div className="checkin-sub">
                            Tháng trước: {formatNumber(stats.checkIn?.thangTruoc?.soLuongCheckIn || 0)} lượt
                        </div>
                    </div>
                    <div className="checkin-card">
                        <h3>Số hội viên</h3>
                        <div className="checkin-value">{formatNumber(stats.checkIn?.thangNay?.soHoiVien || 0)}</div>
                    </div>
                    <div className="checkin-card">
                        <h3>Tỷ lệ tham gia</h3>
                        <div className="checkin-value">{stats.checkIn?.thangNay?.tyLeThamGia || 0}%</div>
                    </div>
                    <div className="checkin-card">
                        <h3>Trung bình mỗi hội viên</h3>
                        <div className="checkin-value">{stats.checkIn?.thangNay?.trungBinhMoiHoiVien || 0} buổi</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2>Check-in theo chi nhánh</h2>
                <div className="table-container">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Chi nhánh</th>
                                <th>Số lượng check-in</th>
                                <th>Số hội viên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.checkIn?.theoChiNhanh?.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td>{item.tenChiNhanh || 'N/A'}</td>
                                    <td>{formatNumber(item.soLuongCheckIn || 0)}</td>
                                    <td>{formatNumber(item.soLuongHoiVien || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children }) => (
    <div className="chart-card">
        <div className="chart-card-header">
            <div>
                <h3>{title}</h3>
                {subtitle && <span>{subtitle}</span>}
            </div>
        </div>
        {children}
    </div>
);

const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="sidebar-card">
        <h3>{title}</h3>
        {children}
    </div>
);

export default StatisticsPage;

