import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';
import {
    Calendar, Clock, Users, MapPin, Activity, CheckCircle,
    XCircle, AlertCircle, TrendingUp, Award, Filter,
    ChevronDown, Grid, List, Plus, Search, MoreVertical,
    UserCheck, UserX, Edit, Trash2, Eye, Download
} from 'lucide-react';

const PTSessions = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [filter, setFilter] = useState({ trangThai: '' });
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('all'); // 'all', 'today', 'week', 'month'
    const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, name, status
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadSessions();
    }, [filter, selectedDate]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            // Build date filter for API
            const now = new Date();
            let ngayBatDau = null;
            let ngayKetThuc = null;
            if (selectedDate === 'today') {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                const end = new Date(now);
                end.setHours(23, 59, 59, 999);
                ngayBatDau = start.toISOString();
                ngayKetThuc = end.toISOString();
            } else if (selectedDate === 'week') {
                const start = new Date(now);
                const day = start.getDay(); // 0 Sun
                const diffToMon = day === 0 ? 6 : day - 1;
                start.setDate(start.getDate() - diffToMon);
                start.setHours(0, 0, 0, 0);
                const end = new Date(start);
                end.setDate(start.getDate() + 7);
                end.setHours(23, 59, 59, 999);
                ngayBatDau = start.toISOString();
                ngayKetThuc = end.toISOString();
            } else if (selectedDate === 'month') {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                ngayBatDau = start.toISOString();
                ngayKetThuc = end.toISOString();
            }

            const response = await ptService.getMySessions({
                trangThai: filter.trangThai,
                ngayBatDau,
                ngayKetThuc,
                limit: 500
            });
            if (response.success) {
                setSessions(response.data.buoiTaps || []);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProgress = async (hoiVienId, trangThai) => {
        if (!selectedSession) return;
        try {
            await ptService.updateSessionProgress({
                buoiTapId: selectedSession._id,
                hoiVienId,
                trangThai
            });
            loadSessions();
            setSelectedSession(null);
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    // Calculate statistics
    const stats = (() => {
        const now = new Date();
        const total = sessions.length;
        const upcoming = sessions.filter(s => {
            const d = new Date(s.ngayTap);
            return s.trangThai === 'CHUAN_BI' || d > now;
        }).length;
        const ongoing = sessions.filter(s => s.trangThai === 'DANG_DIEN_RA').length;
        const completed = sessions.filter(s => s.trangThai === 'HOAN_THANH').length;
        const totalMembers = sessions.reduce((sum, s) => {
            const cnt = s.soLuongHienTai ?? (s.danhSachHoiVien?.length || 0);
            return sum + cnt;
        }, 0);
        const avgAttendance = total > 0
            ? Math.round(
                sessions.reduce((sum, s) => {
                    const current = s.soLuongHienTai ?? (s.danhSachHoiVien?.length || 0);
                    const max = s.soLuongToiDa || 1;
                    return sum + Math.min((current / max) * 100, 100);
                }, 0) / total
            )
            : 0;
        return { total, upcoming, ongoing, completed, totalMembers, avgAttendance };
    })();

    // Filter sessions based on search and date on client (fallback)
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.tenBuoiTap?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'date_asc') {
            return new Date(a.ngayTap) - new Date(b.ngayTap);
        }
        if (sortBy === 'date_desc') {
            return new Date(b.ngayTap) - new Date(a.ngayTap);
        }
        if (sortBy === 'name') {
            return (a.tenBuoiTap || '').localeCompare(b.tenBuoiTap || '');
        }
        if (sortBy === 'status') {
            return (a.trangThai || '').localeCompare(b.trangThai || '');
        }
        return 0;
    });

    const getStatusBadge = (status) => {
        const badges = {
            'CHUAN_BI': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Chuẩn bị', icon: Clock },
            'DANG_DIEN_RA': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Đang diễn ra', icon: Activity },
            'HOAN_THANH': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: 'Hoàn thành', icon: CheckCircle },
            'HUY': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Đã hủy', icon: XCircle }
        };
        return badges[status] || badges['CHUAN_BI'];
    };

    const getAttendanceStatusBadge = (status) => {
        const badges = {
            'DA_DANG_KY': { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Đã đăng ký' },
            'DA_THAM_GIA': { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Đã tham gia' },
            'VANG_MAT': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Vắng mặt' },
            'HUY': { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Đã hủy' }
        };
        return badges[status] || badges['DA_DANG_KY'];
    };

    const DetailModal = ({ session, onClose }) => {
        if (!session) return null;
        const statusBadge = getStatusBadge(session.trangThai || '');
        const StatusIcon = statusBadge.icon;
        const currentCount = session.soLuongHienTai ?? (session.danhSachHoiVien?.length || 0);
        const maxCount = session.soLuongToiDa || 1;
        const attendanceRate = Math.min((currentCount / maxCount) * 100, 100);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                        <div>
                            <h3 className="text-xl font-bold text-white">{session.tenBuoiTap}</h3>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} mt-2`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusBadge.label}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                        >
                            Đóng
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-[#141414] rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Ngày tập</div>
                                <div className="text-white">
                                    {session.ngayTap ? new Date(session.ngayTap).toLocaleDateString('vi-VN', {
                                        weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                                    }) : '--'}
                                </div>
                            </div>
                            <div className="bg-[#141414] rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Thời gian</div>
                                <div className="text-white">{session.gioBatDau} - {session.gioKetThuc}</div>
                            </div>
                            <div className="bg-[#141414] rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Học viên</div>
                                <div className="text-white">{currentCount}/{session.soLuongToiDa || 0}</div>
                            </div>
                            <div className="bg-[#141414] rounded-lg p-3">
                                <div className="text-xs text-gray-400 mb-1">Tỷ lệ đăng ký</div>
                                <div className="text-white">{Math.round(attendanceRate)}%</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm text-gray-400">Danh sách học viên</div>
                            {session.danhSachHoiVien && session.danhSachHoiVien.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#141414]">
                                    {session.danhSachHoiVien.map((member, idx) => {
                                        const attendanceBadge = getAttendanceStatusBadge(member.trangThai);
                                        return (
                                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-[#0f0f0f] rounded-lg">
                                                {member.hoiVien?.anhDaiDien ? (
                                                    <img
                                                        src={member.hoiVien.anhDaiDien}
                                                        alt={member.hoiVien.hoTen}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#da2128] to-[#b91d24] flex items-center justify-center text-white font-bold text-sm">
                                                        {member.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{member.hoiVien?.hoTen || 'N/A'}</p>
                                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${attendanceBadge.bg} ${attendanceBadge.text}`}>
                                                        {attendanceBadge.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Chưa có học viên đăng ký</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Quản lý buổi tập</h2>
                                <p className="text-gray-400">Theo dõi và quản lý các buổi tập của bạn</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-[#da2128] text-white rounded-lg hover:bg-[#b91d24] transition-colors cursor-pointer">
                                <Plus className="w-5 h-5" />
                                <span>Tạo buổi tập mới</span>
                            </button>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                            <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="text-2xl font-bold text-purple-400 mb-1">{stats.total}</div>
                                <div className="text-xs text-gray-400">Tổng buổi tập</div>
                            </div>

                            <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.upcoming}</div>
                                <div className="text-xs text-gray-400">Sắp diễn ra</div>
                            </div>

                            <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <Activity className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="text-2xl font-bold text-green-400 mb-1">{stats.ongoing}</div>
                                <div className="text-xs text-gray-400">Đang diễn ra</div>
                            </div>

                            <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="text-2xl font-bold text-gray-400 mb-1">{stats.completed}</div>
                                <div className="text-xs text-gray-400">Hoàn thành</div>
                            </div>

                            <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.totalMembers}</div>
                                <div className="text-xs text-gray-400">Tổng học viên</div>
                            </div>

                            <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-5 h-5 text-[#da2128]" />
                                </div>
                                <div className="text-2xl font-bold text-[#da2128] mb-1">{stats.avgAttendance}%</div>
                                <div className="text-xs text-gray-400">Tỷ lệ đăng ký</div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-[#141414] rounded-xl p-4 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm buổi tập..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#2a2a2a] transition-colors"
                                />
                            </div>

                            {/* Date Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                    className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer min-w-[160px] justify-between"
                                >
                                    <span className="text-sm">
                                        {selectedDate === 'all' ? 'Tất cả thời gian' :
                                            selectedDate === 'today' ? 'Hôm nay' :
                                                selectedDate === 'week' ? 'Tuần này' : 'Tháng này'}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {showDateDropdown && (
                                    <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setSelectedDate('all'); setShowDateDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${selectedDate === 'all' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Tất cả thời gian
                                            </button>
                                            <button
                                                onClick={() => { setSelectedDate('today'); setShowDateDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${selectedDate === 'today' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Hôm nay
                                            </button>
                                            <button
                                                onClick={() => { setSelectedDate('week'); setShowDateDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${selectedDate === 'week' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Tuần này
                                            </button>
                                            <button
                                                onClick={() => { setSelectedDate('month'); setShowDateDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${selectedDate === 'month' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Tháng này
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer min-w-[160px] justify-between"
                                >
                                    <span className="text-sm">
                                        {filter.trangThai === '' ? 'Tất cả trạng thái' :
                                            filter.trangThai === 'CHUAN_BI' ? 'Chuẩn bị' :
                                                filter.trangThai === 'DANG_DIEN_RA' ? 'Đang diễn ra' :
                                                    filter.trangThai === 'HOAN_THANH' ? 'Hoàn thành' : 'Đã hủy'}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {showStatusDropdown && (
                                    <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setFilter({ ...filter, trangThai: '' }); setShowStatusDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filter.trangThai === '' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Tất cả trạng thái
                                            </button>
                                            <button
                                                onClick={() => { setFilter({ ...filter, trangThai: 'CHUAN_BI' }); setShowStatusDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filter.trangThai === 'CHUAN_BI' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Chuẩn bị
                                            </button>
                                            <button
                                                onClick={() => { setFilter({ ...filter, trangThai: 'DANG_DIEN_RA' }); setShowStatusDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filter.trangThai === 'DANG_DIEN_RA' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Đang diễn ra
                                            </button>
                                            <button
                                                onClick={() => { setFilter({ ...filter, trangThai: 'HOAN_THANH' }); setShowStatusDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filter.trangThai === 'HOAN_THANH' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Hoàn thành
                                            </button>
                                            <button
                                                onClick={() => { setFilter({ ...filter, trangThai: 'HUY' }); setShowStatusDropdown(false); }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filter.trangThai === 'HUY' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                    }`}
                                            >
                                                Đã hủy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer min-w-[160px] justify-between"
                                >
                                    <span className="text-sm">
                                        {sortBy === 'date_desc' ? 'Mới nhất'
                                            : sortBy === 'date_asc' ? 'Cũ nhất'
                                                : sortBy === 'name' ? 'Tên A-Z'
                                                    : 'Theo trạng thái'}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                {showFilterDropdown && (
                                    <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                        <div className="p-2">
                                            {[
                                                { id: 'date_desc', label: 'Mới nhất' },
                                                { id: 'date_asc', label: 'Cũ nhất' },
                                                { id: 'name', label: 'Tên A-Z' },
                                                { id: 'status', label: 'Theo trạng thái' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => { setSortBy(opt.id); setShowFilterDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${sortBy === opt.id ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex gap-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded cursor-pointer ${viewMode === 'list' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sessions List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : filteredSessions.length > 0 ? (
                        viewMode === 'grid' ? (
                            // Grid View
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredSessions.map(session => {
                                    const statusBadge = getStatusBadge(session.trangThai);
                                    const StatusIcon = statusBadge.icon;
                                    const currentCount = session.soLuongHienTai ?? (session.danhSachHoiVien?.length || 0);
                                    const maxCount = session.soLuongToiDa || 1;
                                    const attendanceRate = Math.min((currentCount / maxCount) * 100, 100);
                                    const sessionImage = session.baiTap?.[0]?.hinhAnh || session.baiTap?.[0]?.hinhAnhMinhHoa?.[0] || null;

                                    return (
                                        <div key={session._id}
                                            className="bg-[#141414] rounded-xl border border-[#141414] hover:bg-[#2a2a2a] transition-all duration-300 overflow-hidden group">

                                            {/* Session Image */}
                                            {sessionImage ? (
                                                <div className="relative h-48 overflow-hidden">
                                                    <img
                                                        src={sessionImage}
                                                        alt={session.tenBuoiTap}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                    {/* Dark overlay */}
                                                    <div className="absolute inset-0 bg-black/40" />
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                                    {/* More button - Top Right */}
                                                    <button className="absolute top-3 right-3 p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer backdrop-blur-sm z-10">
                                                        <MoreVertical className="w-5 h-5 text-white" />
                                                    </button>

                                                    {/* Title and Status Badge - Bottom */}
                                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                                        <h3 className="text-white/80 font-bold text-2xl group-hover:text-[#da2128] transition-colors line-clamp-2 drop-shadow-lg mb-2">
                                                            {session.tenBuoiTap}
                                                        </h3>
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} backdrop-blur-sm`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {statusBadge.label}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-5 border-b border-[#2a2a2a]">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="text-white font-bold text-2xl mb-2 group-hover:text-[#da2128] transition-colors line-clamp-2">
                                                                {session.tenBuoiTap}
                                                            </h3>
                                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                                                                <StatusIcon className="w-3.5 h-3.5" />
                                                                {statusBadge.label}
                                                            </div>
                                                        </div>
                                                        <button className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer">
                                                            <MoreVertical className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Card Header - Date & Time */}
                                            <div className="p-5 border-b border-[#2a2a2a]">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                        <Calendar className="w-4 h-4 text-purple-400" />
                                                        <span>{new Date(session.ngayTap).toLocaleDateString('vi-VN', {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                        <Clock className="w-4 h-4 text-blue-400" />
                                                        <span>{session.gioBatDau} - {session.gioKetThuc}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Body - Attendance */}
                                            <div className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-yellow-400" />
                                                        <span className="text-sm text-gray-400">Học viên</span>
                                                    </div>
                                                    <span className="text-white font-bold">
                                                        {currentCount}/{session.soLuongToiDa || 0}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-4">
                                                    <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${attendanceRate >= 90 ? 'bg-green-400' :
                                                                attendanceRate >= 70 ? 'bg-yellow-400' :
                                                                    attendanceRate >= 50 ? 'bg-blue-400' : 'bg-[#da2128]'
                                                                }`}
                                                            style={{ width: `${attendanceRate}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-xs text-gray-500">Tỷ lệ đăng ký</span>
                                                        <span className="text-xs font-medium text-gray-400">{Math.round(attendanceRate)}%</span>
                                                    </div>
                                                </div>

                                                {/* Member Avatars */}
                                                {session.danhSachHoiVien && session.danhSachHoiVien.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs text-gray-400">Danh sách học viên:</span>
                                                        </div>
                                                        <div className="flex items-center -space-x-2">
                                                            {session.danhSachHoiVien.slice(0, 5).map((member, idx) => (
                                                                <div key={idx} className="relative group/avatar">
                                                                    {member.hoiVien?.anhDaiDien ? (
                                                                        <img
                                                                            src={member.hoiVien.anhDaiDien}
                                                                            alt={member.hoiVien.hoTen}
                                                                            className="w-8 h-8 rounded-full object-cover border-2 border-[#141414] group-hover/avatar:border-[#da2128] transition-all"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#da2128] to-[#b91d24] flex items-center justify-center text-white text-xs font-bold border-2 border-[#141414] group-hover/avatar:border-[#da2128] transition-all">
                                                                            {member.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                                        </div>
                                                                    )}
                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-white whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity z-10">
                                                                        {member.hoiVien?.hoTen || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {session.danhSachHoiVien.length > 5 && (
                                                                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border-2 border-[#141414] flex items-center justify-center text-xs font-medium text-gray-400">
                                                                    +{session.danhSachHoiVien.length - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        onClick={() => { setSelectedSession(session); setShowDetailModal(true); }}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#da2128] text-white rounded-lg hover:bg-[#b91d24] transition-colors text-sm font-medium cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Xem chi tiết
                                                    </button>
                                                    {session.trangThai === 'CHUAN_BI' && (
                                                        <button
                                                            onClick={() => { setSelectedSession(session); setShowDetailModal(true); }}
                                                            className="px-3 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
                                                            title="Chỉnh sửa nhanh"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // List View
                            <div className="space-y-4">
                                {filteredSessions.map(session => {
                                    const statusBadge = getStatusBadge(session.trangThai);
                                    const StatusIcon = statusBadge.icon;
                                    const currentCount = session.soLuongHienTai ?? (session.danhSachHoiVien?.length || 0);
                                    const maxCount = session.soLuongToiDa || 1;
                                    const attendanceRate = Math.min((currentCount / maxCount) * 100, 100);
                                    const sessionImage = session.baiTap?.[0]?.hinhAnh || session.baiTap?.[0]?.hinhAnhMinhHoa?.[0] || null;

                                    return (
                                        <div key={session._id}
                                            className="bg-[#141414] rounded-xl border border-[#141414] hover:border-[#da2128] transition-all duration-300 overflow-hidden">
                                            <div className="p-6 cursor-pointer">
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    {/* Session Image - Left Side */}
                                                    {sessionImage ? (
                                                        <div className="lg:w-80 flex-shrink-0">
                                                            <div className="relative h-64 lg:h-full rounded-lg overflow-hidden">
                                                                <img
                                                                    src={sessionImage}
                                                                    alt={session.tenBuoiTap}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                                                />
                                                                {/* Dark overlay */}
                                                                <div className="absolute inset-0 bg-black/40" />
                                                                {/* Gradient overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                                                {/* More button - Top Right */}
                                                                <button className="absolute top-3 right-3 p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer backdrop-blur-sm z-10">
                                                                    <MoreVertical className="w-5 h-5 text-white" />
                                                                </button>

                                                                {/* Title in image */}
                                                                <div className="absolute inset-x-0 bottom-0 p-5">
                                                                    <h3 className="text-white/80 font-bold text-2xl mb-3 line-clamp-2 drop-shadow-lg">
                                                                        {session.tenBuoiTap}
                                                                    </h3>
                                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} backdrop-blur-sm`}>
                                                                        <StatusIcon className="w-4 h-4" />
                                                                        {statusBadge.label}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="lg:w-80 flex-shrink-0">
                                                            <div className="p-5 bg-[#0a0a0a] rounded-lg">
                                                                <h3 className="text-white font-bold text-2xl mb-3">
                                                                    {session.tenBuoiTap}
                                                                </h3>
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                                                                    <StatusIcon className="w-4 h-4" />
                                                                    {statusBadge.label}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Left Section - Info */}
                                                    <div className="flex-1">
                                                        {/* Info Grid */}
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
                                                                <Calendar className="w-5 h-5 text-purple-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-400 mb-0.5">Ngày tập</div>
                                                                    <div className="text-sm text-white font-medium">
                                                                        {new Date(session.ngayTap).toLocaleDateString('vi-VN', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
                                                                <Clock className="w-5 h-5 text-blue-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-400 mb-0.5">Thời gian</div>
                                                                    <div className="text-sm text-white font-medium">
                                                                        {session.gioBatDau} - {session.gioKetThuc}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
                                                                <Users className="w-5 h-5 text-yellow-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-400 mb-0.5">Học viên</div>
                                                                    <div className="text-sm text-white font-medium">
                                                                        {currentCount}/{session.soLuongToiDa || 0}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
                                                                <TrendingUp className="w-5 h-5 text-green-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-400 mb-0.5">Tỷ lệ đăng ký</div>
                                                                    <div className="text-sm text-white font-medium">
                                                                        {Math.round(attendanceRate)}%
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="mb-4">
                                                            <div className="h-2.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-500 ${attendanceRate >= 90 ? 'bg-green-400' :
                                                                        attendanceRate >= 70 ? 'bg-yellow-400' :
                                                                            attendanceRate >= 50 ? 'bg-blue-400' : 'bg-[#da2128]'
                                                                        }`}
                                                                    style={{ width: `${attendanceRate}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Section - Members & Actions */}
                                                    <div className="lg:w-80">
                                                        {session.danhSachHoiVien && session.danhSachHoiVien.length > 0 ? (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-sm font-medium text-white">Danh sách học viên</span>
                                                                    <span className="text-xs text-gray-400">{session.danhSachHoiVien.length} người</span>
                                                                </div>
                                                                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#141414]">
                                                                    {session.danhSachHoiVien.map((member, idx) => {
                                                                        const attendanceBadge = getAttendanceStatusBadge(member.trangThai);
                                                                        return (
                                                                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-colors">
                                                                                {member.hoiVien?.anhDaiDien ? (
                                                                                    <img
                                                                                        src={member.hoiVien.anhDaiDien}
                                                                                        alt={member.hoiVien.hoTen}
                                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#da2128] to-[#b91d24] flex items-center justify-center text-white font-bold text-sm">
                                                                                        {member.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-white text-sm font-medium truncate">{member.hoiVien?.hoTen || 'N/A'}</p>
                                                                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${attendanceBadge.bg} ${attendanceBadge.text}`}>
                                                                                        {attendanceBadge.label}
                                                                                    </span>
                                                                                </div>
                                                                                {session.trangThai === 'DANG_DIEN_RA' && (
                                                                                    <div className="flex gap-1">
                                                                                        <button
                                                                                            onClick={() => handleUpdateProgress(member.hoiVien._id, 'DA_THAM_GIA')}
                                                                                            className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors cursor-pointer"
                                                                                            title="Có mặt"
                                                                                        >
                                                                                            <UserCheck className="w-4 h-4" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleUpdateProgress(member.hoiVien._id, 'VANG_MAT')}
                                                                                            className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors cursor-pointer"
                                                                                            title="Vắng mặt"
                                                                                        >
                                                                                            <UserX className="w-4 h-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex gap-2 mt-4">
                                                                    <button
                                                                        onClick={() => { setSelectedSession(session); setShowDetailModal(true); }}
                                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#da2128] text-white rounded-lg hover:bg-[#b91d24] transition-colors font-medium cursor-pointer"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                        Xem chi tiết
                                                                    </button>
                                                                    {session.trangThai === 'CHUAN_BI' && (
                                                                        <button
                                                                            onClick={() => { setSelectedSession(session); setShowDetailModal(true); }}
                                                                            className="px-4 py-2.5 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
                                                                            title="Chỉnh sửa nhanh"
                                                                        >
                                                                            <Edit className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-8">
                                                                <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                                                <p className="text-gray-400 text-sm">Chưa có học viên đăng ký</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[#141414] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-10 h-10 text-gray-600" />
                            </div>
                            <p className="text-gray-400 text-lg mb-2">Không tìm thấy buổi tập nào</p>
                            <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc tạo buổi tập mới</p>
                        </div>
                    )}
                </div>
            </main>

            {showDetailModal && (
                <DetailModal
                    session={selectedSession}
                    onClose={() => { setShowDetailModal(false); setSelectedSession(null); }}
                />
            )}
        </div>
    );
};

export default PTSessions;

