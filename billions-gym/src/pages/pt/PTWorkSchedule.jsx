import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';
import {
    Calendar, Clock, Plus, Edit2, Trash2, Save, X, ChevronDown
} from 'lucide-react';

const PTWorkSchedule = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [workSchedule, setWorkSchedule] = useState([]);
    const [assignedSessions, setAssignedSessions] = useState([]); // Buổi tập đã được phân công
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedDays, setExpandedDays] = useState(new Set());
    const [showAddSlotModal, setShowAddSlotModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [newSlot, setNewSlot] = useState({
        gioBatDau: '',
        gioKetThuc: '',
        trangThai: 'RANH'
    });
    const [quickAdd, setQuickAdd] = useState({
        selectedDays: [],
        gioBatDau: '',
        gioKetThuc: '',
        trangThai: 'RANH'
    });
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const daysOfWeek = [
        { key: 'Monday', label: 'Thứ Hai' },
        { key: 'Tuesday', label: 'Thứ Ba' },
        { key: 'Wednesday', label: 'Thứ Tư' },
        { key: 'Thursday', label: 'Thứ Năm' },
        { key: 'Friday', label: 'Thứ Sáu' },
        { key: 'Saturday', label: 'Thứ Bảy' },
        { key: 'Sunday', label: 'Chủ Nhật' }
    ];

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadWorkSchedule(),
                loadAssignedSessions()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWorkSchedule = async () => {
        try {
            const response = await ptService.getWorkSchedule();
            if (response.success) {
                setWorkSchedule(response.data || []);
            }
        } catch (error) {
            console.error('Error loading work schedule:', error);
        }
    };

    const loadAssignedSessions = async (customRange) => {
        try {
            // Lấy buổi tập đã được phân công trong khoảng chọn, mặc định 30 ngày tới
            const start = customRange?.startDate
                ? new Date(customRange.startDate)
                : new Date();
            start.setHours(0, 0, 0, 0); // tránh bỏ sót buổi sáng

            const end = customRange?.endDate
                ? new Date(customRange.endDate)
                : new Date(start);
            if (!customRange?.endDate) end.setDate(end.getDate() + 30);
            end.setHours(23, 59, 59, 999);

            const response = await ptService.getMySessions({
                ngayBatDau: start.toISOString(),
                ngayKetThuc: end.toISOString(),
                limit: 400 // giảm payload
            });

            if (response.success && response.data?.buoiTaps) {
                setAssignedSessions(response.data.buoiTaps);
            }
        } catch (error) {
            console.error('Error loading assigned sessions:', error);
        }
    };

    const handleAddTimeSlot = async () => {
        if (!selectedDay || !newSlot.gioBatDau || !newSlot.gioKetThuc) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            const daySchedule = workSchedule.find(s => s.thu === selectedDay.key);
            const existingSlots = daySchedule ? daySchedule.gioLamViec : [];

            const response = await ptService.updateWorkSchedule({
                thu: selectedDay.key,
                gioLamViec: [...existingSlots, newSlot],
                ghiChu: ''
            });

            if (response.success) {
                await loadAllData();
                setShowAddSlotModal(false);
                setNewSlot({ gioBatDau: '', gioKetThuc: '', trangThai: 'RANH' });
                setSelectedDay(null);
            }
        } catch (error) {
            console.error('Error adding time slot:', error);
            alert('Có lỗi khi thêm khung giờ!');
        }
    };

    const handleDeleteTimeSlot = async (dayKey, slotIndex) => {
        if (!confirm('Bạn có chắc muốn xóa khung giờ này?')) return;

        try {
            const daySchedule = workSchedule.find(s => s.thu === dayKey);
            const updatedSlots = daySchedule.gioLamViec.filter((_, idx) => idx !== slotIndex);

            if (updatedSlots.length === 0) {
                await ptService.deleteWorkSchedule(dayKey);
            } else {
                await ptService.updateWorkSchedule({
                    thu: dayKey,
                    gioLamViec: updatedSlots,
                    ghiChu: daySchedule.ghiChu || ''
                });
            }

            await loadAllData();
        } catch (error) {
            console.error('Error deleting time slot:', error);
            alert('Có lỗi khi xóa khung giờ!');
        }
    };

    const handleUpdateSlotStatus = async (dayKey, slotIndex, newStatus) => {
        try {
            const daySchedule = workSchedule.find(s => s.thu === dayKey);
            const updatedSlots = [...daySchedule.gioLamViec];
            updatedSlots[slotIndex].trangThai = newStatus;

            await ptService.updateWorkSchedule({
                thu: dayKey,
                gioLamViec: updatedSlots,
                ghiChu: daySchedule.ghiChu || ''
            });

            await loadAllData();
        } catch (error) {
            console.error('Error updating slot status:', error);
            alert('Có lỗi khi cập nhật trạng thái!');
        }
    };

    const handleCopySchedule = async (fromDay) => {
        const toDays = prompt('Nhập các thứ muốn sao chép đến (ví dụ: Tuesday,Wednesday,Thursday):');
        if (!toDays) return;

        try {
            const fromSchedule = workSchedule.find(s => s.thu === fromDay);
            if (!fromSchedule) return;

            const targetDays = toDays.split(',').map(d => d.trim());

            for (const targetDay of targetDays) {
                if (daysOfWeek.some(d => d.key === targetDay)) {
                    await ptService.updateWorkSchedule({
                        thu: targetDay,
                        gioLamViec: [...fromSchedule.gioLamViec],
                        ghiChu: fromSchedule.ghiChu || ''
                    });
                }
            }

            await loadAllData();
            alert('Sao chép lịch thành công!');
        } catch (error) {
            console.error('Error copying schedule:', error);
            alert('Có lỗi khi sao chép lịch!');
        }
    };

    const getSlotStatusBadge = (status) => {
        switch (status) {
            case 'RANH':
                return 'bg-green-500/20 text-green-400';
            case 'BAN':
                return 'bg-red-500/20 text-red-400';
            case 'NGHI':
                return 'bg-gray-500/20 text-gray-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getSlotStatusText = (status) => {
        switch (status) {
            case 'RANH': return 'Rảnh';
            case 'BAN': return 'Bận';
            case 'NGHI': return 'Nghỉ';
            default: return status;
        }
    };

    const getTotalFreeSlots = () => {
        return workSchedule.reduce((total, day) => {
            return total + day.gioLamViec.filter(slot => slot.trangThai === 'RANH').length;
        }, 0);
    };

    const getTotalSlots = () => {
        return workSchedule.reduce((total, day) => total + day.gioLamViec.length, 0);
    };

    // Lấy buổi tập đã được phân công cho một ngày cụ thể
    const getAssignedSessionsForDay = (dayKey) => {
        const dayMapping = {
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6,
            'Sunday': 0
        };
        const targetDay = dayMapping[dayKey];

        return assignedSessions.filter(session => {
            if (!session.ngayTap) return false;
            const sessionDate = new Date(session.ngayTap);
            const sessionDay = sessionDate.getDay();
            return sessionDay === targetDay;
        }).sort((a, b) => {
            // Sắp xếp theo giờ bắt đầu
            const timeA = a.gioBatDau || '00:00';
            const timeB = b.gioBatDau || '00:00';
            return timeA.localeCompare(timeB);
        });
    };

    // Lấy ngày thực tế cho từng thứ trong tuần dựa trên selectedDate
    const getDateForDay = (dayKey) => {
        const dayMapping = {
            'Sunday': 0,
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
        };
        const target = dayMapping[dayKey];
        const base = new Date(selectedDate);
        base.setHours(0, 0, 0, 0);
        const diff = base.getDay(); // 0=Sun
        // Đưa về thứ Hai là ngày đầu tuần
        const startOfWeek = new Date(base);
        const mondayOffset = diff === 0 ? -6 : 1 - diff;
        startOfWeek.setDate(base.getDate() + mondayOffset);
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + (target === 0 ? 6 : target - 1));
        return date;
    };

    const formatDayLabel = (dateObj) => dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    const toggleDayExpand = (dayKey) => {
        setExpandedDays(prev => {
            const next = new Set(prev);
            if (next.has(dayKey)) next.delete(dayKey);
            else next.add(dayKey);
            return next;
        });
    };

    // Lấy buổi tập theo đúng ngày (dd/mm/yyyy) cho chế độ xem theo ngày
    const getAssignedSessionsByDate = (dateObj) => {
        const start = new Date(dateObj);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        return assignedSessions
            .filter(session => {
                if (!session.ngayTap) return false;
                const d = new Date(session.ngayTap);
                return d >= start && d < end;
            })
            .sort((a, b) => (a.gioBatDau || '00:00').localeCompare(b.gioBatDau || '00:00'));
    };

    const handleQuickAdd = async () => {
        // If using date range
        if (dateRange.startDate && dateRange.endDate) {
            if (!quickAdd.gioBatDau || !quickAdd.gioKetThuc) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }

            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            const dayKeys = [];

            // Generate day keys from date range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayIndex = d.getDay();
                const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                dayKeys.push(dayMapping[dayIndex]);
            }

            try {
                for (const dayKey of [...new Set(dayKeys)]) { // Remove duplicates
                    const daySchedule = workSchedule.find(s => s.thu === dayKey);
                    const existingSlots = daySchedule ? daySchedule.gioLamViec : [];

                    await ptService.updateWorkSchedule({
                        thu: dayKey,
                        gioLamViec: [...existingSlots, {
                            gioBatDau: quickAdd.gioBatDau,
                            gioKetThuc: quickAdd.gioKetThuc,
                            trangThai: quickAdd.trangThai
                        }],
                        ghiChu: ''
                    });
                }

                await loadAllData();
                setQuickAdd({ selectedDays: [], gioBatDau: '', gioKetThuc: '', trangThai: 'RANH' });
                setDateRange({ startDate: '', endDate: '' });
                alert('Thêm lịch thành công!');
            } catch (error) {
                console.error('Error quick adding slots:', error);
                alert('Có lỗi khi thêm khung giờ!');
            }
            return;
        }

        // Using selected days
        if (quickAdd.selectedDays.length === 0 || !quickAdd.gioBatDau || !quickAdd.gioKetThuc) {
            alert('Vui lòng chọn ngày và điền đầy đủ thông tin!');
            return;
        }

        try {
            for (const dayKey of quickAdd.selectedDays) {
                const daySchedule = workSchedule.find(s => s.thu === dayKey);
                const existingSlots = daySchedule ? daySchedule.gioLamViec : [];

                await ptService.updateWorkSchedule({
                    thu: dayKey,
                    gioLamViec: [...existingSlots, {
                        gioBatDau: quickAdd.gioBatDau,
                        gioKetThuc: quickAdd.gioKetThuc,
                        trangThai: quickAdd.trangThai
                    }],
                    ghiChu: ''
                });
            }

            await loadAllData();
            setQuickAdd({ selectedDays: [], gioBatDau: '', gioKetThuc: '', trangThai: 'RANH' });
            alert('Thêm lịch thành công!');
        } catch (error) {
            console.error('Error quick adding slots:', error);
            alert('Có lỗi khi thêm khung giờ!');
        }
    };

    const toggleDaySelection = (dayKey) => {
        setQuickAdd(prev => ({
            ...prev,
            selectedDays: prev.selectedDays.includes(dayKey)
                ? prev.selectedDays.filter(d => d !== dayKey)
                : [...prev.selectedDays, dayKey]
        }));
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    // Điều hướng ngày (xem lịch theo ngày)
    const handlePrevDay = () => {
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 1);
            return d;
        });
    };

    const handleNextDay = () => {
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 1);
            return d;
        });
    };

    const formatDateLabel = (d) => d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const selectedDateSessions = getAssignedSessionsByDate(selectedDate);

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a1a1a;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2a2a2a;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3a3a3a;
                }
                
                /* Custom date and time input styles */
                input[type="date"],
                input[type="time"] {
                    color-scheme: dark;
                }
                
                input[type="date"]::-webkit-calendar-picker-indicator,
                input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(0.8) brightness(1.5);
                    cursor: pointer;
                    opacity: 0.9;
                    color-scheme: light;
                }
                
                input[type="date"]::-webkit-datetime-edit,
                input[type="time"]::-webkit-datetime-edit {
                    color: white;
                }
                
                input[type="date"]::-webkit-datetime-edit-fields-wrapper,
                input[type="time"]::-webkit-datetime-edit-fields-wrapper {
                    color: white;
                }
                
                input[type="date"]::-webkit-inner-spin-button,
                input[type="time"]::-webkit-inner-spin-button {
                    display: none;
                }
                
                /* Custom calendar dropdown styles */
                input[type="date"]::-webkit-calendar-picker-indicator:hover,
                input[type="time"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                }
                
                /* Style for selected date/time in dropdown */
                input[type="date"]::-webkit-datetime-edit-day-field:focus,
                input[type="date"]::-webkit-datetime-edit-month-field:focus,
                input[type="date"]::-webkit-datetime-edit-year-field:focus,
                input[type="time"]::-webkit-datetime-edit-hour-field:focus,
                input[type="time"]::-webkit-datetime-edit-minute-field:focus {
                    background-color: #da2128;
                    color: white;
                    outline: none;
                }
            `}</style>
            <PTSidebar
                isOpen={sidebarOpen}
                onToggle={setSidebarOpen}
                onCollapse={setSidebarCollapsed}
            />

            <div className={`transition-all duration-300 ${mainMarginLeft}`}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="mt-16 sm:mt-20 p-4 lg:p-8">
                    {/* Page Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Lịch Làm Việc</h1>
                                <p className="text-gray-400 text-sm">Thiết lập khung giờ rảnh để hội viên đăng ký</p>
                            </div>
                        </div>
                    </div>

                    {/* Ngày hiện tại + điều hướng */}
                    <div className="bg-[#141414] rounded-xl p-4 mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrevDay}
                                className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors cursor-pointer"
                            >
                                ←
                            </button>
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Ngày đang xem</p>
                                <h2 className="text-lg font-bold text-white">{formatDateLabel(selectedDate)}</h2>
                            </div>
                            <button
                                onClick={handleNextDay}
                                className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors cursor-pointer"
                            >
                                →
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#da2128]" />
                                <span>Buổi tập đã phân công</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500" />
                                <span>Khung giờ rảnh</span>
                            </div>
                        </div>
                    </div>

                    {/* Buổi tập theo ngày */}
                    <div className="bg-[#141414] rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Buổi tập trong ngày</h3>
                                <p className="text-gray-400 text-sm">Danh sách buổi tập đã được phân công vào ngày này</p>
                            </div>
                            <span className="text-gray-300 text-sm">{selectedDateSessions.length} buổi</span>
                        </div>
                        {selectedDateSessions.length === 0 ? (
                            <div className="text-center py-6">
                                <Clock className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Không có buổi tập nào trong ngày này</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedDateSessions.map((session, idx) => (
                                    <div
                                        key={session._id || idx}
                                        className="bg-gradient-to-r from-[#da2128]/15 to-[#ff3842]/15 border border-[#da2128]/30 rounded-lg p-3 hover:border-[#da2128]/60 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-[#da2128]" />
                                                <span className="text-white text-sm font-medium">
                                                    {session.gioBatDau} - {session.gioKetThuc}
                                                </span>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 bg-[#da2128]/30 text-[#da2128] rounded-full font-medium">
                                                {session.soLuongHienTai || 0}/{session.soLuongToiDa || 0}
                                            </span>
                                        </div>
                                        <p className="text-white text-sm font-semibold truncate">{session.tenBuoiTap || 'Buổi tập'}</p>
                                        {session.chiNhanh && (
                                            <p className="text-gray-400 text-xs mt-1">📍 {session.chiNhanh.tenChiNhanh || session.chiNhanh}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Add Toolbar */}
                    <div className="bg-[#141414] rounded-xl p-4 mb-4">
                        <div className="flex flex-col gap-4">
                            {/* Day Selection OR Date Range */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Day Selection */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Chọn ngày trong tuần</label>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day.key}
                                                onClick={() => toggleDaySelection(day.key)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${dateRange.startDate || dateRange.endDate
                                                    ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'
                                                    : quickAdd.selectedDays.includes(day.key)
                                                        ? 'bg-[#da2128] text-white'
                                                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#202020]'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Hoặc chọn khoảng ngày</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => {
                                                const nextRange = { ...dateRange, startDate: e.target.value };
                                                setDateRange(nextRange);
                                                setQuickAdd({ ...quickAdd, selectedDays: [] });
                                                if (nextRange.startDate && nextRange.endDate) {
                                                    loadAssignedSessions(nextRange);
                                                }
                                            }}
                                            className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da2128] text-sm border border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => {
                                                const nextRange = { ...dateRange, endDate: e.target.value };
                                                setDateRange(nextRange);
                                                setQuickAdd({ ...quickAdd, selectedDays: [] });
                                                if (nextRange.startDate && nextRange.endDate) {
                                                    loadAssignedSessions(nextRange);
                                                }
                                            }}
                                            className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da2128] text-sm border border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Time & Status & Action */}
                            <div className="flex flex-col lg:flex-row gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        value={quickAdd.gioBatDau}
                                        onChange={(e) => setQuickAdd({ ...quickAdd, gioBatDau: e.target.value })}
                                        className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da2128] text-sm border border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        value={quickAdd.gioKetThuc}
                                        onChange={(e) => setQuickAdd({ ...quickAdd, gioKetThuc: e.target.value })}
                                        className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da2128] text-sm border border-[#3a3a3a] hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                    />
                                </div>

                                {/* Status Dropdown */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Trạng thái</label>
                                    <button
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer min-w-[120px] justify-between"
                                    >
                                        <span className="text-sm">
                                            {quickAdd.trangThai === 'RANH' ? 'Rảnh' : quickAdd.trangThai === 'BAN' ? 'Bận' : 'Nghỉ'}
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showStatusDropdown && (
                                        <div className="absolute left-0 top-[70px] w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                            <div className="p-2">
                                                <button
                                                    onClick={() => { setQuickAdd({ ...quickAdd, trangThai: 'RANH' }); setShowStatusDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${quickAdd.trangThai === 'RANH' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                        }`}
                                                >
                                                    Rảnh
                                                </button>
                                                <button
                                                    onClick={() => { setQuickAdd({ ...quickAdd, trangThai: 'BAN' }); setShowStatusDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${quickAdd.trangThai === 'BAN' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                        }`}
                                                >
                                                    Bận
                                                </button>
                                                <button
                                                    onClick={() => { setQuickAdd({ ...quickAdd, trangThai: 'NGHI' }); setShowStatusDropdown(false); }}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${quickAdd.trangThai === 'NGHI' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                        }`}
                                                >
                                                    Nghỉ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleQuickAdd}
                                        className="px-4 py-2 bg-[#da2128] hover:bg-[#da2128]/90 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 text-sm h-[42px]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm nhanh
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Schedule Grid */}
                    {loading ? (
                        <div className="bg-[#141414] rounded-xl p-12 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-[#da2128] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-gray-400 text-sm">Đang tải...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {daysOfWeek.map((day) => {
                                const daySchedule = workSchedule.find(s => s.thu === day.key);
                                const slots = daySchedule?.gioLamViec || [];
                                const assignedSessionsForDay = getAssignedSessionsForDay(day.key);
                                const dayDate = getDateForDay(day.key);
                                const isExpanded = expandedDays.has(day.key);

                                return (
                                    <div key={day.key} className="bg-[#141414] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#da2128]/5 transition-all">
                                        {/* Day Header */}
                                        <div className="bg-[#1a1a1a] p-4 cursor-pointer" onClick={() => toggleDayExpand(day.key)}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#da2128]/20 rounded-lg flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-[#da2128]" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-white">{day.label}</h3>
                                                            <span className="text-xs text-gray-400">{formatDayLabel(dayDate)}</span>
                                                        </div>
                                                        <p className="text-gray-400 text-xs">
                                                            {slots.length > 0 ? `${slots.length} khung giờ` : 'Chưa có lịch'}
                                                            {assignedSessionsForDay.length > 0 && (
                                                                <span className="ml-2 text-green-400">
                                                                    • {assignedSessionsForDay.length} buổi tập
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        setSelectedDay(day);
                                                        setShowAddSlotModal(true);
                                                    }}
                                                    className="px-3 py-2 bg-[#da2128] hover:bg-[#da2128]/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Thêm
                                                </button>
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors"
                                                        aria-label="Toggle"
                                                    >
                                                        {isExpanded ? '−' : '+'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time Slots (collapse/expand) */}
                                        {isExpanded && (
                                        <div className="p-4">
                                                {/* Buổi tập đã được phân công */}
                                                {assignedSessionsForDay.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Buổi tập đã phân công</h4>
                                                        <div className="space-y-2">
                                                            {assignedSessionsForDay.map((session, idx) => (
                                                                <div
                                                                    key={session._id || idx}
                                                                    className="bg-gradient-to-r from-[#da2128]/20 to-[#ff3842]/20 border border-[#da2128]/30 rounded-lg p-3 hover:border-[#da2128]/50 transition-all"
                                                                >
                                                                    <p className="text-gray-400 text-[11px] mb-1">
                                                                        {new Date(session.ngayTap).toLocaleDateString('vi-VN')}
                                                                    </p>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="w-4 h-4 text-[#da2128]" />
                                                                            <span className="text-white text-sm font-medium">
                                                                                {session.gioBatDau} - {session.gioKetThuc}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs px-2 py-0.5 bg-[#da2128]/30 text-[#da2128] rounded-full font-medium">
                                                                            {session.soLuongHienTai || 0}/{session.soLuongToiDa || 0}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-300 text-xs truncate">{session.tenBuoiTap || 'Buổi tập'}</p>
                                                                    {session.chiNhanh && (
                                                                        <p className="text-gray-400 text-xs mt-1">📍 {session.chiNhanh.tenChiNhanh || session.chiNhanh}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Khung giờ rảnh */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Khung giờ rảnh</h4>
                                            {slots.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                                    <p className="text-gray-500 text-sm">Chưa có khung giờ</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                                    {slots.map((slot, slotIndex) => (
                                                        <div
                                                            key={slotIndex}
                                                            className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#202020] transition-all group"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className={`w-4 h-4 ${slot.trangThai === 'RANH' ? 'text-green-400' : slot.trangThai === 'BAN' ? 'text-red-400' : 'text-gray-400'}`} />
                                                                    <span className="text-white text-sm font-medium">
                                                                        {slot.gioBatDau} - {slot.gioKetThuc}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteTimeSlot(day.key, slotIndex)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3 h-3 text-red-400" />
                                                                </button>
                                                            </div>

                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleUpdateSlotStatus(day.key, slotIndex, 'RANH')}
                                                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${slot.trangThai === 'RANH' ? 'bg-green-500/30 text-green-300' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                                                >
                                                                    Rảnh
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateSlotStatus(day.key, slotIndex, 'BAN')}
                                                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${slot.trangThai === 'BAN' ? 'bg-red-500/30 text-red-300' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                                                >
                                                                    Bận
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateSlotStatus(day.key, slotIndex, 'NGHI')}
                                                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${slot.trangThai === 'NGHI' ? 'bg-gray-500/30 text-gray-300' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'}`}
                                                                >
                                                                    Nghỉ
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Time Slot Modal */}
            {showAddSlotModal && selectedDay && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 mt-16 sm:mt-20">
                    <div className="bg-[#141414] rounded-xl max-w-md w-full">
                        <div className="bg-[#1a1a1a] p-5 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#da2128]/20 rounded-lg flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-[#da2128]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Thêm Khung Giờ</h2>
                                        <p className="text-gray-400 text-sm">{selectedDay.label}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAddSlotModal(false);
                                        setNewSlot({ gioBatDau: '', gioKetThuc: '', trangThai: 'RANH' });
                                        setSelectedDay(null);
                                    }}
                                    className="w-8 h-8 hover:bg-[#202020] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Giờ bắt đầu</label>
                                <input
                                    type="time"
                                    value={newSlot.gioBatDau}
                                    onChange={(e) => setNewSlot({ ...newSlot, gioBatDau: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da2128]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Giờ kết thúc</label>
                                <input
                                    type="time"
                                    value={newSlot.gioKetThuc}
                                    onChange={(e) => setNewSlot({ ...newSlot, gioKetThuc: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#da2128]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Trạng thái</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setNewSlot({ ...newSlot, trangThai: 'RANH' })}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${newSlot.trangThai === 'RANH' ? 'bg-green-500/30 text-green-300' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                    >
                                        Rảnh
                                    </button>
                                    <button
                                        onClick={() => setNewSlot({ ...newSlot, trangThai: 'BAN' })}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${newSlot.trangThai === 'BAN' ? 'bg-red-500/30 text-red-300' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                    >
                                        Bận
                                    </button>
                                    <button
                                        onClick={() => setNewSlot({ ...newSlot, trangThai: 'NGHI' })}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${newSlot.trangThai === 'NGHI' ? 'bg-gray-500/30 text-gray-300' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'}`}
                                    >
                                        Nghỉ
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    onClick={() => {
                                        setShowAddSlotModal(false);
                                        setNewSlot({ gioBatDau: '', gioKetThuc: '', trangThai: 'RANH' });
                                        setSelectedDay(null);
                                    }}
                                    className="flex-1 px-5 py-3 bg-[#1a1a1a] hover:bg-[#202020] text-white rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleAddTimeSlot}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#da2128] hover:bg-[#da2128]/90 text-white rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Lưu</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PTWorkSchedule;
