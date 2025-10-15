import React from 'react';
import Layout from '../components/layout/Layout';
import { authUtils } from '../utils/auth';
import { userAPI } from '../services/api';
import { useEffect, useState } from 'react';
//import { getRankLabelVi } from '../utils/rankMap';

const Home = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const isAuthenticated = authUtils.isAuthenticated();
    const storedUser = authUtils.getUser();
    const [user, setUser] = useState(storedUser || {});
    const [loadingRank, setLoadingRank] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchRank = async () => {
            if (!isAuthenticated) return;
            const id = authUtils.getUserId();
            if (!id) return;
            try {
                setLoadingRank(true);
                const res = await userAPI.getUserWithRank(id);
                const payload = res && res.data ? res.data : res;
                if (mounted && payload) {
                    setUser(prev => ({ ...prev, ...payload }));
                    try {
                        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...payload }));
                    } catch (e) {
                        console.error('Could not update localStorage user', e);
                    }
                }
            } catch (err) {
                console.error('Could not fetch user rank', err);
            } finally {
                setLoadingRank(false);
            }
        };
        fetchRank();
        return () => { mounted = false };
    }, [isAuthenticated]);

    return (
        <Layout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
            {isAuthenticated && (
                <div className="px-9 py-8 max-w-full mx-auto bg-[#070606]">
                    {/* <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white">Xin chào, {user?.hoTen || 'Hội viên'} 👋</h2>
                        <p className="text-gray-300 mt-1">Chúc bạn có một ngày tràn đầy năng lượng!</p>
                    </div> */}

                    <div className="flex flex-col md:flex-row md:justify-between gap-5">
                        <div className="flex-1 rounded-xl bg-[#1d1d1d] border border-[#2a2a2a] p-5 flex-shrink-0 min-w-[220px] flex flex-col justify-between">
                            {(() => {
                                function formatDateToDDMMYYYY(isoDate) {
                                    if (!isoDate) return '';
                                    const date = new Date(isoDate);
                                    if (isNaN(date.getTime())) return '';
                                    const day = ('0' + date.getDate()).slice(-2);
                                    const month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    const year = date.getFullYear();
                                    return `${day}/${month}/${year}`;
                                }
                                window._formatDateToDDMMYYYY = formatDateToDDMMYYYY;
                            })()}

                            <div className='mb-6'>
                                <span className='text-white font-bold text-[18px]' lang="db-thongtinhoivien">Thông tin hội viên</span>
                            </div>
                            <div>
                                <div className="flex items-center mb-4 gap-3">
                                    <div className="w-30 h-30 rounded-full overflow-hidden bg-[#da2128] flex items-center justify-center">
                                        {user?.anhDaiDien ? (
                                            <img
                                                src={user.anhDaiDien}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-5xl font-medium">
                                                {(user?.hoTen?.[0] || user?.email?.[0] || user?.sdt?.[0] || 'U').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white text-xl font-bold mb-3">
                                            {user?.hoTen || 'Hội viên'}
                                        </div>
                                        <div className="flex items-center space-x-2 mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user h-4 w-4 text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            <span className="text-gray-300 text-sm">Hội viên Billions Gym</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-green-500 text-white">{user.trangThaiHoiVien === 'DANG_HOAT_DONG' ? 'Đang hoạt động' : 'N/A'}</div>
                                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-yellow-500 text-yellow-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award h-3 w-3 mr-1"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path><circle cx="12" cy="8" r="6"></circle></svg>
                                                {loadingRank ? 'Đang tải...' : getRankLabelVi(user.hangHoiVien || (user.hangHoiVien && user.hangHoiVien.tenHang) || user.hangHoiVien)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center text-white text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar h-4 w-4 mr-2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                                <span>
                                    Tham gia từ: {user.ngayThamGia ? window._formatDateToDDMMYYYY(user.ngayThamGia) : 'Chưa cập nhật'}
                                </span>
                            </div>
                            <div className="mt-4">
                                <a href="/profile" className="text-[#da2128] hover:underline">Xem hồ sơ →</a>
                            </div>
                        </div>

                        <div className="flex-1 rounded-xl bg-[#1d1d1d] border border-[#2a2a2a] p-5 flex-shrink-0 min-w-[220px] flex flex-col justify-between">
                            <div>
                                <div className="text-gray-400 text-sm mb-2">Gói tập</div>
                                <div className="text-white text-lg font-semibold">Gói tập hiện tại</div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <a href="/packages" className="px-4 py-2 rounded-md bg-[#da2128] text-white hover:bg-[#b91c1c]">Xem gói tập</a>
                                <a href="/checkout" className="px-4 py-2 rounded-md border border-[#3a3a3a] text-white hover:border-[#555]">Thanh toán</a>
                            </div>
                        </div>

                        <div className="flex-1 rounded-xl bg-[#1d1d1d] border border-[#2a2a2a] p-5 flex-shrink-0 min-w-[220px] flex flex-col justify-between">
                            <div>
                                <div className="text-gray-400 text-sm mb-2">Lịch tập</div>
                                <div className="text-white text-lg font-semibold">Theo dõi kế hoạch</div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <a href="/schedule" className="px-4 py-2 rounded-md border border-[#3a3a3a] text-white hover:border-[#555]">Lịch của tôi</a>
                                <a href="/classes" className="px-4 py-2 rounded-md border border-[#3a3a3a] text-white hover:border-[#555]">Đặt lịch PT</a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="rounded-xl bg-[#1d1d1d] border border-[#2a2a2a] p-5">
                            <div className="text-white font-semibold mb-2">Tiến độ tuần này</div>
                            <p className="text-gray-400 text-sm">Tính năng chi tiết sẽ được bổ sung.</p>
                        </div>
                        <div className="rounded-xl bg-[#1d1d1d] border border-[#2a2a2a] p-5">
                            <div className="text-white font-semibold mb-2">Gợi ý cho bạn</div>
                            <p className="text-gray-400 text-sm">Khám phá gói tập và lịch PT phù hợp.</p>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Home;
