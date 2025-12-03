import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from '../../utils/auth';

const PTSidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Trang chủ',
            icon: 'home',
            path: '/pt/dashboard',
            description: 'Tổng quan lịch làm việc'
        },
        {
            id: 'profile',
            label: 'Hồ sơ cá nhân',
            icon: 'user',
            path: '/pt/profile',
            description: 'Thông tin cá nhân PT'
        },
        {
            id: 'statistics',
            label: 'Thống kê',
            icon: 'bar-chart',
            path: '/pt/statistics',
            description: 'Thống kê và báo cáo'
        },
        {
            id: 'work-schedule',
            label: 'Lịch cá nhân',
            icon: 'calendar',
            path: '/pt/work-schedule',
            description: 'Quản lý lịch làm việc'
        },
        {
            id: 'schedule',
            label: 'Lịch buổi tập',
            icon: 'calendar-check',
            path: '/pt/schedule',
            description: 'Xem lịch các buổi tập'
        },
        {
            id: 'students',
            label: 'Học viên của tôi',
            icon: 'users',
            path: '/pt/students',
            description: 'Danh sách học viên'
        },
        {
            id: 'sessions',
            label: 'Buổi tập',
            icon: 'activity',
            path: '/pt/sessions',
            description: 'Quản lý buổi tập'
        },
        {
            id: 'work-history',
            label: 'Lịch sử',
            icon: 'clock',
            path: '/pt/work-history',
            description: 'Lịch sử làm việc'
        },
        {
            id: 'templates',
            label: 'Template',
            icon: 'file-text',
            path: '/pt/templates',
            description: 'Quản lý template buổi tập'
        },
        {
            id: 'assign-exercises',
            label: 'Gán bài tập',
            icon: 'barbell',
            path: '/pt/assign-exercises',
            description: 'Gán bài tập cho học viên'
        },
        {
            id: 'reviews',
            label: 'Đánh giá',
            icon: 'star',
            path: '/pt/reviews',
            description: 'Đánh giá từ học viên'
        },
        {
            id: 'chat',
            label: 'Tin nhắn',
            icon: 'message',
            path: '/pt/chat',
            description: 'Chat với học viên'
        }
    ];

    const getIcon = (iconName) => {
        const icons = {
            home: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            user: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            'bar-chart': (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            calendar: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            'calendar-check': (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            users: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            activity: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            clock: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            'file-text': (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            barbell: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            star: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            message: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            )
        };
        return icons[iconName] || icons.home;
    };

    const handleNavigate = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const user = authUtils.getUser();

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed top-16 pt-4 left-0 h-[calc(100vh-4rem)] ${collapsed ? 'w-20' : 'w-80'} bg-[#1a1a1a] border-r border-[#2a2a2a] transition-[width] duration-300 ease-in-out z-50 ${collapsed ? 'overflow-hidden' : 'overflow-y-auto'} sidebar-scroll ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <nav className="flex-1">
                    <div className="p-4">
                        {menuItems.map((item) => (
                            <div key={item.id} className="relative mb-2">
                                <button
                                    onClick={() => handleNavigate(item.path)}
                                    title={item.label}
                                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 ${collapsed ? 'text-center' : 'text-left'} text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-all duration-200 group ${isActive(item.path)
                                        ? 'bg-[#303030] border-l-4 border-[#da2128] text-white cursor-pointer'
                                        : 'bg-transparent border-l-4 border-transparent cursor-pointer'
                                        }`}
                                >
                                    <div className={`text-white group-hover:text-[#da2128] transition-colors ${isActive(item.path) ? 'text-[#da2128]' : ''
                                        }`}>
                                        {getIcon(item.icon)}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium text-inherit group-hover:text-[#da2128] ${collapsed ? 'hidden' : ''}`}>{item.label}</div>
                                        <div className={`text-xs text-gray-400 group-hover:text-gray-400 ${collapsed ? 'hidden' : ''}`}>
                                            {item.description}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </nav>
            </div>

            <button
                onClick={() => {
                    const next = !collapsed;
                    setCollapsed(next);
                    try {
                        window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { collapsed: next } }));
                    } catch (e) { }
                }}
                title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                className="hidden lg:flex fixed items-center justify-center w-12 h-12 text-white text-opacity-50 hover:text-opacity-100 hover:scale-110 transition-all duration-300 ease-out z-[200] cursor-pointer"
                style={{ left: collapsed ? '3.5rem' : '19rem', top: '5rem' }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                >
                    <path d="M8.70710678,12 L19.5,12 C19.7761424,12 20,12.2238576 20,12.5 C20,12.7761424 19.7761424,13 19.5,13 L8.70710678,13 L11.8535534,16.1464466 C12.0488155,16.3417088 12.0488155,16.6582912 11.8535534,16.8535534 C11.6582912,17.0488155 11.3417088,17.0488155 11.1464466,16.8535534 L7.14644661,12.8535534 C6.95118446,12.6582912 6.95118446,12.3417088 7.14644661,12.1464466 L11.1464466,8.14644661 C11.3417088,7.95118446 11.6582912,7.95118446 11.8535534,8.14644661 C12.0488155,8.34170876 12.0488155,8.65829124 11.8535534,8.85355339 L8.70710678,12 L8.70710678,12 Z M4,5.5 C4,5.22385763 4.22385763,5 4.5,5 C4.77614237,5 5,5.22385763 5,5.5 L5,19.5 C5,19.7761424 4.77614237,20 4.5,20 C4.22385763,20 4,19.7761424 4,19.5 L4,5.5 Z" fill="currentColor" />
                </svg>
            </button>
        </>
    );
};

export default PTSidebar;

