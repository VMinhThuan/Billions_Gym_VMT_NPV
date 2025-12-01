import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import PTStatsCard from '../../components/pt/PTStatsCard';
import PTSessionChart from '../../components/pt/PTSessionChart';
import PTStudentChart from '../../components/pt/PTStudentChart';
import ChatWindowPopup from '../../components/chat/ChatWindowPopup';
import { Users, Calendar, Clock, TrendingUp, Star, Award, CheckCircle, MessageCircle } from 'lucide-react';
import ptService from '../../services/pt.service';
import chatService from '../../services/chat.service';
import { authUtils } from '../../utils/auth';

const PTDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [studentStats, setStudentStats] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedChatRoom, setSelectedChatRoom] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    // Join rooms khi chatRooms thay đổi và WebSocket đã connected
    useEffect(() => {
        if (chatRooms.length > 0 && chatService.isConnected) {
            console.log('[PTDashboard] Joining chat rooms:', chatRooms.length);
            chatRooms.forEach(room => {
                if (room._id) {
                    chatService.joinRoom(room._id);
                    console.log('[PTDashboard] Joined room:', room._id);
                }
            });
        }
    }, [chatRooms]);

    useEffect(() => {
        loadAllData();

        // Kết nối WebSocket để nhận tin nhắn real-time
        chatService.connect();

        // Lắng nghe tin nhắn mới
        const handleNewMessage = (message) => {
            console.log('[PTDashboard] New message received:', message);
            console.log('[PTDashboard] Message room:', message.room);
            console.log('[PTDashboard] Current chatRooms:', chatRooms.map(r => ({ id: r._id, hoiVien: r.hoiVien?.hoTen })));
            
            const currentUser = authUtils.getUser();
            console.log('[PTDashboard] Current user ID:', currentUser?._id);
            console.log('[PTDashboard] Message sender ID:', message.sender?._id || message.sender);
            
            // Cập nhật chatRooms state trực tiếp
            setChatRooms(prevRooms => {
                const updatedRooms = prevRooms.map(room => {
                    if (room._id === message.room) {
                        console.log('[PTDashboard] Found matching room:', room._id);
                        // Chỉ tăng unreadCount nếu không phải tin nhắn của mình
                        const isOwnMessage = message.sender._id === currentUser?._id || message.sender === currentUser?._id;
                        console.log('[PTDashboard] Is own message?', isOwnMessage);
                        
                        return {
                            ...room,
                            lastMessage: message.message,
                            lastMessageAt: message.createdAt,
                            unreadCount: isOwnMessage ? room.unreadCount : (room.unreadCount || 0) + 1
                        };
                    }
                    return room;
                });
                
                // Nếu room không tồn tại trong danh sách, reload toàn bộ
                const roomExists = prevRooms.some(room => room._id === message.room);
                if (!roomExists) {
                    console.log('[PTDashboard] Room not found in current list, reloading...');
                    loadChatRooms();
                    return prevRooms;
                }
                
                // Sắp xếp lại theo thời gian tin nhắn mới nhất
                return updatedRooms.sort((a, b) => {
                    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
                    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
                    return dateB - dateA;
                });
            });
        };

        chatService.on('new-message', handleNewMessage);

        // Cleanup khi component unmount
        return () => {
            chatService.off('new-message', handleNewMessage);
            chatService.disconnect();
        };
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadDashboard(),
                loadStatistics(),
                loadStudentStats(),
                loadChatRooms()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDashboard = async () => {
        try {
            const response = await ptService.getDashboard();
            if (response.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    const loadStatistics = async () => {
        try {
            const response = await ptService.getStatistics();
            if (response.success) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    };

    const loadStudentStats = async () => {
        try {
            const response = await ptService.getStudentStatistics({ period: 'week' });
            if (response.success) {
                const formatted = response.data.map(item => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit'
                    })
                }));
                setStudentStats(formatted);
            }
        } catch (error) {
            console.error('Error loading student stats:', error);
        }
    };

    const loadChatRooms = async () => {
        try {
            const response = await chatService.getChatRooms();
            if (response.success) {
                const rooms = response.data.slice(0, 5); // Chỉ lấy 5 chat gần nhất
                setChatRooms(rooms);
                // Join rooms sẽ được xử lý bởi useEffect riêng
            }
        } catch (error) {
            console.error('Error loading chat rooms:', error);
        }
    };

    const handleOpenChat = (room) => {
        setSelectedChatRoom(room);
        setSelectedStudent(room.hoiVien);
        setShowChat(true);
        
        // Reset unread count khi mở chat
        setChatRooms(prevRooms => 
            prevRooms.map(r => 
                r._id === room._id 
                    ? { ...r, unreadCount: 0 } 
                    : r
            )
        );
    };

    const handleCloseChat = () => {
        setShowChat(false);
        setSelectedChatRoom(null);
        setSelectedStudent(null);
    };

    const sidebarWidth = sidebarCollapsed ? 80 : 320;
    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-[1400px] mx-auto">
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#141414] rounded-3xl p-8 mb-6 border border-[#2a2a2a]">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-white mb-3">
                                    Train hard, 💪<br />
                                    Turn up, Run your best!
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Chúng ta phải luyện tập chăm chỉ. Đừng giới hạn thử thách của bạn, hãy thách thức giới hạn của bạn.
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                {/* Today's Sessions Card */}
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg viewBox="0 0 1024 1024" className="w-6 h-6" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M973.3 98.4L99.6 972.1c-11.7 11.7-30.9 11.7-42.6 0l-4.3-4.3C41 956 41 936.9 52.7 925.2L926.4 51.5c11.7-11.7 30.9-11.7 42.6 0l4.3 4.3c11.7 11.8 11.7 30.9 0 42.6z" fill="#B6CDEF"></path><path d="M78.3 996.1c-12.7 0-25.4-4.8-35.1-14.5-19.4-19.4-19.4-50.9 0-70.2L912.5 42c19.4-19.4 50.9-19.4 70.2 0 9.4 9.4 14.5 21.8 14.5 35.1s-5.2 25.8-14.5 35.1L113.5 981.6c-9.7 9.7-22.4 14.5-35.2 14.5zM947.7 60.5c-4.3 0-8.5 1.6-11.8 4.9L66.6 934.7c-6.5 6.5-6.5 17 0 23.5s17 6.5 23.5 0L959.4 88.9c3.1-3.1 4.8-7.3 4.8-11.8 0-4.5-1.7-8.6-4.8-11.8-3.2-3.2-7.5-4.8-11.7-4.8z" fill="#0F53A8"></path><path d="M408.6 901.7l-53.9 53.9c-8.7 8.7-22.7 8.7-31.3 0L69.2 701.4c-8.7-8.7-8.7-22.7 0-31.3l53.9-53.9c8.7-8.7 22.7-8.7 31.3 0l254.2 254.2c8.7 8.6 8.7 22.7 0 31.3z" fill="#89B7F5"></path><path d="M339 977.7c-10.5 0-21-4-28.9-12l-251-251c-7.7-7.7-12-18-12-28.9 0-10.9 4.3-21.2 12-28.9l50.7-50.7c16-16 41.9-16 57.9 0l251 251c16 16 16 41.9 0 57.9L368 965.7c-8 8-18.5 12-29 12zM138.8 627.2c-2 0-4 0.8-5.6 2.3l-50.7 50.7c-2 2-2.3 4.4-2.3 5.6 0 1.2 0.3 3.6 2.3 5.6l251 251c3.1 3.1 8.1 3.1 11.1 0l50.7-50.7c3.1-3.1 3.1-8.1 0-11.1l-251-251c-1.5-1.7-3.5-2.4-5.5-2.4z" fill="#0F53A8"></path><path d="M276.4 940l-34.1 34.1c-8.7 8.7-22.7 8.7-31.3 0L50.7 813.8c-8.7-8.7-8.7-22.7 0-31.3l34.1-34.1c8.7-8.7 22.7-8.7 31.3 0l160.3 160.3c8.7 8.6 8.7 22.6 0 31.3z" fill="#89B7F5"></path><path d="M226.7 996.2c-10.9 0-21.2-4.3-28.9-12L40.6 827.1c-16-16-16-41.9 0-57.9l30.9-30.9c16-16 41.9-16 57.9 0l157.1 157.1c7.7 7.7 12 18 12 28.9 0 10.9-4.3 21.2-12 28.9l-30.9 30.9c-7.7 7.8-18 12.1-28.9 12.1zM100.5 759.3c-2 0-4 0.8-5.6 2.3l-30.9 31c-3.1 3.1-3.1 8.1 0 11.1l157.1 157.1c3.1 3.1 8.1 3.1 11.1 0l30.9-30.9c2-2 2.3-4.4 2.3-5.6 0-1.2-0.3-3.6-2.3-5.6L106 761.6c-1.5-1.5-3.5-2.3-5.5-2.3z" fill="#0F53A8"></path><path d="M902.9 407.4l53.9-53.9c8.7-8.7 8.7-22.7 0-31.3L702.6 68c-8.7-8.7-22.7-8.7-31.3 0l-53.9 53.9c-8.7 8.7-8.7 22.7 0 31.3l254.2 254.2c8.6 8.6 22.7 8.6 31.3 0z" fill="#89B7F5"></path><path d="M887.2 429.5c-10.5 0-21-4-28.9-12l-251-251c-16-16-16-41.9 0-57.9L658 57.9c16-16 41.9-16 57.9 0l251 251c16 16 16 41.9 0 57.9l-50.7 50.7c-8 8-18.5 12-29 12zM687 79c-2 0-4 0.8-5.6 2.3L630.7 132c-3.1 3.1-3.1 8.1 0 11.1l251 251c3.1 3.1 8.1 3.1 11.1 0l50.7-50.7c3.1-3.1 3.1-8.1 0-11.1l-251-251C691 79.7 689 79 687 79z" fill="#0F53A8"></path><path d="M941.2 275.2l34.1-34.1c8.7-8.7 8.7-22.7 0-31.3L815 49.5c-8.7-8.7-22.7-8.7-31.3 0l-34.1 34.1c-8.7 8.7-8.7 22.7 0 31.3l160.3 160.3c8.6 8.7 22.6 8.7 31.3 0z" fill="#89B7F5"></path><path d="M925.5 297.3c-10.9 0-21.2-4.3-28.9-12L739.5 128.2c-16-16-16-41.9 0-57.9l30.9-30.9c16-16 41.9-16 57.9 0l157.1 157.1c7.7 7.7 12 18 12 28.9 0 10.9-4.3 21.2-12 28.9l-30.9 30.9c-7.8 7.8-18 12.1-29 12.1zM799.3 60.5c-2 0-4 0.8-5.6 2.3l-30.9 30.9c-3.1 3.1-3.1 8.1 0 11.1L920 262c3.1 3.1 8.1 3.1 11.1 0l30.9-31c3.1-3.1 3.1-8.1 0-11.1L804.9 62.8c-1.5-1.6-3.5-2.3-5.6-2.3z" fill="#0F53A8"></path></g></svg>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-1">Bạn có tổng cộng</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-3xl font-bold text-white">{dashboardData?.buoiTapHomNay || 0}</span>
                                        <span className="text-gray-400 text-xs">buổi tập hôm nay.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Upcoming Event Card */}
                                {dashboardData?.lichSapToi && dashboardData.lichSapToi.length > 0 && (
                                    <div className="bg-gradient-to-br from-[#da2128] to-[#ff3842] rounded-2xl p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="text-white/80 text-sm mb-1">Buổi tập sắp tới</p>
                                                    <h3 className="text-2xl font-bold">
                                                        {dashboardData.lichSapToi[0].tenBuoiTap}
                                                    </h3>
                                                </div>
                                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Calendar className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold backdrop-blur-sm">
                                                        {new Date(dashboardData.lichSapToi[0].ngayTap).getDate()}
                                                    </div>
                                                    <span>{new Date(dashboardData.lichSapToi[0].ngayTap).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{dashboardData.lichSapToi[0].gioBatDau} - {dashboardData.lichSapToi[0].gioKetThuc}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Calendar */}
                                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">
                                            {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center text-gray-400 transition-all">
                                                ‹
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center text-gray-400 transition-all">
                                                ›
                                            </button>
                                        </div>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-2 mb-3">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                            <div key={day} className="text-center text-gray-500 text-xs font-medium py-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 35 }, (_, i) => {
                                            const today = new Date();
                                            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                            const startDay = firstDay.getDay() || 7;
                                            const dayNum = i - startDay + 2;
                                            const isCurrentMonth = dayNum > 0 && dayNum <= new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                                            const isToday = isCurrentMonth && dayNum === today.getDate();

                                            return (
                                                <button
                                                    key={i}
                                                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${isToday
                                                        ? 'bg-[#da2128] text-white shadow-lg shadow-[#da2128]/50'
                                                        : isCurrentMonth
                                                            ? 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]'
                                                            : 'text-gray-600'
                                                        }`}
                                                >
                                                    {isCurrentMonth ? dayNum : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Today's Goal */}
                                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white">Mục tiêu hôm nay</h3>
                                        <button className="w-8 h-8 rounded-lg bg-[#da2128] hover:bg-[#ff3842] flex items-center justify-center text-white transition-all">
                                            +
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="text-2xl">💪</div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium mb-1">Hoàn thành {dashboardData?.buoiTapHomNay || 0} buổi tập</p>
                                                    <p className="text-gray-500 text-xs">
                                                        {dashboardData?.buoiTapHomNay || 0} / {dashboardData?.buoiTapTuanNay || 0} buổi tuần này
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="text-2xl">📊</div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium mb-1">Kiểm tra tiến độ học viên</p>
                                                    <p className="text-gray-500 text-xs">{statistics?.tongHoiVien || 0} học viên đang hoạt động</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="text-2xl">⭐</div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium mb-1">Duy trì đánh giá cao</p>
                                                    <p className="text-gray-500 text-xs">Rating hiện tại: {statistics?.ratingTrungBinh || 0}/5</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* Appointments - Lịch hẹn */}
                                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white">Lịch buổi tập</h3>
                                        <button className="w-8 h-8 rounded-lg bg-[#da2128] hover:bg-[#ff3842] flex items-center justify-center text-white transition-all">
                                            +
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {dashboardData?.lichSapToi && dashboardData.lichSapToi.slice(0, 4).map((session, index) => {
                                            const sessionDate = new Date(session.ngayTap);
                                            const colors = ['bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-green-500'];

                                            return (
                                                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all">
                                                    <div className={`w-10 h-10 rounded-lg ${colors[index % colors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                        {sessionDate.getDate()}<br />
                                                        <span className="text-xs opacity-80">{sessionDate.toLocaleDateString('vi-VN', { month: 'short' })}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium text-sm truncate">{session.tenBuoiTap}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{session.gioBatDau} - {session.gioKetThuc}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Chat với hội viên */}
                                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white">Tin nhắn từ học viên</h3>
                                        <button className="w-8 h-8 rounded-lg bg-[#da2128] hover:bg-[#ff3842] flex items-center justify-center text-white transition-all">
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {chatRooms && chatRooms.length > 0 ? (
                                            chatRooms.map((room, index) => {
                                                // Tính thời gian tương đối
                                                let timeAgo = '';
                                                if (room.lastMessageAt) {
                                                    const now = new Date();
                                                    const messageDate = new Date(room.lastMessageAt);
                                                    const diffMs = now - messageDate;
                                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                    const diffWeeks = Math.floor(diffDays / 7);
                                                    
                                                    if (diffDays === 0) {
                                                        // Hôm nay - chỉ hiện giờ
                                                        timeAgo = messageDate.toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        });
                                                    } else if (diffDays >= 1 && diffDays <= 6) {
                                                        // 1-6 ngày
                                                        timeAgo = `${diffDays} ngày`;
                                                    } else if (diffWeeks >= 1 && diffWeeks < 4) {
                                                        // 1-3 tuần
                                                        timeAgo = `${diffWeeks} tuần`;
                                                    } else if (diffDays >= 28) {
                                                        // Quá 1 tháng - hiện ngày tháng
                                                        timeAgo = messageDate.toLocaleDateString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit'
                                                        });
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={room._id || index}
                                                        onClick={() => handleOpenChat(room)}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all cursor-pointer"
                                                    >
                                                        {/* Avatar */}
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                                                            {room.hoiVien?.anhDaiDien ? (
                                                                <img 
                                                                    src={room.hoiVien.anhDaiDien} 
                                                                    alt={room.hoiVien.hoTen} 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-[#da2128] to-[#ff3842] flex items-center justify-center">
                                                                    {room.hoiVien?.hoTen ? room.hoiVien.hoTen.charAt(0).toUpperCase() : 'U'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm truncate ${room.unreadCount > 0 ? 'text-white font-bold' : 'text-white font-medium'}`}>
                                                                {room.hoiVien?.hoTen || 'Học viên'}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs mt-1">
                                                                <MessageCircle className="w-3 h-3 text-gray-500" />
                                                                <span className={`truncate ${room.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-500'}`}>
                                                                    {room.lastMessage || 'Chưa có tin nhắn'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {room.unreadCount > 0 && (
                                                            <div className="w-5 h-5 rounded-full bg-[#da2128] flex items-center justify-center text-white text-xs font-bold">
                                                                {room.unreadCount}
                                                            </div>
                                                        )}
                                                        {timeAgo && (
                                                            <span className={`text-xs flex-shrink-0 ${room.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-600'}`}>
                                                                {timeAgo}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8">
                                                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">Chưa có tin nhắn nào</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* To-do List - Công việc cần làm */}
                                <div className="bg-[#fffbeb] rounded-2xl p-6 border border-[#fef3c7]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Việc cần làm</h3>
                                        <button className="text-sm text-[#da2128] font-medium hover:underline">
                                            + Thêm mới
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 transition-all cursor-pointer group">
                                            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-[#da2128] focus:ring-[#da2128]" />
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-sm group-hover:text-[#da2128]">Chuẩn bị buổi tập sáng</p>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 transition-all cursor-pointer group">
                                            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-[#da2128] focus:ring-[#da2128]" />
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-sm group-hover:text-[#da2128]">Kiểm tra thiết bị</p>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 transition-all cursor-pointer group">
                                            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-[#da2128] focus:ring-[#da2128]" />
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium text-sm group-hover:text-[#da2128]">Gọi điện cho học viên mới</p>
                                            </div>
                                        </label>
                                    </div>
                                    <button className="w-full mt-3 text-sm text-[#da2128] font-medium hover:underline text-left">
                                        Xem thêm →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Chat Window */}
            {showChat && selectedChatRoom && selectedStudent && (
                <ChatWindowPopup
                    roomId={selectedChatRoom._id}
                    recipient={selectedStudent}
                    onClose={handleCloseChat}
                />
            )}
        </div>
    );
};

export default PTDashboard;

