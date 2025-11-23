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
import { userAPI } from '../services/api';
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

            const res = await userAPI.getProfile();
            const userData = res && res.data ? res.data : res;

            if (userData) {
                setUser(userData);
                authUtils.setUser(userData);
            } else {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            title="Cân nặng hiện tại"
                            value="78"
                            unit="kg"
                            icon={Scale}
                            trend="2.5kg"
                            trendUp={false}
                            gradient="from-[#da2128] to-[#9b1c1f]"
                        />
                        <StatsCard
                            title="Chiều cao"
                            value="175"
                            unit="cm"
                            icon={Ruler}
                            gradient="from-blue-500 to-blue-700"
                        />
                        <StatsCard
                            title="BMI"
                            value="25.5"
                            unit=""
                            icon={Activity}
                            trend="0.8"
                            trendUp={false}
                            gradient="from-green-500 to-green-700"
                        />
                        <StatsCard
                            title="Mục tiêu"
                            value="75"
                            unit="kg"
                            icon={Target}
                            gradient="from-purple-500 to-purple-700"
                        />
                    </div>

                    {/* Main Grid - 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Left Column - Wider */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Membership & Payment */}
                            <CurrentMembership
                                onViewDetails={() => setShowMembershipDetail(true)}
                                onRenew={() => setShowRenewalModal(true)}
                            />
                            <PaymentHistory />

                            {/* Charts */}
                            <WeightChart />
                            <CalorieChart />
                            <AchievementBadges />
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            <NutritionOverview />
                            <GoalProgress />
                            <ActivityTimeline />
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 pt-8 border-t border-zinc-800">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src="https://images.unsplash.com/photo-1650253915390-a3486c5f2a97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwcHJvZmlsZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MzU0MDQ3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                    alt="Trainer"
                                    className="w-12 h-12 rounded-xl object-cover"
                                />
                                <div>
                                    <p className="text-white text-sm">
                                        Huấn luyện viên của bạn
                                    </p>
                                    <p className="text-zinc-400 text-sm">
                                        PT. Trần Văn Cường
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
