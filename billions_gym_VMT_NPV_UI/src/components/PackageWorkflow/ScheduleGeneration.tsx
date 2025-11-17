import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../Button';
import Card from '../Card';
import Loading from '../Loading';
import { useCrudNotifications } from '../../hooks/useNotification';
import './PackageWorkflow.css';

interface ScheduleGenerationProps {
    chiTietGoiTapId: string;
    selectedPTId: string;
    onScheduleGenerated: () => void;
    onBack: () => void;
}

interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
    label: string;
}

interface SessionOption {
    id: string;
    tenBuoiTap: string;
    moTa: string;
    hinhAnh?: string;
    ptId: string;
    tenPT: string;
    soChoToiDa: number;
    soChoDaDangKy: number;
    trangThai: 'AVAILABLE' | 'FULL' | 'CANCELLED';
    doKho?: 'DE' | 'TRUNG_BINH' | 'KHO' | 'RAT_KHO';
    ngayTap?: string;
    gioBatDau?: string;
    gioKetThuc?: string;
}

interface SelectedSession {
    day: string;
    timeSlot: TimeSlot;
    session: SessionOption;
}

const ScheduleGeneration: React.FC<ScheduleGenerationProps> = ({
    chiTietGoiTapId,
    selectedPTId,
    onScheduleGenerated,
    onBack
}) => {
    const [selectedSessions, setSelectedSessions] = useState<SelectedSession[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: string, slot: TimeSlot } | null>(null);
    const [sessionOptions, setSessionOptions] = useState<SessionOption[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const notifications = useCrudNotifications();

    // Fixed time slots (8 slots per day with lunch break)
    const timeSlots: TimeSlot[] = [
        { id: '1', startTime: '06:00', endTime: '08:00', label: '06:00 - 08:00' },
        { id: '2', startTime: '08:00', endTime: '10:00', label: '08:00 - 10:00' },
        { id: '3', startTime: '10:00', endTime: '12:00', label: '10:00 - 12:00' },
        { id: '4', startTime: '13:00', endTime: '15:00', label: '13:00 - 15:00' },
        { id: '5', startTime: '15:00', endTime: '17:00', label: '15:00 - 17:00' },
        { id: '6', startTime: '17:00', endTime: '19:00', label: '17:00 - 19:00' },
        { id: '7', startTime: '19:00', endTime: '21:00', label: '19:00 - 21:00' },
        { id: '8', startTime: '21:00', endTime: '23:00', label: '21:00 - 23:00' }
    ];

    const daysOfWeek = [
        { key: 'Monday', label: 'Thứ 2', date: '22/10' },
        { key: 'Tuesday', label: 'Thứ 3', date: '23/10' },
        { key: 'Wednesday', label: 'Thứ 4', date: '24/10' },
        { key: 'Thursday', label: 'Thứ 5', date: '25/10' },
        { key: 'Friday', label: 'Thứ 6', date: '26/10' },
        { key: 'Saturday', label: 'Thứ 7', date: '27/10' },
        { key: 'Sunday', label: 'Chủ nhật', date: '28/10' }
    ];

    // Check if a time slot is in the past
    const isTimeSlotPast = (day: string, timeSlot: TimeSlot): boolean => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Map day keys to numbers
        const dayMap: { [key: string]: number } = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };

        const slotDay = dayMap[day];
        const [slotHour] = timeSlot.startTime.split(':').map(Number);

        // If it's a past day this week
        if (slotDay < currentDay) return true;

        // If it's today and the time has passed
        if (slotDay === currentDay && slotHour < currentHour) return true;

        return false;
    };

    // Check if time slot has any sessions
    const hasSessionsInSlot = (day: string, timeSlot: TimeSlot): boolean => {
        return selectedSessions.some(s => s.day === day && s.timeSlot.id === timeSlot.id);
    };

    // Get session count for a time slot
    const getSessionCount = (day: string, timeSlot: TimeSlot): number => {
        return selectedSessions.filter(s => s.day === day && s.timeSlot.id === timeSlot.id).length;
    };

    // Handle time slot click
    const handleTimeSlotClick = async (day: string, timeSlot: TimeSlot) => {
        if (isTimeSlotPast(day, timeSlot)) return;

        setSelectedTimeSlot({ day, slot: timeSlot });
        setIsLoadingSessions(true);
        setShowModal(true);

        try {
            // Fetch available sessions for this time slot
            const response = await api.get(`/api/package-workflow/sessions/${chiTietGoiTapId}`, {
                params: {
                    day,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime,
                    ptId: selectedPTId
                }
            });

            if (response.success && Array.isArray(response.data)) {
                setSessionOptions(response.data);
            } else {
                setSessionOptions([]);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setSessionOptions([]);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    // Handle session selection
    const handleSessionSelect = (session: SessionOption) => {
        if (!selectedTimeSlot) return;

        const newSelection: SelectedSession = {
            day: selectedTimeSlot.day,
            timeSlot: selectedTimeSlot.slot,
            session
        };

        // Remove any existing selection for this time slot
        const filteredSessions = selectedSessions.filter(
            s => !(s.day === selectedTimeSlot.day && s.timeSlot.id === selectedTimeSlot.slot.id)
        );

        setSelectedSessions([...filteredSessions, newSelection]);
        setShowModal(false);
        setSelectedTimeSlot(null);
    };

    // Remove session selection
    const removeSessionSelection = (day: string, timeSlotId: string) => {
        setSelectedSessions(prev =>
            prev.filter(s => !(s.day === day && s.timeSlot.id === timeSlotId))
        );
    };

    // Handle schedule generation
    const handleGenerateSchedule = async () => {
        if (selectedSessions.length === 0) {
            notifications.generic.error('Vui lòng chọn ít nhất 1 buổi tập');
            return;
        }

        setIsGenerating(true);
        try {
            const scheduleData = selectedSessions.map(s => ({
                ngayTrongTuan: s.day,
                gioBatDau: s.timeSlot.startTime,
                gioKetThuc: s.timeSlot.endTime,
                sessionId: s.session.id
            }));

            const response = await api.post(`/api/package-workflow/generate-schedule/${chiTietGoiTapId}`, {
                cacBuoiTap: scheduleData
            });

            if (response.success) {
                notifications.generic.success('Đã tạo lịch tập thành công!');
                onScheduleGenerated();
            }
        } catch (error) {
            notifications.generic.error('Không thể tạo lịch tập');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="schedule-generation-container">
            <div className="workflow-header">
                <h2>Tạo Lịch Tập Tuần</h2>
                <p>Chọn ca tập và buổi tập phù hợp với lịch của bạn</p>
            </div>

            {/* Weekly Calendar */}
            <Card className="weekly-calendar-card">
                <h3>Lịch tập trong tuần</h3>
                <div className="weekly-calendar">
                    <div className="calendar-header">
                        <div className="time-column-header">Giờ</div>
                        {daysOfWeek.map(day => (
                            <div key={day.key} className="day-header">
                                <div className="day-label">{day.label}</div>
                                <div className="day-date">{day.date}</div>
                            </div>
                        ))}
                    </div>

                    <div className="calendar-body">
                        {timeSlots.map(timeSlot => (
                            <div key={timeSlot.id} className="calendar-row">
                                <div className="time-column">
                                    {timeSlot.label}
                                </div>
                                {daysOfWeek.map(day => {
                                    const isPast = isTimeSlotPast(day.key, timeSlot);
                                    const hasSession = hasSessionsInSlot(day.key, timeSlot);
                                    const sessionCount = getSessionCount(day.key, timeSlot);

                                    return (
                                        <div
                                            key={`${day.key}-${timeSlot.id}`}
                                            className={`time-slot-cell ${isPast ? 'past' : ''} ${hasSession ? 'has-session' : ''}`}
                                            onClick={() => handleTimeSlotClick(day.key, timeSlot)}
                                        >
                                            {hasSession ? (
                                                <div className="session-indicator">
                                                    <span className="session-count">{sessionCount}</span>
                                                    <span className="session-text">buổi tập</span>
                                                </div>
                                            ) : isPast ? (
                                                <span className="past-indicator">Đã qua</span>
                                            ) : (
                                                <span className="empty-slot">+</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Selected Sessions Summary */}
            {selectedSessions.length > 0 && (
                <Card className="selected-sessions-card">
                    <h3>Buổi tập đã chọn ({selectedSessions.length})</h3>
                    <div className="selected-sessions-list">
                        {selectedSessions.map((selection, index) => {
                            const dayLabel = daysOfWeek.find(d => d.key === selection.day)?.label;
                            return (
                                <div key={index} className="selected-session-item">
                                    <div className="session-info">
                                        <div className="session-time">
                                            {dayLabel} • {selection.timeSlot.label}
                                        </div>
                                        <div className="session-name">{selection.session.tenBuoiTap}</div>
                                        <div className="session-trainer">PT: {selection.session.tenPT}</div>
                                    </div>
                                    <button
                                        className="remove-session-btn"
                                        onClick={() => removeSessionSelection(selection.day, selection.timeSlot.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Session Selection Modal */}
            {showModal && (
                <div className="session-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="session-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chọn buổi tập</h3>
                            <div className="modal-subtitle">
                                {selectedTimeSlot && (
                                    <>
                                        {daysOfWeek.find(d => d.key === selectedTimeSlot.day)?.label} • {selectedTimeSlot.slot.label}
                                    </>
                                )}
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {isLoadingSessions ? (
                                <div className="modal-loading">
                                    <Loading text="Đang tải danh sách buổi tập..." />
                                </div>
                            ) : sessionOptions.length === 0 ? (
                                <div className="no-sessions">
                                    <div className="no-sessions-icon">📅</div>
                                    <p>Không có buổi tập trong ca này</p>
                                    <small>Vui lòng chọn ca khác hoặc liên hệ để được hỗ trợ</small>
                                </div>
                            ) : (
                                <div className="sessions-list">
                                    {sessionOptions.map(session => {
                                        const isFull = session.soChoDaDangKy >= session.soChoToiDa;
                                        const isDisabled = isFull || session.trangThai !== 'AVAILABLE';

                                        // Logic để xác định badge "Sắp diễn ra"
                                        const isUpcoming = selectedTimeSlot ? (() => {
                                            const now = new Date();
                                            const dayMap: { [key: string]: number } = {
                                                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                                                'Thursday': 4, 'Friday': 5, 'Saturday': 6
                                            };
                                            const slotDay = dayMap[selectedTimeSlot.day];
                                            const currentDay = now.getDay();
                                            const [slotHour] = selectedTimeSlot.slot.startTime.split(':').map(Number);
                                            const currentHour = now.getHours();

                                            // Nếu là hôm nay hoặc ngày mai và chưa qua giờ
                                            return (slotDay === currentDay && slotHour >= currentHour) ||
                                                (slotDay === currentDay + 1) ||
                                                (slotDay === currentDay - 6); // Chủ nhật nếu hôm nay là thứ 2
                                        })() : false;

                                        // Map độ khó
                                        const doKhoLabels: { [key: string]: string } = {
                                            'DE': 'Dễ',
                                            'TRUNG_BINH': 'Trung bình',
                                            'KHO': 'Khó',
                                            'RAT_KHO': 'Rất khó'
                                        };
                                        const doKhoLabel = session.doKho ? doKhoLabels[session.doKho] || 'Trung bình' : 'Trung bình';

                                        // Format ngày giờ
                                        const dayLabel = selectedTimeSlot ? daysOfWeek.find(d => d.key === selectedTimeSlot.day)?.label : '';
                                        const timeLabel = selectedTimeSlot ? selectedTimeSlot.slot.label : '';
                                        const slotLabel = `Còn ${session.soChoToiDa - session.soChoDaDangKy}/${session.soChoToiDa} chỗ`;

                                        return (
                                            <div
                                                key={session.id}
                                                className={`session-card ${isDisabled ? 'disabled' : ''}`}
                                                onClick={() => !isDisabled && handleSessionSelect(session)}
                                            >
                                                {/* Image Container with Badges and Favorite */}
                                                <div className="session-card-image-container">
                                                    <div className="session-card-image">
                                                        {session.hinhAnh ? (
                                                            <img src={session.hinhAnh} alt={session.tenBuoiTap} />
                                                        ) : (
                                                            <div className="session-placeholder">🏋️</div>
                                                        )}
                                                    </div>

                                                    {/* Badges ở góc trên trái */}
                                                    <div className="session-badges">
                                                        {isUpcoming && (
                                                            <span className="badge badge-upcoming">Sắp diễn ra</span>
                                                        )}
                                                        <span className="badge badge-difficulty">{doKhoLabel}</span>
                                                    </div>

                                                    {/* Icon yêu thích ở góc trên phải */}
                                                    <div className="session-favorite-icon" onClick={(e) => {
                                                        e.stopPropagation();
                                                        // TODO: Implement favorite functionality
                                                    }}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="session-content">
                                                    <h3 className="session-title">{session.tenBuoiTap}</h3>
                                                    <p className="session-subtitle">{session.moTa || 'Buổi tập chất lượng cao'}</p>

                                                    {/* Info Row với icons */}
                                                    <div className="session-info-row">
                                                        <div className="info-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                                            </svg>
                                                            <span>{dayLabel}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            <span>{timeLabel}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                                <circle cx="9" cy="7" r="4"></circle>
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                            </svg>
                                                            <span>{slotLabel}</span>
                                                        </div>
                                                    </div>

                                                    {/* Register Button */}
                                                    <button
                                                        className="session-register-btn"
                                                        disabled={isDisabled}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!isDisabled) {
                                                                handleSessionSelect(session);
                                                            }
                                                        }}
                                                    >
                                                        {isDisabled ? (isFull ? 'Đã đầy' : 'Không khả dụng') : 'Đăng ký buổi tập'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="workflow-actions">
                <Button variant="ghost" onClick={onBack}>
                    Quay lại
                </Button>
                <Button
                    variant="primary"
                    onClick={handleGenerateSchedule}
                    disabled={selectedSessions.length === 0 || isGenerating}
                >
                    {isGenerating ? 'Đang tạo lịch...' : `Tạo lịch tập (${selectedSessions.length} buổi)`}
                </Button>
            </div>
        </div>
    );
};

export default ScheduleGeneration;
