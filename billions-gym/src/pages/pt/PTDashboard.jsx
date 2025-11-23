import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';

const PTDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const response = await ptService.getDashboard();
            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const sidebarWidth = sidebarCollapsed ? 80 : 320;
    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Trang chủ PT</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : dashboardData ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                                <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a] hover:border-[#da2128] transition-colors">
                                    <h3 className="text-gray-400 text-sm sm:text-base mb-2">Số học viên</h3>
                                    <p className="text-3xl sm:text-4xl font-bold text-white">{dashboardData.soHoiVien || 0}</p>
                                </div>
                                <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a] hover:border-[#da2128] transition-colors">
                                    <h3 className="text-gray-400 text-sm sm:text-base mb-2">Buổi tập hôm nay</h3>
                                    <p className="text-3xl sm:text-4xl font-bold text-white">{dashboardData.buoiTapHomNay || 0}</p>
                                </div>
                                <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a] hover:border-[#da2128] transition-colors">
                                    <h3 className="text-gray-400 text-sm sm:text-base mb-2">Buổi tập tuần này</h3>
                                    <p className="text-3xl sm:text-4xl font-bold text-white">{dashboardData.buoiTapTuanNay || 0}</p>
                                </div>
                            </div>

                            {dashboardData.lichSapToi && dashboardData.lichSapToi.length > 0 && (
                                <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a]">
                                    <h3 className="text-xl font-bold text-white mb-4">Lịch sắp tới</h3>
                                    <div className="space-y-3">
                                        {dashboardData.lichSapToi.map((session, index) => (
                                            <div key={index} className="bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
                                                <p className="text-white font-semibold">{session.tenBuoiTap}</p>
                                                <p className="text-gray-400 text-sm">
                                                    {new Date(session.ngayTap).toLocaleDateString('vi-VN')} - {session.gioBatDau} - {session.gioKetThuc}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {session.chiNhanh?.tenChiNhanh || 'N/A'} - {session.soLuongHienTai}/{session.soLuongToiDa} học viên
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-white text-center py-12">Không có dữ liệu</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTDashboard;

