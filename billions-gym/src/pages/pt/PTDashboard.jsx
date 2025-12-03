import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import PTStatsCard from '../../components/pt/PTStatsCard';
import PTSessionChart from '../../components/pt/PTSessionChart';
import PTStudentChart from '../../components/pt/PTStudentChart';
import ChatWindowPopup from '../../components/chat/ChatWindowPopup';
import { Users, Calendar, Clock, TrendingUp, Star, Award, CheckCircle, MessageCircle, MoreHorizontal, Trash2, Target, DollarSign, BarChart3, Activity, UserCheck, Flame, TrendingDown } from 'lucide-react';
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
    const [menuOpenRoomId, setMenuOpenRoomId] = useState(null);
    const [showAllChats, setShowAllChats] = useState(false);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Tab navigation state
    const [activeTab, setActiveTab] = useState('overview'); // overview, students, revenue, analytics

    // Students data
    const [studentsData, setStudentsData] = useState([]);

    // Revenue data
    const [revenueData, setRevenueData] = useState(null);

    // Analytics data  
    const [analyticsData, setAnalyticsData] = useState(null);

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
        if (!chatService.isConnected) {
            chatService.connect();
        }

        // Lắng nghe tin nhắn mới
        const handleNewMessage = (message) => {
            console.log('[PTDashboard] New message received:', message);
            console.log('[PTDashboard] Message room:', message.room);

            const currentUser = authUtils.getUser();
            console.log('[PTDashboard] Current user ID:', currentUser?._id);
            console.log('[PTDashboard] Message sender ID:', message.sender?._id || message.sender);

            // Cập nhật chatRooms state trực tiếp
            setChatRooms(prevRooms => {
                console.log('[PTDashboard] Current chatRooms in state:', prevRooms.map(r => ({ id: r._id, hoiVien: r.hoiVien?.hoTen })));

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
        };
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadDashboard(),
                loadStatistics(),
                loadStudentStats(),
                loadChatRooms(),
                loadStudentsData(),
                loadRevenueData(),
                loadAnalyticsData()
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

    // Load Students Progress Data
    const loadStudentsData = async () => {
        try {
            // TODO: Replace with real API call: await ptService.getMyStudents()
            // Mock data for now
            const mockStudents = [
                {
                    _id: '1',
                    hoTen: 'Nguyễn Văn An',
                    avatar: null,
                    mucTieu: 'Giảm cân',
                    tienDo: 75,
                    canNangHienTai: 68,
                    canNangMucTieu: 60,
                    bmi: 22.5,
                    soBuoiDaTap: 24,
                    tongSoBuoi: 32,
                    goiTap: 'Premium PT',
                    ngayBatDau: '2025-11-01',
                    lastWorkout: '2025-12-02'
                },
                {
                    _id: '2',
                    hoTen: 'Trần Thị Bích',
                    avatar: null,
                    mucTieu: 'Tăng cơ',
                    tienDo: 60,
                    canNangHienTai: 52,
                    canNangMucTieu: 58,
                    bmi: 19.8,
                    soBuoiDaTap: 18,
                    tongSoBuoi: 30,
                    goiTap: 'Standard PT',
                    ngayBatDau: '2025-11-15',
                    lastWorkout: '2025-12-01'
                },
                {
                    _id: '3',
                    hoTen: 'Lê Minh Tuấn',
                    avatar: null,
                    mucTieu: 'Tăng sức bền',
                    tienDo: 40,
                    canNangHienTai: 75,
                    canNangMucTieu: 75,
                    bmi: 24.2,
                    soBuoiDaTap: 12,
                    tongSoBuoi: 30,
                    goiTap: 'Premium PT',
                    ngayBatDau: '2025-11-20',
                    lastWorkout: '2025-11-30'
                },
                {
                    _id: '4',
                    hoTen: 'Phạm Thu Hà',
                    avatar: null,
                    mucTieu: 'Giảm mỡ bụng',
                    tienDo: 85,
                    canNangHienTai: 58,
                    canNangMucTieu: 55,
                    bmi: 21.3,
                    soBuoiDaTap: 27,
                    tongSoBuoi: 32,
                    goiTap: 'Premium PT',
                    ngayBatDau: '2025-10-25',
                    lastWorkout: '2025-12-03'
                },
                {
                    _id: '5',
                    hoTen: 'Hoàng Đức Minh',
                    avatar: null,
                    mucTieu: 'Tăng cơ',
                    tienDo: 55,
                    canNangHienTai: 65,
                    canNangMucTieu: 72,
                    bmi: 21.5,
                    soBuoiDaTap: 16,
                    tongSoBuoi: 30,
                    goiTap: 'Standard PT',
                    ngayBatDau: '2025-11-10',
                    lastWorkout: '2025-12-02'
                }
            ];
            setStudentsData(mockStudents);
        } catch (error) {
            console.error('Error loading students data:', error);
        }
    };

    // Load Revenue Data
    const loadRevenueData = async () => {
        try {
            // TODO: Replace with real API call
            // Mock data for now
            const mockRevenue = {
                thangHienTai: {
                    tongDoanhThu: 45000000,
                    soLuongBuoi: 32,
                    hoaHong: 13500000, // 30%
                    tyLeHoaHong: 30
                },
                chiTietThang: [
                    { thang: 'T7', doanhThu: 38000000, buoi: 28 },
                    { thang: 'T8', doanhThu: 42000000, buoi: 30 },
                    { thang: 'T9', doanhThu: 40000000, buoi: 29 },
                    { thang: 'T10', doanhThu: 43000000, buoi: 31 },
                    { thang: 'T11', doanhThu: 44000000, buoi: 32 },
                    { thang: 'T12', doanhThu: 45000000, buoi: 32 }
                ],
                phanLoaiGoiTap: [
                    { ten: 'Premium PT', soLuong: 18, doanhThu: 27000000 },
                    { ten: 'Standard PT', soLuong: 10, doanhThu: 12000000 },
                    { ten: 'Trial PT', soLuong: 4, doanhThu: 6000000 }
                ],
                xuHuong: '+12.5%', // So với tháng trước
                topKhachHang: [
                    { hoTen: 'Nguyễn Văn An', soTien: 5000000, soBuoi: 8 },
                    { hoTen: 'Phạm Thu Hà', soTien: 4500000, soBuoi: 8 },
                    { hoTen: 'Lê Minh Tuấn', soTien: 4000000, soBuoi: 6 }
                ]
            };
            setRevenueData(mockRevenue);
        } catch (error) {
            console.error('Error loading revenue data:', error);
        }
    };

    // Load Analytics Data
    const loadAnalyticsData = async () => {
        try {
            // TODO: Replace with real API call
            // Mock data for now
            const mockAnalytics = {
                heatmapData: generateHeatmapData(),
                topVIPClients: [
                    { hoTen: 'Nguyễn Văn An', soBuoi: 24, tongTien: 15000000, rank: 'Platinum' },
                    { hoTen: 'Phạm Thu Hà', soBuoi: 27, tongTien: 18000000, rank: 'Diamond' },
                    { hoTen: 'Trần Thị Bích', soBuoi: 18, tongTien: 12000000, rank: 'Gold' },
                    { hoTen: 'Hoàng Đức Minh', soBuoi: 16, tongTien: 10000000, rank: 'Gold' },
                    { hoTen: 'Lê Minh Tuấn', soBuoi: 12, tongTien: 8000000, rank: 'Silver' }
                ],
                npsScore: 78, // Net Promoter Score
                ratingBreakdown: {
                    5: 45,
                    4: 28,
                    3: 15,
                    2: 8,
                    1: 4
                },
                recentFeedback: [
                    { hoTen: 'Nguyễn Văn An', rating: 5, comment: 'PT rất nhiệt tình, chế độ tập hiệu quả!', ngay: '2025-12-02' },
                    { hoTen: 'Phạm Thu Hà', rating: 5, comment: 'Đã giảm được 3kg trong 1 tháng, cảm ơn PT!', ngay: '2025-12-01' },
                    { hoTen: 'Trần Thị Bích', rating: 4, comment: 'Tốt, nhưng hy vọng có thêm bài tập mới', ngay: '2025-11-30' }
                ],
                xuHuongHocVien: [
                    { tuan: 'T1', soLuong: 28 },
                    { tuan: 'T2', soLuong: 30 },
                    { tuan: 'T3', soLuong: 29 },
                    { tuan: 'T4', soLuong: 32 }
                ],
                performanceMetrics: {
                    tyLeGiuChan: 92, // % retention rate
                    tyLeHoanThanh: 87, // % session completion
                    danhGiaTrungBinh: 4.6
                }
            };
            setAnalyticsData(mockAnalytics);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    };

    // Generate heatmap data for calendar
    const generateHeatmapData = () => {
        const data = {};
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            data[dateStr] = Math.floor(Math.random() * 8); // 0-7 sessions per day
        }
        return data;
    };

    // Calendar navigation handlers
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleYearSelect = (year) => {
        setCurrentYear(year);
        setShowYearPicker(false);
    };

    const handleDateSelect = (day, month, year) => {
        const newDate = new Date(year, month, day);
        setSelectedDate(newDate);
    };

    // Check if a date has any sessions
    const hasSessionOnDate = (day, month, year) => {
        // Mock data cho demo (có thể xóa khi có data thật từ API)
        const mockSessions = [
            { ngayTap: new Date(2025, 11, 3) }, // 3/12/2025
            { ngayTap: new Date(2025, 11, 6) }, // 6/12/2025
            { ngayTap: new Date(2025, 11, 9) }, // 9/12/2025
            { ngayTap: new Date(2025, 11, 17) }, // 17/12/2025
            { ngayTap: new Date(2025, 11, 19) }, // 19/12/2025
        ];

        // Kết hợp data thật và mock data
        const allSessions = [...(dashboardData?.lichSapToi || []), ...mockSessions];

        return allSessions.some(session => {
            const sessionDate = new Date(session.ngayTap);
            return sessionDate.getDate() === day &&
                sessionDate.getMonth() === month &&
                sessionDate.getFullYear() === year;
        });
    };

    const handleDeleteChatRoom = async (roomId, e) => {
        e.stopPropagation();

        if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat này? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            await chatService.deleteChatRoom(roomId);

            // Cập nhật danh sách chatRooms
            setChatRooms(prevRooms => prevRooms.filter(room => room._id !== roomId));

            // Đóng chat window nếu đang mở room này
            if (selectedChatRoom?._id === roomId) {
                setShowChat(false);
                setSelectedChatRoom(null);
                setSelectedStudent(null);
            }

            setMenuOpenRoomId(null);
        } catch (error) {
            console.error('Error deleting chat room:', error);
            alert('Có lỗi xảy ra khi xóa cuộc trò chuyện. Vui lòng thử lại.');
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-[1400px] mx-auto">
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#141414] p-6 mb-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm mb-1">{getGreeting()}</p>
                                <h1 className="text-3xl font-bold text-white">Chào mừng trở lại!</h1>
                            </div>
                            {/* <div className="flex items-center gap-6"> */}
                            {/* Today's Sessions Card */}
                            {/* <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg viewBox="0 0 1024 1024" className="w-6 h-6" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M973.3 98.4L99.6 972.1c-11.7 11.7-30.9 11.7-42.6 0l-4.3-4.3C41 956 41 936.9 52.7 925.2L926.4 51.5c11.7-11.7 30.9-11.7 42.6 0l4.3 4.3c11.7 11.8 11.7 30.9 0 42.6z" fill="#B6CDEF"></path><path d="M78.3 996.1c-12.7 0-25.4-4.8-35.1-14.5-19.4-19.4-19.4-50.9 0-70.2L912.5 42c19.4-19.4 50.9-19.4 70.2 0 9.4 9.4 14.5 21.8 14.5 35.1s-5.2 25.8-14.5 35.1L113.5 981.6c-9.7 9.7-22.4 14.5-35.2 14.5zM947.7 60.5c-4.3 0-8.5 1.6-11.8 4.9L66.6 934.7c-6.5 6.5-6.5 17 0 23.5s17 6.5 23.5 0L959.4 88.9c3.1-3.1 4.8-7.3 4.8-11.8 0-4.5-1.7-8.6-4.8-11.8-3.2-3.2-7.5-4.8-11.7-4.8z" fill="#0F53A8"></path><path d="M408.6 901.7l-53.9 53.9c-8.7 8.7-22.7 8.7-31.3 0L69.2 701.4c-8.7-8.7-8.7-22.7 0-31.3l53.9-53.9c8.7-8.7 22.7-8.7 31.3 0l254.2 254.2c8.7 8.6 8.7 22.7 0 31.3z" fill="#89B7F5"></path><path d="M339 977.7c-10.5 0-21-4-28.9-12l-251-251c-7.7-7.7-12-18-12-28.9 0-10.9 4.3-21.2 12-28.9l50.7-50.7c16-16 41.9-16 57.9 0l251 251c16 16 16 41.9 0 57.9L368 965.7c-8 8-18.5 12-29 12zM138.8 627.2c-2 0-4 0.8-5.6 2.3l-50.7 50.7c-2 2-2.3 4.4-2.3 5.6 0 1.2 0.3 3.6 2.3 5.6l251 251c3.1 3.1 8.1 3.1 11.1 0l50.7-50.7c3.1-3.1 3.1-8.1 0-11.1l-251-251c-1.5-1.7-3.5-2.4-5.5-2.4z" fill="#0F53A8"></path><path d="M276.4 940l-34.1 34.1c-8.7 8.7-22.7 8.7-31.3 0L50.7 813.8c-8.7-8.7-8.7-22.7 0-31.3l34.1-34.1c8.7-8.7 22.7-8.7 31.3 0l160.3 160.3c8.7 8.6 8.7 22.6 0 31.3z" fill="#89B7F5"></path><path d="M226.7 996.2c-10.9 0-21.2-4.3-28.9-12L40.6 827.1c-16-16-16-41.9 0-57.9l30.9-30.9c16-16 41.9-16 57.9 0l157.1 157.1c7.7 7.7 12 18 12 28.9 0 10.9-4.3 21.2-12 28.9l-30.9 30.9c-7.7 7.8-18 12.1-28.9 12.1zM100.5 759.3c-2 0-4 0.8-5.6 2.3l-30.9 31c-3.1 3.1-3.1 8.1 0 11.1l157.1 157.1c3.1 3.1 8.1 3.1 11.1 0l30.9-30.9c2-2 2.3-4.4 2.3-5.6 0-1.2-0.3-3.6-2.3-5.6L106 761.6c-1.5-1.5-3.5-2.3-5.5-2.3z" fill="#0F53A8"></path><path d="M902.9 407.4l53.9-53.9c8.7-8.7 8.7-22.7 0-31.3L702.6 68c-8.7-8.7-22.7-8.7-31.3 0l-53.9 53.9c-8.7 8.7-8.7 22.7 0 31.3l254.2 254.2c8.6 8.6 22.7 8.6 31.3 0z" fill="#89B7F5"></path><path d="M887.2 429.5c-10.5 0-21-4-28.9-12l-251-251c-16-16-16-41.9 0-57.9L658 57.9c16-16 41.9-16 57.9 0l251 251c16 16 16 41.9 0 57.9l-50.7 50.7c-8 8-18.5 12-29 12zM687 79c-2 0-4 0.8-5.6 2.3L630.7 132c-3.1 3.1-3.1 8.1 0 11.1l251 251c3.1 3.1 8.1 3.1 11.1 0l50.7-50.7c3.1-3.1 3.1-8.1 0-11.1l-251-251C691 79.7 689 79 687 79z" fill="#0F53A8"></path><path d="M941.2 275.2l34.1-34.1c8.7-8.7 8.7-22.7 0-31.3L815 49.5c-8.7-8.7-22.7-8.7-31.3 0l-34.1 34.1c-8.7 8.7-8.7 22.7 0 31.3l160.3 160.3c8.6 8.7 22.6 8.7 31.3 0z" fill="#89B7F5"></path><path d="M925.5 297.3c-10.9 0-21.2-4.3-28.9-12L739.5 128.2c-16-16-16-41.9 0-57.9l30.9-30.9c16-16 41.9-16 57.9 0l157.1 157.1c7.7 7.7 12 18 12 28.9 0 10.9-4.3 21.2-12 28.9l-30.9 30.9c-7.8 7.8-18 12.1-29 12.1zM799.3 60.5c-2 0-4 0.8-5.6 2.3l-30.9 30.9c-3.1 3.1-3.1 8.1 0 11.1L920 262c3.1 3.1 8.1 3.1 11.1 0l30.9-31c3.1-3.1 3.1-8.1 0-11.1L804.9 62.8c-1.5-1.6-3.5-2.3-5.6-2.3z" fill="#0F53A8"></path></g></svg>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-1">Bạn có tổng cộng</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-3xl font-bold text-white">{dashboardData?.buoiTapHomNay || 0}</span>
                                        <span className="text-gray-400 text-xs">buổi tập hôm nay.</span>
                                    </div>
                                </div> */}
                            {/* </div> */}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-[#141414] rounded-2xl p-2 mb-6 border border-[#2a2a2a]">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'overview'
                                    ? 'bg-[#da2128] text-white shadow-lg shadow-[#da2128]/30'
                                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span>Tổng quan</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'students'
                                    ? 'bg-[#da2128] text-white shadow-lg shadow-[#da2128]/30'
                                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                <Target className="w-4 h-4" />
                                <span>Khách hàng</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{studentsData.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('revenue')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'revenue'
                                    ? 'bg-[#da2128] text-white shadow-lg shadow-[#da2128]/30'
                                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4" />
                                <span>Doanh thu</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'analytics'
                                    ? 'bg-[#da2128] text-white shadow-lg shadow-[#da2128]/30'
                                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                <Activity className="w-4 h-4" />
                                <span>Phân tích</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
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
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a] relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-bold text-white cursor-pointer hover:text-[#da2128] transition-colors" onClick={() => setShowYearPicker(!showYearPicker)}>
                                                    {new Date(currentYear, currentMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={handlePrevMonth} className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] cursor-pointer flex items-center justify-center text-gray-200 transition-all">
                                                        ‹
                                                    </button>
                                                    <button onClick={handleNextMonth} className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] cursor-pointer flex items-center justify-center text-gray-200 transition-all">
                                                        ›
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Year Picker */}
                                            {showYearPicker && (
                                                <div className="absolute top-16 left-6 right-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50 p-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#da2128] scrollbar-track-[#141414]">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {Array.from({ length: 201 }, (_, i) => {
                                                            const year = 1900 + i;
                                                            return (
                                                                <button
                                                                    key={year}
                                                                    onClick={() => handleYearSelect(year)}
                                                                    className={`py-2 px-4 rounded-lg font-medium transition-all ${year === currentYear
                                                                        ? 'bg-[#da2128] text-white'
                                                                        : 'bg-[#141414] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                                                                        }`}
                                                                >
                                                                    {year}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Calendar Grid */}
                                            <div className="grid grid-cols-7 gap-2 mb-3">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                    <div key={day} className="text-center text-gray-200 text-xs font-medium py-2">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-2">
                                                {Array.from({ length: 35 }, (_, i) => {
                                                    const today = new Date();
                                                    const firstDay = new Date(currentYear, currentMonth, 1);
                                                    const startDay = firstDay.getDay() || 7;
                                                    const dayNum = i - startDay + 2;
                                                    const isCurrentMonth = dayNum > 0 && dayNum <= new Date(currentYear, currentMonth + 1, 0).getDate();
                                                    const isToday = isCurrentMonth && dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                                                    const isSelected = isCurrentMonth &&
                                                        dayNum === selectedDate.getDate() &&
                                                        currentMonth === selectedDate.getMonth() &&
                                                        currentYear === selectedDate.getFullYear();
                                                    const hasSession = isCurrentMonth && hasSessionOnDate(dayNum, currentMonth, currentYear);

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => isCurrentMonth && handleDateSelect(dayNum, currentMonth, currentYear)}
                                                            className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative ${isSelected
                                                                ? 'bg-[#da2128] text-white shadow-lg shadow-[#da2128]/50'
                                                                : isCurrentMonth
                                                                    ? 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]'
                                                                    : 'text-gray-600'
                                                                }`}
                                                        >
                                                            {isCurrentMonth ? dayNum : ''}
                                                            {hasSession && (
                                                                <div className="absolute bottom-4 w-1.5 h-1.5 rounded-full bg-[#da2128]"
                                                                    style={{ backgroundColor: isSelected ? '#ffffff' : '#da2128' }}>
                                                                </div>
                                                            )}
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
                                        {/* Lịch làm việc hôm nay */}
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-white">Lịch làm việc hôm nay</h3>
                                                <button className="w-8 h-8 rounded-lg bg-[#da2128] hover:bg-[#ff3842] flex items-center justify-center text-white transition-all">
                                                    <Calendar className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {(() => {
                                                    // Lọc các buổi tập hôm nay từ lichSapToi
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const tomorrow = new Date(today);
                                                    tomorrow.setDate(tomorrow.getDate() + 1);

                                                    const todaySessions = dashboardData?.lichSapToi?.filter(session => {
                                                        const sessionDate = new Date(session.ngayTap);
                                                        return sessionDate >= today && sessionDate < tomorrow;
                                                    }) || [];

                                                    // Nếu không có data thật, dùng mock data
                                                    const sessionsToShow = todaySessions.length > 0 ? todaySessions : [
                                                        {
                                                            _id: 'mock1',
                                                            tenBuoiTap: 'Yoga buổi sáng',
                                                            ngayTap: new Date(),
                                                            gioBatDau: '06:00',
                                                            gioKetThuc: '07:30',
                                                            soLuongHienTai: 8,
                                                            soLuongToiDa: 15,
                                                            chiNhanh: { tenChiNhanh: 'Chi nhánh 1' }
                                                        },
                                                        {
                                                            _id: 'mock2',
                                                            tenBuoiTap: 'Cardio & Strength',
                                                            ngayTap: new Date(),
                                                            gioBatDau: '09:00',
                                                            gioKetThuc: '10:30',
                                                            soLuongHienTai: 12,
                                                            soLuongToiDa: 15,
                                                            chiNhanh: { tenChiNhanh: 'Chi nhánh 1' }
                                                        },
                                                        {
                                                            _id: 'mock3',
                                                            tenBuoiTap: 'HIIT Training',
                                                            ngayTap: new Date(),
                                                            gioBatDau: '17:00',
                                                            gioKetThuc: '18:00',
                                                            soLuongHienTai: 10,
                                                            soLuongToiDa: 12,
                                                            chiNhanh: { tenChiNhanh: 'Chi nhánh 1' }
                                                        },
                                                        {
                                                            _id: 'mock4',
                                                            tenBuoiTap: 'Personal Training',
                                                            ngayTap: new Date(),
                                                            gioBatDau: '19:00',
                                                            gioKetThuc: '20:00',
                                                            soLuongHienTai: 1,
                                                            soLuongToiDa: 1,
                                                            chiNhanh: { tenChiNhanh: 'Chi nhánh 1' }
                                                        }
                                                    ];

                                                    if (sessionsToShow.length === 0) {
                                                        return (
                                                            <div className="text-center py-8">
                                                                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                                                <p className="text-gray-500 text-sm">Không có lịch làm việc hôm nay</p>
                                                            </div>
                                                        );
                                                    }

                                                    return sessionsToShow.map((session, index) => {
                                                        const sessionDate = new Date(session.ngayTap);
                                                        const now = new Date();
                                                        const sessionStartTime = new Date(session.ngayTap);
                                                        const [startHour, startMinute] = session.gioBatDau.split(':');
                                                        sessionStartTime.setHours(parseInt(startHour), parseInt(startMinute));

                                                        const sessionEndTime = new Date(session.ngayTap);
                                                        const [endHour, endMinute] = session.gioKetThuc.split(':');
                                                        sessionEndTime.setHours(parseInt(endHour), parseInt(endMinute));

                                                        // Xác định trạng thái
                                                        let status = 'upcoming'; // sắp diễn ra
                                                        let statusColor = 'bg-blue-500';
                                                        let statusText = 'Sắp diễn ra';

                                                        if (now >= sessionStartTime && now <= sessionEndTime) {
                                                            status = 'ongoing'; // đang diễn ra
                                                            statusColor = 'bg-green-500';
                                                            statusText = 'Đang diễn ra';
                                                        } else if (now > sessionEndTime) {
                                                            status = 'completed'; // đã hoàn thành
                                                            statusColor = 'bg-gray-500';
                                                            statusText = 'Đã hoàn thành';
                                                        }

                                                        return (
                                                            <div key={session._id || index} className="flex items-start gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all cursor-pointer">
                                                                {/* Time indicator */}
                                                                <div className="flex flex-col items-center flex-shrink-0">
                                                                    <div className={`w-12 h-12 rounded-lg ${statusColor} flex flex-col items-center justify-center text-white font-bold text-xs`}>
                                                                        <span className="text-lg">{session.gioBatDau.split(':')[0]}</span>
                                                                        <span className="text-[10px] opacity-80">{session.gioBatDau.split(':')[1]}</span>
                                                                    </div>
                                                                    {index < sessionsToShow.length - 1 && (
                                                                        <div className="w-0.5 h-8 bg-gray-700 my-1"></div>
                                                                    )}
                                                                </div>

                                                                {/* Session info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <p className="text-white font-medium text-sm truncate">{session.tenBuoiTap}</p>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor} text-white font-medium whitespace-nowrap`}>
                                                                            {statusText}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-200 mt-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>{session.gioBatDau} - {session.gioKetThuc}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-xs text-gray-200 mt-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="w-3 h-3" />
                                                                            <span>{session.soLuongHienTai || 0}/{session.soLuongToiDa || 0}</span>
                                                                        </div>
                                                                        {session.chiNhanh?.tenChiNhanh && (
                                                                            <span className="text-[11px]">• {session.chiNhanh.tenChiNhanh}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
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
                                            <div className={`space-y-3 ${showAllChats && chatRooms.length > 5 ? 'max-h-[500px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                                {chatRooms && chatRooms.length > 0 ? (
                                                    chatRooms.slice(0, showAllChats ? 10 : 5).map((room, index) => {
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
                                                                className="group relative flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all cursor-pointer"
                                                                onMouseLeave={() => setMenuOpenRoomId(null)}
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
                                                                        {!room.lastMessage && <MessageCircle className="w-3 h-3 text-gray-500" />}
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

                                                                {/* Three-dot menu button */}
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setMenuOpenRoomId(menuOpenRoomId === room._id ? null : room._id);
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                                                    >
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </button>

                                                                    {/* Delete dropdown menu */}
                                                                    {menuOpenRoomId === room._id && (
                                                                        <div className="absolute right-0 top-8 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl py-1 min-w-[180px]">
                                                                            <button
                                                                                onClick={(e) => handleDeleteChatRoom(room._id, e)}
                                                                                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-[#2a2a2a] flex items-center gap-2 transition-colors whitespace-nowrap"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                                Xóa cuộc trò chuyện
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
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

                                            {/* Nút Xem tất cả */}
                                            {chatRooms && chatRooms.length > 5 && (
                                                <div className="flex justify-center mt-4">
                                                    <button
                                                        onClick={() => setShowAllChats(!showAllChats)}
                                                        className="text-sm text-[#da2128] font-medium hover:underline"
                                                    >
                                                        {showAllChats ? 'Thu gọn' : 'Xem tất cả'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* To-do List - Công việc cần làm */}
                                        {/* <div className="bg-[#fffbeb] rounded-2xl p-6 border border-[#fef3c7]">
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
                                </div> */}
                                    </div>
                                </div>
                            )}

                            {/* Students Tab */}
                            {activeTab === 'students' && (
                                <div className="space-y-6">
                                    <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                        <h2 className="text-2xl font-bold text-white mb-6">Danh sách khách hàng</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {studentsData.map(student => (
                                                <div key={student._id} className="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] hover:border-[#da2128]/50 transition-all cursor-pointer group">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#da2128] to-[#ff3842] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                                            {student.hoTen.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-white font-bold text-lg group-hover:text-[#da2128] transition-colors truncate">{student.hoTen}</h3>
                                                            <p className="text-gray-400 text-sm">{student.goiTap}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.mucTieu === 'Giảm cân' ? 'bg-blue-500/20 text-blue-400' :
                                                                        student.mucTieu === 'Tăng cơ' ? 'bg-green-500/20 text-green-400' :
                                                                            'bg-purple-500/20 text-purple-400'
                                                                    }`}>
                                                                    {student.mucTieu}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-gray-400 text-sm">Tiến độ hoàn thành</span>
                                                            <span className="text-white font-bold text-sm">{student.tienDo}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-[#da2128] to-[#ff3842] rounded-full transition-all duration-500"
                                                                style={{ width: `${student.tienDo}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                                        <div className="bg-[#141414] rounded-lg p-3 text-center">
                                                            <div className="text-gray-400 text-xs mb-1">BMI</div>
                                                            <div className="text-white font-bold">{student.bmi}</div>
                                                        </div>
                                                        <div className="bg-[#141414] rounded-lg p-3 text-center">
                                                            <div className="text-gray-400 text-xs mb-1">Cân nặng</div>
                                                            <div className="text-white font-bold">{student.canNangHienTai}kg</div>
                                                        </div>
                                                        <div className="bg-[#141414] rounded-lg p-3 text-center">
                                                            <div className="text-gray-400 text-xs mb-1">Mục tiêu</div>
                                                            <div className="text-white font-bold">{student.canNangMucTieu}kg</div>
                                                        </div>
                                                    </div>

                                                    {/* Session Info */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                            <Activity className="w-4 h-4" />
                                                            <span>{student.soBuoiDaTap}/{student.tongSoBuoi} buổi</span>
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            {new Date(student.lastWorkout).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Revenue Tab */}
                            {activeTab === 'revenue' && revenueData && (
                                <div className="space-y-6">
                                    {/* Revenue Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-br from-[#da2128] to-[#ff3842] rounded-2xl p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                                    <DollarSign className="w-6 h-6 text-white" />
                                                </div>
                                                <span className="text-white/80 text-sm bg-white/20 px-3 py-1 rounded-full">{revenueData.xuHuong}</span>
                                            </div>
                                            <p className="text-white/80 text-sm mb-1">Doanh thu tháng này</p>
                                            <h3 className="text-3xl font-bold text-white">{(revenueData.thangHienTai.tongDoanhThu / 1000000).toFixed(1)}M</h3>
                                        </div>

                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                                                    <Calendar className="w-6 h-6 text-[#da2128]" />
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-1">Số buổi tập</p>
                                            <h3 className="text-3xl font-bold text-white">{revenueData.thangHienTai.soLuongBuoi}</h3>
                                        </div>

                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                                                    <TrendingUp className="w-6 h-6 text-green-500" />
                                                </div>
                                                <span className="text-gray-400 text-sm">{revenueData.thangHienTai.tyLeHoaHong}%</span>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-1">Hoa hồng</p>
                                            <h3 className="text-3xl font-bold text-white">{(revenueData.thangHienTai.hoaHong / 1000000).toFixed(1)}M</h3>
                                        </div>
                                    </div>

                                    {/* Revenue Chart */}
                                    <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                        <h3 className="text-xl font-bold text-white mb-6">Doanh thu 6 tháng gần nhất</h3>
                                        <div className="space-y-3">
                                            {revenueData.chiTietThang.map((item, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <div className="w-12 text-gray-400 text-sm">{item.thang}</div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-white text-sm">{item.buoi} buổi</span>
                                                            <span className="text-white font-bold">{(item.doanhThu / 1000000).toFixed(1)}M</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-[#da2128] to-[#ff3842] rounded-full"
                                                                style={{ width: `${(item.doanhThu / 45000000) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Package Breakdown & Top Clients */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Package Breakdown */}
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <h3 className="text-xl font-bold text-white mb-6">Phân loại gói tập</h3>
                                            <div className="space-y-4">
                                                {revenueData.phanLoaiGoiTap.map((pkg, index) => (
                                                    <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-white font-medium">{pkg.ten}</span>
                                                            <span className="text-[#da2128] font-bold">{(pkg.doanhThu / 1000000).toFixed(1)}M</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                                            <Users className="w-4 h-4" />
                                                            <span>{pkg.soLuong} khách hàng</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Top Clients */}
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <h3 className="text-xl font-bold text-white mb-6">Top khách hàng VIP</h3>
                                            <div className="space-y-3">
                                                {revenueData.topKhachHang.map((client, index) => (
                                                    <div key={index} className="flex items-center gap-4 bg-[#1a1a1a] rounded-xl p-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#da2128] to-[#ff3842] flex items-center justify-center text-white font-bold">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-white font-medium">{client.hoTen}</div>
                                                            <div className="text-gray-400 text-sm">{client.soBuoi} buổi tập</div>
                                                        </div>
                                                        <div className="text-[#da2128] font-bold">{(client.soTien / 1000000).toFixed(1)}M</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && analyticsData && (
                                <div className="space-y-6">
                                    {/* Performance Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                                    <UserCheck className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-sm">Tỷ lệ giữ chân</p>
                                                    <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.tyLeGiuChan}%</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                                    <CheckCircle className="w-6 h-6 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-sm">Hoàn thành buổi tập</p>
                                                    <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.tyLeHoanThanh}%</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                                                    <Star className="w-6 h-6 text-yellow-500" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-sm">Đánh giá TB</p>
                                                    <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.danhGiaTrungBinh}/5</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* NPS & Rating */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* NPS Score */}
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <h3 className="text-xl font-bold text-white mb-6">Net Promoter Score</h3>
                                            <div className="text-center mb-6">
                                                <div className="inline-block relative">
                                                    <svg className="w-32 h-32 transform -rotate-90">
                                                        <circle cx="64" cy="64" r="56" stroke="#2a2a2a" strokeWidth="12" fill="none" />
                                                        <circle
                                                            cx="64"
                                                            cy="64"
                                                            r="56"
                                                            stroke="#da2128"
                                                            strokeWidth="12"
                                                            fill="none"
                                                            strokeDasharray={`${2 * Math.PI * 56}`}
                                                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - analyticsData.npsScore / 100)}`}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-3xl font-bold text-white">{analyticsData.npsScore}</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 mt-3">Điểm khuyến nghị</p>
                                            </div>
                                        </div>

                                        {/* Rating Breakdown */}
                                        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                            <h3 className="text-xl font-bold text-white mb-6">Phân tích đánh giá</h3>
                                            <div className="space-y-3">
                                                {[5, 4, 3, 2, 1].map(rating => (
                                                    <div key={rating} className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(rating)].map((_, i) => (
                                                                <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                            ))}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#da2128] to-[#ff3842] rounded-full"
                                                                    style={{ width: `${analyticsData.ratingBreakdown[rating]}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-gray-400 text-sm w-12 text-right">{analyticsData.ratingBreakdown[rating]}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top VIP Clients */}
                                    <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                        <h3 className="text-xl font-bold text-white mb-6">Top 5 Khách hàng VIP</h3>
                                        <div className="space-y-3">
                                            {analyticsData.topVIPClients.map((client, index) => (
                                                <div key={index} className="flex items-center gap-4 bg-[#1a1a1a] rounded-xl p-4 hover:bg-[#2a2a2a] transition-all">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                                                    'bg-gradient-to-br from-[#da2128] to-[#ff3842]'
                                                        }`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-white font-medium">{client.hoTen}</div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-gray-400 text-sm">{client.soBuoi} buổi</span>
                                                            <span className="text-gray-400 text-sm">•</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${client.rank === 'Diamond' ? 'bg-blue-500/20 text-blue-400' :
                                                                    client.rank === 'Platinum' ? 'bg-purple-500/20 text-purple-400' :
                                                                        client.rank === 'Gold' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-gray-500/20 text-gray-400'
                                                                }`}>{client.rank}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[#da2128] font-bold">{(client.tongTien / 1000000).toFixed(1)}M</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Feedback */}
                                    <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                                        <h3 className="text-xl font-bold text-white mb-6">Phản hồi gần đây</h3>
                                        <div className="space-y-4">
                                            {analyticsData.recentFeedback.map((feedback, index) => (
                                                <div key={index} className="bg-[#1a1a1a] rounded-xl p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#da2128] to-[#ff3842] flex items-center justify-center text-white text-sm font-bold">
                                                                {feedback.hoTen.charAt(0)}
                                                            </div>
                                                            <span className="text-white font-medium">{feedback.hoTen}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(feedback.rating)].map((_, i) => (
                                                                <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-400 text-sm mb-2">{feedback.comment}</p>
                                                    <p className="text-gray-500 text-xs">{new Date(feedback.ngay).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
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

