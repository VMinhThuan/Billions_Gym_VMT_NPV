import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import {
    Calendar, Clock, Users, MapPin, Search, Plus, Filter,
    ChevronLeft, ChevronRight, ChevronDown, Edit2, Trash2,
    Check, X, AlertCircle, User, Phone, Mail, MessageSquare,
    RefreshCw, Target, Activity, TrendingUp
} from 'lucide-react';
import ptService from '../../services/pt.service';

const PTScheduleNew = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Date & View State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // day, week, month
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Filter State
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Modal State
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // Data thực từ API
    const [scheduleData, setScheduleData] = useState({
        events: [],
        summary: {
            todaySessions: 0,
            weekSessions: 0,
            freeSlots: [],
            workload: 0,
            topSessionType: ''
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
        loadScheduleData();
    }, [viewMode, currentDate, filterStatus]);

    const loadScheduleData = async () => {
        setLoading(true);
        try {
            const { start, end } = getRangeByView();
            const response = await ptService.getMySessions({
                ngayBatDau: start.toISOString(),
                ngayKetThuc: end.toISOString(),
                limit: 800
            });

            if (response.success && response.data?.buoiTaps) {
                const events = response.data.buoiTaps.map((s, idx) => ({
                    id: s._id || `session-${idx}`,
                    hoiVien: s.danhSachHoiVien?.[0]?.hoiVien || null,
                    danhSachHoiVien: s.danhSachHoiVien || [],
                    ngayHen: s.ngayTap,
                    gioHen: s.gioBatDau,
                    gioKetThuc: s.gioKetThuc,
                    thoiLuong: computeDuration(s.gioBatDau, s.gioKetThuc),
                    trangThaiLichHen: s.trangThai || 'DA_XAC_NHAN',
                    loaiBuoiTap: s.tenBuoiTap || s.doKho || 'Buổi tập',
                    ghiChu: s.moTa || '',
                    diaDiem: s.chiNhanh?.tenChiNhanh || s.chiNhanh || '',
                    imageUrl: s.hinhAnh || s.hinhAnhMinhHoa || s.template?.hinhAnh || ''
                }));

                setScheduleData({
                    events,
                    summary: {
                        todaySessions: events.filter(e => isSameDay(e.ngayHen, new Date())).length,
                        weekSessions: events.length,
                        freeSlots: [],
                        workload: events.length,
                        topSessionType: ''
                    }
                });
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper Functions
    const getStatusColor = (status) => {
        const colors = {
            'CHO_XAC_NHAN': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
            'DA_XAC_NHAN': 'bg-green-500/10 text-green-500 border-green-500/30',
            'HOAN_THANH': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
            'DA_HUY': 'bg-red-500/10 text-red-500 border-red-500/30'
        };
        return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    };

    const getStatusText = (status) => {
        const texts = {
            'CHO_XAC_NHAN': 'Chờ xác nhận',
            'DA_XAC_NHAN': 'Đã xác nhận',
            'HOAN_THANH': 'Hoàn thành',
            'DA_HUY': 'Đã hủy'
        };
        return texts[status] || status;
    };

    // Hàm hash để convert tên buổi tập thành số
    const hashString = (str) => {
        let hash = 0;
        const normalizedStr = (str || '').toLowerCase().trim();
        for (let i = 0; i < normalizedStr.length; i++) {
            const char = normalizedStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    // Bảng màu cố định với nhiều màu đẹp (Tailwind classes)
    const sessionColorPalette = [
        'bg-red-500',      // Đỏ
        'bg-orange-500',   // Cam
        'bg-amber-500',    // Vàng cam
        'bg-yellow-500',   // Vàng
        'bg-lime-500',     // Xanh lá nhạt
        'bg-green-500',    // Xanh lá
        'bg-emerald-500',  // Xanh lá đậm
        'bg-teal-500',     // Xanh ngọc
        'bg-cyan-500',     // Xanh dương nhạt
        'bg-blue-500',     // Xanh dương
        'bg-indigo-500',   // Chàm
        'bg-violet-500',   // Tím
        'bg-purple-500',   // Tím đậm
        'bg-fuchsia-500',  // Hồng tím
        'bg-pink-500',     // Hồng
        'bg-rose-500',     // Hồng đỏ
        'bg-red-600',      // Đỏ đậm
        'bg-orange-600',   // Cam đậm
        'bg-green-600',    // Xanh lá đậm
        'bg-blue-600',     // Xanh dương đậm
        'bg-purple-600',   // Tím đậm
        'bg-pink-600',     // Hồng đậm
        'bg-teal-600',     // Xanh ngọc đậm
        'bg-indigo-600',   // Chàm đậm
    ];

    // Map Tailwind color class sang hex color để dùng trong style
    const tailwindToHex = {
        'bg-red-500': '#ef4444',
        'bg-orange-500': '#f97316',
        'bg-amber-500': '#f59e0b',
        'bg-yellow-500': '#eab308',
        'bg-lime-500': '#84cc16',
        'bg-green-500': '#22c55e',
        'bg-emerald-500': '#10b981',
        'bg-teal-500': '#14b8a6',
        'bg-cyan-500': '#06b6d4',
        'bg-blue-500': '#3b82f6',
        'bg-indigo-500': '#6366f1',
        'bg-violet-500': '#8b5cf6',
        'bg-purple-500': '#a855f7',
        'bg-fuchsia-500': '#d946ef',
        'bg-pink-500': '#ec4899',
        'bg-rose-500': '#f43f5e',
        'bg-red-600': '#dc2626',
        'bg-orange-600': '#ea580c',
        'bg-green-600': '#16a34a',
        'bg-blue-600': '#2563eb',
        'bg-purple-600': '#9333ea',
        'bg-pink-600': '#db2777',
        'bg-teal-600': '#0d9488',
        'bg-indigo-600': '#4f46e5',
        'bg-gray-500': '#6b7280',
    };

    const getSessionTypeColor = (type) => {
        // Nếu không có type, trả về màu mặc định
        if (!type || !type.trim()) {
            return 'bg-gray-500';
        }

        // Sử dụng hash để map tên buổi tập thành màu nhất quán
        const hash = hashString(type);
        const colorIndex = hash % sessionColorPalette.length;
        return sessionColorPalette[colorIndex];
    };

    // Hàm helper để lấy hex color từ tên buổi tập (dùng cho style)
    const getSessionTypeHexColor = (type) => {
        const tailwindClass = getSessionTypeColor(type);
        return tailwindToHex[tailwindClass] || '#6b7280'; // Mặc định gray nếu không tìm thấy
    };

    const getEventStyle = (event) => {
        if (!event?.imageUrl) return {};
        return {
            backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.60), rgba(0,0,0,0.35)), url(${event.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        };
    };

    const getWeekDays = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const getRangeByView = () => {
        const start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);

        if (viewMode === 'day') {
            end.setDate(start.getDate() + 1);
        } else if (viewMode === 'week') {
            start.setDate(start.getDate() - start.getDay());
            end.setDate(start.getDate() + 7);
        } else {
            // month view
            start.setDate(1);
            end.setMonth(start.getMonth() + 1, 1);
        }

        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const computeDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 60;
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
    };

    const isSameDay = (dateA, dateB) => {
        const a = new Date(dateA);
        const b = new Date(dateB);
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    };

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return scheduleData.events.filter(event => {
            if (event.ngayHen && new Date(event.ngayHen).toISOString().split('T')[0] !== dateStr) return false;
            if (filterStatus !== 'all' && event.trangThaiLichHen !== filterStatus) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const name = (event.hoiVien?.hoTen || '').toLowerCase();
                const title = (event.loaiBuoiTap || '').toLowerCase();
                if (!name.includes(q) && !title.includes(q)) return false;
            }
            return true;
        });
    };

    const handlePreviousPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(currentDate.getDate() - 1);
        else if (viewMode === 'week') newDate.setDate(currentDate.getDate() - 7);
        else newDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNextPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(currentDate.getDate() + 1);
        else if (viewMode === 'week') newDate.setDate(currentDate.getDate() + 7);
        else newDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setSelectedParticipants(event.danhSachHoiVien || []);
        setShowParticipantsModal(true);
        setShowEventModal(false);
    };

    const handleConfirmBooking = async (eventId) => {
        alert('Xác nhận lịch hẹn thành công!');
        loadScheduleData();
    };

    const handleCancelBooking = async (eventId) => {
        alert('Hủy lịch hẹn thành công!');
        loadScheduleData();
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';
    const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <PTSidebar
                isOpen={sidebarOpen}
                onToggle={setSidebarOpen}
                onCollapse={setSidebarCollapsed}
            />

            <div className={`transition-all duration-300 ${mainMarginLeft}`}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="mt-16 sm:mt-20 p-4 lg:p-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Lịch Cá Nhân</h1>
                                <p className="text-gray-400">Quản lý lịch làm việc và buổi tập của bạn</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#da2128] hover:bg-[#da2128]/90 text-white rounded-xl font-medium transition-colors cursor-pointer"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden sm:inline">Thêm Lịch</span>
                                </button>
                                {/* <button
                                    onClick={loadScheduleData}
                                    className="flex items-center gap-2 px-4 py-3 bg-[#141414] hover:bg-[#1a1a1a] text-white rounded-xl border border-[#2a2a2a] transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#141414] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-[#da2128]/10 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-[#da2128]" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs mb-1">Hôm nay</p>
                            <h3 className="text-2xl font-bold text-white">{scheduleData.summary.todaySessions} <span className="text-sm text-gray-400">buổi</span></h3>
                        </div>

                        <div className="bg-[#141414] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs mb-1">Tuần này</p>
                            <h3 className="text-2xl font-bold text-white">{scheduleData.summary.weekSessions} <span className="text-sm text-gray-400">buổi</span></h3>
                        </div>

                        <div className="bg-[#141414] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs mb-1">Slots rảnh</p>
                            <h3 className="text-2xl font-bold text-white">{scheduleData.summary.freeSlots.length} <span className="text-sm text-gray-400">khung giờ</span></h3>
                        </div>

                        <div className="bg-[#141414] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-purple-500" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-xs mb-1">Độ bận</p>
                            <h3 className="text-2xl font-bold text-white">{scheduleData.summary.workload}<span className="text-sm text-gray-400">%</span></h3>
                        </div>
                    </div> */}

                    {/* Calendar Controls */}
                    <div className="bg-[#141414] rounded-2xl p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Date Navigation */}
                            <div className="flex items-center gap-3">
                                <button onClick={handlePreviousPeriod} className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                </button>

                                <div className="text-center min-w-[200px]">
                                    <h2 className="text-xl font-bold text-white">
                                        {viewMode === 'day' && currentDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        {viewMode === 'week' && `Tuần ${Math.ceil(currentDate.getDate() / 7)} - ${currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`}
                                        {viewMode === 'month' && currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                    </h2>
                                </div>

                                <button onClick={handleNextPeriod} className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </button>

                                <button onClick={handleToday} className="px-4 py-2 bg-[#da2128] hover:bg-[#b71c24] text-white rounded-lg font-medium transition-colors ml-2 cursor-pointer">
                                    Hôm nay
                                </button>
                            </div>

                            {/* View Mode & Filters */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 lg:flex-initial lg:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm lịch..."
                                        className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#da2128]"
                                    />
                                </div>

                                <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
                                    <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${viewMode === 'day' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'}`}>
                                        Ngày
                                    </button>
                                    <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${viewMode === 'week' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'}`}>
                                        Tuần
                                    </button>
                                    <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${viewMode === 'month' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'}`}>
                                        Tháng
                                    </button>
                                </div>

                                <div className="relative">
                                    <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg border border-[#2a2a2a] transition-colors cursor-pointer">
                                        <Filter className="w-4 h-4" />
                                        <span className="hidden sm:inline">Lọc</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showFilterDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50">
                                            <div className="p-2">
                                                {['all', 'CHO_XAC_NHAN', 'DA_XAC_NHAN', 'HOAN_THANH', 'DA_HUY'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => {
                                                            setFilterStatus(status);
                                                            setShowFilterDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === status ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                                                            }`}
                                                    >
                                                        {status === 'all' ? 'Tất cả' : getStatusText(status)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar View */}
                    {loading ? (
                        <div className="bg-[#141414] rounded-2xl p-12 border border-[#2a2a2a] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-[#da2128] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">Đang tải lịch...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Week View */}
                            {viewMode === 'week' && (
                                <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] overflow-hidden relative">
                                    {/* Navigation Arrows */}
                                    <button
                                        onClick={handlePreviousPeriod}
                                        className="absolute left-2 top-2 z-10 w-8 h-8 bg-transparent hover:bg-[#2a2a2a] rounded-lg flex items-center justify-center text-white text-2xl transition-colors"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={handleNextPeriod}
                                        className="absolute right-2 top-2 z-10 w-8 h-8 bg-transparent hover:bg-[#2a2a2a] rounded-lg flex items-center justify-center text-white text-2xl transition-colors"
                                    >
                                        ›
                                    </button>

                                    {/* Week Header Row */}
                                    <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-[#2a2a2a] bg-transparent pr-2.5">
                                        <div className="border-r border-[#2a2a2a]"></div>
                                        {getWeekDays().map((day, index) => {
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            return (
                                                <div key={index} className={`p-2.5 text-center ${index < 6 ? 'border-r border-[#2a2a2a]' : ''}`}>
                                                    <div className="text-xs font-bold text-white uppercase mb-0.5">
                                                        {day.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', '')}
                                                    </div>
                                                    <div className={`text-[11px] ${isToday ? 'text-[#da2128]' : 'text-[#d1d1d1]'}`}>
                                                        {day.getDate()}/{day.getMonth() + 1}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Week Grid */}
                                    <div className="grid grid-cols-[70px_repeat(7,1fr)] max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#141414]">
                                        {/* Time Column */}
                                        <div className="border-r border-[#2a2a2a] bg-transparent">
                                            <div className="h-10 flex items-center justify-end pr-1.5 text-[10px] text-[#d1d1d1] border-b border-[#2a2a2a]">
                                                Cả ngày
                                            </div>
                                            {timeSlots.map((time, index) => (
                                                <div key={index} className="h-[60px] border-b border-[#2a2a2a] flex items-start justify-end pt-1 pr-1.5">
                                                    <span className="text-[10px] text-[#d1d1d1]">{time}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Day Columns */}
                                        {getWeekDays().map((day, dayIndex) => {
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            const dayEvents = getEventsForDate(day);

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className={`${dayIndex < 6 ? 'border-r border-[#2a2a2a]' : ''} relative ${isToday ? 'bg-[rgba(218,33,40,0.1)]' : ''}`}
                                                >
                                                    {/* All Day Cell */}
                                                    <div className="h-10 border-b border-[#2a2a2a] p-1 relative z-10">
                                                        {/* All day events here if needed */}
                                                    </div>

                                                    {/* Hour Cells */}
                                                    {timeSlots.map((time, hourIndex) => {
                                                        const hourEvents = dayEvents.filter(event => {
                                                            const eventHour = parseInt(event.gioHen.split(':')[0]);
                                                            const slotHour = parseInt(time.split(':')[0]);
                                                            return eventHour === slotHour;
                                                        });

                                                        return (
                                                            <div key={hourIndex} className="h-[60px] border-b border-[#2a2a2a] p-0.5 relative z-10 overflow-hidden">
                                                                {hourEvents.map((event) => (
                                                                    <div
                                                                        key={event.id}
                                                                        onClick={() => handleEventClick(event)}
                                                                        className={`${event.imageUrl ? '' : getSessionTypeColor(event.loaiBuoiTap)} px-1.5 py-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity h-full flex flex-col justify-center overflow-hidden`}
                                                                        style={getEventStyle(event)}
                                                                        title={`${event.hoiVien?.hoTen || 'Không rõ học viên'}\n${event.diaDiem || ''}`}
                                                                    >
                                                                        <div className="text-[10px] font-medium leading-tight">{event.gioHen}</div>
                                                                        <div className="text-[10px] truncate leading-tight font-medium">{event.hoiVien?.hoTen || 'Không rõ học viên'}</div>
                                                                        <div className="text-[9px] truncate opacity-80 leading-tight">PT: {event.loaiBuoiTap}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Current Time Line for Today */}
                                                    {isToday && (() => {
                                                        const now = new Date();
                                                        const currentHour = now.getHours();
                                                        const currentMinute = now.getMinutes();
                                                        const ALL_DAY_HEIGHT = 40;
                                                        const HOUR_HEIGHT = 60;
                                                        const startHour = 6;

                                                        if (currentHour >= startHour) {
                                                            const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
                                                            const topPx = ALL_DAY_HEIGHT + (totalMinutes * (HOUR_HEIGHT / 60));

                                                            return (
                                                                <>
                                                                    <div
                                                                        className="absolute left-0 right-0 h-0.5 bg-[#da2128] z-20"
                                                                        style={{ top: `${topPx}px` }}
                                                                    >
                                                                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-[#da2128] rounded-full"></div>
                                                                    </div>
                                                                    <div
                                                                        className="absolute -left-12 bg-[#da2128] text-white text-[10px] px-1.5 py-0.5 rounded z-20"
                                                                        style={{ top: `${topPx - 10}px` }}
                                                                    >
                                                                        {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Day View */}
                            {viewMode === 'day' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden">
                                        <div className="p-6 border-b border-[#2a2a2a]">
                                            <h3 className="text-xl font-bold text-white">Lịch trình hôm nay</h3>
                                            <p className="text-sm text-gray-400 mt-1">{getEventsForDate(currentDate).length} buổi tập</p>
                                        </div>

                                        <div className="overflow-y-auto max-h-[700px] scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#141414]">
                                            {timeSlots.map((time, index) => {
                                                const timeEvents = getEventsForDate(currentDate).filter(event => {
                                                    const eventTime = parseInt(event.gioHen.split(':')[0]);
                                                    const slotTime = parseInt(time.split(':')[0]);
                                                    return eventTime === slotTime;
                                                });

                                                return (
                                                    <div key={index} className="flex border-b border-[#2a2a2a] min-h-[100px]">
                                                        <div className="w-20 p-4 bg-[#1a1a1a] text-sm text-gray-400 flex-shrink-0">{time}</div>
                                                        <div className="flex-1 p-4">
                                                            {timeEvents.length > 0 ? (
                                                                timeEvents.map((event) => {
                                                                    const learnerName = event.hoiVien?.hoTen || 'Không rõ học viên';
                                                                    const borderColor = getSessionTypeHexColor(event.loaiBuoiTap);
                                                                    return (
                                                                        <div
                                                                            key={event.id}
                                                                            onClick={() => handleEventClick(event)}
                                                                            className="bg-[#1a1a1a] rounded-xl p-4 mb-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer border-l-4"
                                                                            style={{ borderLeftColor: borderColor }}
                                                                        >
                                                                            <div className="flex items-start justify-between mb-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-10 h-10 bg-[#da2128]/10 rounded-full flex items-center justify-center">
                                                                                        <User className="w-5 h-5 text-[#da2128]" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <h4 className="text-white font-bold">{learnerName}</h4>
                                                                                        <p className="text-sm text-gray-400">{event.loaiBuoiTap}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.trangThaiLichHen)}`}>
                                                                                    {getStatusText(event.trangThaiLichHen)}
                                                                                </span>
                                                                            </div>

                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <Clock className="w-4 h-4" />
                                                                                    <span>{event.gioHen} ({event.thoiLuong} phút)</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <MapPin className="w-4 h-4" />
                                                                                    <span>{event.diaDiem}</span>
                                                                                </div>
                                                                                {event.ghiChu && (
                                                                                    <div className="flex items-start gap-2 text-gray-400">
                                                                                        <MessageSquare className="w-4 h-4 mt-0.5" />
                                                                                        <span className="flex-1">{event.ghiChu}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="text-center py-8 text-gray-400">
                                                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                                    <p className="text-sm">Không có lịch hẹn</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Side Panel */}
                                    <div className="space-y-6">
                                        <div className="bg-[#141414] rounded-2xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Khung Giờ Rảnh</h3>
                                            <div className="space-y-2">
                                                {scheduleData.summary.freeSlots.map((slot, index) => (
                                                    <div key={index} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-green-500" />
                                                            <span className="text-white font-medium">{slot}</span>
                                                        </div>
                                                        <button className="text-xs text-green-500 hover:text-green-400 cursor-pointer hover:underline">Đặt lịch</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-[#141414] rounded-2xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                                Chờ Xác Nhận
                                            </h3>
                                            <div className="space-y-3">
                                                {scheduleData.events.filter(e => e.trangThaiLichHen === 'CHO_XAC_NHAN').slice(0, 3).map((event) => (
                                                    <div key={event.id} className="bg-[#1a1a1a] rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-white font-medium text-sm">{event.hoiVien.hoTen}</span>
                                                            <span className="text-xs text-gray-400">{event.gioHen}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleConfirmBooking(event.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                                                                <Check className="w-3 h-3" />
                                                                Xác nhận
                                                            </button>
                                                            <button onClick={() => handleCancelBooking(event.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                                                                <X className="w-3 h-3" />
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-[#da2128] to-[#ff3842] rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                    <Target className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-lg">Mục Tiêu Tuần</h3>
                                                    <p className="text-white/80 text-sm">Hoàn thành {scheduleData.summary.weekSessions}/20 buổi</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(scheduleData.summary.weekSessions / 20) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Month View */}
                            {viewMode === 'month' && (
                                <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden">
                                    {/* Month Header */}
                                    <div className="p-6 border-b border-[#2a2a2a]">
                                        <div className="text-center">
                                            <h3 className="text-2xl font-bold text-white mb-1">
                                                {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {scheduleData.events.filter(e => {
                                                    const eventDate = new Date(e.ngayHen);
                                                    return eventDate.getMonth() === currentDate.getMonth() &&
                                                        eventDate.getFullYear() === currentDate.getFullYear();
                                                }).length} buổi tập trong tháng này
                                            </p>
                                        </div>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="p-0">
                                        {/* Weekday Headers */}
                                        <div className="grid grid-cols-7">
                                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => (
                                                <div key={index} className="text-center py-[18px] px-2 text-[13px] font-bold text-white uppercase border-b border-[#2a2a2a]">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Calendar Days */}
                                        <div className="grid grid-cols-7">
                                            {(() => {
                                                const year = currentDate.getFullYear();
                                                const month = currentDate.getMonth();
                                                const firstDay = new Date(year, month, 1);
                                                const lastDay = new Date(year, month + 1, 0);
                                                const startingDayOfWeek = firstDay.getDay();
                                                const daysInMonth = lastDay.getDate();

                                                const days = [];

                                                // Empty cells before first day
                                                for (let i = 0; i < startingDayOfWeek; i++) {
                                                    days.push(
                                                        <div
                                                            key={`empty-${i}`}
                                                            className="border-r border-b border-[#2a2a2a] p-1.5 aspect-square bg-[rgba(255,255,255,0.01)]"
                                                        />
                                                    );
                                                }

                                                // Days of the month
                                                for (let day = 1; day <= daysInMonth; day++) {
                                                    const date = new Date(year, month, day);
                                                    const dateString = date.toISOString().split('T')[0];
                                                    const dayEvents = scheduleData.events.filter(e => e.ngayHen === dateString);
                                                    const isToday = date.toDateString() === new Date().toDateString();
                                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                                    const isLastColumn = (startingDayOfWeek + day - 1) % 7 === 6;

                                                    days.push(
                                                        <div
                                                            key={day}
                                                            onClick={() => {
                                                                setSelectedDate(date);
                                                                setViewMode('day');
                                                            }}
                                                            className={`p-1.5 aspect-square cursor-pointer transition-all relative ${!isLastColumn ? 'border-r' : ''
                                                                } border-b border-[#2a2a2a] ${isToday
                                                                    ? 'bg-[rgba(218,33,40,0.08)] border border-[rgba(218,33,40,0.18)]'
                                                                    : 'bg-transparent hover:bg-[rgba(255,255,255,0.03)]'
                                                                }`}
                                                        >
                                                            <div className="h-full flex flex-col justify-between overflow-hidden">
                                                                <div className={`text-sm font-medium flex-shrink-0 ${isToday ? 'text-[#da2128] font-bold' : 'text-white'
                                                                    }`}>
                                                                    {day}
                                                                </div>
                                                                {dayEvents.length > 0 && (
                                                                    <div className="flex flex-col gap-1 overflow-hidden flex-1 justify-center">
                                                                        {dayEvents.slice(0, 2).map((event, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className={`text-[11px] px-1.5 py-1 rounded ${event.imageUrl ? '' : getSessionTypeColor(event.loaiBuoiTap)} text-white overflow-hidden cursor-pointer transition-opacity hover:opacity-80 flex-shrink-0`}
                                                                                style={getEventStyle(event)}
                                                                                title={`${event.gioHen} - ${event.hoiVien?.hoTen || 'Không rõ học viên'}`}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEventClick(event);
                                                                                }}
                                                                            >
                                                                                <div className="font-medium truncate">{event.gioHen}</div>
                                                                                <div className="truncate">{event.hoiVien?.hoTen || 'Không rõ học viên'}</div>
                                                                            </div>
                                                                        ))}
                                                                        {dayEvents.length > 2 && (
                                                                            <div className="text-[11px] text-gray-400 px-1 flex-shrink-0">
                                                                                +{dayEvents.length - 2} buổi tập
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return days;
                                            })()}
                                        </div>

                                        {/* Legend */}
                                        <div className="p-6 border-t border-[#2a2a2a]">
                                            <p className="text-sm text-gray-400 mb-3">Loại buổi tập:</p>
                                            <div className="flex flex-wrap gap-3">
                                                {['HIIT', 'Yoga', 'Strength Training', 'Cardio'].map(type => (
                                                    <div key={type} className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded ${getSessionTypeColor(type)}`} />
                                                        <span className="text-sm text-gray-300">{type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 mt-16 sm:mt-20">
                    <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] max-w-2xl w-full max-h-[calc(90vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#141414]">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Chi Tiết Lịch Hẹn</h2>
                            <button onClick={() => setShowEventModal(false)} className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-[#da2128]/10 rounded-full flex items-center justify-center">
                                    <User className="w-8 h-8 text-[#da2128]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white">{selectedEvent.hoiVien.hoTen}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Phone className="w-4 h-4" />
                                            <span>{selectedEvent.hoiVien.soDienThoai}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Mail className="w-4 h-4" />
                                            <span>{selectedEvent.hoiVien.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedEvent.trangThaiLichHen)}`}>
                                    {getStatusText(selectedEvent.trangThaiLichHen)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#1a1a1a] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">Ngày</span>
                                    </div>
                                    <p className="text-white font-bold">
                                        {new Date(selectedEvent.ngayHen).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>

                                <div className="bg-[#1a1a1a] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Thời gian</span>
                                    </div>
                                    <p className="text-white font-bold">{selectedEvent.gioHen} ({selectedEvent.thoiLuong} phút)</p>
                                </div>

                                <div className="bg-[#1a1a1a] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <Activity className="w-4 h-4" />
                                        <span className="text-sm">Loại buổi tập</span>
                                    </div>
                                    <p className="text-white font-bold">{selectedEvent.loaiBuoiTap}</p>
                                </div>

                                <div className="bg-[#1a1a1a] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">Địa điểm</span>
                                    </div>
                                    <p className="text-white font-bold">{selectedEvent.diaDiem}</p>
                                </div>
                            </div>

                            {selectedEvent.ghiChu && (
                                <div className="bg-[#1a1a1a] rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-sm">Ghi chú</span>
                                    </div>
                                    <p className="text-white">{selectedEvent.ghiChu}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                                {selectedEvent.trangThaiLichHen === 'CHO_XAC_NHAN' && (
                                    <>
                                        <button onClick={() => { handleConfirmBooking(selectedEvent.id); setShowEventModal(false); }} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors">
                                            <Check className="w-5 h-5" />
                                            Xác nhận
                                        </button>
                                        <button onClick={() => { handleCancelBooking(selectedEvent.id); setShowEventModal(false); }} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors">
                                            <X className="w-5 h-5" />
                                            Từ chối
                                        </button>
                                    </>
                                )}
                                {selectedEvent.trangThaiLichHen === 'DA_XAC_NHAN' && (
                                    <>
                                        <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#da2128] hover:bg-[#da2128]/90 text-white rounded-xl font-medium transition-colors cursor-pointer">
                                            <Edit2 className="w-5 h-5" />
                                            Chỉnh sửa
                                        </button>
                                        <button onClick={() => { handleCancelBooking(selectedEvent.id); setShowEventModal(false); }} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-xl font-medium border border-[#2a2a2a] transition-colors cursor-pointer">
                                            <Trash2 className="w-5 h-5" />
                                            Hủy lịch
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Participants Modal */}
            {showParticipantsModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 mt-16 sm:mt-20">
                    <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] max-w-xl w-full max-h-[calc(90vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#141414]">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Học viên tham gia</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    {new Date(selectedEvent.ngayHen).toLocaleDateString('vi-VN')} • {selectedEvent.gioHen} - {selectedEvent.gioKetThuc}
                                </p>
                            </div>
                            <button onClick={() => setShowParticipantsModal(false)} className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {selectedParticipants.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    Không có học viên đăng ký
                                </div>
                            ) : (
                                selectedParticipants.map((p, idx) => (
                                    <div key={p._id || idx} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-semibold">{p.hoiVien?.hoTen || 'Học viên'}</p>
                                                <p className="text-gray-400 text-sm">{p.hoiVien?.email || ''}</p>
                                            </div>
                                            <span className="text-sm text-gray-400">Trạng thái: {p.trangThai || 'DA_DANG_KY'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PTScheduleNew;
