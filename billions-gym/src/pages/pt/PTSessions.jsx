import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';

const PTSessions = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [filter, setFilter] = useState({ trangThai: '' });

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadSessions();
    }, [filter]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const response = await ptService.getMySessions(filter);
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

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Quản lý buổi tập</h2>

                    <div className="mb-6 flex flex-wrap gap-4">
                        <select
                            value={filter.trangThai}
                            onChange={(e) => setFilter({ ...filter, trangThai: e.target.value })}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#da2128]"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="CHUAN_BI">Chuẩn bị</option>
                            <option value="DANG_DIEN_RA">Đang diễn ra</option>
                            <option value="HOAN_THANH">Hoàn thành</option>
                            <option value="HUY">Đã hủy</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : sessions.length > 0 ? (
                        <div className="space-y-4">
                            {sessions.map(session => (
                                <div key={session._id} className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a] hover:border-[#da2128] transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-white font-semibold text-lg mb-2">{session.tenBuoiTap}</h3>
                                            <p className="text-gray-400">
                                                📅 {new Date(session.ngayTap).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="text-gray-400">
                                                ⏰ {session.gioBatDau} - {session.gioKetThuc}
                                            </p>
                                            <p className="text-gray-400">
                                                👥 {session.soLuongHienTai}/{session.soLuongToiDa} học viên
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded text-xs font-medium ${session.trangThai === 'HOAN_THANH' ? 'bg-green-500/20 text-green-400' :
                                                session.trangThai === 'DANG_DIEN_RA' ? 'bg-blue-500/20 text-blue-400' :
                                                    session.trangThai === 'HUY' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {session.trangThai === 'CHUAN_BI' ? 'Chuẩn bị' :
                                                session.trangThai === 'DANG_DIEN_RA' ? 'Đang diễn ra' :
                                                    session.trangThai === 'HOAN_THANH' ? 'Hoàn thành' : 'Đã hủy'}
                                        </span>
                                    </div>

                                    {session.danhSachHoiVien && session.danhSachHoiVien.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                                            <p className="text-white font-semibold mb-3">Danh sách học viên tham gia:</p>
                                            <div className="space-y-2">
                                                {session.danhSachHoiVien.map((member, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
                                                        <div className="flex items-center gap-3">
                                                            {member.hoiVien?.anhDaiDien ? (
                                                                <img
                                                                    src={member.hoiVien.anhDaiDien}
                                                                    alt={member.hoiVien.hoTen}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-[#da2128] flex items-center justify-center text-white font-semibold">
                                                                    {member.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-white font-medium">{member.hoiVien?.hoTen || 'N/A'}</p>
                                                                <p className={`text-xs ${member.trangThai === 'DA_THAM_GIA' ? 'text-green-400' :
                                                                        member.trangThai === 'VANG_MAT' ? 'text-yellow-400' :
                                                                            member.trangThai === 'HUY' ? 'text-red-400' :
                                                                                'text-gray-400'
                                                                    }`}>
                                                                    {member.trangThai === 'DA_DANG_KY' ? 'Đã đăng ký' :
                                                                        member.trangThai === 'DA_THAM_GIA' ? 'Đã tham gia' :
                                                                            member.trangThai === 'VANG_MAT' ? 'Vắng mặt' : 'Đã hủy'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {session.trangThai === 'DANG_DIEN_RA' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateProgress(member.hoiVien._id, 'DA_THAM_GIA')}
                                                                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
                                                                >
                                                                    Có mặt
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateProgress(member.hoiVien._id, 'VANG_MAT')}
                                                                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm hover:bg-yellow-500/30"
                                                                >
                                                                    Vắng
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Không có buổi tập nào</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTSessions;

