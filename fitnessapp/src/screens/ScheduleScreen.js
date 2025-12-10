import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    RefreshControl,
    Modal,
    ActivityIndicator,
    Alert,
    PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ScheduleScreen = () => {
    const { userInfo } = useAuth();
    const userId = userInfo?._id;

    // States
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [selectedSession, setSelectedSession] = useState(null);
    const [showSessionDetail, setShowSessionDetail] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [canRegister, setCanRegister] = useState(false);
    const [registrationEligibility, setRegistrationEligibility] = useState(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showAddSessionModal, setShowAddSessionModal] = useState(false);
    const [availableSessionsThisWeek, setAvailableSessionsThisWeek] = useState([]);
    const [loadingAvailableSessions, setLoadingAvailableSessions] = useState(false);
    const [selectedSessionsToAdd, setSelectedSessionsToAdd] = useState([]);
    const [addingSessions, setAddingSessions] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); // For showing sessions in a time slot
    const [showSessionSelectionModal, setShowSessionSelectionModal] = useState(false);
    const weekScrollRef = useRef(null);
    const monthScrollRef = useRef(null);

    // PanResponder for month swipe gesture
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 50) {
                    // Swipe right -> previous month
                    const prevDate = new Date(currentMonth);
                    prevDate.setMonth(prevDate.getMonth() - 1);
                    setCurrentMonth(prevDate);
                } else if (gestureState.dx < -50) {
                    // Swipe left -> next month
                    const nextDate = new Date(currentMonth);
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    setCurrentMonth(nextDate);
                }
            },
        })
    ).current;

    const weekDaysShort = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    const sessionColors = [
        '#FFB6C1', '#B0E0E6', '#DDA0DD', '#F0E68C', '#FFE4B5',
        '#98FB98', '#FFD700', '#FFA07A', '#87CEEB', '#DEB887'
    ];

    const getSessionColor = (index) => {
        return sessionColors[index % sessionColors.length];
    };

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Check registration eligibility
    useEffect(() => {
        const checkRegistrationEligibility = async () => {
            if (!userId || userInfo?.vaiTro !== 'HoiVien') {
                setCanRegister(false);
                return;
            }

            try {
                const response = await apiService.apiCall('/lichtap/check-registration-eligibility', 'GET', null, true);
                if (response && response.success !== undefined) {
                    setCanRegister(response.canRegister || false);
                    setRegistrationEligibility(response);
                }
            } catch (error) {
                console.error('Error checking registration eligibility:', error);
            }
        };

        checkRegistrationEligibility();
        const intervalId = setInterval(checkRegistrationEligibility, 60000);
        return () => clearInterval(intervalId);
    }, [userId, userInfo]);

    // Check registration eligibility
    useEffect(() => {
        const checkRegistrationEligibility = async () => {
            if (!userId || userInfo?.vaiTro !== 'HoiVien') {
                setCanRegister(false);
                return;
            }

            try {
                const response = await apiService.apiCall('/lichtap/check-registration-eligibility', 'GET', null, true);
                if (response && response.success !== undefined) {
                    setCanRegister(response.canRegister || false);
                    setRegistrationEligibility(response);
                }
            } catch (error) {
                console.error('Error checking registration eligibility:', error);
            }
        };

        checkRegistrationEligibility();
        const intervalId = setInterval(checkRegistrationEligibility, 60000);
        return () => clearInterval(intervalId);
    }, [userId, userInfo]);

    // Fetch schedule data
    useEffect(() => {
        if (userId) {
            fetchScheduleData();
        }
    }, [userId]);

    const fetchScheduleData = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.apiCall(`/lichtap/member/${userId}`, 'GET', null, true);

            if (response && response.data) {
                const transformedData = transformScheduleData(response.data);
                setScheduleData(transformedData);
            } else {
                setScheduleData([]);
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError('Không thể tải lịch tập');
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
                    const buoiTapId = buoiTapInfo._id
                        ? buoiTapInfo._id.toString()
                        : (buoi.buoiTap?.toString ? buoi.buoiTap.toString() : buoi.buoiTap);

                    sessions.push({
                        id: buoi._id || buoiTapInfo._id,
                        buoiTapId: buoiTapId,
                        tenBuoiTap: buoiTapInfo.tenBuoiTap || buoi.tenBuoiTap || 'Buổi tập',
                        date: new Date(buoi.ngayTap),
                        gioBatDau: buoi.gioBatDau,
                        gioKetThuc: buoi.gioKetThuc,
                        ptPhuTrach: buoi.ptPhuTrach?.hoTen || buoiTapInfo.ptPhuTrach?.hoTen || 'Chưa có PT',
                        chiNhanh: lichTap.chiNhanh?.tenChiNhanh || 'Chưa có chi nhánh',
                        trangThai: buoi.trangThai || 'DA_DANG_KY',
                        color: getSessionColor(colorIndex++),
                        cacBaiTap: buoiTapInfo.cacBaiTap || []
                    });
                });
            }
        });
        return sessions;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchScheduleData();
        setRefreshing(false);
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
        setShowSessionDetail(true);
    };

    const closeSessionDetail = () => {
        setShowSessionDetail(false);
        setSelectedSession(null);
    };

    // Handlers for registration
    const handleOpenRegistration = () => {
        if (!canRegister) {
            Alert.alert(
                'Không thể đăng ký',
                registrationEligibility?.message || 'Chỉ có thể đăng ký vào Thứ 7 hoặc Chủ nhật từ 12h trưa trở đi'
            );
            return;
        }
        setShowRegistrationModal(true);
    };

    const handleOpenAddSessionModal = async () => {
        const canAddExtraSessions = registrationEligibility?.hasCompletedPackage === true;

        if (!canAddExtraSessions) {
            Alert.alert(
                'Không thể đăng ký',
                registrationEligibility?.message || 'Bạn cần hoàn tất quy trình đăng ký gói tập trước khi đăng ký thêm buổi tập'
            );
            return;
        }

        setShowAddSessionModal(true);
        setSelectedSessionsToAdd([]);
        await fetchScheduleData();
        await loadAvailableSessionsThisWeek();
    };

    const loadAvailableSessionsThisWeek = async () => {
        setLoadingAvailableSessions(true);
        try {
            console.log('🔄 Loading available sessions...');
            const response = await apiService.apiCall('/lichtap/available-sessions-this-week', 'GET', null, true);
            console.log('📦 API Response:', {
                success: response?.success,
                dataLength: response?.data?.length,
                sampleData: response?.data?.[0]
            });
            if (response && response.success) {
                setAvailableSessionsThisWeek(response.data || []);
                console.log('✅ Set availableSessionsThisWeek:', response.data?.length, 'sessions');
            } else {
                console.log('❌ API call failed or no success');
            }
        } catch (err) {
            console.error('❌ Error loading available sessions:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách buổi tập');
        } finally {
            setLoadingAvailableSessions(false);
        }
    };

    const handleAddSessions = async () => {
        if (selectedSessionsToAdd.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một buổi tập');
            return;
        }

        setAddingSessions(true);
        try {
            const results = await Promise.allSettled(
                selectedSessionsToAdd.map(buoiTapId =>
                    apiService.apiCall('/lichtap/register-session', 'POST', { buoiTapId }, true)
                )
            );

            const failed = results.filter(r => r.status === 'rejected' || (r.value && !r.value.success));
            if (failed.length > 0) {
                Alert.alert('Thông báo', 'Một số buổi tập đăng ký thất bại');
            } else {
                await fetchScheduleData();
                setShowAddSessionModal(false);
                setSelectedSessionsToAdd([]);
                Alert.alert('Thành công', 'Đăng ký buổi tập thành công!');
            }
        } catch (err) {
            console.error('Error adding sessions:', err);
            Alert.alert('Lỗi', 'Lỗi khi đăng ký buổi tập');
        } finally {
            setAddingSessions(false);
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
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        const days = [];
        const weekDaysNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const today = new Date();
            days.push({
                date: date.toISOString(),
                dayName: weekDaysNames[date.getDay()],
                dayShort: weekDaysShort[date.getDay()],
                isToday: date.toDateString() === today.toDateString()
            });
        }
        return days;
    };

    // Get sessions for a time slot
    const getSessionsForTimeSlot = (dayDate, timeSlot) => {
        return availableSessionsThisWeek.filter(session => {
            const sessionDate = new Date(session.ngayTap);
            const dayDateObj = new Date(dayDate);

            const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
            const dayDateOnly = new Date(dayDateObj.getFullYear(), dayDateObj.getMonth(), dayDateObj.getDate());

            if (sessionDateOnly.getTime() !== dayDateOnly.getTime()) {
                return false;
            }

            const sessionStart = session.gioBatDau ? session.gioBatDau.substring(0, 5) : '';
            const sessionEnd = session.gioKetThuc ? session.gioKetThuc.substring(0, 5) : '';

            if (!sessionStart || !sessionEnd) return false;

            return (sessionStart >= timeSlot.start && sessionStart < timeSlot.end) ||
                (timeSlot.start >= sessionStart && timeSlot.start < sessionEnd);
        });
    };

    // Get time slot status
    const getTimeSlotStatus = (dayDate, timeSlot) => {
        const now = new Date();
        const slotDateTime = new Date(dayDate);
        const [hours] = timeSlot.start.split(':');
        slotDateTime.setHours(parseInt(hours), 0, 0, 0);

        if (slotDateTime < now) return 'past';

        const sessionsInSlot = getSessionsForTimeSlot(dayDate, timeSlot);
        if (sessionsInSlot.length === 0) return 'empty';

        const hasSelected = sessionsInSlot.some(s => selectedSessionsToAdd.includes(s._id));
        if (hasSelected) return 'selected';

        return 'available';
    };

    const handleTimeSlotClick = (dayDate, timeSlot) => {
        console.log('🎯 Time slot clicked:', {
            dayDate,
            timeSlot: timeSlot.label,
            totalSessions: availableSessionsThisWeek.length
        });

        const sessionsInSlot = getSessionsForTimeSlot(dayDate, timeSlot);
        console.log('📋 Sessions in slot:', sessionsInSlot.length, sessionsInSlot);

        if (sessionsInSlot.length === 0) {
            console.log('❌ No sessions found in this slot');
            return;
        }

        const weekDayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayName = weekDayNames[new Date(dayDate).getDay()];

        setSelectedTimeSlot({
            date: dayDate,
            timeSlot,
            sessions: sessionsInSlot,
            dayName
        });

        // Close the week grid modal first to avoid z-index conflicts
        setShowAddSessionModal(false);

        // Small delay to ensure smooth transition between modals
        setTimeout(() => {
            setShowSessionSelectionModal(true);
        }, 100);

        console.log('✅ Opening session selection modal');
    };

    const handleSessionSelect = (session) => {
        const isSelected = selectedSessionsToAdd.includes(session._id);

        if (isSelected) {
            setSelectedSessionsToAdd(prev => prev.filter(id => id !== session._id));
        } else {
            // Check if already selected a session in the same time slot
            const hasSelectedInSlot = selectedSessionsToAdd.some(selectedId => {
                const selectedSession = availableSessionsThisWeek.find(s => s._id === selectedId);
                if (!selectedSession) return false;

                const sDate = new Date(selectedSession.ngayTap).toDateString();
                const sessionDate = new Date(session.ngayTap).toDateString();
                const sStart = selectedSession.gioBatDau?.substring(0, 5);
                const sessionStart = session.gioBatDau?.substring(0, 5);

                return sDate === sessionDate && sStart === sessionStart;
            });

            if (hasSelectedInSlot) {
                Alert.alert('Thông báo', 'Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca');
                return;
            }

            setSelectedSessionsToAdd(prev => [...prev, session._id]);
        }

        // Close session modal and return to week grid
        setShowSessionSelectionModal(false);
        setTimeout(() => {
            setShowAddSessionModal(true);
        }, 100);
    };

    const handleCloseSessionModal = () => {
        setShowSessionSelectionModal(false);
        setTimeout(() => {
            setShowAddSessionModal(true);
        }, 100);
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

    // Navigation functions
    const prevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(prev.getMonth() - 1);
        setCurrentMonth(prev);
    };

    const nextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + 1);
        setCurrentMonth(next);
    };

    const prevWeek = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 7);
        setSelectedDate(prev);
    };

    const nextWeek = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 7);
        setSelectedDate(next);
    };

    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const nextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    // Get calendar days for month view
    const getCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const days = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = adjustedStartDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay - i);
            days.push({ date, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({ date, isCurrentMonth: true });
        }

        // Next month days - chỉ đủ để fill hàng cuối cùng
        const totalDays = days.length;
        const weeksNeeded = Math.ceil(totalDays / 7);
        const remainingDays = (weeksNeeded * 7) - totalDays;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isCurrentMonth: false });
        }

        return days;
    };

    // Get week days
    const getWeekDays = () => {
        const startOfWeek = new Date(selectedDate);
        const dayOfWeek = startOfWeek.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(startOfWeek.getDate() - adjustedDay);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    // Get sessions for a specific date
    const getSessionsForDate = (date) => {
        return scheduleData.filter(session =>
            session.date.toDateString() === date.toDateString()
        );
    };

    // Check if date is today
    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Get countdown for session
    const getCountdown = (sessionDate, gioBatDau, gioKetThuc) => {
        const now = new Date();
        const [hours, minutes] = gioBatDau.split(':').map(Number);
        const [endHours, endMinutes] = gioKetThuc.split(':').map(Number);

        const startTime = new Date(sessionDate);
        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHours, endMinutes, 0, 0);

        const timeDiff = startTime.getTime() - now.getTime();
        const endTimeDiff = endTime.getTime() - now.getTime();

        if (endTimeDiff <= 0) {
            return { status: 'finished', text: 'ĐÃ KẾT THÚC', color: '#6B7280' };
        }

        if (timeDiff <= 0 && endTimeDiff > 0) {
            return { status: 'ongoing', text: 'ĐANG DIỄN RA', color: '#FF914D' };
        }

        const hours24 = Math.floor(timeDiff / (1000 * 60 * 60));
        const mins = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours24 < 1) {
            return {
                status: 'critical',
                text: `Còn ${mins} phút`,
                color: '#FF6B6B'
            };
        } else if (hours24 < 24) {
            return {
                status: 'soon',
                text: `Còn ${hours24} giờ ${mins} phút`,
                color: '#00FFC6'
            };
        } else {
            const days = Math.floor(hours24 / 24);
            return {
                status: 'upcoming',
                text: `Còn ${days} ngày`,
                color: '#00FFC6'
            };
        }
    };

    // Render Month View
    const renderMonthView = () => {
        const days = getCalendarDays();

        return (
            <View {...panResponder.panHandlers} style={{ flex: 1 }}>
                <View style={styles.monthView}>
                    {/* Weekday headers */}
                    <View style={styles.weekdayHeader}>
                        {weekDaysShort.map((day, index) => (
                            <View key={index} style={styles.weekdayCell}>
                                <Text style={styles.weekdayText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.calendarGrid}>
                        {days.map((day, index) => {
                            const sessions = getSessionsForDate(day.date);
                            const today = isToday(day.date);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        !day.isCurrentMonth && styles.dayCellOtherMonth,
                                        today && styles.dayCellToday
                                    ]}
                                    onPress={() => {
                                        if (sessions.length > 0) {
                                            setSelectedDate(day.date);
                                            setViewMode('day');
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.dayNumber,
                                        !day.isCurrentMonth && styles.dayNumberOther,
                                        today && styles.dayNumberToday
                                    ]}>
                                        {day.date.getDate()}
                                    </Text>
                                    <View style={styles.dayEvents}>
                                        {sessions.slice(0, 2).map((session, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.eventDot,
                                                    { backgroundColor: session.color }
                                                ]}
                                            />
                                        ))}
                                        {sessions.length > 2 && (
                                            <Text style={styles.moreEvents}>+{sessions.length - 2}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    // Render Week View
    const renderWeekView = () => {
        const weekDays = getWeekDays();
        const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

        // Calculate timeline position for current time
        const now = currentTime;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timelineTop = ((currentHour - 6) * 60) + currentMinute;
        const showTimeline = currentHour >= 6 && currentHour < 24;

        const handleScroll = (event) => {
            const scrollY = event.nativeEvent.contentOffset.y;
            // Sync scroll across all day columns
            weekDays.forEach((_, index) => {
                const dayScrollView = weekScrollRef.current?.[index];
                if (dayScrollView) {
                    dayScrollView.scrollTo({ y: scrollY, animated: false });
                }
            });
        };

        return (
            <View style={styles.weekView}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.weekScrollHorizontal}
                >
                    <View style={styles.weekContainer}>
                        {/* Time column */}
                        <View style={styles.timeColumn}>
                            <View style={styles.timeColumnHeader} />
                            <ScrollView
                                style={styles.timeScrollView}
                                showsVerticalScrollIndicator={false}
                                scrollEventThrottle={16}
                                onScroll={handleScroll}
                                ref={(ref) => {
                                    if (!weekScrollRef.current) weekScrollRef.current = [];
                                    weekScrollRef.current[-1] = ref;
                                }}
                            >
                                {hours.map(hour => (
                                    <View key={hour} style={styles.timeSlot}>
                                        <Text style={styles.timeLabel}>{hour}:00</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Day columns */}
                        {weekDays.filter(d => d instanceof Date).map((date, dayIndex) => {
                            const sessions = getSessionsForDate(date);
                            const today = isToday(date);
                            const showTimelineInThisColumn = today && showTimeline;
                            const dayOfWeek = date.getDay();
                            const weekDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                            return (
                                <View
                                    key={dayIndex}
                                    style={[styles.dayColumn, today && styles.dayColumnToday]}
                                >
                                    <View style={styles.dayHeader}>
                                        <Text style={styles.dayHeaderName}>{weekDaysShort[weekDayIndex]}</Text>
                                        <Text style={styles.dayHeaderDate}>{date.getDate()}/{date.getMonth() + 1}</Text>
                                    </View>
                                    <ScrollView
                                        style={styles.dayScrollView}
                                        showsVerticalScrollIndicator={false}
                                        scrollEventThrottle={16}
                                        scrollEnabled={false}
                                        ref={(ref) => {
                                            if (!weekScrollRef.current) weekScrollRef.current = [];
                                            weekScrollRef.current[dayIndex] = ref;
                                        }}
                                    >
                                        <View style={styles.hourCells}>
                                            {hours.map(hour => (
                                                <View key={hour} style={styles.hourCell} />
                                            ))}
                                            {sessions.map((session, idx) => {
                                                const [startHour] = session.gioBatDau.split(':').map(Number);
                                                const top = (startHour - 6) * 60;
                                                return (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={[
                                                            styles.weekSession,
                                                            {
                                                                backgroundColor: session.color,
                                                                top: top,
                                                            }
                                                        ]}
                                                        onPress={() => handleSessionClick(session)}
                                                    >
                                                        <Text style={styles.weekSessionTime}>
                                                            {session.gioBatDau.substring(0, 5)}
                                                        </Text>
                                                        <Text style={styles.weekSessionTitle} numberOfLines={1}>
                                                            {session.tenBuoiTap}
                                                        </Text>
                                                        <Text style={styles.weekSessionPT} numberOfLines={1}>
                                                            PT: {session.ptPhuTrach}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                            {/* Current time timeline */}
                                            {showTimelineInThisColumn && (
                                                <View style={[styles.currentTimeline, { top: timelineTop }]}>
                                                    <View style={styles.timelineDot} />
                                                    <View style={styles.timelineLine} />
                                                </View>
                                            )}
                                        </View>
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        );
    };

    // Render Day View
    const renderDayView = () => {
        const sessions = getSessionsForDate(selectedDate);
        console.log('📅 Day view sessions:', sessions);

        return (
            <ScrollView
                style={styles.dayView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {sessions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="event-busy" size={64} color="#666" />
                        <Text style={styles.emptyText}>Không có buổi tập nào</Text>
                    </View>
                ) : (
                    sessions.map((session, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.sessionCard, { borderLeftColor: session.color }]}
                            onPress={() => handleSessionClick(session)}
                        >
                            <View style={styles.sessionHeader}>
                                <Text style={styles.sessionTitle}>{session.tenBuoiTap}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.trangThai) }]}>
                                    <Text style={styles.statusText}>{getStatusText(session.trangThai)}</Text>
                                </View>
                            </View>

                            <View style={styles.sessionInfo}>
                                <View style={styles.infoRow}>
                                    <MaterialIcons name="access-time" size={16} color="#10b981" />
                                    <Text style={styles.infoText}>
                                        {session.gioBatDau?.substring(0, 5)} - {session.gioKetThuc?.substring(0, 5)}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <MaterialIcons name="person" size={16} color="#3b82f6" />
                                    <Text style={styles.infoText}>PT: {session.ptPhuTrach}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <MaterialIcons name="location-on" size={16} color="#f59e0b" />
                                    <Text style={styles.infoText}>{session.chiNhanh}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        );
    };

    // Session Detail Modal
    const renderSessionDetailModal = () => {
        if (!selectedSession) return null;

        const countdown = getCountdown(selectedSession.date, selectedSession.gioBatDau, selectedSession.gioKetThuc);

        return (
            <Modal
                visible={showSessionDetail}
                animationType="slide"
                transparent={true}
                onRequestClose={closeSessionDetail}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedSession.tenBuoiTap}</Text>
                            <TouchableOpacity onPress={closeSessionDetail}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={[styles.countdownBanner, { backgroundColor: countdown.color }]}>
                                <Text style={styles.countdownBannerText}>{countdown.text}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Thời gian</Text>
                                <Text style={styles.detailValue}>
                                    {selectedSession.gioBatDau.substring(0, 5)} - {selectedSession.gioKetThuc.substring(0, 5)}
                                </Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Ngày tập</Text>
                                <Text style={styles.detailValue}>
                                    {selectedSession.date.toLocaleDateString('vi-VN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>PT phụ trách</Text>
                                <Text style={styles.detailValue}>{selectedSession.ptPhuTrach}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Chi nhánh</Text>
                                <Text style={styles.detailValue}>{selectedSession.chiNhanh}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Trạng thái</Text>
                                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedSession.trangThai) }]}>
                                    <Text style={styles.statusTextLarge}>{getStatusText(selectedSession.trangThai)}</Text>
                                </View>
                            </View>

                            {selectedSession.cacBaiTap && selectedSession.cacBaiTap.length > 0 && (
                                <View style={styles.exercisesSection}>
                                    <Text style={styles.exercisesTitle}>Danh sách bài tập ({selectedSession.cacBaiTap.length})</Text>
                                    {selectedSession.cacBaiTap.map((exercise, idx) => (
                                        <View key={idx} style={styles.exerciseItem}>
                                            <Text style={styles.exerciseName}>
                                                {idx + 1}. {exercise.baiTap?.tenBaiTap || 'Bài tập'}
                                            </Text>
                                            <Text style={styles.exerciseDetails}>
                                                {exercise.soSet} sets × {exercise.soLanLap} reps
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading && scheduleData.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#da2128" />
                <Text style={styles.loadingText}>Đang tải lịch tập...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Lịch tập của tôi</Text>
            </View>

            {/* Registration Buttons */}
            <View style={styles.registrationButtons}>
                <TouchableOpacity
                    style={[styles.registerBtn, !canRegister && styles.registerBtnDisabled]}
                    onPress={handleOpenRegistration}
                    disabled={!canRegister}
                >
                    <Text style={[styles.registerBtnText, !canRegister && styles.registerBtnTextDisabled]}>
                        Đăng ký lịch tập tuần sau
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.addSessionBtn,
                        !(registrationEligibility?.hasCompletedPackage === true) && styles.addSessionBtnDisabled
                    ]}
                    onPress={handleOpenAddSessionModal}
                    disabled={!(registrationEligibility?.hasCompletedPackage === true)}
                >
                    <Text style={[
                        styles.addSessionBtnText,
                        !(registrationEligibility?.hasCompletedPackage === true) && styles.addSessionBtnTextDisabled
                    ]}>
                        Đăng ký thêm buổi tập
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Navigation & View Mode Toggle */}
            <View style={styles.topBar}>
                <View style={styles.navControls}>
                    <TouchableOpacity
                        onPress={viewMode === 'month' ? prevMonth : viewMode === 'week' ? prevWeek : prevDay}
                        style={styles.navButton}
                    >
                        <MaterialIcons name="chevron-left" size={28} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.dateTitle}>
                        {viewMode === 'month' && `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
                        {viewMode === 'week' && `Tuần ${Math.ceil(selectedDate.getDate() / 7)}, ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
                        {viewMode === 'day' && selectedDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>

                    <TouchableOpacity
                        onPress={viewMode === 'month' ? nextMonth : viewMode === 'week' ? nextWeek : nextDay}
                        style={styles.navButton}
                    >
                        <MaterialIcons name="chevron-right" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.viewModeToggle}>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('month')}
                    >
                        <Text style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}>
                            Tháng
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('week')}
                    >
                        <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
                            Tuần
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('day')}
                    >
                        <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>
                            Ngày
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </View>

            {/* Session Detail Modal */}
            {renderSessionDetailModal()}

            {/* Add Session Modal */}
            <Modal
                visible={showAddSessionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddSessionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Đăng ký thêm buổi tập</Text>
                            <TouchableOpacity onPress={() => setShowAddSessionModal(false)}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {loadingAvailableSessions ? (
                                <View style={styles.emptyContainer}>
                                    <ActivityIndicator size="large" color="#da2128" />
                                    <Text style={styles.emptyText}>Đang tải...</Text>
                                </View>
                            ) : availableSessionsThisWeek.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <MaterialIcons name="event-busy" size={48} color="#999" />
                                    <Text style={styles.emptyText}>Không có buổi tập nào trong tuần này</Text>
                                </View>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.weekContentGrid}
                                >
                                    {getCurrentWeekDays().map((day, dayIndex) => {
                                        const dayDate = new Date(day.date);
                                        return (
                                            <View key={dayIndex} style={styles.dayColumnGrid}>
                                                <View style={[styles.dayHeaderGrid, day.isToday && styles.dayHeaderToday]}>
                                                    <Text style={styles.dayNameText}>{day.dayShort}</Text>
                                                    <Text style={styles.dayDateText}>
                                                        {dayDate.getDate()}/{dayDate.getMonth() + 1}
                                                    </Text>
                                                    {/* {day.isToday && (
                                                        <View style={styles.todayBadge}>
                                                            <Text style={styles.todayBadgeText}>Hôm nay</Text>
                                                        </View>
                                                    )} */}
                                                </View>

                                                <View style={styles.timeSlotsContainer}>
                                                    {TIME_SLOTS.map(timeSlot => {
                                                        const status = getTimeSlotStatus(day.date, timeSlot);
                                                        const sessionsInSlot = getSessionsForTimeSlot(day.date, timeSlot);
                                                        const selectedSessionInSlot = sessionsInSlot.find(session =>
                                                            selectedSessionsToAdd.includes(session._id)
                                                        );

                                                        return (
                                                            <TouchableOpacity
                                                                key={timeSlot.id}
                                                                style={[
                                                                    styles.timeSlotCard,
                                                                    status === 'past' && styles.timeSlotPast,
                                                                    status === 'empty' && styles.timeSlotEmpty,
                                                                    status === 'available' && styles.timeSlotAvailable,
                                                                    status === 'selected' && styles.timeSlotSelected,
                                                                ]}
                                                                onPress={() => handleTimeSlotClick(day.date, timeSlot)}
                                                                disabled={status === 'past' || status === 'empty'}
                                                            >
                                                                <Text style={styles.timeSlotTime}>{timeSlot.label}</Text>
                                                                {status === 'past' && (
                                                                    <Text style={styles.timeSlotStatusText}>Đã qua</Text>
                                                                )}
                                                                {status === 'empty' && (
                                                                    <Text style={styles.timeSlotStatusText}>Trống</Text>
                                                                )}
                                                                {status === 'available' && (
                                                                    <Text style={[styles.timeSlotStatusText, styles.availableText]}>
                                                                        {sessionsInSlot.length} buổi
                                                                    </Text>
                                                                )}
                                                                {status === 'selected' && selectedSessionInSlot && (
                                                                    <Text style={[styles.timeSlotStatusText, styles.selectedText]} numberOfLines={1}>
                                                                        PT: {selectedSessionInSlot.ptPhuTrach?.hoTen || 'N/A'}
                                                                    </Text>
                                                                )}
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </ScrollView>

                        {selectedSessionsToAdd.length > 0 && (
                            <View style={styles.scheduleSummary}>
                                <Text style={styles.summaryTitle}>
                                    Đã chọn: {selectedSessionsToAdd.length} buổi tập
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedSessionsList}>
                                    {selectedSessionsToAdd.map(buoiTapId => {
                                        const session = availableSessionsThisWeek.find(s => s._id === buoiTapId);
                                        if (!session) return null;
                                        const sessionDate = new Date(session.ngayTap);
                                        const weekDayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                        const dayIndex = sessionDate.getDay();

                                        return (
                                            <View key={buoiTapId} style={styles.selectedSessionItem}>
                                                <Text style={styles.selectedSessionDay}>{weekDayNames[dayIndex]}</Text>
                                                <Text style={styles.selectedSessionTime}>
                                                    {session.gioBatDau?.substring(0, 5)} - {session.gioKetThuc?.substring(0, 5)}
                                                </Text>
                                                <Text style={styles.selectedSessionPT} numberOfLines={1}>
                                                    PT: {session.ptPhuTrach?.hoTen || 'N/A'}
                                                </Text>
                                                <TouchableOpacity onPress={() => handleSessionSelect(session)}>
                                                    <Text style={styles.selectedRemove}>×</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {availableSessionsThisWeek.length > 0 && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[
                                        styles.confirmButton,
                                        (addingSessions || selectedSessionsToAdd.length === 0) && styles.confirmButtonDisabled
                                    ]}
                                    onPress={handleAddSessions}
                                    disabled={addingSessions || selectedSessionsToAdd.length === 0}
                                >
                                    {addingSessions ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>
                                            Xác nhận đăng ký ({selectedSessionsToAdd.length} buổi)
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Session Selection Modal (when clicking a time slot) */}
            <Modal
                visible={showSessionSelectionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseSessionModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.sessionModal}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chọn buổi tập</Text>
                                <Text style={styles.modalSubtitle}>
                                    {selectedTimeSlot?.dayName} - {selectedTimeSlot?.timeSlot.label}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleCloseSessionModal}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.modalInfo}>
                                <Text style={styles.modalInfoText}>
                                    ℹ️ Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca
                                </Text>
                            </View>
                            {selectedTimeSlot?.sessions.map(session => {
                                const isSelected = selectedSessionsToAdd.includes(session._id);
                                const availableSlots = (session.soLuongToiDa || 0) - (session.soLuongHienTai || 0);

                                // Check if session is past
                                const now = new Date();
                                const sessionDate = new Date(session.ngayTap);
                                const [endHour, endMinute] = (session.gioKetThuc || '').split(':').map(Number);
                                sessionDate.setHours(endHour, endMinute, 0, 0);
                                const isSessionPast = sessionDate < now;

                                // Don't show past sessions
                                if (isSessionPast) return null;

                                return (
                                    <TouchableOpacity
                                        key={session._id}
                                        style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
                                        onPress={() => handleSessionSelect(session)}
                                    >
                                        <View style={styles.sessionInfo}>
                                            <Text style={styles.sessionName}>{session.tenBuoiTap || 'Buổi tập'}</Text>
                                            <Text style={styles.sessionPT}>
                                                PT: {session.ptPhuTrach?.hoTen || 'N/A'}
                                            </Text>
                                            <Text style={styles.sessionSlots}>
                                                Còn {availableSlots} chỗ
                                            </Text>
                                        </View>
                                        {isSelected && <Text style={styles.sessionCheck}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    registrationButtons: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    registerBtn: {
        flex: 1,
        backgroundColor: '#da2128',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    registerBtnDisabled: {
        backgroundColor: '#3a3a3a',
        opacity: 0.5,
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    registerBtnTextDisabled: {
        color: '#999',
    },
    addSessionBtn: {
        flex: 1,
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    addSessionBtnDisabled: {
        backgroundColor: '#3a3a3a',
        opacity: 0.5,
    },
    addSessionBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    addSessionBtnTextDisabled: {
        color: '#999',
    },
    topBar: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    navControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    navButton: {
        padding: 5,
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    viewModeToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 4,
        borderRadius: 8,
        gap: 8,
    },
    viewModeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    viewModeButtonActive: {
        backgroundColor: '#da2128',
    },
    viewModeText: {
        fontSize: 13,
        color: '#d1d1d1',
        fontWeight: '500',
    },
    viewModeTextActive: {
        color: '#fff',
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#141414',
        margin: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },

    // Month View
    monthView: {
        flex: 1,
    },
    weekdayHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        backgroundColor: '#0a0a0a',
    },
    weekdayCell: {
        flex: 1,
        paddingVertical: 18,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7 để chia đều 7 cột
        minHeight: 80,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#2a2a2a',
        padding: 6,
    },
    dayCellOtherMonth: {
        opacity: 0.3,
    },
    dayCellToday: {
        backgroundColor: 'rgba(218, 33, 40, 0.08)',
        borderColor: 'rgba(218, 33, 40, 0.3)',
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 3,
    },
    dayNumberOther: {
        color: '#666',
    },
    dayNumberToday: {
        color: '#da2128',
        fontWeight: '700',
    },
    dayEvents: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
        marginTop: 3,
    },
    eventDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    moreEvents: {
        fontSize: 9,
        color: '#999',
        marginTop: 2,
    },

    // Week View
    weekView: {
        flex: 1,
    },
    weekScrollHorizontal: {
        flex: 1,
    },
    weekContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    timeColumn: {
        width: 70,
        borderRightWidth: 1,
        borderRightColor: '#2a2a2a',
    },
    timeColumnHeader: {
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    timeScrollView: {
        flex: 1,
    },
    timeSlot: {
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        paddingTop: 4,
        paddingRight: 6,
        alignItems: 'flex-end',
    },
    timeLabel: {
        fontSize: 10,
        color: '#d1d1d1',
    },
    dayColumn: {
        width: 120,
        borderRightWidth: 1,
        borderRightColor: '#2a2a2a',
    },
    dayColumnToday: {
        backgroundColor: 'rgba(218, 33, 40, 0.05)',
    },
    dayHeader: {
        height: 60,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayHeaderName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    dayHeaderDate: {
        fontSize: 11,
        color: '#d1d1d1',
    },
    dayScrollView: {
        flex: 1,
    },
    hourCells: {
        position: 'relative',
        minHeight: 60 * 18, // 18 hours * 60px
    },
    hourCell: {
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    weekSession: {
        position: 'absolute',
        left: 2,
        right: 2,
        padding: 4,
        borderRadius: 4,
        minHeight: 50,
    },
    weekSessionTime: {
        fontSize: 9,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    weekSessionTitle: {
        fontSize: 11,
        fontWeight: '500',
        color: '#2d2d2d',
    },
    weekSessionPT: {
        fontSize: 9,
        fontWeight: '400',
        color: '#4a4a4a',
        marginTop: 2,
    },

    // Day View
    dayView: {
        flex: 1,
        padding: 15,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    sessionCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
    sessionInfo: {
        marginBottom: 12,
        backgroundColor: '#2a2a2a',
        padding: 12,
        borderRadius: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 8,
        flex: 1,
    },
    countdownBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    countdownText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#141414',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalBody: {
        padding: 20,
    },
    countdownBanner: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    countdownBannerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    detailSection: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 6,
    },
    detailValue: {
        fontSize: 16,
        color: '#fff',
    },
    statusBadgeLarge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    statusTextLarge: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    exercisesSection: {
        marginTop: 10,
    },
    exercisesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    exerciseItem: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    exerciseName: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 12,
        color: '#999',
    },

    // Week Schedule Grid
    weekScheduleGrid: {
        padding: 10,
    },
    dayColumnGrid: {
        marginBottom: 20,
    },
    dayHeaderGrid: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    dayHeaderToday: {
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
        borderWidth: 1,
        borderColor: '#da2128',
    },
    dayNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    dayDateText: {
        fontSize: 14,
        color: '#999',
    },
    todayBadge: {
        backgroundColor: '#da2128',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    todayBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    timeSlotsContainer: {
        gap: 8,
    },
    timeSlotCard: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        minHeight: 60,
        justifyContent: 'center',
    },
    timeSlotPast: {
        opacity: 0.4,
    },
    timeSlotEmpty: {
        opacity: 0.6,
        borderStyle: 'dashed',
    },
    timeSlotAvailable: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    timeSlotSelected: {
        borderColor: '#da2128',
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
        borderWidth: 2,
    },
    timeSlotTime: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    timeSlotStatusText: {
        fontSize: 11,
        color: '#999',
    },
    availableText: {
        color: '#10b981',
        fontWeight: '600',
    },
    selectedText: {
        color: '#da2128',
        fontWeight: '600',
    },
    scheduleSummary: {
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    selectedSessionsList: {
        flexDirection: 'row',
    },
    selectedSessionItem: {
        backgroundColor: '#2a2a2a',
        padding: 10,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 120,
    },
    selectedSessionDay: {
        fontSize: 12,
        fontWeight: '600',
        color: '#da2128',
        marginBottom: 4,
    },
    selectedSessionTime: {
        fontSize: 11,
        color: '#fff',
        marginBottom: 4,
    },
    selectedSessionPT: {
        fontSize: 10,
        color: '#999',
    },

    // Session Select Card (for add session modal) - kept for backward compatibility
    sessionSelectCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    sessionSelectCardSelected: {
        borderColor: '#da2128',
        backgroundColor: 'rgba(218, 33, 40, 0.1)',
    },
    sessionSelectInfo: {
        flex: 1,
    },
    sessionSelectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 6,
    },
    sessionSelectDate: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 4,
    },
    sessionSelectTime: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    sessionSelectPT: {
        fontSize: 12,
        color: '#999',
    },
    sessionSelectCheckbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#666',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    sessionSelectCheckboxSelected: {
        backgroundColor: '#da2128',
        borderColor: '#da2128',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
        gap: 12,
    },
    selectedCount: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
    },
    confirmButton: {
        backgroundColor: '#da2128',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#3a3a3a',
        opacity: 0.5,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Current time timeline (for week view)
    currentTimeline: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#da2128',
        position: 'absolute',
        left: -5,
        zIndex: 101,
    },
    timelineLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#da2128',
    },

    // Session Selection Modal Styles (PackageWorkflowScreen style)
    sessionModal: {
        backgroundColor: '#0a0a0a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    modalInfo: {
        backgroundColor: '#1a2a3a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2a3a4a',
    },
    modalInfoText: {
        fontSize: 14,
        color: '#66b3ff',
    },
    sessionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#333',
    },
    sessionCardSelected: {
        borderColor: '#da2128',
        backgroundColor: '#2a1a1a',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    sessionPT: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 4,
    },
    sessionSlots: {
        fontSize: 12,
        color: '#4ade80',
    },
    sessionCheck: {
        fontSize: 24,
        color: '#da2128',
        fontWeight: 'bold',
    },
    weekContentGrid: {
        paddingRight: 16,
    },
    selectedRemove: {
        fontSize: 24,
        color: '#da2128',
        fontWeight: 'bold',
        paddingLeft: 8,
    },
});

export default ScheduleScreen;
