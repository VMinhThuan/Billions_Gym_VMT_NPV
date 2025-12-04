import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import { ptService } from '../../services/pt.service';
import {
    Calendar,
    Users,
    TrendingUp,
    Award,
    ChevronDown,
    Filter,
    Search,
    Clock,
    Flame,
    Star,
    CheckCircle,
    XCircle,
    Target,
    BarChart3,
    Activity
} from 'lucide-react';

// Mock data
const mockStudents = [
    {
        _id: '1',
        hoTen: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com'
    },
    {
        _id: '2',
        hoTen: 'Trần Thị B',
        email: 'tranthib@gmail.com'
    },
    {
        _id: '3',
        hoTen: 'Lê Văn C',
        email: 'levanc@gmail.com'
    }
];

const mockHistory = [
    {
        _id: '1',
        ngayTap: '2025-12-03T08:00:00Z',
        caloTieuHao: 450,
        danhGia: 5,
        ketQua: 'Hoàn thành tốt, form chuẩn',
        buoiTap: {
            tenBuoiTap: 'Tập ngực - Vai - Tay sau',
            pt: { hoTen: 'PT Minh Thuận' },
            cacBaiTap: [
                { tenBaiTap: 'Bench Press' },
                { tenBaiTap: 'Dumbbell Fly' },
                { tenBaiTap: 'Shoulder Press' },
                { tenBaiTap: 'Lateral Raise' },
                { tenBaiTap: 'Tricep Dips' },
                { tenBaiTap: 'Rope Pushdown' }
            ]
        }
    },
    {
        _id: '2',
        ngayTap: '2025-12-01T09:30:00Z',
        caloTieuHao: 380,
        danhGia: 4,
        ketQua: 'Tốt, cần chú ý thêm về hơi thở',
        buoiTap: {
            tenBuoiTap: 'Tập lưng - Tay trước',
            pt: { hoTen: 'PT Minh Thuận' },
            cacBaiTap: [
                { tenBaiTap: 'Deadlift' },
                { tenBaiTap: 'Pull Up' },
                { tenBaiTap: 'Barbell Row' },
                { tenBaiTap: 'Bicep Curl' },
                { tenBaiTap: 'Hammer Curl' }
            ]
        }
    },
    {
        _id: '3',
        ngayTap: '2025-11-29T07:00:00Z',
        caloTieuHao: 520,
        danhGia: 5,
        ketQua: 'Xuất sắc, tăng cường độ tốt',
        buoiTap: {
            tenBuoiTap: 'Tập chân - Mông',
            pt: { hoTen: 'PT Minh Thuận' },
            cacBaiTap: [
                { tenBaiTap: 'Squat' },
                { tenBaiTap: 'Leg Press' },
                { tenBaiTap: 'Lunges' },
                { tenBaiTap: 'Leg Curl' },
                { tenBaiTap: 'Calf Raise' },
                { tenBaiTap: 'Hip Thrust' }
            ]
        }
    },
    {
        _id: '4',
        ngayTap: '2025-11-27T08:30:00Z',
        caloTieuHao: 0,
        danhGia: 0,
        ketQua: '',
        buoiTap: {
            tenBuoiTap: 'Cardio & Core',
            pt: { hoTen: 'PT Minh Thuận' },
            cacBaiTap: [
                { tenBaiTap: 'Running' },
                { tenBaiTap: 'Plank' },
                { tenBaiTap: 'Crunches' }
            ]
        }
    },
    {
        _id: '5',
        ngayTap: '2025-11-25T10:00:00Z',
        caloTieuHao: 410,
        danhGia: 4,
        ketQua: 'Tốt, cần nghỉ ngơi đầy đủ',
        buoiTap: {
            tenBuoiTap: 'Full Body Workout',
            pt: { hoTen: 'PT Minh Thuận' },
            cacBaiTap: [
                { tenBaiTap: 'Burpees' },
                { tenBaiTap: 'Push Ups' },
                { tenBaiTap: 'Mountain Climbers' },
                { tenBaiTap: 'Jump Squats' }
            ]
        }
    }
];

const mockStatistics = {
    tongQuan: {
        tongSoBuoiTap: 15,
        tongCaloTieuHao: 6240,
        danhGiaTrungBinh: 4.5,
        ngayTapDauTien: '2025-11-01T08:00:00Z',
        ngayTapGanNhat: '2025-12-03T08:00:00Z'
    },
    thongKeTheoThang: [
        {
            _id: { nam: 2025, thang: 12 },
            soBuoiTap: 3,
            caloTieuHao: 1250
        },
        {
            _id: { nam: 2025, thang: 11 },
            soBuoiTap: 12,
            caloTieuHao: 4990
        }
    ]
};

