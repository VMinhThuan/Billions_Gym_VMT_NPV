import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';
import { api } from '../services/api';

const NotificationIcon = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const user = authUtils.getUser();

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user?._id) return;

        try {
            setLoading(true);
            const response = await api.get(`/notifications/user/${user._id}?limit=10`);
            if (response.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        if (!user?._id) return;

        try {
            // Sử dụng test API để debug
            const response = await api.get(`/notifications/test-unread/${user._id}`);
            if (response.success) {
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/mark-read/${notificationId}`, { userId: user._id });
            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, daDoc: true, thoiGianDoc: new Date() }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read', { userId: user._id });
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, daDoc: true, thoiGianDoc: new Date() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Format time
    const formatTime = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Check and create schedule registration notification
    const checkAndCreateScheduleNotification = async () => {
        if (!user?._id) return;

        try {
            // Gọi API check-registration-eligibility để tự động tạo notification nếu đủ điều kiện
            await api.get('/lichtap/check-registration-eligibility');
            // Sau khi check, refresh notifications
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            // Không log error vì có thể user chưa có gói tập hoặc chưa đúng thời gian
            console.log('Schedule registration check:', error.response?.data?.message || 'Not eligible');
        }
    };

    // Fetch data on mount and when user changes
    useEffect(() => {
        if (user?._id) {
            fetchNotifications();
            fetchUnreadCount();
            // Check và tạo notification đăng ký lịch tập nếu đủ điều kiện
            checkAndCreateScheduleNotification();
        }
    }, [user?._id]);

    // Listen for notification refresh events
    useEffect(() => {
        const handleRefreshNotifications = () => {
            if (user?._id) {
                fetchNotifications();
                fetchUnreadCount();
            }
        };

        window.addEventListener('refreshNotifications', handleRefreshNotifications);

        return () => {
            window.removeEventListener('refreshNotifications', handleRefreshNotifications);
        };
    }, [user?._id]);

    // Auto refresh unread count and check schedule registration every 30 seconds
    useEffect(() => {
        if (!user?._id) return;

        const interval = setInterval(() => {
            fetchUnreadCount();
            // Kiểm tra và tạo notification đăng ký lịch tập mỗi 30 giây
            checkAndCreateScheduleNotification();
        }, 30000);
        return () => clearInterval(interval);
    }, [user?._id]);

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative cursor-pointer p-2 text-white hover:text-gray-300 active:text-gray-300 focus:outline-none transition-colors"
                aria-label="Notifications"
            >
                <svg
                    version="1.1"
                    id="_x32_"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 512 512"
                    xmlSpace="preserve"
                    fill="currentColor"
                    className='w-5 h-5'
                >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <style type="text/css">
                            {`.st0{fill:currentColor;}`}
                        </style>
                        <g>
                            <path
                                className="st0"
                                d="M193.499,459.298c5.237,30.54,31.518,52.702,62.49,52.702c30.98,0,57.269-22.162,62.506-52.702l0.32-1.86 H193.179L193.499,459.298z"
                            />
                            <path
                                className="st0"
                                d="M469.782,371.98c-5.126-5.128-10.349-9.464-15.402-13.661c-21.252-17.648-39.608-32.888-39.608-96.168v-50.194 c0-73.808-51.858-138.572-123.61-154.81c2.876-5.64,4.334-11.568,4.334-17.655C295.496,17.718,277.777,0,255.995,0 c-21.776,0-39.492,17.718-39.492,39.492c0,6.091,1.456,12.018,4.334,17.655c-71.755,16.238-123.61,81.002-123.61,154.81v50.194 c0,63.28-18.356,78.521-39.608,96.168c-5.052,4.196-10.276,8.533-15.402,13.661l-0.466,0.466v49.798h428.496v-49.798 L469.782,371.98z"
                            />
                        </g>
                    </g>
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#da2128] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-[#da2128] hover:text-[#b91c1c] font-medium"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#da2128] mx-auto"></div>
                                <p className="mt-2">Đang tải...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <svg
                                    version="1.1"
                                    id="_x32_"
                                    xmlns="http://www.w3.org/2000/svg"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    viewBox="0 0 512 512"
                                    xmlSpace="preserve"
                                    fill="currentColor"
                                    className='w-5 h-5 mb-2 mx-auto opacity-50 text-gray-400'
                                >
                                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <style type="text/css">
                                            {`.st0{fill:currentColor;}`}
                                        </style>
                                        <g>
                                            <path
                                                className="st0"
                                                d="M193.499,459.298c5.237,30.54,31.518,52.702,62.49,52.702c30.98,0,57.269-22.162,62.506-52.702l0.32-1.86 H193.179L193.499,459.298z"
                                            />
                                            <path
                                                className="st0"
                                                d="M469.782,371.98c-5.126-5.128-10.349-9.464-15.402-13.661c-21.252-17.648-39.608-32.888-39.608-96.168v-50.194 c0-73.808-51.858-138.572-123.61-154.81c2.876-5.64,4.334-11.568,4.334-17.655C295.496,17.718,277.777,0,255.995,0 c-21.776,0-39.492,17.718-39.492,39.492c0,6.091,1.456,12.018,4.334,17.655c-71.755,16.238-123.61,81.002-123.61,154.81v50.194 c0,63.28-18.356,78.521-39.608,96.168c-5.052,4.196-10.276,8.533-15.402,13.661l-0.466,0.466v49.798h428.496v-49.798 L469.782,371.98z"
                                            />
                                        </g>
                                    </g>
                                </svg>
                                <p>Chưa có thông báo nào</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.daDoc ? 'bg-blue-50 border-l-4 border-l-[#da2128]' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notification.daDoc) {
                                                markAsRead(notification._id);
                                            }
                                            // Nếu là thông báo workflow, navigate đến trang workflow
                                            if (notification.loaiThongBao === 'WORKFLOW' && notification.duLieuLienQuan?.actionUrl) {
                                                navigate(notification.duLieuLienQuan.actionUrl);
                                                setIsOpen(false);
                                            }
                                            // Nếu là thông báo đăng ký lịch tập, navigate đến trang schedule
                                            else if (notification.loaiThongBao === 'WORKOUT_REMINDER' && notification.duLieuLienQuan?.actionUrl) {
                                                navigate(notification.duLieuLienQuan.actionUrl);
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${!notification.daDoc ? 'bg-[#da2128]' : 'bg-gray-300'
                                                }`}></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                    {notification.tieuDe}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                                    {notification.noiDung}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatTime(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-100 text-center">
                            <button className="text-sm text-[#da2128] hover:text-[#b91c1c] font-medium whitespace-nowrap w-full">
                                Xem tất cả thông báo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationIcon;
