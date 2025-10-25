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

    // Fixed time slots (8 slots per day, excluding lunch break 12-13h)
    const TIME_SLOTS = [
        { id: 1, start: '06:00', end: '08:00', label: '06:00 - 08:00' },
        { id: 2, start: '08:00', end: '10:00', label: '08:00 - 10:00' },
        { id: 3, start: '10:00', end: '12:00', label: '10:00 - 12:00' },
        // Lunch break 12:00 - 13:00
        { id: 4, start: '13:00', end: '15:00', label: '13:00 - 15:00' },
        { id: 5, start: '15:00', end: '17:00', label: '15:00 - 17:00' },
        { id: 6, start: '17:00', end: '19:00', label: '17:00 - 19:00' },
        { id: 7, start: '19:00', end: '21:00', label: '19:00 - 21:00' },
        { id: 8, start: '21:00', end: '23:00', label: '21:00 - 23:00' }
    ];

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

            const response = await api.get('/lich-tap/available-sessions', {
                chiNhanhId: registration.branchId._id,
                tuanBatDau: tuanBatDau.toISOString(),
                goiTapId: goiTapId
            });

            if (response.success) {
                setAvailableSessions(response.data.sessions);
                setWeekInfo(response.data.weekInfo);
                setPackageConstraints(response.data.packageConstraints);
            } else {
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

            <div className="week-schedule">
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
                                    {selectedTimeSlot.sessions.map(session => {
                                        const isSelected = selectedSessions.find(s => s._id === session._id);
                                        const status = getSessionStatus(session);

                                        // Debug each session
                                        console.log('Rendering session:', {
                                            id: session._id,
                                            ptName: session.ptPhuTrach?.hoTen,
                                            ptImage: session.ptPhuTrach?.anhDaiDien,
                                            ptImageType: session.ptPhuTrach?.anhDaiDien?.startsWith('data:') ? 'base64' : 'url'
                                        });

                                        return (
                                            <div
                                                key={session._id}
                                                className={`session-modal-card ${status} ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSessionSelect(session)}
                                            >
                                                {session.ptPhuTrach.trangThaiPT === "DANG_HOAT_DONG" && (
                                                    <div className="trainer-status">Hoạt động</div>
                                                )}

                                                <div className="trainer-info">
                                                    <div className="trainer-avatar">
                                                        {/* Render image if anhDaiDien contains valid base64 image data */}
                                                        {session.ptPhuTrach.anhDaiDien &&
                                                         session.ptPhuTrach.anhDaiDien.startsWith('data:image') ? (
                                                            <img
                                                                src={session.ptPhuTrach.anhDaiDien}
                                                                alt={`Ảnh đại diện ${session.ptPhuTrach.hoTen}`}
                                                                className="trainer-avatar-img"
                                                                onLoad={(e) => {
                                                                    // Hide placeholder when image loads successfully
                                                                    const placeholder = e.target.parentNode.querySelector('.avatar-placeholder');
                                                                    if (placeholder) {
                                                                        placeholder.style.display = 'none';
                                                                    }
                                                                }}
                                                                onError={(e) => {
                                                                    // Show placeholder if image fails to load
                                                                    e.target.style.display = 'none';
                                                                    const placeholder = e.target.parentNode.querySelector('.avatar-placeholder');
                                                                    if (placeholder) {
                                                                        placeholder.style.display = 'flex';
                                                                    }
                                                                }}
                                                                style={{ display: 'block' }} // Ensure image is visible when loaded
                                                            />
                                                        ) : null}

                                                        {/* Always render placeholder, control visibility with CSS */}
                                                        <div className="avatar-placeholder" style={{ display: session.ptPhuTrach.anhDaiDien ? 'none' : 'flex' }}>
                                                            {session.ptPhuTrach.hoTen.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>

                                                    <div className="trainer-details">
                                                        <h4 className="trainer-name">{session.ptPhuTrach.hoTen}</h4>
                                                        <p className="trainer-specialty">{session.ptPhuTrach.chuyenMon}</p>

                                                        <div className="trainer-info-grid">
                                                            <div className="info-section">
                                                                <div className="info-item">
                                                                    <span className="info-label">Giới tính:</span>
                                                                    <span className="info-value">{session.ptPhuTrach.gioiTinh}</span>
                                                                </div>

                                                                <div className="info-item">
                                                                    <span className="info-label">Bằng cấp:</span>
                                                                    <span className="info-value">{session.ptPhuTrach.bangCapChungChi || 'N/A'}</span>
                                                                </div>

                                                                <div className="info-item experience-badge">
                                                                    💪 {session.ptPhuTrach.kinhNghiem} năm kinh nghiệm
                                                                </div>
                                                            </div>

                                                            <div className="info-section">
                                                                <div className="info-item">
                                                                    <span className="info-label">Đánh giá:</span>
                                                                    <div className="rating-stars">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <span
                                                                                key={star}
                                                                                className={`star ${star <= session.ptPhuTrach.danhGia ? 'filled' : ''}`}
                                                                            >
                                                                                ⭐
                                                                            </span>
                                                                        ))}
                                                                        <span className="info-value">({session.ptPhuTrach.danhGia}/5)</span>
                                                                    </div>
                                                                </div>

                                                                <div className="info-item phone-item">
                                                                    📞 {session.ptPhuTrach.sdt}
                                                                </div>

                                                                <div className="info-item">
                                                                    <span className="info-label">Trạng thái:</span>
                                                                    <span className="info-value">
                                                                        {session.ptPhuTrach.trangThaiPT === 'DANG_HOAT_DONG' ? 'Đang hoạt động' : 'Không hoạt động'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="selection-check">✓</div>
                                                    )}
                                                </div>
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