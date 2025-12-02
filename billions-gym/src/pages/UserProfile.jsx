import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Dumbbell,
    Ruler,
    Activity,
    Target,
    Scale
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { StatsCard } from '../components/profile/StatsCard';
import { CurrentMembership } from '../components/profile/CurrentMembership';
import { PaymentHistory } from '../components/profile/PaymentHistory';
import { WeightChart } from '../components/profile/WeightChart';
import { CalorieChart } from '../components/profile/CalorieChart';
import { AchievementBadges } from '../components/profile/AchievementBadges';
import { NutritionOverview } from '../components/profile/NutritionOverview';
import { GoalProgress } from '../components/profile/GoalProgress';
import { ActivityTimeline } from '../components/profile/ActivityTimeline';
import { MembershipDetailModal } from '../components/profile/MembershipDetailModal';
import { RenewalModal } from '../components/profile/RenewalModal';
import { authUtils } from '../utils/auth';
import { userAPI, packageAPI, bodyMetricsAPI, paymentAPI, nutritionAPI, getApiUrl, getAuthHeaders } from '../services/api';
import './UserProfile.css';

const UserProfile = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMembershipDetail, setShowMembershipDetail] = useState(false);
    const [showRenewalModal, setShowRenewalModal] = useState(false);

    // Data states
    const [bodyMetrics, setBodyMetrics] = useState(null);
    const [bodyStats, setBodyStats] = useState(null);
    const [activePackage, setActivePackage] = useState(null);
    const [payments, setPayments] = useState([]);
    const [nutritionData, setNutritionData] = useState(null);
    const [trainer, setTrainer] = useState(null);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };

        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = authUtils.getUserId();
            if (!userId) {
                throw new Error('Người dùng chưa đăng nhập');
            }

            // Fetch all data in parallel
            const [userRes, bodyMetricsRes, bodyStatsRes, packageRes, paymentsRes, nutritionRes, nutritionWeekRes] = await Promise.allSettled([
                userAPI.getProfile(),
                bodyMetricsAPI.getMyLatest(),
                bodyMetricsAPI.getMyStats(),
                packageAPI.getActivePackage(userId),
                paymentAPI.getMyPayments(),
                nutritionAPI.getMyMeals(),
                nutritionAPI.getMyMealsWeek()
            ]);

            // Handle user data
            if (userRes.status === 'fulfilled') {
                const userData = userRes.value?.data || userRes.value;
                if (userData) {
                    setUser(userData);
                    authUtils.setUser(userData);
                }
            }

            // Handle body metrics
            if (bodyMetricsRes.status === 'fulfilled' && bodyMetricsRes.value) {
                const metrics = bodyMetricsRes.value?.data || bodyMetricsRes.value;
                setBodyMetrics(metrics);
            }

            // Handle body stats
            if (bodyStatsRes.status === 'fulfilled' && bodyStatsRes.value) {
                const stats = bodyStatsRes.value?.data || bodyStatsRes.value;
                setBodyStats(stats);
            }

            // Handle active package
            if (packageRes.status === 'fulfilled' && packageRes.value) {
                const pkg = packageRes.value?.data || packageRes.value;
                setActivePackage(pkg);

                // Get trainer from populated ptDuocChon
                if (pkg.ptDuocChon) {
                    setTrainer(pkg.ptDuocChon);
                }
            }

            // Handle payments
            if (paymentsRes.status === 'fulfilled' && paymentsRes.value) {
                const paymentData = paymentsRes.value?.data || paymentsRes.value;
                setPayments(Array.isArray(paymentData) ? paymentData : []);
            }

            // Handle nutrition data
            if (nutritionRes.status === 'fulfilled' && nutritionRes.value) {
                const nutrition = nutritionRes.value?.data || nutritionRes.value;
                // Merge with weekly data if available
                if (nutritionWeekRes.status === 'fulfilled' && nutritionWeekRes.value) {
                    const weekData = nutritionWeekRes.value?.data || nutritionWeekRes.value;
                    setNutritionData({
                        ...nutrition,
                        weeklyData: Array.isArray(weekData) ? weekData : []
                    });
                } else {
                    setNutritionData(nutrition);
                }
            } else if (nutritionWeekRes.status === 'fulfilled' && nutritionWeekRes.value) {
                // Fallback to weekly data only
                const weekData = nutritionWeekRes.value?.data || nutritionWeekRes.value;
                setNutritionData({
                    weeklyData: Array.isArray(weekData) ? weekData : []
                });
            }

            // Fetch recommended calories if available (for target values)
            try {
                const recCaloriesRes = await nutritionAPI.getRecommendedCalories();
                if (recCaloriesRes && recCaloriesRes.data && recCaloriesRes.data.calories) {
                    const targetCalories = recCaloriesRes.data.calories;
                    // Calculate macros from calories using standard ratios (45% carbs, 25% protein, 30% fat)
                    const targetCarbs = Math.round((targetCalories * 0.45) / 4); // 4 calories per gram
                    const targetProtein = Math.round((targetCalories * 0.25) / 4); // 4 calories per gram
                    const targetFat = Math.round((targetCalories * 0.30) / 9); // 9 calories per gram

                    setNutritionData(prev => ({
                        ...prev,
                        targetCalories,
                        targetCarbs,
                        targetProtein,
                        targetFat
                    }));
                }
            } catch (err) {
                console.debug('Could not fetch recommended calories:', err);
            }

            // Fallback to stored user if API fails
            if (!user && userRes.status === 'rejected') {
                const storedUser = authUtils.getUser();
                if (storedUser) {
                    setUser(storedUser);
                } else {
                    throw new Error('Không tìm thấy thông tin người dùng');
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');

            const storedUser = authUtils.getUser();
            if (storedUser) {
                setUser(storedUser);
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`user-profile-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                    <div className="profile-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải thông tin hồ sơ...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error && !user) {
        return (
            <>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`user-profile-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                    <div className="profile-error">
                        <div className="error-icon">⚠️</div>
                        <p>{error}</p>
                        <button onClick={fetchUserProfile} className="btn-retry">
                            Thử lại
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`user-profile-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Profile Header */}
                    <div className="mb-8">
                        <ProfileHeader
                            name={user?.hoTen || user?.tenHoiVien || "Nguyễn Văn Minh"}
                            email={user?.email || "minhnguyenfit@gmail.com"}
                            memberSince={user?.ngayThamGia || "15/03/2024"}
                            imageUrl={user?.anhDaiDien || "https://images.unsplash.com/photo-1650253915390-a3486c5f2a97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwcHJvZmlsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzU0MDQ3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"}
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 ${bodyMetrics?.tyLeMoCoThe || bodyMetrics?.tyLeCoBap ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 mb-8`}>
                        <StatsCard
                            title="Cân nặng hiện tại"
                            value={bodyMetrics?.canNang ? bodyMetrics.canNang.toString() : bodyStats?.chiSoHienTai?.canNang?.toString() || user?.canNang?.toString() || '--'}
                            unit="kg"
                            icon={Scale}
                            trend={(() => {
                                if (bodyStats?.xuHuongThayDoi?.canNang) {
                                    const change = bodyStats.xuHuongThayDoi.canNang;
                                    return `${Math.abs(change).toFixed(1)}kg`;
                                }
                                return null;
                            })()}
                            trendUp={bodyStats?.xuHuongThayDoi?.canNang ? bodyStats.xuHuongThayDoi.canNang > 0 : false}
                            gradient="from-[#da2128] to-[#9b1c1f]"
                        />
                        <StatsCard
                            title="Chiều cao"
                            value={bodyMetrics?.chieuCao ? bodyMetrics.chieuCao.toString() : bodyStats?.chiSoHienTai?.chieuCao?.toString() || user?.chieuCao?.toString() || '--'}
                            unit="cm"
                            icon={Ruler}
                            gradient="from-blue-500 to-blue-700"
                        />
                        <StatsCard
                            title="BMI"
                            value={(() => {
                                if (bodyMetrics?.bmi) {
                                    return bodyMetrics.bmi.toFixed(1);
                                }
                                if (bodyStats?.chiSoHienTai?.bmi) {
                                    return bodyStats.chiSoHienTai.bmi.toFixed(1);
                                }
                                if (bodyMetrics?.canNang && bodyMetrics?.chieuCao) {
                                    const heightInM = bodyMetrics.chieuCao / 100;
                                    const bmi = bodyMetrics.canNang / (heightInM * heightInM);
                                    return bmi.toFixed(1);
                                }
                                if (user?.canNang && user?.chieuCao) {
                                    const heightInM = user.chieuCao / 100;
                                    const bmi = user.canNang / (heightInM * heightInM);
                                    return bmi.toFixed(1);
                                }
                                return '--';
                            })()}
                            unit=""
                            icon={Activity}
                            trend={(() => {
                                if (bodyStats?.xuHuongThayDoi?.bmi) {
                                    return Math.abs(bodyStats.xuHuongThayDoi.bmi).toFixed(1);
                                }
                                return null;
                            })()}
                            trendUp={bodyStats?.xuHuongThayDoi?.bmi ? bodyStats.xuHuongThayDoi.bmi > 0 : false}
                            gradient="from-green-500 to-green-700"
                        />
                        {bodyMetrics?.tyLeMoCoThe && (
                            <StatsCard
                                title="Tỷ lệ mỡ cơ thể"
                                value={bodyMetrics.tyLeMoCoThe.toFixed(1)}
                                unit="%"
                                icon={Activity}
                                gradient="from-orange-500 to-orange-700"
                            />
                        )}
                        {bodyMetrics?.tyLeCoBap && (
                            <StatsCard
                                title="Tỷ lệ cơ bắp"
                                value={bodyMetrics.tyLeCoBap.toFixed(1)}
                                unit="%"
                                icon={Dumbbell}
                                gradient="from-purple-500 to-purple-700"
                            />
                        )}
                        <StatsCard
                            title="Mục tiêu"
                            value={bodyMetrics?.mucTieuCanNang ? bodyMetrics.mucTieuCanNang.toString() : bodyStats?.chiSoHienTai?.mucTieuCanNang?.toString() || user?.mucTieuCanNang?.toString() || '--'}
                            unit="kg"
                            icon={Target}
                            gradient="from-indigo-500 to-indigo-700"
                        />
                    </div>

                    {/* Main Grid - 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Left Column - Wider */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Membership & Payment */}
                            <CurrentMembership
                                activePackage={activePackage}
                                onViewDetails={() => setShowMembershipDetail(true)}
                                onRenew={() => setShowRenewalModal(true)}
                            />
                            <PaymentHistory payments={payments} />

                            {/* Charts */}
                            <WeightChart bodyStats={bodyStats} bodyMetrics={bodyMetrics} />
                            <CalorieChart nutritionData={nutritionData} />
                            <AchievementBadges />
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            <NutritionOverview nutritionData={nutritionData} />
                            <GoalProgress bodyMetrics={bodyMetrics} />
                            <ActivityTimeline />
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 pt-8 border-t border-zinc-800">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={trainer?.anhDaiDien || "https://images.unsplash.com/photo-1650253915390-a3486c5f2a97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwcHJvZmlsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzU0MDQ3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"}
                                    alt="Trainer"
                                    className="w-12 h-12 rounded-xl object-cover"
                                />
                                <div>
                                    <p className="text-white text-sm">
                                        Huấn luyện viên của bạn
                                    </p>
                                    <p className="text-zinc-400 text-sm">
                                        {trainer ? `PT. ${trainer.hoTen || trainer.tenPT || 'Chưa có thông tin'}` : 'Chưa có huấn luyện viên'}
                                    </p>
                                </div>
                            </div>

                            <button className="bg-[#da2128] hover:bg-[#b81d23] px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-[#da2128]/50">
                                <User size={18} />
                                <span>Liên hệ huấn luyện viên</span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Modals */}
                <MembershipDetailModal
                    isOpen={showMembershipDetail}
                    onClose={() => setShowMembershipDetail(false)}
                />
                <RenewalModal
                    isOpen={showRenewalModal}
                    onClose={() => setShowRenewalModal(false)}
                />
            </div>
        </>
    );
};

export default UserProfile;
