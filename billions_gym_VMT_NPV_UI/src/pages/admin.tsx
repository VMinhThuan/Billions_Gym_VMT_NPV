import React from 'react';
import ReactDOM from 'react-dom';
import './admin.css';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import EntityForm, { ConfirmModal } from '../components/EntityForm';
import SortableHeader from '../components/SortableHeader';
import Dashboard from '../components/Dashboard';
import AdvancedDashboard from '../components/AdvancedDashboard';
import { api, auth } from '../services/api';
import { geminiAI, AIWorkoutSuggestion, AINutritionSuggestion } from '../services/gemini';
import { useCrudNotifications } from '../hooks/useNotification';
import PackageWorkflowManager from '../components/PackageWorkflow/PackageWorkflowManager';
import TrainerAvailabilityManager from '../components/PackageWorkflow/TrainerAvailabilityManager';
import PackageRegistrationManager from '../components/PackageRegistrationManager';
import '../components/PackageRegistrationManager.css';
import StatisticsPage from './StatisticsPage';
import MealManager from '../components/Nutrition/MealManager';
import MemberMealPlanManager from '../components/Nutrition/MemberMealPlanManager';

type Stat = { label: string; value: string; trend?: 'up' | 'down'; sub?: string };

type SectionKey = 'overview' | 'members' | 'pt' | 'packages' | 'schedules' | 'sessions' | 'exercises' | 'body_metrics' | 'nutrition' | 'payments' | 'notifications' | 'feedback' | 'reports' | 'ai_suggestions' | 'appointments' | 'package_workflow' | 'trainer_availability' | 'package_registrations' | 'templates' | 'statistics';

interface HoiVien {
    _id: string;
    soCCCD: string;
    hoTen: string;
    ngaySinh: Date;
    diaChi: string;
    gioiTinh: 'Nam' | 'Nữ';
    anhDaiDien?: string;
    email: string;
    sdt: string;
    ngayThamGia: Date;
    ngayHetHan: Date;
    trangThaiHoiVien: 'DANG_HOAT_DONG' | 'TAM_NGUNG' | 'HET_HAN';
    cacChiSoCoThe: string[];
    soTienTichLuy?: number;
    soBuoiTapDaTap?: number;
    maChiNhanh?: string; // Chi nhánh hội viên thuộc về
    hangHoiVien?: {
        _id?: string;
        tenHienThi?: string;
        tenHang?: string;
        mauSac?: string;
    };
    taiKhoan?: {
        _id?: string | null;
        trangThaiTK: 'DANG_HOAT_DONG' | 'DA_KHOA';
    };
}

interface ChiNhanh {
    _id: string;
    tenChiNhanh: string;
    diaChi: string;
    soDienThoai?: string;
    moTa?: string;
    dichVu?: string[];
    hinhAnh?: string;
    location?: {
        type: string;
        coordinates: number[];
    };
    thuTu: number;
    createdAt: Date;
    updatedAt: Date;
}

interface PT {
    _id: string;
    soCCCD: string;
    hoTen: string;
    ngaySinh: Date;
    diaChi: string;
    gioiTinh: 'Nam' | 'Nữ';
    anhDaiDien?: string;
    email: string;
    sdt: string;
    kinhNghiem: number;
    bangCapChungChi: string;
    chuyenMon: string;
    danhGia?: number;
    moTa: string;
    ngayVaoLam: Date;
    trangThaiPT: 'DANG_HOAT_DONG' | 'NGUNG_LAM_VIEC';
    chinhanh: string; // ObjectId của chi nhánh
    taiKhoan?: {
        _id?: string | null;
        trangThaiTK: 'DANG_HOAT_DONG' | 'DA_KHOA';
    };
}

interface GoiTap {
    _id: string;
    tenGoiTap: string;
    moTa: string;
    donGia: number;
    thoiHan: number;
    donViThoiHan: 'Ngày' | 'Tháng' | 'Năm';
    loaiThoiHan: 'VinhVien' | 'TinhTheoNgay';
    soLuongNguoiThamGia: number;
    loaiGoiTap: 'CaNhan' | 'Nhom' | 'CongTy';
    giaGoc?: number;
    popular?: boolean;
    hinhAnhDaiDien?: string;
    kichHoat: boolean;
    ghiChu?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface LichTap {
    _id: string;
    hoiVien: string;
    pt: string;
    ngayBatDau: Date;
    ngayKetThuc: Date;
    cacBuoiTap: string[];
    createdAt: Date;
    updatedAt: Date;
}

interface BuoiTap {
    _id: string;
    tenBuoiTap?: string;
    chiNhanh?: string | { _id?: string; tenChiNhanh?: string; };
    ptPhuTrach?: string | { _id?: string; hoTen?: string; sdt?: string; chuyenMon?: string; };
    ngayTap: Date | string;
    gioBatDau?: string;
    gioKetThuc?: string;
    cacBaiTap?: Array<{
        _id?: string;
        baiTap?: string | { _id?: string; tenBaiTap?: string; };
        soLanLap?: number;
        soSet?: number;
    }>;
    trangThai?: 'CHUAN_BI' | 'DANG_DIEN_RA' | 'HOAN_THANH' | 'HUY';
    trangThaiTap?: 'DA_HOAN_THANH' | 'CHUA_HOAN_THANH';
    soLuongToiDa?: number;
    soLuongHienTai?: number;
    danhSachHoiVien?: Array<{
        hoiVien?: string | { _id?: string; hoTen?: string; };
        trangThai?: string;
    }>;
    moTa?: string;
    ghiChu?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

interface BaiTap {
    _id: string;
    tenBaiTap?: string;
    title?: string;
    moTa?: string;
    description?: string;
    hinhAnh?: string;
    videoHuongDan?: string;
    source_url?: string;
    nhomCo?: string;
    hinhAnhMinhHoa?: string[];
    mucDoKho?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    thietBiSuDung?: string;
    soHiepvaSoLanLap?: number;
    mucTieuBaiTap?: string;
    duration_sec?: number;
    thoiGian?: number;
    kcal?: number;
    type?: 'video_file' | 'doc_file' | 'external_link';
    status?: 'active' | 'inactive';
    ratings?: {
        averageRating: number;
        totalRatings: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

interface TemplateBuoiTap {
    _id: string;
    ten: string;
    moTa?: string;
    loai?: string;
    doKho?: 'DE' | 'TRUNG_BINH' | 'KHO';
    hinhAnh?: string;
    baiTap?: BaiTap[] | string[]; // Array of exercise IDs or populated exercises
    createdAt?: Date;
    updatedAt?: Date;
}

interface ChiSoCoThe {
    _id: string;
    hoiVien: string;
    chieuCao: number;
    canNang: number;
    bmi: number;
    nhipTim: number;
    ngayDo: Date;
}

interface ThanhToan {
    _id: string;
    hoiVien: string;
    soTien: number;
    ngayThanhToan: Date;
    noiDung: string;
    phuongThuc: 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE_TIN_DUNG';
    createdAt: Date;
    updatedAt: Date;
}

interface ThongBao {
    _id: string;
    tieuDe: string;
    hinhAnhBanner?: string;
    noiDung: string;
    thoiGianGui: Date;
    trangThaiThongBao: 'DA_GUI' | 'CHUA_GUI';
    createdAt: Date;
    updatedAt: Date;
}

interface Feedback {
    _id: string;
    nguoiGui: string;
    noiDung: string;
    danhGia: number;
    hinhAnh: string[];
    ngayGui: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface DinhDuong {
    _id: string;
    hoiVien: string;
    ngayGoiY: Date;
    buaAn: string;
    luongCalo: number;
    createdAt: Date;
    updatedAt: Date;
}

interface LichHenPT {
    _id: string;
    hoiVien: string;
    pt: string;
    ngayHen: Date;
    gioHen: string;
    trangThaiLichHen: 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DA_HUY' | 'HOAN_THANH';
    ghiChu?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface GoiYTuAI {
    _id: string;
    hoiVien: string;
    ngayGoiY: Date;
    noiDung: string;
    mucTieu: string;
    doKho: 'DE' | 'TRUNG_BINH' | 'KHO';
    thoiGianTap: number;
    createdAt: Date;
    updatedAt: Date;
}

function getSectionFromHash(): SectionKey {
    const hash = (window.location.hash || '').replace('#', '');
    const path = hash.startsWith('/admin') ? hash.replace('/admin', '') : window.location.pathname.replace('/admin', '');
    const seg = path.split('/').filter(Boolean)[0] as SectionKey | undefined;
    return (seg || 'overview') as SectionKey;
}

type __EnsureTypesUsed =
    | GoiTap
    | LichTap
    | BuoiTap
    | BaiTap
    | ChiSoCoThe
    | Feedback
    | DinhDuong
    | ThanhToan
    | ThongBao
    | LichHenPT
    | GoiYTuAI;

// Custom Rating Component
interface RatingProps {
    rating: number;
    maxRating?: number;
    readonly?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const Rating: React.FC<RatingProps> = ({
    rating,
    maxRating = 5,
    readonly = true,
    size = 'medium'
}) => {
    const sizeClasses = {
        small: 'rating-small',
        medium: 'rating-medium',
        large: 'rating-large'
    };

    return (
        <div className={`rating-component ${sizeClasses[size]}`}>
            {Array.from({ length: maxRating }, (_, index) => {
                const starValue = index + 1;
                const isFull = starValue <= Math.floor(rating);
                const isHalf = starValue === Math.ceil(rating) && rating % 1 !== 0;

                return (
                    <span
                        key={index}
                        className={`star ${isFull ? 'star-full' : isHalf ? 'star-half' : 'star-empty'}`}
                    >
                        ★
                    </span>
                );
            })}
        </div>
    );
};

const AdminDashboard = () => {
    const [section, setSection] = useState<SectionKey>(getSectionFromHash());
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<Stat[]>([]);
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [topPTs, setTopPTs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('admin-theme');
        return saved ? saved === 'dark' : false; // Default to light mode (TailAdmin style)
    });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const notifications = useCrudNotifications();

    // Theme toggle effect
    useEffect(() => {
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        notifications.generic.success(`Đã chuyển sang chế độ ${!isDarkMode ? 'tối' : 'sáng'}!`);
    };

    // Fetch overview data from backend
    useEffect(() => {
        const fetchOverviewData = async () => {
            if (section !== 'overview') return;

            setIsLoading(true);
            try {
                // Fetch all data in parallel - using available backend endpoints
                const [membersRes, ptsRes, packagesRes] = await Promise.all([
                    api.get('/api/user/hoivien'),
                    api.get('/api/user/pt'),
                    api.get('/api/goitap')
                ]);

                // These endpoints don't exist in backend yet, so we'll use empty arrays
                const appointmentsRes: any[] = [];
                const paymentsRes: any[] = [];

                const members = membersRes || [];
                const pts = ptsRes || [];
                const packages = packagesRes || [];
                const appointments = appointmentsRes || [];
                const payments = paymentsRes || [];

                // Calculate statistics
                const activeMembers = members.filter((m: any) => m.trangThaiHoiVien === 'DANG_HOAT_DONG').length;
                const activePTs = pts.filter((p: any) => p.trangThaiPT === 'DANG_HOAT_DONG').length;
                const todayAppointments = appointments.filter((a: any) => {
                    const today = new Date().toDateString();
                    return new Date(a.ngayHen).toDateString() === today;
                }).length;

                const monthlyRevenue = payments.reduce((sum: number, p: any) => {
                    const paymentDate = new Date(p.ngayThanhToan);
                    const currentMonth = new Date().getMonth();
                    if (paymentDate.getMonth() === currentMonth) {
                        return sum + (p.soTien || 0);
                    }
                    return sum;
                }, 0);

                setStats([
                    { label: 'Tổng hội viên', value: members.length.toString(), trend: 'up', sub: `${activeMembers} đang hoạt động` },
                    { label: 'Hội viên hoạt động', value: activeMembers.toString(), trend: 'up', sub: `${members.length - activeMembers} tạm ngưng` },
                    { label: 'PT đang làm việc', value: activePTs.toString(), sub: `${pts.length} tổng PT` },
                    { label: 'Doanh thu tháng', value: `${(monthlyRevenue / 1000000).toFixed(1)}M`, trend: 'up', sub: `${payments.length} giao dịch` },
                    { label: 'Lịch hẹn hôm nay', value: todayAppointments.toString(), sub: `${appointments.length} tổng lịch hẹn` },
                    { label: 'Gói tập có sẵn', value: packages.length.toString(), sub: `${packages.filter((p: any) => p.kichHoat).length} đang kích hoạt` }
                ]);

                // Set recent appointments (empty for now)
                setRecentAppointments([]);

                // Set recent payments (empty for now)
                setRecentPayments([]);

                // Show top PTs (first 5 PTs for now)
                const ptAppointmentCount = pts.slice(0, 5).map((pt: any, index: number) => ({
                    ...pt,
                    appointmentCount: Math.max(0, 50 - index * 8) // Mock appointment count
                }));

                setTopPTs(ptAppointmentCount);

            } catch (error) {
                console.error('Error fetching overview data:', error);
                // Fallback to empty data
                setStats([]);
                setRecentAppointments([]);
                setRecentPayments([]);
                setTopPTs([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOverviewData();
    }, [section]);

    useEffect(() => {
        const handler = () => setSection(getSectionFromHash());
        window.addEventListener('hashchange', handler);
        window.addEventListener('popstate', handler);
        return () => {
            window.removeEventListener('hashchange', handler);
            window.removeEventListener('popstate', handler);
        };
    }, []);

    // SVG Icons for TailAdmin-style navigation
    const MenuIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );

    const LayoutDashboardIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );

    const UsersIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    const UserCheckIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const PackageIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );

    const CalendarIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );

    const ActivityIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );

    const DumbbellIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    );

    const ScaleIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
    );

    const SaladIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );

    const CreditCardIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    );

    const BellIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );

    const BrainIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    );

