import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import PTProfileHeader from '../../components/pt/PTProfileHeader';
import PTStatsCard from '../../components/pt/PTStatsCard';
import PTSessionChart from '../../components/pt/PTSessionChart';
import PTStudentChart from '../../components/pt/PTStudentChart';
import PTReviewsList from '../../components/pt/PTReviewsList';
import PTUpcomingSessions from '../../components/pt/PTUpcomingSessions';
import { Users, Calendar, Star, TrendingUp, CheckCircle, UserCheck } from 'lucide-react';
import ptService from '../../services/pt.service';
import chatService from '../../services/chat.service';

const PTProfile = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [profile, setProfile] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [studentStats, setStudentStats] = useState([]);
    const [sessionStats, setSessionStats] = useState(null);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);

        // Connect to WebSocket for real-time PT status updates
        chatService.connect();

        // Listen for PT status changes (for current PT's profile)
        const handlePTStatusChanged = ({ ptId, isOnline }) => {
            console.log('[PTProfile] PT status changed:', ptId, isOnline);
            if (profile && profile._id === ptId) {
                setProfile(prev => ({ ...prev, isOnline }));
            }
        };

        chatService.on('pt-status-changed', handlePTStatusChanged);

        return () => {
            window.removeEventListener('sidebar:toggle', handleSidebarToggle);
            chatService.off('pt-status-changed', handlePTStatusChanged);
        };
    }, [profile]);

    useEffect(() => {
        loadAllData();
    }, [period]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadProfile(),
                loadStatistics(),
                loadStudentStats(),
                loadSessionStats(),
                loadDashboard(),
                loadReviews()
            ]);
        } catch (error) {
            console.error('Error loading PT profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async () => {
        try {
            const response = await ptService.getProfile();
            if (response.success) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const loadStatistics = async () => {
        try {
            const response = await ptService.getStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    };

    const loadStudentStats = async () => {
        try {
            const response = await ptService.getStudentStatistics({ period });
            if (response.success) {
                // Format dates for chart
                const formatted = response.data.map(item => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit'
                    })
                }));
                setStudentStats(formatted);
            }
        } catch (error) {
            console.error('Error loading student stats:', error);
        }
    };

    const loadSessionStats = async () => {
        try {
            const response = await ptService.getSessionStatistics({ period });
            if (response.success) {
                setSessionStats(response.data);
            }
        } catch (error) {
            console.error('Error loading session stats:', error);
        }
    };

    const loadDashboard = async () => {
        try {
            const response = await ptService.getDashboard();
            if (response.success && response.data.lichSapToi) {
                setUpcomingSessions(response.data.lichSapToi);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const loadReviews = async () => {
        try {
            const response = await ptService.getReviews({ limit: 5 });
            if (response.success && response.data.reviews) {
                setReviews(response.data.reviews);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    };

    const sidebarWidth = sidebarCollapsed ? 80 : 320;
    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Hồ sơ cá nhân</h2>

                    {/* Profile Header */}
                    <PTProfileHeader profile={profile} />

                    {/* Period Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod('week')}
                            className={`px-4 py-2 rounded-lg transition-all ${period === 'week'
                                ? 'bg-[#da2128] text-white'
                                : 'bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#da2128]'
                                }`}
                        >
                            7 ngày
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={`px-4 py-2 rounded-lg transition-all ${period === 'month'
                                ? 'bg-[#da2128] text-white'
                                : 'bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#da2128]'
                                }`}
                        >
                            30 ngày
                        </button>
                        <button
                            onClick={() => setPeriod('year')}
                            className={`px-4 py-2 rounded-lg transition-all ${period === 'year'
                                ? 'bg-[#da2128] text-white'
                                : 'bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#da2128]'
                                }`}
                        >
                            1 năm
                        </button>
                    </div>

                    {/* Statistics Cards */}
                    {statistics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <PTStatsCard
                                icon={Users}
                                label="Tổng học viên"
                                value={statistics.tongHoiVien || 0}
                                iconColor="#da2128"
                            />
                            <PTStatsCard
                                icon={Calendar}
                                label="Tổng buổi tập"
                                value={statistics.tongBuoiTap || 0}
                                subValue={`${statistics.buoiTapHoanThanh || 0} hoàn thành`}
                                iconColor="#10b981"
                            />
                            <PTStatsCard
                                icon={UserCheck}
                                label="Tỷ lệ tham gia"
                                value={`${statistics.tyLeThamGia || 0}%`}
                                subValue={`${statistics.tongHoiVienThamGia || 0} / ${statistics.tongHoiVienThamGia + statistics.tongHoiVienVangMat || 0}`}
                                iconColor="#3b82f6"
                            />
                            <PTStatsCard
                                icon={Star}
                                label="Đánh giá"
                                value={statistics.ratingTrungBinh || 0}
                                subValue={`${statistics.tongReview || 0} đánh giá`}
                                iconColor="#f59e0b"
                            />
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PTStudentChart data={studentStats} title="Số học viên theo thời gian" />
                        <PTSessionChart
                            data={studentStats}
                            title="Số buổi tập theo thời gian"
                        />
                    </div>

                    {/* Reviews and Upcoming Sessions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PTReviewsList reviews={reviews} loading={loading} />
                        <PTUpcomingSessions sessions={upcomingSessions} loading={loading} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PTProfile;