const PTHistory = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState(mockStudents);
    const [selectedStudent, setSelectedStudent] = useState(mockStudents[0]);
    const [history, setHistory] = useState(mockHistory);
    const [statistics, setStatistics] = useState(mockStatistics);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'all', // all, completed, absent
        page: 1,
        limit: 20
    });
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Listen to sidebar toggle
    useEffect(() => {
        const handleSidebarToggle = (e) => {
            setSidebarCollapsed(e.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    // Fetch students on mount
    useEffect(() => {
        // fetchStudents();
        // Using mock data for now
    }, []);

    // Fetch history when student or filters change
    useEffect(() => {
        if (selectedStudent) {
            // fetchHistory();
            // fetchStatistics();
            // Using mock data for now
        }
    }, [selectedStudent, filters.startDate, filters.endDate, filters.page]);

    const fetchStudents = async () => {
        try {
            const response = await ptService.getMyStudents({ limit: 100 });
            if (response?.data?.hoiViens) {
                setStudents(response.data.hoiViens);
                // Auto-select first student if available
                if (response.data.hoiViens.length > 0) {
                    setSelectedStudent(response.data.hoiViens[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchHistory = async () => {
        if (!selectedStudent) return;

        setLoading(true);
        try {
            const response = await ptService.getStudentHistory(selectedStudent._id, {
                startDate: filters.startDate,
                endDate: filters.endDate,
                page: filters.page,
                limit: filters.limit
            });

            if (response?.data?.lichSu) {
                setHistory(response.data.lichSu);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        if (!selectedStudent) return;

        try {
            const response = await ptService.getHistoryStatistics(selectedStudent._id, {
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            if (response?.data) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const getStatusBadge = (item) => {
        // If there's a rating, it means the session was completed
        if (item.danhGia) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    <CheckCircle size={14} />
                    Hoàn thành
                </div>
            );
        }
        // If no rating but has date, consider it attended
        if (item.ngayTap) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded-full text-xs font-medium">
                    <CheckCircle size={14} />
                    Vắng mặt
                </div>
            );
        }
        // Otherwise absent
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                <XCircle size={14} />
                Vắng mặt
            </div>
        );
    };

    const filteredStudents = students.filter(student =>
        student.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter history by status
    const filteredHistory = history.filter(item => {
        if (filters.status === 'all') return true;
        if (filters.status === 'completed') return item.danhGia > 0;
        if (filters.status === 'absent') return !item.danhGia && !item.caloTieuHao;
        return true;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <PTSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Main Content with Sidebar */}
                <div className="flex pt-16" style={{ minHeight: 'calc(100vh - 4rem)' }}>
                    {/* Left Content Area */}
                    <div className="flex-1 overflow-y-auto sidebar-scroll">
                        <div className="p-8">
                            {/* Page Header */}
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-white mb-2">Lịch sử tập luyện</h1>
                                <p className="text-gray-400">Theo dõi lịch sử và tiến độ tập luyện của học viên</p>
                            </div>
                            {/* Filters Bar */}
                            <div className="bg-[#141414] rounded-xl p-5 mb-6">
                                <div className="flex flex-col gap-4">
                                    {/* Date Range */}
                                    <div className="flex items-end gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-400 mb-1.5">Từ ngày</label>
                                            <input
                                                type="date"
                                                value={filters.startDate}
                                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                                className="w-full px-3 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#da2128] focus:outline-none text-sm cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-400 mb-1.5">Đến ngày</label>
                                            <input
                                                type="date"
                                                value={filters.endDate}
                                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                                className="w-full px-3 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#da2128] focus:outline-none text-sm cursor-pointer"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setFilters({
                                                startDate: '',
                                                endDate: '',
                                                status: 'all',
                                                page: 1,
                                                limit: 20
                                            })}
                                            className="px-4 py-2 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all text-sm font-medium whitespace-nowrap cursor-pointer"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    </div>

                                    {/* Status Filter Tabs with Slider */}
                                    <div className="relative">
                                        <div className="bg-[#1a1a1a] rounded-lg p-1 inline-flex relative">
                                            {/* Sliding background */}
                                            <div
                                                className="absolute top-1 bottom-1 rounded-md transition-all duration-300 ease-out"
                                                style={{
                                                    left: filters.status === 'all' ? '4px' : filters.status === 'completed' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
                                                    width: 'calc(33.333% - 4px)',
                                                    backgroundColor: filters.status === 'all' ? '#da2128' : filters.status === 'completed' ? '#22c55e' : '#f59e0b'
                                                }}
                                            />

                                            {/* Buttons */}
                                            <button
                                                onClick={() => setFilters({ ...filters, status: 'all' })}
                                                className={`relative z-10 px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${filters.status === 'all' ? 'text-white' : 'text-gray-400 hover:text-white'
                                                    }`}
                                                style={{ minWidth: 'calc(33.333% - 4px)' }}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                onClick={() => setFilters({ ...filters, status: 'completed' })}
                                                className={`relative z-10 px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${filters.status === 'completed' ? 'text-white' : 'text-gray-400 hover:text-white'
                                                    }`}
                                                style={{ minWidth: 'calc(33.333% - 4px)' }}
                                            >
                                                Hoàn thành
                                            </button>
                                            <button
                                                onClick={() => setFilters({ ...filters, status: 'absent' })}
                                                className={`relative z-10 px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${filters.status === 'absent' ? 'text-white' : 'text-gray-400 hover:text-white'
                                                    }`}
                                                style={{ minWidth: 'calc(33.333% - 4px)' }}
                                            >
                                                Vắng mặt
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History Timeline */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#da2128]"></div>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Activity size={64} className="mb-4 opacity-50" />
                                    <p className="text-lg">Chưa có lịch sử tập luyện</p>
                                    <p className="text-sm mt-2">
                                        {selectedStudent ? 'Không có dữ liệu phù hợp với bộ lọc' : 'Vui lòng chọn học viên'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHistory.map((item, index) => (
                                        <div
                                            key={item._id || index}
                                            className="bg-[#141414] rounded-xl border border-[#2a2a2a] p-6 hover:bg-[#202020] transition-all cursor-pointer"
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-[#da2128]/20 rounded-lg flex items-center justify-center text-[#da2128]">
                                                        <Calendar size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white mb-1">
                                                            {item.buoiTap?.tenBuoiTap || 'Buổi tập'}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar size={14} />
                                                                {formatDate(item.ngayTap)}
                                                            </span>
                                                            {item.ngayTap && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock size={14} />
                                                                    {formatTime(item.ngayTap)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {getStatusBadge(item)}
                                            </div>

                                            {/* Content Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#2a2a2a]">
                                                {/* PT Info */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center overflow-hidden">
                                                        {item.buoiTap?.pt?.anhDaiDien ? (
                                                            <img
                                                                src={item.buoiTap.pt.anhDaiDien}
                                                                alt={item.buoiTap.pt.hoTen}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Users size={18} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Huấn luyện viên</p>
                                                        <p className="text-sm font-medium text-white">
                                                            {item.buoiTap?.pt?.hoTen || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Calories */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                                        <Flame size={18} className="text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Calo tiêu hao</p>
                                                        <p className="text-sm font-medium text-white">
                                                            {item.caloTieuHao ? `${item.caloTieuHao} kcal` : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                                        <Star size={18} className="text-yellow-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Đánh giá</p>
                                                        <div className="flex items-center gap-1">
                                                            {item.danhGia ? (
                                                                <>
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            size={14}
                                                                            className={i < item.danhGia ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                                                                        />
                                                                    ))}
                                                                </>
                                                            ) : (
                                                                <span className="text-sm text-gray-500">Chưa đánh giá</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Exercises */}
                                            {item.buoiTap?.cacBaiTap && item.buoiTap.cacBaiTap.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                                                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                                        <Target size={16} />
                                                        Bài tập ({item.buoiTap.cacBaiTap.length})
                                                    </h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {item.buoiTap.cacBaiTap.map((exercise, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="px-3 py-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] text-xs text-gray-300"
                                                            >
                                                                {exercise.tenBaiTap || 'Bài tập'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Result/Note */}
                                            {item.ketQua && (
                                                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                                                    <p className="text-sm text-gray-400 mb-1">Kết quả:</p>
                                                    <p className="text-sm text-gray-300">{item.ketQua}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-96 bg-[#141414] border-l border-[#2a2a2a] overflow-y-auto sidebar-scroll">
                        <div className="p-6 space-y-6">
                            {/* Student Selector */}
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <Users size={16} className="text-[#da2128]" />
                                    Chọn học viên
                                </h3>
                                <div className="relative">
                                    <div className="relative mb-2">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Tìm kiếm học viên..."
                                            className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#2a2a2a] focus:outline-none text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                                        className="w-full px-3 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-all flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#da2128]/20 rounded-full flex items-center justify-center text-[#da2128] text-sm font-semibold">
                                                {selectedStudent?.hoTen?.charAt(0) || 'H'}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-white">
                                                    {selectedStudent?.hoTen || 'Chọn học viên'}
                                                </p>
                                                {selectedStudent?.email && (
                                                    <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronDown size={16} className={`transition-transform ${showStudentDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showStudentDropdown && (
                                        <div className="absolute top-full mt-1 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto sidebar-scroll">
                                            {filteredStudents.map(student => (
                                                <button
                                                    key={student._id}
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setShowStudentDropdown(false);
                                                        setSearchTerm('');
                                                    }}
                                                    className="w-full px-3 py-2.5 text-left hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a] last:border-0 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-[#da2128]/20 rounded-full flex items-center justify-center text-[#da2128] text-sm font-semibold">
                                                            {student.hoTen?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{student.hoTen}</p>
                                                            {student.email && (
                                                                <p className="text-xs text-gray-400">{student.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Statistics Cards */}
                            {selectedStudent && statistics && (
                                <>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                            <BarChart3 size={16} className="text-[#da2128]" />
                                            Thống kê tổng quan
                                        </h3>
                                        <div className="space-y-3">
                                            {/* Total Sessions */}
                                            <div className="bg-[#1a1a1a] rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-gray-400">Tổng buổi tập</p>
                                                    <Activity size={16} className="text-blue-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">
                                                    {statistics.tongQuan?.tongSoBuoiTap || 0}
                                                </p>
                                            </div>

                                            {/* Total Calories */}
                                            <div className="bg-[#1a1a1a] rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-gray-400">Tổng calo tiêu hao</p>
                                                    <Flame size={16} className="text-orange-400" />
                                                </div>
                                                <p className="text-2xl font-bold text-white">
                                                    {statistics.tongQuan?.tongCaloTieuHao || 0}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">kcal</p>
                                            </div>

                                            {/* Average Rating */}
                                            <div className="bg-[#1a1a1a] rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-gray-400">Đánh giá trung bình</p>
                                                    <Star size={16} className="text-yellow-400" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-2xl font-bold text-white">
                                                        {statistics.tongQuan?.danhGiaTrungBinh?.toFixed(1) || 0}
                                                    </p>
                                                    <div className="flex items-center gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={12}
                                                                className={
                                                                    i < Math.round(statistics.tongQuan?.danhGiaTrungBinh || 0)
                                                                        ? 'fill-yellow-400 text-yellow-400'
                                                                        : 'text-gray-600'
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Range Info */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                            <Calendar size={16} className="text-[#da2128]" />
                                            Khoảng thời gian
                                        </h3>
                                        <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">Buổi tập đầu tiên</span>
                                                <span className="text-white font-medium">
                                                    {formatDate(statistics.tongQuan?.ngayTapDauTien)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400">Buổi tập gần nhất</span>
                                                <span className="text-white font-medium">
                                                    {formatDate(statistics.tongQuan?.ngayTapGanNhat)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Stats */}
                                    {statistics.thongKeTheoThang && statistics.thongKeTheoThang.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                                <TrendingUp size={16} className="text-[#da2128]" />
                                                Thống kê theo tháng
                                            </h3>
                                            <div className="space-y-2 max-h-64 overflow-y-auto sidebar-scroll">
                                                {statistics.thongKeTheoThang.map((month, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-[#1a1a1a] rounded-lg p-3"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium text-white">
                                                                Tháng {month._id?.thang}/{month._id?.nam}
                                                            </p>
                                                            <Award size={14} className="text-[#da2128]" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <p className="text-gray-400">Buổi tập</p>
                                                                <p className="text-white font-semibold">{month.soBuoiTap}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-400">Calo</p>
                                                                <p className="text-white font-semibold">{month.caloTieuHao} kcal</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Quick Actions */}
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-3">Thao tác nhanh</h3>
                                <div className="space-y-2">
                                    <button className="w-full px-4 py-2.5 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                        <BarChart3 size={16} />
                                        Xuất báo cáo
                                    </button>
                                    <button className="w-full px-4 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                        <Calendar size={16} />
                                        Xem lịch chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .sidebar-scroll::-webkit-scrollbar {
                        width: 6px;
                    }
                    .sidebar-scroll::-webkit-scrollbar-track {
                        background: #1a1a1a;
                    }
                    .sidebar-scroll::-webkit-scrollbar-thumb {
                        background: #2a2a2a;
                        border-radius: 3px;
                    }
                    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                        background: #3a3a3a;
                    }

                    input[type="date"] {
                        color-scheme: dark;
                    }
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        filter: invert(0.8) brightness(1.5);
                        cursor: pointer;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default PTHistory;
