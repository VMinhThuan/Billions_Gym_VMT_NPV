import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './WorkflowComponents.css';

const ScheduleBuilder = ({ registrationId, selectedTrainer, onCreateSchedule, loading }) => {
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [weekInfo, setWeekInfo] = useState(null);
    const [packageConstraints, setPackageConstraints] = useState(null);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [registration, setRegistration] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second for real-time countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second for real-time countdown

        return () => clearInterval(timer);
    }, []);

    // Fixed time slots (8 slots per day, excluding lunch break 12-13h)
    const TIME_SLOTS = [
        { id: 1, start: '06:00', end: '08:00', label: '06:00 - 08:00', icon: '🌅', type: 'Morning' },
        { id: 2, start: '08:00', end: '10:00', label: '08:00 - 10:00', icon: '☀️', type: 'Morning' },
        { id: 3, start: '10:00', end: '12:00', label: '10:00 - 12:00', icon: '🌤️', type: 'Morning' },
        // Lunch break 12:00 - 13:00
        { id: 4, start: '13:00', end: '15:00', label: '13:00 - 15:00', icon: '🌞', type: 'Afternoon' },
        { id: 5, start: '15:00', end: '17:00', label: '15:00 - 17:00', icon: '🌇', type: 'Afternoon' },
        { id: 6, start: '17:00', end: '19:00', label: '17:00 - 19:00', icon: '🌆', type: 'Evening' },
        { id: 7, start: '19:00', end: '21:00', label: '19:00 - 21:00', icon: '🌃', type: 'Evening' },
        { id: 8, start: '21:00', end: '23:00', label: '21:00 - 23:00', icon: '🌙', type: 'Night' }
    ];

    // Workout type icons
    const getWorkoutIcon = (sessionName) => {
        const name = sessionName?.toLowerCase() || '';
        if (name.includes('push')) return '💪';
        if (name.includes('pull')) return '🏋️';
        if (name.includes('leg')) return '🦵';
        if (name.includes('cardio')) return '❤️';
        if (name.includes('core')) return '🎯';
        if (name.includes('strength')) return '⚡';
        if (name.includes('mobility')) return '🤸';
        return '🔥';
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

        // Format countdown text
        let countdownText = '';
        if (days > 0) {
            countdownText = `${days} ngày ${hours24} giờ ${mins} phút ${secs} giây`;
        } else if (hours24 > 0) {
            countdownText = `${hours24} giờ ${mins} phút ${secs} giây`;
        } else if (mins > 0) {
            countdownText = `${mins} phút ${secs} giây`;
        } else {
            countdownText = `${secs} giây`;
        }

        return {
            status,
            text: countdownText,
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
        let bgColor = 'rgba(162, 89, 255, 0.1)';
        let borderColor = '#A259FF';
        let backgroundImage = '';

        if (name.includes('push')) {
            type = 'Strength';
            icon = '💪';
            bgColor = 'rgba(239, 68, 68, 0.1)';
            borderColor = '#EF4444';
        } else if (name.includes('pull')) {
            type = 'Strength';
            icon = '🏋️';
            bgColor = 'rgba(59, 130, 246, 0.1)';
            borderColor = '#3B82F6';
        } else if (name.includes('leg')) {
            type = 'Strength';
            icon = '🦵';
            bgColor = 'rgba(34, 197, 94, 0.1)';
            borderColor = '#22C55E';
        } else if (name.includes('cardio')) {
            type = 'Cardio';
            icon = '❤️';
            bgColor = 'rgba(255, 145, 77, 0.1)';
            borderColor = '#FF914D';
        } else if (name.includes('mobility') || name.includes('flexibility')) {
            type = 'Mobility';
            icon = '🤸';
            bgColor = 'rgba(0, 255, 198, 0.1)';
            borderColor = '#00FFC6';
        } else if (name.includes('core')) {
            type = 'Core';
            icon = '🎯';
            bgColor = 'rgba(245, 158, 11, 0.1)';
            borderColor = '#F59E0B';
        }

        // Determine difficulty from description
        if (desc.includes('de') || desc.includes('easy')) {
            difficulty = 'Dễ';
        } else if (desc.includes('kho') || desc.includes('hard')) {
            difficulty = 'Khó';
        } else if (desc.includes('trung_binh') || desc.includes('medium')) {
            difficulty = 'Trung bình';
        }

        // Determine background image from template
        if (template === 'template-1') {
            backgroundImage = 'https://example.com/template-1-background.jpg';
        } else if (template === 'template-2') {
            backgroundImage = 'https://example.com/template-2-background.jpg';
        }

        return { type, difficulty, icon, bgColor, borderColor, backgroundImage };
    };

    useEffect(() => {
        if (registrationId && selectedTrainer) {
            fetchAvailableSessions();
        }
    }, [registrationId, selectedTrainer]);

    const fetchAvailableSessions = async () => {
        try {
            setSessionsLoading(true);
            setError(null);

            // Lấy thông tin đăng ký để có chiNhanhId, goiTapId
            const registrationResponse = await api.get(`/chitietgoitap/${registrationId}`);
            if (!registrationResponse.success) {
                throw new Error('Không thể lấy thông tin đăng ký');
            }

            const registration = registrationResponse.data;
            setRegistration(registration);

            const today = new Date();
            const tuanBatDau = new Date(today);
            tuanBatDau.setDate(today.getDate() - today.getDay() + 1); // Bắt đầu từ Thứ 2
            tuanBatDau.setHours(0, 0, 0, 0); // Reset time to 00:00:00

            // Sử dụng goiTapId hoặc maGoiTap (fallback)
            const goiTapId = registration.goiTapId?._id || registration.maGoiTap?._id;

            if (!goiTapId) {
                throw new Error('Không tìm thấy thông tin gói tập');
            }

            console.log('🔍 API Request Parameters:', {
                chiNhanhId: registration.branchId._id,
                tuanBatDau: tuanBatDau.toISOString(),
                goiTapId: goiTapId,
                branchName: registration.branchId.tenChiNhanh
            });

            const response = await api.get('/lich-tap/available-sessions', {
                chiNhanhId: registration.branchId._id,
                tuanBatDau: tuanBatDau.toISOString(),
                goiTapId: goiTapId
            });

            console.log('📡 API Response:', response);

            if (response.success) {
                console.log('✅ Sessions received:', response.data.sessions.length);
                setAvailableSessions(response.data.sessions);
                setWeekInfo(response.data.weekInfo);
                setPackageConstraints(response.data.packageConstraints);

                // Debug: Log first few sessions
                if (response.data.sessions.length > 0) {
                    console.log('🔍 First session sample:', response.data.sessions[0]);
                }
            } else {
                console.error('❌ API Error:', response.message);
                setError(response.message || 'Không thể lấy danh sách buổi tập');
            }
        } catch (err) {
            console.error('Error fetching available sessions:', err);
            setError('Lỗi khi tải danh sách buổi tập');
        } finally {
            setSessionsLoading(false);
        }
    };

    const isTimeSlotInPast = (dayDate, timeSlot) => {
        // Use local time instead of UTC for accurate past check
        const now = new Date();
        const slotDateTime = new Date(dayDate);
        const [hours, minutes] = timeSlot.start.split(':');
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0); // Use local time
        return slotDateTime < now;
    };

    const isSessionRegistrable = (session) => {
        // Respect backend validation: session must not be started and must have spots available
        return session.coTheDangKy === true;
    };

    const getSessionsForTimeSlot = (dayDate, timeSlot) => {
        return availableSessions.filter(session => {
            // First check if session is registrable (respects backend validation)
            if (!isSessionRegistrable(session)) {
                return false;
            }

            const sessionDate = new Date(session.ngay);
            const dayDateObj = new Date(dayDate);

            if (sessionDate.toDateString() !== dayDateObj.toDateString()) {
                return false;
            }

            const sessionStart = session.gioBatDau.substring(0, 5);
            const sessionEnd = session.gioKetThuc.substring(0, 5);

            return sessionStart >= timeSlot.start && sessionEnd <= timeSlot.end;
        });
    };

    const handleTimeSlotClick = (dayDate, timeSlot) => {
        if (isTimeSlotInPast(dayDate, timeSlot)) {
            return;
        }

        const sessionsInSlot = getSessionsForTimeSlot(dayDate, timeSlot);
        setSelectedTimeSlot({
            dayDate,
            timeSlot,
            sessions: sessionsInSlot,
            dayName: weekInfo.days.find(d => d.date === dayDate)?.dayName || ''
        });
        setShowSessionModal(true);
    };

    const handleSessionSelect = (session) => {
        if (!session.coTheDangKy) return;

        const isSelected = selectedSessions.find(s => s._id === session._id);

        if (isSelected) {
            setSelectedSessions(prev => prev.filter(s => s._id !== session._id));
        } else {
            setSelectedSessions(prev => [...prev, session]);
        }
    };

    const closeModal = () => {
        setShowSessionModal(false);
        setSelectedTimeSlot(null);
    };

    const getTimeSlotStatus = (dayDate, timeSlot) => {
        if (isTimeSlotInPast(dayDate, timeSlot)) {
            return 'past';
        }

        const sessionsInSlot = getSessionsForTimeSlot(dayDate, timeSlot);
        const hasSelectedSession = sessionsInSlot.some(session =>
            selectedSessions.find(s => s._id === session._id)
        );

        if (hasSelectedSession) {
            return 'selected';
        }

        if (sessionsInSlot.length === 0) {
            return 'empty';
        }

        return 'available';
    };

    const handleCreateSchedule = async () => {
        console.log('🚀 handleCreateSchedule called');
        console.log('Selected sessions:', selectedSessions);
        console.log('Registration:', registration);
        console.log('Selected trainer:', selectedTrainer);
        console.log('Token:', localStorage.getItem('token'));

        if (selectedSessions.length === 0) {
            setError('Vui lòng chọn ít nhất một buổi tập');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const scheduleData = {
                goiTapId: registration?.goiTapId?._id || registration?.maGoiTap?._id || selectedTrainer?.goiTapId,
                chiNhanhId: registration?.branchId?._id || selectedTrainer?.chiNhanhId,
                tuanBatDau: weekInfo.startDate,
                soNgayTapTrongTuan: selectedSessions.length,
                gioTapUuTien: selectedTrainer.gioTapUuTien || [],
                selectedSessions: selectedSessions, // Gửi các sessions đã chọn
                danhSachBuoiTap: selectedSessions.map(session => ({
                    buoiTapId: session._id,
                    ngayTap: session.ngay,
                    gioBatDau: session.gioBatDau,
                    gioKetThuc: session.gioKetThuc,
                    ptPhuTrach: session.ptPhuTrach._id
                }))
            };

            console.log('Calling onCreateSchedule...');
            await onCreateSchedule(scheduleData);
            console.log('onCreateSchedule completed successfully');
        } catch (err) {
            console.error('Error creating schedule:', err);
            if (err.message.includes('Session expired') || err.message.includes('401')) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (err.message.includes('Access denied') || err.message.includes('403')) {
                setError('Bạn không có quyền thực hiện hành động này.');
            } else {
                setError(err.message || 'Lỗi khi tạo lịch tập');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (timeString) => {
        return timeString.substring(0, 5); // Lấy HH:MM
    };

    const getSessionStatus = (session) => {
        if (!session.coTheDangKy) {
            return session.daDay ? 'full' : 'unavailable';
        }
        return selectedSessions.find(s => s._id === session._id) ? 'selected' : 'available';
    };

    // Debug component state and data
    console.log('=== ScheduleBuilder Debug ===');
    console.log('selectedTimeSlot:', selectedTimeSlot);
    console.log('showSessionModal:', showSessionModal);
    console.log('selectedSessions:', selectedSessions);

    if (selectedTimeSlot) {
        console.log('Selected time slot sessions:', selectedTimeSlot.sessions);
        console.log('Sessions count:', selectedTimeSlot.sessions?.length || 0);

        if (selectedTimeSlot.sessions) {
            selectedTimeSlot.sessions.forEach((session, index) => {
                console.log(`Session ${index}:`, {
                    id: session._id,
                    ptPhuTrach: session.ptPhuTrach,
                    ptName: session.ptPhuTrach?.hoTen,
                    ptImage: session.ptPhuTrach?.anhDaiDien
                });
            });
        }
    }

    if (sessionsLoading) {
        return (
            <div className="schedule-builder">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải danh sách buổi tập...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="schedule-builder">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
                <button className="btn-secondary" onClick={fetchAvailableSessions}>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="schedule-builder">
            <div className="schedule-header">
                <h3>Tạo lịch tập tuần</h3>
                <p>Chọn các ca tập phù hợp với lịch trình của bạn</p>

                {packageConstraints && (
                    <div className="package-constraints">
                        <div className="constraint-info">
                            <span className="constraint-icon">ℹ️</span>
                            <span>{packageConstraints.description}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="week-schedule" style={{ ['--rows']: TIME_SLOTS.length }}>
                {weekInfo && weekInfo.days.map((day, index) => (
                    <div key={index} className="day-column">
                        <div className="day-header">
                            <div className="day-name">{day.dayName}</div>
                            <div className="day-date">
                                {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                            </div>
                            {/* {day.isToday && <div className="today-badge">Hôm nay</div>} */}
                        </div>

                        <div className="time-slots-container">
                            {TIME_SLOTS.map(timeSlot => {
                                const status = getTimeSlotStatus(day.date, timeSlot);
                                const sessionsInSlot = getSessionsForTimeSlot(day.date, timeSlot);
                                const selectedSessionInSlot = sessionsInSlot.find(session =>
                                    selectedSessions.find(s => s._id === session._id)
                                );

                                return (
                                    <div
                                        key={timeSlot.id}
                                        className={`time-slot-card ${status}`}
                                        onClick={() => handleTimeSlotClick(day.date, timeSlot)}
                                    >
                                        <div className="time-slot-time">{timeSlot.label}</div>

                                        <div className="time-slot-status">
                                            {status === 'past' && (
                                                <span className="status-text past">Đã qua</span>
                                            )}
                                            {status === 'empty' && (
                                                <span className="status-text empty">Trống</span>
                                            )}
                                            {status === 'available' && (
                                                <span className="status-text available">
                                                    {sessionsInSlot.length} buổi
                                                </span>
                                            )}
                                            {status === 'selected' && selectedSessionInSlot && (
                                                <div className="selected-session-info">
                                                    <div className="selected-trainer">
                                                        {selectedSessionInSlot.ptPhuTrach.hoTen}
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

            <div className="schedule-summary">
                <div className="selected-count">
                    Đã chọn: {selectedSessions.length} buổi tập
                </div>

                {selectedSessions.length > 0 && (
                    <div className="selected-sessions">
                        <h4>Buổi tập đã chọn:</h4>
                        <div className="selected-list">
                            {selectedSessions.map(session => (
                                <div key={session._id} className="selected-session">
                                    <span className="session-day">
                                        {new Date(session.ngay).toLocaleDateString('vi-VN', { weekday: 'short' })}
                                    </span>
                                    <span className="session-time">
                                        {formatTime(session.gioBatDau)} - {formatTime(session.gioKetThuc)}
                                    </span>
                                    <span className="session-trainer">
                                        {session.ptPhuTrach.hoTen}
                                    </span>
                                    <button
                                        className="session-remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSessionSelect(session);
                                        }}
                                        title="Xóa buổi tập"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCreateSchedule}
                    disabled={selectedSessions.length === 0 || submitting}
                >
                    {submitting ? 'Đang tạo lịch...' : 'Tạo lịch tập'}
                </button>
            </div>

            {/* Session Selection Modal */}
            {showSessionModal && selectedTimeSlot && (
                <div className="session-modal-overlay" onClick={closeModal}>
                    <div className="session-modal max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chọn buổi tập</h3>
                            <div className="modal-subtitle">
                                {selectedTimeSlot.dayName} - {selectedTimeSlot.timeSlot.label}
                            </div>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <div className="modal-content w-full max-w-6xl mx-auto px-6">
                            {selectedTimeSlot.sessions.length > 0 ? (
                                <div className="w-full">
                                    {/* Info message about single selection per time slot */}
                                    <div className="flex items-center gap-2 mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <span className="text-blue-400">ℹ️</span>
                                        <span className="text-[#dadada] text-sm">Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca</span>
                                    </div>

                                    {/* Grid Layout: 3 cards per row on desktop - Full width parent */}
                                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                                        {selectedTimeSlot.sessions.map(session => {
                                            const isSelected = selectedSessions.find(s => s._id === session._id);
                                            const status = getSessionStatus(session);

                                            // Check if there's another session selected in this time slot
                                            const hasSelectedInTimeSlot = selectedTimeSlot.sessions.some(s =>
                                                selectedSessions.find(sel => sel._id === s._id) && s._id !== session._id
                                            );

                                            const isDisabledDueToSelection = hasSelectedInTimeSlot && !isSelected;

                                            const sessionStatusInfo = getDetailedCountdown(session.ngay, session.gioBatDau, session.gioKetThuc);
                                            const workoutTypeInfo = getWorkoutTypeInfo(session.tenBuoiTap, session.moTa, session.templateBuoiTap);

                                            // Get day name from session date
                                            const sessionDate = new Date(session.ngay);
                                            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                                            const dayName = dayNames[sessionDate.getDay()];

                                            // Format time
                                            const timeLabel = `${session.gioBatDau.substring(0, 5)} - ${session.gioKetThuc.substring(0, 5)}`;

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
                                                        } ${isDisabledDueToSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    onClick={() => !isDisabledDueToSelection && handleSessionSelect(session)}
                                                >
                                                    {/* Image Container with Badges and Favorite */}
                                                    <div className="relative w-full aspect-video overflow-hidden">
                                                        {/* Background Image */}
                                                        <img
                                                            src={ptImage}
                                                            alt={session.tenBuoiTap || 'Buổi tập'}
                                                            className="w-full h-full object-cover opacity-90"
                                                        />

                                                        {/* Badges - Top Left */}
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

                                                        {/* Favorite Icon - Top Right */}
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
                                                        {/* Title Line - Fixed height for alignment */}
                                                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 min-h-[3.5rem] flex-shrink-0">
                                                            {session.tenBuoiTap || 'Buổi tập'} – PT {session.ptPhuTrach.hoTen}
                                                        </h3>

                                                        {/* Sub Info Line - Fixed height for alignment */}
                                                        <p className="text-[#A1A1A1] text-sm mb-4 line-clamp-1 min-h-[1.25rem] flex-shrink-0">
                                                            Loại: {workoutTypeInfo.type} · Slot: {session.soLuongHienTai || 0}/{session.soLuongToiDa || 0}
                                                        </p>

                                                        {/* Info Row with Icons - Fixed height for alignment */}
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

                                                        {/* Real-time Countdown - Always render with fixed height */}
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

                                                        {/* Spacer to push button to bottom */}
                                                        <div className="flex-1"></div>

                                                        {/* Register Button */}
                                                        <button
                                                            className={`w-full bg-black text-white py-2 rounded-xl font-medium hover:bg-[#2A2A2A] transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${isSelected ? 'bg-green-600 hover:bg-green-700' : ''
                                                                }`}
                                                            disabled={
                                                                isDisabledDueToSelection ||
                                                                availableSlots <= 0 ||
                                                                sessionStatusInfo.isFinished
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isDisabledDueToSelection && availableSlots > 0 && !sessionStatusInfo.isFinished) {
                                                                    handleSessionSelect(session);
                                                                }
                                                            }}
                                                        >
                                                            {isSelected ? (
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
                                                    {isDisabledDueToSelection && (
                                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                                                            <span className="text-white text-sm font-medium">Đã chọn buổi khác trong ca này</span>
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
                            <button className="btn-secondary" onClick={closeModal}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleBuilder;