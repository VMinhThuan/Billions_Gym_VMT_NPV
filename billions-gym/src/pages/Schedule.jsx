import React, { useState, useEffect } from 'react';
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [selectedSession, setSelectedSession] = useState(null);
    const [showSessionDetail, setShowSessionDetail] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const user = authUtils.getUser();
    const userId = authUtils.getUserId();

    const weekDaysShort = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    const sessionColors = [
        '#FFB6C1',
        '#B0E0E6',
        '#DDA0DD',
        '#F0E68C',
        '#FFE4B5',
        '#98FB98',
        '#FFD700',
        '#FFA07A',
        '#87CEEB',
        '#DEB887'
    ];

    const getSessionColor = (index) => {
        return sessionColors[index % sessionColors.length];
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
        setShowSessionDetail(true);
    };

    const closeSessionDetail = () => {
        setShowSessionDetail(false);
        setSelectedSession(null);
    };

    const getStatusText = (status) => {
        const statusMap = {
            'DA_DANG_KY': 'Đã đăng ký',
            'DA_THAM_GIA': 'Đã tham gia',
            'VANG_MAT': 'Vắng mặt',
            'HUY': 'Đã hủy'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'DA_DANG_KY': '#3b82f6',
            'DA_THAM_GIA': '#10b981',
            'VANG_MAT': '#f59e0b',
            'HUY': '#ef4444'
        };
        return colorMap[status] || '#6b7280';
    };

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        if (userId) fetchScheduleData();
    }, [userId, selectedDate, currentMonth]);

    useEffect(() => {
        const tick = () => setCurrentTime(new Date());
        const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
        const timeoutId = setTimeout(() => {
            tick();
            const intervalId = setInterval(tick, 60 * 1000);
            (window.__scheduleTimelineInterval = intervalId);
        }, msToNextMinute);

        return () => {
            clearTimeout(timeoutId);
            if (window.__scheduleTimelineInterval) {
                clearInterval(window.__scheduleTimelineInterval);
                window.__scheduleTimelineInterval = null;
            }
        };
    }, []);

    const fetchScheduleData = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/lichtap/member/${userId}`);

            if (response && response.data) {
                const transformedData = transformScheduleData(response.data);
                setScheduleData(transformedData);
            } else {
                setScheduleData([]);
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setScheduleData([]);
        } finally {
            setLoading(false);
        }
    };

    const transformScheduleData = (lichTaps) => {
        const sessions = [];
        let colorIndex = 0;

        lichTaps.forEach(lichTap => {
            if (lichTap.danhSachBuoiTap && Array.isArray(lichTap.danhSachBuoiTap)) {
                lichTap.danhSachBuoiTap.forEach(buoi => {
                    const buoiTapInfo = buoi.buoiTap || {};
                    sessions.push({
                        id: buoi._id || buoiTapInfo._id,
                        tenBuoiTap: buoiTapInfo.tenBuoiTap || 'Buổi tập',
                        date: new Date(buoi.ngayTap),
                        gioBatDau: buoi.gioBatDau,
                        gioKetThuc: buoi.gioKetThuc,
                        ptPhuTrach: buoi.ptPhuTrach?.hoTen || 'Chưa có PT',
                        chiNhanh: lichTap.chiNhanh?.tenChiNhanh || 'Chưa có chi nhánh',
                        trangThai: buoi.trangThai || 'DA_DANG_KY',
                        color: getSessionColor(colorIndex++)
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
        const dayOfWeek = firstDay.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + diff);

        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const isSameDay = (d1, d2) => {
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const timeStringToMinutes = (t) => {
        if (!t) return null;
        const parts = t.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return h * 60 + m;
    };

    const isNowDuringEvent = (event, now) => {
        if (!event.gioBatDau) return false;
        const start = timeStringToMinutes(event.gioBatDau);
        let end = timeStringToMinutes(event.gioKetThuc);
        if (end == null || isNaN(end)) end = start + 60;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        return nowMinutes >= start && nowMinutes < end;
    };

    const getWeekDays = () => {
        const start = new Date(selectedDate);
        const dayOfWeek = selectedDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start.setDate(selectedDate.getDate() + diff);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const getEventsForDate = (date) => {
        return scheduleData.filter(event =>
            event.date.toDateString() === date.toDateString()
        );
    };

    const goToPrevious = () => {
        if (viewMode === 'month') {
            const newMonth = new Date(currentMonth);
            newMonth.setMonth(currentMonth.getMonth() - 1);
            setCurrentMonth(newMonth);
        } else if (viewMode === 'week') {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - 7);
            setSelectedDate(newDate);
        } else {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() - 1);
            setSelectedDate(newDate);
        }
    };

    const goToNext = () => {
        if (viewMode === 'month') {
            const newMonth = new Date(currentMonth);
            newMonth.setMonth(currentMonth.getMonth() + 1);
            setCurrentMonth(newMonth);
        } else if (viewMode === 'week') {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + 7);
            setSelectedDate(newDate);
        } else {
            const newDate = new Date(selectedDate);
            newDate.setDate(selectedDate.getDate() + 1);
            setSelectedDate(newDate);
        }
    };

    const getDisplayTitle = () => {
        if (viewMode === 'month') {
            return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
        } else if (viewMode === 'week') {
            const weekDays = getWeekDays();
            const start = weekDays[0];
            const end = weekDays[6];
            return `${start.getDate()} – ${end.getDate()} Tháng ${start.getMonth() + 1}, ${start.getFullYear()}`;
        } else {
            return `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
        }
    };

    const renderTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            slots.push(
                <div key={hour} className="time-slot">
                    <span className="time-label">{time}</span>
                </div>
            );
        }
        return slots;
    };

    const renderMonthView = () => {
        const days = getDaysInMonth();
        const isOtherMonth = (date) => date.getMonth() !== currentMonth.getMonth();

        return (
            <div className="calendar-month-view">
                <button className="nav-arrow-btn nav-prev" onClick={goToPrevious}>‹</button>
                <button className="nav-arrow-btn nav-next" onClick={goToNext}>›</button>
                <div className="calendar-weekdays">
                    {weekDaysShort.map(day => (
                        <div key={day} className="weekday-header">{day}</div>
                    ))}
                </div>
                <div className="calendar-grid-month">
                    {days.map((date, index) => {
                        const events = getEventsForDate(date);
                        return (
                            <div
                                key={index}
                                className={`calendar-day-cell ${isOtherMonth(date) ? 'other-month' : ''} ${isSameDay(date, new Date()) ? 'today' : ''}`}
                                onClick={() => setSelectedDate(date)}
                            >
                                <div className="day-number">{date.getDate()}</div>
                                <div className="day-events">
                                    {events.slice(0, 3).map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="event-item"
                                            style={{ backgroundColor: event.color }}
                                            title={`${event.gioBatDau} - ${event.tenBuoiTap}\nPT: ${event.ptPhuTrach}\nChi nhánh: ${event.chiNhanh}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSessionClick(event);
                                            }}
                                        >
                                            <div className="event-time">{event.gioBatDau}</div>
                                            <div className="event-title">{event.tenBuoiTap}</div>
                                        </div>
                                    ))}
                                    {events.length > 3 && (
                                        <div className="more-events">+{events.length - 3} buổi tập</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays();

        return (
            <div className="calendar-week-view">
                <div className="week-header-row">
                    <button className="nav-arrow-btn nav-prev" onClick={goToPrevious}>‹</button>
                    <div className="time-column-header"></div>
                    {weekDays.map((date, index) => {
                        const dayOfWeek = date.getDay();
                        const displayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        return (
                            <div key={index} className="week-day-header">
                                <div className="day-name">{weekDaysShort[displayIndex]}</div>
                                <div className="day-date">{date.getDate()}/{date.getMonth() + 1}</div>
                            </div>
                        );
                    })}
                    <button className="nav-arrow-btn nav-next" onClick={goToNext}>›</button>
                </div>
                <div className="week-grid">
                    <div className="time-column">
                        <div className="all-day-label">Cả ngày</div>
                        {renderTimeSlots()}
                    </div>
                    {weekDays.map((date, dayIndex) => {
                        const events = getEventsForDate(date);
                        const isTodayCol = isSameDay(date, new Date());
                        const ALL_DAY_HEIGHT = 40;
                        const HOUR_HEIGHT = 60;
                        const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                        const topPx = ALL_DAY_HEIGHT + (totalMinutes * (HOUR_HEIGHT / 60));

                        return (
                            <div key={dayIndex} className={`week-day-column ${isTodayCol ? 'today' : ''}`}>
                                <div className="all-day-cell">
                                    {events.filter(e => !e.gioBatDau).map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="event-block all-day-event"
                                            style={{ backgroundColor: event.color }}
                                        >
                                            {event.tenBuoiTap}
                                        </div>
                                    ))}
                                </div>
                                {isTodayCol && (() => {
                                    const hasOverlap = events.some(ev => isNowDuringEvent(ev, currentTime));
                                    return (
                                        <>
                                            {!hasOverlap && (
                                                <div
                                                    className="current-timeline"
                                                    style={{ top: `${topPx}px` }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <div
                                                className="current-time-label"
                                                style={{ top: `${topPx - 20}px` }}
                                                aria-hidden="true"
                                            >
                                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </>
                                    );
                                })()}
                                {Array.from({ length: 24 }).map((_, hour) => {
                                    const hourEvents = events.filter(e => {
                                        if (!e.gioBatDau) return false;
                                        const eventHour = parseInt(e.gioBatDau.split(':')[0]);
                                        return eventHour === hour;
                                    });
                                    return (
                                        <div key={hour} className="hour-cell">
                                            {hourEvents.map((event, idx) => (
                                                <div
                                                    key={idx}
                                                    className="event-block"
                                                    style={{ backgroundColor: event.color }}
                                                    title={`PT: ${event.ptPhuTrach}\nChi nhánh: ${event.chiNhanh}`}
                                                    onClick={() => handleSessionClick(event)}
                                                >
                                                    <div className="event-time">{event.gioBatDau}</div>
                                                    <div className="event-title-small">{event.tenBuoiTap}</div>
                                                    <div className="event-pt">PT: {event.ptPhuTrach}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const events = getEventsForDate(selectedDate);
        const dayOfWeek = selectedDate.getDay();
        const displayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const dayName = weekDaysShort[displayIndex];
        const isTodaySelected = isSameDay(selectedDate, new Date());
        const ALL_DAY_HEIGHT = 40;
        const HOUR_HEIGHT = 60;
        const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const topPx = ALL_DAY_HEIGHT + (totalMinutes * (HOUR_HEIGHT / 60));

        return (
            <div className="calendar-day-view">
                <div className="day-header-row">
                    <button className="nav-arrow-btn nav-prev" onClick={goToPrevious}>‹</button>
                    <div className="time-column-header"></div>
                    <div className="single-day-header">
                        <div className="day-name">{dayName}</div>
                        <div className="day-date">{selectedDate.getDate()}/{selectedDate.getMonth() + 1}</div>
                    </div>
                    <button className="nav-arrow-btn nav-next" onClick={goToNext}>›</button>
                </div>
                <div className="day-grid">
                    <div className="time-column">
                        <div className="all-day-label">Cả ngày</div>
                        {renderTimeSlots()}
                    </div>
                    <div className="day-content-column">
                        {isTodaySelected && (() => {
                            const hasOverlap = events.some(ev => isNowDuringEvent(ev, currentTime));
                            return (
                                <>
                                    {!hasOverlap && (
                                        <div className="current-timeline" style={{ top: `${topPx}px` }} aria-hidden="true" />
                                    )}
                                    <div className="current-time-label" style={{ top: `${topPx - 20}px` }} aria-hidden="true">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </>
                            );
                        })()}
                        <div className="all-day-cell">
                            {events.filter(e => !e.gioBatDau).map((event, idx) => (
                                <div
                                    key={idx}
                                    className="event-block all-day-event"
                                    style={{ backgroundColor: event.color }}
                                >
                                    {event.tenBuoiTap}
                                </div>
                            ))}
                        </div>
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const hourEvents = events.filter(e => {
                                if (!e.gioBatDau) return false;
                                const eventHour = parseInt(e.gioBatDau.split(':')[0]);
                                return eventHour === hour;
                            });
                            return (
                                <div key={hour} className="hour-cell">
                                    {hourEvents.map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="event-block"
                                            style={{ backgroundColor: event.color }}
                                            title={`Chi nhánh: ${event.chiNhanh}`}
                                            onClick={() => handleSessionClick(event)}
                                        >
                                            <div className="event-time">{event.gioBatDau} - {event.gioKetThuc}</div>
                                            <div className="event-title-small">{event.tenBuoiTap}</div>
                                            <div className="event-pt">PT: {event.ptPhuTrach}</div>
                                            <div className="event-branch">{event.chiNhanh}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`calendar-container ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <div className="calendar-wrapper">
                    {/* Top Navigation Bar */}
                    <div className="calendar-top-bar">
                        <div className="calendar-nav-left">
                            <button className="add-event-btn">Thêm sự kiện +</button>
                        </div>
                        <div className="calendar-title">{getDisplayTitle()}</div>
                        <div className="view-mode-toggle">
                            <button
                                className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                                onClick={() => setViewMode('month')}
                            >
                                Tháng
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                                onClick={() => setViewMode('week')}
                            >
                                Tuần
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
                                onClick={() => setViewMode('day')}
                            >
                                Ngày
                            </button>
                        </div>
                    </div>

                    {/* Main Calendar Content */}
                    <div className="calendar-main-content">
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
                                {viewMode === 'month' && renderMonthView()}
                                {viewMode === 'week' && renderWeekView()}
                                {viewMode === 'day' && renderDayView()}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Session Detail Modal */}
            {showSessionDetail && selectedSession && (
                <div className="modal-overlay" onClick={closeSessionDetail}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi tiết buổi tập</h2>
                            <button className="modal-close" onClick={closeSessionDetail}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <div className="detail-label">Tên buổi tập:</div>
                                <div className="detail-value">{selectedSession.tenBuoiTap}</div>
                            </div>
                            <div className="detail-row">
                                <div className="detail-label">Ngày tập:</div>
                                <div className="detail-value">
                                    {selectedSession.date.toLocaleDateString('vi-VN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div className="detail-row">
                                <div className="detail-label">Thời gian:</div>
                                <div className="detail-value">
                                    {selectedSession.gioBatDau} - {selectedSession.gioKetThuc}
                                </div>
                            </div>
                            <div className="detail-row">
                                <div className="detail-label">PT phụ trách:</div>
                                <div className="detail-value">{selectedSession.ptPhuTrach}</div>
                            </div>
                            <div className="detail-row">
                                <div className="detail-label">Chi nhánh:</div>
                                <div className="detail-value">{selectedSession.chiNhanh}</div>
                            </div>
                            <div className="detail-row">
                                <div className="detail-label">Trạng thái:</div>
                                <div className="detail-value">
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(selectedSession.trangThai) }}
                                    >
                                        {getStatusText(selectedSession.trangThai)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-close-modal" onClick={closeSessionDetail}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Schedule;
