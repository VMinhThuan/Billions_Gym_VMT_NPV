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
import { userAPI, packageAPI, bodyMetricsAPI, paymentAPI, nutritionAPI, workoutAPI, getApiUrl, getAuthHeaders } from '../services/api';
import './UserProfile.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getAgeFromDate = (dob) => {
    if (!dob) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;
    const diff = Date.now() - date.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const calculateRecommendedCaloriesLocal = (userData = {}, metricsData = {}, goalText = '') => {
    const weight = metricsData?.canNang || userData?.canNang || 65;
    const height = metricsData?.chieuCao || userData?.chieuCao || 170;
    const gender = (metricsData?.gioiTinh || userData?.gioiTinh || 'nam').toLowerCase();
    const age = getAgeFromDate(userData?.ngaySinh) || 30;

    let calories = 10 * weight + 6.25 * height - 5 * age + (gender === 'nu' ? -161 : 5);
    calories = Number.isFinite(calories) ? calories * 1.45 : 2000;

    const goal = (goalText || metricsData?.mucTieuTapLuyen || userData?.mucTieu || '').toLowerCase();
    if (goal.includes('giảm') || goal.includes('giam') || goal.includes('lean') || goal.includes('cut')) {
        calories *= 0.85;
    } else if (goal.includes('tăng') || goal.includes('tang') || goal.includes('build') || goal.includes('bulk') || goal.includes('cơ')) {
        calories *= 1.1;
    }

    return clamp(Math.round(calories), 1200, 4500);
};

