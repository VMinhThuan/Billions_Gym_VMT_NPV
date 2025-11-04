import React, { useState, useEffect, useCallback } from 'react';
import { authUtils } from '../utils/auth';
import { api } from '../services/api';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import './Schedule.css';

const Schedule = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const user = authUtils.getUser();
    const userId = authUtils.getUserId();

    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const sessionColors = {
        'Yoga': '#34D399',
        'Cardio': '#3B82F6',
        'Strength': '#EF4444',
        'HIIT': '#F59E0B',
        'Pilates': '#8B5CF6',
        'Boxing': '#FF6B6B',
    }

    useEffect(() => {
        // Update clock every second for real-time countdowns
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Listen to sidebar toggle events
    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };

        window.addEventListener('sidebar:toggle', handleSidebarToggle);

        return () => {
            window.removeEventListener('sidebar:toggle', handleSidebarToggle);
        };
    }, []);

    useEffect(() => {
        if (userId) {
            fetchScheduleData();
        }
    }, [userId, selectedDate]);

    const fetchScheduleData = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/lich-tap/member/${userId}`);

            const responseData = response.data?.success ? response.data.data : response.data;

            if (responseData && Array.isArray(responseData)) {
                const transformedData = transformScheduleData(responseData);
                setScheduleData(transformedData);
            } else {
                console.error('API response error - unexpected format:', response.data);
                setError('Không thể tải lịch tập. Vui lòng thử lại.');
                setScheduleData([]);
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError('Không thể tải lịch tập. Vui lòng thử lại.');
            setScheduleData([]);
        } finally {
            setLoading(false);
        }
    };

    const transformScheduleData = (lichTaps) => {
        const sessions = [];

        lichTaps.forEach(lichTap => {
            if (lichTap.danhSachBuoiTap && Array.isArray(lichTap.danhSachBuoiTap)) {
                lichTap.danhSachBuoiTap.forEach(buoiTap => {
                    sessions.push({
                        _id: buoiTap._id || buoiTap.buoiTap?._id,
                        ngayBatDau: buoiTap.ngayTap,
                        gioBatDau: buoiTap.gioBatDau,
                        gioKetThuc: buoiTap.gioKetThuc,
                        tenBuoiTap: buoiTap.tenBuoiTap || buoiTap.buoiTap?.tenBuoiTap || lichTap.goiTap?.tenGoiTap || 'Buổi tập',
                        goiTap: {
                            tenGoiTap: lichTap.goiTap?.tenGoiTap || buoiTap.buoiTap?.tenBuoiTap || 'Buổi tập'
                        },
                        pt: {
                            hoTen: buoiTap.ptPhuTrach?.hoTen || lichTap.pt?.hoTen || 'Chưa phân công'
                        },
                        trangThai: buoiTap.trangThai,
                        chiNhanh: lichTap.chiNhanh?.tenChiNhanh || 'Chi nhánh'
                    });
                });
            }
        });

        return sessions;
    };

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameDate = (date1, date2) => {
        return date1.toDateString() === date2.toDateString();
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';

        if (typeof timeString === 'string' && timeString.includes(':')) {
            return timeString;
        }

        try {
            return new Date(timeString).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return timeString;
        }
    };

    const getSessionColor = (sessionType) => {
        const type = sessionType?.toLowerCase() || '';

        for (const [key, color] of Object.entries(sessionColors)) {
            if (type.includes(key.toLowerCase())) {
                return color;
            }
        }

        return '#999999';
    };

    const getCountdown = (session) => {
        try {
            // Combine selected date with session start time for accurate comparison today
            const start = new Date(session.ngayBatDau);
            // If gioBatDau is HH:mm, set hours and minutes
            if (session.gioBatDau && session.gioBatDau.includes(':')) {
                const [h, m] = session.gioBatDau.split(':').map(Number);
                start.setHours(h || 0, m || 0, 0, 0);
            }

            const diffMs = start.getTime() - currentTime.getTime();
            if (diffMs <= 0) return null; // Already started or passed

            const totalSeconds = Math.floor(diffMs / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');

            return `${hours}:${minutes}:${seconds}`;
        } catch {
            return null;
        }
    };

    const renderCalendarDays = () => {
        const days = getDaysInMonth();
        return days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = isSameDate(day, selectedDate);
            const isCurrentDay = isToday(day);

            const hasSessions = scheduleData.some(session => {
                const sessionDate = new Date(session.ngayBatDau);
                return isSameDate(sessionDate, day);
            });

            return (
                <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                        calendar-day
                        ${isCurrentMonth ? 'current-month' : 'other-month'}
                        ${isSelected ? 'selected' : ''}
                        ${isCurrentDay ? 'today' : ''}
                        ${hasSessions ? 'has-sessions' : ''}
                    `}
                >
                    {day.getDate()}
                    {hasSessions && <div className="session-indicator"></div>}
                </button>
            );
        });
    };

    const getSelectedDaySchedule = () => {
        const daySchedule = scheduleData.filter(session => {
            const sessionDate = new Date(session.ngayBatDau);
            return isSameDate(sessionDate, selectedDate);
        });

        return daySchedule.sort((a, b) => {
            const timeA = a.gioBatDau || '00:00';
            const timeB = b.gioBatDau || '00:00';
            return timeA.localeCompare(timeB);
        });
    };

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`min-h-screen bg-[#0a0a0a] schedule-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                {/* Sidebar */}
                <div className="schedule-sidebar">

                    {/* Mini Calendar */}
                    <div className="mini-calendar">
                        <div className="calendar-header">
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                className="nav-button"
                            >
                                ‹
                            </button>
                            <h3>{currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h3>
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                className="nav-button"
                            >
                                ›
                            </button>
                        </div>
                        <div className="weekdays-header">
                            {weekDays.map(day => (
                                <div key={day} className="weekday">{day}</div>
                            ))}
                        </div>
                        <div className="calendar-grid">
                            {renderCalendarDays()}
                        </div>
                    </div>

                    {/* Calendar Details */}
                    {/* <div className="calendar-details">
                        <h4>Chi tiết lịch</h4>
                        <div className="session-colors">
                            {Object.entries(sessionColors).map(([type, color]) => (
                                <div key={type} className="color-item">
                                    <div className="color-dot" style={{ backgroundColor: color }}></div>
                                    <span>{type}</span>
                                </div>
                            ))}
                        </div>

                        <div className="schedule-stats">
                            <div className="stat-item">
                                <span className="stat-label">Tổng buổi tập:</span>
                                <span className="stat-value">{scheduleData.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Hôm nay:</span>
                                <span className="stat-value">
                                    {getSelectedDaySchedule().length}
                                </span>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Main Content */}
                <div className="schedule-main">
                    <div className="schedule-header">
                        <h1>Lịch tập</h1>
                    </div>

                    <div className="schedule-subheading">
                        <h2 className="week-range">
                            {selectedDate.toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </h2>
                    </div>

                    <div className="schedule-container">
                        {loading ? (
                            <div className="schedule-loading">
                                <div className="loading-spinner"></div>
                                <p>Đang tải lịch tập...</p>
                            </div>
                        ) : error ? (
                            <div className="schedule-error">
                                <p>{error}</p>
                                <button onClick={fetchScheduleData} className="retry-button">
                                    Thử lại
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Date Navigation */}
                                <div className="date-navigation">
                                    <button
                                        className="nav-btn"
                                        onClick={() => {
                                            const newDate = new Date(selectedDate);
                                            newDate.setDate(selectedDate.getDate() - 1);
                                            setSelectedDate(newDate);
                                        }}
                                    >
                                        ← Ngày trước
                                    </button>

                                    <button
                                        className="today-btn"
                                        onClick={() => setSelectedDate(new Date())}
                                        disabled={isToday(selectedDate)}
                                    >
                                        Hôm nay
                                    </button>

                                    <button
                                        className="nav-btn"
                                        onClick={() => {
                                            const newDate = new Date(selectedDate);
                                            newDate.setDate(selectedDate.getDate() + 1);
                                            setSelectedDate(newDate);
                                        }}
                                    >
                                        Ngày sau →
                                    </button>
                                </div>

                                {/* Schedule for Selected Day */}
                                <div className="selected-day-schedule">
                                    {isToday(selectedDate) && (
                                        <div className="current-time-indicator">
                                            <div className="time-indicator-dot"></div>
                                            <span className="time-indicator-text">
                                                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}

                                    <div className="session-list">
                                        {getSelectedDaySchedule().length > 0 ? (
                                            getSelectedDaySchedule().map(session => {
                                                const sessionType = session.tenBuoiTap || session.goiTap?.tenGoiTap || 'Khác';
                                                const color = getSessionColor(sessionType);
                                                const countdown = isToday(selectedDate) ? getCountdown(session) : null;

                                                return (
                                                    <div
                                                        key={session._id}
                                                        className={`session-card ${session.trangThai?.toLowerCase()}`}
                                                        style={{
                                                            backgroundColor: color + '20',
                                                            borderLeftColor: color
                                                        }}
                                                        title={`${sessionType} - ${session.pt?.hoTen}`}
                                                    >
                                                        <div className="session-time">
                                                            {formatTime(session.gioBatDau)} - {formatTime(session.gioKetThuc)}
                                                        </div>
                                                        <div className="session-title">{sessionType}</div>
                                                        <div className="session-trainer">
                                                            PT: {session.pt?.hoTen || 'Chưa phân công'}
                                                        </div>
                                                        {session.chiNhanh && (
                                                            <div className="session-branch">
                                                                📍 {session.chiNhanh}
                                                            </div>
                                                        )}
                                                        {countdown && (
                                                            <div className="countdown-badge" style={{ borderColor: color, color }}>
                                                                Bắt đầu sau {countdown}
                                                            </div>
                                                        )}
                                                        <div className="session-status">
                                                            {session.trangThai === 'DA_THAM_GIA' && '✓ Đã tham gia'}
                                                            {session.trangThai === 'VANG_MAT' && '❌ Vắng mặt'}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="no-sessions">
                                                <p className='text-[#f2f2f2]'>Không có buổi tập trong ngày này</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Schedule;