import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';
import {
    Calendar, Clock, Plus, Edit2, Trash2, Copy, Save, X
} from 'lucide-react';

const PTWorkSchedule = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [workSchedule, setWorkSchedule] = useState([]);
    const [showAddSlotModal, setShowAddSlotModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [newSlot, setNewSlot] = useState({
        gioBatDau: '',
        gioKetThuc: '',
        trangThai: 'RANH'
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
        loadWorkSchedule();
    }, []);

    const loadWorkSchedule = async () => {
        setLoading(true);
        try {
            const response = await ptService.getWorkSchedule();
            if (response.success) {
                setWorkSchedule(response.data || []);
            }
        } catch (error) {
            console.error('Error loading work schedule:', error);
        } finally {
            setLoading(false);
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
                await loadWorkSchedule();
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

            await loadWorkSchedule();
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

            await loadWorkSchedule();
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

            await loadWorkSchedule();
            alert('Sao chép lịch thành công!');
        } catch (error) {
            console.error('Error copying schedule:', error);
            alert('Có lỗi khi sao chép lịch!');
        }
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

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
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Lịch Làm Việc</h1>
                                <p className="text-gray-400 text-sm">Thiết lập khung giờ rảnh để hội viên đăng ký</p>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Schedule Table */}
                    {loading ? (
                        <div className="bg-[#141414] rounded-xl p-12 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-[#da2128] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-gray-400 text-sm">Đang tải...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#141414] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#1a1a1a]">
                                        <th className="text-left px-6 py-4 text-gray-300 font-semibold w-40">Thứ</th>
                                        <th className="text-left px-6 py-4 text-gray-300 font-semibold">Khung giờ làm việc</th>
                                        <th className="text-center px-6 py-4 text-gray-300 font-semibold w-48">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {daysOfWeek.map((day, index) => {
                                        const daySchedule = workSchedule.find(s => s.thu === day.key);
                                        const slots = daySchedule?.gioLamViec || [];

                                        return (
                                            <tr key={day.key} className={`${index !== daysOfWeek.length - 1 ? 'border-b border-[#2a2a2a]' : ''} hover:bg-[#1a1a1a] transition-colors`}>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-[#da2128]" />
                                                        <span className="text-white font-medium">{day.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {slots.length === 0 ? (
                                                        <span className="text-gray-500 text-sm italic">Chưa có lịch làm việc</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {slots.map((slot, slotIndex) => (
                                                                <div
                                                                    key={slotIndex}
                                                                    className="group relative inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Clock className={`w-4 h-4 ${slot.trangThai === 'RANH' ? 'text-green-400' : slot.trangThai === 'BAN' ? 'text-red-400' : 'text-gray-400'}`} />
                                                                    <span className="text-white text-sm font-medium">
                                                                        {slot.gioBatDau} - {slot.gioKetThuc}
                                                                    </span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded ${slot.trangThai === 'RANH' ? 'bg-green-500/20 text-green-400' : slot.trangThai === 'BAN' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                        {slot.trangThai === 'RANH' ? 'Rảnh' : slot.trangThai === 'BAN' ? 'Bận' : 'Nghỉ'}
                                                                    </span>

                                                                    {/* Quick Actions */}
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleUpdateSlotStatus(day.key, slotIndex, slot.trangThai === 'RANH' ? 'BAN' : 'RANH')}
                                                                            className="p-1 hover:bg-[#2a2a2a] rounded transition-colors cursor-pointer"
                                                                            title="Đổi trạng thái"
                                                                        >
                                                                            <Edit2 className="w-3 h-3 text-blue-400" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteTimeSlot(day.key, slotIndex)}
                                                                            className="p-1 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                                                                            title="Xóa"
                                                                        >
                                                                            <Trash2 className="w-3 h-3 text-red-400" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDay(day);
                                                                setShowAddSlotModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-[#da2128] hover:bg-[#da2128]/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Thêm
                                                        </button>
                                                        {slots.length > 0 && (
                                                            <button
                                                                onClick={() => handleCopySchedule(day.key)}
                                                                className="p-2 bg-[#1a1a1a] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
                                                                title="Sao chép"
                                                            >
                                                                <Copy className="w-4 h-4 text-gray-400" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${newSlot.trangThai === 'RANH' ? 'bg-green-500/30 text-green-300' : 'bg-[#1a1a1a] text-green-400 hover:bg-green-500/10'}`}
                                    >
                                        Rảnh
                                    </button>
                                    <button
                                        onClick={() => setNewSlot({ ...newSlot, trangThai: 'BAN' })}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${newSlot.trangThai === 'BAN' ? 'bg-red-500/30 text-red-300' : 'bg-[#1a1a1a] text-red-400 hover:bg-red-500/10'}`}
                                    >
                                        Bận
                                    </button>
                                    <button
                                        onClick={() => setNewSlot({ ...newSlot, trangThai: 'NGHI' })}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${newSlot.trangThai === 'NGHI' ? 'bg-gray-500/30 text-gray-300' : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-500/10'}`}
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
