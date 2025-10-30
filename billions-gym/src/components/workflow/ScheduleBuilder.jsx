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

        // Critical timing - less than 10 minutes
        if (timeDiff <= 10 * 60 * 1000) {
            status = 'critical';
            color = '#FF6B6B';
            icon = '🚨';
        }
        // Urgent - less than 1 hour
        else if (timeDiff <= 60 * 60 * 1000) {
            status = 'urgent';
            color = '#FF914D';
            icon = '⚡';
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
            days,
            hours: hours24,
            minutes: mins,
            seconds: secs,
            isCritical: status === 'critical',
            isUrgent: status === 'urgent'
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
                            {day.isToday && <div className="today-badge">Hôm nay</div>}
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
                                                    <span className="status-text selected">✓ Đã chọn</span>
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
                    <div className="session-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chọn buổi tập</h3>
                            <div className="modal-subtitle">
                                {selectedTimeSlot.dayName} - {selectedTimeSlot.timeSlot.label}
                            </div>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <div className="modal-content">
                            {selectedTimeSlot.sessions.length > 0 ? (
                                <div className="sessions-grid">
                                    {/* Info message about single selection per time slot */}
                                    <div className="selection-info">
                                        <span className="info-icon">ℹ️</span>
                                        <span>Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca</span>
                                    </div>

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

                                        return (
                                            <div
                                                key={session._id}
                                                className={`villa-workout-card ${isSelected ? 'selected' : ''} ${sessionStatusInfo.status}`}
                                                onClick={() => !isDisabledDueToSelection && handleSessionSelect(session)}
                                                style={{
                                                    '--countdown-color': sessionStatusInfo.color,
                                                    '--workout-bg': workoutTypeInfo.bgColor,
                                                    '--workout-border': workoutTypeInfo.borderColor,
                                                    backgroundImage: `url(${workoutTypeInfo.backgroundImage || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'})`
                                                }}
                                            >
                                                {/* Background Image Overlay */}
                                                <div className="villa-card-overlay"></div>

                                                {/* Disabled State Overlay */}
                                                {isDisabledDueToSelection && (
                                                    <div className="villa-disabled-overlay">
                                                        <span className="disabled-message">Đã chọn buổi khác trong ca này</span>
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                <div className={`villa-status-badge ${sessionStatusInfo.status}`}>
                                                    <span className="status-icon">{sessionStatusInfo.icon}</span>
                                                    <span className="status-text">
                                                        {sessionStatusInfo.isOngoing ? 'ĐANG DIỄN RA' :
                                                            sessionStatusInfo.isFinished ? 'ĐÃ KẾT THÚC' :
                                                                sessionStatusInfo.isCritical ? 'SẮP BẮT ĐẦU' : 'SẮP DIỄN RA'}
                                                    </span>
                                                </div>

                                                {/* Main Content Area */}
                                                <div className="villa-content">
                                                    {/* Workout Type & Difficulty */}
                                                    <div className="villa-workout-header">
                                                        <div className="workout-type-pill">
                                                            <span className="workout-icon">{workoutTypeInfo.icon}</span>
                                                            <span className="workout-name">{session.tenBuoiTap || 'Buổi tập'}</span>
                                                        </div>
                                                        <div className="difficulty-badge" style={{ backgroundColor: workoutTypeInfo.bgColor }}>
                                                            {workoutTypeInfo.difficulty}
                                                        </div>
                                                    </div>

                                                    {/* Session Details */}
                                                    <div className="villa-session-info">
                                                        <div className="session-meta">
                                                            <span className="session-type">Loại: {workoutTypeInfo.type}</span>
                                                            <span className="session-separator">|</span>
                                                            <span className="session-trainer">
                                                                PT: {session.ptPhuTrach.hoTen}
                                                                <div className="trainer-rating">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className={`star ${i < session.ptPhuTrach.danhGia ? 'filled' : ''}`}
                                                                        >
                                                                            ⭐
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </span>
                                                        </div>

                                                        {/* Capacity Info */}
                                                        <div className="capacity-info">
                                                            <span className="capacity-text">
                                                                Slot: {session.soLuongHienTai || 0} / {session.soLuongToiDa || 0}
                                                            </span>
                                                            <div className="remaining-slots">
                                                                <span className="slots-icon">🟢</span>
                                                                <span className="slots-count">
                                                                    Còn {(session.soLuongToiDa || 0) - (session.soLuongHienTai || 0)} slot
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Real-time Countdown */}
                                                    <div className={`villa-countdown ${sessionStatusInfo.status}`}>
                                                        <div className="countdown-icon">⏳</div>
                                                        <div className="countdown-content">
                                                            {sessionStatusInfo.isOngoing ? (
                                                                <div className="ongoing-status">
                                                                    <span className="ongoing-text">🔥 ĐANG DIỄN RA</span>
                                                                </div>
                                                            ) : sessionStatusInfo.isFinished ? (
                                                                <div className="finished-status">
                                                                    <span className="finished-text">✅ ĐÃ KẾT THÚC</span>
                                                                </div>
                                                            ) : (
                                                                <div className="countdown-display">
                                                                    <span className="countdown-label">
                                                                        {sessionStatusInfo.isCritical ? 'Sắp bắt đầu trong:' : 'Bắt đầu sau:'}
                                                                    </span>
                                                                    <div className="countdown-time">
                                                                        {sessionStatusInfo.days > 0 && (
                                                                            <span className="time-unit">
                                                                                <span className="time-number">{sessionStatusInfo.days.toString().padStart(2, '0')}</span>
                                                                                <span className="time-label">ngày</span>
                                                                            </span>
                                                                        )}
                                                                        {(sessionStatusInfo.days > 0 || sessionStatusInfo.hours > 0) && (
                                                                            <span className="time-unit">
                                                                                <span className="time-number">{sessionStatusInfo.hours.toString().padStart(2, '0')}</span>
                                                                                <span className="time-label">giờ</span>
                                                                            </span>
                                                                        )}
                                                                        <span className="time-unit">
                                                                            <span className="time-number">{sessionStatusInfo.minutes.toString().padStart(2, '0')}</span>
                                                                            <span className="time-label">phút</span>
                                                                        </span>
                                                                        <span className="time-unit seconds">
                                                                            <span className="time-number">{sessionStatusInfo.seconds.toString().padStart(2, '0')}</span>
                                                                            <span className="time-label">giây</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <button
                                                        className={`villa-register-btn ${isSelected ? 'selected' :
                                                            (session.soLuongToiDa || 0) - (session.soLuongHienTai || 0) <= 0 ? 'full' :
                                                                sessionStatusInfo.isFinished ? 'finished' : ''
                                                            }`}
                                                        disabled={
                                                            isDisabledDueToSelection ||
                                                            (session.soLuongToiDa || 0) - (session.soLuongHienTai || 0) <= 0 ||
                                                            sessionStatusInfo.isFinished
                                                        }
                                                    >
                                                        {isSelected ? (
                                                            <>
                                                                <span className="btn-icon">✓</span>
                                                                <span>Đã chọn</span>
                                                            </>
                                                        ) : (session.soLuongToiDa || 0) - (session.soLuongHienTai || 0) <= 0 ? (
                                                            <>
                                                                <span className="btn-icon">❌</span>
                                                                <span>Đã đầy</span>
                                                            </>
                                                        ) : sessionStatusInfo.isFinished ? (
                                                            <>
                                                                <span className="btn-icon">⏹️</span>
                                                                <span>Đã kết thúc</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="btn-icon">🚀</span>
                                                                <span>Đăng ký buổi tập</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Selection Glow Effect */}
                                                {isSelected && (
                                                    <div className="villa-selection-glow"></div>
                                                )}

                                                {/* Critical Session Pulse Effect */}
                                                {sessionStatusInfo.isCritical && (
                                                    <div className="villa-critical-pulse"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-sessions">
                                    <div className="empty-icon">📅</div>
                                    <h4>Không có buổi tập trong ca này</h4>
                                    <p>Hiện tại chưa có buổi tập nào được tổ chức trong khung giờ này.</p>
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