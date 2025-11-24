import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';

const PTSchedule = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ trangThai: '', ngayBatDau: '', ngayKetThuc: '' });

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

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Lịch làm việc</h2>

                    <div className="mb-6 flex flex-wrap gap-4">
                        <select
                            value={filter.trangThai}
                            onChange={(e) => setFilter({ ...filter, trangThai: e.target.value })}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded px-4 py-2"
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
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-white font-semibold text-lg">{session.tenBuoiTap}</h3>
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
                                    <p className="text-gray-400 mb-2">
                                        📅 {new Date(session.ngayTap).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-gray-400 mb-2">
                                        ⏰ {session.gioBatDau} - {session.gioKetThuc}
                                    </p>
                                    {session.chiNhanh && (
                                        <p className="text-gray-400 mb-2">
                                            📍 {session.chiNhanh.tenChiNhanh}
                                        </p>
                                    )}
                                    <p className="text-gray-400">
                                        👥 {session.soLuongHienTai}/{session.soLuongToiDa} học viên
                                    </p>
                                    {session.danhSachHoiVien && session.danhSachHoiVien.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                                            <p className="text-gray-400 text-sm mb-2">Danh sách học viên:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {session.danhSachHoiVien.map((member, idx) => (
                                                    <span key={idx} className="bg-[#0a0a0a] px-2 py-1 rounded text-sm text-gray-300">
                                                        {member.hoiVien?.hoTen || 'N/A'}
                                                    </span>
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

export default PTSchedule;

