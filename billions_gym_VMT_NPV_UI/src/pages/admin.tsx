import './admin.css';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import EntityForm, { ConfirmModal } from '../components/EntityForm';
import { api, auth } from '../services/api';
import { geminiAI, AIWorkoutSuggestion, AINutritionSuggestion } from '../services/gemini';
import React from 'react';
type Stat = { label: string; value: string; trend?: 'up' | 'down'; sub?: string };

type SectionKey = 'overview' | 'members' | 'pt' | 'packages' | 'schedules' | 'sessions' | 'exercises' | 'body_metrics' | 'nutrition' | 'payments' | 'notifications' | 'feedback' | 'reports' | 'ai_suggestions' | 'appointments';

// Types based on backend models
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
    taiKhoan?: {
        _id: string;
        trangThaiTK: 'DANG_HOAT_DONG' | 'DA_KHOA';
    };
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
    danhGia: number;
    moTa: string;
    trangThaiPT: 'DANG_HOAT_DONG' | 'NGUNG_LAM_VIEC';
}

interface GoiTap {
    _id: string;
    tenGoiTap: string;
    moTa: string;
    donGia: number;
    thoiHan: number;
    hinhAnhDaiDien?: string;
    kichHoat: boolean;
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
    ngayTap: Date;
    pt: string;
    cacBaiTap: string[];
    trangThaiTap: 'DA_HOAN_THANH' | 'CHUA_HOAN_THANH';
    createdAt: Date;
    updatedAt: Date;
}

interface BaiTap {
    _id: string;
    tenBaiTap: string;
    moTa: string;
    hinhAnh: string;
    videoHuongDan: string;
    nhomCo: string;
    hinhAnhMinhHoa: string;
    createdAt: Date;
    updatedAt: Date;
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

// Mark otherwise-unused interfaces as used for linting purposes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const AdminDashboard = () => {
    const [section, setSection] = useState<SectionKey>(getSectionFromHash());
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<Stat[]>([]);
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [topPTs, setTopPTs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="brand">
                    <span className="title">BILLIONS</span>
                    <span className="subTitle">FITNESS & GYM</span>
                </div>
                <nav className="sidebar-nav">
                    <a className={`nav-item ${section === 'overview' ? 'active' : ''}`} href="#/admin">
                        <span className="nav-icon">📊</span>
                        Tổng quan
                    </a>
                    <a className={`nav-item ${section === 'members' ? 'active' : ''}`} href="#/admin/members">
                        <span className="nav-icon">👥</span>
                        Hội viên
                    </a>
                    <a className={`nav-item ${section === 'pt' ? 'active' : ''}`} href="#/admin/pt">
                        <span className="nav-icon">💪</span>
                        Huấn luyện viên
                    </a>
                    <a className={`nav-item ${section === 'packages' ? 'active' : ''}`} href="#/admin/packages">
                        <span className="nav-icon">📦</span>
                        Gói tập
                    </a>
                    <a className={`nav-item ${section === 'schedules' ? 'active' : ''}`} href="#/admin/schedules">
                        <span className="nav-icon">📅</span>
                        Lịch tập
                    </a>
                    <a className={`nav-item ${section === 'sessions' ? 'active' : ''}`} href="#/admin/sessions">
                        <span className="nav-icon">🏃‍♀️</span>
                        Buổi tập
                    </a>
                    <a className={`nav-item ${section === 'exercises' ? 'active' : ''}`} href="#/admin/exercises">
                        <span className="nav-icon">🏋️‍♂️</span>
                        Bài tập
                    </a>
                    <a className={`nav-item ${section === 'body_metrics' ? 'active' : ''}`} href="#/admin/body_metrics">
                        <span className="nav-icon">📏</span>
                        Chỉ số cơ thể
                    </a>
                    <a className={`nav-item ${section === 'nutrition' ? 'active' : ''}`} href="#/admin/nutrition">
                        <span className="nav-icon">🥗</span>
                        Dinh dưỡng
                    </a>
                    <a className={`nav-item ${section === 'payments' ? 'active' : ''}`} href="#/admin/payments">
                        <span className="nav-icon">💳</span>
                        Thanh toán
                    </a>
                    <a className={`nav-item ${section === 'appointments' ? 'active' : ''}`} href="#/admin/appointments">
                        <span className="nav-icon">📋</span>
                        Lịch hẹn PT
                    </a>
                    <a className={`nav-item ${section === 'notifications' ? 'active' : ''}`} href="#/admin/notifications">
                        <span className="nav-icon">🔔</span>
                        Thông báo
                    </a>
                    <a className={`nav-item ${section === 'feedback' ? 'active' : ''}`} href="#/admin/feedback">
                        <span className="nav-icon">💬</span>
                        Feedback
                    </a>
                    <a className={`nav-item ${section === 'ai_suggestions' ? 'active' : ''}`} href="#/admin/ai_suggestions">
                        <span className="nav-icon">🤖</span>
                        Gợi ý AI
                    </a>
                    <a className={`nav-item ${section === 'reports' ? 'active' : ''}`} href="#/admin/reports">
                        <span className="nav-icon">📈</span>
                        Báo cáo
                    </a>
                    <div className="sidebar-foot">v2.0.0</div>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <h1>{
                            section === 'overview' ? 'Tổng quan hệ thống' :
                                section === 'members' ? 'Quản lý hội viên' :
                                    section === 'pt' ? 'Quản lý huấn luyện viên' :
                                        section === 'packages' ? 'Quản lý gói tập' :
                                            section === 'schedules' ? 'Quản lý lịch tập' :
                                                section === 'sessions' ? 'Quản lý buổi tập' :
                                                    section === 'exercises' ? 'Quản lý bài tập' :
                                                        section === 'body_metrics' ? 'Chỉ số cơ thể' :
                                                            section === 'nutrition' ? 'Dinh dưỡng' :
                                                                section === 'payments' ? 'Thanh toán' :
                                                                    section === 'appointments' ? 'Lịch hẹn PT' :
                                                                        section === 'notifications' ? 'Thông báo' :
                                                                            section === 'feedback' ? 'Feedback' :
                                                                                section === 'ai_suggestions' ? 'Gợi ý AI' :
                                                                                    'Báo cáo'
                        }</h1>
                        <p>Quản trị toàn diện hệ thống Billions Fitness & Yoga</p>
                    </div>
                    <div className="header-right">
                        <input
                            className="search"
                            placeholder="Tìm kiếm nhanh (⌘K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button variant="primary" size="small">
                            🔍 Tìm kiếm
                        </Button>
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() => {
                                auth.clearToken();
                                window.location.href = '#/login';
                            }}
                        >
                            🚪 Đăng xuất
                        </Button>
                    </div>
                </header>

