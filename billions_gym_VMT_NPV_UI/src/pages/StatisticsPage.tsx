import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { statisticsApi, OverallStats, MemberStatsByBranch, NewMemberStats, ExpiringPackages, RevenueStats, PackageStats, PTStats, CheckInStats, MemberStatusStats, yearlyGoalsApi, YearlyGoals } from '../services/statistics';
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
    Area,
    ComposedChart
} from 'recharts';

const CHART_COLORS = ['#6366F1', '#22C55E', '#F97316', '#0EA5E9', '#A855F7', '#F43F5E', '#14B8A6'];

const formatRelativeTime = (isoDate?: string) => {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
};

const formatDateLabel = (isoDate?: string) => {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getInitials = (value?: string) => {
    if (!value) return 'NA';
    const parts = value.split(' ').filter(Boolean);
    if (!parts.length) return value.slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

const getDaysLeftLabel = (isoDate?: string) => {
    if (!isoDate) return '—';
    const diff = new Date(isoDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} ngày`;
    if (days === 0) return 'Hôm nay';
    return 'Đã hết hạn';
};

const StatisticsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<OverallStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [goals, setGoals] = useState<YearlyGoals | null>(null);

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load cả hai API song song để tối ưu thời gian
            const [statsData, goalsData] = await Promise.allSettled([
                statisticsApi.getOverallStats(),
                yearlyGoalsApi.getCurrentYearGoals()
            ]);

            // Xử lý stats
            if (statsData.status === 'fulfilled') {
                setStats(statsData.value);
            } else {
                const err = statsData.reason;
                if (err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    setError('Không thể kết nối đến server. Vui lòng kiểm tra xem backend server đã được khởi động chưa (port 4000).');
                } else {
                    setError(err?.message || 'Không thể tải dữ liệu thống kê');
                }
            }

            // Xử lý goals (không block UI nếu lỗi)
            if (goalsData.status === 'fulfilled') {
                setGoals(goalsData.value);
            } else {
                console.error('Error loading yearly goals:', goalsData.reason);
                // Không set error vì goals không quan trọng bằng stats
            }
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError(err?.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

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
            <div className="statistics-error" style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                margin: '2rem'
            }}>
                <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>❌ Lỗi kết nối</h3>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{error}</p>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Để khắc phục:</p>
                    <ol style={{ marginLeft: '1.5rem', color: '#6b7280' }}>
                        <li>Mở terminal và di chuyển đến thư mục backend: <code style={{ background: '#e5e7eb', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>cd Billions_Gym_VMT_NPV/backend</code></li>
                        <li>Khởi động server: <code style={{ background: '#e5e7eb', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>npm start</code> hoặc <code style={{ background: '#e5e7eb', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>node server.js</code></li>
                        <li>Đợi server khởi động (sẽ thấy thông báo "Server đang chạy trên port 4000")</li>
                        <li>Nhấn nút "Thử lại" bên dưới</li>
                    </ol>
                </div>
                <button
                    onClick={fetchStatistics}
                    style={{
                        marginTop: '1.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 500
                    }}
                >
                    🔄 Thử lại
                </button>
            </div>
        );
    }

    if (!stats) {
        return <div className="statistics-error">Không có dữ liệu</div>;
    }

    return (
        <div className="statistics-page">
            <div className="statistics-shell">
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
                            goals={goals}
                            onGoalsUpdate={setGoals}
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
                    {activeTab === 'packages' && (
                        <PackagesTab
                            stats={stats}
                            formatCurrency={formatCurrency}
                            formatNumber={formatNumber}
                            packagePieData={packagePieData}
                        />
                    )}
                    {activeTab === 'pt' && <PTTab stats={stats} formatNumber={formatNumber} />}
                    {activeTab === 'checkin' && <CheckInTab stats={stats} formatNumber={formatNumber} />}
                </div>
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
    goals: YearlyGoals | null;
    onGoalsUpdate: (goals: YearlyGoals) => void;
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
    topPackages,
    goals,
    onGoalsUpdate
}) => {
    const [dateRange, setDateRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
    const [currentChartSlide, setCurrentChartSlide] = useState(0);
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [tempGoals, setTempGoals] = useState({
        hoiVienMoi: 100,
        doanhThu: 100000000,
        checkIn: 1000,
        goiTap: 50,
        hoiVienDangHoatDong: 200,
        tyLeGiaHan: 70
    });

    const totalMembers = stats.trangThaiHoiVien?.tongSo || 0;
    const activeMembers = stats.trangThaiHoiVien?.chiTiet.find(s => s.trangThai === 'DANG_HOAT_DONG')?.soLuong || 0;
    const totalPTs = stats.pt?.tongSoPT || 0;

    // Cập nhật tempGoals khi goals thay đổi
    useEffect(() => {
        if (goals) {
            setTempGoals({
                hoiVienMoi: goals.hoiVienMoi,
                doanhThu: goals.doanhThu,
                checkIn: goals.checkIn,
                goiTap: goals.goiTap,
                hoiVienDangHoatDong: goals.hoiVienDangHoatDong,
                tyLeGiaHan: goals.tyLeGiaHan
            });
        }
    }, [goals]);

    // Helper function để tạo Date object từ ngày trong tháng
    const getDateFromDay = (day: number): Date => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return new Date(currentYear, currentMonth, day);
    };

    // Helper function để format date range cho tiêu đề
    const formatDateRange = (): string => {
        if (!dateRange.start && !dateRange.end) return '';
        if (dateRange.start && !dateRange.end) {
            const date = getDateFromDay(dateRange.start);
            return ` - ${date.toLocaleDateString('vi-VN')}`;
        }
        if (dateRange.start && dateRange.end) {
            const startDate = getDateFromDay(dateRange.start);
            const endDate = getDateFromDay(dateRange.end);
            return ` (${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')})`;
        }
        return '';
    };

    // Helper function để kiểm tra ngày có trong khoảng không
    const isDateInRange = (dateStr: string): boolean => {
        if (!dateRange.start && !dateRange.end) return true;

        const date = new Date(dateStr);
        const dateDay = date.getDate();
        const dateMonth = date.getMonth();
        const dateYear = date.getFullYear();

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Chỉ lọc nếu cùng tháng và năm
        if (dateMonth !== currentMonth || dateYear !== currentYear) return false;

        if (dateRange.start && dateRange.end) {
            const start = Math.min(dateRange.start, dateRange.end);
            const end = Math.max(dateRange.start, dateRange.end);
            return dateDay >= start && dateDay <= end;
        }
        if (dateRange.start) {
            return dateDay === dateRange.start;
        }
        return false;
    };

    const handleDateClick = (day: number | null) => {
        if (day === null) return;

        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            // Bắt đầu chọn khoảng mới
            setDateRange({ start: day, end: null });
        } else if (dateRange.start && !dateRange.end) {
            // Hoàn thành chọn khoảng
            if (day === dateRange.start) {
                // Click lại cùng ngày -> reset
                setDateRange({ start: null, end: null });
            } else {
                // Chọn ngày kết thúc
                setDateRange({ start: dateRange.start, end: day });
            }
        }
    };

    const newRegistrations = useMemo(() => {
        const data = stats.recentRegistrations || [];
        let filtered = data;

        // Lọc theo date range nếu có
        if (dateRange.start || dateRange.end) {
            filtered = data.filter(item => isDateInRange(item.thoiGianDangKy));
        }

        return filtered
            .slice()
            .sort((a, b) => new Date(b.thoiGianDangKy).getTime() - new Date(a.thoiGianDangKy).getTime())
            .slice(0, 6);
    }, [stats.recentRegistrations, dateRange]);

    const expiringSoonList = useMemo(() => {
        const list =
            stats.goiSapHetHan?.trong7Ngay?.danhSach ||
            stats.goiSapHetHan?.trong15Ngay?.danhSach ||
            stats.goiSapHetHan?.trong30Ngay?.danhSach ||
            [];

        let filtered = list;

        // Lọc theo date range nếu có
        if (dateRange.start || dateRange.end) {
            filtered = list.filter(item => isDateInRange(item.ngayKetThuc));
        }

        return filtered.slice().sort((a, b) => new Date(a.ngayKetThuc).getTime() - new Date(b.ngayKetThuc).getTime()).slice(0, 6);
    }, [stats.goiSapHetHan, dateRange]);

    // Tính toán lại các metrics dựa trên date range
    const filteredNewMembers = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return stats.hoiVienMoi?.thangNay?.soLuong || 0;
        }
        return newRegistrations.length;
    }, [newRegistrations, dateRange, stats.hoiVienMoi]);

    const filteredRevenue = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return stats.doanhThu?.hienTai?.doanhThu || 0;
        }
        // Tính tổng doanh thu từ các đăng ký trong khoảng ngày
        const revenue = newRegistrations.reduce((sum, item: any) => {
            return sum + (item.tongTien || item.giaGoiTap || item.tongGia || 0);
        }, 0);

        // Nếu không có dữ liệu chi tiết về giá, ước tính dựa trên tỷ lệ
        if (revenue === 0 && newRegistrations.length > 0) {
            const totalRevenue = stats.doanhThu?.hienTai?.doanhThu || 0;
            const totalRegistrations = stats.recentRegistrations?.length || 1;
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const start = dateRange.start || 1;
            const end = dateRange.end || daysInMonth;
            const daysSelected = Math.max(end - start + 1, 1);
            return Math.round((totalRevenue * newRegistrations.length) / totalRegistrations);
        }

        return revenue;
    }, [newRegistrations, dateRange, stats.doanhThu]);

    const filteredRevenueCount = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return stats.doanhThu?.hienTai?.soLuong || 0;
        }
        return newRegistrations.length;
    }, [newRegistrations, dateRange, stats.doanhThu]);

    const filteredExpiringSoon = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return (stats.goiSapHetHan?.trong7Ngay?.soLuong || 0) + (stats.goiSapHetHan?.trong15Ngay?.soLuong || 0);
        }
        return expiringSoonList.length;
    }, [expiringSoonList, dateRange, stats.goiSapHetHan]);

    const filteredCheckIns = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return stats.checkIn?.thangNay?.soLuongCheckIn || 0;
        }
        // Lọc check-in records nếu có trong stats
        const checkInRecords = (stats as any).recentCheckins || (stats as any).checkIn?.recentCheckins || [];
        if (checkInRecords.length === 0) {
            // Nếu không có dữ liệu chi tiết, ước tính dựa trên tỷ lệ
            const totalCheckIns = stats.checkIn?.thangNay?.soLuongCheckIn || 0;
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const start = dateRange.start || 1;
            const end = dateRange.end || daysInMonth;
            const daysSelected = Math.max(end - start + 1, 1);
            return Math.round((totalCheckIns * daysSelected) / daysInMonth);
        }
        const filtered = checkInRecords.filter((item: any) => {
            if (!item.checkInTime) return false;
            return isDateInRange(item.checkInTime);
        });
        return filtered.length;
    }, [dateRange, stats.checkIn]);

    const filteredCheckInMembers = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return stats.checkIn?.thangNay?.soHoiVien || 0;
        }
        // Đếm số hội viên unique đã check-in trong khoảng ngày
        const checkInRecords = (stats as any).recentCheckins || (stats as any).checkIn?.recentCheckins || [];
        if (checkInRecords.length === 0) {
            // Nếu không có dữ liệu chi tiết, ước tính dựa trên tỷ lệ
            const totalMembers = stats.checkIn?.thangNay?.soHoiVien || 0;
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const start = dateRange.start || 1;
            const end = dateRange.end || daysInMonth;
            const daysSelected = Math.max(end - start + 1, 1);
            return Math.round((totalMembers * daysSelected) / daysInMonth);
        }
        const filtered = checkInRecords.filter((item: any) => {
            if (!item.checkInTime) return false;
            return isDateInRange(item.checkInTime);
        });
        const uniqueMembers = new Set(filtered.map((item: any) => item.hoiVien?._id || item.hoiVienId).filter(Boolean));
        return uniqueMembers.size;
    }, [dateRange, stats.checkIn]);

    // Lọc dữ liệu cho các biểu đồ dựa trên date range
    const filteredNewMemberTrendData = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return newMemberTrendData;
        }

        // Tính toán lại dựa trên dữ liệu đã lọc
        const filtered = newRegistrations;
        const totalInRange = filtered.length;

        // Ước tính phân bổ theo các giai đoạn
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const start = dateRange.start || 1;
        const end = dateRange.end || daysInMonth;
        const daysSelected = Math.max(end - start + 1, 1);

        return [
            { label: 'Hôm qua', value: 0 },
            {
                label: 'Hôm nay', value: filtered.filter((item: any) => {
                    const itemDate = new Date(item.thoiGianDangKy);
                    return itemDate.getDate() === new Date().getDate();
                }).length
            },
            { label: 'Tuần này', value: Math.round(totalInRange * 0.3) },
            { label: 'Tháng này', value: totalInRange },
            { label: 'Năm này', value: Math.round(totalInRange * (365 / daysSelected)) }
        ];
    }, [dateRange, newRegistrations, newMemberTrendData]);

    const filteredBranchChartData = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return branchChartData;
        }

        // Lọc và tính toán lại dữ liệu theo chi nhánh từ recentRegistrations
        const filtered = newRegistrations;
        const branchMap = new Map<string, { total: number; active: number; inactive: number }>();

        filtered.forEach((item: any) => {
            const branchName = item.chiNhanh || 'Không rõ chi nhánh';
            if (!branchMap.has(branchName)) {
                branchMap.set(branchName, { total: 0, active: 0, inactive: 0 });
            }
            const branch = branchMap.get(branchName)!;
            branch.total++;
            branch.active++; // Giả sử tất cả đều active trong khoảng này
        });

        return Array.from(branchMap.entries()).map(([name, data]) => ({
            name,
            total: data.total,
            active: data.active,
            inactive: data.inactive
        }));
    }, [dateRange, newRegistrations, branchChartData]);

    const filteredMemberStatusData = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return memberStatusData;
        }

        // Tính toán lại dựa trên dữ liệu đã lọc
        const filtered = newRegistrations;
        const totalInRange = filtered.length;
        const activeInRange = filtered.length; // Giả sử tất cả đều active

        return [
            { name: 'Đang hoạt động', value: activeInRange, color: CHART_COLORS[0] },
            { name: 'Tạm ngưng', value: 0, color: CHART_COLORS[1] },
            { name: 'Hết hạn', value: 0, color: CHART_COLORS[2] }
        ];
    }, [dateRange, newRegistrations, memberStatusData]);

    const filteredPackagePieData = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return packagePieData;
        }

        // Lọc và tính toán lại dữ liệu theo gói tập từ recentRegistrations
        const filtered = newRegistrations;
        const packageMap = new Map<string, number>();

        filtered.forEach((item: any) => {
            const packageName = item.goiTap || 'N/A';
            packageMap.set(packageName, (packageMap.get(packageName) || 0) + 1);
        });

        return Array.from(packageMap.entries()).map(([name, value], index) => ({
            name,
            value,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [dateRange, newRegistrations, packagePieData]);

    const filteredCheckInBranchData = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            return checkInBranchData;
        }

        // Lọc check-in records theo chi nhánh
        const checkInRecords = (stats as any).recentCheckins || (stats as any).checkIn?.recentCheckins || [];
        const filtered = checkInRecords.filter((item: any) => {
            if (!item.checkInTime) return false;
            return isDateInRange(item.checkInTime);
        });

        const branchMap = new Map<string, number>();
        filtered.forEach((item: any) => {
            const branchName = item.chiNhanh?.tenChiNhanh || 'N/A';
            branchMap.set(branchName, (branchMap.get(branchName) || 0) + 1);
        });

        if (branchMap.size === 0) {
            // Nếu không có dữ liệu chi tiết, ước tính dựa trên tỷ lệ
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const start = dateRange.start || 1;
            const end = dateRange.end || daysInMonth;
            const daysSelected = Math.max(end - start + 1, 1);

            return checkInBranchData.map(item => ({
                name: item.name,
                value: Math.round((item.value * daysSelected) / daysInMonth)
            }));
        }

        return Array.from(branchMap.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }, [dateRange, checkInBranchData, stats]);

    // Dữ liệu cho các biểu đồ bổ sung trong carousel
    const revenueTrendData = useMemo(() => {
        if (!dateRange.start && !dateRange.end) {
            // Dữ liệu 7 ngày gần nhất
            const data = stats.recentRegistrations || [];
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = date.toISOString().split('T')[0];
                const dayRevenue = data
                    .filter((item: any) => {
                        const itemDate = new Date(item.thoiGianDangKy).toISOString().split('T')[0];
                        return itemDate === dateStr;
                    })
                    .reduce((sum: number, item: any) => sum + (item.tongTien || item.giaGoiTap || 0), 0);
                return {
                    label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                    value: dayRevenue
                };
            });
            return last7Days;
        }

        // Lọc theo date range
        const filtered = newRegistrations;
        const start = dateRange.start || 1;
        const end = dateRange.end || new Date().getDate();
        const days = [];
        for (let day = start; day <= end; day++) {
            const dayRevenue = filtered
                .filter((item: any) => {
                    const itemDate = new Date(item.thoiGianDangKy);
                    return itemDate.getDate() === day;
                })
                .reduce((sum: number, item: any) => sum + (item.tongTien || item.giaGoiTap || 0), 0);
            days.push({
                label: `${day}/${new Date().getMonth() + 1}`,
                value: dayRevenue
            });
        }
        return days;
    }, [dateRange, newRegistrations, stats.recentRegistrations]);

    const monthlyComparisonData = useMemo(() => {
        const currentMonth = stats.doanhThu?.hienTai?.doanhThu || 0;
        const lastMonth = stats.doanhThu?.kyTruoc?.doanhThu || 0;
        const currentCount = stats.doanhThu?.hienTai?.soLuong || 0;
        const lastCount = stats.doanhThu?.kyTruoc?.soLuong || 0;

        return [
            { name: 'Tháng này', doanhThu: currentMonth, soLuong: currentCount },
            { name: 'Tháng trước', doanhThu: lastMonth, soLuong: lastCount }
        ];
    }, [stats.doanhThu]);

    const topPackagesChartData = useMemo(() => {
        const packages = stats.goiTap?.theoGoiTap || [];
        return packages
            .slice()
            .sort((a: any, b: any) => (b.soLuongDangKy || 0) - (a.soLuongDangKy || 0))
            .slice(0, 5)
            .map((item: any, index: number) => ({
                name: item.goiTap?.tenGoiTap || 'N/A',
                value: item.soLuongDangKy || 0,
                color: CHART_COLORS[index % CHART_COLORS.length]
            }));
    }, [stats.goiTap]);

    const weeklyRegistrationTrend = useMemo(() => {
        const data = stats.recentRegistrations || [];
        const weeks = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return weeks.map((weekLabel, weekIndex) => {
            const weekStart = weekIndex * 7 + 1;
            const weekEnd = Math.min(weekStart + 6, new Date(currentYear, currentMonth + 1, 0).getDate());
            const weekData = data.filter((item: any) => {
                const itemDate = new Date(item.thoiGianDangKy);
                const itemDay = itemDate.getDate();
                return itemDate.getMonth() === currentMonth &&
                    itemDate.getFullYear() === currentYear &&
                    itemDay >= weekStart && itemDay <= weekEnd;
            });
            return {
                label: weekLabel,
                value: weekData.length
            };
        });
    }, [stats.recentRegistrations]);

    const hourlyCheckInData = useMemo(() => {
        const checkInRecords = (stats as any).recentCheckins || (stats as any).checkIn?.recentCheckins || [];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return hours.map(hour => {
            const hourCheckIns = checkInRecords.filter((item: any) => {
                if (!item.checkInTime) return false;
                const checkInHour = new Date(item.checkInTime).getHours();
                return checkInHour === hour;
            }).length;
            return {
                label: `${hour}:00`,
                value: hourCheckIns
            };
        }).filter(item => item.value > 0 || item.label.includes('6:') || item.label.includes('7:') || item.label.includes('8:') || item.label.includes('18:') || item.label.includes('19:') || item.label.includes('20:'));
    }, [stats]);

    // Tính toán tiến độ mục tiêu
    const goalProgress = useMemo(() => {
        if (!goals) return null;

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const monthsPassed = currentMonth;
        const monthsTotal = 12;
        const progressRatio = monthsPassed / monthsTotal;

        // Tính giá trị hiện tại (năm này)
        const currentNewMembers = stats.hoiVienMoi?.namNay?.soLuong || 0;

        // Doanh thu: ước tính cả năm dựa trên tỷ lệ tháng
        const monthlyRevenue = stats.doanhThu?.hienTai?.doanhThu || 0;
        const estimatedYearlyRevenue = monthlyRevenue / progressRatio;

        // Check-in: ước tính cả năm từ tháng này
        const monthlyCheckIns = stats.checkIn?.thangNay?.soLuongCheckIn || 0;
        const estimatedYearlyCheckIns = monthlyCheckIns / progressRatio;

        // Gói tập: sử dụng tổng số đăng ký hiện tại
        const currentPackages = stats.goiTap?.tongSoDangKy || 0;
        const estimatedYearlyPackages = currentPackages / progressRatio;

        // Hội viên đang hoạt động: sử dụng số hiện tại
        const currentActiveMembers = activeMembers;
        const estimatedYearlyActiveMembers = currentActiveMembers / progressRatio;

        // Tỷ lệ gia hạn: tính từ số gói sắp hết hạn và tổng số gói
        const expiringCount = (stats.goiSapHetHan?.trong7Ngay?.soLuong || 0) +
            (stats.goiSapHetHan?.trong15Ngay?.soLuong || 0) +
            (stats.goiSapHetHan?.trong30Ngay?.soLuong || 0);
        const totalPackages = stats.goiTap?.tongSoDangKy || 1;
        const renewalRate = totalPackages > 0 ? ((totalPackages - expiringCount) / totalPackages) * 100 : 0;

        return {
            hoiVienMoi: {
                current: currentNewMembers,
                target: goals.hoiVienMoi,
                progress: Math.min((currentNewMembers / goals.hoiVienMoi) * 100, 100),
                color: '#6366F1'
            },
            doanhThu: {
                current: estimatedYearlyRevenue,
                target: goals.doanhThu,
                progress: Math.min((estimatedYearlyRevenue / goals.doanhThu) * 100, 100),
                color: '#22C55E'
            },
            checkIn: {
                current: estimatedYearlyCheckIns,
                target: goals.checkIn,
                progress: Math.min((estimatedYearlyCheckIns / goals.checkIn) * 100, 100),
                color: '#0EA5E9'
            },
            goiTap: {
                current: estimatedYearlyPackages,
                target: goals.goiTap,
                progress: Math.min((estimatedYearlyPackages / goals.goiTap) * 100, 100),
                color: '#8B5CF6'
            },
            hoiVienDangHoatDong: {
                current: estimatedYearlyActiveMembers,
                target: goals.hoiVienDangHoatDong,
                progress: Math.min((estimatedYearlyActiveMembers / goals.hoiVienDangHoatDong) * 100, 100),
                color: '#F97316'
            },
            tyLeGiaHan: {
                current: renewalRate,
                target: goals.tyLeGiaHan,
                progress: Math.min((renewalRate / goals.tyLeGiaHan) * 100, 100),
                color: '#A855F7'
            }
        };
    }, [goals, stats, activeMembers]);

    const handleSaveGoals = async () => {
        try {
            const updatedGoals = await yearlyGoalsApi.updateYearlyGoals(tempGoals);
            onGoalsUpdate(updatedGoals);
            setIsEditingGoals(false);
        } catch (error) {
            console.error('Error saving goals:', error);
            alert('Lỗi khi lưu mục tiêu. Vui lòng thử lại.');
        }
    };

    const handleCancelEdit = () => {
        if (goals) {
            setTempGoals({
                hoiVienMoi: goals.hoiVienMoi,
                doanhThu: goals.doanhThu,
                checkIn: goals.checkIn,
                goiTap: goals.goiTap,
                hoiVienDangHoatDong: goals.hoiVienDangHoatDong,
                tyLeGiaHan: goals.tyLeGiaHan
            });
        }
        setIsEditingGoals(false);
    };

    const kpiCards = [
        {
            title: 'Tổng hội viên',
            value: formatNumber(totalMembers),
            sub: `${activeMembers} đang hoạt động`
        },
        {
            title: `Doanh thu${formatDateRange() || ' tháng này'}`,
            value: formatCurrency(filteredRevenue),
            sub: `${filteredRevenueCount} giao dịch`
        },
        {
            title: `Gói sắp hết hạn${formatDateRange() || ' (15 ngày)'}`,
            value: formatNumber(filteredExpiringSoon),
            sub: 'Cần liên hệ gia hạn'
        },
        {
            title: `Check-in${formatDateRange() || ' tháng này'}`,
            value: formatNumber(filteredCheckIns),
            sub: `${filteredCheckInMembers} hội viên`
        }
    ];

    return (
        <div className="overview-tab">
            <div className="statistics-layout">
                <div className="statistics-main">
                    <div className="stats-grid">
                        {kpiCards.map(card => (
                            <div className="stat-card" key={card.title}>
                                <h3>{card.title}</h3>
                                <div className="stat-value">{card.value}</div>
                                <div className="stat-sub">{card.sub}</div>
                            </div>
                        ))}
                        <div className="stat-card accent">
                            <h3>Tổng PT</h3>
                            <div className="stat-value">{formatNumber(totalPTs)}</div>
                            <div className="stat-sub">{stats.pt?.dangHoatDong || 0} đang hoạt động</div>
                        </div>
                        <div className="stat-card accent">
                            <h3>Hội viên mới{formatDateRange()}</h3>
                            <div className="stat-value">{formatNumber(filteredNewMembers)}</div>
                            <div className="stat-sub">
                                {dateRange.start || dateRange.end
                                    ? `${newRegistrations.length} đăng ký trong khoảng`
                                    : `${stats.hoiVienMoi?.thangNay?.thayDoi && parseFloat(stats.hoiVienMoi.thangNay.thayDoi) >= 0 ? '↑' : '↓'} ${stats.hoiVienMoi?.thangNay?.thayDoi || '0'}% so với tháng trước`
                                }
                            </div>
                        </div>
                    </div>

                    <div className="chart-grid">
                        <ChartCard title={`Tăng trưởng hội viên${formatDateRange()}`} subtitle="Theo giai đoạn">
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={filteredNewMemberTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                    <XAxis dataKey="label" stroke="var(--text-secondary, #94a3b8)" />
                                    <YAxis stroke="var(--text-secondary, #94a3b8)" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title={`Phân bổ hội viên theo chi nhánh${formatDateRange()}`} subtitle="Hội viên / chi nhánh">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={filteredBranchChartData}>
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
                        <ChartCard title={`Trạng thái hội viên${formatDateRange()}`}>
                            <div className="chart-pie-wrapper">
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={filteredMemberStatusData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                        >
                                            {filteredMemberStatusData.map((entry, index) => (
                                                <Cell key={`status-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pie-legend">
                                    {filteredMemberStatusData.map((item, index) => (
                                        <div className="pie-legend-item" key={index}>
                                            <span className="dot" style={{ background: item.color }} />
                                            <span>{item.name}</span>
                                            <strong>{formatNumber(item.value)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ChartCard>

                        <ChartCard title={`Tỷ lệ gói tập${formatDateRange()}`} subtitle="Theo số lượng đăng ký">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={filteredPackagePieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={3}
                                    >
                                        {filteredPackagePieData.map((entry, index) => (
                                            <Cell key={`pkg-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="package-legend">
                                {filteredPackagePieData.slice(0, 3).map((item, index) => (
                                    <div className="package-legend-item" key={index}>
                                        <span className="dot" style={{ background: item.color }} />
                                        <span>{item.name}</span>
                                        <strong>{formatNumber(item.value)}</strong>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>

                        <ChartCard title={`Check-in theo chi nhánh${formatDateRange() || ' - Trong tháng này'}`}>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart layout="vertical" data={filteredCheckInBranchData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                    <XAxis type="number" stroke="var(--text-secondary, #94a3b8)" />
                                    <YAxis type="category" dataKey="name" stroke="var(--text-secondary, #94a3b8)" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#0EA5E9" radius={[0, 12, 12, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Carousel cho các biểu đồ thống kê bổ sung */}
                    <div className="overview-charts-carousel">
                        <div className="carousel-header">
                            <h3>Thống kê chi tiết{formatDateRange()}</h3>
                            <div className="carousel-nav">
                                <button
                                    className="carousel-btn prev"
                                    onClick={() => setCurrentChartSlide(prev => Math.max(0, prev - 1))}
                                    disabled={currentChartSlide === 0}
                                >
                                    ‹
                                </button>
                                <div className="carousel-dots">
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <button
                                            key={index}
                                            className={`carousel-dot ${currentChartSlide === index ? 'active' : ''}`}
                                            onClick={() => setCurrentChartSlide(index)}
                                        />
                                    ))}
                                </div>
                                <button
                                    className="carousel-btn next"
                                    onClick={() => setCurrentChartSlide(prev => Math.min(4, prev + 1))}
                                    disabled={currentChartSlide === 4}
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                        <div className="carousel-container">
                            <div
                                className="carousel-track"
                                style={{ transform: `translateX(-${currentChartSlide * 100}%)` }}
                            >
                                {/* Slide 1: Doanh thu theo thời gian */}
                                <div className="carousel-slide">
                                    <ChartCard title="Doanh thu theo thời gian" subtitle="Xu hướng 7 ngày gần nhất">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <AreaChart data={revenueTrendData}>
                                                <defs>
                                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                                <XAxis dataKey="label" stroke="var(--text-secondary, #94a3b8)" />
                                                <YAxis stroke="var(--text-secondary, #94a3b8)" />
                                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                                <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fill="url(#revenueGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>

                                {/* Slide 2: So sánh tháng này vs tháng trước */}
                                <div className="carousel-slide">
                                    <ChartCard title="So sánh tháng này vs tháng trước" subtitle="Doanh thu & số lượng giao dịch">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <ComposedChart data={monthlyComparisonData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                                <XAxis dataKey="name" stroke="var(--text-secondary, #94a3b8)" />
                                                <YAxis yAxisId="left" stroke="var(--text-secondary, #94a3b8)" />
                                                <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary, #94a3b8)" />
                                                <Tooltip
                                                    formatter={(value: any, name: string) =>
                                                        name === 'doanhThu' ? formatCurrency(value) : formatNumber(value)
                                                    }
                                                />
                                                <Legend />
                                                <Bar yAxisId="left" dataKey="doanhThu" fill="#6366F1" radius={[4, 4, 0, 0]} name="Doanh thu" />
                                                <Line yAxisId="right" type="monotone" dataKey="soLuong" stroke="#22C55E" strokeWidth={3} name="Số lượng" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>

                                {/* Slide 3: Top gói tập phổ biến */}
                                <div className="carousel-slide">
                                    <ChartCard title="Top 5 gói tập phổ biến" subtitle="Theo số lượng đăng ký">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={topPackagesChartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                                <XAxis type="number" stroke="var(--text-secondary, #94a3b8)" />
                                                <YAxis type="category" dataKey="name" stroke="var(--text-secondary, #94a3b8)" />
                                                <Tooltip />
                                                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                                    {topPackagesChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>

                                {/* Slide 4: Xu hướng đăng ký theo tuần */}
                                <div className="carousel-slide">
                                    <ChartCard title="Xu hướng đăng ký theo tuần" subtitle="Trong tháng này">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <LineChart data={weeklyRegistrationTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                                <XAxis dataKey="label" stroke="var(--text-secondary, #94a3b8)" />
                                                <YAxis stroke="var(--text-secondary, #94a3b8)" />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>

                                {/* Slide 5: Phân bổ check-in theo giờ */}
                                <div className="carousel-slide">
                                    <ChartCard title="Phân bổ check-in theo giờ" subtitle="Giờ cao điểm trong ngày">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={hourlyCheckInData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                                <XAxis dataKey="label" stroke="var(--text-secondary, #94a3b8)" />
                                                <YAxis stroke="var(--text-secondary, #94a3b8)" />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mục tiêu năm */}
                    <div className="goals-section">
                        <div className="goals-header">
                            <h3>Mục tiêu năm {new Date().getFullYear()}</h3>
                            {!isEditingGoals && goals ? (
                                <button className="edit-goals-btn" onClick={() => setIsEditingGoals(true)}>
                                    ✏️ Chỉnh sửa
                                </button>
                            ) : isEditingGoals ? (
                                <div className="goals-actions">
                                    <button className="save-goals-btn" onClick={handleSaveGoals}>
                                        ✓ Lưu
                                    </button>
                                    <button className="cancel-goals-btn" onClick={handleCancelEdit}>
                                        ✕ Hủy
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {!goals ? (
                            <div className="goals-loading">Đang tải mục tiêu...</div>
                        ) : isEditingGoals ? (
                            <div className="goals-edit-form">
                                <div className="goal-input-group">
                                    <label>Hội viên mới (người)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.hoiVienMoi}
                                        onChange={(e) => setTempGoals({ ...tempGoals, hoiVienMoi: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="goal-input-group">
                                    <label>Doanh thu (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.doanhThu}
                                        onChange={(e) => setTempGoals({ ...tempGoals, doanhThu: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="goal-input-group">
                                    <label>Check-in (lượt)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.checkIn}
                                        onChange={(e) => setTempGoals({ ...tempGoals, checkIn: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="goal-input-group">
                                    <label>Gói tập đăng ký (gói)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.goiTap}
                                        onChange={(e) => setTempGoals({ ...tempGoals, goiTap: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="goal-input-group">
                                    <label>Hội viên đang hoạt động (người)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.hoiVienDangHoatDong}
                                        onChange={(e) => setTempGoals({ ...tempGoals, hoiVienDangHoatDong: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="goal-input-group">
                                    <label>Tỷ lệ gia hạn (%)</label>
                                    <input
                                        type="number"
                                        value={tempGoals.tyLeGiaHan}
                                        onChange={(e) => setTempGoals({ ...tempGoals, tyLeGiaHan: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>
                        ) : goalProgress ? (
                            <div className="goals-grid">
                                <div className="goal-card">
                                    <div className="goal-header">
                                        <span className="goal-icon">👥</span>
                                        <div>
                                            <h4>Hội viên mới</h4>
                                            <p className="goal-subtitle">{formatNumber(Math.round(goalProgress.hoiVienMoi.current))} / {formatNumber(goalProgress.hoiVienMoi.target)}</p>
                                        </div>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${goalProgress.hoiVienMoi.progress}%`,
                                                    backgroundColor: goalProgress.hoiVienMoi.color
                                                }}
                                            />
                                        </div>
                                        <span className="progress-percent">{Math.round(goalProgress.hoiVienMoi.progress)}%</span>
                                    </div>
                                </div>

                                <div className="goal-card">
                                    <div className="goal-header">
                                        <span className="goal-icon">💰</span>
                                        <div>
                                            <h4>Doanh thu</h4>
                                            <p className="goal-subtitle">{formatCurrency(Math.round(goalProgress.doanhThu.current))} / {formatCurrency(goalProgress.doanhThu.target)}</p>
                                        </div>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${goalProgress.doanhThu.progress}%`,
                                                    backgroundColor: goalProgress.doanhThu.color
                                                }}
                                            />
                                        </div>
                                        <span className="progress-percent">{Math.round(goalProgress.doanhThu.progress)}%</span>
                                    </div>
                                </div>

                                <div className="goal-card">
                                    <div className="goal-header">
                                        <span className="goal-icon">✅</span>
                                        <div>
                                            <h4>Check-in</h4>
                                            <p className="goal-subtitle">{formatNumber(Math.round(goalProgress.checkIn.current))} / {formatNumber(goalProgress.checkIn.target)}</p>
                                        </div>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${goalProgress.checkIn.progress}%`,
                                                    backgroundColor: goalProgress.checkIn.color
                                                }}
                                            />
                                        </div>
                                        <span className="progress-percent">{Math.round(goalProgress.checkIn.progress)}%</span>
                                    </div>
                                </div>

                                <div className="goal-card">
                                    <div className="goal-header">
                                        <span className="goal-icon">📦</span>
                                        <div>
                                            <h4>Gói tập</h4>
                                            <p className="goal-subtitle">{formatNumber(Math.round(goalProgress.goiTap.current))} / {formatNumber(goalProgress.goiTap.target)}</p>
                                        </div>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${goalProgress.goiTap.progress}%`,
                                                    backgroundColor: goalProgress.goiTap.color
                                                }}
                                            />
                                        </div>
                                        <span className="progress-percent">{Math.round(goalProgress.goiTap.progress)}%</span>
                                    </div>
                                </div>

                                <div className="goal-card">
                                    <div className="goal-header">
                                        <span className="goal-icon">🏋️</span>
                                        <div>
                                            <h4>Hội viên đang hoạt động</h4>
                                            <p className="goal-subtitle">{formatNumber(Math.round(goalProgress.hoiVienDangHoatDong.current))} / {formatNumber(goalProgress.hoiVienDangHoatDong.target)}</p>
                                        </div>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${goalProgress.hoiVienDangHoatDong.progress}%`,
                                                    backgroundColor: goalProgress.hoiVienDangHoatDong.color
                                                }}
                                            />
                                        </div>
                                        <span className="progress-percent">{Math.round(goalProgress.hoiVienDangHoatDong.progress)}%</span>
                                    </div>
                                </div>

                                <div className="goal-card">
                                    <div className="goal-header">
                                        <span className="goal-icon">🔄</span>
                                        <div>
                                            <h4>Tỷ lệ gia hạn</h4>
                                            <p className="goal-subtitle">{Math.round(goalProgress.tyLeGiaHan.current)}% / {goalProgress.tyLeGiaHan.target}%</p>
                                        </div>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${goalProgress.tyLeGiaHan.progress}%`,
                                                    backgroundColor: goalProgress.tyLeGiaHan.color
                                                }}
                                            />
                                        </div>
                                        <span className="progress-percent">{Math.round(goalProgress.tyLeGiaHan.progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="overview-table-row">
                        <div className="overview-table-card">
                            <div className="card-header-with-menu">
                                <h3>Hội viên mới đăng ký{formatDateRange()}</h3>
                                <span className="muted-text">Realtime cập nhật</span>
                            </div>
                            <div className="table-container">
                                <table className="simple-table">
                                    <thead>
                                        <tr>
                                            <th>Hội viên</th>
                                            <th>Gói tập</th>
                                            <th>Chi nhánh</th>
                                            <th>PT phụ trách</th>
                                            <th>Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newRegistrations.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="table-empty">Chưa có hội viên mới.</td>
                                            </tr>
                                        )}
                                        {newRegistrations.map(item => (
                                            <tr key={item._id}>
                                                <td>
                                                    <div className="table-user">
                                                        <div className="avatar">{getInitials(item.hoTen)}</div>
                                                        <div>
                                                            <strong>{item.hoTen}</strong>
                                                            <span>{formatRelativeTime(item.thoiGianDangKy)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{item.goiTap}</td>
                                                <td>{item.chiNhanh || '—'}</td>
                                                <td>{item.ptPhuTrach || '—'}</td>
                                                <td>{formatDateLabel(item.thoiGianDangKy)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="overview-table-card">
                            <div className="card-header-with-menu">
                                <h3>Hội viên sắp hết hạn{formatDateRange()}</h3>
                                <span className="muted-text">Ưu tiên liên hệ</span>
                            </div>
                            <div className="table-container">
                                <table className="simple-table">
                                    <thead>
                                        <tr>
                                            <th>Hội viên</th>
                                            <th>Gói tập</th>
                                            <th>Chi nhánh</th>
                                            <th>Hết hạn</th>
                                            <th>Còn lại</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiringSoonList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="table-empty">Không có hội viên sắp hết hạn.</td>
                                            </tr>
                                        )}
                                        {expiringSoonList.map(item => (
                                            <tr key={item._id}>
                                                <td>{item.nguoiDungId?.hoTen || 'Ẩn danh'}</td>
                                                <td>{item.goiTapId?.tenGoiTap || 'N/A'}</td>
                                                <td>{item.branchId?.tenChiNhanh || '—'}</td>
                                                <td>{formatDateLabel(item.ngayKetThuc)}</td>
                                                <td>{getDaysLeftLabel(item.ngayKetThuc)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <span key={`day-label-${index}`} className="calendar-day-label">{day}</span>
                            ))}
                            {calendarInfo.matrix.map((row, rowIdx) =>
                                row.map((day, colIdx) => {
                                    if (day === null) {
                                        return (
                                            <span
                                                key={`${rowIdx}-${colIdx}`}
                                                className="calendar-cell"
                                            >
                                                {''}
                                            </span>
                                        );
                                    }

                                    const isToday = day === calendarInfo.today;
                                    const isStart = day === dateRange.start;
                                    const isEnd = day === dateRange.end;
                                    const isInRange = dateRange.start && dateRange.end
                                        ? day >= Math.min(dateRange.start, dateRange.end) && day <= Math.max(dateRange.start, dateRange.end)
                                        : false;

                                    let cellClass = 'calendar-cell';
                                    if (isToday && !isStart && !isEnd && !isInRange) {
                                        cellClass += ' active';
                                    } else if (isStart || isEnd) {
                                        cellClass += ' selected';
                                    } else if (isInRange) {
                                        cellClass += ' in-range';
                                    }

                                    return (
                                        <span
                                            key={`${rowIdx}-${colIdx}`}
                                            className={cellClass}
                                            onClick={() => handleDateClick(day)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {day}
                                        </span>
                                    );
                                })
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

const MembersTab: React.FC<MembersTabProps> = ({ stats, formatNumber, newMemberTrendData, branchChartData }) => {
    const totalMembers = stats.trangThaiHoiVien?.tongSo || 0;
    const activeMembers = stats.trangThaiHoiVien?.chiTiet?.find(item => item.trangThai === 'DANG_HOAT_DONG')?.soLuong || 0;
    const inactiveMembers = Math.max(totalMembers - activeMembers, 0);
    const newMembers = stats.hoiVienMoi?.thangNay?.soLuong || 0;
    const retentionRate = totalMembers ? Math.round((activeMembers / totalMembers) * 100) : 0;

    const memberStatus = stats.trangThaiHoiVien?.chiTiet?.map((item, index) => ({
        name: item.tenTrangThai || item.trangThai,
        value: item.soLuong || 0,
        color: CHART_COLORS[index % CHART_COLORS.length]
    })) || [
            { name: 'Đang hoạt động', value: activeMembers, color: CHART_COLORS[0] },
            { name: 'Tạm ngưng', value: inactiveMembers, color: CHART_COLORS[1] }
        ];

    const branchTableData = branchChartData.map((branch, index) => ({
        id: index,
        name: branch.name,
        active: branch.active,
        inactive: branch.inactive,
        total: branch.total,
        rate: branch.total ? Math.round((branch.active / branch.total) * 100) : 0
    }));

    const topPackageChart = (stats.goiTap?.theoGoiTap || [])
        .slice(0, 5)
        .map((pkg, index) => ({
            name: pkg.goiTap?.tenGoiTap || `Gói ${index + 1}`,
            value: pkg.soLuongDangKy || 0
        }));

    const branchCheckInData = (stats.checkIn?.theoChiNhanh || []).map(item => ({
        name: item.tenChiNhanh || 'N/A',
        value: item.soLuongCheckIn || 0
    }));

    const memberCards = [
        { title: 'Tổng hội viên', value: formatNumber(totalMembers), sub: `${formatNumber(activeMembers)} đang hoạt động` },
        { title: 'Hội viên mới tháng này', value: formatNumber(newMembers), sub: `${stats.hoiVienMoi?.thangNay?.thayDoi || '0'}% so với tháng trước` },
        { title: 'Đang hoạt động', value: formatNumber(activeMembers), sub: `${retentionRate}% retention` },
        { title: 'Tạm ngưng / Hết hạn', value: formatNumber(inactiveMembers), sub: 'Cần chăm sóc lại' }
    ];

    return (
        <div className="statistics-tab">
            <div className="stats-grid">
                {memberCards.map(card => (
                    <div className="stat-card" key={card.title}>
                        <h3>{card.title}</h3>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-sub">{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="chart-grid">
                <ChartCard title="Xu hướng hội viên mới" subtitle="Theo giai đoạn">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={newMemberTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Phân bổ theo chi nhánh">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={branchChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Bar dataKey="active" name="Đang hoạt động" fill="#22C55E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="inactive" name="Tạm ngưng" fill="#F97316" radius={[4, 4, 0, 0]} />
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
                                    data={memberStatus}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                >
                                    {memberStatus.map((item, index) => (
                                        <Cell key={`status-${index}`} fill={item.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-legend">
                            {memberStatus.map((item, index) => (
                                <div className="pie-legend-item" key={index}>
                                    <span className="dot" style={{ background: item.color }} />
                                    <span>{item.name}</span>
                                    <strong>{formatNumber(item.value)}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title="Gói tập phổ biến">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topPackageChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Check-in theo chi nhánh">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart layout="vertical" data={branchCheckInData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis type="number" stroke="#94a3b8" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0EA5E9" radius={[0, 10, 10, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="overview-table-card">
                <div className="card-header-with-menu">
                    <h3>Hiệu suất chi nhánh</h3>
                    <span className="muted-text">Sắp xếp theo số hội viên</span>
                </div>
                <div className="table-container">
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Chi nhánh</th>
                                <th>Đang hoạt động</th>
                                <th>Tạm ngưng</th>
                                <th>Tổng</th>
                                <th>Tỉ lệ hoạt động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchTableData.map(row => (
                                <tr key={row.id}>
                                    <td>{row.name}</td>
                                    <td>{formatNumber(row.active)}</td>
                                    <td>{formatNumber(row.inactive)}</td>
                                    <td>{formatNumber(row.total)}</td>
                                    <td>{row.rate}%</td>
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
    const branchRevenue = stats.doanhThu?.theoChiNhanh || [];
    const branchNameMap = useMemo(() => {
        const map = new Map<string, string>();
        (stats.branchRegistrations || []).forEach(item => {
            if (item.branchId && item.branchName) {
                map.set(String(item.branchId), item.branchName);
            }
            if (item.branchName) {
                map.set(item.branchName, item.branchName);
            }
        });
        branchRevenue.forEach(item => {
            const name = item.tenChiNhanh;
            if (name) {
                map.set(name, name);
                if (item._id) {
                    map.set(String(item._id), name);
                }
                const branchId = (item as any).chiNhanhId;
                if (branchId) {
                    map.set(String(branchId), name);
                }
            }
        });
        return map;
    }, [stats.branchRegistrations, branchRevenue]);

    const getBranchName = useCallback((source: any) => {
        if (!source) return 'N/A';
        if (source.tenChiNhanh && source.tenChiNhanh !== 'N/A') return source.tenChiNhanh;
        const keys = [source.chiNhanhId, source._id, source.branchId, source.branchName];
        for (const key of keys) {
            if (!key) continue;
            const name = branchNameMap.get(String(key));
            if (name) return name;
        }
        return 'N/A';
    }, [branchNameMap]);

    const branchRevenueById = useMemo(() => {
        const map = new Map<string, any>();
        branchRevenue.forEach(item => {
            const branchId = (item as any).chiNhanhId;
            const keys = [branchId, item._id, item.tenChiNhanh];
            keys.forEach(key => {
                if (key) {
                    map.set(String(key), item);
                }
            });
        });
        return map;
    }, [branchRevenue]);

    const branchRevenueData = useMemo(() => {
        return branchRevenue.map(item => ({
            ...item,
            displayName: getBranchName(item)
        }));
    }, [branchRevenue, getBranchName]);
    const totalRevenue = stats.doanhThu?.hienTai?.doanhThu || 0;
    const totalTransactions = stats.doanhThu?.hienTai?.soLuong || 0;
    const previousRevenue = stats.doanhThu?.kyTruoc?.doanhThu || 0;
    const conversionOverview = stats.conversionStats || {
        totalTrials: 0,
        converted: 0,
        conversionRate: 0,
        previousRate: 0,
        changePercent: 0,
        trend: 'flat'
    };

    const revenueTrendData = useMemo(() => {
        const source = stats.branchRegistrations || [];
        if (source.length) {
            return source.slice(0, 8).map(item => {
                const branchKey = item.branchId || item.branchName;
                const revenueEntry = branchKey ? branchRevenueById.get(String(branchKey)) : undefined;
                return {
                    label: item.branchName || getBranchName({ branchId: branchKey }),
                    revenue: revenueEntry?.total || 0,
                    registrations: item.total || 0
                };
            });
        }
        return branchRevenueData.map(item => ({
            label: item.displayName,
            revenue: item.total || 0,
            registrations: item.count || 0
        }));
    }, [stats.branchRegistrations, branchRevenueData, branchRevenueById, getBranchName]);

    const renewStats = (stats.renewPackages || []).slice(0, 6).map(item => ({
        name: item.packageName,
        renewCount: item.renewCount
    }));

    const conversionData = [
        { name: 'Đã chuyển đổi', value: conversionOverview.converted, color: '#22C55E' },
        { name: 'Chưa chuyển đổi', value: Math.max(conversionOverview.totalTrials - conversionOverview.converted, 0), color: '#CBD5E1' }
    ];

    const revenueCards = [
        { title: 'Doanh thu hiện tại', value: formatCurrency(totalRevenue), sub: `${formatNumber(totalTransactions)} giao dịch` },
        { title: 'Kỳ trước', value: formatCurrency(previousRevenue), sub: `${formatNumber(stats.doanhThu?.kyTruoc?.soLuong || 0)} giao dịch` },
        {
            title: 'Chênh lệch',
            value: `${stats.doanhThu?.trend === 'up' ? '▲' : '▼'} ${Math.abs(stats.doanhThu?.thayDoi || 0)}%`,
            sub: stats.doanhThu?.trend === 'up' ? 'Tăng trưởng' : 'Giảm'
        },
        {
            title: 'Giá trị trung bình',
            value: totalTransactions ? formatCurrency(totalRevenue / Math.max(totalTransactions, 1)) : formatCurrency(0),
            sub: 'Trung bình mỗi giao dịch'
        }
    ];

    return (
        <div className="statistics-tab">
            <div className="stats-grid">
                {revenueCards.map(card => (
                    <div className="stat-card" key={card.title}>
                        <h3>{card.title}</h3>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-sub">{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="chart-grid">
                <ChartCard title="Doanh thu & đăng ký" subtitle="Theo chi nhánh">
                    <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart data={revenueTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={value => `${(value / 1_000_000).toFixed(0)}tr`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" barSize={22} fill="#6366F1" radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="registrations" name="Đăng ký" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Doanh thu theo chi nhánh">
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={branchRevenueData.map(item => ({ name: item.displayName, total: item.total, count: item.count }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="chart-grid triple">
                <ChartCard title="Tỷ lệ chuyển đổi">
                    <div className="chart-pie-wrapper">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={conversionData} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                                    {conversionData.map((item, index) => (
                                        <Cell key={`conversion-${index}`} fill={item.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-legend">
                            <div className="pie-legend-item">
                                <span className="dot" style={{ background: '#22C55E' }} />
                                <span>Đã chuyển đổi</span>
                                <strong>{formatNumber(conversionOverview.converted)}</strong>
                            </div>
                            <div className="pie-legend-item">
                                <span className="dot" style={{ background: '#CBD5E1' }} />
                                <span>Chưa chuyển đổi</span>
                                <strong>{formatNumber(Math.max(conversionOverview.totalTrials - conversionOverview.converted, 0))}</strong>
                            </div>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title="Gói gia hạn nhiều nhất">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart layout="vertical" data={renewStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis type="number" stroke="#94a3b8" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={160} />
                            <Tooltip formatter={(value) => `${formatNumber(value as number)} lần`} />
                            <Bar dataKey="renewCount" fill="#F97316" radius={[0, 10, 10, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Chỉ số nhanh">
                    <div className="statistics-metrics">
                        <div className="stat-metric-item">
                            <div className="stat-metric-value">{formatCurrency(totalRevenue / Math.max(totalTransactions, 1))}</div>
                            <div className="stat-metric-label">Avg. Order Value</div>
                        </div>
                        <div className="stat-metric-item">
                            <div className="stat-metric-value">{formatNumber(stats.branchRegistrations?.length || 0)}</div>
                            <div className="stat-metric-label">Chi nhánh báo cáo</div>
                        </div>
                        <div className="stat-metric-item">
                            <div className="stat-metric-value">
                                {conversionOverview.trend === 'up' ? '▲' : '▼'} {Math.abs(conversionOverview.changePercent || 0)}%
                            </div>
                            <div className="stat-metric-label">So với kỳ trước</div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className="overview-table-card">
                <div className="card-header-with-menu">
                    <h3>Bảng doanh thu chi nhánh</h3>
                    <span className="muted-text">Sắp xếp theo doanh thu</span>
                </div>
                <div className="table-container">
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Chi nhánh</th>
                                <th>Doanh thu</th>
                                <th>Số giao dịch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchRevenueData.map((item: any, index: number) => (
                                <tr key={item._id || (item as any).chiNhanhId || item.displayName || index}>
                                    <td>{item.displayName}</td>
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
interface PackagesTabProps {
    stats: OverallStats;
    formatCurrency: (n: number) => string;
    formatNumber: (n: number) => string;
    packagePieData: Array<{ name: string; value: number; color: string }>;
}

interface CarouselSlide {
    id: string;
    title: string;
    description?: string;
    content: React.ReactNode;
}

const PackagesTab: React.FC<PackagesTabProps> = ({ stats, formatCurrency, formatNumber, packagePieData }) => {
    const [timePeriod, setTimePeriod] = useState<'monthly' | 'quarterly' | 'annually'>('monthly');
    const [activeSlide, setActiveSlide] = useState(0);
    const [categorySlide, setCategorySlide] = useState(0);

    // Tính toán metrics
    const totalRegistrations = stats.goiTap?.tongSoDangKy || 0;
    const totalRevenue = stats.goiTap?.theoGoiTap?.reduce((sum, item) => sum + (item.doanhThu || 0), 0) || 0;
    const activePackages = stats.goiTap?.theoGoiTap?.filter(item => item.soLuongDangKy > 0).length || 0;

    // Kiểm tra xem có dữ liệu không - kiểm tra cả tongSoDangKy và theoGoiTap
    const hasData = (stats.goiTap && (
        (stats.goiTap.tongSoDangKy && stats.goiTap.tongSoDangKy > 0) ||
        (stats.goiTap.theoGoiTap && Array.isArray(stats.goiTap.theoGoiTap) && stats.goiTap.theoGoiTap.length > 0)
    ));

    // Tính % thay đổi (giả sử so với tháng trước - có thể cải thiện sau)
    const registrationChange = '+20%';
    const revenueChange = '+9.0%';
    const activeChange = '-4.5%';

    const branchRegistrationStats = stats.branchRegistrations || [];
    const renewStats = stats.renewPackages || [];
    const conversionOverview = stats.conversionStats || {
        totalTrials: 0,
        converted: 0,
        conversionRate: 0,
        previousRate: 0,
        changePercent: 0,
        trend: 'flat'
    };
    const ageDistribution = stats.ageDistribution || [];
    const durationRevenueStats = stats.packageDurationRevenue || [];
    const peakHourStats = stats.peakHours || [];

    // Dữ liệu cho line chart (giả lập - có thể cải thiện với dữ liệu thực tế)
    const packageTrendData = useMemo(() => {
        const months = ['Jul', 'Aug', 'Sep', 'Oct'];
        return months.map((month, index) => ({
            month,
            revenue: 170 + (index * 15) + Math.random() * 10,
            registrations: 70 + (index * 10) + Math.random() * 5
        }));
    }, [timePeriod]);

    // Tính toán trung bình
    const avgRevenue = packageTrendData.reduce((sum, item) => sum + item.revenue, 0) / packageTrendData.length;
    const avgRegistrations = packageTrendData.reduce((sum, item) => sum + item.registrations, 0) / packageTrendData.length;
    const revenueChangePercent = '+23.2%';
    const registrationChangePercent = '-12.3%';

    // Dữ liệu cho donut chart
    const donutChartData = (packagePieData && packagePieData.length > 0) ? packagePieData.slice(0, 3) : [];
    const totalDonutValue = donutChartData.reduce((sum, item) => sum + item.value, 0);

    // Dữ liệu cho progress bars (theo từng gói)
    const packageProgressData = (stats.goiTap?.theoGoiTap && stats.goiTap.theoGoiTap.length > 0)
        ? stats.goiTap.theoGoiTap.slice(0, 2).map((item, index) => {
            // Tính percentage dựa trên doanh thu thực tế
            const maxRevenue = Math.max(...stats.goiTap.theoGoiTap.map(i => i.doanhThu || 0));
            const percentage = maxRevenue > 0 ? Math.round((item.doanhThu || 0) / maxRevenue * 100) : 0;
            return {
                name: item.goiTap?.tenGoiTap || 'N/A',
                value: item.doanhThu || 0,
                percentage: Math.min(percentage, 100)
            };
        })
        : [];

    // Dữ liệu cho recent packages table
    const recentPackages = (stats.goiTap?.theoGoiTap && stats.goiTap.theoGoiTap.length > 0)
        ? stats.goiTap.theoGoiTap.slice(0, 5).map((item, index) => ({
            id: item.goiTap?._id || `PKG${String(index + 1).padStart(6, '0')}`,
            name: item.goiTap?.tenGoiTap || 'N/A',
            registrations: item.soLuongDangKy || 0,
            revenue: item.doanhThu || 0,
            percentage: parseFloat(item.tyLe || '0'),
            status: item.soLuongDangKy > 10 ? 'Active' : 'Low',
            date: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
        : [];

    const branchChartData = useMemo(() => branchRegistrationStats
        .map(item => ({
            name: item.branchName,
            total: item.total,
            changePercent: item.changePercent,
            trend: item.trend
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8), [branchRegistrationStats]);

    const renewChartData = useMemo(() => renewStats
        .map(item => ({
            name: item.packageName,
            renewCount: item.renewCount,
            changePercent: item.changePercent,
            trend: item.trend
        }))
        .sort((a, b) => b.renewCount - a.renewCount)
        .slice(0, 6), [renewStats]);

    const ageChartData = useMemo(() => ageDistribution.map(item => ({
        group: item.group,
        count: item.count,
        percentage: item.percentage
    })), [ageDistribution]);

    const durationRevenueChartData = useMemo(() => durationRevenueStats.map(item => ({
        label: item.duration,
        revenue: item.revenue,
        registrations: item.registrations
    })), [durationRevenueStats]);

    const peakHourChartData = useMemo(() => peakHourStats.map(item => ({
        label: item.label,
        count: item.count
    })), [peakHourStats]);

    const slides = useMemo<CarouselSlide[]>(() => {
        const items: CarouselSlide[] = [];

        items.push({
            id: 'revenue-growth',
            title: 'Doanh thu & đăng ký',
            description: 'Theo tháng',
            content: (
                <>
                    <div className="statistics-header">
                        <div>
                            <p className="muted-text">Target you've set for each month</p>
                        </div>
                        <div className="time-period-selector">
                            <button
                                className={timePeriod === 'monthly' ? 'active' : ''}
                                onClick={() => setTimePeriod('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                className={timePeriod === 'quarterly' ? 'active' : ''}
                                onClick={() => setTimePeriod('quarterly')}
                            >
                                Quarterly
                            </button>
                            <button
                                className={timePeriod === 'annually' ? 'active' : ''}
                                onClick={() => setTimePeriod('annually')}
                            >
                                Annually
                            </button>
                        </div>
                    </div>
                    <div className="statistics-metrics">
                        <div className="stat-metric-item">
                            <div className="stat-metric-value">{formatCurrency(avgRevenue * 1000)}</div>
                            <div className="stat-metric-change positive">{revenueChangePercent}</div>
                            <div className="stat-metric-label">Avg. Yearly Revenue</div>
                        </div>
                        <div className="stat-metric-item">
                            <div className="stat-metric-value">{formatNumber(avgRegistrations)}</div>
                            <div className="stat-metric-change negative">{registrationChangePercent}</div>
                            <div className="stat-metric-label">Avg. Yearly Registrations</div>
                        </div>
                    </div>
                    <div className="statistics-chart chart-center">
                        <ResponsiveContainer width="100%" height={550}>
                            <AreaChart data={packageTrendData}>
                                <defs>
                                    <linearGradient id="pkgColorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="pkgColorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Doanh thu"
                                    stroke="#6366F1"
                                    fillOpacity={1}
                                    fill="url(#pkgColorRevenue)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="registrations"
                                    name="Số đăng ký"
                                    stroke="#0EA5E9"
                                    fillOpacity={1}
                                    fill="url(#pkgColorRegistrations)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )
        });

        if (branchChartData.length) {
            const vertical = branchChartData.length > 5;
            items.push({
                id: 'branch-registrations',
                title: 'Đăng ký theo chi nhánh',
                description: 'Top chi nhánh có nhiều gói được đăng ký nhất',
                content: (
                    <div className="chart-center">
                        <ResponsiveContainer width="100%" height={550}>
                            <BarChart data={branchChartData} layout={vertical ? 'vertical' : 'horizontal'}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                {vertical ? (
                                    <>
                                        <XAxis type="number" stroke="#94a3b8" />
                                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={140} />
                                    </>
                                ) : (
                                    <>
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                    </>
                                )}
                                <Tooltip formatter={(value) => [`${formatNumber(value as number)} đăng ký`, 'Đăng ký']} />
                                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={vertical ? 16 : 24}>
                                    {branchChartData.map((entry, index) => (
                                        <Cell key={`branch-bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )
            });
        }

        if (renewChartData.length) {
            items.push({
                id: 'renew-packages',
                title: 'Gói được gia hạn nhiều nhất',
                description: 'Dựa trên số lần upgrade/gia hạn',
                content: (
                    <div className="chart-center">
                        <ResponsiveContainer width="100%" height={550}>
                            <BarChart data={renewChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={160} />
                                <Tooltip formatter={(value) => [`${formatNumber(value as number)} lần`, 'Gia hạn']} />
                                <Bar dataKey="renewCount" radius={[0, 10, 10, 0]} barSize={18}>
                                    {renewChartData.map((entry, index) => (
                                        <Cell
                                            key={`renew-${index}`}
                                            fill={index === 0 ? '#F97316' : '#8B5CF6'}
                                            opacity={index === 0 ? 0.9 : 0.75}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )
            });
        }

        if (conversionOverview.totalTrials > 0) {
            const remaining = Math.max(conversionOverview.totalTrials - conversionOverview.converted, 0);
            const conversionChartData = [
                { name: 'Đã chuyển đổi', value: conversionOverview.converted, color: '#22C55E' },
                { name: 'Chưa chuyển đổi', value: remaining, color: '#CBD5F5' }
            ];

            items.push({
                id: 'conversion-rate',
                title: 'Tỷ lệ chuyển đổi sau trải nghiệm',
                description: 'Từ gói trải nghiệm 7 ngày sang gói trả phí',
                content: (
                    <div className="conversion-slide">
                        <div className="conversion-chart">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={conversionChartData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={2}>
                                        {conversionChartData.map((entry, index) => (
                                            <Cell key={`conv-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${formatNumber(value as number)} người`, name as string]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="conversion-center">
                                <span>{conversionOverview.conversionRate}%</span>
                                <p>Conversion</p>
                            </div>
                        </div>
                        <div className="slide-metrics-grid">
                            <div>
                                <span className="metric-label">Tổng trial</span>
                                <strong>{formatNumber(conversionOverview.totalTrials)}</strong>
                            </div>
                            <div>
                                <span className="metric-label">Đã chuyển đổi</span>
                                <strong>{formatNumber(conversionOverview.converted)}</strong>
                            </div>
                            <div>
                                <span className={`metric-change ${conversionOverview.trend === 'down' ? 'negative' : 'positive'}`}>
                                    {conversionOverview.trend === 'down' ? '↓' : '↑'} {conversionOverview.changePercent}%
                                </span>
                                <span className="metric-label">So với tháng trước ({conversionOverview.previousRate}%)</span>
                            </div>
                        </div>
                    </div>
                )
            });
        }

        if (ageChartData.some(item => item.count > 0)) {
            items.push({
                id: 'age-distribution',
                title: 'Phân bổ độ tuổi hội viên',
                description: 'Quan sát nhóm tuổi đang hoạt động',
                content: (
                    <div className="chart-center">
                        <ResponsiveContainer width="100%" height={550}>
                            <BarChart data={ageChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis type="category" dataKey="group" stroke="#94a3b8" width={120} />
                                <Tooltip formatter={(value, name, props) => [`${formatNumber(value as number)} hội viên`, props?.payload?.group || 'Nhóm tuổi']} />
                                <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={18} fill="#6366F1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )
            });
        }

        if (durationRevenueChartData.length) {
            items.push({
                id: 'duration-revenue',
                title: 'Doanh thu theo thời hạn gói',
                description: 'Kết hợp doanh thu và lượt đăng ký',
                content: (
                    <div className="chart-center">
                        <ResponsiveContainer width="100%" height={550}>
                            <ComposedChart data={durationRevenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="label" stroke="#94a3b8" />
                                <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                                <Tooltip formatter={(value, name) => name === 'Doanh thu' ? formatCurrency(value as number) : `${formatNumber(value as number)} lượt`} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" radius={[6, 6, 0, 0]} fill="#818CF8" barSize={24} />
                                <Line yAxisId="right" type="monotone" dataKey="registrations" name="Đăng ký" stroke="#F97316" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )
            });
        }

        if (peakHourChartData.length) {
            items.push({
                id: 'peak-hours',
                title: 'Khung giờ check-in cao điểm',
                description: 'Trong 30 ngày gần nhất',
                content: (
                    <div className="chart-center">
                        <ResponsiveContainer width="100%" height={550}>
                            <AreaChart data={peakHourChartData}>
                                <defs>
                                    <linearGradient id="pkgPeakGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="label" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" allowDecimals={false} />
                                <Tooltip formatter={(value) => [`${formatNumber(value as number)} lượt`, 'Check-in']} />
                                <Area type="monotone" dataKey="count" stroke="#22C55E" fill="url(#pkgPeakGradient)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )
            });
        }

        return items;
    }, [
        timePeriod,
        packageTrendData,
        avgRevenue,
        avgRegistrations,
        revenueChangePercent,
        registrationChangePercent,
        formatCurrency,
        formatNumber,
        branchChartData,
        renewChartData,
        conversionOverview,
        ageChartData,
        durationRevenueChartData,
        peakHourChartData
    ]);

    useEffect(() => {
        if (slides.length && activeSlide >= slides.length) {
            setActiveSlide(0);
        }
    }, [slides.length, activeSlide]);

    const handlePrevSlide = () => {
        if (!slides.length) return;
        setActiveSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const handleNextSlide = () => {
        if (!slides.length) return;
        setActiveSlide(prev => (prev + 1) % slides.length);
    };

    const categorySlides = useMemo<CarouselSlide[]>(() => {
        const items: CarouselSlide[] = [];

        items.push({
            id: 'package-distribution',
            title: 'Phân loại gói tập',
            description: 'Tỷ trọng đăng ký theo gói',
            content: donutChartData.length ? (
                <div className="category-slide">
                    <div className="donut-chart-container">
                        <div className="donut-chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={donutChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {donutChartData.map((entry, index) => (
                                            <Cell key={`donut-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number, name: string) => [`${formatNumber(value)} gói`, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center">
                                <span className="donut-center-label">Tổng đăng ký</span>
                                <span className="donut-center-value">{formatNumber(totalDonutValue)}</span>
                            </div>
                        </div>
                        <div className="donut-legend">
                            {donutChartData.map((entry, index) => (
                                <div key={`${entry.name}-${index}`} className="donut-legend-item">
                                    <div className="legend-color" style={{ background: entry.color }} />
                                    <div className="legend-content">
                                        <div className="legend-name">{entry.name}</div>
                                        <div className="legend-details">
                                            <span>{formatNumber(entry.value)} gói</span>
                                            <strong>{((entry.value / (totalDonutValue || 1)) * 100).toFixed(1)}%</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="packages-empty-state">Chưa có dữ liệu phân loại gói tập</div>
            )
        });

        items.push({
            id: 'package-goals',
            title: 'Mục tiêu gói tập',
            description: 'Theo dõi tiến độ mục tiêu tháng',
            content: (
                <div className="goals-slide">
                    <div className="goals-gauge">
                        <div className="gauge-container">
                            <div className="gauge-label">Tháng này</div>
                            <div className="gauge-value">{formatCurrency(totalRevenue)}</div>
                            <div className="gauge-circle">
                                <svg width="360" height="180" viewBox="0 0 120 60">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="50"
                                        fill="none"
                                        stroke="#6366F1"
                                        strokeWidth="8"
                                        strokeDasharray={`${Math.min((totalRevenue / 1000000) * 157, 157)} 157`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 60 60)"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="goals-progress">
                        {packageProgressData.length ? (
                            packageProgressData.map((item, index) => (
                                <div key={`${item.name}-${index}`} className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">{item.name}</span>
                                        <span className="progress-percentage">{item.percentage}%</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" style={{ width: `${item.percentage}%` }} />
                                    </div>
                                    <div className="progress-value">{formatCurrency(item.value)}</div>
                                </div>
                            ))
                        ) : (
                            <p className="muted-text">Chưa có dữ liệu mục tiêu cụ thể.</p>
                        )}
                    </div>
                </div>
            )
        });

        return items;
    }, [donutChartData, totalDonutValue, packageProgressData, totalRevenue, formatCurrency, formatNumber]);

    useEffect(() => {
        if (categorySlides.length && categorySlide >= categorySlides.length) {
            setCategorySlide(0);
        }
    }, [categorySlides.length, categorySlide]);

    const handlePrevCategorySlide = () => {
        if (!categorySlides.length) return;
        setCategorySlide(prev => (prev === 0 ? categorySlides.length - 1 : prev - 1));
    };

    const handleNextCategorySlide = () => {
        if (!categorySlides.length) return;
        setCategorySlide(prev => (prev + 1) % categorySlides.length);
    };

    // Nếu không có dữ liệu, hiển thị thông báo
    if (!hasData && (!stats.goiTap || !stats.goiTap.theoGoiTap || stats.goiTap.theoGoiTap.length === 0)) {
        return (
            <div className="packages-tab packages-dashboard">
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ marginBottom: '1rem', color: '#1a1a1a' }}>Chưa có dữ liệu gói tập</h3>
                    <p>Hiện tại chưa có dữ liệu thống kê về gói tập. Vui lòng kiểm tra lại sau.</p>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', textAlign: 'left', fontSize: '0.875rem' }}>
                        <p><strong>Debug Info:</strong></p>
                        <p>stats.goiTap = {stats.goiTap ? 'exists' : 'null/undefined'}</p>
                        <p>stats.goiTap?.tongSoDangKy = {stats.goiTap?.tongSoDangKy ?? 'undefined'}</p>
                        <p>stats.goiTap?.theoGoiTap = {stats.goiTap?.theoGoiTap ? (Array.isArray(stats.goiTap.theoGoiTap) ? `Array(${stats.goiTap.theoGoiTap.length})` : 'not an array') : 'null/undefined'}</p>
                        <p>packagePieData.length = {packagePieData?.length ?? 0}</p>
                        <p style={{ marginTop: '0.5rem', color: '#ef4444' }}>
                            <strong>Lưu ý:</strong> Kiểm tra console của backend server để xem log chi tiết về dữ liệu.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="packages-tab packages-dashboard">
            {/* Top Row - 3 Metric Cards */}
            <div className="packages-metrics-row">
                <div className="package-metric-card">
                    <div className="metric-title">{formatNumber(totalRegistrations)}</div>
                    <div className="metric-subtitle">Tổng số đăng ký</div>
                    <div className="metric-change positive">
                        {registrationChange} From last month
                    </div>
                </div>
                <div className="package-metric-card">
                    <div className="metric-title">{formatCurrency(totalRevenue)}</div>
                    <div className="metric-subtitle">Doanh thu tổng</div>
                    <div className="metric-change positive">
                        {revenueChange} From last month
                    </div>
                </div>
                <div className="package-metric-card">
                    <div className="metric-title">{formatNumber(activePackages)}</div>
                    <div className="metric-subtitle">Gói đang hoạt động</div>
                    <div className="metric-change negative">
                        {activeChange} From last month
                    </div>
                </div>
            </div>

            {/* Main Content Row */}
            <div className="packages-main-row">
                <div className="packages-statistics-card">
                    <PackagesSlider
                        slides={slides}
                        activeSlide={activeSlide}
                        onPrev={handlePrevSlide}
                        onNext={handleNextSlide}
                        onDotClick={setActiveSlide}
                    />
                </div>
            </div>

            {/* Bottom Row */}
            <div className="packages-bottom-row">
                <div className="packages-category-card">
                    <PackagesSlider
                        slides={categorySlides}
                        activeSlide={categorySlide}
                        onPrev={handlePrevCategorySlide}
                        onNext={handleNextCategorySlide}
                        onDotClick={setCategorySlide}
                    />
                </div>

                {/* Recent Packages Table */}
                <div className="packages-recent-card">
                    <div className="card-header-with-menu">
                        <h3>Gói tập gần đây</h3>
                        <button className="menu-button">⋮</button>
                    </div>
                    <div className="table-controls">
                        <div className="search-box">
                            <input type="text" placeholder="Search..." />
                        </div>
                        <button className="filter-button">
                            <span>Filter</span>
                        </button>
                    </div>
                    <div className="recent-table-container">
                        {recentPackages.length === 0 ? (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}>
                                <p>Chưa có dữ liệu gói tập gần đây</p>
                            </div>
                        ) : (
                            <table className="recent-packages-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <input type="checkbox" />
                                        </th>
                                        <th>Mã gói</th>
                                        <th>Tên gói</th>
                                        <th>Số đăng ký</th>
                                        <th>Doanh thu</th>
                                        <th>Tỷ lệ</th>
                                        <th>Ngày</th>
                                        <th>Trạng thái</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPackages.map((pkg, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input type="checkbox" />
                                            </td>
                                            <td>{pkg.id}</td>
                                            <td>
                                                <div className="package-name-cell">
                                                    <strong>{pkg.name}</strong>
                                                </div>
                                            </td>
                                            <td>{formatNumber(pkg.registrations)}</td>
                                            <td>{formatCurrency(pkg.revenue)}</td>
                                            <td>
                                                <div className="percentage-cell">
                                                    <div className="percentage-bar-container">
                                                        <div
                                                            className="percentage-bar"
                                                            style={{ width: `${Math.min(pkg.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span>{pkg.percentage}%</span>
                                                </div>
                                            </td>
                                            <td>{pkg.date}</td>
                                            <td>
                                                <span className={`status-badge ${pkg.status.toLowerCase()}`}>
                                                    {pkg.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="action-button">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PackagesSlider: React.FC<{
    slides: CarouselSlide[];
    activeSlide: number;
    onPrev: () => void;
    onNext: () => void;
    onDotClick: (index: number) => void;
}> = ({ slides, activeSlide, onPrev, onNext, onDotClick }) => {
    if (!slides.length) {
        return <div className="packages-empty-state">Chưa có dữ liệu để hiển thị</div>;
    }

    return (
        <div className="packages-slider">
            <div className="packages-slider-viewport">
                <div
                    className="packages-slider-track"
                    style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                    {slides.map((slide) => (
                        <div className="packages-slide" key={slide.id}>
                            <div className="packages-slide-header">
                                <div>
                                    <h3>{slide.title}</h3>
                                    {slide.description && <p className="muted-text">{slide.description}</p>}
                                </div>
                                {slides.length > 1 && (
                                    <div className="packages-slide-nav">
                                        <button onClick={onPrev} aria-label="Slide trước">‹</button>
                                        <button onClick={onNext} aria-label="Slide sau">›</button>
                                    </div>
                                )}
                            </div>
                            <div className="packages-slide-content">
                                {slide.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {slides.length > 1 && (
                <div className="packages-slider-dots">
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id}
                            className={index === activeSlide ? 'active' : ''}
                            aria-label={`Chuyển đến slide ${index + 1}`}
                            onClick={() => onDotClick(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// PT Tab Component
const PTTab: React.FC<{ stats: OverallStats; formatNumber: (n: number) => string }> = ({ stats, formatNumber }) => {
    const ptSchedule = stats.ptSchedulesToday || [];
    const totalPT = stats.pt?.tongSoPT || 0;
    const activePT = stats.pt?.dangHoatDong || 0;
    const pausedPT = stats.pt?.tamNgung || 0;
    const activeRatio = totalPT ? Math.round((activePT / totalPT) * 100) : 0;

    const ptCards = [
        { title: 'Tổng PT', value: formatNumber(totalPT), sub: `${formatNumber(activePT)} đang hoạt động` },
        { title: 'Đang hoạt động', value: formatNumber(activePT), sub: `${activeRatio}% tổng PT` },
        { title: 'Tạm ngưng', value: formatNumber(pausedPT), sub: 'Cần theo dõi' },
        { title: 'Lịch hôm nay', value: formatNumber(ptSchedule.length), sub: 'Số buổi PT' }
    ];

    const topPTData = (stats.pt?.topPT || []).map(item => ({
        name: item.ptInfo?.hoTen || 'N/A',
        value: item.soLuongHocVien || 0
    }));

    return (
        <div className="statistics-tab">
            <div className="stats-grid">
                {ptCards.map(card => (
                    <div className="stat-card" key={card.title}>
                        <h3>{card.title}</h3>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-sub">{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="chart-grid">
                <ChartCard title="Top PT theo số học viên">
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={topPTData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Tỉ lệ PT hoạt động">
                    <div className="chart-pie-wrapper">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Active', value: activePT, color: '#22C55E' },
                                        { name: 'Tạm nghỉ', value: pausedPT, color: '#CBD5E1' }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    <Cell fill="#22C55E" />
                                    <Cell fill="#CBD5E1" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-legend">
                            <div className="pie-legend-item">
                                <span className="dot" style={{ background: '#22C55E' }} />
                                <span>Đang hoạt động</span>
                                <strong>{formatNumber(activePT)}</strong>
                            </div>
                            <div className="pie-legend-item">
                                <span className="dot" style={{ background: '#CBD5E1' }} />
                                <span>Tạm nghỉ</span>
                                <strong>{formatNumber(pausedPT)}</strong>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className="overview-table-card">
                <div className="card-header-with-menu">
                    <h3>Lịch PT hôm nay</h3>
                    <span className="muted-text">Cập nhật theo thời gian thực</span>
                </div>
                <div className="table-container">
                    {ptSchedule.length === 0 ? (
                        <div className="realtime-empty">Không có lịch nào trong ngày.</div>
                    ) : (
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>PT</th>
                                    <th>Hội viên</th>
                                    <th>Gói tập</th>
                                    <th>Khung giờ</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ptSchedule.map(item => (
                                    <tr key={item._id}>
                                        <td>{item.pt?.hoTen || 'PT ẩn danh'}</td>
                                        <td>{item.hoiVien?.hoTen || 'Hội viên'}</td>
                                        <td>{item.goiTap?.tenGoiTap || 'N/A'}</td>
                                        <td>
                                            {formatDateLabel(item.thoiGianBatDau)} - {formatDateLabel(item.thoiGianKetThuc)}
                                        </td>
                                        <td>{item.trangThai || 'Đang chờ'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

// Check-in Tab Component
const CheckInTab: React.FC<{ stats: OverallStats; formatNumber: (n: number) => string }> = ({ stats, formatNumber }) => {
    const checkInTrendData = stats.checkInTimeline || (stats.peakHours || []).map(item => ({
        label: item.label,
        value: item.count
    }));
    const heatmapData = stats.peakHours || [];
    const recentCheckins = stats.recentCheckIns || [];
    const branchCheckins = stats.checkIn?.theoChiNhanh || [];

    const checkInCards = [
        {
            title: 'Tổng check-in',
            value: formatNumber(stats.checkIn?.thangNay?.soLuongCheckIn || 0),
            sub: `Tháng trước: ${formatNumber(stats.checkIn?.thangTruoc?.soLuongCheckIn || 0)}`
        },
        {
            title: 'Số hội viên',
            value: formatNumber(stats.checkIn?.thangNay?.soHoiVien || 0),
            sub: 'Đăng ký check-in tháng này'
        },
        {
            title: 'Tỉ lệ tham gia',
            value: `${stats.checkIn?.thangNay?.tyLeThamGia || 0}%`,
            sub: 'So với tổng hội viên'
        },
        {
            title: 'Trung bình / hội viên',
            value: `${stats.checkIn?.thangNay?.trungBinhMoiHoiVien || 0}`,
            sub: 'Buổi / tháng'
        }
    ];

    return (
        <div className="statistics-tab">
            <div className="stats-grid">
                {checkInCards.map(card => (
                    <div className="stat-card" key={card.title}>
                        <h3>{card.title}</h3>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-sub">{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="chart-grid">
                <ChartCard title="Xu hướng check-in" subtitle="7/30 ngày gần nhất">
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={checkInTrendData}>
                            <defs>
                                <linearGradient id="checkinTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Area dataKey="value" stroke="#0EA5E9" strokeWidth={3} fill="url(#checkinTrend)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Check-in theo chi nhánh">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart layout="vertical" data={branchCheckins.map(item => ({
                            name: item.tenChiNhanh || 'N/A',
                            value: item.soLuongCheckIn || 0
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis type="number" stroke="#94a3b8" />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={140} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366F1" radius={[0, 10, 10, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="chart-grid triple">
                <ChartCard title="Tỉ lệ tham gia">
                    <div className="gauge-wrapper">
                        <svg width="220" height="140" viewBox="0 0 120 60">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="8"
                                strokeDasharray={`${Math.min((stats.checkIn?.thangNay?.tyLeThamGia || 0) * 1.57, 157)} 157`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                            />
                        </svg>
                        <div className="gauge-value">
                            <strong>{stats.checkIn?.thangNay?.tyLeThamGia || 0}%</strong>
                            <span>Check-in đúng hạn</span>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title="Giờ cao điểm">
                    <div className="heatmap-grid compact">
                        {heatmapData.length === 0 && <div className="realtime-empty">Chưa có dữ liệu.</div>}
                        {heatmapData.slice(0, 8).map((item, index) => (
                            <div className="heatmap-cell compact" key={`${item.label}-${index}`}>
                                <div className="heatmap-title">{item.label}</div>
                                <div className="heatmap-value">{formatNumber(item.count)}</div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <ChartCard title="Danh sách mới nhất">
                    <div className="realtime-list">
                        {recentCheckins.length === 0 && <div className="realtime-empty">Chưa có dữ liệu check-in.</div>}
                        {recentCheckins.slice(0, 5).map(item => (
                            <div className="realtime-row" key={item._id}>
                                <div className="realtime-avatar">{getInitials(item.hoiVien?.hoTen)}</div>
                                <div className="realtime-info">
                                    <strong>{item.hoiVien?.hoTen || 'Ẩn danh'}</strong>
                                    <span>{item.buoiTap?.tenBuoiTap || 'Buổi tập'}</span>
                                </div>
                                <div className="realtime-meta">
                                    <span>{item.chiNhanh?.tenChiNhanh || '—'}</span>
                                    <time>{formatRelativeTime(item.checkInTime)}</time>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            <div className="overview-table-card">
                <div className="card-header-with-menu">
                    <h3>Bảng check-in theo chi nhánh</h3>
                </div>
                <div className="table-container">
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Chi nhánh</th>
                                <th>Check-in</th>
                                <th>Số hội viên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchCheckins.map((item: any, index: number) => (
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

interface RealtimeListProps {
    title: string;
    subtitle?: string;
    rows: Array<{
        id: string;
        name?: string;
        description?: string;
        meta?: string;
        timestamp?: string;
        extra?: string;
    }>;
    emptyMessage: string;
}

const RealtimeList: React.FC<RealtimeListProps> = ({ title, subtitle, rows, emptyMessage }) => (
    <div className="realtime-card">
        <div className="realtime-card-header">
            <div>
                <h3>{title}</h3>
                {subtitle && <p className="muted-text">{subtitle}</p>}
            </div>
        </div>
        <div className="realtime-list">
            {rows.length === 0 && (
                <div className="realtime-empty">{emptyMessage}</div>
            )}
            {rows.map(row => (
                <div className="realtime-row" key={row.id}>
                    <div className="realtime-avatar">{getInitials(row.name)}</div>
                    <div className="realtime-info">
                        <strong>{row.name || 'Ẩn danh'}</strong>
                        <span>{row.description || 'Không có mô tả'}</span>
                        {row.extra && <em>{row.extra}</em>}
                    </div>
                    <div className="realtime-meta">
                        <span>{row.meta || '—'}</span>
                        <time>{formatRelativeTime(row.timestamp)}</time>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

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