    const SettingsIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    const SunIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    const MoonIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    );

    const SearchIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );

    const ChevronDownIcon = ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );

    return (
        <div className={`admin-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="brand">
                        <span className="title">BILLIONS</span>
                        <span className="subTitle">FITNESS & GYM</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <a className={`nav-item ${section === 'overview' ? 'active' : ''}`} href="#/admin" aria-label="Tổng quan">
                        <LayoutDashboardIcon className="nav-icon" />
                        <span>Tổng quan</span>
                    </a>
                    <a className={`nav-item ${section === 'members' ? 'active' : ''}`} href="#/admin/members" aria-label="Hội viên">
                        <UsersIcon className="nav-icon" />
                        <span>Hội viên</span>
                    </a>
                    <a className={`nav-item ${section === 'pt' ? 'active' : ''}`} href="#/admin/pt" aria-label="Huấn luyện viên">
                        <UserCheckIcon className="nav-icon" />
                        <span>Huấn luyện viên</span>
                    </a>
                    <a className={`nav-item ${section === 'packages' ? 'active' : ''}`} href="#/admin/packages" aria-label="Gói tập">
                        <PackageIcon className="nav-icon" />
                        <span>Gói tập</span>
                    </a>
                    <a className={`nav-item ${section === 'schedules' ? 'active' : ''}`} href="#/admin/schedules" aria-label="Lịch tập">
                        <CalendarIcon className="nav-icon" />
                        <span>Lịch tập</span>
                    </a>
                    <a className={`nav-item ${section === 'sessions' ? 'active' : ''}`} href="#/admin/sessions" aria-label="Buổi tập">
                        <ActivityIcon className="nav-icon" />
                        <span>Buổi tập</span>
                    </a>
                    <a className={`nav-item ${section === 'exercises' ? 'active' : ''}`} href="#/admin/exercises" aria-label="Bài tập">
                        <DumbbellIcon className="nav-icon" />
                        <span>Bài tập</span>
                    </a>
                    <a className={`nav-item ${section === 'templates' ? 'active' : ''}`} href="#/admin/templates" aria-label="Template buổi tập">
                        <ActivityIcon className="nav-icon" />
                        <span>Template buổi tập</span>
                    </a>
                    <a className={`nav-item ${section === 'body_metrics' ? 'active' : ''}`} href="#/admin/body_metrics" aria-label="Chỉ số cơ thể">
                        <ScaleIcon className="nav-icon" />
                        <span>Chỉ số cơ thể</span>
                    </a>
                    <a className={`nav-item ${section === 'nutrition' ? 'active' : ''}`} href="#/admin/nutrition" aria-label="Dinh dưỡng">
                        <SaladIcon className="nav-icon" />
                        <span>Dinh dưỡng</span>
                    </a>
                    <a className={`nav-item ${section === 'payments' ? 'active' : ''}`} href="#/admin/payments" aria-label="Thanh toán">
                        <CreditCardIcon className="nav-icon" />
                        <span>Thanh toán</span>
                    </a>
                    <a className={`nav-item ${section === 'appointments' ? 'active' : ''}`} href="#/admin/appointments" aria-label="Lịch hẹn PT">
                        <CalendarIcon className="nav-icon" />
                        <span>Lịch hẹn PT</span>
                    </a>
                    <a className={`nav-item ${section === 'notifications' ? 'active' : ''}`} href="#/admin/notifications" aria-label="Thông báo">
                        <BellIcon className="nav-icon" />
                        <span>Thông báo</span>
                    </a>
                    <a className={`nav-item ${section === 'ai_suggestions' ? 'active' : ''}`} href="#/admin/ai_suggestions" aria-label="Gợi ý AI">
                        <BrainIcon className="nav-icon" />
                        <span>Gợi ý AI</span>
                    </a>
                    <a className={`nav-item ${section === 'reports' ? 'active' : ''}`} href="#/admin/reports" aria-label="Báo cáo">
                        <ActivityIcon className="nav-icon" />
                        <span>Báo cáo</span>
                    </a>
                    <a className={`nav-item ${section === 'package_workflow' ? 'active' : ''}`} href="#/admin/package_workflow" aria-label="Quy trình gói tập">
                        <ActivityIcon className="nav-icon" />
                        <span>Quy trình gói tập</span>
                    </a>
                    <a className={`nav-item ${section === 'trainer_availability' ? 'active' : ''}`} href="#/admin/trainer_availability" aria-label="Lịch PT">
                        <CalendarIcon className="nav-icon" />
                        <span>Lịch PT</span>
                    </a>
                    <a className={`nav-item ${section === 'package_registrations' ? 'active' : ''}`} href="#/admin/package_registrations" aria-label="Đăng ký gói tập">
                        <CalendarIcon className="nav-icon" />
                        <span>Đăng ký gói tập</span>
                    </a>
                    <a className={`nav-item ${section === 'statistics' ? 'active' : ''}`} href="#/admin/statistics" aria-label="Thống kê">
                        <ActivityIcon className="nav-icon" />
                        <span>Thống kê</span>
                    </a>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <button
                            className="sidebar-toggle-btn-header"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
                        >
                            <MenuIcon className="menu-icon" />
                        </button>
                    </div>
                    <div className="header-center">
                        <div className="search-container">
                            <SearchIcon className="search-icon" />
                            <input
                                className="search-input"
                                placeholder="Tìm kiếm nhanh..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="search-shortcut" title="⌘K">
                                ⌘K
                            </button>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="icon-button theme-toggle-btn" onClick={toggleTheme} title={`Chuyển sang chế độ ${isDarkMode ? 'sáng' : 'tối'}`}>
                            {isDarkMode ? <SunIcon className="icon" /> : <MoonIcon className="icon" />}
                        </button>
                        <button className="icon-button notification-btn" title="Thông báo">
                            <BellIcon className="icon" />
                            <span className="notification-badge">5</span>
                        </button>
                        <div className="user-profile">
                            <div className="avatar">
                                <img src="https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff" alt="Admin" />
                            </div>
                            <div className="user-info">
                                <span className="user-name">Admin</span>
                            </div>
                            <ChevronDownIcon className="chevron-icon" />
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    {section === 'overview' && (
                        <>
                            <section className="stats-grid">
                                {isLoading ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                        <Loading text="Đang tải dữ liệu tổng quan..." />
                                    </div>
                                ) : (
                                    stats.map((s) => (
                                        <Card key={s.label} variant="elevated" className="stat-card">
                                            <div className="stat-content">
                                                <div className="stat-label">{s.label}</div>
                                                <div className="stat-value">{s.value}</div>
                                                {s.sub && <div className={`stat-sub ${s.trend ?? ''}`}>{s.sub}</div>}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </section>

                            <Dashboard
                                stats={stats}
                                recentAppointments={recentAppointments}
                                recentPayments={recentPayments}
                                topPTs={topPTs}
                                isLoading={isLoading}
                            />

                            <AdvancedDashboard
                                stats={stats}
                                recentAppointments={recentAppointments}
                                recentPayments={recentPayments}
                                topPTs={topPTs}
                                isLoading={isLoading}
                            />
                        </>
                    )}
                    {section === 'members' && <MembersPage />}
                    {section === 'pt' && <PTPage />}
                    {section === 'packages' && <PackagesPage />}
                    {section === 'schedules' && <SchedulesPage />}
                    {section === 'sessions' && <SessionsPage />}
                    {section === 'exercises' && <ExercisesPage />}
                    {section === 'templates' && <TemplatesPage />}
                    {section === 'body_metrics' && <BodyMetricsPage />}
                    {section === 'nutrition' && <NutritionPage />}
                    {section === 'payments' && <PaymentsPage />}
                    {section === 'appointments' && <AppointmentsPage />}
                    {section === 'notifications' && <NotificationsPage />}
                    {section === 'feedback' && <FeedbackPage />}
                    {section === 'ai_suggestions' && <AISuggestionsPage />}
                    {section === 'reports' && <ReportsPage />}
                    {section === 'package_workflow' && <PackageWorkflowPage />}
                    {section === 'trainer_availability' && <TrainerAvailabilityPage />}
                    {section === 'package_registrations' && <PackageRegistrationManager />}
                    {section === 'statistics' && <StatisticsPage />}
                </div>
            </main>
        </div>
    );
};

// Package Workflow Management Page
const PackageWorkflowPage = () => {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [selectedRegistration, setSelectedRegistration] = useState<string>('');
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const notifications = useCrudNotifications();

    useEffect(() => {
        fetchPackageRegistrations();
    }, []);

    const fetchPackageRegistrations = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/chitietgoitap');
            console.log('🔍 fetchPackageRegistrations response:', response);

            if (response && Array.isArray(response)) {
                console.log('🔍 Total registrations:', response.length);

                // Filter registrations that need workflow processing
                // Hiển thị các gói đã thanh toán nhưng chưa hoàn thành đủ 3 bước workflow
                const pendingRegistrations = response.filter((reg: any) => {
                    console.log('🔍 Checking registration:', {
                        _id: reg._id,
                        trangThaiThanhToan: reg.trangThaiThanhToan,
                        trangThaiDangKy: reg.trangThaiDangKy,
                        isUpgrade: reg.isUpgrade,
                        maHoiVien: reg.maHoiVien?.hoTen || 'Unknown'
                    });

                    // Chỉ hiển thị gói đã thanh toán
                    if (reg.trangThaiThanhToan !== 'DA_THANH_TOAN') {
                        console.log('🔍 Filtered out - not paid:', reg._id);
                        return false;
                    }

                    // Loại bỏ các gói đã hoàn thành hoàn toàn (HOAN_THANH)
                    if (reg.trangThaiDangKy === 'HOAN_THANH') {
                        console.log('🔍 Filtered out - completed:', reg._id);
                        return false;
                    }

                    // Loại bỏ các gói đã được nâng cấp (DA_NANG_CAP)
                    if (reg.trangThaiDangKy === 'DA_NANG_CAP') {
                        console.log('🔍 Filtered out - upgraded package:', reg._id);
                        return false;
                    }

                    // Hiển thị các trạng thái cần xử lý:
                    // - CHO_CHON_PT: Chưa chọn PT (bước 1)
                    // - DA_CHON_PT: Đã chọn PT nhưng chưa tạo lịch (bước 2) 
                    // - DA_TAO_LICH: Đã tạo lịch nhưng chưa xem lịch (bước 3)
                    console.log('🔍 Should show - active package:', reg._id);
                    return true;
                });

                console.log('🔍 Pending registrations:', pendingRegistrations.length);
                setRegistrations(pendingRegistrations);
            }
        } catch (error) {
            console.error('🔍 Error fetching package registrations:', error);
            notifications.generic.error('Không thể tải danh sách đăng ký gói tập');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartWorkflow = (registrationId: string) => {
        setSelectedRegistration(registrationId);
        setShowWorkflow(true);
    };

    const handleWorkflowComplete = () => {
        setShowWorkflow(false);
        setSelectedRegistration('');
        fetchPackageRegistrations(); // Refresh the list
        notifications.generic.success('Đã hoàn thành thiết lập gói tập!');
    };

    if (showWorkflow && selectedRegistration) {
        return (
            <PackageWorkflowManager
                chiTietGoiTapId={selectedRegistration}
                onComplete={handleWorkflowComplete}
            />
        );
    }

    return (
        <div className="package-workflow-page">
            <Card className="panel">
                <div className="toolbar">
                    <div className="toolbar-left">
                        <h2>Quy trình thiết lập gói tập</h2>
                        <p className="description">Quản lý việc chọn PT và tạo lịch tập cho khách hàng đã thanh toán</p>
                    </div>
                </div>

                {isLoading ? (
                    <Loading text="Đang tải danh sách đăng ký..." />
                ) : (
                    <>
                        {registrations.length === 0 ? (
                            <div className="empty-state">
                                <h3>Không có đăng ký nào cần xử lý</h3>
                                <p>Tất cả các đăng ký gói tập đã được thiết lập hoặc chưa thanh toán.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hội viên</th>
                                            <th>Gói tập</th>
                                            <th>Ngày đăng ký</th>
                                            <th>Ngày hết hạn</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map(reg => (
                                            <tr key={reg._id}>
                                                <td>{reg.maHoiVien?.hoTen || 'N/A'}</td>
                                                <td>{reg.maGoiTap?.tenGoiTap || 'N/A'}</td>
                                                <td>{new Date(reg.ngayDangKy).toLocaleDateString('vi-VN')}</td>
                                                <td>{new Date(reg.ngayKetThuc).toLocaleDateString('vi-VN')}</td>
                                                <td>
                                                    <span className={`badge ${reg.trangThaiDangKy === 'CHO_CHON_PT' ? 'warning' :
                                                        reg.trangThaiDangKy === 'DA_CHON_PT' ? 'info' :
                                                            reg.trangThaiDangKy === 'DA_TAO_LICH' ? 'success' :
                                                                'secondary'
                                                        }`}>
                                                        {reg.trangThaiDangKy === 'CHO_CHON_PT' ? 'Chờ chọn PT' :
                                                            reg.trangThaiDangKy === 'DA_CHON_PT' ? 'Đã chọn PT' :
                                                                reg.trangThaiDangKy === 'DA_TAO_LICH' ? 'Đã tạo lịch' :
                                                                    'Chờ xử lý'}
                                                    </span>
                                                </td>
                                                <td className="row-actions">
                                                    <button
                                                        className="btn"
                                                        onClick={() => handleStartWorkflow(reg._id)}
                                                    >
                                                        {reg.trangThaiDangKy === 'CHO_CHON_PT' ? 'Bắt đầu' :
                                                            reg.trangThaiDangKy === 'DA_CHON_PT' ? 'Tiếp tục (Bước 2)' :
                                                                reg.trangThaiDangKy === 'DA_TAO_LICH' ? 'Tiếp tục (Bước 3)' :
                                                                    'Tiếp tục'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

// Trainer Availability Management Page
const TrainerAvailabilityPage = () => {
    const [trainers, setTrainers] = useState<PT[]>([]);
    const [selectedTrainer, setSelectedTrainer] = useState<string>('');
    const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const notifications = useCrudNotifications();

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/user/pt');
            if (response && Array.isArray(response)) {
                setTrainers(response.filter((pt: PT) => pt.trangThaiPT === 'DANG_HOAT_DONG'));
            } else if (response && response.data && Array.isArray(response.data)) {
                setTrainers(response.data.filter((pt: PT) => pt.trangThaiPT === 'DANG_HOAT_DONG'));
            }
        } catch (error) {
            console.error('Error fetching trainers:', error);
            notifications.generic.error('Không thể tải danh sách PT');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManageAvailability = (ptId: string) => {
        setSelectedTrainer(ptId);
        setShowAvailabilityManager(true);
    };

    const handleCloseAvailabilityManager = () => {
        setShowAvailabilityManager(false);
        setSelectedTrainer('');
    };

    if (showAvailabilityManager && selectedTrainer) {
        return (
            <TrainerAvailabilityManager
                ptId={selectedTrainer}
                onClose={handleCloseAvailabilityManager}
            />
        );
    }

    return (
        <div className="trainer-availability-page">
            <Card className="panel">
                <div className="toolbar">
                    <div className="toolbar-left">
                        <h2>Quản lý lịch làm việc PT</h2>
                        <p className="description">Thiết lập thời gian rảnh cho các huấn luyện viên</p>
                    </div>
                </div>

                {isLoading ? (
                    <Loading text="Đang tải danh sách PT..." />
                ) : (
                    <>
                        {trainers.length === 0 ? (
                            <div className="empty-state">
                                <h3>Không có PT nào đang hoạt động</h3>
                                <p>Vui lòng thêm PT mới hoặc kích hoạt PT hiện có.</p>
                                <Button
                                    variant="primary"
                                    onClick={fetchTrainers}
                                    className="reload-button"
                                >
                                    Tải lại danh sách PT
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="pt-schedule-table-container">
                                    <table className="pt-schedule-table">
                                        <thead>
                                            <tr>
                                                <th>PT</th>
                                                <th>Chuyên môn</th>
                                                <th>Đánh giá</th>
                                                <th>Kinh nghiệm</th>
                                                <th>Email</th>
                                                <th>Trạng thái</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trainers.map(trainer => (
                                                <tr key={trainer._id}>
                                                    <td>
                                                        <div className="trainer-cell">
                                                            <div className="trainer-avatar-small">
                                                                {trainer.anhDaiDien ? (
                                                                    <img src={trainer.anhDaiDien} alt={trainer.hoTen} />
                                                                ) : (
                                                                    <div className="avatar-placeholder">
                                                                        {trainer.hoTen.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="trainer-name">
                                                                <strong>{trainer.hoTen}</strong>
                                                                <small>{trainer.sdt}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{trainer.chuyenMon || 'Chưa cập nhật'}</td>
                                                    <td>
                                                        <div className="rating-cell">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 122.88 117.1"
                                                                fill="#f59e0b"
                                                                style={{ marginRight: "4px" }}
                                                            >
                                                                <path d="M64.42,2,80.13,38.7,120,42.26a3.2,3.2,0,0,1,1.82,5.62L91.64,74.18l8.9,39a3.19,3.19,0,0,1-2.42,3.8,3.27,3.27,0,0,1-2.46-.46L61.41,96.1,27.07,116.64a3.18,3.18,0,0,1-4.38-1.09,3.14,3.14,0,0,1-.37-2.38l8.91-39L1.09,47.88a3.24,3.24,0,0,1-.32-4.52,3.32,3.32,0,0,1,2.29-1l39.72-3.56L58.49,2a3.24,3.24,0,0,1,5.93,0Z" />
                                                            </svg>
                                                            {trainer.danhGia?.toFixed(1) || '0.0'}
                                                        </div>
                                                    </td>
                                                    <td>{trainer.kinhNghiem || 0} năm</td>
                                                    <td>{trainer.email}</td>
                                                    <td>
                                                        <span className={`status-badge ${trainer.trangThaiPT === 'DANG_HOAT_DONG' ? 'active' : 'inactive'}`}>
                                                            {trainer.trangThaiPT === 'DANG_HOAT_DONG' ? 'Hoạt động' : 'Không hoạt động'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="primary"
                                                            size="small"
                                                            onClick={() => handleManageAvailability(trainer._id)}
                                                        >
                                                            Quản lý lịch
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

// PT Detail Modal Component
interface PTDetailModalProps {
    pt: PT;
    chiNhanhs: ChiNhanh[];
    onClose: () => void;
}

const PTDetailModal: React.FC<PTDetailModalProps> = ({ pt, chiNhanhs, onClose }) => {
    // Create modal root if not exists
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
    }

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="user-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Thông Tin Huấn Luyện Viên</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="user-detail-content">
                    <div className="user-profile-section">
                        <div className="avatar-section">
                            <div className="user-avatar">
                                {pt.anhDaiDien ? (
                                    <img src={pt.anhDaiDien} alt={pt.hoTen} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {pt.hoTen.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="user-name-section">
                                <h3>{pt.hoTen}</h3>
                                <p className="user-role">Huấn Luyện Viên</p>
                            </div>
                            <div className="user-info-section">
                                <p>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                        version="1.1"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 256 256"
                                        xmlSpace="preserve"
                                    >
                                        <g
                                            style={{
                                                stroke: "none",
                                                strokeWidth: 0,
                                                strokeDasharray: "none",
                                                strokeLinecap: "butt",
                                                strokeLinejoin: "miter",
                                                strokeMiterlimit: 10,
                                                fill: "none",
                                                fillRule: "nonzero",
                                                opacity: 1,
                                            }}
                                            transform="translate(1.4066 1.4066) scale(2.81 2.81)"
                                        >
                                            <path
                                                d="M 45 0 C 27.395 0 13.123 14.272 13.123 31.877 c 0 7.86 2.858 15.043 7.573 20.6 L 45 81.101 l 24.304 -28.624 c 4.716 -5.558 7.573 -12.741 7.573 -20.6 C 76.877 14.272 62.605 0 45 0 z M 45 43.889 c -7.24 0 -13.11 -5.869 -13.11 -13.11 c 0 -7.24 5.869 -13.11 13.11 -13.11 s 13.11 5.869 13.11 13.11 C 58.11 38.02 52.24 43.889 45 43.889 z"
                                                style={{
                                                    stroke: "none",
                                                    strokeWidth: 1,
                                                    fill: "black",
                                                    fillRule: "nonzero",
                                                    opacity: 1,
                                                }}
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M 58.958 71.559 L 45 82.839 L 31.057 71.556 c -9.329 1.65 -15.682 4.901 -15.682 8.645 c 0 5.412 13.263 9.8 29.625 9.8 c 16.361 0 29.625 -4.388 29.625 -9.8 C 74.625 76.458 68.278 73.209 58.958 71.559 z"
                                                style={{
                                                    stroke: "none",
                                                    strokeWidth: 1,
                                                    fill: "black",
                                                    fillRule: "nonzero",
                                                    opacity: 1,
                                                }}
                                                strokeLinecap="round"
                                            />
                                        </g>
                                    </svg>
                                    <span> {pt.diaChi}</span>
                                </p>
                                <p>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                        version="1.1"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 256 256"
                                        xmlSpace="preserve"
                                    >
                                        <g
                                            style={{
                                                stroke: "none",
                                                strokeWidth: 0,
                                                strokeDasharray: "none",
                                                strokeLinecap: "butt",
                                                strokeLinejoin: "miter",
                                                strokeMiterlimit: 10,
                                                fill: "none",
                                                fillRule: "nonzero",
                                                opacity: 1,
                                            }}
                                            transform="translate(1.4066 1.4066) scale(2.81 2.81)"
                                        >
                                            <path
                                                d="M 0 11.755 v 66.489 h 90 V 11.755 H 0 z M 45 50.49 L 7.138 15.755 h 75.724 L 45 50.49 z M 33.099 45 L 4 71.695 V 18.304 L 33.099 45 z M 36.058 47.714 L 45 55.918 l 8.943 -8.204 l 28.919 26.53 H 7.138 L 36.058 47.714 z M 56.901 45 L 86 18.304 v 53.392 L 56.901 45 z"
                                                style={{
                                                    stroke: "none",
                                                    strokeWidth: 1,
                                                    fill: "black",
                                                    fillRule: "nonzero",
                                                    opacity: 1,
                                                }}
                                                strokeLinecap="round"
                                            />
                                        </g>
                                    </svg>
                                    <span> {pt.email}</span>
                                </p>
                                <p>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlnsXlink="http://www.w3.org/1999/xlink"
                                        version="1.1"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 256 256"
                                        xmlSpace="preserve"
                                    >
                                        <g
                                            style={{
                                                stroke: "none",
                                                strokeWidth: 0,
                                                strokeDasharray: "none",
                                                strokeLinecap: "butt",
                                                strokeLinejoin: "miter",
                                                strokeMiterlimit: 10,
                                                fill: "none",
                                                fillRule: "nonzero",
                                                opacity: 1,
                                            }}
                                            transform="translate(1.4066 1.4066) scale(2.81 2.81)"
                                        >
                                            <path
                                                d="M 20.334 2 c 0.392 0 0.761 0.212 0.963 0.552 l 11.285 19.017 c 0.199 0.336 0.208 0.759 0.024 1.103 l -6.997 13.034 c -1.077 2.006 -0.719 4.434 0.891 6.044 l 10.876 10.876 l 10.876 10.876 c 0.967 0.967 2.254 1.5 3.623 1.5 c 0.842 0 1.679 -0.211 2.422 -0.609 l 13.034 -6.997 c 0.163 -0.087 0.346 -0.133 0.53 -0.133 c 0.201 0 0.399 0.054 0.572 0.157 l 19.017 11.285 c 0.487 0.289 0.683 0.895 0.457 1.409 c -1.654 3.763 -4.605 10.528 -5.789 13.547 c -0.147 0.374 -0.34 0.667 -0.575 0.871 C 78.885 86.833 75.455 88 71.345 88 c -11.841 0 -28.805 -9.608 -44.271 -25.074 C 17.172 53.024 9.436 42.21 5.291 32.476 C 2.19 25.191 -0.297 15.111 5.47 8.459 c 0.204 -0.235 0.497 -0.429 0.871 -0.575 C 9.36 6.7 16.125 3.748 19.888 2.095 C 20.031 2.032 20.181 2 20.334 2 M 20.334 0 c -0.419 0 -0.844 0.085 -1.25 0.264 C 15.386 1.889 8.607 4.847 5.611 6.022 C 4.98 6.269 4.402 6.637 3.958 7.149 c -10.986 12.674 2.4 37.89 21.701 57.191 C 40.159 78.84 57.994 90 71.345 90 c 4.421 0 8.353 -1.225 11.506 -3.958 c 0.512 -0.444 0.88 -1.022 1.127 -1.652 c 1.175 -2.996 4.133 -9.775 5.758 -13.473 c 0.635 -1.444 0.089 -3.128 -1.268 -3.933 L 69.452 55.699 c -0.49 -0.291 -1.041 -0.437 -1.593 -0.437 c -0.507 0 -1.015 0.123 -1.476 0.371 L 53.349 62.63 c -0.465 0.25 -0.972 0.371 -1.476 0.371 c -0.809 0 -1.608 -0.314 -2.208 -0.914 L 38.789 51.211 L 27.913 40.335 c -0.974 -0.974 -1.194 -2.471 -0.543 -3.684 l 6.997 -13.034 c 0.517 -0.964 0.493 -2.129 -0.066 -3.07 L 23.017 1.531 C 22.438 0.556 21.405 0 20.334 0 L 20.334 0 z"
                                                style={{
                                                    stroke: "none",
                                                    strokeWidth: 1,
                                                    fill: "black",
                                                    fillRule: "nonzero",
                                                    opacity: 1,
                                                }}
                                                strokeLinecap="round"
                                            />
                                        </g>
                                    </svg>
                                    <span> {pt.sdt}</span>
                                </p>
                            </div>
                        </div>

                        <div className='user-info-wrapper'>
                            <div className="user-info-form">
                                <div className='user-info-form-header'>
                                    <h3>Thông Tin Cá Nhân</h3>
                                    <p>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlnsXlink="http://www.w3.org/1999/xlink"
                                            version="1.1"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 256 256"
                                            xmlSpace="preserve"
                                        >
                                            <g
                                                style={{
                                                    stroke: "none",
                                                    strokeWidth: 0,
                                                    strokeDasharray: "none",
                                                    strokeLinecap: "butt",
                                                    strokeLinejoin: "miter",
                                                    strokeMiterlimit: 10,
                                                    fill: "none",
                                                    fillRule: "nonzero",
                                                    opacity: 1,
                                                }}
                                                transform="translate(1.4066 1.4066) scale(2.81 2.81)"
                                            >
                                                <path
                                                    d="M 87.851 6.29 L 83.71 2.15 C 82.324 0.763 80.48 0 78.521 0 c -1.961 0 -3.804 0.763 -5.19 2.15 l -6.181 6.181 L 22.822 52.658 c -0.074 0.074 -0.134 0.156 -0.194 0.238 c -0.016 0.022 -0.036 0.04 -0.052 0.063 c -0.087 0.13 -0.155 0.268 -0.208 0.411 c -0.004 0.011 -0.012 0.019 -0.015 0.03 l -6.486 18.178 c -0.26 0.728 -0.077 1.54 0.47 2.086 c 0.381 0.382 0.893 0.586 1.415 0.586 c 0.225 0 0.452 -0.038 0.671 -0.116 l 18.177 -6.485 c 0.014 -0.005 0.025 -0.014 0.038 -0.019 c 0.142 -0.054 0.279 -0.12 0.406 -0.206 c 0.017 -0.012 0.031 -0.027 0.048 -0.039 c 0.088 -0.063 0.174 -0.128 0.251 -0.206 l 44.328 -44.328 l 6.182 -6.181 C 90.712 13.808 90.712 9.152 87.851 6.29 z M 21.051 68.948 l 4.006 -11.226 l 3.61 3.611 l 3.61 3.611 L 21.051 68.948 z M 35.927 62.936 l -1.445 -1.445 l -7.418 -7.419 l 41.499 -41.499 l 8.863 8.863 L 35.927 62.936 z M 85.022 13.841 l -4.768 4.767 l -8.863 -8.863 l 4.767 -4.767 c 1.26 -1.263 3.46 -1.263 4.724 0 l 4.141 4.14 C 86.324 10.42 86.324 12.539 85.022 13.841 z"
                                                    style={{
                                                        stroke: "none",
                                                        strokeWidth: 1,
                                                        fill: "black",
                                                        fillRule: "nonzero",
                                                        opacity: 1,
                                                    }}
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M 79.388 45.667 c -1.104 0 -2 0.896 -2 2 v 34.804 c 0 1.946 -1.584 3.529 -3.53 3.529 H 7.53 C 5.583 86 4 84.417 4 82.471 V 16.142 c 0 -1.946 1.583 -3.53 3.53 -3.53 h 34.803 c 1.104 0 2 -0.896 2 -2 s -0.896 -2 -2 -2 H 7.53 C 3.378 8.612 0 11.99 0 16.142 v 66.329 C 0 86.622 3.378 90 7.53 90 h 66.328 c 4.152 0 7.53 -3.378 7.53 -7.529 V 47.667 C 81.388 46.562 80.492 45.667 79.388 45.667 z"
                                                    style={{
                                                        stroke: "none",
                                                        strokeWidth: 1,
                                                        fill: "black",
                                                        fillRule: "nonzero",
                                                        opacity: 1,
                                                    }}
                                                    strokeLinecap="round"
                                                />
                                            </g>
                                        </svg>
                                    </p>
                                </div>

                                <div className='user-info-form-content'>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Số CCCD</label>
                                        <span className='user-info-form-content-item-value'>{pt.soCCCD}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Giới Tính</label>
                                        <span className='user-info-form-content-item-value'>{pt.gioiTinh}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Email</label>
                                        <span className='user-info-form-content-item-value'>{pt.email}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Địa Chỉ</label>
                                        <span className='user-info-form-content-item-value'>{pt.diaChi}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Số Điện Thoại</label>
                                        <span className='user-info-form-content-item-value'>{pt.sdt}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Ngày Sinh</label>
                                        <span className='user-info-form-content-item-value'>
                                            {pt.ngaySinh ? new Date(pt.ngaySinh).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* <div className="form-group">
                                <label>Số CCCD</label>
                                <input
                                    type="text"
                                    value={pt.soCCCD}
                                    readOnly
                                />
                            </div>

                            <div className="gender-selection">
                                <label className="gender-option">
                                    <input
                                        type="radio"
                                        checked={pt.gioiTinh === 'Nam'}
                                        readOnly
                                    />
                                    <span>Nam</span>
                                </label>
                                <label className="gender-option">
                                    <input
                                        type="radio"
                                        checked={pt.gioiTinh === 'Nữ'}
                                        readOnly
                                    />
                                    <span>Nữ</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <div className="email-input">
                                    <input
                                        type="email"
                                        value={pt.email}
                                        readOnly
                                    />
                                    {pt.email ? <span className="verified-badge">✓ Verified</span> : ''}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Địa Chỉ</label>
                                <input
                                    type="text"
                                    value={pt.diaChi}
                                    readOnly
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Số Điện Thoại</label>
                                    <input
                                        type="tel"
                                        value={pt.sdt}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ngày Sinh</label>
                                    <input
                                        type="text"
                                        value={pt.ngaySinh ? new Date(pt.ngaySinh).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }) : 'N/A'}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ngày Vào Làm</label>
                                    <input
                                        type="text"
                                        value={pt.ngayVaoLam ? new Date(pt.ngayVaoLam).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }) : 'N/A'}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Chuyên Môn</label>
                                    <input
                                        type="text"
                                        value={pt.chuyenMon}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Chi Nhánh</label>
                                    <input
                                        type="text"
                                        value={chiNhanhs.find(cn => cn._id === pt.chinhanh)?.tenChiNhanh || 'Chưa xác định'}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Kinh Nghiệm</label>
                                    <input
                                        type="text"
                                        value={`${pt.kinhNghiem} năm`}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bằng Cấp/Chứng Chỉ</label>
                                    <input
                                        type="text"
                                        value={pt.bangCapChungChi}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Đánh Giá</label>
                                    <div className="rating-minimal">
                                        <div className="rating-content">
                                            <div className="stars-container">
                                                <Rating
                                                    rating={pt.danhGia || 0}
                                                    size="large"
                                                    readonly={true}
                                                />
                                            </div>
                                            <div className="rating-value">
                                                <span className="value">{pt.danhGia ? pt.danhGia.toFixed(1) : '0.0'}</span>
                                                <span className="separator">/</span>
                                                <span className="max">5.0</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Trạng Thái</label>
                                    <div className="status-minimal">
                                        <div className={`status-badge-minimal ${pt.trangThaiPT === 'DANG_HOAT_DONG' ? 'active' : 'inactive'}`}>
                                            <span className="status-label">
                                                {pt.trangThaiPT === 'DANG_HOAT_DONG' ? 'Đang Hoạt Động' : 'Ngừng Làm Việc'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Chứng Chỉ</label>
                                <input
                                    type="text"
                                    value={pt.bangCapChungChi}
                                    readOnly
                                />
                            </div>

                            <div className="form-group">
                                <label>Mô Tả</label>
                                <textarea
                                    value={pt.moTa || ''}
                                    readOnly
                                    rows={3}
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        color: '#374151',
                                        resize: 'none'
                                    }}
                                />
                            </div> */}
                            </div>

                            <div className="user-info-form">
                                <div className='user-info-form-header'>
                                    <h3>Thông Tin Nghề Nghiệp</h3>
                                    <p>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" />
                                        </svg>
                                    </p>
                                </div>

                                <div className='user-info-form-content'>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Ngày Vào Làm</label>
                                        <span className='user-info-form-content-item-value'>
                                            {pt.ngayVaoLam ? new Date(pt.ngayVaoLam).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Kinh Nghiệm</label>
                                        <span className='user-info-form-content-item-value'>{pt.kinhNghiem} năm</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Chuyên Môn</label>
                                        <span className='user-info-form-content-item-value'>{pt.chuyenMon}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Chi Nhánh</label>
                                        <span className='user-info-form-content-item-value'>
                                            {pt.chinhanh ? (chiNhanhs.find(cn => cn._id === pt.chinhanh)?.tenChiNhanh || 'Chưa xác định') : 'Chưa có chi nhánh'}
                                        </span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Bằng Cấp/Chứng Chỉ</label>
                                        <span className='user-info-form-content-item-value'>{pt.bangCapChungChi}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Đánh Giá</label>
                                        <span className='user-info-form-content-item-value'>
                                            <div className="rating-display">
                                                <Rating
                                                    rating={pt.danhGia || 0}
                                                    size="small"
                                                    readonly={true}
                                                />
                                                <span className="rating-text">{pt.danhGia ? pt.danhGia.toFixed(1) : '0.0'}/5.0</span>
                                            </div>
                                        </span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Trạng Thái</label>
                                        <span className='user-info-form-content-item-value'>
                                            <div className={`status-badge ${pt.trangThaiPT === 'DANG_HOAT_DONG' ? 'active' : 'inactive'}`}>
                                                {pt.trangThaiPT === 'DANG_HOAT_DONG' ? 'Đang Hoạt Động' : 'Ngừng Làm Việc'}
                                            </div>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="user-info-form">
                                <div className='user-info-form-header'>
                                    <h3>Mô Tả Bản Thân</h3>
                                    <p>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                        </svg>
                                    </p>
                                </div>

                                <div className='user-info-form-content'>
                                    <div className='user-info-form-content-item full-width'>
                                        <label className='user-info-form-content-item-label'>Mô Tả</label>
                                        <div className='user-info-form-content-item-value description-text'>
                                            {pt.moTa || 'Chưa có mô tả'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

// User Detail Modal Component
interface UserDetailModalProps {
    user: HoiVien;
    onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
    // Create modal root if not exists
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
    }

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="user-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                    <h2>Thông Tin Hội Viên</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="user-detail-content">
                    <div className="user-profile-section">
                        <div className="avatar-section">
                            <div className="user-avatar">
                                {user.anhDaiDien ? (
                                    <img src={user.anhDaiDien} alt={user.hoTen} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.hoTen.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="user-name-section">
                                <h3>{user.hoTen}</h3>
                                <p className='user-role'>Hội Viên</p>
                            </div>
                        </div>

                        <div className='user-info-wrapper'>
                            <div className="user-info-form">
                                <div className='user-info-form-header'>
                                    <h3>Thông Tin Cá Nhân</h3>
                                    <p>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 256 256"
                                            fill="black"
                                        >
                                            <g transform="translate(1.4 1.4) scale(2.81 2.81)">
                                                <path d="M81.467 19.037a1 1 0 0 0-.217-.326L62.833.294a.999.999 0 0 0-.708-.294H9.457a1 1 0 0 0-1 1v88a1 1 0 0 0 1 1h71.087a1 1 0 0 0 1-1V19.419a1 1 0 0 0-.077-.382zM63.125 3.414 78.13 18.419H63.125V3.414zM79.544 88H10.457V2h50.668v17.419a1 1 0 0 0 1 1h17.419V88z" />
                                                <path d="M30.601 39.486a1 1 0 0 1-.532-.153c-4.987-3.13-8.458-8.987-10.313-17.409a.998.998 0 0 1 .494-1.192c3.803-.832 6.886-2.309 9.427-4.516a1 1 0 0 1 1.312 0c2.54 2.207 5.624 3.684 9.426 4.516a.998.998 0 0 1 .494 1.192c-1.856 8.422-5.326 14.279-10.313 17.409a.997.997 0 0 1-.495.153zM21.93 22.454c1.704 7.057 4.617 12.041 8.67 14.835 4.053-2.794 6.966-7.779 8.67-14.836-3.384-.86-6.236-2.235-8.67-4.181-2.434 1.946-5.286 3.321-8.67 4.182z" />
                                                <path d="M67.887 39.486H46.83a1 1 0 1 1 0-2h21.057a1 1 0 1 1 0 2zM67.887 54.938H20.732a1 1 0 1 1 0-2h47.155a1 1 0 1 1 0 2zM67.887 70.39H20.732a1 1 0 1 1 0-2h47.155a1 1 0 1 1 0 2z" />
                                            </g>
                                        </svg>
                                    </p>
                                </div>

                                <div className='user-info-form-content'>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Số CCCD</label>
                                        <span className='user-info-form-content-item-value'>{user.soCCCD}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Giới Tính</label>
                                        <span className='user-info-form-content-item-value'>{user.gioiTinh}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Email</label>
                                        <span className='user-info-form-content-item-value'>{user.email}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Địa Chỉ</label>
                                        <span className='user-info-form-content-item-value'>{user.diaChi}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Số Điện Thoại</label>
                                        <span className='user-info-form-content-item-value'>{user.sdt}</span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Ngày Sinh</label>
                                        <span className='user-info-form-content-item-value'>
                                            {user.ngaySinh ? new Date(user.ngaySinh).toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="user-info-form">
                                <div className='user-info-form-header'>
                                    <h3>Thông Tin Hội Viên</h3>
                                    <p>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 256 256"
                                            style={{ marginRight: "6px" }}
                                        >
                                            <g transform="translate(1.4 1.4) scale(2.81 2.81)">
                                                <path
                                                    d="M74.319 90H15.681c-3.365 0-6.103-2.737-6.103-6.103V6.103C9.578 2.738 12.315 0 15.681 0h58.639c3.365 0 6.104 2.738 6.104 6.103v77.794C80.423 87.263 77.685 90 74.319 90zM15.681 2c-2.262 0-4.103 1.841-4.103 4.103v77.794c0 2.262 1.841 4.103 4.103 4.103h58.639c2.263 0 4.104-1.841 4.104-4.103V6.103C78.423 3.841 76.582 2 74.319 2H15.681z"
                                                    fill="black"
                                                />
                                                <path
                                                    d="M45.335 30.393c-4.013 0-7.278-3.265-7.278-7.278v-3.662c0-4.013 3.265-7.278 7.278-7.278 4.014 0 7.278 3.265 7.278 7.278v3.662c0 4.013-3.264 7.278-7.278 7.278zm0-16.218c-2.911 0-5.278 2.368-5.278 5.278v3.662c0 2.911 2.368 5.278 5.278 5.278 2.91 0 5.278-2.368 5.278-5.278v-3.662c0-2.91-2.368-5.278-5.278-5.278z"
                                                    fill="black"
                                                />
                                                <path
                                                    d="M54.828 45.424H35.841c-.552 0-1-.448-1-1v-5.538c0-5.786 4.708-10.494 10.494-10.494s10.493 4.708 10.493 10.494v5.538c0 .552-.447 1-1 1zm-17.987-2h15.987v-4.538c0-4.684-3.81-8.494-8.493-8.494s-8.494 3.81-8.494 8.494v4.538z"
                                                    fill="black"
                                                />
                                                <path
                                                    d="M69.945 57.825H20.055c-.552 0-1-.447-1-1s.448-1 1-1h49.891c.553 0 1 .447 1 1s-.447 1-1 1z"
                                                    fill="black"
                                                />
                                                <path
                                                    d="M69.945 67.825H20.055c-.552 0-1-.447-1-1s.448-1 1-1h49.891c.553 0 1 .447 1 1s-.447 1-1 1z"
                                                    fill="black"
                                                />
                                                <path
                                                    d="M69.945 77.825H20.055c-.552 0-1-.447-1-1s.448-1 1-1h49.891c.553 0 1 .447 1 1s-.447 1-1 1z"
                                                    fill="black"
                                                />
                                            </g>
                                        </svg>
                                    </p>
                                </div>

                                <div className='user-info-form-content'>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Ngày Tham Gia</label>
                                        <span className='user-info-form-content-item-value'>
                                            {user.ngayThamGia ? new Date(user.ngayThamGia).toLocaleDateString('vi-VN') : 'N/A'}
                                        </span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Ngày Hết Hạn</label>
                                        <span className='user-info-form-content-item-value'>
                                            {user.ngayHetHan ? new Date(user.ngayHetHan).toLocaleDateString('vi-VN') : 'N/A'}
                                        </span>
                                    </div>
                                    <div className='user-info-form-content-item'>
                                        <label className='user-info-form-content-item-label'>Trạng Thái Hội Viên</label>
                                        <span className='user-info-form-content-item-value'>
                                            <div className={`status-badge ${user.trangThaiHoiVien === 'DANG_HOAT_DONG' ? 'active' : user.trangThaiHoiVien === 'TAM_NGUNG' ? 'inactive' : 'expired'}`}>
                                                {user.trangThaiHoiVien === 'DANG_HOAT_DONG' ? 'Đang Hoạt Động' : user.trangThaiHoiVien === 'TAM_NGUNG' ? 'Tạm Ngưng' : 'Hết Hạn'}
                                            </div>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AdminDashboard;

// --- Subpages ---
const MembersPage = () => {
    // Hàm mở modal chi tiết và fetch lại dữ liệu mới nhất
    const handleViewDetail = async (member: HoiVien) => {
        try {
            setIsLoading(true);
            // Lấy lại thông tin hội viên mới nhất
            const latest = await api.get(`/api/user/hoivien/${member._id}`);
            // Lấy lại trạng thái tài khoản mới nhất
            let taiKhoan = null;
            try {
                taiKhoan = await api.get(`/api/user/taikhoan/by-phone/${latest.sdt}`);
            } catch { }
            setViewingDetail({ ...latest, taiKhoan });
        } catch (e) {
            setViewingDetail(member); // fallback nếu lỗi
        } finally {
            setIsLoading(false);
        }
    };
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<HoiVien | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: HoiVien | null }>({ show: false, item: null });
    const [viewingDetail, setViewingDetail] = useState<HoiVien | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<HoiVien[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [branches, setBranches] = useState<ChiNhanh[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRank, setFilterRank] = useState<string>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const notifications = useCrudNotifications();

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig(null);
            return;
        }
        setSortConfig({ key, direction });
    };

    const sortedRows = React.useMemo(() => {
        if (!sortConfig) return rows;

        return [...rows].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortConfig.key) {
                case 'hoTen':
                    aValue = a.hoTen?.toLowerCase() || '';
                    bValue = b.hoTen?.toLowerCase() || '';
                    break;
                case 'sdt':
                    aValue = a.sdt || '';
                    bValue = b.sdt || '';
                    break;
                case 'email':
                    aValue = a.email?.toLowerCase() || '';
                    bValue = b.email?.toLowerCase() || '';
                    break;
                case 'maChiNhanh':
                    aValue = a.maChiNhanh || '';
                    bValue = b.maChiNhanh || '';
                    break;
                case 'soTienTichLuy':
                    aValue = a.soTienTichLuy || 0;
                    bValue = b.soTienTichLuy || 0;
                    break;
                case 'soBuoiTapDaTap':
                    aValue = a.soBuoiTapDaTap || 0;
                    bValue = b.soBuoiTapDaTap || 0;
                    break;
                case 'ngayThamGia':
                    aValue = new Date(a.ngayThamGia || 0).getTime();
                    bValue = new Date(b.ngayThamGia || 0).getTime();
                    break;
                case 'ngayHetHan':
                    aValue = new Date(a.ngayHetHan || 0).getTime();
                    bValue = new Date(b.ngayHetHan || 0).getTime();
                    break;
                case 'trangThaiHoiVien':
                    aValue = a.trangThaiHoiVien || '';
                    bValue = b.trangThaiHoiVien || '';
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rows, sortConfig]);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        try {
            const data = await api.get<HoiVien[]>(`/api/user/hoivien?q=${query}`);
            if (Array.isArray(data)) {
                const membersWithAccounts = await Promise.all(
                    data.map(async (member: HoiVien) => {
                        try {
                            // Lấy thông tin tài khoản dựa trên SDT
                            const taiKhoanResponse = await api.get(`/api/user/taikhoan/by-phone/${member.sdt}`);
                            return {
                                ...member,
                                taiKhoan: taiKhoanResponse
                            };
                        } catch (error) {
                            console.error(`Error fetching account for member ${member._id} with phone ${member.sdt}:`, error);
                            // Trả về member với trạng thái mặc định nếu không tìm thấy tài khoản
                            return {
                                ...member,
                                taiKhoan: null // Set null để dễ kiểm tra
                            };
                        }
                    })
                );
                setRows(membersWithAccounts);
            } else {
                setRows([]);
            }
        } catch (e) {
            console.error('Error searching members:', e);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm để tải danh sách hội viên
    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<HoiVien[]>('/api/user/hoivien');
            if (Array.isArray(data)) {
                // Lấy thông tin tài khoản cho mỗi hội viên
                const membersWithAccounts = await Promise.all(
                    data.map(async (member: HoiVien) => {
                        try {
                            // Lấy thông tin tài khoản dựa trên SDT
                            const taiKhoanResponse = await api.get(`/api/user/taikhoan/by-phone/${member.sdt}`);
                            return {
                                ...member,
                                taiKhoan: taiKhoanResponse
                            };
                        } catch (error) {
                            console.error(`Error fetching account for member ${member._id} with phone ${member.sdt}:`, error);
                            // Trả về member với trạng thái mặc định nếu không tìm thấy tài khoản
                            return {
                                ...member,
                                taiKhoan: null // Set null để dễ kiểm tra
                            };
                        }
                    })
                );
                setRows(membersWithAccounts);
            } else {
                setRows([]);
            }
        } catch (e) {
            console.error('Error fetching members:', e);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await fetchMembers();
        })();
        return () => { mounted = false; };
    }, [refreshTrigger]);

    // Fetch chi nhánh
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await api.get<{ success: boolean; data: ChiNhanh[] }>('/api/chinhanh');
                if (response.success && Array.isArray(response.data)) {
                    setBranches(response.data);
                }
            } catch (e) {
                console.error('Error fetching branches:', e);
                setBranches([]);
            }
        };
        fetchBranches();
    }, []);

    // Filter sorted rows based on search query, branch, status, and rank
    const filtered = sortedRows.filter(r => {
        // Search filter
        if (q.trim()) {
            const searchTerm = q.toLowerCase().trim();
            const matchesSearch = (
                (r.hoTen && r.hoTen.toLowerCase().includes(searchTerm)) ||
                (r.email && r.email.toLowerCase().includes(searchTerm)) ||
                (r.sdt && r.sdt.toLowerCase().includes(searchTerm)) ||
                (r.soCCCD && r.soCCCD.toLowerCase().includes(searchTerm)) ||
                (r.diaChi && r.diaChi.toLowerCase().includes(searchTerm))
            );
            if (!matchesSearch) return false;
        }

        // Branch filter
        if (selectedBranch !== 'all') {
            // Chỉ hiển thị hội viên có maChiNhanh khớp với selectedBranch
            // Nếu hội viên không có maChiNhanh hoặc không khớp, loại bỏ
            const memberBranchId = r.maChiNhanh ? String(r.maChiNhanh) : null;
            const selectedBranchId = String(selectedBranch);
            if (!memberBranchId || memberBranchId !== selectedBranchId) return false;
        }

        // Status filter
        if (filterStatus !== 'all') {
            if (r.trangThaiHoiVien !== filterStatus) return false;
        }

        // Rank filter
        if (filterRank !== 'all') {
            // Chỉ hiển thị hội viên có hangHoiVien khớp với filterRank
            // Nếu hội viên không có hangHoiVien hoặc không khớp, loại bỏ
            if (!r.hangHoiVien || !r.hangHoiVien.tenHang || r.hangHoiVien.tenHang !== filterRank) return false;
        }

        return true;
    });

    // Hàm để thay đổi trạng thái tài khoản
    const handleChangeAccountStatus = async (memberId: string, newStatus: 'DANG_HOAT_DONG' | 'DA_KHOA') => {
        try {
            setIsChangingStatus(memberId);

            const member = rows.find(r => r._id === memberId);
            if (!member) {
                throw new Error('Không tìm thấy hội viên');
            }

            if (!member.taiKhoan) {
                notifications.generic.warning('Không thể thay đổi trạng thái', 'Hội viên chưa có tài khoản. Vui lòng tạo tài khoản trước khi thay đổi trạng thái.');
                return;
            }

            // Gọi API để khóa/mở khóa tài khoản dựa trên trạng thái
            if (newStatus === 'DA_KHOA') {
                // Khóa tài khoản - sử dụng ID của hội viên (nguoiDungId)
                await api.put(`/api/user/taikhoan/${memberId}/lock`);
            } else if (newStatus === 'DANG_HOAT_DONG') {
                // Mở khóa tài khoản - sử dụng ID của hội viên (nguoiDungId)
                await api.put(`/api/user/taikhoan/${memberId}/unlock`);
            }

            // Cập nhật local state
            setRows(prevRows =>
                prevRows.map(member =>
                    member._id === memberId
                        ? {
                            ...member,
                            taiKhoan: {
                                ...member.taiKhoan,
                                trangThaiTK: newStatus
                            }
                        }
                        : member
                )
            );

            // Nếu đang xem chi tiết hội viên này thì cập nhật luôn viewingDetail
            setViewingDetail(prev =>
                prev && prev._id === memberId
                    ? {
                        ...prev,
                        taiKhoan: {
                            ...prev.taiKhoan,
                            trangThaiTK: newStatus
                        }
                    }
                    : prev
            );

            setEditingItem(prev =>
                prev && prev._id === memberId
                    ? {
                        ...prev,
                        taiKhoan: {
                            ...prev.taiKhoan,
                            trangThaiTK: newStatus
                        }
                    }
                    : prev
            );

            setRefreshTrigger(prev => prev + 1);

            notifications.generic.success('Cập nhật trạng thái tài khoản thành công!');
        } catch (error) {
            console.error('Error changing account status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
            notifications.generic.error('Có lỗi xảy ra', `Không thể cập nhật trạng thái tài khoản: ${errorMessage}`);
        } finally {
            setIsChangingStatus(null);
        }
    };

    // Close menu khi click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.members-actions-wrapper')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleSelectMember = (id: string) => {
        setSelectedMembers(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedMembers.length === filtered.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(filtered.map(r => r._id));
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'DANG_HOAT_DONG': return 'dang-hoat-dong';
            case 'TAM_NGUNG': return 'tam-ngung';
            case 'HET_HAN': return 'het-han';
            default: return 'dang-hoat-dong';
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    };

    const handleApplyFilters = () => {
        // Filters are already applied in real-time through the `filtered` computed value
        // This function just shows feedback to the user
        const activeFilterCount = [
            selectedBranch !== 'all' ? 1 : 0,
            filterStatus !== 'all' ? 1 : 0,
            filterRank !== 'all' ? 1 : 0,
            q.trim() !== '' ? 1 : 0
        ].reduce((a, b) => a + b, 0);

        notifications.generic.success(
            `Đã áp dụng bộ lọc! Tìm thấy ${filtered.length} hội viên${activeFilterCount > 0 ? ` với ${activeFilterCount} bộ lọc` : ''}`
        );
    };

    const handleClearFilters = () => {
        setSelectedBranch('all');
        setFilterStatus('all');
        setFilterRank('all');
        setQ('');
        notifications.generic.info('Đã xóa bộ lọc! Hiển thị tất cả hội viên.');
    };

    const hasActiveFilters = () => {
        return selectedBranch !== 'all' || filterStatus !== 'all' || filterRank !== 'all' || q.trim() !== '';
    };

    // Helper function để lấy tên chi nhánh
    const getBranchName = (maChiNhanh?: string) => {
        if (!maChiNhanh) return 'Chưa có chi nhánh';
        const branch = branches.find(b => b._id === maChiNhanh);
        return branch ? branch.tenChiNhanh : 'Chưa có chi nhánh';
    };

    // Helper function để render sort icon
    const renderSortIcon = (columnKey: string) => {
        const isActive = sortConfig && sortConfig.key === columnKey;
        const direction = isActive ? sortConfig.direction : null;

        return (
            <span
                className="sort-icon"
                style={{
                    marginLeft: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: isActive ? 1 : 0.3,
                    color: isActive ? '#6366F1' : '#9CA3AF',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s ease'
                }}
            >
                {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '⇅'}
            </span>
        );
    };

    return (
        <div className="members-management-page">
            {/* Page Header */}
            <div className="members-page-header">
                <div className="members-page-header-content">
                    <h1 className="members-page-title">Quản lý hội viên</h1>
                    <p className="members-page-description">
                        Theo dõi thông tin, trạng thái, gói tập và chi nhánh của tất cả hội viên Billions Fitness & Gym.
                    </p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="members-filter-toolbar">
                <button
                    className="members-filter-icon-btn"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                    🔽
                </button>
                <select
                    className="members-filter-dropdown"
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                >
                    <option value="all">CHI NHÁNH</option>
                    {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>
                            {branch.tenChiNhanh}
                        </option>
                    ))}
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="all">TRẠNG THÁI</option>
                    <option value="DANG_HOAT_DONG">Đang hoạt động</option>
                    <option value="TAM_NGUNG">Tạm ngưng</option>
                    <option value="HET_HAN">Hết hạn</option>
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterRank}
                    onChange={e => setFilterRank(e.target.value)}
                >
                    <option value="all">HẠNG</option>
                    <option value="BRONZE">Bronze</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="DIAMOND">Diamond</option>
                </select>
                <input
                    className="members-filter-search"
                    type="text"
                    placeholder="Tìm theo tên, SĐT, email..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <button className="members-filter-apply-btn" onClick={handleApplyFilters}>
                    APPLY
                </button>
                <button className="members-filter-clear-btn" onClick={handleClearFilters}>
                    CLEAR
                </button>
            </div>

            {/* Action Buttons */}
            <div className="members-page-actions">
                <button className="members-add-btn" onClick={() => setShow(true)}>
                    <span>+</span> Thêm hội viên
                </button>
            </div>

            {/* Table Wrapper */}
            <div className="members-table-wrapper">
                <table className="members-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.length === filtered.length && filtered.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th
                                style={{ width: '250px', cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('hoTen');
                                }}
                                className="sortable-header"
                            >
                                User name {renderSortIcon('hoTen')}
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('sdt');
                                }}
                                className="sortable-header"
                            >
                                Contact {renderSortIcon('sdt')}
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('maChiNhanh');
                                }}
                                className="sortable-header"
                            >
                                Chi nhánh {renderSortIcon('maChiNhanh')}
                            </th>
                            <th>Rank</th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('trangThaiHoiVien');
                                }}
                                className="sortable-header"
                            >
                                Status {renderSortIcon('trangThaiHoiVien')}
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('soTienTichLuy');
                                }}
                                className="sortable-header"
                            >
                                Total spent {renderSortIcon('soTienTichLuy')}
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('soBuoiTapDaTap');
                                }}
                                className="sortable-header"
                            >
                                Workouts {renderSortIcon('soBuoiTapDaTap')}
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('ngayThamGia');
                                }}
                                className="sortable-header"
                            >
                                Joined date {renderSortIcon('ngayThamGia')}
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSort('ngayHetHan');
                                }}
                                className="sortable-header"
                            >
                                Expire date {renderSortIcon('ngayHetHan')}
                            </th>
                            <th style={{ width: '60px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id} onClick={() => handleViewDetail(r)} style={{ cursor: 'pointer' }}>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(r._id)}
                                        onChange={() => toggleSelectMember(r._id)}
                                    />
                                </td>
                                <td>
                                    <div className="members-user-cell">
                                        <img
                                            className="members-avatar"
                                            src={r.anhDaiDien || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.hoTen)}&background=3b82f6&color=fff`}
                                            alt={r.hoTen}
                                        />
                                        <div className="members-user-info">
                                            <div className="members-user-name">{r.hoTen}</div>
                                            <div className="members-user-email">{r.email || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="members-contact-cell">
                                        <span className="members-contact-phone">{r.sdt}</span>
                                        <span className="members-contact-email">{r.email || 'N/A'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="members-branch-display">
                                        {getBranchName(r.maChiNhanh)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`members-rank-badge bronze`}>
                                        Bronze
                                    </span>
                                </td>
                                <td>
                                    <span className={`members-status-badge ${getStatusClass(r.trangThaiHoiVien)}`}>
                                        {r.trangThaiHoiVien === 'DANG_HOAT_DONG' ? 'Đang hoạt động' :
                                            r.trangThaiHoiVien === 'TAM_NGUNG' ? 'Tạm ngưng' : 'Hết hạn'}
                                    </span>
                                </td>
                                <td>
                                    <span className="members-metric-display compact">
                                        {formatCurrency(r.soTienTichLuy || 0)}₫
                                    </span>
                                </td>
                                <td>
                                    <span className="members-metric-display compact">
                                        {r.soBuoiTapDaTap || 0}
                                    </span>
                                </td>
                                <td>
                                    <span className="members-date-display">
                                        {r.ngayThamGia ? new Date(r.ngayThamGia).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <span className="members-date-display">
                                        {r.ngayHetHan ? new Date(r.ngayHetHan).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="members-actions-wrapper">
                                        <button
                                            className="members-actions-btn"
                                            onClick={() => setOpenMenuId(openMenuId === r._id ? null : r._id)}
                                        >
                                            ⋯
                                        </button>
                                        {openMenuId === r._id && (
                                            <div className="members-actions-menu">
                                                <div className="members-actions-menu-item" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetail(r);
                                                    setOpenMenuId(null);
                                                }}>
                                                    👁️ Xem chi tiết
                                                </div>
                                                <div className="members-actions-menu-item" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItem(r);
                                                    setOpenMenuId(null);
                                                }}>
                                                    ✏️ Sửa
                                                </div>
                                                <div className="members-actions-menu-item danger" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm({ show: true, item: r });
                                                    setOpenMenuId(null);
                                                }}>
                                                    🗑️ Xóa
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(page => (
                        <button
                            key={page}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                background: page === 1 ? '#EF4444' : 'white',
                                color: page === 1 ? 'white' : '#1e293b',
                                cursor: 'pointer'
                            }}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
            {(show || editingItem) && (
                <EntityForm
                    title="Hội Viên"
                    initialData={editingItem || undefined}
                    fields={[
                        { name: 'hoTen', label: 'Họ tên', validation: { required: true, pattern: /^[\p{L}\s]+$/u, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' } },
                        { name: 'email', label: 'Email (tùy chọn)', type: 'email', validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không đúng định dạng' } },
                        { name: 'sdt', label: 'Số điện thoại', type: 'tel', validation: { required: true, pattern: /^\d{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' } },
                        { name: 'soCCCD', label: 'Số CCCD', validation: { required: true, pattern: /^\d{12}$/, message: 'Số CCCD phải có đúng 12 chữ số' } },
                        { name: 'ngaySinh', label: 'Ngày sinh', type: 'date', validation: { required: true } },
                        { name: 'gioiTinh', label: 'Giới tính', type: 'radio', options: ['Nam', 'Nữ'], validation: { required: true } },
                        { name: 'diaChi', label: 'Địa chỉ', type: 'textarea', validation: { required: true } },
                        { name: 'anhDaiDien', label: 'Ảnh đại diện (tùy chọn)', type: 'file', validation: { maxSize: 5 } },
                        ...(editingItem ? [{ name: 'trangThaiHoiVien', label: 'Trạng thái', options: ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HET_HAN'], validation: { required: true } }] : [])
                    ]}
                    onClose={() => {
                        setShow(false);
                        setEditingItem(null);
                        setIsCopying(false);
                    }}
                    onSave={async (val) => {
                        try {
                            // Optimize data before sending
                            const optimizedVal = { ...val };

                            // Remove empty fields to reduce payload size
                            Object.keys(optimizedVal).forEach(key => {
                                if (optimizedVal[key] === '' || optimizedVal[key] === null || optimizedVal[key] === undefined) {
                                    delete optimizedVal[key];
                                }
                            });

                            // Compress image data if it's too large
                            if (optimizedVal.anhDaiDien && optimizedVal.anhDaiDien.length > 1000000) { // > 1MB
                                console.warn('Image data is large, consider compressing before upload');
                                // Show warning to user
                                const shouldContinue = confirm('Ảnh đại diện có kích thước lớn (>1MB). Bạn có muốn tiếp tục không? Hệ thống sẽ tự động nén ảnh.');
                                if (!shouldContinue) {
                                    return;
                                }
                            }

                            if (editingItem && !isCopying) {
                                // Cập nhật hội viên hiện tại
                                const updated = await api.put(`/api/user/hoivien/${editingItem._id}`, optimizedVal);
                                if (updated) {
                                    notifications.member.updateSuccess();
                                    setRefreshTrigger(prev => prev + 1);
                                }
                            } else {
                                const newMember = {
                                    hoTen: val.hoTen,
                                    ngaySinh: val.ngaySinh,
                                    gioiTinh: val.gioiTinh,
                                    sdt: val.sdt,
                                    ...(val.email && { email: val.email }),
                                    ...(val.soCCCD && { soCCCD: val.soCCCD }),
                                    ...(val.diaChi && { diaChi: val.diaChi }),
                                    ...(val.anhDaiDien && { anhDaiDien: val.anhDaiDien }),
                                    trangThaiHoiVien: 'DANG_HOAT_DONG', // Mặc định là đang hoạt động
                                    ngayThamGia: new Date().toISOString(),
                                    ngayHetHan: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                                };
                                const created = await api.post('/api/user/hoivien', newMember);
                                if (created) {
                                    notifications.member.createSuccess();
                                    setRefreshTrigger(prev => prev + 1);
                                }
                            }
                            setShow(false);
                            setEditingItem(null);
                            setIsCopying(false);
                        } catch (error) {
                            console.error('Error saving member:', error);
                            let errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu thông tin hội viên';

                            // Handle specific error types
                            if (errorMessage.includes('E11000 duplicate key error') && errorMessage.includes('soCCCD')) {
                                errorMessage = 'Số CCCD này đã được sử dụng bởi hội viên khác. Vui lòng kiểm tra lại.';
                            } else if (errorMessage.includes('E11000 duplicate key error') && errorMessage.includes('sdt')) {
                                errorMessage = 'Số điện thoại này đã được sử dụng bởi hội viên khác. Vui lòng kiểm tra lại.';
                            } else if (errorMessage.includes('E11000 duplicate key error') && errorMessage.includes('email')) {
                                errorMessage = 'Email này đã được sử dụng bởi hội viên khác. Vui lòng kiểm tra lại.';
                            } else if (errorMessage.includes('413') || errorMessage.includes('PayloadTooLargeError')) {
                                errorMessage = 'Dữ liệu quá lớn. Vui lòng giảm kích thước ảnh đại diện hoặc thử lại.';
                            }

                            if (editingItem && !isCopying) {
                                notifications.member.updateError(errorMessage);
                            } else {
                                notifications.member.createError(errorMessage);
                            }
                        }
                    }}
                />
            )}
            {deleteConfirm.show && deleteConfirm.item && (
                <ConfirmModal
                    title="Xác nhận xóa hội viên"
                    message={`Bạn có chắc chắn muốn xóa hội viên "${deleteConfirm.item.hoTen}"? Hành động này không thể hoàn tác.`}
                    type="danger"
                    confirmText="Xóa"
                    cancelText="Hủy"
                    onConfirm={async () => {
                        try {
                            await api.delete(`/api/user/hoivien/${deleteConfirm.item!._id}`);
                            notifications.member.deleteSuccess();
                            setRefreshTrigger(prev => prev + 1);
                        } catch (error) {
                            console.error('Error deleting member:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
                            notifications.member.deleteError(errorMessage);
                        }
                        setDeleteConfirm({ show: false, item: null });
                    }}
                    onCancel={() => setDeleteConfirm({ show: false, item: null })}
                />
            )}
            {viewingDetail && (
                <UserDetailModal
                    user={viewingDetail}
                    onClose={() => setViewingDetail(null)}
                />
            )}
            {isLoading && <Loading overlay text="Đang tải hội viên..." />}
        </div>
    );
};

// Packages Page
const PackagesPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<GoiTap | null>(null);
    const notifications = useCrudNotifications();
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: GoiTap | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<GoiTap[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewingItem, setViewingItem] = useState<GoiTap | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get<GoiTap[]>('/api/goitap');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching packages:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const filtered = rows.filter(r =>
        r.tenGoiTap.toLowerCase().includes(q.toLowerCase()) ||
        r.moTa.toLowerCase().includes(q.toLowerCase())
    );

    const sortedAndFiltered = [...filtered].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = a.tenGoiTap.localeCompare(b.tenGoiTap, 'vi');
                break;
            case 'price':
                comparison = (a.donGia || 0) - (b.donGia || 0);
                break;
            case 'duration':
                // Convert duration to days for comparison
                const aDays = a.donViThoiHan === 'Ngày' ? a.thoiHan :
                    a.donViThoiHan === 'Tháng' ? a.thoiHan * 30 :
                        a.thoiHan * 365;
                const bDays = b.donViThoiHan === 'Ngày' ? b.thoiHan :
                    b.donViThoiHan === 'Tháng' ? b.thoiHan * 30 :
                        b.thoiHan * 365;
                comparison = aDays - bDays;
                break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleSort = (newSortBy: 'name' | 'price' | 'duration') => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý gói tập</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm gói tập" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>

            {/* Sorting Controls */}
            <div className="sorting-controls">
                <span className="sort-label">Sắp xếp theo:</span>
                <button
                    className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => handleSort('name')}
                >
                    Tên {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
                    onClick={() => handleSort('price')}
                >
                    Giá {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                    className={`sort-btn ${sortBy === 'duration' ? 'active' : ''}`}
                    onClick={() => handleSort('duration')}
                >
                    Thời hạn {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
            </div>

            <div className="packages-container">
                <div className="packages-grid">
                    {sortedAndFiltered.map(pkg => (
                        <Card key={pkg._id} className="package-card" hover>
                            <div className="package-image-section">
                                {pkg.popular && <div className="popular-badge">Phổ biến</div>}
                                <img src={pkg.hinhAnhDaiDien} alt={pkg.tenGoiTap} className="package-image" />
                            </div>
                            <div className="package-content">
                                <h3 className="package-title">{pkg.tenGoiTap}</h3>
                                <div className="package-details">
                                    <div className="package-price">
                                        <span className="package-price-value">{pkg.donGia ? pkg.donGia.toLocaleString('vi-VN') : '0'}₫</span>
                                        {pkg.giaGoc && pkg.giaGoc > pkg.donGia && (
                                            <span className="original-price">{pkg.giaGoc.toLocaleString('vi-VN')}₫</span>
                                        )}
                                    </div>
                                    <div className="package-info">
                                        <span className="package-type">
                                            {pkg.loaiGoiTap === 'CaNhan' ? 'Cá nhân' :
                                                pkg.loaiGoiTap === 'Nhom' ? 'Nhóm' : 'Công ty'}
                                        </span>
                                        <span className="package-participants">
                                            {pkg.soLuongNguoiThamGia} người
                                        </span>
                                        <span className="package-duration">
                                            {pkg.loaiThoiHan === 'VinhVien' ? 'Vĩnh viễn' :
                                                `${pkg.thoiHan} ${pkg.donViThoiHan === 'Ngày' ? 'ngày' :
                                                    pkg.donViThoiHan === 'Tháng' ? 'tháng' : 'năm'}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="package-status">
                                    <span className={`badge ${pkg.kichHoat ? 'success' : 'danger'}`}>
                                        {pkg.kichHoat ? 'ĐANG BÁN' : 'TẠM NGƯNG'}
                                    </span>
                                </div>
                                <div className="package-actions">
                                    <Button className="edit-btn" variant="ghost" size="small" onClick={() => setEditingItem(pkg)}>Sửa</Button>
                                    <Button variant="ghost" size="small" onClick={() => setViewingItem(pkg)}>Xem chi tiết</Button>
                                    <Button variant="ghost" size="small" onClick={() => setDeleteConfirm({ show: true, item: pkg })}>Xóa</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            {(show || editingItem) && <EntityForm
                title="Gói tập"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'hinhAnhDaiDien', label: 'Hình ảnh đại diện', type: 'file', validation: { maxSize: 5 } },
                    { name: 'tenGoiTap', label: 'Tên gói tập', validation: { required: true, pattern: /^[\p{L}\d\s\-_]+$/u, message: 'Tên gói tập không được chứa ký tự đặc biệt' } },
                    { name: 'moTa', label: 'Mô tả', type: 'textarea', validation: { required: true } },
                    {
                        name: 'loaiGoiTap', label: 'Loại gói tập', options: [
                            { value: 'CaNhan', label: 'Cá nhân' },
                            { value: 'Nhom', label: 'Nhóm' },
                            { value: 'CongTy', label: 'Công ty' }
                        ], validation: { required: true }
                    },
                    { name: 'soLuongNguoiThamGia', label: 'Số lượng người tham gia', type: 'number', validation: { required: true, pattern: /^[1-9]\d*$/, message: 'Số lượng phải là số nguyên dương' } },
                    { name: 'donGia', label: 'Đơn giá (VNĐ)', type: 'number', validation: { required: true, pattern: /^\d+$/, message: 'Đơn giá phải là số nguyên dương' } },
                    { name: 'giaGoc', label: 'Giá gốc (VNĐ)', type: 'number', validation: { pattern: /^\d+$/, message: 'Giá gốc phải là số nguyên dương' } },
                    {
                        name: 'loaiThoiHan', label: 'Loại thời hạn', options: [
                            { value: 'TinhTheoNgay', label: 'Tính theo ngày từ khi đăng ký' },
                            { value: 'VinhVien', label: 'Vĩnh viễn' }
                        ], validation: { required: true }
                    },
                    { name: 'thoiHan', label: 'Thời hạn', type: 'number', validation: { required: true, pattern: /^\d+$/, message: 'Thời hạn phải là số nguyên dương' } },
                    {
                        name: 'donViThoiHan', label: 'Đơn vị thời hạn', options: [
                            { value: 'Ngay', label: 'Ngày' },
                            { value: 'Thang', label: 'Tháng' },
                            { value: 'Nam', label: 'Năm' }
                        ], validation: { required: true }
                    },
                    {
                        name: 'popular', label: 'Gói phổ biến', type: 'radio', options: [
                            { value: 'true', label: 'Có' },
                            { value: 'false', label: 'Không' }
                        ]
                    },
                    {
                        name: 'kichHoat', label: 'Trạng thái', type: 'radio', options: [
                            { value: 'true', label: 'Kích hoạt' },
                            { value: 'false', label: 'Tạm ngưng' }
                        ], validation: { required: true }
                    }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {
                        const packageData = {
                            ...val,
                            donGia: parseInt(val.donGia),
                            giaGoc: val.giaGoc ? parseInt(val.giaGoc) : undefined,
                            thoiHan: parseInt(val.thoiHan),
                            soLuongNguoiThamGia: parseInt(val.soLuongNguoiThamGia),
                            kichHoat: val.kichHoat === 'true',
                            popular: val.popular === 'true'
                        };

                        if (editingItem) {
                            const updated = await api.put(`/api/goitap/${editingItem._id}`, packageData);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                            notifications.package.updateSuccess();
                        } else {
                            const created = await api.post('/api/goitap', packageData);
                            setRows([created, ...rows]);
                            notifications.package.createSuccess();
                        }
                    } catch (error) {
                        console.error('Error saving package:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
                        if (editingItem) {
                            notifications.package.updateError(errorMessage);
                        } else {
                            notifications.package.createError(errorMessage);
                        }
                    }
                    setShow(false);
                    setEditingItem(null);
                }}
            />}
            {deleteConfirm.show && deleteConfirm.item && <ConfirmModal
                title="Xác nhận xóa gói tập"
                message={`Bạn có chắc chắn muốn xóa gói tập "${deleteConfirm.item.tenGoiTap}"? Hành động này không thể hoàn tác.`}
                type="danger"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={async () => {
                    try {
                        await api.delete(`/api/goitap/${deleteConfirm.item!._id}`);
                        setRows(rows.filter(r => r._id !== deleteConfirm.item!._id));
                        notifications.package.deleteSuccess();
                    } catch (error) {
                        console.error('Error deleting package:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
                        notifications.package.deleteError(errorMessage);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}

            {/* Package Details Modal */}
            {viewingItem && (
                <div className="modal-overlay" onClick={() => setViewingItem(null)}>
                    <div className="modal-content package-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi tiết gói tập</h2>
                            <button className="close-btn" onClick={() => setViewingItem(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="package-detail-content">
                                <div className="package-profile-section">
                                    <div className="package-image-section">
                                        <div className="package-image">
                                            {viewingItem.hinhAnhDaiDien ? (
                                                <img src={viewingItem.hinhAnhDaiDien} alt={viewingItem.tenGoiTap} />
                                            ) : (
                                                <div className="package-image-placeholder">
                                                    {viewingItem.tenGoiTap.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="package-name-section">
                                        <h3>{viewingItem.tenGoiTap}</h3>
                                        <div className="package-status">
                                            <span className="package-status-badge">
                                                {viewingItem.kichHoat ? '🟢 Đang bán' : '🔴 Tạm ngưng'}
                                            </span>
                                            {viewingItem.popular && (
                                                <span className="package-status-badge popular-badge-inline">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 256 256"
                                                        style={{ marginRight: "4px" }}
                                                    >
                                                        <g transform="translate(1.4066 1.4066) scale(2.81 2.81)">
                                                            <path
                                                                d="M 36.17 47.162 c -0.035 -0.106 -0.069 -0.213 -0.103 -0.319 c -5.999 -18.815 3.815 -39.21 22.146 -46.558 C 58.454 0.188 58.696 0.093 58.938 0 c -8.181 21.836 15.423 38.412 15.423 60.801 C 74.361 77.993 59.681 90 45 90 S 15.639 77.993 15.639 60.801 c 0 -8.39 2.672 -17.725 7.291 -26.607 C 27.048 40.04 31.579 44.659 36.17 47.162 z"
                                                                fill="#ff641a"
                                                            />
                                                            <path
                                                                d="M 38.722 64.603 c -0.026 -0.063 -0.052 -0.126 -0.077 -0.189 c 10.823 -10.35 4.959 -26.605 10.45 -37.896 c 0.18 -0.057 -0.181 0.055 0 0 c -0.906 13.578 22.022 33.376 18.098 46.171 C 64.205 82.434 56.249 90 45.305 90 s -22.903 -7.267 -22.903 -17.459 c 0 -4.974 0 -13.002 3.498 -21.539 C 27.997 64.786 34.886 67.501 38.722 64.603 z"
                                                                fill="#ff9f00"
                                                            />
                                                            <path
                                                                d="M 67.325 51.854 c -0.012 -0.06 -0.034 -0.115 -0.051 -0.173 c -0.02 -0.067 -0.035 -0.135 -0.062 -0.2 c -0.028 -0.069 -0.067 -0.131 -0.103 -0.196 c -0.027 -0.049 -0.049 -0.101 -0.081 -0.148 c -0.147 -0.22 -0.335 -0.408 -0.555 -0.555 c -0.047 -0.032 -0.099 -0.053 -0.148 -0.081 c -0.065 -0.036 -0.127 -0.075 -0.196 -0.103 c -0.065 -0.027 -0.133 -0.042 -0.2 -0.062 c -0.058 -0.017 -0.113 -0.039 -0.173 -0.051 c -0.129 -0.026 -0.26 -0.039 -0.392 -0.039 H 52.9 c -1.104 0 -2 0.896 -2 2 s 0.896 2 2 2 h 7.636 l -14.3 14.3 l -9.69 -9.44 c -0.786 -0.766 -2.044 -0.755 -2.816 0.025 l -9.906 10.003 c -0.777 0.785 -0.771 2.051 0.014 2.828 c 0.785 0.778 2.05 0.77 2.828 -0.014 l 8.51 -8.594 l 9.683 9.435 c 0.389 0.379 0.892 0.567 1.396 0.567 c 0.512 0 1.024 -0.195 1.414 -0.586 l 15.695 -15.696 v 7.637 c 0 1.104 0.896 2 2 2 s 2 -0.896 2 -2 V 52.245 C 67.364 52.114 67.351 51.983 67.325 51.854 z"
                                                                fill="#f0feff"
                                                            />
                                                        </g>
                                                    </svg>
                                                    Phổ biến
                                                </span>
                                            )}

                                        </div>
                                    </div>
                                </div>

                                <div className="package-info-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tên gói tập</label>
                                            <input type="text" value={viewingItem.tenGoiTap} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label>Loại gói tập</label>
                                            <input type="text" value={
                                                viewingItem.loaiGoiTap === 'CaNhan' ? 'Cá nhân' :
                                                    viewingItem.loaiGoiTap === 'Nhom' ? 'Nhóm' : 'Công ty'
                                            } readOnly />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group price-input">
                                            <label>Đơn giá</label>
                                            <input
                                                type="text"
                                                value={`${viewingItem.donGia?.toLocaleString('vi-VN') || '0'} VNĐ`}
                                                readOnly
                                            />
                                        </div>
                                        {viewingItem.giaGoc && viewingItem.giaGoc > (viewingItem.donGia || 0) && (
                                            <div className="form-group original-price-input">
                                                <label>Giá gốc</label>
                                                <input
                                                    type="text"
                                                    value={`${viewingItem.giaGoc.toLocaleString('vi-VN')} VNĐ`}
                                                    readOnly
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Số lượng người tham gia</label>
                                            <input type="text" value={`${viewingItem.soLuongNguoiThamGia} người`} readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label>Loại thời hạn</label>
                                            <input type="text" value={
                                                viewingItem.loaiThoiHan === 'VinhVien' ? 'Vĩnh viễn' : 'Tính theo ngày từ khi đăng ký'
                                            } readOnly />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="duration-group">
                                            <div className="form-group">
                                                <label>Thời hạn</label>
                                                <input type="text" value={
                                                    viewingItem.loaiThoiHan === 'VinhVien' ? 'Vĩnh viễn' : viewingItem.thoiHan?.toString() || '0'
                                                } readOnly />
                                            </div>
                                            <div className="form-group">
                                                <label>Đơn vị</label>
                                                <input type="text" value={
                                                    viewingItem.loaiThoiHan === 'VinhVien' ? '' :
                                                        viewingItem.donViThoiHan === 'Ngày' ? 'Ngày' :
                                                            viewingItem.donViThoiHan === 'Tháng' ? 'Tháng' : 'Năm'
                                                } readOnly />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Trạng thái</label>
                                            <input
                                                type="text"
                                                value={viewingItem.kichHoat ? 'Đang bán' : 'Tạm ngưng'}
                                                className={viewingItem.kichHoat ? 'status-active' : 'status-inactive'}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group full-width" style={{ marginBottom: '24px' }}>
                                        <label>Mô tả gói tập</label>
                                        <textarea
                                            value={viewingItem.moTa || 'Chưa có mô tả'}
                                            readOnly
                                            rows={4}
                                        />
                                    </div>

                                    {viewingItem.ghiChu && (
                                        <div className="form-group full-width">
                                            <label>Ghi chú</label>
                                            <textarea
                                                value={viewingItem.ghiChu}
                                                readOnly
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    <div className="form-row date-info-row">
                                        <div className="form-group">
                                            <label>Ngày tạo</label>
                                            <input type="text" value={
                                                viewingItem.createdAt ?
                                                    new Date(viewingItem.createdAt).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'N/A'
                                            } readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label>Cập nhật lần cuối</label>
                                            <input type="text" value={
                                                viewingItem.updatedAt ?
                                                    new Date(viewingItem.updatedAt).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'N/A'
                                            } readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => setViewingItem(null)}>Đóng</Button>
                            <Button variant="primary" onClick={() => {
                                setEditingItem(viewingItem);
                                setViewingItem(null);
                            }}>Chỉnh sửa</Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

// Schedules Page
const SchedulesPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<LichTap | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: LichTap | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [members, setMembers] = useState<HoiVien[]>([]);
    const [pts, setPts] = useState<PT[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                // Fetch schedules, members, and PTs in parallel
                const [schedulesData, membersData, ptsData] = await Promise.all([
                    api.get('/api/lichtap'),
                    api.get('/api/user/hoivien'),
                    api.get('/api/user/pt')
                ]);

                if (mounted) {
                    // Set members data
                    if (Array.isArray(membersData)) {
                        setMembers(membersData);
                    }

                    // Set PTs data
                    if (Array.isArray(ptsData)) {
                        setPts(ptsData);
                    }

                    // Set schedules data
                    if (Array.isArray(schedulesData)) {
                        setRows(schedulesData);
                    } else if (schedulesData && typeof schedulesData === 'object') {
                        // If data is an object with an array property
                        const schedules = schedulesData.schedules || schedulesData.data || schedulesData.lichTap || [];
                        if (Array.isArray(schedules)) {
                            setRows(schedules);
                        }
                    }
                }
            } catch (e) {
                console.error('Error fetching data:', e);
                // Fallback mock data when API is not available
                const mockSchedules = [
                    {
                        _id: 'schedule_1',
                        hoiVien: 'Nguyễn Văn An',
                        pt: 'PT Minh',
                        ngayBatDau: new Date('2024-01-15'),
                        ngayKetThuc: new Date('2024-04-15'),
                        cacBuoiTap: ['session_1', 'session_2', 'session_3']
                    },
                    {
                        _id: 'schedule_2',
                        hoiVien: 'Trần Thị Bình',
                        pt: 'PT Lan',
                        ngayBatDau: new Date('2024-02-01'),
                        ngayKetThuc: new Date('2024-05-01'),
                        cacBuoiTap: ['session_4', 'session_5']
                    },
                    {
                        _id: 'schedule_3',
                        hoiVien: 'Lê Văn Cường',
                        pt: 'PT Tuấn',
                        ngayBatDau: new Date('2024-03-01'),
                        ngayKetThuc: new Date('2024-06-01'),
                        cacBuoiTap: ['session_6', 'session_7', 'session_8', 'session_9']
                    }
                ];
                if (mounted) setRows(mockSchedules);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const filtered = rows.filter(r => {
        const hoiVienName = r.hoiVien && typeof r.hoiVien === 'string' ? r.hoiVien.toLowerCase() : '';
        const ptName = typeof r.pt === 'object' ? r.pt?.hoTen || '' : r.pt || '';
        return hoiVienName.includes(q.toLowerCase()) ||
            ptName.toLowerCase().includes(q.toLowerCase());
    });

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý lịch tập</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm hội viên/PT" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <div className="table-enhanced">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Hội viên</th>
                            <th>PT</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Số buổi tập</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id}>
                                <td>
                                    {r.hoiVien && typeof r.hoiVien === 'object' ? (
                                        <div>
                                            <div className="user-name">{r.hoiVien.hoTen || 'Chưa có thông tin'}</div>
                                            {r.hoiVien.email && r.hoiVien.email !== 'N/A' && (
                                                <div className="user-email" style={{ fontSize: '12px', color: '#666' }}>{r.hoiVien.email}</div>
                                            )}
                                        </div>
                                    ) : (
                                        r.hoiVien || 'Hội viên không xác định'
                                    )}
                                </td>
                                <td>
                                    {typeof r.pt === 'object' ? (
                                        <div>
                                            <div className="user-name">{r.pt?.hoTen || 'N/A'}</div>
                                            {r.pt?.chuyenMon && r.pt.chuyenMon !== 'N/A' && (
                                                <div className="user-specialty" style={{ fontSize: '12px', color: '#666' }}>{r.pt.chuyenMon}</div>
                                            )}
                                        </div>
                                    ) : (
                                        r.pt || 'N/A'
                                    )}
                                </td>
                                <td>{r.ngayBatDau ? new Date(r.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>{r.ngayKetThuc ? new Date(r.ngayKetThuc).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>{Array.isArray(r.cacBuoiTap) ? r.cacBuoiTap.length : 0}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => setEditingItem(r)}>
                                            ✏️ Sửa
                                        </button>
                                        <button className="btn-icon btn-copy" onClick={() => { const copyData = { ...r }; delete (copyData as any)._id; setEditingItem(copyData); setIsCopying(true); setShow(true); }}>
                                            📋 Sao chép
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => setDeleteConfirm({ show: true, item: r })}>
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {(show || editingItem) && <EntityForm
                title="Lịch tập"
                initialData={editingItem || undefined}
                fields={[
                    {
                        name: 'hoiVien',
                        label: 'Hội viên',
                        validation: { required: true },
                        options: members.map(member => ({
                            value: member._id,
                            label: `${member.hoTen} - ${member.email}`
                        }))
                    },
                    {
                        name: 'pt',
                        label: 'PT',
                        validation: { required: true },
                        options: pts.map(pt => ({
                            value: pt._id,
                            label: `${pt.hoTen} - ${pt.chuyenMon || 'Chưa có chuyên môn'}`
                        }))
                    },
                    { name: 'ngayBatDau', label: 'Ngày bắt đầu', type: 'date', validation: { required: true } },
                    { name: 'ngayKetThuc', label: 'Ngày kết thúc', type: 'date', validation: { required: true } }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); setIsCopying(false); }}
                onSave={async (val) => {
                    try {
                        if (editingItem && !isCopying) {
                            // Update existing PT
                            const updated = await api.put(`/api/lichtap/${editingItem._id}`, val);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                        } else {
                            // Create new PT (including when copying)
                            const created = await api.post('/api/lichtap', val);
                            setRows([created, ...rows]);
                        }
                    } catch (error) {
                        console.error('Error saving schedule:', error);
                    }
                    setShow(false);
                    setEditingItem(null);
                    setIsCopying(false);
                }}
            />}
            {deleteConfirm.show && deleteConfirm.item && <ConfirmModal
                title="Xác nhận xóa lịch tập"
                message={`Bạn có chắc chắn muốn xóa lịch tập này? Hành động này không thể hoàn tác.`}
                type="danger"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={async () => {
                    try {
                        await api.delete(`/api/lichtap/${deleteConfirm.item!._id}`);
                        setRows(rows.filter(r => r._id !== deleteConfirm.item!._id));
                    } catch (error) {
                        console.error('Error deleting schedule:', error);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {isLoading && <Loading overlay text="Đang tải lịch tập..." />}
        </Card>
    );
};

const PTPage = () => {
    // Đóng menu khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.pt-menu')) {
                document.querySelectorAll('.pt-menu-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleViewDetail = async (pt: PT) => {
        try {
            setIsLoading(true);
            // Lấy lại thông tin PT mới nhất
            const latest = await api.get(`/api/user/pt/${pt._id}`);
            // Lấy lại trạng thái tài khoản mới nhất
            let taiKhoan = null;
            try {
                taiKhoan = await api.get(`/api/user/taikhoan/by-phone/${latest.sdt}`);
            } catch { }
            setViewingDetail({ ...latest, taiKhoan });
        } catch (e) {
            setViewingDetail(pt);
        } finally {
            setIsLoading(false);
        }
    };
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<PT | null>(null);
    const notifications = useCrudNotifications();
    const [isCopying, setIsCopying] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: PT | null }>({ show: false, item: null });
    const [viewingDetail, setViewingDetail] = useState<PT | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<PT[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [chiNhanhs, setChiNhanhs] = useState<ChiNhanh[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterChuyenMon, setFilterChuyenMon] = useState<string>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
    const [selectedPTs, setSelectedPTs] = useState<Set<string>>(new Set());
    const [showChangeBranchModal, setShowChangeBranchModal] = useState(false);
    const [newBranchId, setNewBranchId] = useState<string>('');
    const [isUpdatingBranch, setIsUpdatingBranch] = useState(false);
    const [branchSortConfig, setBranchSortConfig] = useState<{ key: 'count'; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig(null);
            return;
        }
        setSortConfig({ key, direction });
    };

    const sortedRows = React.useMemo(() => {
        if (!sortConfig) return rows;

        return [...rows].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortConfig.key) {
                case 'hoTen':
                    aValue = a.hoTen?.toLowerCase() || '';
                    bValue = b.hoTen?.toLowerCase() || '';
                    break;
                case 'ngayVaoLam':
                    aValue = new Date(a.ngayVaoLam || 0).getTime();
                    bValue = new Date(b.ngayVaoLam || 0).getTime();
                    break;
                case 'danhGia':
                    aValue = a.danhGia || 0;
                    bValue = b.danhGia || 0;
                    break;
                case 'kinhNghiem':
                    aValue = a.kinhNghiem || 0;
                    bValue = b.kinhNghiem || 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rows, sortConfig]);

    const handleRowClick = (pt: any) => {
        setViewingDetail(pt);
    };

    // Search PTs
    const handleSearch = async (query: string) => {
        setIsLoading(true);
        try {
            const data = await api.get<PT[]>(`/api/user/pt?q=${query}`);
            if (Array.isArray(data)) {
                const ptsWithAccounts = await Promise.all(
                    data.map(async (pt) => {
                        try {
                            const taiKhoanData = await api.get(`/api/user/taikhoan/by-phone/${pt.sdt}`);
                            return {
                                ...pt,
                                taiKhoan: taiKhoanData || null
                            };
                        } catch (error) {
                            return {
                                ...pt,
                                taiKhoan: null
                            };
                        }
                    })
                );
                setRows(ptsWithAccounts);
            } else {
                setRows([]);
            }
        } catch (e) {
            console.error('Error searching PTs:', e);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Load Chi nhánh
    const fetchChiNhanhs = async () => {
        try {
            const response = await api.get<{ success: boolean; data: ChiNhanh[] }>('/api/chinhanh');
            if (response.success && Array.isArray(response.data)) {
                setChiNhanhs(response.data);
            }
        } catch (e) {
            console.error('Error fetching chi nhánh:', e);
        }
    };

    // Load PTs
    const fetchPTs = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<PT[]>('/api/user/pt');
            if (Array.isArray(data)) {
                const ptsWithAccounts = await Promise.all(
                    data.map(async (pt) => {
                        try {
                            const taiKhoanData = await api.get(`/api/user/taikhoan/by-phone/${pt.sdt}`);
                            return {
                                ...pt,
                                taiKhoan: taiKhoanData || null
                            };
                        } catch (error) {
                            return {
                                ...pt,
                                taiKhoan: null
                            };
                        }
                    })
                );
                setRows(ptsWithAccounts);
            } else {
                setRows([]);
            }
        } catch (e) {
            console.error('Error fetching PTs:', e);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Change account status
    const handleChangeAccountStatus = async (ptId: string, newStatus: 'DANG_HOAT_DONG' | 'DA_KHOA') => {
        try {
            setIsChangingStatus(ptId);

            if (newStatus === 'DA_KHOA') {
                await api.put(`/api/user/taikhoan/${ptId}/lock`);
            } else {
                await api.put(`/api/user/taikhoan/${ptId}/unlock`);
            }

            // Update PTs
            setRows(rows.map(pt =>
                pt._id === ptId
                    ? {
                        ...pt,
                        taiKhoan: {
                            ...pt.taiKhoan,
                            trangThaiTK: newStatus
                        }
                    }
                    : pt
            ));

            // Update viewingDetail
            setViewingDetail(prev =>
                prev && prev._id === ptId
                    ? {
                        ...prev,
                        taiKhoan: {
                            ...prev.taiKhoan,
                            trangThaiTK: newStatus
                        }
                    }
                    : prev
            );

            // Update editingItem if currently editing this PT
            setEditingItem(prev =>
                prev && prev._id === ptId
                    ? {
                        ...prev,
                        taiKhoan: {
                            ...prev.taiKhoan,
                            trangThaiTK: newStatus
                        }
                    }
                    : prev
            );

            setRefreshTrigger(prev => prev + 1);
            notifications.generic.success(`Tài khoản PT đã được ${newStatus === 'DA_KHOA' ? 'khóa' : 'mở khóa'} thành công!`);
        } catch (error) {
            console.error('Error changing PT account status:', error);
            notifications.generic.error('Có lỗi xảy ra', 'Không thể thay đổi trạng thái tài khoản PT!');
        } finally {
            setIsChangingStatus(null);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await Promise.all([fetchPTs(), fetchChiNhanhs()]);
        })();
        return () => { mounted = false; };
    }, [refreshTrigger]);

    // Filter sorted rows based on search query, branch, status, and chuyenMon
    const filtered = sortedRows.filter(r => {
        // Search filter
        if (q.trim()) {
            const searchTerm = q.toLowerCase().trim();
            const matchesSearch = (
                (r.hoTen && r.hoTen.toLowerCase().includes(searchTerm)) ||
                (r.email && r.email.toLowerCase().includes(searchTerm)) ||
                (r.sdt && r.sdt.toLowerCase().includes(searchTerm)) ||
                (r.chuyenMon && r.chuyenMon.toLowerCase().includes(searchTerm)) ||
                (r.bangCapChungChi && r.bangCapChungChi.toLowerCase().includes(searchTerm))
            );
            if (!matchesSearch) return false;
        }

        // Branch filter
        if (selectedBranch !== 'all') {
            const ptBranchId = r.chinhanh ? String(r.chinhanh) : null;
            const selectedBranchId = String(selectedBranch);
            if (!ptBranchId || ptBranchId !== selectedBranchId) return false;
        }

        // Status filter
        if (filterStatus !== 'all') {
            const ptStatus = r.taiKhoan?.trangThaiTK || 'DANG_HOAT_DONG';
            if (filterStatus === 'DANG_HOAT_DONG' && ptStatus !== 'DANG_HOAT_DONG') return false;
            if (filterStatus === 'DA_KHOA' && ptStatus !== 'DA_KHOA') return false;
            if (filterStatus === 'NGUNG_LAM_VIEC' && r.trangThaiPT !== 'NGUNG_LAM_VIEC') return false;
        }

        // Chuyên môn filter
        if (filterChuyenMon !== 'all') {
            if (!r.chuyenMon || !r.chuyenMon.toLowerCase().includes(filterChuyenMon.toLowerCase())) return false;
        }

        return true;
    });

    // Group PTs by branch
    const groupedByBranch = React.useMemo(() => {
        const grouped: { [key: string]: PT[] } = {};

        filtered.forEach(pt => {
            const branchId = pt.chinhanh ? String(pt.chinhanh) : 'no-branch';
            if (!grouped[branchId]) {
                grouped[branchId] = [];
            }
            grouped[branchId].push(pt);
        });

        return grouped;
    }, [filtered]);

    // Toggle branch expansion
    const toggleBranch = (branchId: string) => {
        setExpandedBranches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(branchId)) {
                newSet.delete(branchId);
            } else {
                newSet.add(branchId);
            }
            return newSet;
        });
    };

    // Get branch name
    const getBranchName = (branchId: string) => {
        if (branchId === 'no-branch') return 'Chưa có chi nhánh';
        const branch = chiNhanhs.find(b => b._id === branchId);
        return branch ? branch.tenChiNhanh : 'Chưa có chi nhánh';
    };

    // Get all unique chuyen mon values for filter
    const chuyenMonOptions = React.useMemo(() => {
        const chuyenMonSet = new Set<string>();
        rows.forEach(pt => {
            if (pt.chuyenMon) {
                // Split by comma and add each specialty
                pt.chuyenMon.split(',').forEach(cm => {
                    const trimmed = cm.trim().toLowerCase();
                    if (trimmed) chuyenMonSet.add(cm.trim());
                });
            }
        });
        return Array.from(chuyenMonSet).sort();
    }, [rows]);

    // Handle apply filters
    const handleApplyFilters = () => {
        // Filters are already applied via state, this is for UI consistency
        setShowFilterMenu(false);
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setSelectedBranch('all');
        setFilterStatus('all');
        setFilterChuyenMon('all');
        setQ('');
        setSortConfig(null);
        setBranchSortConfig(null);
        setShowFilterMenu(false);
    };

    // Toggle select PT
    const toggleSelectPT = (ptId: string) => {
        setSelectedPTs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ptId)) {
                newSet.delete(ptId);
            } else {
                newSet.add(ptId);
            }
            return newSet;
        });
    };

    // Toggle select all PTs in a branch
    const toggleSelectAllPTsInBranch = (branchId: string) => {
        const ptsInBranch = groupedByBranch[branchId] || [];
        const allSelected = ptsInBranch.every(pt => selectedPTs.has(pt._id));

        setSelectedPTs(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                // Deselect all
                ptsInBranch.forEach(pt => newSet.delete(pt._id));
            } else {
                // Select all
                ptsInBranch.forEach(pt => newSet.add(pt._id));
            }
            return newSet;
        });
    };

    // Check if all PTs in branch are selected
    const areAllPTsInBranchSelected = (branchId: string) => {
        const ptsInBranch = groupedByBranch[branchId] || [];
        return ptsInBranch.length > 0 && ptsInBranch.every(pt => selectedPTs.has(pt._id));
    };

    // Check if some PTs in branch are selected
    const areSomePTsInBranchSelected = (branchId: string) => {
        const ptsInBranch = groupedByBranch[branchId] || [];
        return ptsInBranch.some(pt => selectedPTs.has(pt._id));
    };

    // Handle change branch for selected PTs
    const handleChangeBranchForSelected = async () => {
        if (selectedPTs.size === 0 || !newBranchId) {
            notifications.generic.error('Lỗi', 'Vui lòng chọn ít nhất một PT và một chi nhánh mới!');
            return;
        }

        setIsUpdatingBranch(true);
        try {
            const ptIds = Array.from(selectedPTs);
            const updatePromises = ptIds.map(ptId =>
                api.put(`/api/user/pt/${ptId}`, { chinhanh: newBranchId })
            );

            await Promise.all(updatePromises);

            // Update local state
            setRows(rows.map(pt =>
                selectedPTs.has(pt._id)
                    ? { ...pt, chinhanh: newBranchId }
                    : pt
            ));

            // Clear selection and close modal
            setSelectedPTs(new Set());
            setShowChangeBranchModal(false);
            setNewBranchId('');
            setRefreshTrigger(prev => prev + 1);

            notifications.generic.success('Thành công', `Đã cập nhật chi nhánh cho ${ptIds.length} huấn luyện viên!`);
        } catch (error) {
            console.error('Error updating branch for PTs:', error);
            notifications.generic.error('Lỗi', 'Không thể cập nhật chi nhánh cho các PT đã chọn!');
        } finally {
            setIsUpdatingBranch(false);
        }
    };

    return (
        <div className="members-management-page">
            {/* Page Header */}
            <div className="members-page-header">
                <div className="members-page-header-content">
                    <h1 className="members-page-title">Quản lý huấn luyện viên</h1>
                    <p className="members-page-description">
                        Theo dõi thông tin, trạng thái và chi nhánh của tất cả huấn luyện viên Billions Fitness & Gym.
                    </p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="members-filter-toolbar">
                <button
                    className="members-filter-icon-btn"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                    🔽
                </button>
                <select
                    className="members-filter-dropdown"
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                >
                    <option value="all">CHI NHÁNH</option>
                    {chiNhanhs.map(branch => (
                        <option key={branch._id} value={branch._id}>
                            {branch.tenChiNhanh}
                        </option>
                    ))}
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="all">TRẠNG THÁI</option>
                    <option value="DANG_HOAT_DONG">Đang hoạt động</option>
                    <option value="DA_KHOA">Đã khóa</option>
                    <option value="NGUNG_LAM_VIEC">Ngừng làm việc</option>
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterChuyenMon}
                    onChange={e => setFilterChuyenMon(e.target.value)}
                >
                    <option value="all">CHUYÊN MÔN</option>
                    {chuyenMonOptions.map(cm => (
                        <option key={cm} value={cm}>{cm}</option>
                    ))}
                </select>
                <input
                    className="members-filter-search"
                    type="text"
                    placeholder="Tìm theo tên, SĐT, email..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <select
                    className="members-filter-dropdown"
                    value={
                        branchSortConfig
                            ? `branch-count-${branchSortConfig.direction}`
                            : (sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : 'none')
                    }
                    onChange={e => {
                        const value = e.target.value;
                        if (value === 'none') {
                            setSortConfig(null);
                            setBranchSortConfig(null);
                        } else if (value.startsWith('branch-count-')) {
                            const direction = value.split('-')[2] as 'asc' | 'desc';
                            setBranchSortConfig({ key: 'count', direction });
                            setSortConfig(null);
                        } else {
                            const [key, direction] = value.split('-');
                            setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                            setBranchSortConfig(null);
                        }
                    }}
                >
                    <option value="none">SẮP XẾP</option>
                    <option value="branch-count-desc">Số lượng PT: Nhiều nhất</option>
                    <option value="branch-count-asc">Số lượng PT: Ít nhất</option>
                    <option value="hoTen-asc">Tên: A → Z</option>
                    <option value="hoTen-desc">Tên: Z → A</option>
                    <option value="ngayVaoLam-desc">Ngày vào làm: Mới nhất</option>
                    <option value="ngayVaoLam-asc">Ngày vào làm: Cũ nhất</option>
                    <option value="kinhNghiem-desc">Kinh nghiệm: Cao nhất</option>
                    <option value="kinhNghiem-asc">Kinh nghiệm: Thấp nhất</option>
                    <option value="danhGia-desc">Đánh giá: Cao nhất</option>
                    <option value="danhGia-asc">Đánh giá: Thấp nhất</option>
                </select>
                <button className="members-filter-apply-btn" onClick={handleApplyFilters}>
                    APPLY
                </button>
                <button className="members-filter-clear-btn" onClick={handleClearFilters}>
                    CLEAR
                </button>
            </div>

            {/* Action Buttons */}
            <div className="members-page-actions">
                {selectedPTs.size > 0 && (
                    <button
                        className="members-change-branch-btn"
                        onClick={() => setShowChangeBranchModal(true)}
                    >
                        <span>📍</span> Thay đổi chi nhánh ({selectedPTs.size})
                    </button>
                )}
                <button className="members-add-btn" onClick={() => setShow(true)}>
                    <span>+</span> Thêm huấn luyện viên
                </button>
            </div>

            {/* Branch Sections with PT Cards */}
            <div className="pt-branches-container">
                {Object.keys(groupedByBranch).length === 0 ? (
                    <div className="pt-empty-state">
                        <p>Không tìm thấy huấn luyện viên nào.</p>
                    </div>
                ) : (
                    Object.keys(groupedByBranch)
                        .sort((a, b) => {
                            // If sorting by PT count
                            if (branchSortConfig) {
                                const countA = groupedByBranch[a]?.length || 0;
                                const countB = groupedByBranch[b]?.length || 0;

                                // Always put no-branch last
                                if (a === 'no-branch') return 1;
                                if (b === 'no-branch') return -1;

                                // Sort by count
                                if (branchSortConfig.direction === 'desc') {
                                    return countB - countA; // Descending: more PTs first
                                } else {
                                    return countA - countB; // Ascending: fewer PTs first
                                }
                            }

                            // Default sort: no-branch last, then alphabetically
                            if (a === 'no-branch') return 1;
                            if (b === 'no-branch') return -1;
                            return getBranchName(a).localeCompare(getBranchName(b));
                        })
                        .map(branchId => {
                            const ptsInBranch = groupedByBranch[branchId];
                            const isExpanded = expandedBranches.has(branchId);
                            const branchName = getBranchName(branchId);

                            return (
                                <div key={branchId} className="pt-branch-section">
                                    <div
                                        className="pt-branch-header"
                                    >
                                        <div className="pt-branch-header-left" onClick={() => toggleBranch(branchId)}>
                                            <span className="pt-branch-icon">{isExpanded ? '▼' : '▶'}</span>
                                            <h3 className="pt-branch-name">{branchName}</h3>
                                            <span className="pt-branch-count">({ptsInBranch.length})</span>
                                        </div>
                                        {isExpanded && (
                                            <div className="pt-branch-header-right" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={areAllPTsInBranchSelected(branchId)}
                                                    ref={(input) => {
                                                        if (input) input.indeterminate = areSomePTsInBranchSelected(branchId) && !areAllPTsInBranchSelected(branchId);
                                                    }}
                                                    onChange={() => toggleSelectAllPTsInBranch(branchId)}
                                                    className="pt-branch-checkbox"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="pt-branch-cards-wrapper">
                                            <div className="pt-cards-grid">
                                                {ptsInBranch.map(pt => (
                                                    <div key={pt._id} className="pt-card">
                                                        <div className="pt-card-checkbox-wrapper">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPTs.has(pt._id)}
                                                                onChange={() => toggleSelectPT(pt._id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="pt-card-checkbox"
                                                            />
                                                        </div>
                                                        <div className="pt-card-header">
                                                            <div className="pt-avatar">
                                                                {pt.anhDaiDien ? (
                                                                    <img src={pt.anhDaiDien} alt={pt.hoTen} className="pt-avatar-img" />
                                                                ) : (
                                                                    <div className="pt-avatar-placeholder">
                                                                        {pt.hoTen.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="pt-info">
                                                                <h3 className="pt-name">{pt.hoTen}</h3>
                                                                <p className="pt-phone">{pt.sdt}</p>
                                                            </div>
                                                            <div className="pt-menu">
                                                                <button
                                                                    className="pt-menu-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Đóng tất cả menu khác trước
                                                                        document.querySelectorAll('.pt-menu-dropdown.show').forEach(dropdown => {
                                                                            dropdown.classList.remove('show');
                                                                        });

                                                                        const menu = e.currentTarget.nextElementSibling;
                                                                        if (menu) {
                                                                            menu.classList.toggle('show');
                                                                        }
                                                                    }}
                                                                >
                                                                    ⋯
                                                                </button>
                                                                <div className="pt-menu-dropdown">
                                                                    <button
                                                                        className="pt-menu-item"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleViewDetail(pt);
                                                                        }}
                                                                    >
                                                                        👁️ Xem chi tiết
                                                                    </button>
                                                                    <button
                                                                        className="pt-menu-item"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingItem(pt);
                                                                        }}
                                                                    >
                                                                        ✏️ Sửa
                                                                    </button>
                                                                    <button
                                                                        className="pt-menu-item pt-menu-delete"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteConfirm({ show: true, item: pt });
                                                                        }}
                                                                    >
                                                                        🗑️ Xóa
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="pt-card-divider"></div>

                                                        <div className="pt-card-details">
                                                            <div className="pt-detail-item">
                                                                <span className="pt-detail-label">Chuyên môn:</span>
                                                                <span className="pt-detail-value">{pt.chuyenMon}</span>
                                                            </div>
                                                            <div className="pt-detail-item">
                                                                <span className="pt-detail-label">Kinh nghiệm:</span>
                                                                <span className="pt-detail-value">{pt.kinhNghiem} năm</span>
                                                            </div>
                                                            <div className="pt-detail-item">
                                                                <span className="pt-detail-label">Đánh giá:</span>
                                                                <span className="pt-detail-value">
                                                                    <Rating
                                                                        rating={pt.danhGia || 0}
                                                                        size="small"
                                                                        readonly={true}
                                                                    />
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="pt-card-divider"></div>

                                                        <div className="pt-card-actions">
                                                            <button
                                                                className="pt-action-btn pt-action-disable"
                                                                data-status={pt.taiKhoan?.trangThaiTK || 'DANG_HOAT_DONG'}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const currentStatus = pt.taiKhoan?.trangThaiTK || 'DANG_HOAT_DONG';
                                                                    const newStatus = currentStatus === 'DANG_HOAT_DONG' ? 'DA_KHOA' : 'DANG_HOAT_DONG';
                                                                    handleChangeAccountStatus(pt._id, newStatus as 'DANG_HOAT_DONG' | 'DA_KHOA');
                                                                }}
                                                                disabled={isChangingStatus === pt._id || !pt.taiKhoan?._id}
                                                            >
                                                                {pt.taiKhoan?.trangThaiTK === 'DANG_HOAT_DONG' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                            </button>
                                                            <button
                                                                className="pt-action-btn pt-action-view"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewDetail(pt);
                                                                }}
                                                            >
                                                                Xem hồ sơ
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )}
            </div>
            {(show || editingItem) && <EntityForm
                title="Huấn luyện viên"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'hoTen', label: 'Họ tên', validation: { required: true, pattern: /^[\p{L}\s]+$/u, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' } },
                    { name: 'email', label: 'Email (tùy chọn)', type: 'email', validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không đúng định dạng' } },
                    { name: 'sdt', label: 'Số điện thoại', type: 'tel', validation: { required: true, pattern: /^\d{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' } },
                    { name: 'soCCCD', label: 'Số CCCD', validation: { required: true, pattern: /^\d{12}$/, message: 'Số CCCD phải có đúng 12 chữ số' } },
                    { name: 'ngaySinh', label: 'Ngày sinh', type: 'date', validation: { required: true } },
                    { name: 'gioiTinh', label: 'Giới tính', type: 'radio', options: ['Nam', 'Nữ'], validation: { required: true } },
                    { name: 'diaChi', label: 'Địa chỉ', type: 'textarea', validation: { required: true } },
                    {
                        name: 'chinhanh',
                        label: 'Chi nhánh',
                        type: 'select',
                        options: chiNhanhs.map(cn => ({ value: cn._id, label: cn.tenChiNhanh })),
                        validation: { required: true }
                    },
                    { name: 'chuyenMon', label: 'Chuyên môn', validation: { required: true } },
                    { name: 'kinhNghiem', label: 'Kinh nghiệm (năm)', type: 'number', validation: { required: true, pattern: /^\d+$/, message: 'Kinh nghiệm phải là số nguyên dương' } },
                    { name: 'bangCapChungChi', label: 'Bằng cấp/Chứng chỉ', validation: { required: true } },
                    { name: 'moTa', label: 'Mô tả', type: 'textarea' },
                    ...(editingItem ? [{
                        name: 'trangThaiPT', label: 'Trạng thái', type: 'radio', options: [
                            { value: 'DANG_HOAT_DONG', label: 'Đang Hoạt Động' },
                            { value: 'NGUNG_LAM_VIEC', label: 'Ngừng Làm Việc' }
                        ], validation: { required: true }
                    }] : []),
                    { name: 'anhDaiDien', label: 'Ảnh đại diện (tùy chọn)', type: 'file', validation: { maxSize: 5 } },
                ]}
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {

                        const ptData: any = {
                            hoTen: val.hoTen,
                            ngaySinh: val.ngaySinh,
                            gioiTinh: val.gioiTinh,
                            sdt: val.sdt,
                            ...(val.soCCCD && { soCCCD: val.soCCCD }),
                            ...(val.diaChi && { diaChi: val.diaChi }),
                            ...(val.anhDaiDien && { anhDaiDien: val.anhDaiDien }),
                            chinhanh: val.chinhanh,
                            chuyenMon: val.chuyenMon,
                            bangCapChungChi: val.bangCapChungChi,
                            kinhNghiem: parseInt(val.kinhNghiem) || 0,
                            ngayVaoLam: new Date().toISOString(),
                            ...(val.moTa && { moTa: val.moTa }),
                            trangThaiPT: editingItem ? (val.trangThaiPT || 'DANG_HOAT_DONG') : 'DANG_HOAT_DONG'
                        };

                        // Add email only if it's a valid, non-empty string
                        if (val.email && typeof val.email === 'string' && val.email.trim() !== '') {
                            ptData.email = val.email.trim();
                        }

                        if (editingItem) {
                            // When updating, do not change the start date but can change the status
                            const updateData = { ...ptData };
                            delete updateData.ngayVaoLam; // Remove start date from update data
                            const updated = await api.put(`/api/user/pt/${editingItem._id}`, updateData);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                            notifications.trainer.updateSuccess();
                        } else {
                            const created = await api.post('/api/user/pt', ptData);
                            // Refresh data to get taiKhoan information
                            setRefreshTrigger(prev => prev + 1);
                            notifications.trainer.createSuccess();
                        }
                    } catch (error) {
                        console.error('Error saving PT:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
                        if (editingItem) {
                            notifications.trainer.updateError(errorMessage);
                        } else {
                            notifications.trainer.createError(errorMessage);
                        }
                    }
                    setShow(false);
                    setEditingItem(null);
                }}
            />}
            {deleteConfirm.show && deleteConfirm.item && <ConfirmModal
                title="Xác nhận xóa huấn luyện viên"
                message={`Bạn có chắc chắn muốn xóa huấn luyện viên "${deleteConfirm.item.hoTen}"? Hành động này không thể hoàn tác.`}
                type="danger"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={async () => {
                    try {
                        await api.delete(`/api/user/pt/${deleteConfirm.item!._id}`);
                        setRows(rows.filter(r => r._id !== deleteConfirm.item!._id));
                        notifications.trainer.deleteSuccess();
                    } catch (error) {
                        console.error('Error deleting PT:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
                        notifications.trainer.deleteError(errorMessage);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {showChangeBranchModal && (
                <div className="modal-overlay" onClick={() => setShowChangeBranchModal(false)}>
                    <div className="change-branch-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Thay đổi chi nhánh</h2>
                            <button className="modal-close" onClick={() => setShowChangeBranchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="change-branch-info">
                                Bạn đã chọn <strong>{selectedPTs.size}</strong> huấn luyện viên. Vui lòng chọn chi nhánh mới:
                            </p>
                            <div className="form-group">
                                <label>Chi nhánh mới</label>
                                <select
                                    className="form-select"
                                    value={newBranchId}
                                    onChange={e => setNewBranchId(e.target.value)}
                                >
                                    <option value="">-- Chọn chi nhánh --</option>
                                    {chiNhanhs.map(branch => (
                                        <option key={branch._id} value={branch._id}>
                                            {branch.tenChiNhanh}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowChangeBranchModal(false);
                                    setNewBranchId('');
                                }}
                                disabled={isUpdatingBranch}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleChangeBranchForSelected}
                                disabled={isUpdatingBranch || !newBranchId}
                            >
                                {isUpdatingBranch ? 'Đang cập nhật...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewingDetail && (
                <PTDetailModal
                    pt={viewingDetail}
                    chiNhanhs={chiNhanhs}
                    onClose={() => setViewingDetail(null)}
                />
            )}
            {isLoading && <Loading overlay text="Đang tải PT..." />}
        </div>
    );
};

// Sessions Page
const SessionsPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<BuoiTap | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: BuoiTap | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<BuoiTap[]>([]);
    const [chiNhanhs, setChiNhanhs] = useState<ChiNhanh[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
    const notifications = useCrudNotifications();

    // Fetch chi nhánh
    const fetchChiNhanhs = async () => {
        try {
            const response = await api.get<{ success: boolean; data: ChiNhanh[] }>('/api/chinhanh');
            if (response.success && Array.isArray(response.data)) {
                setChiNhanhs(response.data);
            }
        } catch (e) {
            console.error('Error fetching chi nhánh:', e);
        }
    };

    // Fetch buổi tập
    const fetchBuoiTap = async () => {
        try {
            setIsLoading(true);
            const data = await api.get<BuoiTap[]>('/api/buoitap');
            if (Array.isArray(data)) {
                setRows(data);
            }
        } catch (e) {
            console.error('Error fetching sessions:', e);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await Promise.all([fetchBuoiTap(), fetchChiNhanhs()]);
        })();
        return () => { mounted = false; };
    }, []);

    // Helper functions
    const getPTName = (session: BuoiTap): string => {
        if (typeof session.ptPhuTrach === 'object') {
            return session.ptPhuTrach?.hoTen || 'N/A';
        }
        if (session.ptPhuTrach) {
            return session.ptPhuTrach;
        }
        return 'N/A';
    };

    const getBranchName = (session: BuoiTap): string => {
        if (typeof session.chiNhanh === 'object') {
            return session.chiNhanh?.tenChiNhanh || 'Chưa có chi nhánh';
        }
        if (session.chiNhanh) {
            const branch = chiNhanhs.find(cn => cn._id === session.chiNhanh);
            return branch?.tenChiNhanh || 'Chưa có chi nhánh';
        }
        return 'Chưa có chi nhánh';
    };

    const getBranchId = (session: BuoiTap): string => {
        if (typeof session.chiNhanh === 'object') {
            return session.chiNhanh?._id || 'no-branch';
        }
        return session.chiNhanh || 'no-branch';
    };

    const getSoBaiTap = (session: BuoiTap): number => {
        if (!session.cacBaiTap) return 0;
        if (Array.isArray(session.cacBaiTap)) {
            return session.cacBaiTap.length;
        }
        return 0;
    };

    const getTrangThaiDisplay = (session: BuoiTap): { text: string; class: string } => {
        if (session.trangThai === 'HOAN_THANH') {
            return { text: 'HOÀN THÀNH', class: 'completed' };
        }
        if (session.trangThai === 'HUY') {
            return { text: 'ĐÃ HỦY', class: 'cancelled' };
        }
        if (session.trangThai === 'DANG_DIEN_RA') {
            return { text: 'ĐANG DIỄN RA', class: 'in-progress' };
        }
        if (session.trangThaiTap === 'DA_HOAN_THANH') {
            return { text: 'HOÀN THÀNH', class: 'completed' };
        }
        return { text: 'CHƯA HOÀN THÀNH', class: 'pending' };
    };

    const formatNgayTap = (ngayTap: Date | string | undefined): string => {
        if (!ngayTap) return 'N/A';
        try {
            const date = typeof ngayTap === 'string' ? new Date(ngayTap) : ngayTap;
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    // Filter sessions
    const filtered = rows.filter(r => {
        // Search filter
        if (q.trim()) {
            const searchTerm = q.toLowerCase().trim();
            const ptName = getPTName(r).toLowerCase();
            const branchName = getBranchName(r).toLowerCase();
            const tenBuoiTap = (r.tenBuoiTap || '').toLowerCase();
            if (!ptName.includes(searchTerm) && !branchName.includes(searchTerm) && !tenBuoiTap.includes(searchTerm)) {
                return false;
            }
        }

        // Branch filter
        if (selectedBranch !== 'all') {
            const branchId = getBranchId(r);
            if (String(branchId) !== String(selectedBranch)) return false;
        }

        return true;
    });

    // Group sessions by branch
    const groupedByBranch = React.useMemo(() => {
        const grouped: { [key: string]: BuoiTap[] } = {};

        filtered.forEach(session => {
            const branchId = getBranchId(session);
            if (!grouped[branchId]) {
                grouped[branchId] = [];
            }
            grouped[branchId].push(session);
        });

        return grouped;
    }, [filtered, chiNhanhs]);

    // Toggle branch expansion
    const toggleBranch = (branchId: string) => {
        setExpandedBranches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(branchId)) {
                newSet.delete(branchId);
            } else {
                newSet.add(branchId);
            }
            return newSet;
        });
    };

    // Get branch name for display
    const getBranchDisplayName = (branchId: string) => {
        if (branchId === 'no-branch') return 'Chưa có chi nhánh';
        const branch = chiNhanhs.find(b => b._id === branchId);
        return branch ? branch.tenChiNhanh : 'Chưa có chi nhánh';
    };

    // Calendar functions
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameDate = (date1: Date, date2: Date) => {
        return date1.toDateString() === date2.toDateString();
    };

    const hasSessionsOnDate = (date: Date) => {
        return filtered.some(session => {
            const sessionDate = new Date(session.ngayTap);
            return isSameDate(sessionDate, date);
        });
    };

    const getSessionsForDate = (date: Date) => {
        return filtered.filter(session => {
            const sessionDate = new Date(session.ngayTap);
            return isSameDate(sessionDate, date);
        });
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '';
        if (typeof timeString === 'string' && timeString.includes(':')) {
            return timeString;
        }
        try {
            return new Date(timeString).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return timeString;
        }
    };

    return (
        <div className="sessions-management-page">
            {/* Page Header */}
            <div className="sessions-page-header">
                <div className="sessions-page-header-content">
                    <h1 className="sessions-page-title">Quản lý buổi tập</h1>
                    <p className="sessions-page-description">
                        Theo dõi và quản lý các buổi tập từ tất cả chi nhánh của Billions Fitness & Gym.
                    </p>
                </div>
                <div className="sessions-page-actions">
                    <button className="sessions-search-pt-btn" onClick={() => {
                        const searchInput = document.querySelector('.sessions-search-input') as HTMLInputElement;
                        if (searchInput) searchInput.focus();
                    }}>
                        Tìm PT
                    </button>
                    <button className="sessions-create-btn" onClick={() => setShow(true)}>
                        Tạo mới
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="members-filter-toolbar">
                <select
                    className="members-filter-dropdown"
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                >
                    <option value="all">CHI NHÁNH</option>
                    {chiNhanhs.map(branch => (
                        <option key={branch._id} value={branch._id}>
                            {branch.tenChiNhanh}
                        </option>
                    ))}
                </select>
                <input
                    className="members-filter-search"
                    type="text"
                    placeholder="Tìm theo tên PT, chi nhánh, tên buổi tập..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
            </div>

            {/* Calendar and Sessions Layout */}
            <div className="sessions-main-layout">
                {/* Calendar Sidebar */}
                <div className="sessions-calendar-sidebar">
                    <div className="mini-calendar">
                        <div className="calendar-header">
                            <button
                                onClick={() => {
                                    const newMonth = new Date(currentMonth);
                                    newMonth.setMonth(currentMonth.getMonth() - 1);
                                    setCurrentMonth(newMonth);
                                }}
                                className="nav-button"
                            >
                                ‹
                            </button>
                            <h3>{currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h3>
                            <button
                                onClick={() => {
                                    const newMonth = new Date(currentMonth);
                                    newMonth.setMonth(currentMonth.getMonth() + 1);
                                    setCurrentMonth(newMonth);
                                }}
                                className="nav-button"
                            >
                                ›
                            </button>
                        </div>
                        <div className="weekdays-header">
                            {weekDays.map(day => (
                                <div key={day} className="weekday">{day}</div>
                            ))}
                        </div>
                        <div className="calendar-grid">
                            {getDaysInMonth().map((day, index) => {
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                const isSelected = isSameDate(day, selectedDate);
                                const isCurrentDay = isToday(day);
                                const hasSessions = hasSessionsOnDate(day);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            calendar-day
                                            ${isCurrentMonth ? 'current-month' : 'other-month'}
                                            ${isSelected ? 'selected' : ''}
                                            ${isCurrentDay ? 'today' : ''}
                                            ${hasSessions ? 'has-sessions' : ''}
                                        `}
                                    >
                                        {day.getDate()}
                                        {hasSessions && <div className="session-indicator"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Navigation */}
                    <div className="date-navigation">
                        <button
                            className="nav-btn"
                            onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(selectedDate.getDate() - 1);
                                setSelectedDate(newDate);
                            }}
                        >
                            ← Ngày trước
                        </button>
                        <button
                            className="today-btn"
                            onClick={() => setSelectedDate(new Date())}
                            disabled={isToday(selectedDate)}
                        >
                            Hôm nay
                        </button>
                        <button
                            className="nav-btn"
                            onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(selectedDate.getDate() + 1);
                                setSelectedDate(newDate);
                            }}
                        >
                            Ngày sau →
                        </button>
                    </div>
                </div>

                {/* Sessions Content */}
                <div className="sessions-content-area">
                    {/* Selected Date Header */}
                    <div className="sessions-date-header">
                        <h2>
                            {selectedDate.toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </h2>
                        <span className="sessions-count">
                            {getSessionsForDate(selectedDate).length} buổi tập
                        </span>
                    </div>

                    {/* Branch Sections */}
                    <div className="sessions-branches-container">
                        {isLoading ? (
                            <div className="sessions-loading">
                                <div className="loading-spinner"></div>
                                <p>Đang tải buổi tập...</p>
                            </div>
                        ) : Object.keys(groupedByBranch).length === 0 ? (
                            <div className="sessions-empty-state">
                                <div className="empty-state-icon">📅</div>
                                <div className="empty-state-title">Không có buổi tập nào</div>
                                <div className="empty-state-description">Tạo buổi tập đầu tiên cho hội viên của bạn</div>
                            </div>
                        ) : (
                            Object.keys(groupedByBranch)
                                .sort((a, b) => {
                                    if (a === 'no-branch') return 1;
                                    if (b === 'no-branch') return -1;
                                    return getBranchDisplayName(a).localeCompare(getBranchDisplayName(b));
                                })
                                .map(branchId => {
                                    const sessionsInBranch = groupedByBranch[branchId];
                                    // Filter sessions by selected date
                                    const sessionsForDate = sessionsInBranch.filter(session => {
                                        const sessionDate = new Date(session.ngayTap);
                                        return isSameDate(sessionDate, selectedDate);
                                    });

                                    if (sessionsForDate.length === 0) return null;

                                    const isExpanded = expandedBranches.has(branchId);
                                    const branchName = getBranchDisplayName(branchId);

                                    return (
                                        <div key={branchId} className="sessions-branch-section">
                                            <div
                                                className="sessions-branch-header"
                                                onClick={() => toggleBranch(branchId)}
                                            >
                                                <div className="sessions-branch-header-left">
                                                    <span className="sessions-branch-icon">{isExpanded ? '▼' : '▶'}</span>
                                                    <h3 className="sessions-branch-name">{branchName}</h3>
                                                    <span className="sessions-branch-count">({sessionsForDate.length})</span>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="sessions-branch-cards-wrapper">
                                                    <div className="sessions-cards-grid">
                                                        {sessionsForDate
                                                            .sort((a, b) => {
                                                                const timeA = formatTime(a.gioBatDau) || '00:00';
                                                                const timeB = formatTime(b.gioBatDau) || '00:00';
                                                                return timeA.localeCompare(timeB);
                                                            })
                                                            .map(session => {
                                                                const statusInfo = getTrangThaiDisplay(session);
                                                                const ptName = getPTName(session);
                                                                const soBaiTap = getSoBaiTap(session);

                                                                return (
                                                                    <div key={session._id} className="session-card">
                                                                        <div className="session-card-header">
                                                                            <div className="session-time">
                                                                                {formatTime(session.gioBatDau)} - {formatTime(session.gioKetThuc)}
                                                                            </div>
                                                                            <div className="session-menu">
                                                                                <button
                                                                                    className="session-menu-btn"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const menu = e.currentTarget.nextElementSibling;
                                                                                        if (menu) {
                                                                                            document.querySelectorAll('.session-menu-dropdown.show').forEach(d => d.classList.remove('show'));
                                                                                            menu.classList.toggle('show');
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    ⋯
                                                                                </button>
                                                                                <div className="session-menu-dropdown">
                                                                                    <button
                                                                                        className="session-menu-item"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setEditingItem(session);
                                                                                        }}
                                                                                    >
                                                                                        ✏️ Sửa
                                                                                    </button>
                                                                                    <button
                                                                                        className="session-menu-item"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const copyData = { ...session };
                                                                                            delete (copyData as any)._id;
                                                                                            setEditingItem(copyData);
                                                                                            setIsCopying(true);
                                                                                            setShow(true);
                                                                                        }}
                                                                                    >
                                                                                        📋 Sao chép
                                                                                    </button>
                                                                                    <button
                                                                                        className="session-menu-item session-menu-delete"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setDeleteConfirm({ show: true, item: session });
                                                                                        }}
                                                                                    >
                                                                                        🗑️ Xóa
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="session-card-body">
                                                                            <div className="session-title">
                                                                                {session.tenBuoiTap || 'Buổi tập'}
                                                                            </div>
                                                                            <div className="session-details">
                                                                                <div className="session-detail-item">
                                                                                    <span className="session-detail-label">PT:</span>
                                                                                    <span className="session-detail-value">{ptName}</span>
                                                                                </div>
                                                                                <div className="session-detail-item">
                                                                                    <span className="session-detail-label">Số bài tập:</span>
                                                                                    <span className="session-detail-value">{soBaiTap}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="session-status-wrapper">
                                                                                <span className={`session-status-badge ${statusInfo.class}`}>
                                                                                    {statusInfo.class === 'completed' ? '✓' : statusInfo.class === 'cancelled' ? '✕' : '⏳'} {statusInfo.text}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>
            {(show || editingItem) && <EntityForm
                title="Buổi tập"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'ngayTap', label: 'Ngày tập', type: 'date', validation: { required: true } },
                    { name: 'pt', label: 'PT', validation: { required: true } },
                    { name: 'cacBaiTap', label: 'Các bài tập', type: 'textarea', validation: { required: true } },
                    { name: 'trangThaiTap', label: 'Trạng thái', options: ['DA_HOAN_THANH', 'CHUA_HOAN_THANH'], validation: { required: true } }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); setIsCopying(false); }}
                onSave={async (val) => {
                    try {
                        if (editingItem && !isCopying) {
                            // Update existing session
                            await api.put(`/api/buoitap/${editingItem._id}`, val);
                        } else {
                            // Create new session (including when copying)
                            await api.post('/api/buoitap', val);
                        }
                        // Refresh data
                        await fetchBuoiTap();
                        if (isCopying || !editingItem) {
                            notifications.schedule.createSuccess();
                        } else {
                            notifications.schedule.updateSuccess();
                        }
                    } catch (error) {
                        console.error('Error saving session:', error);
                        if (editingItem) {
                            notifications.schedule.updateError();
                        } else {
                            notifications.schedule.createError();
                        }
                    }
                    setShow(false);
                    setEditingItem(null);
                    setIsCopying(false);
                }}
            />}
            {deleteConfirm.show && deleteConfirm.item && <ConfirmModal
                title="Xác nhận xóa buổi tập"
                message={`Bạn có chắc chắn muốn xóa buổi tập này? Hành động này không thể hoàn tác.`}
                type="danger"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={async () => {
                    try {
                        await api.delete(`/api/buoitap/${deleteConfirm.item!._id}`);
                        // Refresh data
                        await fetchBuoiTap();
                        notifications.schedule.deleteSuccess();
                    } catch (error) {
                        console.error('Error deleting session:', error);
                        notifications.schedule.deleteError();
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {isLoading && <Loading overlay text="Đang tải buổi tập..." />}
        </div>
    );
};

const ExercisesPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<BaiTap | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: BaiTap | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<BaiTap[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const notifications = useCrudNotifications();
    const [filterNhomCo, setFilterNhomCo] = useState<string>('all');
    const [filterMucDoKho, setFilterMucDoKho] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Fetch exercises
    const fetchExercises = async () => {
        try {
            setIsLoading(true);
            const data = await api.get('/api/baitap');
            if (Array.isArray(data)) {
                setRows(data);
            } else {
                setRows([]);
            }
        } catch (e) {
            console.error('Error fetching exercises:', e);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExercises();
    }, [refreshTrigger]);

    // Get unique nhomCo values for filter
    const nhomCoOptions = React.useMemo(() => {
        const nhomCoSet = new Set<string>();
        rows.forEach(ex => {
            if (ex.nhomCo) {
                ex.nhomCo.split(',').forEach(nc => {
                    const trimmed = nc.trim();
                    if (trimmed) nhomCoSet.add(trimmed);
                });
            }
        });
        return Array.from(nhomCoSet).sort();
    }, [rows]);

    // Sort exercises
    const sortedRows = React.useMemo(() => {
        if (!sortConfig) return rows;

        return [...rows].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortConfig.key) {
                case 'tenBaiTap':
                    aValue = (a.tenBaiTap || a.title || '').toLowerCase();
                    bValue = (b.tenBaiTap || b.title || '').toLowerCase();
                    break;
                case 'nhomCo':
                    aValue = (a.nhomCo || '').toLowerCase();
                    bValue = (b.nhomCo || '').toLowerCase();
                    break;
                case 'difficulty':
                    const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                    aValue = difficultyOrder[a.difficulty || 'beginner'] || 0;
                    bValue = difficultyOrder[b.difficulty || 'beginner'] || 0;
                    break;
                case 'kcal':
                    aValue = a.kcal || 0;
                    bValue = b.kcal || 0;
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt || 0).getTime();
                    bValue = new Date(b.createdAt || 0).getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rows, sortConfig]);

    // Filter exercises
    const filtered = sortedRows.filter(r => {
        // Search filter
        if (q.trim()) {
            const searchTerm = q.toLowerCase().trim();
            const matchesSearch = (
                ((r.tenBaiTap || r.title) && (r.tenBaiTap || r.title || '').toLowerCase().includes(searchTerm)) ||
                ((r.moTa || r.description) && (r.moTa || r.description || '').toLowerCase().includes(searchTerm)) ||
                (r.nhomCo && r.nhomCo.toLowerCase().includes(searchTerm)) ||
                (r.mucTieuBaiTap && r.mucTieuBaiTap.toLowerCase().includes(searchTerm))
            );
            if (!matchesSearch) return false;
        }

        // Nhóm cơ filter
        if (filterNhomCo !== 'all') {
            if (!r.nhomCo || !r.nhomCo.toLowerCase().includes(filterNhomCo.toLowerCase())) return false;
        }

        // Mức độ khó filter
        if (filterMucDoKho !== 'all') {
            const exerciseDifficulty = r.difficulty || (r.mucDoKho === 'DE' ? 'beginner' : r.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : r.mucDoKho === 'KHO' ? 'advanced' : 'beginner');
            if (filterMucDoKho === 'beginner' && exerciseDifficulty !== 'beginner') return false;
            if (filterMucDoKho === 'intermediate' && exerciseDifficulty !== 'intermediate') return false;
            if (filterMucDoKho === 'advanced' && exerciseDifficulty !== 'advanced') return false;
        }

        // Status filter
        if (filterStatus !== 'all') {
            const exerciseStatus = r.status || 'active';
            if (filterStatus !== exerciseStatus) return false;
        }

        return true;
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            setSortConfig(null);
            return;
        }
        setSortConfig({ key, direction });
    };

    const handleClearFilters = () => {
        setFilterNhomCo('all');
        setFilterMucDoKho('all');
        setFilterStatus('all');
        setQ('');
        setSortConfig(null);
    };

    const getDifficultyLabel = (exercise: BaiTap) => {
        if (exercise.difficulty === 'beginner') return 'Cơ bản';
        if (exercise.difficulty === 'intermediate') return 'Trung bình';
        if (exercise.difficulty === 'advanced') return 'Nâng cao';
        if (exercise.mucDoKho === 'DE') return 'Cơ bản';
        if (exercise.mucDoKho === 'TRUNG_BINH') return 'Trung bình';
        if (exercise.mucDoKho === 'KHO') return 'Nâng cao';
        return 'Cơ bản';
    };

    const getDifficultyColor = (exercise: BaiTap) => {
        const difficulty = exercise.difficulty || (exercise.mucDoKho === 'DE' ? 'beginner' : exercise.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : exercise.mucDoKho === 'KHO' ? 'advanced' : 'beginner');
        if (difficulty === 'beginner') return '#22c55e';
        if (difficulty === 'intermediate') return '#f59e0b';
        if (difficulty === 'advanced') return '#ef4444';
        return '#6b7280';
    };

    return (
        <div className="members-management-page">
            {/* Page Header */}
            <div className="members-page-header">
                <div className="members-page-header-content">
                    <h1 className="members-page-title">Quản lý bài tập</h1>
                    <p className="members-page-description">
                        Quản lý tất cả bài tập, video hướng dẫn và tài liệu tập luyện của Billions Fitness & Gym.
                    </p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="members-filter-toolbar">
                <input
                    className="members-filter-search"
                    type="text"
                    placeholder="Tìm theo tên, mô tả, nhóm cơ..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <select
                    className="members-filter-dropdown"
                    value={filterNhomCo}
                    onChange={e => setFilterNhomCo(e.target.value)}
                >
                    <option value="all">NHÓM CƠ</option>
                    {nhomCoOptions.map(nc => (
                        <option key={nc} value={nc}>{nc}</option>
                    ))}
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterMucDoKho}
                    onChange={e => setFilterMucDoKho(e.target.value)}
                >
                    <option value="all">MỨC ĐỘ KHÓ</option>
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung bình</option>
                    <option value="advanced">Nâng cao</option>
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="all">TRẠNG THÁI</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                </select>
                <select
                    className="members-filter-dropdown"
                    value={sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : 'none'}
                    onChange={e => {
                        const value = e.target.value;
                        if (value === 'none') {
                            setSortConfig(null);
                        } else {
                            const [key, direction] = value.split('-');
                            setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                        }
                    }}
                >
                    <option value="none">SẮP XẾP</option>
                    <option value="tenBaiTap-asc">Tên: A → Z</option>
                    <option value="tenBaiTap-desc">Tên: Z → A</option>
                    <option value="nhomCo-asc">Nhóm cơ: A → Z</option>
                    <option value="difficulty-asc">Độ khó: Dễ → Khó</option>
                    <option value="difficulty-desc">Độ khó: Khó → Dễ</option>
                    <option value="kcal-desc">Calo: Cao nhất</option>
                    <option value="kcal-asc">Calo: Thấp nhất</option>
                    <option value="createdAt-desc">Ngày tạo: Mới nhất</option>
                    <option value="createdAt-asc">Ngày tạo: Cũ nhất</option>
                </select>
                <button className="members-filter-clear-btn" onClick={handleClearFilters}>
                    CLEAR
                </button>
            </div>

            {/* Action Buttons */}
            <div className="members-page-actions">
                <button className="members-add-btn" onClick={() => setShow(true)}>
                    <span>+</span> Thêm bài tập
                </button>
            </div>

            {/* Exercises Grid */}
            <div className="pt-branches-container">
                {isLoading ? (
                    <Loading text="Đang tải bài tập..." />
                ) : filtered.length === 0 ? (
                    <div className="pt-empty-state">
                        <p>Không tìm thấy bài tập nào.</p>
                    </div>
                ) : (
                    <div className="pt-cards-grid">
                        {filtered.map(exercise => (
                            <div key={exercise._id} className="pt-card exercise-card">
                                <div className="pt-card-header">
                                    <div className="pt-avatar">
                                        {exercise.hinhAnh ? (
                                            <img src={exercise.hinhAnh} alt={exercise.tenBaiTap || exercise.title} className="pt-avatar-img" />
                                        ) : (
                                            <div className="pt-avatar-placeholder">
                                                {(exercise.tenBaiTap || exercise.title || 'B').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-info">
                                        <h3 className="pt-name">{exercise.tenBaiTap || exercise.title || 'Bài tập'}</h3>
                                        <p className="pt-phone">
                                            <span style={{ color: getDifficultyColor(exercise), fontWeight: 'bold' }}>
                                                {getDifficultyLabel(exercise)}
                                            </span>
                                            {exercise.kcal && ` • ${exercise.kcal} kcal`}
                                        </p>
                                    </div>
                                    <div className="pt-menu">
                                        <button
                                            className="pt-menu-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                document.querySelectorAll('.pt-menu-dropdown.show').forEach(dropdown => {
                                                    dropdown.classList.remove('show');
                                                });
                                                const menu = e.currentTarget.nextElementSibling;
                                                if (menu) {
                                                    menu.classList.toggle('show');
                                                }
                                            }}
                                        >
                                            ⋯
                                        </button>
                                        <div className="pt-menu-dropdown">
                                            <button
                                                className="pt-menu-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItem(exercise);
                                                }}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className="pt-menu-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const copyData = { ...exercise };
                                                    delete (copyData as any)._id;
                                                    delete (copyData as any).createdAt;
                                                    delete (copyData as any).updatedAt;
                                                    setEditingItem(copyData);
                                                    setShow(true);
                                                }}
                                            >
                                                📋 Sao chép
                                            </button>
                                            <button
                                                className="pt-menu-item pt-menu-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm({ show: true, item: exercise });
                                                }}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-card-divider"></div>

                                <div className="pt-card-details">
                                    {exercise.nhomCo && (
                                        <div className="pt-detail-item">
                                            <span className="pt-detail-label">Nhóm cơ:</span>
                                            <span className="pt-detail-value">{exercise.nhomCo}</span>
                                        </div>
                                    )}
                                    {exercise.thietBiSuDung && (
                                        <div className="pt-detail-item">
                                            <span className="pt-detail-label">Thiết bị:</span>
                                            <span className="pt-detail-value">{exercise.thietBiSuDung}</span>
                                        </div>
                                    )}
                                    {exercise.soHiepvaSoLanLap && exercise.soHiepvaSoLanLap > 0 && (
                                        <div className="pt-detail-item">
                                            <span className="pt-detail-label">Hiệp/Lần lặp:</span>
                                            <span className="pt-detail-value">{exercise.soHiepvaSoLanLap}</span>
                                        </div>
                                    )}
                                    {exercise.mucTieuBaiTap && (
                                        <div className="pt-detail-item">
                                            <span className="pt-detail-label">Mục tiêu:</span>
                                            <span className="pt-detail-value" style={{ fontSize: '0.85em' }}>
                                                {exercise.mucTieuBaiTap}
                                            </span>
                                        </div>
                                    )}
                                    {(exercise.duration_sec || exercise.thoiGian) && (
                                        <div className="pt-detail-item">
                                            <span className="pt-detail-label">Thời lượng:</span>
                                            <span className="pt-detail-value">
                                                {Math.floor((exercise.duration_sec || exercise.thoiGian || 0) / 60)} phút
                                            </span>
                                        </div>
                                    )}
                                    {exercise.ratings && exercise.ratings.totalRatings > 0 && (
                                        <div className="pt-detail-item">
                                            <span className="pt-detail-label">Đánh giá:</span>
                                            <span className="pt-detail-value">
                                                ⭐ {exercise.ratings.averageRating.toFixed(1)} ({exercise.ratings.totalRatings})
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {(exercise.videoHuongDan || exercise.source_url) && (
                                    <>
                                        <div className="pt-card-divider"></div>
                                        <div className="pt-card-actions">
                                            <button
                                                className="pt-action-btn pt-action-view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(exercise.videoHuongDan || exercise.source_url, '_blank');
                                                }}
                                            >
                                                📺 Xem video
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(show || editingItem) && <EntityForm
                title="Bài tập"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'hinhAnh', label: 'Hình ảnh bài tập', type: 'file', validation: { maxSize: 5 } },
                    { name: 'tenBaiTap', label: 'Tên bài tập', validation: { required: true, pattern: /^[\p{L}\d\s\-_]+$/u, message: 'Tên bài tập không được chứa ký tự đặc biệt' } },
                    { name: 'moTa', label: 'Mô tả', type: 'textarea', validation: { required: true } },
                    { name: 'nhomCo', label: 'Nhóm cơ', validation: { required: true } },
                    {
                        name: 'mucDoKho', label: 'Mức độ khó', type: 'select', options: [
                            { value: 'DE', label: 'Dễ' },
                            { value: 'TRUNG_BINH', label: 'Trung bình' },
                            { value: 'KHO', label: 'Khó' }
                        ]
                    },
                    {
                        name: 'difficulty', label: 'Độ khó (mới)', type: 'select', options: [
                            { value: 'beginner', label: 'Cơ bản' },
                            { value: 'intermediate', label: 'Trung bình' },
                            { value: 'advanced', label: 'Nâng cao' }
                        ]
                    },
                    { name: 'thietBiSuDung', label: 'Thiết bị sử dụng' },
                    { name: 'soHiepvaSoLanLap', label: 'Số hiệp và số lần lặp', type: 'number' },
                    { name: 'mucTieuBaiTap', label: 'Mục tiêu bài tập', type: 'textarea' },
                    { name: 'videoHuongDan', label: 'Video hướng dẫn (URL)', validation: { pattern: /^https?:\/\/.+/, message: 'URL video không hợp lệ' } },
                    { name: 'source_url', label: 'Link nguồn (YouTube/Vimeo)', validation: { pattern: /^https?:\/\/.+/, message: 'URL không hợp lệ' } },
                    { name: 'hinhAnhMinhHoa', label: 'Hình ảnh minh họa (URL, cách nhau bởi dấu phẩy)', validation: { pattern: /^https?:\/\/.+/, message: 'URL hình ảnh không hợp lệ' } },
                    { name: 'duration_sec', label: 'Thời lượng (giây)', type: 'number' },
                    { name: 'kcal', label: 'Calo (kcal)', type: 'number' },
                    {
                        name: 'status', label: 'Trạng thái', type: 'select', options: [
                            { value: 'active', label: 'Đang hoạt động' },
                            { value: 'inactive', label: 'Ngừng hoạt động' }
                        ]
                    }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {
                        if (editingItem && editingItem._id) {
                            const updated = await api.put(`/api/baitap/${editingItem._id}`, val);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                            notifications.generic.success('Cập nhật bài tập thành công!');
                        } else {
                            const created = await api.post('/api/baitap', val);
                            setRows([created, ...rows]);
                            notifications.generic.success('Tạo bài tập thành công!');
                        }
                        setRefreshTrigger(prev => prev + 1);
                    } catch (error) {
                        console.error('Error saving exercise:', error);
                        notifications.generic.error('Có lỗi xảy ra khi lưu bài tập!');
                    }
                    setShow(false);
                    setEditingItem(null);
                }}
            />}
            {deleteConfirm.show && deleteConfirm.item && <ConfirmModal
                title="Xác nhận xóa bài tập"
                message={`Bạn có chắc chắn muốn xóa bài tập "${deleteConfirm.item.tenBaiTap || deleteConfirm.item.title || 'này'}"? Hành động này không thể hoàn tác.`}
                type="danger"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={async () => {
                    try {
                        await api.delete(`/api/baitap/${deleteConfirm.item!._id}`);
                        setRows(rows.filter(r => r._id !== deleteConfirm.item!._id));
                        notifications.generic.success('Xóa bài tập thành công!');
                    } catch (error) {
                        console.error('Error deleting exercise:', error);
                        notifications.generic.error('Có lỗi xảy ra khi xóa bài tập!');
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {isLoading && <Loading overlay text="Đang tải bài tập..." />}
        </div>
    );
};

// Templates Page - Hiển thị 20 template với playlist bài tập (giống PTPage chia theo chi nhánh)
const TemplatesPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState<TemplateBuoiTap[]>([]);
    const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set()); // Mặc định tất cả đều đóng
    const [filterLoai, setFilterLoai] = useState<string>('all');
    const [filterDoKho, setFilterDoKho] = useState<string>('all');
    const [q, setQ] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [templateSortConfig, setTemplateSortConfig] = useState<{ key: 'count'; direction: 'asc' | 'desc' } | null>(null);
    // Sort config riêng cho từng template (templateId -> sortConfig)
    const [templateExerciseSortConfigs, setTemplateExerciseSortConfigs] = useState<{ [templateId: string]: { key: string; direction: 'asc' | 'desc' } | null }>({});
    // Selected exercises cho bulk edit
    const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<any>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [bulkUpdateProgress, setBulkUpdateProgress] = useState<{ current: number; total: number } | null>(null);
    const notifications = useCrudNotifications();

    // Fetch templates (KHÔNG populate bài tập để load nhanh hơn)
    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            // Không populate exercises để load nhanh hơn, sẽ lazy load khi expand
            const cacheBuster = `?_t=${Date.now()}`;
            const data = await api.get(`/api/session-templates${cacheBuster}`);
            if (Array.isArray(data)) {
                console.log(`📋 Loaded ${data.length} templates from backend (without exercises for faster loading)`);
                // Templates chỉ có baiTap IDs, không có full exercise data
                setTemplates(data);
            } else {
                setTemplates([]);
            }
        } catch (e) {
            console.error('Error fetching templates:', e);
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch exercises cho một template cụ thể (lazy load khi expand)
    const fetchExercisesForTemplate = async (templateId: string) => {
        try {
            // Kiểm tra xem đã load chưa
            if (loadedExercises[templateId] && loadedExercises[templateId].length > 0) {
                return loadedExercises[templateId];
            }

            const template = templates.find(t => t._id === templateId);
            if (!template) return [];

            // Nếu đã có exercises trong template (đã populated từ trước)
            if (template.baiTap && Array.isArray(template.baiTap)) {
                const firstItem = template.baiTap[0];
                // Nếu là object (đã populated), return luôn
                if (firstItem && typeof firstItem === 'object' && firstItem._id) {
                    const exercises = template.baiTap.filter((bt: any): bt is BaiTap =>
                        bt && typeof bt === 'object' && bt._id
                    );
                    // Lưu vào loadedExercises
                    setLoadedExercises(prev => ({
                        ...prev,
                        [templateId]: exercises
                    }));
                    return exercises;
                }
            }

            // Nếu chưa có, fetch từ template detail với populate
            const templateDetail = await api.get(`/api/session-templates/${templateId}?populateExercises=true`);
            if (templateDetail && templateDetail.baiTap && Array.isArray(templateDetail.baiTap)) {
                const exercises = templateDetail.baiTap.filter((bt: any): bt is BaiTap =>
                    bt && typeof bt === 'object' && bt._id
                );

                // Lưu vào loadedExercises
                setLoadedExercises(prev => ({
                    ...prev,
                    [templateId]: exercises
                }));

                return exercises;
            }
            return [];
        } catch (error) {
            console.error(`Error fetching exercises for template ${templateId}:`, error);
            return [];
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Filter templates (chỉ lọc template, không lọc bài tập bên trong)
    const filteredTemplates = templates.filter(t => {
        // Search filter
        if (q.trim()) {
            const searchTerm = q.toLowerCase().trim();
            const matchesSearch = (
                (t.ten && t.ten.toLowerCase().includes(searchTerm)) ||
                (t.moTa && t.moTa.toLowerCase().includes(searchTerm)) ||
                (t.loai && t.loai.toLowerCase().includes(searchTerm))
            );
            if (!matchesSearch) return false;
        }

        // Loai filter
        if (filterLoai !== 'all') {
            if (t.loai !== filterLoai) return false;
        }

        // DoKho filter
        if (filterDoKho !== 'all') {
            if (t.doKho !== filterDoKho) return false;
        }

        return true;
    });

    // State để lưu exercises đã được load cho từng template
    const [loadedExercises, setLoadedExercises] = useState<{ [templateId: string]: BaiTap[] }>({});

    // Group exercises by template (sử dụng loadedExercises thay vì template.baiTap)
    const groupedByTemplate = React.useMemo(() => {
        const grouped: { [key: string]: BaiTap[] } = {};

        filteredTemplates.forEach(template => {
            const templateId = template._id;
            // Lấy từ loadedExercises nếu có, nếu không thì empty array
            grouped[templateId] = loadedExercises[templateId] || [];
        });

        return grouped;
    }, [filteredTemplates, loadedExercises]);

    // Get unique loai values
    const loaiOptions = React.useMemo(() => {
        const loaiSet = new Set<string>();
        templates.forEach(t => {
            if (t.loai) loaiSet.add(t.loai);
        });
        return Array.from(loaiSet).sort();
    }, [templates]);

    // Toggle template expansion và lazy load exercises khi expand
    const toggleTemplate = (templateId: string) => {
        const isCurrentlyExpanded = expandedTemplates.has(templateId);

        // Toggle expansion state trước
        setExpandedTemplates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(templateId)) {
                newSet.delete(templateId);
                return newSet;
            } else {
                newSet.add(templateId);

                // Nếu đang mở và chưa load exercises, thì load
                if (!loadedExercises[templateId]) {
                    fetchExercisesForTemplate(templateId).then(exercises => {
                        setLoadedExercises(prev => ({
                            ...prev,
                            [templateId]: exercises
                        }));
                    }).catch(err => {
                        console.error(`Error loading exercises for template ${templateId}:`, err);
                    });
                }

                return newSet;
            }
        });
    };

    // Get template name
    const getTemplateName = (templateId: string) => {
        const template = templates.find(t => t._id === templateId);
        return template ? template.ten : 'Không xác định';
    };

    const getDoKhoLabel = (doKho?: string) => {
        if (doKho === 'DE') return 'Dễ';
        if (doKho === 'TRUNG_BINH') return 'Trung bình';
        if (doKho === 'KHO') return 'Khó';
        return 'Trung bình';
    };

    const getDoKhoColor = (doKho?: string) => {
        if (doKho === 'DE') return '#22c55e';
        if (doKho === 'TRUNG_BINH') return '#f59e0b';
        if (doKho === 'KHO') return '#ef4444';
        return '#6b7280';
    };

    const handleClearFilters = () => {
        setFilterLoai('all');
        setFilterDoKho('all');
        setQ('');
        setSortConfig(null);
        setTemplateSortConfig(null);
        setTemplateExerciseSortConfigs({});
        setSelectedExercises(new Set());
    };

    // Toggle select exercise
    const toggleSelectExercise = (exerciseId: string) => {
        setSelectedExercises(prev => {
            const newSet = new Set(prev);
            if (newSet.has(exerciseId)) {
                newSet.delete(exerciseId);
            } else {
                newSet.add(exerciseId);
            }
            return newSet;
        });
    };

    // Toggle select all exercises in a template
    const toggleSelectAllExercisesInTemplate = (templateId: string) => {
        // Sử dụng loadedExercises để lấy exercises
        const exercisesInTemplate = loadedExercises[templateId] || [];
        const allSelected = exercisesInTemplate.length > 0 && exercisesInTemplate.every(ex => selectedExercises.has(ex._id));

        setSelectedExercises(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                // Deselect all
                exercisesInTemplate.forEach(ex => newSet.delete(ex._id));
            } else {
                // Select all
                exercisesInTemplate.forEach(ex => newSet.add(ex._id));
            }
            return newSet;
        });
    };

    // Check if all exercises in template are selected
    const areAllExercisesInTemplateSelected = (templateId: string) => {
        const exercisesInTemplate = loadedExercises[templateId] || [];
        return exercisesInTemplate.length > 0 && exercisesInTemplate.every(ex => selectedExercises.has(ex._id));
    };

    // Check if some exercises in template are selected
    const areSomeExercisesInTemplateSelected = (templateId: string) => {
        const exercisesInTemplate = loadedExercises[templateId] || [];
        return exercisesInTemplate.some(ex => selectedExercises.has(ex._id));
    };

    // Compress image function (tương tự EntityForm)
    const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Cannot get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handle file upload for bulk edit
    const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            notifications.generic.error('Kích thước file không được vượt quá 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            notifications.generic.error('File phải là hình ảnh');
            return;
        }

        try {
            // Compress image
            const compressedImage = await compressImage(file, 800, 0.8);
            setPreviewImage(compressedImage);
            setBulkEditData({ ...bulkEditData, hinhAnh: compressedImage });
        } catch (error) {
            console.error('Error processing image:', error);
            notifications.generic.error('Lỗi khi xử lý hình ảnh');
        }
    };

    // Handle bulk edit - Tối ưu với batch processing và progress
    const handleBulkEdit = async () => {
        if (selectedExercises.size === 0) {
            notifications.generic.error('Vui lòng chọn ít nhất một bài tập!');
            return;
        }

        // Chỉ lấy các trường có giá trị (loại bỏ undefined và empty string)
        const updateData: any = {};
        Object.keys(bulkEditData).forEach(key => {
            const value = bulkEditData[key];
            if (value !== undefined && value !== '' && value !== null) {
                updateData[key] = value;
            }
        });

        if (Object.keys(updateData).length === 0) {
            notifications.generic.error('Vui lòng điền ít nhất một trường để cập nhật!');
            return;
        }

        try {
            setIsLoading(true);
            const exerciseIds = Array.from(selectedExercises);
            const total = exerciseIds.length;
            setBulkUpdateProgress({ current: 0, total });

            // Batch processing: xử lý từng batch nhỏ để tránh overload
            const BATCH_SIZE = 5; // Xử lý 5 bài tập mỗi lần
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < exerciseIds.length; i += BATCH_SIZE) {
                const batch = exerciseIds.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (exerciseId) => {
                    try {
                        await api.put(`/api/baitap/${exerciseId}`, updateData);
                        successCount++;
                        return { success: true, id: exerciseId };
                    } catch (error) {
                        console.error(`Error updating exercise ${exerciseId}:`, error);
                        errorCount++;
                        return { success: false, id: exerciseId, error };
                    }
                });

                await Promise.all(batchPromises);
                setBulkUpdateProgress({ current: Math.min(i + BATCH_SIZE, total), total });

                // Delay nhỏ giữa các batch để tránh overload server
                if (i + BATCH_SIZE < exerciseIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Hiển thị thông báo trước
            if (errorCount === 0) {
                notifications.generic.success(`Đã cập nhật ${successCount} bài tập thành công!`);
            } else {
                notifications.generic.success(`Đã cập nhật ${successCount} bài tập thành công. ${errorCount} bài tập gặp lỗi.`);
            }

            // Refresh templates và reload exercises cho các template đã expanded
            try {
                await fetchTemplates();
                // Reload exercises cho các template đã được expand
                const expandedIds = Array.from(expandedTemplates);
                const reloadPromises = expandedIds.map(async (templateId) => {
                    const exercises = await fetchExercisesForTemplate(templateId);
                    setLoadedExercises(prev => ({
                        ...prev,
                        [templateId]: exercises
                    }));
                });
                await Promise.all(reloadPromises);
            } catch (err) {
                console.error('Error refreshing templates:', err);
                // Vẫn tiếp tục đóng modal dù có lỗi refresh
            }

            // Đóng modal và clear data sau khi refresh xong
            setSelectedExercises(new Set());
            setShowBulkEditModal(false);
            setBulkEditData({});
            setPreviewImage(null);
            setBulkUpdateProgress(null);

            // Reset file input
            const fileInput = document.getElementById('bulk-edit-image-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error) {
            console.error('Error bulk updating exercises:', error);
            notifications.generic.error('Có lỗi xảy ra khi cập nhật bài tập!');
            // Đóng modal ngay cả khi có lỗi
            setShowBulkEditModal(false);
            setBulkEditData({});
            setPreviewImage(null);
            setBulkUpdateProgress(null);
            // Reset file input
            const fileInput = document.getElementById('bulk-edit-image-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sort cho exercises trong một template cụ thể
    const handleTemplateExerciseSort = (templateId: string, sortValue: string) => {
        if (sortValue === 'none') {
            setTemplateExerciseSortConfigs(prev => {
                const newConfigs = { ...prev };
                delete newConfigs[templateId];
                return newConfigs;
            });
        } else {
            const [key, direction] = sortValue.split('-');
            setTemplateExerciseSortConfigs(prev => ({
                ...prev,
                [templateId]: { key, direction: direction as 'asc' | 'desc' }
            }));
        }
    };

    // Sort exercises trong một template
    const getSortedExercisesForTemplate = (templateId: string, exercises: BaiTap[]): BaiTap[] => {
        const sortConfig = templateExerciseSortConfigs[templateId];
        if (!sortConfig) return exercises;

        return [...exercises].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortConfig.key) {
                case 'tenBaiTap':
                    aValue = (a.tenBaiTap || a.title || '').toLowerCase();
                    bValue = (b.tenBaiTap || b.title || '').toLowerCase();
                    break;
                case 'difficulty':
                    const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                    const aDiff = a.difficulty || (a.mucDoKho === 'DE' ? 'beginner' : a.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : a.mucDoKho === 'KHO' ? 'advanced' : 'beginner');
                    const bDiff = b.difficulty || (b.mucDoKho === 'DE' ? 'beginner' : b.mucDoKho === 'TRUNG_BINH' ? 'intermediate' : b.mucDoKho === 'KHO' ? 'advanced' : 'beginner');
                    aValue = difficultyOrder[aDiff as keyof typeof difficultyOrder] || 0;
                    bValue = difficultyOrder[bDiff as keyof typeof difficultyOrder] || 0;
                    break;
                case 'kcal':
                    aValue = a.kcal || 0;
                    bValue = b.kcal || 0;
                    break;
                case 'ratings':
                    aValue = a.ratings?.averageRating || 0;
                    bValue = b.ratings?.averageRating || 0;
                    break;
                case 'duration':
                    aValue = a.duration_sec || a.thoiGian || 0;
                    bValue = b.duration_sec || b.thoiGian || 0;
                    break;
                case 'nhomCo':
                    aValue = (a.nhomCo || '').toLowerCase();
                    bValue = (b.nhomCo || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    return (
        <div className="members-management-page">
            {/* Page Header */}
            <div className="members-page-header">
                <div className="members-page-header-content">
                    <h1 className="members-page-title">Quản lý Template Buổi tập</h1>
                    <p className="members-page-description">
                        Quản lý các template buổi tập và playlist bài tập của Billions Fitness & Gym. Mỗi template chứa 20 bài tập phù hợp.
                    </p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="members-filter-toolbar">
                <input
                    className="members-filter-search"
                    type="text"
                    placeholder="Tìm theo tên, mô tả, loại..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <select
                    className="members-filter-dropdown"
                    value={filterLoai}
                    onChange={e => setFilterLoai(e.target.value)}
                >
                    <option value="all">LOẠI</option>
                    {loaiOptions.map(loai => (
                        <option key={loai} value={loai}>{loai}</option>
                    ))}
                </select>
                <select
                    className="members-filter-dropdown"
                    value={filterDoKho}
                    onChange={e => setFilterDoKho(e.target.value)}
                >
                    <option value="all">MỨC ĐỘ KHÓ</option>
                    <option value="DE">Dễ</option>
                    <option value="TRUNG_BINH">Trung bình</option>
                    <option value="KHO">Khó</option>
                </select>
                <select
                    className="members-filter-dropdown"
                    value={
                        templateSortConfig
                            ? `template-count-${templateSortConfig.direction}`
                            : (sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : 'none')
                    }
                    onChange={e => {
                        const value = e.target.value;
                        if (value === 'none') {
                            setSortConfig(null);
                            setTemplateSortConfig(null);
                        } else if (value.startsWith('template-count-')) {
                            const direction = value.split('-')[2] as 'asc' | 'desc';
                            setTemplateSortConfig({ key: 'count', direction });
                            setSortConfig(null);
                        } else {
                            const [key, direction] = value.split('-');
                            setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                            setTemplateSortConfig(null);
                        }
                    }}
                >
                    <option value="none">SẮP XẾP</option>
                    <option value="template-count-desc">Số lượng bài tập: Nhiều nhất</option>
                    <option value="template-count-asc">Số lượng bài tập: Ít nhất</option>
                    <option value="ten-asc">Tên template: A → Z</option>
                    <option value="ten-desc">Tên template: Z → A</option>
                </select>
                <button className="members-filter-clear-btn" onClick={handleClearFilters}>
                    CLEAR
                </button>
            </div>

            {/* Template Sections with Exercise Cards - Giống PTPage chia theo chi nhánh */}
            <div className="pt-branches-container">
                {isLoading ? (
                    <Loading text="Đang tải templates..." />
                ) : Object.keys(groupedByTemplate).length === 0 ? (
                    <div className="pt-empty-state">
                        <p>Không tìm thấy template nào.</p>
                    </div>
                ) : (
                    Object.keys(groupedByTemplate)
                        .sort((a, b) => {
                            // If sorting by exercise count
                            if (templateSortConfig) {
                                const countA = groupedByTemplate[a]?.length || 0;
                                const countB = groupedByTemplate[b]?.length || 0;

                                // Sort by count
                                if (templateSortConfig.direction === 'desc') {
                                    return countB - countA; // Descending: more exercises first
                                } else {
                                    return countA - countB; // Ascending: fewer exercises first
                                }
                            }

                            // Default sort: alphabetically by template name
                            return getTemplateName(a).localeCompare(getTemplateName(b));
                        })
                        .map(templateId => {
                            const exercisesInTemplate = groupedByTemplate[templateId];
                            const isExpanded = expandedTemplates.has(templateId);
                            const template = templates.find(t => t._id === templateId);
                            const templateName = template ? template.ten : 'Không xác định';
                            // Lấy số lượng bài tập từ template.baiTap (array of IDs) hoặc từ loaded exercises
                            const exerciseCount = template?.baiTap && Array.isArray(template.baiTap)
                                ? (typeof template.baiTap[0] === 'object'
                                    ? template.baiTap.length
                                    : template.baiTap.length)
                                : exercisesInTemplate.length;

                            return (
                                <div key={templateId} className="pt-branch-section">
                                    <div className="pt-branch-header">
                                        <div className="pt-branch-header-left" onClick={() => toggleTemplate(templateId)}>
                                            <span className="pt-branch-icon">{isExpanded ? '▼' : '▶'}</span>
                                            <h3 className="pt-branch-name">{templateName}</h3>
                                            <span className="pt-branch-count">({exerciseCount})</span>
                                        </div>
                                        {isExpanded && (
                                            <div className="pt-branch-header-right" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={areAllExercisesInTemplateSelected(templateId)}
                                                    ref={(input) => {
                                                        if (input) input.indeterminate = areSomeExercisesInTemplateSelected(templateId) && !areAllExercisesInTemplateSelected(templateId);
                                                    }}
                                                    onChange={() => toggleSelectAllExercisesInTemplate(templateId)}
                                                    className="pt-branch-checkbox"
                                                    title="Chọn tất cả bài tập trong template này"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="pt-branch-cards-wrapper">
                                            {/* Loading state khi đang fetch exercises */}
                                            {!loadedExercises[templateId] && exercisesInTemplate.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                                    <Loading text="Đang tải bài tập..." />
                                                </div>
                                            )}

                                            {/* Template Info & Sort Toolbar */}
                                            {exercisesInTemplate.length > 0 && (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '16px',
                                                    gap: '16px',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    {/* Template Info */}
                                                    {template?.moTa && (
                                                        <div style={{
                                                            padding: '16px',
                                                            background: '#f9fafb',
                                                            borderRadius: '8px',
                                                            flex: 1,
                                                            minWidth: '300px'
                                                        }}>
                                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                                                                {template.loai && (
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        background: '#e0e7ff',
                                                                        color: '#4f46e5',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.85em',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        {template.loai}
                                                                    </span>
                                                                )}
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    background: getDoKhoColor(template.doKho) + '20',
                                                                    color: getDoKhoColor(template.doKho),
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.85em',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {getDoKhoLabel(template.doKho)}
                                                                </span>
                                                            </div>
                                                            <p style={{ margin: 0, color: '#6b7280' }}>{template.moTa}</p>
                                                        </div>
                                                    )}

                                                    {/* Sort Dropdown cho template này */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        minWidth: '200px'
                                                    }}>
                                                        <label style={{
                                                            fontSize: '0.9em',
                                                            fontWeight: 'bold',
                                                            color: '#6b7280',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            Sắp xếp:
                                                        </label>
                                                        <select
                                                            className="members-filter-dropdown"
                                                            style={{
                                                                flex: 1,
                                                                minWidth: '180px',
                                                                fontSize: '0.9em'
                                                            }}
                                                            value={
                                                                templateExerciseSortConfigs[templateId]
                                                                    ? `${templateExerciseSortConfigs[templateId]!.key}-${templateExerciseSortConfigs[templateId]!.direction}`
                                                                    : 'none'
                                                            }
                                                            onChange={e => handleTemplateExerciseSort(templateId, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="none">Mặc định</option>
                                                            <option value="tenBaiTap-asc">Tên: A → Z</option>
                                                            <option value="tenBaiTap-desc">Tên: Z → A</option>
                                                            <option value="difficulty-asc">Độ khó: Dễ → Khó</option>
                                                            <option value="difficulty-desc">Độ khó: Khó → Dễ</option>
                                                            <option value="kcal-desc">Kcal: Cao nhất</option>
                                                            <option value="kcal-asc">Kcal: Thấp nhất</option>
                                                            <option value="ratings-desc">Đánh giá: Cao nhất</option>
                                                            <option value="ratings-asc">Đánh giá: Thấp nhất</option>
                                                            <option value="duration-asc">Thời lượng: Ngắn nhất</option>
                                                            <option value="duration-desc">Thời lượng: Dài nhất</option>
                                                            <option value="nhomCo-asc">Nhóm cơ: A → Z</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bulk Edit Button */}
                                            {exercisesInTemplate.length > 0 && selectedExercises.size > 0 && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    padding: '12px 16px',
                                                    background: '#f0f9ff',
                                                    border: '1px solid #3b82f6',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                                                        Đã chọn: {selectedExercises.size} bài tập
                                                    </span>
                                                    <button
                                                        className="members-add-btn"
                                                        style={{
                                                            background: '#3b82f6',
                                                            color: 'white',
                                                            padding: '8px 16px',
                                                            fontSize: '0.9em'
                                                        }}
                                                        onClick={() => setShowBulkEditModal(true)}
                                                    >
                                                        ✏️ Chỉnh sửa hàng loạt
                                                    </button>
                                                </div>
                                            )}

                                            {/* Exercises Grid - Giống trang Bài tập */}
                                            {exercisesInTemplate.length === 0 ? (
                                                <div className="pt-empty-state">
                                                    <p>Template này chưa có bài tập nào.</p>
                                                </div>
                                            ) : (
                                                <div className="pt-cards-grid">
                                                    {getSortedExercisesForTemplate(templateId, exercisesInTemplate).map((exercise: BaiTap, index: number) => (
                                                        <div key={exercise._id || index} className="pt-card exercise-card">
                                                            <div className="pt-card-checkbox-wrapper">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedExercises.has(exercise._id)}
                                                                    onChange={() => toggleSelectExercise(exercise._id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="pt-card-checkbox"
                                                                />
                                                            </div>
                                                            <div className="pt-card-header">
                                                                <div className="pt-avatar">
                                                                    {exercise.hinhAnh ? (
                                                                        <img src={exercise.hinhAnh} alt={exercise.tenBaiTap || exercise.title} className="pt-avatar-img" />
                                                                    ) : (
                                                                        <div className="pt-avatar-placeholder">
                                                                            {(exercise.tenBaiTap || exercise.title || 'B').charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="pt-info">
                                                                    <h3 className="pt-name">{exercise.tenBaiTap || exercise.title || 'Bài tập'}</h3>
                                                                    <p className="pt-phone">
                                                                        <span style={{
                                                                            color: exercise.difficulty === 'beginner' ? '#22c55e' :
                                                                                exercise.difficulty === 'intermediate' ? '#f59e0b' :
                                                                                    exercise.difficulty === 'advanced' ? '#ef4444' : '#6b7280',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {exercise.difficulty === 'beginner' ? 'Cơ bản' :
                                                                                exercise.difficulty === 'intermediate' ? 'Trung bình' :
                                                                                    exercise.difficulty === 'advanced' ? 'Nâng cao' :
                                                                                        exercise.mucDoKho === 'DE' ? 'Dễ' :
                                                                                            exercise.mucDoKho === 'TRUNG_BINH' ? 'Trung bình' :
                                                                                                exercise.mucDoKho === 'KHO' ? 'Khó' : 'Cơ bản'}
                                                                        </span>
                                                                        {exercise.kcal && ` • ${exercise.kcal} kcal`}
                                                                    </p>
                                                                </div>
                                                                <div className="pt-menu">
                                                                    <button
                                                                        className="pt-menu-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            document.querySelectorAll('.pt-menu-dropdown.show').forEach(dropdown => {
                                                                                dropdown.classList.remove('show');
                                                                            });
                                                                            const menu = e.currentTarget.nextElementSibling;
                                                                            if (menu) {
                                                                                menu.classList.toggle('show');
                                                                            }
                                                                        }}
                                                                    >
                                                                        ⋯
                                                                    </button>
                                                                    <div className="pt-menu-dropdown">
                                                                        <button
                                                                            className="pt-menu-item"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(exercise.videoHuongDan || exercise.source_url, '_blank');
                                                                            }}
                                                                        >
                                                                            📺 Xem video
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-card-divider"></div>

                                                            <div className="pt-card-details">
                                                                {exercise.nhomCo && (
                                                                    <div className="pt-detail-item">
                                                                        <span className="pt-detail-label">Nhóm cơ:</span>
                                                                        <span className="pt-detail-value">{exercise.nhomCo}</span>
                                                                    </div>
                                                                )}
                                                                {exercise.thietBiSuDung && (
                                                                    <div className="pt-detail-item">
                                                                        <span className="pt-detail-label">Thiết bị:</span>
                                                                        <span className="pt-detail-value">{exercise.thietBiSuDung}</span>
                                                                    </div>
                                                                )}
                                                                {exercise.soHiepvaSoLanLap && exercise.soHiepvaSoLanLap > 0 && (
                                                                    <div className="pt-detail-item">
                                                                        <span className="pt-detail-label">Hiệp/Lần lặp:</span>
                                                                        <span className="pt-detail-value">{exercise.soHiepvaSoLanLap}</span>
                                                                    </div>
                                                                )}
                                                                {exercise.mucTieuBaiTap && (
                                                                    <div className="pt-detail-item">
                                                                        <span className="pt-detail-label">Mục tiêu:</span>
                                                                        <span className="pt-detail-value" style={{ fontSize: '0.85em' }}>
                                                                            {exercise.mucTieuBaiTap}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {(exercise.duration_sec || exercise.thoiGian) && (
                                                                    <div className="pt-detail-item">
                                                                        <span className="pt-detail-label">Thời lượng:</span>
                                                                        <span className="pt-detail-value">
                                                                            {Math.floor((exercise.duration_sec || exercise.thoiGian || 0) / 60)} phút
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {exercise.ratings && exercise.ratings.totalRatings > 0 && (
                                                                    <div className="pt-detail-item">
                                                                        <span className="pt-detail-label">Đánh giá:</span>
                                                                        <span className="pt-detail-value">
                                                                            ⭐ {exercise.ratings.averageRating.toFixed(1)} ({exercise.ratings.totalRatings})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {(exercise.videoHuongDan || exercise.source_url) && (
                                                                <>
                                                                    <div className="pt-card-divider"></div>
                                                                    <div className="pt-card-actions">
                                                                        <button
                                                                            className="pt-action-btn pt-action-view"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(exercise.videoHuongDan || exercise.source_url, '_blank');
                                                                            }}
                                                                        >
                                                                            📺 Xem video
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )}
            </div>

            {isLoading && <Loading overlay text="Đang tải templates..." />}

            {/* Bulk Edit Modal */}
            {showBulkEditModal && (
                <div className="modal-overlay" onClick={() => setShowBulkEditModal(false)}>
                    <div className="change-branch-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Chỉnh sửa hàng loạt {selectedExercises.size} bài tập</h2>
                            <button className="modal-close" onClick={() => setShowBulkEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                                Điền các trường bạn muốn cập nhật cho tất cả bài tập đã chọn. Các trường để trống sẽ không thay đổi.
                            </p>

                            {/* Progress Bar */}
                            {bulkUpdateProgress && (
                                <div style={{
                                    marginBottom: '16px',
                                    padding: '12px',
                                    background: '#f0f9ff',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#3b82f6' }}>
                                            Đang cập nhật...
                                        </span>
                                        <span style={{ fontSize: '0.9em', color: '#6b7280' }}>
                                            {bulkUpdateProgress.current} / {bulkUpdateProgress.total}
                                        </span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#e5e7eb',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(bulkUpdateProgress.current / bulkUpdateProgress.total) * 100}%`,
                                            height: '100%',
                                            background: '#3b82f6',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            )}

                            {/* Hình ảnh upload */}
                            <div className="form-group">
                                <label>Hình ảnh bài tập</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBulkImageUpload}
                                    className="file-input"
                                    id="bulk-edit-image-input"
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="bulk-edit-image-input"
                                    className="file-upload-label"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        padding: '18px 20px',
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: previewImage ? '#f0f9ff' : '#f9fafb',
                                        borderColor: previewImage ? '#3b82f6' : '#cbd5e1'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!previewImage) {
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!previewImage) {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                        }
                                    }}
                                >
                                    {previewImage ? (
                                        <>
                                            <span>📷</span>
                                            <span>Hình ảnh đã chọn (click để đổi)</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>📤</span>
                                            <span>Chọn hình ảnh (tối đa 5MB)</span>
                                        </>
                                    )}
                                </label>
                                {previewImage && (
                                    <div style={{
                                        position: 'relative',
                                        marginTop: '12px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        maxWidth: '200px',
                                        border: '2px solid #3b82f6'
                                    }}>
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPreviewImage(null);
                                                setBulkEditData({ ...bulkEditData, hinhAnh: undefined });
                                                // Reset file input
                                                const fileInput = document.getElementById('bulk-edit-image-input') as HTMLInputElement;
                                                if (fileInput) fileInput.value = '';
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: 'rgba(239, 68, 68, 0.9)',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                                <p className="file-size-hint">Tối đa 5MB. Hình ảnh sẽ được tự động nén.</p>
                            </div>

                            <div className="form-group">
                                <label>Mức độ khó (mới)</label>
                                <select
                                    className="form-select"
                                    value={bulkEditData.difficulty || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, difficulty: e.target.value || undefined })}
                                >
                                    <option value="">-- Giữ nguyên --</option>
                                    <option value="beginner">Cơ bản</option>
                                    <option value="intermediate">Trung bình</option>
                                    <option value="advanced">Nâng cao</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mức độ khó (cũ)</label>
                                <select
                                    className="form-select"
                                    value={bulkEditData.mucDoKho || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, mucDoKho: e.target.value || undefined })}
                                >
                                    <option value="">-- Giữ nguyên --</option>
                                    <option value="DE">Dễ</option>
                                    <option value="TRUNG_BINH">Trung bình</option>
                                    <option value="KHO">Khó</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nhóm cơ</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={bulkEditData.nhomCo || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, nhomCo: e.target.value || undefined })}
                                    placeholder="Giữ nguyên nếu để trống"
                                />
                            </div>
                            <div className="form-group">
                                <label>Thiết bị sử dụng</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={bulkEditData.thietBiSuDung || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, thietBiSuDung: e.target.value || undefined })}
                                    placeholder="Giữ nguyên nếu để trống"
                                />
                            </div>
                            <div className="form-group">
                                <label>Calo (kcal)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={bulkEditData.kcal || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, kcal: e.target.value ? parseInt(e.target.value) : undefined })}
                                    placeholder="Giữ nguyên nếu để trống"
                                />
                            </div>
                            <div className="form-group">
                                <label>Thời lượng (giây)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={bulkEditData.duration_sec || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, duration_sec: e.target.value ? parseInt(e.target.value) : undefined })}
                                    placeholder="Giữ nguyên nếu để trống"
                                />
                            </div>
                            <div className="form-group">
                                <label>Trạng thái</label>
                                <select
                                    className="form-select"
                                    value={bulkEditData.status || ''}
                                    onChange={e => setBulkEditData({ ...bulkEditData, status: e.target.value || undefined })}
                                >
                                    <option value="">-- Giữ nguyên --</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Ngừng hoạt động</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowBulkEditModal(false);
                                    setBulkEditData({});
                                    setPreviewImage(null);
                                    // Reset file input
                                    const fileInput = document.getElementById('bulk-edit-image-input') as HTMLInputElement;
                                    if (fileInput) fileInput.value = '';
                                }}
                                disabled={isLoading}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleBulkEdit}
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? (bulkUpdateProgress
                                        ? `Đang cập nhật ${bulkUpdateProgress.current}/${bulkUpdateProgress.total}...`
                                        : 'Đang cập nhật...')
                                    : `Cập nhật ${selectedExercises.size} bài tập`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// BodyMetrics Page
const BodyMetricsPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get('/api/chisocthe');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching body metrics:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const filtered = rows.filter(r =>
        (r.hoiVien && typeof r.hoiVien === 'string' ? r.hoiVien.toLowerCase() : '').includes(q.toLowerCase())
    );

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Chỉ số cơ thể</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm hội viên" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Thêm mới</Button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Hội viên</th>
                        <th>Chiều cao (cm)</th>
                        <th>Cân nặng (kg)</th>
                        <th>BMI</th>
                        <th>Nhịp tim (bpm)</th>
                        <th>Ngày đo</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(r => (
                        <tr key={r._id}>
                            <td>{r.hoiVien}</td>
                            <td>{r.chieuCao}</td>
                            <td>{r.canNang}</td>
                            <td>
                                <span className={`bmi-value ${parseFloat(r.bmi) < 18.5 ? 'underweight' : parseFloat(r.bmi) < 25 ? 'normal' : parseFloat(r.bmi) < 30 ? 'overweight' : 'obese'}`}>
                                    {r.bmi}
                                </span>
                            </td>
                            <td>{r.nhipTim}</td>
                            <td>{r.ngayDo ? new Date(r.ngayDo).toLocaleDateString('vi-VN') : 'N/A'}</td>
                            <td className="row-actions">
                                <button className="btn btn-secondary" onClick={() => setShow(true)}>✏️ Sửa</button>
                                <button className="btn btn-danger" onClick={() => setRows(rows.filter(x => x._id !== r._id))}>🗑️ Xóa</button>
                            </td>
                        </tr>
                    ))}

                </tbody>
            </table>
            {rows.length === 0 && !isLoading && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📊</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có dữ liệu chỉ số cơ thể</div>
                    <div style={{ fontSize: '14px' }}>Thêm chỉ số đầu tiên để theo dõi sức khỏe</div>
                </div>
            )}
            {show && <EntityForm title="Chỉ số cơ thể" fields={[
                { name: 'hoiVien', label: 'Hội viên' },
                { name: 'chieuCao', label: 'Chiều cao (cm)' },
                { name: 'canNang', label: 'Cân nặng (kg)' },
                { name: 'nhipTim', label: 'Nhịp tim' }
            ]} onClose={() => setShow(false)} onSave={async (val) => {
                const bmi = (val.canNang / Math.pow(val.chieuCao / 100, 2)).toFixed(1);
                setRows([{
                    _id: `metric_${Date.now()}`,
                    ...val,
                    bmi,
                    ngayDo: new Date()
                }, ...rows]);
                setShow(false);
            }} />}
            {isLoading && <Loading overlay text="Đang tải chỉ số cơ thể..." />}
        </Card>
    );
};

const NutritionPage = () => {
    const [activeTab, setActiveTab] = useState<'meals' | 'plans'>('meals');

    return (
        <div className="nutrition-admin-page">
            <div className="nutrition-tabs">
                <button
                    className={`nutrition-tab ${activeTab === 'meals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meals')}
                >
                    Quản Lý Món Ăn
                </button>
                <button
                    className={`nutrition-tab ${activeTab === 'plans' ? 'active' : ''}`}
                    onClick={() => setActiveTab('plans')}
                >
                    Quản Lý Thực Đơn Hội Viên
                </button>
            </div>
            <div className="nutrition-content">
                {activeTab === 'meals' && <MealManager />}
                {activeTab === 'plans' && <MemberMealPlanManager />}
            </div>
        </div>
    );
};

const PaymentsPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<ThanhToan[]>([]);
    const filtered = rows.filter(r => `${r._id} ${r.hoiVien}`.toLowerCase().includes(q.toLowerCase()));

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get<ThanhToan[]>('/api/thanh-toan');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching payments:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    return (
        <section className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Thanh toán</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm HĐ/hội viên" value={q} onChange={e => setQ(e.target.value)} />
                    <button className="primary" onClick={() => setShow(true)}>Tạo mới</button>
                </div>
            </div>
            <table className="table">
                <thead><tr><th>Mã HĐ</th><th>Hội viên</th><th>Gói tập</th><th>Số tiền</th><th>Thời gian</th><th>Trạng thái</th><th></th></tr></thead>
                <tbody>
                    {filtered.map(r => (
                        <tr key={r._id}>
                            <td>{r._id}</td>
                            <td>{r.hoiVien}</td>
                            <td>{r.noiDung}</td>
                            <td>{r.soTien.toLocaleString('vi-VN')}₫</td>
                            <td>{new Date(r.ngayThanhToan).toLocaleString('vi-VN')}</td>
                            <td>
                                <span className={`badge ${r.phuongThuc ? 'success' : 'danger'}`}>
                                    {r.phuongThuc === 'THE_TIN_DUNG' ? 'THẺ' : r.phuongThuc === 'CHUYEN_KHOAN' ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT'}
                                </span>
                            </td>
                            <td className="row-actions">
                                <button className="btn btn-secondary" onClick={() => setShow(true)}>✏️ Sửa</button>
                                <button className="btn btn-danger" onClick={() => setRows(rows.filter(x => x._id !== r._id))}>🗑️ Xóa</button>
                            </td>
                        </tr>
                    ))}

                </tbody>
            </table>
            {isLoading && <Loading overlay text="Đang tải thanh toán..." />}
            {show && <EntityForm title="Thanh toán" fields={[
                { name: 'hoiVien', label: 'Hội viên' },
                { name: 'noiDung', label: 'Nội dung' },
                { name: 'soTien', label: 'Số tiền' },
                { name: 'phuongThuc', label: 'Phương thức' },
            ]} onClose={() => setShow(false)} onSave={async (val) => { setRows([{ _id: `tt_${Date.now()}`, hoiVien: val.hoiVien || '', soTien: val.soTien || 0, noiDung: val.noiDung || '', phuongThuc: val.phuongThuc || '', ngayThanhToan: new Date() as any, createdAt: new Date() as any, updatedAt: new Date() as any }, ...rows]); setShow(false); }} />}
        </section>
    );
};

const ReportsPage = () => {
    return (
        <section className="panel">
            <div className="toolbar"><div className="toolbar-left"><h2>Báo cáo</h2></div></div>
            <div className="reports-grid">
                <div className="report-card">
                    <div className="report-title">Báo cáo doanh thu</div>
                    <div className="report-placeholder">[Biểu đồ đường] 12 tháng</div>
                </div>
                <div className="report-card">
                    <div className="report-title">Tăng trưởng hội viên</div>
                    <div className="report-placeholder">[Biểu đồ cột] hàng tháng</div>
                </div>
                <div className="report-card">
                    <div className="report-title">Tỷ lệ tham gia lớp</div>
                    <div className="report-placeholder">[Biểu đồ tròn]</div>
                </div>
            </div>
        </section>
    );
};

const FeedbackPage = () => {
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const notifications = useCrudNotifications();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get('/api/feedback');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching feedback:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <section className="panel">
            <div className="toolbar"><div className="toolbar-left"><h2>Feedback</h2></div><div className="toolbar-right"><button className="primary" onClick={() => setShow(true)}>Tạo mới</button></div></div>
            <table className="table">
                <thead><tr><th>ID</th><th>Người dùng</th><th>Nội dung</th><th>Ngày tạo</th><th></th></tr></thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.id}><td>{r.id}</td><td>{r.user}</td><td>{r.content}</td><td>{r.created}</td>
                            <td className="row-actions">
                                <button className="btn-icon btn-view" onClick={() => notifications.generic.info('Nội dung chi tiết', r.content)}>👁️ Xem</button>
                                <button className="btn btn-danger" onClick={() => setRows(rows.filter(x => x.id !== r.id))}>🗑️ Xóa</button>
                            </td></tr>
                    ))}

                </tbody>
            </table>
            {show && <EntityForm title="Feedback" fields={[
                { name: 'user', label: 'Người dùng' },
                { name: 'content', label: 'Nội dung' },
            ]} onClose={() => setShow(false)} onSave={async (val) => { setRows([{ id: Math.max(...rows.map(r => r.id)) + 1, user: val.user || '', content: val.content || '', created: new Date().toISOString().slice(0, 10) }, ...rows]); setShow(false); }} />}
        </section>
    );
};

// Appointments Page (LichHenPT)
const AppointmentsPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<LichHenPT[]>([]);
    const filtered = rows.filter(r => `${r.hoiVien} ${r.pt}`.toLowerCase().includes(q.toLowerCase()));

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get<LichHenPT[]>('/api/lich-hen-pt');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch {
                const mock: LichHenPT[] = Array.from({ length: 8 }).map((_, i) => ({
                    _id: `lh_${i + 1}`,
                    hoiVien: `HV-${100 + i}` as any,
                    pt: ['Serene', 'Minh', 'Tuấn', 'Lan'][i % 4] as any,
                    ngayHen: new Date(2025, 8, 10 + i) as any,
                    gioHen: `${8 + i}:00`,
                    trangThaiLichHen: (i % 4 === 0 ? 'CHO_XAC_NHAN' : i % 4 === 1 ? 'DA_XAC_NHAN' : i % 4 === 2 ? 'DA_HUY' : 'HOAN_THANH') as any,
                    ghiChu: '' as any,
                    createdAt: new Date() as any,
                    updatedAt: new Date() as any,
                }));
                if (mounted) setRows(mock);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Lịch hẹn PT</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm HV/PT" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Hội viên</th>
                        <th>PT</th>
                        <th>Ngày hẹn</th>
                        <th>Giờ hẹn</th>
                        <th>Trạng thái</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(r => (
                        <tr key={r._id}>
                            <td>{r.hoiVien}</td>
                            <td>{r.pt}</td>
                            <td>{new Date(r.ngayHen).toLocaleDateString('vi-VN')}</td>
                            <td>{r.gioHen}</td>
                            <td>
                                <span className={`badge ${r.trangThaiLichHen === 'DA_XAC_NHAN' || r.trangThaiLichHen === 'HOAN_THANH' ? 'success' : r.trangThaiLichHen === 'CHO_XAC_NHAN' ? 'warning' : 'danger'}`}>
                                    {r.trangThaiLichHen.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td className="row-actions">
                                <button className="btn btn-secondary" onClick={() => setShow(true)}>✏️ Sửa</button>
                                <button className="btn btn-danger" onClick={() => setRows(rows.filter(x => x._id !== r._id))}>🗑️ Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {show && <EntityForm title="Lịch hẹn PT" fields={[
                { name: 'hoiVien', label: 'Hội viên' },
                { name: 'pt', label: 'PT' },
                { name: 'ngayHen', label: 'Ngày hẹn' },
                { name: 'gioHen', label: 'Giờ hẹn' },
                { name: 'trangThaiLichHen', label: 'Trạng thái' },
            ]} onClose={() => setShow(false)} onSave={async (val) => { setRows([{ _id: `lh_${Date.now()}`, hoiVien: val.hoiVien || '', pt: val.pt || '', ngayHen: val.ngayHen || new Date(), gioHen: val.gioHen || '', trangThaiLichHen: val.trangThaiLichHen || '', createdAt: new Date() as any, updatedAt: new Date() as any }, ...rows]); setShow(false); }} />}
            {isLoading && <Loading overlay text="Đang tải lịch hẹn..." />}
        </Card>
    );
};

// Notifications Page (ThongBao)
const NotificationsPage = () => {
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<ThongBao[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get<ThongBao[]>('/api/thong-bao');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching notifications:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Thông báo</h2></div>
                <div className="toolbar-right">
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <div className="notifications-grid">
                {rows.length === 0 && !isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        Chưa có thông báo nào
                    </div>
                ) : (
                    rows.map(notification => (
                        <Card key={notification._id} className="notification-card" hover>
                            <div className="notification-content">
                                <h3>{notification.tieuDe}</h3>
                                <p>{notification.noiDung}</p>
                                <div className="notification-date">
                                    {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('vi-VN') : ''}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
            {isLoading && <Loading overlay text="Đang tải thông báo..." />}
        </Card>
    );
};

// AI Suggestions Page (GoiYTuAI)
const AISuggestionsPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<GoiYTuAI[]>([]);
    const [selectedMember, setSelectedMember] = useState<HoiVien | null>(null);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<AIWorkoutSuggestion | null>(null);
    const [nutritionSuggestion, setNutritionSuggestion] = useState<AINutritionSuggestion | null>(null);
    const [healthAnalysis, setHealthAnalysis] = useState<string>('');
    const [members, setMembers] = useState<HoiVien[]>([]);
    const notifications = useCrudNotifications();

    useEffect(() => {
        // Fetch members for AI suggestions
        const fetchMembers = async () => {
            try {
                const data = await api.get<HoiVien[]>('/api/user/hoivien');
                if (Array.isArray(data)) setMembers(data);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };
        fetchMembers();

        // Mock data for AI suggestions
        const mockSuggestions: GoiYTuAI[] = [
            {
                _id: 'ai_1',
                hoiVien: 'Nguyễn Văn An',
                ngayGoiY: new Date('2024-01-15'),
                noiDung: 'Tập trung vào bài tập cardio và tăng cường sức bền. Nên tập 3-4 lần/tuần với cường độ vừa phải.',
                mucTieu: 'Giảm cân',
                doKho: 'TRUNG_BINH',
                thoiGianTap: 60,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            },
            {
                _id: 'ai_2',
                hoiVien: 'Trần Thị Bình',
                ngayGoiY: new Date('2024-01-16'),
                noiDung: 'Kết hợp bài tập với tạ và protein shake để tăng khối lượng cơ. Tập nặng 4-5 lần/tuần.',
                mucTieu: 'Tăng cơ',
                doKho: 'KHO',
                thoiGianTap: 90,
                createdAt: new Date('2024-01-16'),
                updatedAt: new Date('2024-01-16')
            }
        ];
        setRows(mockSuggestions);
    }, []);

    const generateWorkoutPlan = async (member: HoiVien) => {
        setGeneratingAI(true);
        try {
            const memberData = {
                age: member.ngaySinh ? new Date().getFullYear() - new Date(member.ngaySinh).getFullYear() : undefined,
                gender: member.gioiTinh === 'Nam' ? 'Nam' : 'Nữ',
                fitnessLevel: 'Người mới bắt đầu',
                goals: 'Tăng cường sức khỏe tổng quát',
                availableTime: 60
            };

            const suggestion = await geminiAI.generateWorkoutPlan(memberData);
            setAiSuggestion(suggestion);

            // Save to database
            const newSuggestion: GoiYTuAI = {
                _id: `ai_${Date.now()}`,
                hoiVien: member.hoTen,
                ngayGoiY: new Date(),
                noiDung: `${suggestion.workoutName}: ${suggestion.notes}`,
                mucTieu: 'Tập luyện cá nhân hóa',
                doKho: suggestion.difficulty,
                thoiGianTap: parseInt(suggestion.duration.replace(/\D/g, '')) || 60,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setRows([newSuggestion, ...rows]);
        } catch (error) {
            console.error('Error generating workout plan:', error);
            notifications.generic.error('Lỗi tạo kế hoạch', 'Không thể tạo kế hoạch tập luyện. Vui lòng kiểm tra API key Gemini.');
        } finally {
            setGeneratingAI(false);
        }
    };

    const generateNutritionPlan = async (member: HoiVien) => {
        setGeneratingAI(true);
        try {
            const memberData = {
                age: member.ngaySinh ? new Date().getFullYear() - new Date(member.ngaySinh).getFullYear() : undefined,
                gender: member.gioiTinh === 'Nam' ? 'Nam' : 'Nữ',
                weight: 70, // Default weight
                height: 170, // Default height
                activityLevel: 'Trung bình',
                goals: 'Duy trì sức khỏe'
            };

            const suggestion = await geminiAI.generateNutritionPlan(memberData);
            setNutritionSuggestion(suggestion);

            // Save to database
            const newSuggestion: GoiYTuAI = {
                _id: `ai_nutrition_${Date.now()}`,
                hoiVien: member.hoTen,
                ngayGoiY: new Date(),
                noiDung: `Kế hoạch dinh dưỡng ${suggestion.mealType}: ${suggestion.notes}`,
                mucTieu: 'Dinh dưỡng cá nhân hóa',
                doKho: 'TRUNG_BINH',
                thoiGianTap: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setRows([newSuggestion, ...rows]);
        } catch (error) {
            console.error('Error generating nutrition plan:', error);
            notifications.generic.error('Lỗi tạo kế hoạch', 'Không thể tạo kế hoạch dinh dưỡng. Vui lòng kiểm tra API key Gemini.');
        } finally {
            setGeneratingAI(false);
        }
    };

    const generateHealthAnalysis = async (member: HoiVien) => {
        setGeneratingAI(true);
        try {
            const memberData = {
                bmi: 22.5, // Default BMI
                heartRate: 75, // Default heart rate
                age: member.ngaySinh ? new Date().getFullYear() - new Date(member.ngaySinh).getFullYear() : undefined,
                gender: member.gioiTinh === 'Nam' ? 'Nam' : 'Nữ',
                activityLevel: 'Trung bình'
            };

            const analysis = await geminiAI.generateHealthAnalysis(memberData);
            setHealthAnalysis(analysis);

            // Save to database
            const newSuggestion: GoiYTuAI = {
                _id: `ai_health_${Date.now()}`,
                hoiVien: member.hoTen,
                ngayGoiY: new Date(),
                noiDung: analysis,
                mucTieu: 'Phân tích sức khỏe',
                doKho: 'DE',
                thoiGianTap: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setRows([newSuggestion, ...rows]);
        } catch (error) {
            console.error('Error generating health analysis:', error);
            notifications.generic.error('Lỗi phân tích', 'Không thể phân tích sức khỏe. Vui lòng kiểm tra API key Gemini.');
        } finally {
            setGeneratingAI(false);
        }
    };

    const filtered = rows.filter(r =>
        r.hoiVien.toLowerCase().includes(q.toLowerCase()) ||
        r.mucTieu.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="ai-suggestions-container">
            <Card className="panel">
                <div className="toolbar">
                    <div className="toolbar-left"><h2>Gợi ý từ AI</h2></div>
                    <div className="toolbar-right">
                        <input className="input" placeholder="Tìm hội viên/mục tiêu" value={q} onChange={e => setQ(e.target.value)} />
                        <Button variant="primary" onClick={() => setShow(true)}>Tạo gợi ý mới</Button>
                    </div>
                </div>

                {/* AI Generation Panel */}
                <Card className="ai-generation-panel" style={{ margin: '20px 0', padding: '20px' }}>
                    <h3>🤖 Tạo gợi ý AI cho hội viên</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                        <select
                            value={selectedMember?._id || ''}
                            onChange={(e) => {
                                const member = members.find(m => m._id === e.target.value);
                                setSelectedMember(member || null);
                            }}
                            className="input"
                            style={{ minWidth: '200px' }}
                        >
                            <option value="">Chọn hội viên</option>
                            {members.map(member => (
                                <option key={member._id} value={member._id}>
                                    {member.hoTen} - {member.email}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="primary"
                            disabled={!selectedMember || generatingAI}
                            onClick={() => selectedMember && generateWorkoutPlan(selectedMember)}
                        >
                            {generatingAI ? '⏳ Đang tạo...' : '🏋️ Tạo kế hoạch tập luyện'}
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={!selectedMember || generatingAI}
                            onClick={() => selectedMember && generateNutritionPlan(selectedMember)}
                        >
                            {generatingAI ? '⏳ Đang tạo...' : '🥗 Tạo kế hoạch dinh dưỡng'}
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={!selectedMember || generatingAI}
                            onClick={() => selectedMember && generateHealthAnalysis(selectedMember)}
                        >
                            {generatingAI ? '⏳ Đang phân tích...' : '📊 Phân tích sức khỏe'}
                        </Button>
                    </div>
                    {selectedMember && (
                        <div className="member-info" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                            <strong>Hội viên được chọn:</strong> {selectedMember.hoTen} |
                            <strong> Giới tính:</strong> {selectedMember.gioiTinh === 'Nam' ? 'Nam' : 'Nữ'} |
                            <strong> Email:</strong> {selectedMember.email}
                        </div>
                    )}
                </Card>

                <table className="table">
                    <thead>
                        <tr>
                            <th>Hội viên</th>
                            <th>Mục tiêu</th>
                            <th>Độ khó</th>
                            <th>Thời gian (phút)</th>
                            <th>Ngày tạo</th>
                            <th>Nội dung</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id}>
                                <td>{r.hoiVien}</td>
                                <td>{r.mucTieu}</td>
                                <td>
                                    <span className={`badge ${r.doKho === 'DE' ? 'success' : r.doKho === 'TRUNG_BINH' ? 'warning' : 'danger'}`}>
                                        {r.doKho.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>{r.thoiGianTap || 'N/A'}</td>
                                <td>{new Date(r.ngayGoiY).toLocaleDateString('vi-VN')}</td>
                                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.noiDung.length > 100 ? r.noiDung.substring(0, 100) + '...' : r.noiDung}
                                </td>
                                <td className="row-actions">
                                    <button className="btn btn-secondary" onClick={() => notifications.generic.info('Nội dung chi tiết', r.noiDung)}>👁️ Xem</button>
                                    <button className="btn btn-danger" onClick={() => setRows(rows.filter(x => x._id !== r._id))}>🗑️ Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {show && <EntityForm
                    title="Gợi ý AI"
                    initialData={undefined}
                    fields={[
                        { name: 'hoiVien', label: 'Hội viên' },
                        { name: 'mucTieu', label: 'Mục tiêu' },
                        { name: 'doKho', label: 'Độ khó', options: ['DE', 'TRUNG_BINH', 'KHO'] },
                        { name: 'thoiGianTap', label: 'Thời gian tập (phút)', type: 'number' },
                        { name: 'noiDung', label: 'Nội dung gợi ý', type: 'textarea' }
                    ]}
                    onClose={() => setShow(false)}
                    onSave={async (val) => {
                        setRows([{
                            _id: `ai_${Date.now()}`,
                            hoiVien: val.hoiVien || '',
                            noiDung: val.noiDung || `Gợi ý cho ${val.mucTieu || 'mục tiêu'}`,
                            mucTieu: val.mucTieu || '',
                            doKho: val.doKho || 'TRUNG_BINH',
                            thoiGianTap: parseInt(val.thoiGianTap) || 0,
                            ngayGoiY: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }, ...rows]);
                        setShow(false);
                    }}
                />}
            </Card>

            {/* AI Results Display */}
            {aiSuggestion && (
                <Card className="ai-result-panel" style={{ marginTop: '20px' }}>
                    <h3>🏋️ Kế hoạch tập luyện AI</h3>
                    <div><strong>Tên bài tập:</strong> {aiSuggestion.workoutName}</div>
                    <div><strong>Thời gian:</strong> {aiSuggestion.duration}</div>
                    <div><strong>Độ khó:</strong> {aiSuggestion.difficulty}</div>
                    <div><strong>Nhóm cơ target:</strong> {aiSuggestion.targetMuscles.join(', ')}</div>
                    <div><strong>Các bài tập:</strong></div>
                    <ul>
                        {aiSuggestion.exercises.map((exercise, index) => (
                            <li key={index}>
                                <strong>{exercise.name}</strong>: {exercise.sets} sets x {exercise.reps} reps,
                                nghỉ {exercise.restTime} - {exercise.description}
                            </li>
                        ))}
                    </ul>
                    <div><strong>Ghi chú:</strong> {aiSuggestion.notes}</div>
                </Card>
            )}

            {nutritionSuggestion && (
                <Card className="ai-result-panel" style={{ marginTop: '20px' }}>
                    <h3>🥗 Kế hoạch dinh dưỡng AI</h3>
                    <div><strong>Loại bữa ăn:</strong> {nutritionSuggestion.mealType}</div>
                    <div><strong>Tổng calories:</strong> {nutritionSuggestion.totalCalories} kcal</div>
                    <div><strong>Thực phẩm:</strong></div>
                    <ul>
                        {nutritionSuggestion.foods.map((food, index) => (
                            <li key={index}>
                                <strong>{food.name}</strong>: {food.quantity}
                                ({food.calories} kcal, Protein: {food.protein}g, Carbs: {food.carbs}g, Fat: {food.fat}g)
                            </li>
                        ))}
                    </ul>
                    <div><strong>Ghi chú:</strong> {nutritionSuggestion.notes}</div>
                </Card>
            )}

            {healthAnalysis && (
                <Card className="ai-result-panel" style={{ marginTop: '20px' }}>
                    <h3>📊 Phân tích sức khỏe AI</h3>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{healthAnalysis}</div>
                </Card>
            )}
        </div>
    );
};

const PackageRegistrationPage = () => {
    return <PackageRegistrationManager />;
};
