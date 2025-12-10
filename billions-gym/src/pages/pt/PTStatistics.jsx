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

    // Helper: xác định khoảng thời gian theo bộ lọc
    const getDateRange = () => {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);

        switch (timeFilter) {
            case 'day':
                // hôm nay
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 6);
                break;
            case 'month':
                startDate.setDate(1);
                break;
            case 'year':
                startDate.setMonth(0, 1);
                break;
            default:
                break;
        }

        return { startDate, endDate };
    };

    const loadStatistics = async () => {
        const loadStartTime = performance.now();
        console.log('[PTStatistics] ===== BẮT ĐẦU LOAD STATISTICS =====');
        console.log('[PTStatistics] Time filter:', timeFilter);
        console.log('[PTStatistics] Timestamp:', new Date().toISOString());

        // TẮT logic skip để tránh stuck - luôn cho phép load lại
        // if (loading) {
        //     console.log('[PTStatistics] Đang loading, bỏ qua request này');
        //     return;
        // }
        setLoading(true);
        try {
            const { startDate, endDate } = getDateRange();
            console.log('[PTStatistics] Date range:', { startDate, endDate });

            const apiStartTime = performance.now();
            console.log('[PTStatistics] Bắt đầu gọi 3 API song song...');

            // Gọi API statistics và sessions song song với timeout
            const [statsRes, sessionsRes, reviewsRes] = await Promise.allSettled([
                Promise.race([
                    ptService.getStatistics({
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Statistics API timeout')), 10000))
                ]).catch(err => {
                    console.warn('[PTStatistics] getStatistics timeout hoặc lỗi:', err.message);
                    // Trả về dữ liệu mặc định, không throw error để không pause debugger
                    return { success: false, data: null };
                }),
                Promise.race([
                    ptService.getMySessions({
                        ngayBatDau: startDate.toISOString(),
                        ngayKetThuc: endDate.toISOString(),
                        limit: 100 // Tăng lên 100 để có đủ dữ liệu
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Sessions API timeout')), 10000))
                ]).catch(err => {
                    console.warn('[PTStatistics] getMySessions timeout hoặc lỗi:', err.message);
                    // Trả về dữ liệu mặc định, không throw error để không pause debugger
                    return { success: false, data: { buoiTaps: [] } };
                }),
                Promise.race([
                    ptService.getReviews({ limit: 20 }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Reviews API timeout')), 10000))
                ]).catch(err => {
                    console.warn('[PTStatistics] getReviews timeout hoặc lỗi (không ảnh hưởng):', err.message);
                    // Trả về dữ liệu mặc định, không throw error để không pause debugger
                    return { success: false, data: { reviews: [], summary: { avgRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } } };
                })
            ]);

            // Xử lý kết quả
            const statsData = statsRes.status === 'fulfilled' ? statsRes.value : { success: false, data: null };
            const sessionsData = sessionsRes.status === 'fulfilled' ? sessionsRes.value : { success: false, data: { buoiTaps: [] } };
            const reviewsData = reviewsRes.status === 'fulfilled' ? reviewsRes.value : { success: false, data: { reviews: [], summary: { avgRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } } };

            const apiEndTime = performance.now();
            console.log(`[PTStatistics] Tất cả 3 API response nhận được sau: ${(apiEndTime - apiStartTime).toFixed(2)}ms (${((apiEndTime - apiStartTime) / 1000).toFixed(2)}s)`);
            console.log('[PTStatistics] Sessions response:', sessionsData);
            console.log('[PTStatistics] Sessions count:', sessionsData.success ? sessionsData.data?.buoiTaps?.length : 0);
            console.log('[PTStatistics] Statistics response:', statsData);
            console.log('[PTStatistics] Statistics:', statsData.success ? 'OK' : 'FAILED');
            console.log('[PTStatistics] Reviews response:', reviewsData);
            console.log('[PTStatistics] Reviews count:', reviewsData.success ? reviewsData.data?.reviews?.length : 0);

            const sessions = sessionsData.success && sessionsData.data?.buoiTaps
                ? sessionsData.data.buoiTaps
                : [];

            const statistics = statsData.success ? statsData.data : null;

            console.log('[PTStatistics] Processed sessions count:', sessions.length);
            console.log('[PTStatistics] Statistics data:', statistics);

            // ---------- QUICK STATS ----------
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const sessionsToday = sessions.filter(s => {
                if (!s.ngayTap) return false;
                const d = new Date(s.ngayTap);
                return d >= today && d < tomorrow;
            }).length;

            // Doanh thu & hoa hồng (logic giống dashboard)
            const basePricePerMember = 100000; // 100k/người
            const difficultyMultiplier = { DE: 0.8, TRUNG_BINH: 1, KHO: 1.2 };
            const commissionRate = 0.35;

            let totalRevenue = 0;
            let totalCommission = 0;
            const clientMap = {};
            const typeMap = {};

            sessions.forEach(session => {
                if (!session.ngayTap) return;

                const attendees = session.soLuongHienTai
                    ?? (Array.isArray(session.danhSachHoiVien)
                        ? session.danhSachHoiVien.filter(hv => hv.trangThai !== 'HUY').length
                        : 0);

                const difficulty = session.doKho || 'TRUNG_BINH';
                const multiplier = difficultyMultiplier[difficulty] ?? 1;
                const revenue = attendees * basePricePerMember * multiplier;
                const commission = revenue * commissionRate;

                totalRevenue += revenue;
                totalCommission += commission;

                // Top khách hàng
                if (Array.isArray(session.danhSachHoiVien)) {
                    session.danhSachHoiVien.forEach(hv => {
                        if (hv.trangThai === 'HUY') return;
                        const name = hv.hoiVien?.hoTen || 'Học viên';
                        if (!clientMap[name]) {
                            clientMap[name] = { name, sessions: 0, revenue: 0, progress: 0, status: 'active' };
                        }
                        clientMap[name].sessions += 1;
                        clientMap[name].revenue += revenue / Math.max(attendees || 1, 1);
                    });
                }

                // Phân loại theo loại buổi
                const typeKey = session.tenBuoiTap || 'Buổi tập';
                if (!typeMap[typeKey]) {
                    typeMap[typeKey] = { type: typeKey, count: 0, revenue: 0 };
                }
                typeMap[typeKey].count += 1;
                typeMap[typeKey].revenue += revenue;
            });

            const activeClients = Object.keys(clientMap).length;

            const quickStats = {
                sessionsToday,
                sessionsChange: 0, // Có thể so sánh với kỳ trước nếu cần
                revenueWeek: totalRevenue,
                revenueChange: 0,
                activeClients,
                clientsChange: 0,
                avgRating: reviewsRes.success && reviewsRes.data?.summary
                    ? reviewsRes.data.summary.avgRating
                    : 0,
                ratingChange: 0
            };

            // ---------- PERFORMANCE ----------
            const totalSessions = sessions.length;
            const completedSessions = sessions.filter(s => s.trangThai === 'HOAN_THANH').length;
            const cancelledSessions = sessions.filter(s => s.trangThai === 'HUY').length;

            const completionRate = totalSessions > 0
                ? (completedSessions / totalSessions) * 100
                : 0;

            const cancelRate = totalSessions > 0
                ? (cancelledSessions / totalSessions) * 100
                : 0;

            // Trung bình thời lượng buổi
            const durations = sessions
                .map(s => {
                    if (!s.gioBatDau || !s.gioKetThuc) return null;
                    const [sh, sm] = s.gioBatDau.split(':').map(Number);
                    const [eh, em] = s.gioKetThuc.split(':').map(Number);
                    return (eh * 60 + em) - (sh * 60 + sm);
                })
                .filter(v => v !== null && !Number.isNaN(v));

            const avgDuration = durations.length > 0
                ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
                : 0;

            // sessionsData cho chart
            const sessionsByDate = {};
            sessions.forEach(s => {
                if (!s.ngayTap) return;
                const d = new Date(s.ngayTap);
                const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                if (!sessionsByDate[key]) sessionsByDate[key] = 0;
                sessionsByDate[key] += 1;
            });

            const performanceData = {
                totalSessions,
                completionRate: Number(completionRate.toFixed(1)),
                avgDuration,
                cancelRate: Number(cancelRate.toFixed(1)),
                sessionsData: Object.entries(sessionsByDate).map(([date, count]) => ({
                    date,
                    sessions: count
                }))
            };

            // ---------- CLIENT MANAGEMENT ----------
            const topClients = Object.values(clientMap)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map(c => ({
                    id: c.name,
                    name: c.name,
                    sessions: c.sessions,
                    revenue: c.revenue,
                    progress: 0,
                    status: 'active'
                }));

            const clientProgress = {
                onTrack: topClients.filter(c => c.sessions >= 10).length,
                needsAttention: topClients.filter(c => c.sessions >= 5 && c.sessions < 10).length,
                atRisk: topClients.filter(c => c.sessions < 5).length
            };

            const clientManagement = {
                retentionRate: statistics?.tyLeThamGia || 0,
                topClients,
                clientProgress
            };

            // ---------- REVENUE ----------
            const revenue = {
                monthlyRevenue: totalRevenue,
                commission: totalCommission,
                commissionRate: totalRevenue > 0
                    ? Math.round((totalCommission / totalRevenue) * 100)
                    : 0,
                forecast: totalRevenue * 1.05, // dự đoán +5%
                breakdown: Object.values(typeMap)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 4)
                    .map(item => ({
                        type: item.type,
                        count: item.count,
                        revenue: item.revenue,
                        percentage: totalRevenue > 0
                            ? Math.round((item.revenue / totalRevenue) * 100)
                            : 0
                    })),
                monthlyTrend: [] // có thể bổ sung sau bằng cách gom theo tháng
            };

            // ---------- SESSION ANALYSIS ----------
            // Lấy rating distribution từ API (đã được tính phần trăm trong backend)
            const ratingDistribution = reviewsRes.success && reviewsRes.data?.summary?.ratingDistribution
                ? reviewsRes.data.summary.ratingDistribution
                : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

            console.log('[PTStatistics] Rating distribution từ API:', ratingDistribution);
            console.log('[PTStatistics] Reviews data:', {
                success: reviewsRes.success,
                hasSummary: !!reviewsRes.data?.summary,
                hasRatingDistribution: !!reviewsRes.data?.summary?.ratingDistribution,
                totalReviews: reviewsRes.data?.summary?.totalReviews || 0
            });

            const feedback = reviewsRes.success && reviewsRes.data?.reviews
                ? reviewsRes.data.reviews.slice(0, 5).map(r => ({
                    client: r.hoiVienId?.hoTen || 'Khách hàng',
                    rating: r.rating,
                    comment: r.noiDung || 'Không có nhận xét',
                    date: r.ngayTao || new Date().toISOString()
                }))
                : [];

            const sessionAnalysis = {
                byType: Object.values(typeMap).map(item => ({
                    type: item.type,
                    count: item.count,
                    percentage: totalSessions > 0
                        ? Number(((item.count / totalSessions) * 100).toFixed(1))
                        : 0
                })),
                ratingDistribution,
                feedback
            };

            // ---------- INSIGHTS ----------
            const summary = `Trong khoảng ${timeFilter === 'day' ? 'hôm nay' : timeFilter === 'week' ? '7 ngày qua' : timeFilter === 'month' ? 'tháng này' : 'năm nay'}, bạn đã có ${totalSessions} buổi tập với ${activeClients} khách hàng tham gia.`;

            const actions = [];
            if (clientProgress.atRisk > 0) {
                actions.push({
                    type: 'warning',
                    text: `${clientProgress.atRisk} khách hàng có ít buổi tập, nên chủ động liên hệ.`,
                    action: 'Liên hệ ngay'
                });
            }
            if (quickStats.avgRating > 0) {
                actions.push({
                    type: 'success',
                    text: `Điểm đánh giá trung bình ${quickStats.avgRating}/5. Hãy tiếp tục duy trì chất lượng buổi tập!`,
                    action: 'Xem đánh giá'
                });
            }
            if (!actions.length) {
                actions.push({
                    type: 'info',
                    text: 'Hãy tiếp tục theo dõi lịch làm việc và phản hồi từ học viên để tối ưu hiệu suất.',
                    action: 'Xem lịch'
                });
            }

            const insights = { summary, actions };

            const transformEndTime = performance.now();
            console.log(`[PTStatistics] Transform data hoàn thành sau: ${(transformEndTime - apiEndTime).toFixed(2)}ms`);

            setStatsData({
                quickStats,
                performance: performanceData,
                clientManagement,
                revenue,
                sessionAnalysis,
                insights
            });

            const totalTime = performance.now() - loadStartTime;
            console.log(`[PTStatistics] ===== HOÀN THÀNH LOAD STATISTICS =====`);
            console.log(`[PTStatistics] Tổng thời gian: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
            console.log('[PTStatistics] Set loading = false');

            setLoading(false);
        } catch (error) {
            const errorTime = performance.now();
            const totalTime = errorTime - loadStartTime;
            console.error(`[PTStatistics] ERROR sau ${totalTime.toFixed(2)}ms:`, error);
            console.error('[PTStatistics] Error details:', {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            });
            setLoading(false);
        }
    };

    const handleExportReport = (format) => {
        const fileNameBase = `pt-report-${timeFilter}-${new Date().toISOString().slice(0, 10)}`;

        if (format === 'excel') {
            // Xuất CSV (Excel mở được)
            const rows = [];

            rows.push(['Thống kê nhanh']);
            rows.push(['Buổi tập hôm nay', statsData.quickStats.sessionsToday]);
            rows.push(['Doanh thu', statsData.quickStats.revenueWeek]);
            rows.push(['Khách hàng đang hoạt động', statsData.quickStats.activeClients]);
            rows.push(['Đánh giá TB', statsData.quickStats.avgRating]);
            rows.push([]);

            rows.push(['Hiệu suất']);
            rows.push(['Tổng buổi', statsData.performance.totalSessions]);
            rows.push(['Tỷ lệ hoàn thành (%)', statsData.performance.completionRate]);
            rows.push(['Tỷ lệ hủy (%)', statsData.performance.cancelRate]);
            rows.push(['Thời lượng TB (phút)', statsData.performance.avgDuration]);
            rows.push([]);

            rows.push(['Khách hàng']);
            rows.push(['Tỷ lệ giữ chân (%)', statsData.clientManagement.retentionRate]);
            rows.push(['Tên', 'Số buổi', 'Doanh thu']);
            statsData.clientManagement.topClients.forEach(c => {
                rows.push([c.name, c.sessions, c.revenue]);
            });
            rows.push([]);

            rows.push(['Doanh thu']);
            rows.push(['Tổng doanh thu', statsData.revenue.monthlyRevenue]);
            rows.push(['Hoa hồng', statsData.revenue.commission]);
            rows.push(['Tỷ lệ hoa hồng (%)', statsData.revenue.commissionRate]);
            rows.push(['Loại buổi', 'Số buổi', 'Doanh thu', 'Tỷ lệ (%)']);
            statsData.revenue.breakdown.forEach(item => {
                rows.push([item.type, item.count, item.revenue, item.percentage]);
            });

            const csvContent = rows
                .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileNameBase}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            // Tạo HTML đơn giản cho báo cáo và mở hộp thoại in (Save as PDF)
            const reportWindow = window.open('', '_blank');
            if (!reportWindow) return;

            const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Báo cáo PT</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; }
  </style>
</head>
<body>
  <h1>Báo cáo PT - Thống kê & Báo cáo</h1>
  <p>Khoảng thời gian: ${timeFilter}</p>

  <h2>Thống kê nhanh</h2>
  <table>
    <tr><th>Chỉ số</th><th>Giá trị</th></tr>
    <tr><td>Buổi tập hôm nay</td><td>${statsData.quickStats.sessionsToday}</td></tr>
    <tr><td>Doanh thu</td><td>${statsData.quickStats.revenueWeek}</td></tr>
    <tr><td>Khách hàng đang hoạt động</td><td>${statsData.quickStats.activeClients}</td></tr>
    <tr><td>Đánh giá TB</td><td>${statsData.quickStats.avgRating}/5</td></tr>
  </table>

  <h2>Hiệu suất</h2>
  <table>
    <tr><th>Tổng buổi</th><th>Tỷ lệ hoàn thành (%)</th><th>Tỷ lệ hủy (%)</th><th>Thời lượng TB (phút)</th></tr>
    <tr>
      <td>${statsData.performance.totalSessions}</td>
      <td>${statsData.performance.completionRate}</td>
      <td>${statsData.performance.cancelRate}</td>
      <td>${statsData.performance.avgDuration}</td>
    </tr>
  </table>

  <h2>Top khách hàng</h2>
  <table>
    <tr><th>Tên</th><th>Số buổi</th><th>Doanh thu</th></tr>
    ${statsData.clientManagement.topClients.map(c => `
      <tr><td>${c.name}</td><td>${c.sessions}</td><td>${c.revenue}</td></tr>
    `).join('')}
  </table>

  <h2>Doanh thu theo loại buổi</h2>
  <table>
    <tr><th>Loại buổi</th><th>Số buổi</th><th>Doanh thu</th><th>Tỷ lệ (%)</th></tr>
    ${statsData.revenue.breakdown.map(item => `
      <tr><td>${item.type}</td><td>${item.count}</td><td>${item.revenue}</td><td>${item.percentage}</td></tr>
    `).join('')}
  </table>
</body>
</html>`;

            reportWindow.document.open();
            reportWindow.document.write(html);
            reportWindow.document.close();
            reportWindow.focus();

            // Mở hộp thoại in để người dùng chọn "Save as PDF"
            reportWindow.print();
        }
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
                                <div className="bg-[#141414] rounded-2xl p-6 overflow-x-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Hiệu Suất Cá Nhân</h2>
                                            <p className="text-gray-400 text-sm">Số buổi tập theo thời gian</p>
                                        </div>
                                        <LineChart className="w-6 h-6 text-[#da2128]" />
                                    </div>

                                    {/* Bar Chart */}
                                    <div className="space-y-4">
                                        {/* Thêm padding top để chứa số hiển thị */}
                                        <div className="relative h-48 flex items-end gap-2 px-2 pt-8 min-w-[480px] sm:min-w-[640px]">
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
                                    </div>                                    {/* Performance Metrics */}
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
