import React, { useState, useEffect } from 'react';
import { authUtils } from '../utils/auth';
import { api, scheduleAPI } from '../services/api';
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
    const [showRegistrationNotification, setShowRegistrationNotification] = useState(false);
    const [canRegister, setCanRegister] = useState(false);
    const [nextWeekStart, setNextWeekStart] = useState(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [registrationEligibility, setRegistrationEligibility] = useState(null);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [submittingRegistration, setSubmittingRegistration] = useState(false);
    const [showAddSessionModal, setShowAddSessionModal] = useState(false);
    const [availableSessionsThisWeek, setAvailableSessionsThisWeek] = useState([]);
    const [loadingAvailableSessions, setLoadingAvailableSessions] = useState(false);
    const [selectedSessionsToAdd, setSelectedSessionsToAdd] = useState([]);
    const [addingSessions, setAddingSessions] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [sessionToCancel, setSessionToCancel] = useState(null);
    const [cancelingSession, setCancelingSession] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [selectedSessionsInCurrentModal, setSelectedSessionsInCurrentModal] = useState([]);

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

    // Update current time every second for real-time countdown in session modal
    useEffect(() => {
        if (showSessionModal) {
            const timer = setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showSessionModal]);

    // Kiểm tra điều kiện đăng ký lịch tập
    useEffect(() => {
        console.log('🚀 [Schedule] useEffect triggered, userId:', userId);
        if (!userId) {
            console.log('❌ [Schedule] No userId, skipping registration check');
            return;
        }

        const checkRegistrationEligibility = async () => {
            try {
                console.log('🔄 [Schedule] Checking registration eligibility at:', new Date().toLocaleTimeString('vi-VN'));
                const response = await api.get('/lichtap/check-registration-eligibility');
                console.log('📋 [Schedule] Registration eligibility response:', response);

                if (response && response.success !== undefined) {
                    setCanRegister(response.canRegister || false);
                    setNextWeekStart(response.nextWeekStart ? new Date(response.nextWeekStart) : null);
                    setRegistrationEligibility(response);

                    // CHỈ hiển thị thông báo đăng ký lịch tập cho trường hợp khách ĐÃ HOÀN TẤT việc đăng ký gói tập
                    // Điều kiện:
                    // 1. Có thể đăng ký (canRegister = true)
                    // 2. Đã hoàn tất đăng ký gói tập (hasCompletedPackage = true)
                    // 3. Đúng thời gian đăng ký (isRegistrationTime = true) - T7/CN 13h05 (TEST)
                    const shouldShowRegistrationNotification = response.canRegister &&
                        response.hasCompletedPackage &&
                        response.isRegistrationTime;

                    console.log('🔔 [Schedule] Notification check:', {
                        canRegister: response.canRegister,
                        hasCompletedPackage: response.hasCompletedPackage,
                        isRegistrationTime: response.isRegistrationTime,
                        shouldShowNotification: shouldShowRegistrationNotification,
                        message: response.message,
                        activePackage: response.activePackage,
                        hasExistingSchedule: response.hasExistingSchedule,
                        currentTime: new Date().toLocaleTimeString('vi-VN'),
                        currentDay: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date().getDay()]
                    });

                    // Thông báo đăng ký lịch tập - CHỈ hiện cho khách đã hoàn tất đăng ký gói tập
                    if (shouldShowRegistrationNotification) {
                        console.log('✅ [Schedule] SHOWING registration notification!');
                        setShowRegistrationNotification(true);
                        // Tự động ẩn thông báo sau 30 giây
                        setTimeout(() => {
                            console.log('⏰ [Schedule] Auto-hiding notification after 30s');
                            setShowRegistrationNotification(false);
                        }, 30000);
                    } else {
                        const reason = !response.canRegister ? 'Cannot register' :
                            !response.hasCompletedPackage ? 'Package not completed' :
                                !response.isRegistrationTime ? 'Not registration time' : 'Unknown';
                        console.log('❌ [Schedule] NOT showing notification. Reason:', reason, {
                            canRegister: response.canRegister,
                            hasCompletedPackage: response.hasCompletedPackage,
                            isRegistrationTime: response.isRegistrationTime
                        });
                        setShowRegistrationNotification(false);
                    }

                }
            } catch (error) {
                console.error('❌ [Schedule] Error checking registration eligibility:', error);
                console.error('❌ [Schedule] Error details:', {
                    message: error.message,
                    stack: error.stack,
                    response: error.response?.data
                });
            }
        };

        // Kiểm tra ngay lập tức
        checkRegistrationEligibility();

        // Kiểm tra mỗi phút để cập nhật trạng thái
        // Và kiểm tra mỗi 10 giây trong khoảng 12h-13h vào T7/CN để catch chính xác
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const isSaturday = now.getDay() === 6;
        const isSunday = now.getDay() === 0;
        const isNearRegistrationTime = (isSaturday || isSunday) && hour >= 12 && hour <= 13;

        const intervalTime = isNearRegistrationTime ? 10 * 1000 : 60 * 1000; // 10 giây nếu trong khoảng thời gian đăng ký, 1 phút nếu không
        const intervalId = setInterval(checkRegistrationEligibility, intervalTime);

        return () => clearInterval(intervalId);
    }, [userId]);

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
                    // buoiTap có thể là object đã populate hoặc chỉ là ObjectId
                    const buoiTapInfo = buoi.buoiTap || {};
                    const buoiTapId = buoiTapInfo._id
                        ? buoiTapInfo._id.toString()
                        : (buoi.buoiTap?.toString ? buoi.buoiTap.toString() : buoi.buoiTap);

                    sessions.push({
                        id: buoi._id || buoiTapInfo._id,
                        buoiTapId: buoiTapId, // ID của BuoiTap để dùng cho cancel
                        tenBuoiTap: buoiTapInfo.tenBuoiTap || buoi.tenBuoiTap || 'Buổi tập',
                        date: new Date(buoi.ngayTap),
                        gioBatDau: buoi.gioBatDau,
                        gioKetThuc: buoi.gioKetThuc,
                        ptPhuTrach: buoi.ptPhuTrach?.hoTen || buoiTapInfo.ptPhuTrach?.hoTen || 'Chưa có PT',
                        chiNhanh: lichTap.chiNhanh?.tenChiNhanh || 'Chưa có chi nhánh',
                        trangThai: buoi.trangThai || 'DA_DANG_KY',
                        color: getSessionColor(colorIndex++)
                    });
                });
            }
        });
        return sessions;
    };

    // Kiểm tra có thể hủy buổi tập (trước 1 ngày)
    const canCancelSession = (sessionDate) => {
        const now = new Date();
        const sessionDateTime = new Date(sessionDate);
        const timeDiff = sessionDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff >= 24;
    };

    // Load available sessions this week
    const loadAvailableSessionsThisWeek = async () => {
        setLoadingAvailableSessions(true);
        setError(null);
        try {
            const response = await scheduleAPI.getAvailableSessionsThisWeek();
            if (response && response.success) {
                setAvailableSessionsThisWeek(response.data || []);
            } else {
                setError('Không thể tải danh sách buổi tập');
            }
        } catch (err) {
            console.error('Error loading available sessions:', err);
            setError('Lỗi khi tải danh sách buổi tập');
        } finally {
            setLoadingAvailableSessions(false);
        }
    };

    // Time slots for weekly schedule
    const TIME_SLOTS = [
        { id: 1, start: '06:00', end: '08:00', label: '06:00 - 08:00' },
        { id: 2, start: '08:00', end: '10:00', label: '08:00 - 10:00' },
        { id: 3, start: '10:00', end: '12:00', label: '10:00 - 12:00' },
        { id: 4, start: '13:00', end: '15:00', label: '13:00 - 15:00' },
        { id: 5, start: '15:00', end: '17:00', label: '15:00 - 17:00' },
        { id: 6, start: '17:00', end: '19:00', label: '17:00 - 19:00' },
        { id: 7, start: '19:00', end: '21:00', label: '19:00 - 21:00' },
        { id: 8, start: '21:00', end: '23:00', label: '21:00 - 23:00' }
    ];

    // Get current week days
    const getCurrentWeekDays = () => {
        const now = new Date();
        // Get Vietnam time (UTC+7)
        const vietnamOffset = 7 * 60 * 60 * 1000;
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
        const vietnamTime = new Date(utcTime + vietnamOffset);

        const dayOfWeek = vietnamTime.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Calculate Monday of current week in Vietnam time
        const weekStartVietnam = new Date(vietnamTime);
        weekStartVietnam.setUTCDate(vietnamTime.getUTCDate() - daysToMonday);
        weekStartVietnam.setUTCHours(0, 0, 0, 0);

        const days = [];
        const weekDaysNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStartVietnam);
            date.setUTCDate(weekStartVietnam.getUTCDate() + i);
            // Convert back to UTC for comparison
            const dateUTC = new Date(date.getTime() - vietnamOffset);
            days.push({
                date: dateUTC.toISOString(),
                dayName: weekDaysNames[date.getUTCDay()],
                dayShort: weekDaysShort[date.getUTCDay()],
                isToday: date.getUTCDate() === vietnamTime.getUTCDate() &&
                    date.getUTCMonth() === vietnamTime.getUTCMonth() &&
                    date.getUTCFullYear() === vietnamTime.getUTCFullYear()
            });
        }
        return days;
    };

    // Get sessions for a time slot
    const getSessionsForTimeSlot = (dayDate, timeSlot) => {
        return availableSessionsThisWeek.filter(session => {
            // Compare dates by date only (ignore time)
            const sessionDate = new Date(session.ngayTap);
            const dayDateObj = new Date(dayDate);

            // Normalize dates to compare only date part
            const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
            const dayDateOnly = new Date(dayDateObj.getFullYear(), dayDateObj.getMonth(), dayDateObj.getDate());

            if (sessionDateOnly.getTime() !== dayDateOnly.getTime()) {
                return false;
            }

            // Check if session time matches time slot
            const sessionStart = session.gioBatDau ? session.gioBatDau.substring(0, 5) : '';
            const sessionEnd = session.gioKetThuc ? session.gioKetThuc.substring(0, 5) : '';

            if (!sessionStart || !sessionEnd) return false;

            // Session starts within the time slot or time slot starts within session
            return (sessionStart >= timeSlot.start && sessionStart < timeSlot.end) ||
                (timeSlot.start >= sessionStart && timeSlot.start < sessionEnd);
        });
    };

    // Check if time slot is in past
    const isTimeSlotInPast = (dayDate, timeSlot) => {
        const now = new Date();
        const slotDateTime = new Date(dayDate);
        // Ensure we're comparing in the same timezone
        const slotDate = new Date(slotDateTime);
        const [hours] = timeSlot.start.split(':');
        slotDate.setHours(parseInt(hours), 0, 0, 0);
        return slotDate < now;
    };

    // Kiểm tra khung giờ đã đăng ký chưa (trong scheduleData)
    const isTimeSlotAlreadyRegistered = (dayDate, timeSlot) => {
        if (!scheduleData || scheduleData.length === 0) {
            console.log('⚠️ [TimeSlot Check] No schedule data');
            return false;
        }
        if (!dayDate || !timeSlot) return false;

        try {
            const dayDateObj = new Date(dayDate);
            if (isNaN(dayDateObj.getTime())) return false;
            const dayDateStr = dayDateObj.toISOString().split('T')[0];

            console.log('🔍 [TimeSlot Check] Checking time slot:', {
                dayDateStr,
                timeSlot: timeSlot.label,
                totalScheduleData: scheduleData.length,
                sampleScheduleData: scheduleData[0]
            });

            const found = scheduleData.some(registeredSession => {
                try {
                    const sessionDateValue = registeredSession.ngay || registeredSession.ngayTap || registeredSession.date;
                    if (!sessionDateValue) return false;

                    const sessionDate = new Date(sessionDateValue);
                    if (isNaN(sessionDate.getTime())) return false;

                    const sessionDateStr = sessionDate.toISOString().split('T')[0];
                    const sessionTime = registeredSession.gioBatDau ? registeredSession.gioBatDau.substring(0, 5) : '';

                    const isSameDay = dayDateStr === sessionDateStr;
                    const isSameTimeSlot = sessionTime >= timeSlot.start && sessionTime < timeSlot.end;
                    const isNotCancelled = registeredSession.trangThai !== 'HUY';

                    if (isSameDay && sessionTime && timeSlot.start) {
                        console.log('🔍 [TimeSlot Check] Matching day found:', {
                            sessionDateStr,
                            sessionTime,
                            timeSlotRange: `${timeSlot.start}-${timeSlot.end}`,
                            isSameTimeSlot,
                            isNotCancelled,
                            trangThai: registeredSession.trangThai
                        });
                    }

                    if (isSameDay && isSameTimeSlot && isNotCancelled) {
                        console.log('✅ [TimeSlot Check] Found registered time slot:', {
                            dayDateStr,
                            sessionDateStr,
                            timeSlot: timeSlot.label,
                            sessionTime,
                            tenBuoiTap: registeredSession.tenBuoiTap,
                            trangThai: registeredSession.trangThai
                        });
                    }

                    return isSameDay && isSameTimeSlot && isNotCancelled;
                } catch (err) {
                    return false;
                }
            });

            return found;
        } catch (err) {
            return false;
        }
    };

    // Kiểm tra session đã đăng ký chưa (dựa vào scheduleData)
    // CHỈ kiểm tra session cụ thể, không chặn toàn bộ ngày
    const isSessionAlreadyRegistered = (sessionId) => {
        if (!sessionId) return false;

        const sessionIdStr = sessionId.toString();

        const isRegistered = scheduleData.some(registeredSession => {
            // So sánh buoiTapId với session._id (normalize cả hai về string)
            const registeredBuoiTapId = registeredSession.buoiTapId
                ? registeredSession.buoiTapId.toString()
                : null;

            if (!registeredBuoiTapId) return false;

            // So sánh chính xác ID
            const isMatch = registeredBuoiTapId === sessionIdStr;

            if (isMatch) {
                console.log('🔍 [Session Check] Session đã đăng ký:', {
                    sessionId: sessionIdStr,
                    registeredBuoiTapId: registeredBuoiTapId,
                    registeredSession: {
                        tenBuoiTap: registeredSession.tenBuoiTap,
                        date: registeredSession.date,
                        gioBatDau: registeredSession.gioBatDau
                    }
                });
            }

            return isMatch;
        });

        return isRegistered;
    };

    // Get time slot status
    const getTimeSlotStatus = (dayDate, timeSlot) => {
        if (isTimeSlotInPast(dayDate, timeSlot)) {
            return 'past';
        }

        // Kiểm tra khung giờ đã đăng ký
        if (isTimeSlotAlreadyRegistered(dayDate, timeSlot)) {
            return 'registered';
        }

        const sessionsInSlot = getSessionsForTimeSlot(dayDate, timeSlot);
        const hasSelectedSession = sessionsInSlot.some(session =>
            selectedSessionsToAdd.includes(session._id.toString())
        );

        if (hasSelectedSession) {
            return 'selected';
        }

        if (sessionsInSlot.length === 0) {
            return 'empty';
        }

        return 'available';
    };

    // Handle time slot click - mở modal để chọn session
    const handleTimeSlotClick = async (dayDate, timeSlot) => {
        if (isTimeSlotInPast(dayDate, timeSlot)) {
            return;
        }

        // Không cho click vào khung giờ đã đăng ký
        if (isTimeSlotAlreadyRegistered(dayDate, timeSlot)) {
            return;
        }

        const sessionsInSlot = getSessionsForTimeSlot(dayDate, timeSlot);

        if (sessionsInSlot.length === 0) {
            return;
        }

        // Refresh schedule data để có thông tin mới nhất về sessions đã đăng ký
        await fetchScheduleData();

        // Lấy tên ngày trong tuần
        const weekDays = getCurrentWeekDays();
        const dayInfo = weekDays.find(d => d.date === dayDate);

        // Khi mở modal mới, chỉ giữ lại sessions đã chọn trong ca này
        // Sử dụng state riêng cho modal để tránh ảnh hưởng từ các ca khác
        const sessionIdsInSlot = sessionsInSlot.map(s => s._id.toString());
        const sessionsInThisSlot = selectedSessionsToAdd.filter(id => sessionIdsInSlot.includes(id));

        console.log('🔍 [Modal Open] Opening modal for time slot:', {
            timeSlot: timeSlot.label,
            dayDate: dayDate,
            dayName: dayInfo?.dayName,
            sessionsInSlot: sessionIdsInSlot,
            selectedSessionsToAdd: selectedSessionsToAdd,
            sessionsInThisSlot: sessionsInThisSlot
        });

        // Set state riêng cho modal hiện tại
        setSelectedSessionsInCurrentModal(sessionsInThisSlot);

        // Mở modal để chọn session
        setSelectedTimeSlot({
            dayDate,
            timeSlot,
            sessions: sessionsInSlot,
            dayName: dayInfo?.dayName || ''
        });
        setShowSessionModal(true);
    };

    // Handle session select trong modal
    const handleSessionSelect = (session) => {
        // Kiểm tra session đã đăng ký chưa
        if (isSessionAlreadyRegistered(session._id)) {
            console.log('🚫 [Session Select] Session đã đăng ký, không cho phép chọn:', session._id);
            return; // Không cho phép chọn session đã đăng ký
        }

        // Kiểm tra session có thể đăng ký không
        // Chỉ chặn khi coTheDangKy là false một cách rõ ràng, không phải undefined
        if (session.coTheDangKy === false) {
            console.log('🚫 [Session Select] Session không thể đăng ký:', session._id);
            return;
        }

        if (!selectedTimeSlot) {
            console.error('🚫 [Session Select] selectedTimeSlot is null');
            return;
        }

        const sessionIdStr = session._id.toString();
        const isSelected = selectedSessionsInCurrentModal.includes(sessionIdStr);

        console.log('🔍 [Session Select] Selecting session:', {
            sessionId: sessionIdStr,
            tenBuoiTap: session.tenBuoiTap,
            isSelected: isSelected,
            selectedSessionsInCurrentModal: selectedSessionsInCurrentModal,
            selectedSessionsToAdd: selectedSessionsToAdd
        });

        if (isSelected) {
            // Bỏ chọn - cập nhật cả state modal và state tổng
            setSelectedSessionsInCurrentModal(prev => prev.filter(id => id !== sessionIdStr));
            setSelectedSessionsToAdd(prev => prev.filter(id => id !== sessionIdStr));
        } else {
            // Chọn session - chỉ cho phép 1 session trong mỗi ca
            // Tìm các session khác trong cùng ca này và bỏ chọn chúng
            const otherSessionsInSlot = selectedTimeSlot.sessions
                .filter(s => s._id.toString() !== sessionIdStr)
                .map(s => s._id.toString());

            // Cập nhật state modal (chỉ cho ca hiện tại)
            setSelectedSessionsInCurrentModal([sessionIdStr]);

            // Cập nhật state tổng (bỏ chọn các session khác trong ca này, thêm session mới)
            setSelectedSessionsToAdd(prev => {
                // Bỏ chọn các session khác trong ca này
                const filtered = prev.filter(id => !otherSessionsInSlot.includes(id));
                // Thêm session mới
                return [...filtered, sessionIdStr];
            });
        }
    };

    // Đóng modal chọn session
    const closeSessionModal = () => {
        setShowSessionModal(false);
        setSelectedTimeSlot(null);
        setSelectedSessionsInCurrentModal([]);
    };

    // Enhanced countdown function with detailed time breakdown
    const getDetailedCountdown = (ngay, gioBatDau, gioKetThuc) => {
        const now = new Date();
        const sessionDate = new Date(ngay);
        const [hours, minutes] = gioBatDau.split(':').map(Number);
        const [endHours, endMinutes] = gioKetThuc.split(':').map(Number);

        const startTime = new Date(sessionDate);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHours, endMinutes, 0, 0);

        const timeDiff = startTime.getTime() - now.getTime();
        const endTimeDiff = endTime.getTime() - now.getTime();

        // Session has ended
        if (endTimeDiff <= 0) {
            return {
                status: 'finished',
                text: 'ĐÃ KẾT THÚC',
                color: '#6B7280',
                icon: '✅',
                isFinished: true
            };
        }

        // Session is ongoing
        if (timeDiff <= 0 && endTimeDiff > 0) {
            return {
                status: 'ongoing',
                text: 'ĐANG DIỄN RA',
                color: '#FF914D',
                icon: '🔥',
                isOngoing: true
            };
        }

        // Session hasn't started yet
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours24 = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((timeDiff % (1000 * 60)) / 1000);

        let status = 'upcoming';
        let color = '#00FFC6';
        let icon = '⏳';
        let label = 'Bắt đầu sau:';

        // Critical timing - less than 10 minutes
        if (timeDiff <= 10 * 60 * 1000) {
            status = 'critical';
            color = '#FF6B6B';
            icon = '🚨';
            label = 'Sắp bắt đầu trong:';
        }
        // Urgent - less than 1 hour
        else if (timeDiff <= 60 * 60 * 1000) {
            status = 'urgent';
            color = '#FF914D';
            icon = '⚡';
            label = 'Sắp diễn ra trong:';
        }
        // Soon - less than 24 hours (but more than 1 hour)
        else if (timeDiff <= 24 * 60 * 60 * 1000) {
            status = 'soon';
            color = '#00FFC6';
            icon = '⏰';
            label = 'Sắp tới trong:';
        }
        // Upcoming - more than 24 hours
        else {
            status = 'upcoming';
            color = '#00FFC6';
            icon = '⏳';
            label = 'Bắt đầu sau:';
        }

        return {
            status,
            text: '',
            color,
            icon,
            label,
            days,
            hours: hours24,
            minutes: mins,
            seconds: secs,
            isCritical: status === 'critical',
            isUrgent: status === 'urgent',
            isSoon: status === 'soon'
        };
    };

    // Get workout difficulty and type styling
    const getWorkoutTypeInfo = (sessionName, description, template) => {
        const name = sessionName?.toLowerCase() || '';
        const desc = description?.toLowerCase() || '';

        let type = 'Workout';
        let difficulty = 'Trung bình';
        let icon = '🔥';

        if (name.includes('push')) {
            type = 'Strength';
            icon = '💪';
        } else if (name.includes('pull')) {
            type = 'Strength';
            icon = '🏋️';
        } else if (name.includes('leg')) {
            type = 'Strength';
            icon = '🦵';
        } else if (name.includes('cardio')) {
            type = 'Cardio';
            icon = '❤️';
        } else if (name.includes('mobility') || name.includes('flexibility')) {
            type = 'Mobility';
            icon = '🤸';
        } else if (name.includes('core')) {
            type = 'Core';
            icon = '🎯';
        }

        // Determine difficulty from description
        if (desc.includes('de') || desc.includes('easy')) {
            difficulty = 'Dễ';
        } else if (desc.includes('kho') || desc.includes('hard')) {
            difficulty = 'Khó';
        } else if (desc.includes('trung_binh') || desc.includes('medium')) {
            difficulty = 'Trung bình';
        }

        return { type, difficulty, icon };
    };

    // Format time helper
    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : '';
    };

    // Mở modal đăng ký thêm buổi tập
    const handleOpenAddSessionModal = async () => {
        setShowAddSessionModal(true);
        setSelectedSessionsToAdd([]);
        // Refresh schedule data để có thông tin mới nhất về sessions đã đăng ký
        await fetchScheduleData();
        console.log('📊 [Add Session Modal] scheduleData loaded:', scheduleData.length, 'sessions');
        loadAvailableSessionsThisWeek();
    };

    // Đăng ký thêm buổi tập
    const handleAddSessions = async () => {
        if (selectedSessionsToAdd.length === 0) {
            setError('Vui lòng chọn ít nhất một buổi tập');
            return;
        }

        setAddingSessions(true);
        setError(null);

        try {
            // Đăng ký từng buổi tập
            const results = await Promise.allSettled(
                selectedSessionsToAdd.map(buoiTapId =>
                    scheduleAPI.registerSession(buoiTapId)
                )
            );

            const failed = results.filter(r => r.status === 'rejected' || (r.value && !r.value.success));
            if (failed.length > 0) {
                const errorMessages = failed.map(r =>
                    r.status === 'rejected' ? r.reason?.message : r.value?.message
                ).filter(Boolean);
                setError(`Một số buổi tập đăng ký thất bại: ${errorMessages.join(', ')}`);
            } else {
                // Refresh schedule data
                await fetchScheduleData();
                setShowAddSessionModal(false);
                setSelectedSessionsToAdd([]);
                setError(null);
                alert('Đăng ký buổi tập thành công!');
            }
        } catch (err) {
            console.error('Error adding sessions:', err);
            setError('Lỗi khi đăng ký buổi tập');
        } finally {
            setAddingSessions(false);
        }
    };

    // Hủy buổi tập
    const handleCancelSession = async () => {
        if (!sessionToCancel) return;

        setCancelingSession(true);
        setError(null);

        try {
            const response = await scheduleAPI.cancelSession(sessionToCancel.buoiTapId);
            if (response && response.success) {
                // Refresh schedule data
                await fetchScheduleData();
                setShowCancelConfirm(false);
                setSessionToCancel(null);
                setError(null);
                alert('Hủy đăng ký buổi tập thành công!');
            } else {
                setError(response?.message || 'Hủy đăng ký thất bại');
            }
        } catch (err) {
            console.error('Error canceling session:', err);
            setError(err.message || 'Lỗi khi hủy đăng ký buổi tập');
        } finally {
            setCancelingSession(false);
        }
    };

    // Mở modal xác nhận hủy
    const handleOpenCancelConfirm = (session) => {
        if (!canCancelSession(session.date)) {
            alert('Chỉ có thể hủy buổi tập trước 24 giờ');
            return;
        }
        setSessionToCancel(session);
        setShowCancelConfirm(true);
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

    const handleOpenRegistration = () => {
        setShowRegistrationModal(true);
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
                    {/* Registration Notification - Đăng ký lịch tập */}
                    {showRegistrationNotification && (
                        <div className="registration-notification">
                            <div className="notification-content">
                                <span className="notification-icon">🔔</span>
                                <span className="notification-message">Vui lòng đăng ký lịch tập cho tuần sau</span>
                                <button
                                    className="notification-btn"
                                    onClick={() => {
                                        setShowRegistrationNotification(false);
                                        setShowRegistrationModal(true);
                                    }}
                                >
                                    Đăng ký ngay
                                </button>
                                <button
                                    className="notification-close"
                                    onClick={() => setShowRegistrationNotification(false)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}


                    {/* Top Navigation Bar */}
                    <div className="calendar-top-bar">
                        <div className="calendar-nav-left">
                            <button
                                className={`register-week-btn ${!canRegister ? 'disabled' : ''}`}
                                onClick={handleOpenRegistration}
                                disabled={!canRegister}
                                title={!canRegister
                                    ? (registrationEligibility?.message || 'Chỉ có thể đăng ký vào Thứ 7 hoặc Chủ nhật từ 12h trưa trở đi')
                                    : 'Đăng ký lịch tập tuần sau'}
                            >
                                Đăng ký lịch tập tuần sau
                            </button>
                            <button
                                className="add-session-btn"
                                onClick={handleOpenAddSessionModal}
                                title="Đăng ký thêm buổi tập trong tuần này"
                            >
                                Đăng ký thêm buổi tập
                            </button>
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
                    <div className="modal-content session-detail-modal" onClick={(e) => e.stopPropagation()}>
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
                            {selectedSession.trangThai === 'DA_DANG_KY' && canCancelSession(selectedSession.date) && (
                                <button
                                    className="btn-cancel-session"
                                    onClick={() => {
                                        closeSessionDetail();
                                        handleOpenCancelConfirm(selectedSession);
                                    }}
                                >
                                    Hủy buổi tập
                                </button>
                            )}
                            <button className="btn-close-modal" onClick={closeSessionDetail}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đăng ký thêm buổi tập */}
            {showAddSessionModal && (
                <div className="modal-overlay" onClick={() => setShowAddSessionModal(false)}>
                    <div className="modal-content add-session-modal week-registration-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Đăng ký thêm buổi tập</h2>
                            <button className="modal-close" onClick={() => setShowAddSessionModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {loadingAvailableSessions ? (
                                <div className="loading-state">
                                    <div className="loading-spinner"></div>
                                    <p>Đang tải danh sách buổi tập...</p>
                                </div>
                            ) : availableSessionsThisWeek.length === 0 ? (
                                <div className="empty-state">
                                    <p>Không có buổi tập nào có sẵn trong tuần này</p>
                                </div>
                            ) : (
                                <>
                                    <div className="schedule-header">
                                        <p className="modal-description">Chọn các ca tập bạn muốn đăng ký thêm</p>
                                    </div>
                                    <div className="week-schedule" style={{ ['--rows']: TIME_SLOTS.length }}>
                                        {getCurrentWeekDays().map((day, index) => (
                                            <div key={index} className="day-column">
                                                <div className="day-header">
                                                    <div className="day-name">{day.dayName}</div>
                                                    <div className="day-date">
                                                        {(() => {
                                                            const d = new Date(day.date);
                                                            // Adjust for Vietnam timezone display
                                                            const vietnamOffset = 7 * 60 * 60 * 1000;
                                                            const vietnamTime = new Date(d.getTime() + vietnamOffset);
                                                            return `${vietnamTime.getUTCDate()}/${vietnamTime.getUTCMonth() + 1}`;
                                                        })()}
                                                    </div>
                                                    {day.isToday && <div className="today-badge">Hôm nay</div>}
                                                </div>

                                                <div className="time-slots-container">
                                                    {TIME_SLOTS.map(timeSlot => {
                                                        const status = getTimeSlotStatus(day.date, timeSlot);
                                                        const sessionsInSlot = getSessionsForTimeSlot(day.date, timeSlot);
                                                        const selectedSessionInSlot = sessionsInSlot.find(session =>
                                                            selectedSessionsToAdd.includes(session._id.toString())
                                                        );

                                                        return (
                                                            <div
                                                                key={timeSlot.id}
                                                                className={`time-slot-card ${status} ${status === 'registered' ? 'disabled' : ''}`}
                                                                onClick={() => handleTimeSlotClick(day.date, timeSlot)}
                                                            >
                                                                <div className="time-slot-time">{timeSlot.label}</div>
                                                                <div className="time-slot-status">
                                                                    {status === 'past' && (
                                                                        <span className="status-text past">Đã qua</span>
                                                                    )}
                                                                    {status === 'registered' && (
                                                                        <span className="status-text registered">Đã chọn</span>
                                                                    )}
                                                                    {status === 'empty' && (
                                                                        <span className="status-text empty">
                                                                            {/* Với các gói bình thường: chỉ hiển thị "Trống".
                                                                                Với gói Weekend Gym: giải thích rõ chỉ được đăng ký Thứ 7 & Chủ nhật */}
                                                                            {registrationEligibility?.activePackage?.tenGoiTap &&
                                                                                (registrationEligibility.activePackage.tenGoiTap.toLowerCase().includes('weekend') ||
                                                                                    registrationEligibility.activePackage.tenGoiTap.toLowerCase().includes('cuối tuần'))
                                                                                ? 'Chỉ áp dụng cho Thứ 7 & Chủ nhật'
                                                                                : 'Trống'}
                                                                        </span>
                                                                    )}
                                                                    {status === 'available' && (
                                                                        <span className="status-text available">
                                                                            {sessionsInSlot.length} buổi
                                                                        </span>
                                                                    )}
                                                                    {status === 'selected' && selectedSessionInSlot && (
                                                                        <div className="selected-session-info">
                                                                            <div className="selected-trainer">
                                                                                {selectedSessionInSlot.ptPhuTrach?.hoTen || 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedSessionsToAdd.length > 0 && (
                                        <div className="schedule-summary">
                                            <div className="selected-count">
                                                Đã chọn: {selectedSessionsToAdd.length} buổi tập
                                            </div>
                                            <div className="selected-sessions">
                                                <h4>Buổi tập đã chọn:</h4>
                                                <div className="selected-list">
                                                    {selectedSessionsToAdd.map(buoiTapId => {
                                                        const session = availableSessionsThisWeek.find(s => s._id.toString() === buoiTapId);
                                                        if (!session) return null;
                                                        const sessionDate = new Date(session.ngayTap);
                                                        const weekDayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                                        const dayIndex = sessionDate.getDay();

                                                        return (
                                                            <div key={buoiTapId} className="selected-session">
                                                                <span className="session-day">
                                                                    {weekDayNames[dayIndex]}
                                                                </span>
                                                                <span className="session-time">
                                                                    {session.gioBatDau.substring(0, 5)} - {session.gioKetThuc.substring(0, 5)}
                                                                </span>
                                                                <span className="session-trainer">
                                                                    {session.ptPhuTrach?.hoTen || session.tenBuoiTap || 'N/A'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {error && <div className="error-message">{error}</div>}
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setShowAddSessionModal(false);
                                    setSelectedSessionsToAdd([]);
                                    setError(null);
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleAddSessions}
                                disabled={selectedSessionsToAdd.length === 0 || addingSessions || loadingAvailableSessions}
                            >
                                {addingSessions ? 'Đang đăng ký...' : `Đăng ký (${selectedSessionsToAdd.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chọn buổi tập trong ca */}
            {showSessionModal && selectedTimeSlot && (
                <div className="modal-overlay" onClick={closeSessionModal}>
                    <div className="modal-content session-selection-modal max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chọn buổi tập</h2>
                            <div className="modal-subtitle">
                                {selectedTimeSlot.dayName} - {selectedTimeSlot.timeSlot.label}
                            </div>
                            <button className="modal-close" onClick={closeSessionModal}>×</button>
                        </div>

                        <div className="modal-body w-full max-w-6xl mx-auto px-6">
                            {selectedTimeSlot.sessions.length > 0 ? (
                                <div className="w-full">
                                    {/* Info message about single selection per time slot */}
                                    <div className="flex items-center gap-2 mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <span className="text-blue-400">ℹ️</span>
                                        <span className="text-[#dadada] text-sm">Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca</span>
                                    </div>

                                    {/* Grid Layout: 3 cards per row on desktop */}
                                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                                        {selectedTimeSlot.sessions.map(session => {
                                            const sessionIdStr = session._id.toString();
                                            const isSelected = selectedSessionsInCurrentModal.includes(sessionIdStr);
                                            const isAlreadyRegistered = isSessionAlreadyRegistered(session._id);

                                            // Debug logging
                                            if (isAlreadyRegistered) {
                                                console.log('🚫 [Session Disabled] Session đã đăng ký:', {
                                                    sessionId: session._id,
                                                    tenBuoiTap: session.tenBuoiTap,
                                                    ngayTap: session.ngayTap || session.ngay,
                                                    gioBatDau: session.gioBatDau,
                                                    scheduleDataCount: scheduleData.length,
                                                    scheduleData: scheduleData.map(s => ({
                                                        buoiTapId: s.buoiTapId,
                                                        tenBuoiTap: s.tenBuoiTap,
                                                        date: s.date
                                                    }))
                                                });
                                            }

                                            // Check if there's another session selected in this time slot
                                            // Sử dụng selectedSessionsInCurrentModal (chỉ chứa sessions trong ca hiện tại)
                                            // Kiểm tra xem có session khác trong ca này đã được chọn không
                                            const hasSelectedInTimeSlot = selectedSessionsInCurrentModal.some(selectedId => {
                                                return selectedId !== sessionIdStr;
                                            });

                                            const isDisabledDueToSelection = hasSelectedInTimeSlot && !isSelected;
                                            // Chỉ disable khi coTheDangKy là false một cách rõ ràng, không phải undefined
                                            const cannotRegister = session.coTheDangKy === false;
                                            const isDisabled = isDisabledDueToSelection || isAlreadyRegistered || cannotRegister;

                                            // Debug logging để xem tại sao session bị disable
                                            if (isDisabled) {
                                                console.log('🚫 [Session Disabled] Lý do disable:', {
                                                    sessionId: session._id,
                                                    tenBuoiTap: session.tenBuoiTap,
                                                    isDisabledDueToSelection: isDisabledDueToSelection,
                                                    isAlreadyRegistered: isAlreadyRegistered,
                                                    cannotRegister: cannotRegister,
                                                    coTheDangKy: session.coTheDangKy,
                                                    coTheDangKyType: typeof session.coTheDangKy,
                                                    hasSelectedInTimeSlot: hasSelectedInTimeSlot,
                                                    isSelected: isSelected,
                                                    selectedSessionsInCurrentModal: selectedSessionsInCurrentModal,
                                                    selectedSessionsToAdd: selectedSessionsToAdd,
                                                    timeSlot: selectedTimeSlot.timeSlot.label,
                                                    dayName: selectedTimeSlot.dayName,
                                                    sessionsInSlot: selectedTimeSlot.sessions.map(s => ({
                                                        id: s._id.toString(),
                                                        tenBuoiTap: s.tenBuoiTap,
                                                        isInSelectedList: selectedSessionsInCurrentModal.includes(s._id.toString())
                                                    }))
                                                });
                                            }

                                            const sessionStatusInfo = getDetailedCountdown(session.ngayTap || session.ngay, session.gioBatDau, session.gioKetThuc);
                                            const workoutTypeInfo = getWorkoutTypeInfo(session.tenBuoiTap, session.moTa, session.templateBuoiTap);

                                            // Get day name from session date
                                            const sessionDate = new Date(session.ngayTap || session.ngay);
                                            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                                            const dayName = dayNames[sessionDate.getDay()];

                                            // Format time
                                            const timeLabel = `${formatTime(session.gioBatDau)} - ${formatTime(session.gioKetThuc)}`;

                                            // Available slots
                                            const availableSlots = (session.soLuongToiDa || 0) - (session.soLuongHienTai || 0);

                                            // Check if upcoming (not finished and not ongoing)
                                            const isUpcoming = !sessionStatusInfo.isFinished && !sessionStatusInfo.isOngoing;

                                            // Check if session is soon (within 24 hours) - for "SẮP DIỄN RA" badge
                                            const isUpcomingSoon = isUpcoming && (sessionStatusInfo.isSoon || sessionStatusInfo.isUrgent || sessionStatusInfo.isCritical);

                                            // Get PT image or placeholder
                                            const ptImage = session.ptPhuTrach?.anhDaiDien || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

                                            return (
                                                <div
                                                    key={session._id}
                                                    className={`w-full h-full flex flex-col bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer relative ${isSelected ? 'ring-2 ring-blue-500' : ''
                                                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    onClick={() => !isDisabled && handleSessionSelect(session)}
                                                >
                                                    {/* Image Container with Badges and Favorite */}
                                                    <div className="relative w-full aspect-video overflow-hidden">
                                                        <img
                                                            src={ptImage}
                                                            alt={session.tenBuoiTap || 'Buổi tập'}
                                                            className="w-full h-full object-cover opacity-90"
                                                        />
                                                        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                                                            {isUpcomingSoon && (
                                                                <span className="bg-[#EF4444] text-white text-xs font-bold px-3 py-1 rounded-full">
                                                                    SẮP DIỄN RA
                                                                </span>
                                                            )}
                                                            <span className="bg-[#8B5CF6] text-white text-xs font-bold px-3 py-1 rounded-full">
                                                                {workoutTypeInfo.difficulty}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-all z-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // TODO: Implement favorite functionality
                                                            }}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* Card Content */}
                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 min-h-[3.5rem] flex-shrink-0">
                                                            {session.tenBuoiTap || 'Buổi tập'} – PT {session.ptPhuTrach?.hoTen || 'N/A'}
                                                        </h3>
                                                        <p className="text-[#A1A1A1] text-sm mb-4 line-clamp-1 min-h-[1.25rem] flex-shrink-0">
                                                            Loại: {workoutTypeInfo.type} · Slot: {session.soLuongHienTai || 0}/{session.soLuongToiDa || 0}
                                                        </p>
                                                        <div className="flex items-center justify-between text-gray-300 text-sm mb-4 min-h-[1.5rem] flex-shrink-0">
                                                            <div className="flex items-center gap-1">
                                                                <span>📅</span>
                                                                <span>{dayName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span>⏰</span>
                                                                <span>{timeLabel}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span>🎟</span>
                                                                <span>{availableSlots} slot</span>
                                                            </div>
                                                        </div>

                                                        {/* Real-time Countdown */}
                                                        <div className="mb-4 p-3 bg-black/30 rounded-lg border border-[#2A2A2A] flex-shrink-0 h-[110px] flex flex-col justify-center">
                                                            {sessionStatusInfo.isFinished ? (
                                                                <div className="flex items-center justify-center gap-2 h-full">
                                                                    <span className="text-xl">✅</span>
                                                                    <span className="text-gray-400 text-sm font-medium">ĐÃ KẾT THÚC</span>
                                                                </div>
                                                            ) : sessionStatusInfo.isOngoing ? (
                                                                <div className="flex items-center justify-center gap-2 h-full">
                                                                    <span className="text-2xl">🔥</span>
                                                                    <span className="text-white font-semibold">ĐANG DIỄN RA</span>
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col justify-center">
                                                                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                                                                        <span className="text-xl">{sessionStatusInfo.icon}</span>
                                                                        <span className="text-white text-xs font-semibold uppercase">
                                                                            {sessionStatusInfo.label || 'Bắt đầu sau:'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-white flex-shrink-0">
                                                                        {sessionStatusInfo.days > 0 && (
                                                                            <div className="flex flex-col items-center">
                                                                                <span className="text-lg font-bold">{sessionStatusInfo.days.toString().padStart(2, '0')}</span>
                                                                                <span className="text-xs text-gray-400">NGÀY</span>
                                                                            </div>
                                                                        )}
                                                                        {(sessionStatusInfo.days > 0 || sessionStatusInfo.hours > 0) && (
                                                                            <div className="flex flex-col items-center">
                                                                                <span className="text-lg font-bold">{sessionStatusInfo.hours.toString().padStart(2, '0')}</span>
                                                                                <span className="text-xs text-gray-400">GIỜ</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-lg font-bold">{sessionStatusInfo.minutes.toString().padStart(2, '0')}</span>
                                                                            <span className="text-xs text-gray-400">PHÚT</span>
                                                                        </div>
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-lg font-bold">{sessionStatusInfo.seconds.toString().padStart(2, '0')}</span>
                                                                            <span className="text-xs text-gray-400">GIÂY</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1"></div>

                                                        <button
                                                            className={`w-full bg-black text-white py-2 rounded-xl font-medium hover:bg-[#2A2A2A] transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${isSelected ? 'bg-green-600 hover:bg-green-700' : ''
                                                                }`}
                                                            disabled={isDisabled || availableSlots <= 0 || sessionStatusInfo.isFinished}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isDisabled && availableSlots > 0 && !sessionStatusInfo.isFinished) {
                                                                    handleSessionSelect(session);
                                                                }
                                                            }}
                                                        >
                                                            {isAlreadyRegistered ? (
                                                                'Đã đăng ký'
                                                            ) : isSelected ? (
                                                                '✓ Đã chọn'
                                                            ) : availableSlots <= 0 ? (
                                                                'Đã đầy'
                                                            ) : sessionStatusInfo.isFinished ? (
                                                                'Đã kết thúc'
                                                            ) : (
                                                                'Đăng ký buổi tập'
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Disabled Overlay */}
                                                    {isDisabled && (
                                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                                                            <span className="text-white text-sm font-medium">
                                                                {isAlreadyRegistered ? 'Đã đăng ký buổi tập này' : 'Đã chọn buổi khác trong ca này'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-sessions text-center py-12">
                                    <div className="text-5xl mb-4">📅</div>
                                    <h4 className="text-white text-lg font-semibold mb-2">Không có buổi tập trong ca này</h4>
                                    <p className="text-gray-400 text-sm">Hiện tại chưa có buổi tập nào được tổ chức trong khung giờ này.</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeSessionModal}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xác nhận hủy buổi tập */}
            {showCancelConfirm && sessionToCancel && (
                <div className="modal-overlay" onClick={() => setShowCancelConfirm(false)}>
                    <div className="modal-content cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Xác nhận hủy buổi tập</h2>
                            <button className="modal-close" onClick={() => setShowCancelConfirm(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Bạn có chắc chắn muốn hủy buổi tập này?</p>
                            <div className="session-detail-cancel">
                                <div className="detail-row">
                                    <div className="detail-label">Tên buổi tập:</div>
                                    <div className="detail-value">{sessionToCancel.tenBuoiTap}</div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label">Ngày tập:</div>
                                    <div className="detail-value">
                                        {sessionToCancel.date.toLocaleDateString('vi-VN', {
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
                                        {sessionToCancel.gioBatDau} - {sessionToCancel.gioKetThuc}
                                    </div>
                                </div>
                            </div>
                            {error && <div className="error-message">{error}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setShowCancelConfirm(false);
                                    setSessionToCancel(null);
                                    setError(null);
                                }}
                                disabled={cancelingSession}
                            >
                                Không
                            </button>
                            <button
                                className="btn-confirm-cancel"
                                onClick={handleCancelSession}
                                disabled={cancelingSession}
                            >
                                {cancelingSession ? 'Đang hủy...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Week Registration Modal */}
            {showRegistrationModal && (
                <WeekRegistrationModal
                    onClose={() => {
                        setShowRegistrationModal(false);
                        setSelectedSessions([]);
                        setAvailableSessions([]);
                    }}
                    nextWeekStart={nextWeekStart}
                    registrationEligibility={registrationEligibility}
                    onSuccess={() => {
                        setShowRegistrationModal(false);
                        setSelectedSessions([]);
                        setAvailableSessions([]);
                        fetchScheduleData();
                        // Refresh eligibility
                        if (userId) {
                            api.get('/lichtap/check-registration-eligibility').then(response => {
                                if (response) {
                                    setCanRegister(response.canRegister || false);
                                    setRegistrationEligibility(response);
                                }
                            }).catch(console.error);
                        }
                        // Refresh notifications để cập nhật sau khi đăng ký
                        window.dispatchEvent(new Event('refreshNotifications'));
                    }}
                />
            )}
        </>
    );
};

// Week Registration Modal Component
const WeekRegistrationModal = ({ onClose, nextWeekStart, registrationEligibility, onSuccess }) => {
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const userId = authUtils.getUserId();

    const loadAvailableSessions = async () => {
        if (!nextWeekStart || !registrationEligibility?.activePackage) return;

        setLoading(true);
        setError(null);

        try {
            const { goiTapId, chiNhanhId, tenGoiTap } = registrationEligibility.activePackage;

            console.log('🔍 [Frontend] Loading available sessions with package:', {
                goiTapId,
                chiNhanhId,
                tenGoiTap,
                isWeekendPackage: tenGoiTap?.toLowerCase().includes('weekend') || tenGoiTap?.toLowerCase().includes('cuối tuần'),
                nextWeekStart: nextWeekStart.toISOString()
            });

            const response = await api.get('/lichtap/available-sessions', {
                chiNhanhId: chiNhanhId,
                tuanBatDau: nextWeekStart.toISOString(),
                goiTapId: goiTapId
            });

            console.log('📡 [Frontend] Available sessions response:', {
                success: response?.success,
                sessionsCount: response?.data?.sessions?.length || 0,
                sessions: response?.data?.sessions?.slice(0, 5).map(s => ({
                    tenBuoiTap: s.tenBuoiTap,
                    ngayTap: s.ngayTap || s.ngay,
                    gioBatDau: s.gioBatDau
                }))
            });

            if (response && response.success && response.data) {
                setAvailableSessions(response.data.sessions || []);
            } else {
                setError('Không thể tải danh sách buổi tập');
            }
        } catch (err) {
            console.error('Error loading available sessions:', err);
            setError('Lỗi khi tải danh sách buổi tập');
        } finally {
            setLoading(false);
        }
    };

    const weekDays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const weekDaysShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    useEffect(() => {
        if (nextWeekStart && registrationEligibility?.activePackage) {
            loadAvailableSessions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nextWeekStart, registrationEligibility]);

    const getNextWeekDays = () => {
        if (!nextWeekStart) return [];
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(nextWeekStart);
            date.setDate(nextWeekStart.getDate() + i);
            days.push({
                date,
                dayOfWeek: date.getDay(),
                dayName: weekDays[date.getDay()],
                dayShort: weekDaysShort[date.getDay()]
            });
        }
        return days;
    };

    const getSessionsForDay = (date) => {
        if (!availableSessions || availableSessions.length === 0) return [];
        const dateStr = date.toDateString();
        return availableSessions.filter(session => {
            const sessionDate = new Date(session.ngay);
            return sessionDate.toDateString() === dateStr && session.coTheDangKy;
        });
    };

    const toggleSessionSelection = (session) => {
        setSelectedSessions(prev => {
            const isSelected = prev.some(s => s._id === session._id);
            if (isSelected) {
                return prev.filter(s => s._id !== session._id);
            } else {
                return [...prev, session];
            }
        });
    };

    const isSessionSelected = (sessionId) => {
        return selectedSessions.some(s => s._id === sessionId);
    };

    const handleSubmit = async () => {
        if (selectedSessions.length === 0) {
            setError('Vui lòng chọn ít nhất một buổi tập');
            return;
        }

        if (!registrationEligibility?.activePackage) {
            setError('Không tìm thấy thông tin gói tập');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { goiTapId, chiNhanhId } = registrationEligibility.activePackage;
            const scheduleData = {
                goiTapId: goiTapId,
                chiNhanhId: chiNhanhId,
                tuanBatDau: nextWeekStart.toISOString(),
                soNgayTapTrongTuan: selectedSessions.length,
                gioTapUuTien: [],
                danhSachBuoiTap: selectedSessions.map(session => ({
                    buoiTapId: session._id,
                    ngayTap: session.ngay,
                    gioBatDau: session.gioBatDau,
                    gioKetThuc: session.gioKetThuc,
                    ptPhuTrach: session.ptPhuTrach?._id || session.ptPhuTrach
                }))
            };

            const response = await api.post('/lichtap/create-schedule', scheduleData);

            if (response && response.success) {
                onSuccess();
            } else {
                setError(response?.message || 'Đăng ký thất bại');
            }
        } catch (err) {
            console.error('Error submitting registration:', err);
            setError(err.message || 'Lỗi khi đăng ký lịch tập');
        } finally {
            setSubmitting(false);
        }
    };

    const weekDaysList = getNextWeekDays();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="week-registration-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Đăng ký lịch tập tuần sau</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {nextWeekStart && (
                        <div className="week-info">
                            <p className="week-range">
                                Tuần từ {nextWeekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} đến {' '}
                                {new Date(nextWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {loading ? (
                        <div className="loading-sessions">
                            <div className="loading-spinner"></div>
                            <p>Đang tải danh sách buổi tập...</p>
                        </div>
                    ) : (
                        <div className="week-calendar-grid">
                            {weekDaysList.map((day, index) => {
                                const daySessions = getSessionsForDay(day.date);
                                return (
                                    <div key={index} className="week-day-column">
                                        <div className="day-header">
                                            <div className="day-name">{day.dayShort}</div>
                                            <div className="day-date">{day.date.getDate()}/{day.date.getMonth() + 1}</div>
                                        </div>
                                        <div className="day-sessions">
                                            {daySessions.length === 0 ? (
                                                <div className="no-sessions">Không có buổi tập</div>
                                            ) : (
                                                daySessions.map(session => (
                                                    <div
                                                        key={session._id}
                                                        className={`session-card ${isSessionSelected(session._id) ? 'selected' : ''}`}
                                                        onClick={() => toggleSessionSelection(session)}
                                                    >
                                                        <div className="session-time">
                                                            {session.gioBatDau} - {session.gioKetThuc}
                                                        </div>
                                                        <div className="session-title">{session.tenBuoiTap || 'Buổi tập'}</div>
                                                        <div className="session-pt">
                                                            PT: {session.ptPhuTrach?.hoTen || 'Chưa có PT'}
                                                        </div>
                                                        <div className="session-slots">
                                                            Còn {session.conChoTrong} chỗ trống
                                                        </div>
                                                        {isSessionSelected(session._id) && (
                                                            <div className="session-checkmark">✓</div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedSessions.length > 0 && (
                        <div className="selected-sessions-summary">
                            Đã chọn {selectedSessions.length} buổi tập
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>
                        Hủy
                    </button>
                    <button
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={submitting || selectedSessions.length === 0 || loading}
                    >
                        {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Schedule;