                {section === 'overview' && (
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
                )}

                {section === 'overview' && (
                    <div className="grid-2">
                        <Card title="Lịch hẹn PT sắp diễn ra" className="panel">
                            <div className="panel-head">
                                <a className="link" href="#/admin/appointments">Xem tất cả</a>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Hội viên</th>
                                        <th>PT</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAppointments.length > 0 ? recentAppointments.map((appointment: any) => (
                                        <tr key={appointment._id}>
                                            <td>{appointment.hoiVien || 'N/A'}</td>
                                            <td>{appointment.pt || 'N/A'}</td>
                                            <td>{new Date(appointment.ngayHen).toLocaleDateString('vi-VN')} {appointment.gioHen}</td>
                                            <td>
                                                <span className={`badge ${appointment.trangThaiLichHen === 'DA_XAC_NHAN' ? 'success' : 'warning'}`}>
                                                    {appointment.trangThaiLichHen === 'DA_XAC_NHAN' ? 'ĐÃ XÁC NHẬN' : 'CHỜ XÁC NHẬN'}
                                                </span>
                                            </td>
                                            <td className="row-actions">
                                                <Button variant="ghost" size="small">Sửa</Button>
                                                <Button variant="ghost" size="small">Hủy</Button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                                {isLoading ? 'Đang tải...' : 'Chưa có lịch hẹn nào'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>

                        <Card title="Thanh toán gần đây" className="panel">
                            <div className="panel-head">
                                <a className="link" href="#/admin/payments">Xem tất cả</a>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Hội viên</th>
                                        <th>Gói tập</th>
                                        <th>Số tiền</th>
                                        <th>Phương thức</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayments.length > 0 ? recentPayments.map((payment: any) => (
                                        <tr key={payment._id}>
                                            <td>{payment.hoiVien || 'N/A'}</td>
                                            <td>{payment.noiDung || 'N/A'}</td>
                                            <td>{payment.soTien ? payment.soTien.toLocaleString('vi-VN') + '₫' : '0₫'}</td>
                                            <td>{payment.phuongThuc || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${payment.trangThai === 'DA_THANH_TOAN' ? 'success' : 'danger'}`}>
                                                    {payment.trangThai === 'DA_THANH_TOAN' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                                {isLoading ? 'Đang tải...' : 'Chưa có thanh toán nào'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}

                {section === 'overview' && (
                    <div className="grid-3">
                        <Card title="Top PT theo lịch hẹn" className="panel">
                            <ul className="list">
                                {topPTs.length > 0 ? topPTs.map((pt: any) => (
                                    <li key={pt._id} className="list-row">
                                        <span>{pt.hoTen || 'N/A'}</span>
                                        <span className="muted">{pt.appointmentCount || 0} lịch hẹn</span>
                                    </li>
                                )) : (
                                    <li className="list-row">
                                        <span style={{ color: '#666' }}>{isLoading ? 'Đang tải...' : 'Chưa có dữ liệu PT'}</span>
                                    </li>
                                )}
                            </ul>
                        </Card>

                        <Card title="Tình trạng hội viên" className="panel">
                            <ul className="list">
                                {stats.length > 0 ? [
                                    ['ĐANG HOẠT ĐỘNG', stats.find(s => s.label === 'Hội viên hoạt động')?.value || '0'],
                                    ['TẠM NGƯNG', stats.find(s => s.label === 'Hội viên hoạt động')?.sub?.split(' ')[0] || '0'],
                                    ['TỔNG SỐ', stats.find(s => s.label === 'Tổng hội viên')?.value || '0']
                                ].map(([k, v]) => (
                                    <li key={k} className="list-row">
                                        <span>{k}</span>
                                        <span className="muted">{v}</span>
                                    </li>
                                )) : (
                                    <li className="list-row">
                                        <span style={{ color: '#666' }}>{isLoading ? 'Đang tải...' : 'Chưa có dữ liệu'}</span>
                                    </li>
                                )}
                            </ul>
                        </Card>

                        <Card title="Thông báo hệ thống" className="panel">
                            <ul className="list">
                                <li className="list-row">
                                    <span style={{ color: '#666' }}>Chưa có thông báo hệ thống</span>
                                </li>
                            </ul>
                        </Card>
                    </div>
                )}
                {section === 'members' && <MembersPage />}
                {section === 'pt' && <PTPage />}
                {section === 'packages' && <PackagesPage />}
                {section === 'schedules' && <SchedulesPage />}
                {section === 'sessions' && <SessionsPage />}
                {section === 'exercises' && <ExercisesPage />}
                {section === 'body_metrics' && <BodyMetricsPage />}
                {section === 'nutrition' && <NutritionPage />}
                {section === 'payments' && <PaymentsPage />}
                {section === 'appointments' && <AppointmentsPage />}
                {section === 'notifications' && <NotificationsPage />}
                {section === 'feedback' && <FeedbackPage />}
                {section === 'ai_suggestions' && <AISuggestionsPage />}
                {section === 'reports' && <ReportsPage />}
            </main>
        </div>
    );
};

export default AdminDashboard;

// --- Subpages ---
const MembersPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<HoiVien | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: HoiVien | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<HoiVien[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);

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
                            console.error(`Error fetching account for member ${member._id}:`, error);
                            // Trả về member với trạng thái mặc định nếu không tìm thấy tài khoản
                            return {
                                ...member,
                                taiKhoan: {
                                    _id: null,
                                    trangThaiTK: 'DANG_HOAT_DONG'
                                }
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

    const filtered = rows.filter(r =>
        r.hoTen.toLowerCase().includes(q.toLowerCase()) ||
        r.sdt.includes(q) ||
        r.email.toLowerCase().includes(q.toLowerCase())
    );

    // Hàm để thay đổi trạng thái tài khoản
    const handleChangeAccountStatus = async (memberId: string, newStatus: 'DANG_HOAT_DONG' | 'DA_KHOA') => {
        try {
            setIsChangingStatus(memberId);

            // Tìm hội viên để lấy thông tin tài khoản
            const member = rows.find(r => r._id === memberId);
            if (!member) {
                throw new Error('Không tìm thấy hội viên');
            }

            // Kiểm tra xem có tài khoản không
            if (!member.taiKhoan || !member.taiKhoan._id) {
                throw new Error('Hội viên chưa có tài khoản');
            }

            // Gọi API để khóa/mở khóa tài khoản dựa trên trạng thái
            if (newStatus === 'DA_KHOA') {
                // Khóa tài khoản - sử dụng ID của hội viên
                await api.put(`/api/user/taikhoan/${memberId}/lock`);
            } else if (newStatus === 'DANG_HOAT_DONG') {
                // Mở khóa tài khoản - sử dụng ID của hội viên
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

            alert('Cập nhật trạng thái tài khoản thành công!');
        } catch (error) {
            console.error('Error changing account status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái tài khoản!');
        } finally {
            setIsChangingStatus(null);
        }
    };

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý hội viên</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm tên/điện thoại/email" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>SĐT</th>
                        <th>Giới tính</th>
                        <th>Ngày sinh</th>
                        <th>Ngày tham gia</th>
                        <th>Trạng thái</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(r => (
                        <tr key={r._id}>
                            <td>
                                <div className="user-info">
                                    <img src={r.anhDaiDien} alt={r.hoTen} className="user-avatar" />
                                    <div>
                                        <div className="user-name">{r.hoTen}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{r.email}</td>
                            <td>{r.sdt}</td>
                            <td>{r.gioiTinh === 'Nam' ? 'Nam' : 'Nữ'}</td>
                            <td>{r.ngaySinh ? new Date(r.ngaySinh).toLocaleDateString('vi-VN') : 'N/A'}</td>
                            <td>{r.ngayThamGia ? new Date(r.ngayThamGia).toLocaleDateString('vi-VN') : 'N/A'}</td>
                            <td>
                                <span className={`badge ${!r.taiKhoan?._id ? 'warning' : r.taiKhoan?.trangThaiTK === 'DANG_HOAT_DONG' ? 'success' : 'danger'}`}>
                                    {!r.taiKhoan?._id ? 'CHƯA CÓ TÀI KHOẢN' : r.taiKhoan?.trangThaiTK === 'DANG_HOAT_DONG' ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                                </span>
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button className="btn-icon btn-edit" onClick={() => setEditingItem(r)}>
                                        ✏️ Sửa
                                    </button>
                                    <button
                                        className="status-select"
                                        onClick={() => {
                                            const currentStatus = r.taiKhoan?.trangThaiTK || 'DANG_HOAT_DONG';
                                            const newStatus = currentStatus === 'DANG_HOAT_DONG' ? 'DA_KHOA' : 'DANG_HOAT_DONG';
                                            handleChangeAccountStatus(r._id, newStatus as 'DANG_HOAT_DONG' | 'DA_KHOA');
                                        }}
                                        disabled={isChangingStatus === r._id || !r.taiKhoan?._id}
                                        style={{
                                            background: r.taiKhoan?.trangThaiTK === 'DANG_HOAT_DONG' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                                                'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            boxShadow: r.taiKhoan?.trangThaiTK === 'DANG_HOAT_DONG' ? '0 2px 8px rgba(239, 68, 68, 0.3)' :
                                                '0 2px 8px rgba(16, 185, 129, 0.3)',
                                            opacity: !r.taiKhoan?._id ? 0.5 : 1
                                        }}
                                    >
                                        {r.taiKhoan?.trangThaiTK === 'DANG_HOAT_DONG' ? '🔒 Vô hiệu hóa' : '🔓 Kích hoạt'}
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
            {(show || editingItem) && (
                <EntityForm
                    title="Hội viên"
                    initialData={editingItem || undefined}
                    fields={[
                        { name: 'anhDaiDien', label: 'Ảnh đại diện', type: 'file', validation: { maxSize: 5 } },
                        { name: 'hoTen', label: 'Họ tên', validation: { required: true, pattern: /^[\p{L}\s]+$/u, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' } },
                        { name: 'email', label: 'Email', type: 'email', validation: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không đúng định dạng' } },
                        { name: 'sdt', label: 'Số điện thoại', type: 'tel', validation: { required: true, pattern: /^\d{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' } },
                        { name: 'soCCCD', label: 'Số CCCD', validation: { required: true, pattern: /^\d{12}$/, message: 'Số CCCD phải có đúng 12 chữ số' } },
                        { name: 'ngaySinh', label: 'Ngày sinh', type: 'date', validation: { required: true } },
                        { name: 'gioiTinh', label: 'Giới tính', options: ['Nam', 'Nữ'], validation: { required: true } },
                        { name: 'diaChi', label: 'Địa chỉ', type: 'textarea', validation: { required: true } },
                        { name: 'trangThaiHoiVien', label: 'Trạng thái', options: ['DANG_HOAT_DONG', 'TAM_NGUNG', 'HET_HAN'], validation: { required: true } }
                    ]}
                    onClose={() => {
                        setShow(false);
                        setEditingItem(null);
                        setIsCopying(false);
                    }}
                    onSave={async (val) => {
                        try {
                            if (editingItem && !isCopying) {
                                // Cập nhật hội viên hiện tại
                                console.log('Updating member:', editingItem._id, val);
                                const updated = await api.put(`/api/user/hoivien/${editingItem._id}`, val);
                                console.log('Update response:', updated);
                                if (updated) {
                                    setRefreshTrigger(prev => prev + 1);
                                    alert('Cập nhật hội viên thành công!');
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
                                    ...(val.trangThaiHoiVien && { trangThaiHoiVien: val.trangThaiHoiVien }),
                                    ngayThamGia: new Date().toISOString(),
                                    ngayHetHan: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                                };
                                console.log('Creating new member:', newMember);
                                const created = await api.post('/api/user/hoivien', newMember);
                                console.log('Create response:', created);
                                if (created && created._id) {
                                    setRefreshTrigger(prev => prev + 1);
                                    alert(isCopying ? 'Sao chép hội viên thành công!' : 'Tạo hội viên mới thành công!');
                                } else {
                                    throw new Error('Không nhận được dữ liệu hội viên từ server');
                                }
                            }
                            setShow(false);
                            setEditingItem(null);
                            setIsCopying(false);
                        } catch (error) {
                            console.error('Error saving member:', error);
                            alert(`Lỗi khi ${editingItem && !isCopying ? 'cập nhật' : 'tạo'} hội viên: ${error.message || 'Vui lòng thử lại'}`);
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
                            console.log('Deleting member:', deleteConfirm.item!._id);
                            await api.delete(`/api/user/hoivien/${deleteConfirm.item!._id}`);
                            setRefreshTrigger(prev => prev + 1);
                            alert('Xóa hội viên thành công!');
                        } catch (error) {
                            console.error('Error deleting member:', error);
                            alert(`Lỗi khi xóa hội viên: ${error.message || 'Vui lòng thử lại'}`);
                        }
                        setDeleteConfirm({ show: false, item: null });
                    }}
                    onCancel={() => setDeleteConfirm({ show: false, item: null })}
                />
            )}
            {isLoading && <Loading overlay text="Đang tải hội viên..." />}
        </Card>
    );
};

// Packages Page
const PackagesPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<GoiTap | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: GoiTap | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<GoiTap[]>([]);

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

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý gói tập</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm gói tập" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <div className="packages-grid">
                {filtered.map(pkg => (
                    <Card key={pkg._id} className="package-card" hover>
                        <img src={pkg.hinhAnhDaiDien} alt={pkg.tenGoiTap} className="package-image" />
                        <div className="package-content">
                            <h3 className="package-title">{pkg.tenGoiTap}</h3>
                            <p className="package-description">{pkg.moTa}</p>
                            <div className="package-details">
                                <div className="package-price">{pkg.donGia ? pkg.donGia.toLocaleString('vi-VN') : '0'}₫</div>
                                <div className="package-duration">{pkg.thoiHan} ngày</div>
                            </div>
                            <div className="package-status">
                                <span className={`badge ${pkg.kichHoat ? 'success' : 'danger'}`}>
                                    {pkg.kichHoat ? 'ĐANG BÁN' : 'TẠM NGƯNG'}
                                </span>
                            </div>
                            <div className="package-actions">
                                <Button variant="ghost" size="small" onClick={() => setEditingItem(pkg)}>Sửa</Button>
                                <Button variant="ghost" size="small" onClick={() => { const copyData = { ...pkg }; delete (copyData as any)._id; setEditingItem(copyData); setShow(true); }}>Sao chép</Button>
                                <Button variant="ghost" size="small" onClick={() => setDeleteConfirm({ show: true, item: pkg })}>Xóa</Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            {(show || editingItem) && <EntityForm
                title="Gói tập"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'hinhAnhDaiDien', label: 'Hình ảnh đại diện', type: 'file', validation: { maxSize: 5 } },
                    { name: 'tenGoiTap', label: 'Tên gói tập', validation: { required: true, pattern: /^[\p{L}\d\s\-_]+$/u, message: 'Tên gói tập không được chứa ký tự đặc biệt' } },
                    { name: 'moTa', label: 'Mô tả', type: 'textarea', validation: { required: true } },
                    { name: 'donGia', label: 'Đơn giá (VNĐ)', type: 'number', validation: { required: true, pattern: /^\d+$/, message: 'Đơn giá phải là số nguyên dương' } },
                    { name: 'thoiHan', label: 'Thời hạn (ngày)', type: 'number', validation: { required: true, pattern: /^\d+$/, message: 'Thời hạn phải là số nguyên dương' } },
                    { name: 'kichHoat', label: 'Trạng thái', options: ['true', 'false'], validation: { required: true } }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {
                        const packageData = {
                            ...val,
                            donGia: parseInt(val.donGia),
                            thoiHan: parseInt(val.thoiHan),
                            kichHoat: val.kichHoat === 'true'
                        };

                        if (editingItem) {
                            const updated = await api.put(`/api/goitap/${editingItem._id}`, packageData);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                        } else {
                            const created = await api.post('/api/goitap', packageData);
                            setRows([created, ...rows]);
                        }
                    } catch (error) {
                        console.error('Error saving package:', error);
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
                    } catch (error) {
                        console.error('Error deleting package:', error);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
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
                    console.log('API response data: ', schedulesData);
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
        const hoiVienName = r.hoiVien && typeof r.hoiVien === 'object' ? r.hoiVien.hoTen || '' : r.hoiVien || '';
        const ptName = typeof r.pt === 'object' ? r.pt?.hoTen || '' : r.pt || '';
        return hoiVienName.toLowerCase().includes(q.toLowerCase()) ||
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
            {rows.length === 0 && !isLoading && (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-title">Chưa có lịch tập nào</div>
                    <div className="empty-state-description">Tạo lịch tập đầu tiên cho hội viên của bạn</div>
                </div>
            )}
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
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {
                        if (editingItem && !isCopying) {
                            console.log('Updating schedule:', editingItem._id, val);
                            // Update existing schedule
                            const updated = await api.put(`/api/lichtap/${editingItem._id}`, val);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                        } else {
                            console.log('Creating new schedule:', val);
                            // Create new schedule (including when copying)
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
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<PT | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: PT | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<PT[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get<PT[]>('/api/user/pt');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching PTs:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const filtered = rows.filter(r =>
        r.hoTen.toLowerCase().includes(q.toLowerCase()) ||
        r.email.toLowerCase().includes(q.toLowerCase()) ||
        r.chuyenMon.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý huấn luyện viên</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm tên/chuyên môn" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Huấn luyện viên</th>
                        <th>Chuyên môn</th>
                        <th>Kinh nghiệm</th>
                        <th>Đánh giá</th>
                        <th>Trạng thái</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(r => (
                        <tr key={r._id}>
                            <td>
                                <div className="user-info">
                                    <img src={r.anhDaiDien} alt={r.hoTen} className="user-avatar" />
                                    <div>
                                        <div className="user-name">{r.hoTen}</div>
                                        <div className="user-id">{r.bangCapChungChi}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{r.chuyenMon}</td>
                            <td>{r.kinhNghiem} năm</td>
                            <td>
                                <div className="rating">
                                    <span className="stars">{'★'.repeat(Math.floor(r.danhGia || 0))}</span>
                                    <span className="rating-value">{r.danhGia ? r.danhGia.toFixed(1) : '0.0'}</span>
                                </div>
                            </td>
                            <td>
                                <span className={`badge ${r.trangThaiPT === 'DANG_HOAT_DONG' ? 'success' : 'danger'}`}>
                                    {r.trangThaiPT === 'DANG_HOAT_DONG' ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG LÀM VIỆC'}
                                </span>
                            </td>
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
            {(show || editingItem) && <EntityForm
                title="Huấn luyện viên"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'anhDaiDien', label: 'Ảnh đại diện', type: 'file', validation: { maxSize: 5 } },
                    { name: 'hoTen', label: 'Họ tên', validation: { required: true, pattern: /^[\p{L}\s]+$/u, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' } },
                    { name: 'email', label: 'Email', type: 'email', validation: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không đúng định dạng' } },
                    { name: 'sdt', label: 'Số điện thoại', type: 'tel', validation: { required: true, pattern: /^\d{10,11}$/, message: 'Số điện thoại phải có 10-11 chữ số' } },
                    { name: 'soCCCD', label: 'Số CCCD', validation: { required: true, pattern: /^\d{12}$/, message: 'Số CCCD phải có đúng 12 chữ số' } },
                    { name: 'ngaySinh', label: 'Ngày sinh', type: 'date', validation: { required: true } },
                    { name: 'gioiTinh', label: 'Giới tính', options: ['NAM', 'NU'], validation: { required: true } },
                    { name: 'diaChi', label: 'Địa chỉ', type: 'textarea', validation: { required: true } },
                    { name: 'chuyenMon', label: 'Chuyên môn', validation: { required: true } },
                    { name: 'kinhNghiem', label: 'Kinh nghiệm (năm)', type: 'number', validation: { required: true, pattern: /^\d+$/, message: 'Kinh nghiệm phải là số nguyên dương' } },
                    { name: 'bangCapChungChi', label: 'Bằng cấp/Chứng chỉ', validation: { required: true } },
                    { name: 'danhGia', label: 'Đánh giá (1-5)', type: 'number', validation: { pattern: /^[1-5]$/, message: 'Đánh giá phải từ 1 đến 5' } },
                    { name: 'moTa', label: 'Mô tả', type: 'textarea' },
                    { name: 'trangThaiPT', label: 'Trạng thái', options: ['DANG_HOAT_DONG', 'NGUNG_LAM_VIEC'], validation: { required: true } }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {
                        const ptData = {
                            ...val,
                            kinhNghiem: parseInt(val.kinhNghiem) || 0,
                            danhGia: parseFloat(val.danhGia) || 0
                        };

                        if (editingItem) {
                            const updated = await api.put(`/api/user/pt/${editingItem._id}`, ptData);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                        } else {
                            const created = await api.post('/api/user/pt', ptData);
                            setRows([created, ...rows]);
                        }
                    } catch (error) {
                        console.error('Error saving PT:', error);
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
                    } catch (error) {
                        console.error('Error deleting PT:', error);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {isLoading && <Loading overlay text="Đang tải PT..." />}
        </Card>
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
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get('/api/buoitap');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching sessions:', e);
                // Fallback mock data when API is not available
                const mockSessions = [
                    {
                        _id: 'session_1',
                        ngayTap: new Date('2024-01-15'),
                        pt: 'PT Minh',
                        cacBaiTap: ['Push-up', 'Squat', 'Plank'],
                        trangThaiTap: 'DA_HOAN_THANH'
                    },
                    {
                        _id: 'session_2',
                        ngayTap: new Date('2024-01-17'),
                        pt: 'PT Lan',
                        cacBaiTap: ['Deadlift', 'Pull-up'],
                        trangThaiTap: 'CHUA_HOAN_THANH'
                    },
                    {
                        _id: 'session_3',
                        ngayTap: new Date('2024-01-20'),
                        pt: 'PT Tuấn',
                        cacBaiTap: ['Bench Press', 'Shoulder Press', 'Bicep Curl', 'Tricep Dip'],
                        trangThaiTap: 'DA_HOAN_THANH'
                    }
                ];
                if (mounted) setRows(mockSessions);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const filtered = rows.filter(r => {
        const ptName = typeof r.pt === 'object' ? r.pt?.hoTen || '' : r.pt || '';
        return ptName.toLowerCase().includes(q.toLowerCase());
    });

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý buổi tập</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm PT" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <div className="table-enhanced">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Ngày tập</th>
                            <th>PT</th>
                            <th>Số bài tập</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id}>
                                <td>{r.ngayTap ? new Date(r.ngayTap).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>{typeof r.pt === 'object' ? r.pt?.hoTen || 'N/A' : r.pt || 'N/A'}</td>
                                <td>{Array.isArray(r.cacBaiTap) ? r.cacBaiTap.length : 0}</td>
                                <td>
                                    <span className={`status-badge ${r.trangThaiTap === 'DA_HOAN_THANH' ? 'completed' : 'pending'}`}>
                                        {r.trangThaiTap === 'DA_HOAN_THANH' ? '✓ Hoàn thành' : '⏳ Chưa hoàn thành'}
                                    </span>
                                </td>
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
            {rows.length === 0 && !isLoading && (
                <div className="empty-state">
                    <div className="empty-state-icon">💪</div>
                    <div className="empty-state-title">Chưa có buổi tập nào</div>
                    <div className="empty-state-description">Tạo buổi tập đầu tiên cho hội viên</div>
                </div>
            )}
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
                            // Update existing PT
                            const updated = await api.put(`/api/buoitap/${editingItem._id}`, val);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                        } else {
                            // Create new PT (including when copying)
                            const created = await api.post('/api/buoitap', val);
                            setRows([created, ...rows]);
                        }
                    } catch (error) {
                        console.error('Error saving session:', error);
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
                        setRows(rows.filter(r => r._id !== deleteConfirm.item!._id));
                    } catch (error) {
                        console.error('Error deleting session:', error);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {isLoading && <Loading overlay text="Đang tải buổi tập..." />}
        </Card>
    );
};

// Exercises Page
const ExercisesPage = () => {
    const [q, setQ] = useState('');
    const [show, setShow] = useState(false);
    const [editingItem, setEditingItem] = useState<BaiTap | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: BaiTap | null }>({ show: false, item: null });
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get('/api/baitap');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching exercises:', e);
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const filtered = rows.filter(r =>
        (r.tenBaiTap && typeof r.tenBaiTap === 'string' ? r.tenBaiTap.toLowerCase() : '').includes(q.toLowerCase()) ||
        (r.nhomCo && typeof r.nhomCo === 'string' ? r.nhomCo.toLowerCase() : '').includes(q.toLowerCase())
    );

    return (
        <Card className="panel">
            <div className="toolbar">
                <div className="toolbar-left"><h2>Quản lý bài tập</h2></div>
                <div className="toolbar-right">
                    <input className="input" placeholder="Tìm bài tập" value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <div className="exercises-grid">
                {filtered.map(exercise => (
                    <Card key={exercise._id} className="exercise-card" hover>
                        <img src={exercise.hinhAnh} alt={exercise.tenBaiTap} className="exercise-image" />
                        <div className="exercise-content">
                            <h3 className="exercise-title">{exercise.tenBaiTap}</h3>
                            <p className="exercise-description">{exercise.moTa}</p>
                            <div className="exercise-muscle-group">
                                <span className="muscle-tag">{exercise.nhomCo}</span>
                            </div>
                            <div className="exercise-actions">
                                <Button variant="ghost" size="small" onClick={() => setEditingItem(exercise)}>Sửa</Button>
                                <Button variant="ghost" size="small" onClick={() => { const copyData = { ...exercise }; delete (copyData as any)._id; setEditingItem(copyData); setShow(true); }}>Sao chép</Button>
                                <Button variant="ghost" size="small" onClick={() => setDeleteConfirm({ show: true, item: exercise })}>Xóa</Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            {rows.length === 0 && !isLoading && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>&#127942;</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có bài tập nào</div>
                    <div style={{ fontSize: '14px' }}>Thêm bài tập đầu tiên vào thư viện</div>
                </div>
            )}
            {(show || editingItem) && <EntityForm
                title="Bài tập"
                initialData={editingItem || undefined}
                fields={[
                    { name: 'hinhAnh', label: 'Hình ảnh bài tập', type: 'file', validation: { maxSize: 5 } },
                    { name: 'tenBaiTap', label: 'Tên bài tập', validation: { required: true, pattern: /^[\p{L}\d\s\-_]+$/u, message: 'Tên bài tập không được chứa ký tự đặc biệt' } },
                    { name: 'moTa', label: 'Mô tả', type: 'textarea', validation: { required: true } },
                    { name: 'nhomCo', label: 'Nhóm cơ', validation: { required: true } },
                    { name: 'videoHuongDan', label: 'Video hướng dẫn (URL)', validation: { pattern: /^https?:\/\/.+/, message: 'URL video không hợp lệ' } },
                    { name: 'hinhAnhMinhHoa', label: 'Hình ảnh minh họa (URL)', validation: { pattern: /^https?:\/\/.+/, message: 'URL hình ảnh không hợp lệ' } }
                ]}
                onClose={() => { setShow(false); setEditingItem(null); }}
                onSave={async (val) => {
                    try {
                        if (editingItem) {
                            const updated = await api.put(`/api/baitap/${editingItem._id}`, val);
                            setRows(rows.map(r => r._id === editingItem._id ? { ...r, ...updated } : r));
                        } else {
                            const created = await api.post('/api/baitap', val);
                            setRows([created, ...rows]);
                        }
                    } catch (error) {
                        console.error('Error saving exercise:', error);
                    }
                    setShow(false);
                    setEditingItem(null);
                }}
            />}
            {deleteConfirm.show && deleteConfirm.item && <ConfirmModal
                title="Xác nhận xóa bài tập"
                message={`Bạn có chắc chắn muốn xóa bài tập "${deleteConfirm.item.tenBaiTap}"? Hành động này không thể hoàn tác.`}
                type="danger"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={async () => {
                    try {
                        await api.delete(`/api/baitap/${deleteConfirm.item!._id}`);
                        setRows(rows.filter(r => r._id !== deleteConfirm.item!._id));
                    } catch (error) {
                        console.error('Error deleting exercise:', error);
                    }
                    setDeleteConfirm({ show: false, item: null });
                }}
                onCancel={() => setDeleteConfirm({ show: false, item: null })}
            />}
            {isLoading && <Loading overlay text="Đang tải bài tập..." />}
        </Card>
    );
};

// ... rest of the code remains the same ...
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
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const data = await api.get('/api/dinhduong');
                if (mounted && Array.isArray(data)) setRows(data);
            } catch (e) {
                console.error('Error fetching nutrition:', e);
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
                <div className="toolbar-left"><h2>Dinh dưỡng</h2></div>
                <div className="toolbar-right">
                    <Button variant="primary" onClick={() => setShow(true)}>Tạo mới</Button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Hội viên</th>
                        <th>Bữa ăn</th>
                        <th>Lượng calo</th>
                        <th>Ngày gợi ý</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r._id}>
                            <td>{r.hoiVien}</td>
                            <td>{r.buaAn}</td>
                            <td>{r.luongCalo} kcal</td>
                            <td>{r.ngayGoiY ? new Date(r.ngayGoiY).toLocaleDateString('vi-VN') : 'N/A'}</td>
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
                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🥗</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có gợi ý dinh dưỡng</div>
                    <div style={{ fontSize: '14px' }}>Tạo gợi ý dinh dưỡng đầu tiên</div>
                </div>
            )}
            {show && <EntityForm title="Dinh dưỡng" fields={[
                { name: 'hoiVien', label: 'Hội viên' },
                { name: 'buaAn', label: 'Bữa ăn' },
                { name: 'luongCalo', label: 'Lượng calo' }
            ]} onClose={() => setShow(false)} onSave={async (val) => {
                setRows([{ _id: `nutrition_${Date.now()}`, ...val, ngayGoiY: new Date() }, ...rows]);
                setShow(false);
            }} />}
        </Card>
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
                                <button className="btn btn-secondary" onClick={() => setShow(true)}>💬 Trả lời</button>
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
            alert('Lỗi khi tạo kế hoạch tập luyện. Vui lòng kiểm tra API key Gemini.');
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
            alert('Lỗi khi tạo kế hoạch dinh dưỡng. Vui lòng kiểm tra API key Gemini.');
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
            alert('Lỗi khi phân tích sức khỏe. Vui lòng kiểm tra API key Gemini.');
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
                                    <button className="btn btn-secondary" onClick={() => alert(r.noiDung)}>👁️ Xem</button>
                                    <button className="btn btn-danger" onClick={() => setRows(rows.filter(x => x._id !== r._id))}>🗑️ Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {show && <EntityForm title="Gợi ý AI" fields={[
                    { name: 'hoiVien', label: 'Hội viên' },
                    { name: 'mucTieu', label: 'Mục tiêu' },
                    { name: 'doKho', label: 'Độ khó', options: ['DE', 'TRUNG_BINH', 'KHO'] },
                    { name: 'thoiGianTap', label: 'Thời gian tập (phút)', type: 'number' },
                    { name: 'noiDung', label: 'Nội dung gợi ý', type: 'textarea' }
                ]} onClose={() => setShow(false)} onSave={async (val) => {
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
                }} />}
                {isLoading && <Loading overlay text="Đang tải gợi ý AI..." />}
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
