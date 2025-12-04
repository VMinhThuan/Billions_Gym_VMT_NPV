import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';
import {
    Users, Search, Filter, Calendar, TrendingUp, Award,
    Clock, MapPin, Phone, Mail, MessageSquare, ChevronRight,
    Activity, Target, Zap, Heart, Dumbbell, CheckCircle,
    XCircle, AlertCircle, Plus, Download, RefreshCw, MoreVertical,
    User, Package, Star, ArrowUpRight, ArrowDownRight, ChevronDown,
    Grid, List, LayoutGrid
} from 'lucide-react';

const PTStudents = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Additional state for new UI
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    // Mock data for development - will be replaced with API
    const [mockStudents] = useState([
        {
            _id: '1',
            hoTen: 'Nguyễn Văn An',
            anhDaiDien: 'https://i.pravatar.cc/150?img=1',
            tuoi: 25,
            gioiTinh: 'Nam',
            sdt: '0901234567',
            email: 'an@gmail.com',
            goiTap: {
                tenGoi: 'Premium PT Package',
                sobuoiConLai: 10,
                tongSoBuoi: 20,
                ngayHetHan: '2025-12-31',
                trangThai: 'DANG_HOAT_DONG'
            },
            lichHenSapToi: {
                ngay: '2025-12-05',
                gio: '14:00',
                loai: 'HIIT Training',
                diaDiem: 'Phòng Tập 1'
            },
            tienDo: {
                sobuoiDaTap: 10,
                tyLeHoanThanh: 50,
                rating: 4.5,
                lastSession: '2025-12-01'
            },
            thongSo: {
                canNang: 72,
                chieuCao: 175,
                bmi: 23.5,
                trend: 'down'
            },
            mucTieu: 'Giảm cân và tăng cơ',
            trangThai: 'active'
        },
        {
            _id: '2',
            hoTen: 'Phạm Thu Hà',
            anhDaiDien: 'https://i.pravatar.cc/150?img=5',
            tuoi: 28,
            gioiTinh: 'Nữ',
            sdt: '0912345678',
            email: 'ha@gmail.com',
            goiTap: {
                tenGoi: 'Yoga & Wellness',
                sobuoiConLai: 15,
                tongSoBuoi: 24,
                ngayHetHan: '2026-01-15',
                trangThai: 'DANG_HOAT_DONG'
            },
            lichHenSapToi: {
                ngay: '2025-12-04',
                gio: '10:00',
                loai: 'Yoga',
                diaDiem: 'Studio Yoga'
            },
            tienDo: {
                sobuoiDaTap: 9,
                tyLeHoanThanh: 37.5,
                rating: 5.0,
                lastSession: '2025-11-30'
            },
            thongSo: {
                canNang: 58,
                chieuCao: 165,
                bmi: 21.3,
                trend: 'stable'
            },
            mucTieu: 'Cải thiện sức khỏe tinh thần',
            trangThai: 'active'
        },
        {
            _id: '3',
            hoTen: 'Trần Minh Tuấn',
            anhDaiDien: 'https://i.pravatar.cc/150?img=3',
            tuoi: 32,
            gioiTinh: 'Nam',
            sdt: '0923456789',
            email: 'tuan@gmail.com',
            goiTap: {
                tenGoi: 'Strength Training Pro',
                sobuoiConLai: 5,
                tongSoBuoi: 16,
                ngayHetHan: '2025-12-20',
                trangThai: 'DANG_HOAT_DONG'
            },
            lichHenSapToi: {
                ngay: '2025-12-06',
                gio: '16:00',
                loai: 'Strength Training',
                diaDiem: 'Phòng Tập 2'
            },
            tienDo: {
                sobuoiDaTap: 11,
                tyLeHoanThanh: 68.75,
                rating: 4.8,
                lastSession: '2025-12-02'
            },
            thongSo: {
                canNang: 85,
                chieuCao: 180,
                bmi: 26.2,
                trend: 'up'
            },
            mucTieu: 'Tăng cơ bắp',
            trangThai: 'active'
        }
    ]);

    const [stats] = useState({
        totalStudents: 25,
        activeStudents: 20,
        upcomingSessions: 15,
        avgRating: 4.6
    });

    useEffect(() => {
        loadStudents();
    }, [searchQuery]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            // Try to fetch from API
            const response = await ptService.getMyStudents({ search: searchQuery });
            if (response.success && response.data.hoiViens?.length > 0) {
                // Map API data to match our structure
                const mappedStudents = response.data.hoiViens.map(student => ({
                    ...student,
                    trangThai: 'active',
                    goiTap: {
                        tenGoi: 'PT Package',
                        sobuoiConLai: 10,
                        tongSoBuoi: 20,
                        ngayHetHan: '2025-12-31',
                        trangThai: 'DANG_HOAT_DONG'
                    },
                    tienDo: {
                        sobuoiDaTap: 5,
                        tyLeHoanThanh: 25,
                        rating: 4.5
                    }
                }));
                setStudents(mappedStudents);
            } else {
                // Use mock data if no API data
                setStudents(mockStudents);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            // Fallback to mock data on error
            setStudents(mockStudents);
        } finally {
            setLoading(false);
        }
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.hoTen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.sdt?.includes(searchQuery);

        const matchesStatus = filterStatus === 'all' || student.trangThai === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            active: { label: 'Đang hoạt động', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
            pending: { label: 'Chờ xác nhận', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
            expired: { label: 'Hết hạn', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
        };
        return badges[status] || badges.active;
    };

    // Get trend icon
    const getTrendIcon = (trend) => {
        if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-green-400" />;
        if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-red-400" />;
        return <Activity className="w-3 h-3 text-gray-400" />;
    };

    // Calculate days until expiry
    const getDaysUntilExpiry = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleStudentClick = (student) => {
        navigate(`/pt/students/${student._id}`);
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            <PTSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 sm:p-6 lg:p-8 mt-16 sm:mt-20">{/* Page Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                                    Học Viên Của Tôi
                                </h1>
                                <p className="text-sm text-gray-400 mt-1">
                                    Quản lý và theo dõi tiến độ của {filteredStudents.length} học viên
                                </p>
                            </div>
                            <button className="px-4 py-2 bg-[#da2128] hover:bg-[#b91d24] text-white font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Thêm Học Viên</span>
                            </button>
                        </div>
                    </div>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer"
                            onClick={() => setFilterStatus('all')}>
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-5 h-5 text-blue-400" />
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="text-2xl font-bold text-blue-400 mb-1">{stats.totalStudents}</div>
                            <div className="text-xs text-gray-400">Tổng Học Viên</div>
                        </div>

                        <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer"
                            onClick={() => setFilterStatus('active')}>
                            <div className="flex items-center justify-between mb-2">
                                <Activity className="w-5 h-5 text-green-400" />
                                <div className="text-xs text-green-400 font-medium">+12%</div>
                            </div>
                            <div className="text-2xl font-bold text-green-400 mb-1">{stats.activeStudents}</div>
                            <div className="text-xs text-gray-400">Đang Hoạt Động</div>
                        </div>

                        <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer"
                            onClick={() => setFilterStatus('upcoming')}>
                            <div className="flex items-center justify-between mb-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                <Clock className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-2xl font-bold text-purple-400 mb-1">{stats.upcomingSessions}</div>
                            <div className="text-xs text-gray-400">Buổi Sắp Tới</div>
                        </div>

                        <div className="bg-[#141414] rounded-xl p-4 hover:border-[#3a3a3a] transition-all cursor-pointer"
                            onClick={() => setFilterStatus('avgRating')}>
                            <div className="flex items-center justify-between mb-2">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.avgRating}</div>
                            <div className="text-xs text-gray-400">Đánh Giá TB</div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-[#141414] rounded-xl p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, email, SĐT..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2a2a2a] transition-colors"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                        className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span className="hidden sm:inline">Lọc</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showFilterDropdown && (
                                        <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                            <div className="p-2">
                                                <button
                                                    onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${filterStatus === 'all' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
                                                >
                                                    Tất cả
                                                </button>
                                                <button
                                                    onClick={() => { setFilterStatus('active'); setShowFilterDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${filterStatus === 'active' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
                                                >
                                                    Đang hoạt động
                                                </button>
                                                <button
                                                    onClick={() => { setFilterStatus('expired'); setShowFilterDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${filterStatus === 'expired' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
                                                >
                                                    Hết hạn
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer">
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Xuất</span>
                                </button>

                                {/* View Mode Toggle */}
                                <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'}`}
                                        title="Grid view"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:text-white'}`}
                                        title="List view"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                            : 'grid grid-cols-1 gap-4'
                        }>
                            {filteredStudents.length === 0 ? (
                                <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-12 text-center col-span-full">
                                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy học viên</h3>
                                    <p className="text-gray-400">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
                                </div>
                            ) : (
                                filteredStudents.map((student) => {
                                    const statusBadge = getStatusBadge(student.trangThai);
                                    const daysLeft = student.goiTap?.ngayHetHan ? getDaysUntilExpiry(student.goiTap.ngayHetHan) : 0;

                                    // Grid View - Compact Card
                                    if (viewMode === 'grid') {
                                        return (
                                            <div
                                                key={student._id}
                                                onClick={() => handleStudentClick(student)}
                                                className="bg-[#141414] rounded-xl border border-[#141414] p-4 hover:bg-[#2a2a2a] transition-all cursor-pointer group"
                                            >
                                                {/* Compact Header */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="relative">
                                                        {student.anhDaiDien ? (
                                                            <img
                                                                src={student.anhDaiDien}
                                                                alt={student.hoTen}
                                                                className="w-12 h-12 rounded-full border-2 border-[#2a2a2a] transition-colors object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-lg border-2 border-[#2a2a2a] group-hover:border-[#da2128]">
                                                                {student.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                            </div>
                                                        )}
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#141414] ${student.trangThai === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base font-bold text-white truncate">{student.hoTen}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <span>{student.tuoi || 25} tuổi</span>
                                                            {student.tienDo?.rating && (
                                                                <span className="flex items-center gap-0.5">
                                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                    {student.tienDo.rating}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusBadge.color} whitespace-nowrap`}>
                                                        {statusBadge.label}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                {student.goiTap && (
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span className="truncate">{student.goiTap.tenGoi}</span>
                                                            <span>{student.tienDo?.tyLeHoanThanh || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-[#da2128] to-[#ff4444] transition-all duration-300"
                                                                style={{ width: `${student.tienDo?.tyLeHoanThanh || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Stats */}
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    <div className="bg-[#1a1a1a] rounded p-2 text-center">
                                                        <div className="text-xs font-bold text-white">{student.goiTap?.sobuoiConLai || 0}</div>
                                                        <div className="text-[10px] text-gray-400">Buổi còn</div>
                                                    </div>
                                                    <div className="bg-[#1a1a1a] rounded p-2 text-center">
                                                        <div className="text-xs font-bold text-white">{student.thongSo?.canNang || '--'}kg</div>
                                                        <div className="text-[10px] text-gray-400">Cân nặng</div>
                                                    </div>
                                                    <div className="bg-[#1a1a1a] rounded p-2 text-center">
                                                        <div className="text-xs font-bold text-white">{student.thongSo?.bmi || '--'}</div>
                                                        <div className="text-[10px] text-gray-400">BMI</div>
                                                    </div>
                                                </div>

                                                {/* Next Session */}
                                                {student.lichHenSapToi ? (
                                                    <div className="bg-[rgba(218,33,40,0.1)] border border-[rgba(218,33,40,0.2)] rounded p-2 text-xs">
                                                        <div className="flex items-center gap-1 text-[#da2128] font-medium mb-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Buổi tập tiếp theo
                                                        </div>
                                                        <div className="text-gray-300 truncate">
                                                            {new Date(student.lichHenSapToi.ngay).toLocaleDateString('vi-VN')} • {student.lichHenSapToi.gio}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-[#2a2a2a] rounded p-2 text-center text-xs text-gray-400">
                                                        Chưa có lịch
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    // List View - Detailed Card
                                    return (
                                        <div
                                            key={student._id}
                                            onClick={() => handleStudentClick(student)}
                                            className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-4 sm:p-6 hover:bg-[#2a2a2a] transition-all cursor-pointer group"
                                        >
                                            {/* Student Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="relative">
                                                    {student.anhDaiDien ? (
                                                        <img
                                                            src={student.anhDaiDien}
                                                            alt={student.hoTen}
                                                            className="w-16 h-16 rounded-full border-2 border-[#2a2a2a] transition-colors object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-2xl border-2 border-[#2a2a2a] group-hover:border-[#da2128]">
                                                            {student.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#141414] ${student.trangThai === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-white truncate">{student.hoTen}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBadge.color}`}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                                        <span>{student.tuoi || 25} tuổi • {student.gioiTinh || 'Nam'}</span>
                                                        {student.tienDo?.rating && (
                                                            <span className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                {student.tienDo.rating}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                                                    <MoreVertical className="w-5 h-5 text-gray-400" />
                                                </button>
                                            </div>

                                            {/* Package Info */}
                                            {student.goiTap && (
                                                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-[#da2128]" />
                                                            <span className="text-sm font-medium text-white">{student.goiTap.tenGoi}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                                                        </span>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span>Tiến độ: {student.goiTap.sobuoiConLai}/{student.goiTap.tongSoBuoi} buổi</span>
                                                            <span>{student.tienDo?.tyLeHoanThanh || 0}%</span>
                                                        </div>
                                                        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-[#da2128] to-[#ff4444] transition-all duration-300"
                                                                style={{ width: `${student.tienDo?.tyLeHoanThanh || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Upcoming Session */}
                                            {student.lichHenSapToi ? (
                                                <div className="bg-[rgba(218,33,40,0.1)] border border-[rgba(218,33,40,0.2)] rounded-lg p-3 mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar className="w-4 h-4 text-[#da2128]" />
                                                        <span className="text-sm font-medium text-white">Buổi tập tiếp theo</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex items-center gap-1 text-gray-300">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(student.lichHenSapToi.ngay).toLocaleDateString('vi-VN')} - {student.lichHenSapToi.gio}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-300">
                                                            <Dumbbell className="w-3 h-3" />
                                                            {student.lichHenSapToi.loai}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-300 col-span-2">
                                                            <MapPin className="w-3 h-3" />
                                                            {student.lichHenSapToi.diaDiem}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-[#2a2a2a] rounded-lg p-3 mb-4 text-center">
                                                    <span className="text-sm text-gray-400">Chưa có lịch hẹn</span>
                                                </div>
                                            )}

                                            {/* Stats Grid */}
                                            {student.thongSo && (
                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                    <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
                                                        <div className="text-sm font-bold text-white mb-1">{student.thongSo.canNang}kg</div>
                                                        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                                            {getTrendIcon(student.thongSo.trend)}
                                                            Cân nặng
                                                        </div>
                                                    </div>
                                                    <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
                                                        <div className="text-sm font-bold text-white mb-1">{student.thongSo.bmi}</div>
                                                        <div className="text-xs text-gray-400">BMI</div>
                                                    </div>
                                                    <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
                                                        <div className="text-sm font-bold text-white mb-1">{student.tienDo?.sobuoiDaTap || 0}</div>
                                                        <div className="text-xs text-gray-400">Buổi tập</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quick Actions */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Chat</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Lịch</span>
                                                </button>
                                                <button className="px-3 py-2 bg-[#da2128] hover:bg-[#b91d24] rounded-lg text-white transition-colors flex items-center justify-center gap-2 text-sm">
                                                    <ChevronRight className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Chi tiết</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PTStudents;