const normalizeWeeklyNutritionData = (weekPayload) => {
    if (!weekPayload) return [];
    const payload = weekPayload?.data && weekPayload.data.days ? weekPayload.data : weekPayload;
    const rawDays = payload?.days || [];

    const entries = Array.isArray(rawDays)
        ? rawDays
        : typeof rawDays === 'object'
            ? Object.values(rawDays)
            : [];

    return entries
        .map((day) => {
            const dateValue = day?.date || day?._normalizedDate || day?.day || null;
            const meals = day?.meals || {
                buaSang: [],
                phu1: [],
                buaTrua: [],
                phu2: [],
                buaToi: [],
                phu3: []
            };
            const totalNutrition = day?.totalNutrition || {
                calories: 0,
                carbs: 0,
                protein: 0,
                fat: 0
            };

            return {
                ...day,
                date: dateValue,
                meals,
                totalNutrition
            };
        })
        .sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        });
};

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
    const [recentActivities, setRecentActivities] = useState([]);

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
            const [userRes, bodyMetricsRes, bodyStatsRes, packageRes, paymentsRes, nutritionRes, nutritionWeekRes, workoutsRes] = await Promise.allSettled([
                userAPI.getProfile(),
                bodyMetricsAPI.getMyLatest(),
                bodyMetricsAPI.getMyStats(),
                packageAPI.getActivePackage(userId),
                paymentAPI.getMyPayments(),
                nutritionAPI.getMyMeals(),
                nutritionAPI.getMyMealsWeek(),
                workoutAPI.getWorkoutSessions(userId, 'DA_THAM_GIA')
            ]);

            let resolvedUser = authUtils.getUser() || null;
            let resolvedMetrics = null;
            let resolvedBodyStats = null;
            let resolvedActivePackage = null;
            let combinedNutritionData = null;
            let recentWorkouts = [];

            // Handle user data
            if (userRes.status === 'fulfilled') {
                const userData = userRes.value?.data || userRes.value;
                if (userData) {
                    setUser(userData);
                    authUtils.setUser(userData);
                    resolvedUser = userData;
                }
            }

            // Handle body metrics
            if (bodyMetricsRes.status === 'fulfilled' && bodyMetricsRes.value) {
                const metrics = bodyMetricsRes.value?.data || bodyMetricsRes.value;
                setBodyMetrics(metrics);
                resolvedMetrics = metrics;
            }

            // Handle body stats
            if (bodyStatsRes.status === 'fulfilled' && bodyStatsRes.value) {
                const stats = bodyStatsRes.value?.data || bodyStatsRes.value;
                setBodyStats(stats);
                resolvedBodyStats = stats;
            }

            // Handle active package
            if (packageRes.status === 'fulfilled' && packageRes.value) {
                const pkg = packageRes.value?.data || packageRes.value;
                setActivePackage(pkg);
                resolvedActivePackage = pkg;

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

            // Prepare nutrition data (merge base + weekly + targets)
            if (nutritionRes.status === 'fulfilled' && nutritionRes.value) {
                const nutrition = nutritionRes.value?.data || nutritionRes.value;
                if (nutrition && typeof nutrition === 'object') {
                    combinedNutritionData = { ...nutrition };
                }
            }

            let normalizedWeeklyData = [];
            if (nutritionWeekRes.status === 'fulfilled' && nutritionWeekRes.value) {
                const weekPayload = nutritionWeekRes.value?.data || nutritionWeekRes.value;
                normalizedWeeklyData = normalizeWeeklyNutritionData(weekPayload);
            }

            if (normalizedWeeklyData.length) {
                combinedNutritionData = combinedNutritionData
                    ? { ...combinedNutritionData, weeklyData: normalizedWeeklyData }
                    : { weeklyData: normalizedWeeklyData };
            }

            let targetCalories = null;
            try {
                const recCaloriesRes = await nutritionAPI.getRecommendedCalories();
                targetCalories = recCaloriesRes?.data?.calories || recCaloriesRes?.calories || null;
            } catch (err) {
                console.debug('Could not fetch recommended calories:', err);
            }

            if (!targetCalories) {
                targetCalories = calculateRecommendedCaloriesLocal(
                    resolvedUser,
                    resolvedMetrics,
                    resolvedActivePackage?.mucTieu || resolvedUser?.mucTieu || ''
                );
            }

            if (targetCalories) {
                const targetCarbs = Math.round((targetCalories * 0.45) / 4);
                const targetProtein = Math.round((targetCalories * 0.25) / 4);
                const targetFat = Math.round((targetCalories * 0.30) / 9);
                combinedNutritionData = combinedNutritionData
                    ? {
                        ...combinedNutritionData,
                        targetCalories,
                        targetCarbs,
                        targetProtein,
                        targetFat
                    }
                    : {
                        targetCalories,
                        targetCarbs,
                        targetProtein,
                        targetFat
                    };
            }

            if (combinedNutritionData) {
                setNutritionData(combinedNutritionData);
            } else {
                setNutritionData(null);
            }

            // Handle workouts for recent activities
            if (workoutsRes.status === 'fulfilled' && workoutsRes.value) {
                const workoutsRaw = workoutsRes.value?.data || workoutsRes.value;
                if (Array.isArray(workoutsRaw)) {
                    recentWorkouts = workoutsRaw;
                }
            }

            // Build recent activities timeline from workouts + meals (today)
            const activityItems = [];

            // From workouts
            if (Array.isArray(recentWorkouts)) {
                recentWorkouts.slice(0, 5).forEach((w) => {
                    const title = w.tenBuoiTap || 'Buổi tập';
                    const branchName = w.chiNhanh?.tenChiNhanh || w.chiNhanh?.ten || '';
                    const startTime = w.gioBatDau || '';
                    const endTime = w.gioKetThuc || '';
                    const durationMinutes = (() => {
                        if (!startTime || !endTime) return null;
                        try {
                            const [sh, sm] = startTime.split(':').map(Number);
                            const [eh, em] = endTime.split(':').map(Number);
                            return (eh * 60 + em) - (sh * 60 + sm);
                        } catch {
                            return null;
                        }
                    })();

                    const descriptionParts = [];
                    if (durationMinutes && durationMinutes > 0) {
                        descriptionParts.push(`${durationMinutes} phút`);
                    }
                    if (branchName) {
                        descriptionParts.push(`Tại ${branchName}`);
                    }

                    const description = descriptionParts.join(' • ') || 'Buổi tập cá nhân';
                    const dateValue = w.ngayTap || w.createdAt || w.updatedAt;
                    const timestamp = dateValue ? new Date(dateValue).getTime() : Date.now();

                    activityItems.push({
                        type: 'workout',
                        title,
                        description,
                        timestamp
                    });
                });
            }

            // From today's meals
            if (combinedNutritionData?.meals) {
                const mealTypes = ['buaSang', 'phu1', 'buaTrua', 'phu2', 'buaToi', 'phu3'];
                const mealLabels = {
                    buaSang: 'Bữa sáng',
                    phu1: 'Phụ 1',
                    buaTrua: 'Bữa trưa',
                    phu2: 'Phụ 2',
                    buaToi: 'Bữa tối',
                    phu3: 'Phụ 3'
                };

                mealTypes.forEach((mealType) => {
                    const list = Array.isArray(combinedNutritionData.meals[mealType])
                        ? combinedNutritionData.meals[mealType]
                        : [];
                    if (!list.length) return;

                    const lastMeal = list[list.length - 1];
                    const meal = lastMeal?.meal || {};
                    const name = meal.name || `${mealLabels[mealType]} • Món ăn`;
                    const nutrition = meal.nutrition || {};
                    const calories = nutrition.caloriesKcal || meal.calories || 0;
                    const protein = nutrition.proteinGrams || meal.protein || 0;

                    const parts = [];
                    if (calories) parts.push(`${Math.round(calories)} kcal`);
                    if (protein) parts.push(`${Math.round(protein)}g protein`);

                    const description = parts.join(' • ') || 'Bữa ăn theo kế hoạch';
                    const dateValue = combinedNutritionData.date || new Date();
                    const timestamp = new Date(dateValue).getTime();

                    activityItems.push({
                        type: 'meal',
                        title: `${mealLabels[mealType]} - ${name}`,
                        description,
                        timestamp
                    });
                });
            }

            // Sort by time desc và giới hạn 8 hoạt động
            if (activityItems.length) {
                const sorted = activityItems
                    .filter(item => Number.isFinite(item.timestamp))
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 8)
                    .map(item => {
                        const timeDiffMs = Date.now() - item.timestamp;
                        const minutes = Math.floor(timeDiffMs / (1000 * 60));
                        const hours = Math.floor(minutes / 60);
                        const days = Math.floor(hours / 24);

                        let timeLabel = 'Vừa xong';
                        if (minutes >= 0 && minutes < 60) {
                            timeLabel = `${minutes || 1} phút trước`;
                        } else if (hours < 24) {
                            timeLabel = `${hours} giờ trước`;
                        } else if (days < 7) {
                            timeLabel = `${days} ngày trước`;
                        } else {
                            timeLabel = new Date(item.timestamp).toLocaleDateString('vi-VN');
                        }

                        return {
                            ...item,
                            time: timeLabel
                        };
                    });

                setRecentActivities(sorted);
            } else {
                setRecentActivities([]);
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
                            memberRank={user?.hangHoiVien}
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
                            <ActivityTimeline activities={recentActivities} />
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
