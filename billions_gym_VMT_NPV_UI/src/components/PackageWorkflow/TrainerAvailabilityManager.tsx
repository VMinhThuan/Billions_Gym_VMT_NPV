import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../Button';
import Card from '../Card';
import Loading from '../Loading';
import { useCrudNotifications } from '../../hooks/useNotification';
import './PackageWorkflow.css';

interface TrainerAvailabilityManagerProps {
    ptId: string;
    onClose?: () => void;
}

interface TimeSlot {
    gioBatDau: string;
    gioKetThuc: string;
    trangThai: 'RANH' | 'BAN' | 'NGHI';
}

interface DaySchedule {
    thu: string;
    gioLamViec: TimeSlot[];
    ghiChu?: string;
}

const TrainerAvailabilityManager: React.FC<TrainerAvailabilityManagerProps> = ({
    ptId,
    onClose
}) => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const notifications = useCrudNotifications();

    const daysOfWeek = [
        { key: 'Monday', label: 'Thứ 2' },
        { key: 'Tuesday', label: 'Thứ 3' },
        { key: 'Wednesday', label: 'Thứ 4' },
        { key: 'Thursday', label: 'Thứ 5' },
        { key: 'Friday', label: 'Thứ 6' },
        { key: 'Saturday', label: 'Thứ 7' },
        { key: 'Sunday', label: 'Chủ nhật' }
    ];

    const defaultTimeSlots = [
        { gioBatDau: '06:00', gioKetThuc: '08:00', trangThai: 'RANH' as const },
        { gioBatDau: '08:00', gioKetThuc: '10:00', trangThai: 'RANH' as const },
        { gioBatDau: '10:00', gioKetThuc: '12:00', trangThai: 'RANH' as const },
        { gioBatDau: '14:00', gioKetThuc: '16:00', trangThai: 'RANH' as const },
        { gioBatDau: '16:00', gioKetThuc: '18:00', trangThai: 'RANH' as const },
        { gioBatDau: '18:00', gioKetThuc: '20:00', trangThai: 'RANH' as const },
        { gioBatDau: '20:00', gioKetThuc: '22:00', trangThai: 'RANH' as const }
    ];

    useEffect(() => {
        if (ptId) {
            fetchSchedule();
        }
    }, [ptId]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            console.log('Fetching schedule for PT:', ptId);
            const response = await api.get(`/api/package-workflow/trainer-schedule/${ptId}`);
            console.log('Schedule response:', response);

            // Always initialize with default schedule first
            const defaultSchedule = daysOfWeek.map(day => ({
                thu: day.key,
                gioLamViec: [...defaultTimeSlots],
                ghiChu: ''
            }));

            if (response && response.success && response.data) {
                const scheduleData = response.data;
                if (scheduleData.lichLamViec && Array.isArray(scheduleData.lichLamViec) && scheduleData.lichLamViec.length > 0) {
                    // Merge existing schedule with default to ensure all days are present
                    const mergedSchedule = defaultSchedule.map(defaultDay => {
                        const existingDay = scheduleData.lichLamViec.find((d: any) => d.thu === defaultDay.thu);
                        return existingDay || defaultDay;
                    });
                    setSchedule(mergedSchedule);
                } else {
                    setSchedule(defaultSchedule);
                }
            } else {
                console.log('No existing schedule found, using default schedule');
                setSchedule(defaultSchedule);
            }
        } catch (error) {
            console.error('Error fetching trainer schedule:', error);
            // Always show default schedule even on error
            const defaultSchedule = daysOfWeek.map(day => ({
                thu: day.key,
                gioLamViec: [...defaultTimeSlots],
                ghiChu: ''
            }));
            setSchedule(defaultSchedule);
            notifications.generic.info('Đã tạo lịch làm việc mặc định cho PT');
        } finally {
            setIsLoading(false);
        }
    };

    const updateTimeSlotStatus = (dayKey: string, slotIndex: number, newStatus: 'RANH' | 'BAN' | 'NGHI') => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                const updatedSlots = [...day.gioLamViec];
                updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], trangThai: newStatus };
                return { ...day, gioLamViec: updatedSlots };
            }
            return day;
        }));
    };

    const addTimeSlot = (dayKey: string) => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                const newSlot: TimeSlot = {
                    gioBatDau: '09:00',
                    gioKetThuc: '10:00',
                    trangThai: 'RANH'
                };
                return { ...day, gioLamViec: [...day.gioLamViec, newSlot] };
            }
            return day;
        }));
    };

    const removeTimeSlot = (dayKey: string, slotIndex: number) => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                const updatedSlots = day.gioLamViec.filter((_, index) => index !== slotIndex);
                return { ...day, gioLamViec: updatedSlots };
            }
            return day;
        }));
    };

    const updateTimeSlot = (dayKey: string, slotIndex: number, field: 'gioBatDau' | 'gioKetThuc', value: string) => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                const updatedSlots = [...day.gioLamViec];
                updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: value };
                return { ...day, gioLamViec: updatedSlots };
            }
            return day;
        }));
    };

    const updateDayNote = (dayKey: string, note: string) => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                return { ...day, ghiChu: note };
            }
            return day;
        }));
    };

    const setDayOff = (dayKey: string) => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                const offSlots = day.gioLamViec.map(slot => ({ ...slot, trangThai: 'NGHI' as const }));
                return { ...day, gioLamViec: offSlots };
            }
            return day;
        }));
    };

    const setDayAvailable = (dayKey: string) => {
        setSchedule(prev => prev.map(day => {
            if (day.thu === dayKey) {
                const availableSlots = day.gioLamViec.map(slot => ({ ...slot, trangThai: 'RANH' as const }));
                return { ...day, gioLamViec: availableSlots };
            }
            return day;
        }));
    };

    const saveSchedule = async () => {
        setIsSaving(true);
        try {
            console.log('Saving schedule for PT:', ptId);
            console.log('Schedule data:', schedule);
            
            const response = await api.put(`/api/package-workflow/trainer-schedule/${ptId}`, {
                lichLamViec: schedule
            });

            console.log('Save response:', response);

            if (response && response.success) {
                notifications.generic.success('Đã cập nhật lịch làm việc thành công!');
                
                // Redirect to PT Schedule page instead of just closing modal
                setTimeout(() => {
                    window.location.hash = '#/admin/trainer_availability';
                    // Also close the modal
                    if (onClose) {
                        onClose();
                    }
                }, 1000); // Delay to show success message
            } else {
                throw new Error(response?.message || 'Không thể lưu lịch làm việc');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            notifications.generic.error('Không thể cập nhật lịch làm việc: ' + (error as any)?.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RANH': return 'available';
            case 'BAN': return 'busy';
            case 'NGHI': return 'off';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'RANH': return 'Rảnh';
            case 'BAN': return 'Bận';
            case 'NGHI': return 'Nghỉ';
            default: return status;
        }
    };

    if (isLoading) {
        return (
            <div className="trainer-availability-manager">
                <Loading text="Đang tải lịch làm việc..." />
            </div>
        );
    }

    return (
        <div className="trainer-availability-manager">
            <div className="manager-header">
                <h2>Quản lý lịch làm việc</h2>
                <p>Thiết lập thời gian rảnh để khách hàng có thể đặt lịch tập</p>
                <div className="quick-actions">
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            const allAvailableSchedule = daysOfWeek.map(day => ({
                                thu: day.key,
                                gioLamViec: defaultTimeSlots.map(slot => ({ ...slot, trangThai: 'RANH' as const })),
                                ghiChu: ''
                            }));
                            setSchedule(allAvailableSchedule);
                        }}
                    >
                        Đặt tất cả rảnh
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            const allOffSchedule = daysOfWeek.map(day => ({
                                thu: day.key,
                                gioLamViec: defaultTimeSlots.map(slot => ({ ...slot, trangThai: 'NGHI' as const })),
                                ghiChu: ''
                            }));
                            setSchedule(allOffSchedule);
                        }}
                    >
                        Đặt tất cả nghỉ
                    </Button>
                </div>
            </div>

            {schedule && schedule.length > 0 ? (
                <div className="schedule-grid">
                    {daysOfWeek.map(day => {
                        const daySchedule = schedule.find(s => s.thu === day.key);
                        if (!daySchedule) {
                            // Create default day schedule if missing
                            const defaultDay = {
                                thu: day.key,
                                gioLamViec: [...defaultTimeSlots],
                                ghiChu: ''
                            };
                            return (
                                <Card key={day.key} className="day-schedule-card">
                                    <div className="day-header">
                                        <h3>{day.label}</h3>
                                        <div className="day-actions">
                                            <Button 
                                                variant="ghost" 
                                                size="small"
                                                onClick={() => setDayAvailable(day.key)}
                                            >
                                                Tất cả rảnh
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="small"
                                                onClick={() => setDayOff(day.key)}
                                            >
                                                Nghỉ cả ngày
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="time-slots">
                                        {defaultDay.gioLamViec.map((slot, slotIndex) => (
                                            <div key={slotIndex} className="time-slot-editor">
                                                <div className="time-inputs">
                                                    <input
                                                        type="time"
                                                        value={slot.gioBatDau}
                                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'gioBatDau', e.target.value)}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="time"
                                                        value={slot.gioKetThuc}
                                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'gioKetThuc', e.target.value)}
                                                    />
                                                </div>

                                                <div className="status-selector">
                                                    {['RANH', 'BAN', 'NGHI'].map(status => (
                                                        <label key={status} className="status-option">
                                                            <input
                                                                type="radio"
                                                                name={`${day.key}-${slotIndex}-status`}
                                                                checked={slot.trangThai === status}
                                                                onChange={() => updateTimeSlotStatus(day.key, slotIndex, status as any)}
                                                            />
                                                            <span className={`status-label ${getStatusColor(status)}`}>
                                                                {getStatusLabel(status)}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    onClick={() => removeTimeSlot(day.key, slotIndex)}
                                                    className="remove-slot-btn"
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            variant="secondary"
                                            size="small"
                                            onClick={() => addTimeSlot(day.key)}
                                            className="add-slot-btn"
                                        >
                                            + Thêm khung giờ
                                        </Button>
                                    </div>

                                    <div className="day-note">
                                        <textarea
                                            placeholder="Ghi chú cho ngày này..."
                                            value={defaultDay.ghiChu || ''}
                                            onChange={(e) => updateDayNote(day.key, e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </Card>
                            );
                        }

                        return (
                            <Card key={day.key} className="day-schedule-card">
                                <div className="day-header">
                                    <h3>{day.label}</h3>
                                    <div className="day-actions">
                                        <Button 
                                            variant="ghost" 
                                            size="small"
                                            onClick={() => setDayAvailable(day.key)}
                                        >
                                            Tất cả rảnh
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="small"
                                            onClick={() => setDayOff(day.key)}
                                        >
                                            Nghỉ cả ngày
                                        </Button>
                                    </div>
                                </div>

                                <div className="time-slots">
                                    {daySchedule.gioLamViec && daySchedule.gioLamViec.length > 0 ? (
                                        daySchedule.gioLamViec.map((slot, slotIndex) => (
                                            <div key={slotIndex} className="time-slot-editor">
                                                <div className="time-inputs">
                                                    <input
                                                        type="time"
                                                        value={slot.gioBatDau}
                                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'gioBatDau', e.target.value)}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="time"
                                                        value={slot.gioKetThuc}
                                                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'gioKetThuc', e.target.value)}
                                                    />
                                                </div>

                                                <div className="status-selector">
                                                    {['RANH', 'BAN', 'NGHI'].map(status => (
                                                        <label key={status} className="status-option">
                                                            <input
                                                                type="radio"
                                                                name={`${day.key}-${slotIndex}-status`}
                                                                checked={slot.trangThai === status}
                                                                onChange={() => updateTimeSlotStatus(day.key, slotIndex, status as any)}
                                                            />
                                                            <span className={`status-label ${getStatusColor(status)}`}>
                                                                {getStatusLabel(status)}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="small"
                                                    onClick={() => removeTimeSlot(day.key, slotIndex)}
                                                    className="remove-slot-btn"
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-slots">
                                            <p>Chưa có khung giờ nào</p>
                                        </div>
                                    )}

                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={() => addTimeSlot(day.key)}
                                        className="add-slot-btn"
                                    >
                                        + Thêm khung giờ
                                    </Button>
                                </div>

                                <div className="day-note">
                                    <textarea
                                        placeholder="Ghi chú cho ngày này..."
                                        value={daySchedule.ghiChu || ''}
                                        onChange={(e) => updateDayNote(day.key, e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="no-schedule">
                    <p>Đang tải lịch làm việc...</p>
                    <Button 
                        variant="primary" 
                        onClick={() => {
                            const defaultSchedule = daysOfWeek.map(day => ({
                                thu: day.key,
                                gioLamViec: [...defaultTimeSlots],
                                ghiChu: ''
                            }));
                            setSchedule(defaultSchedule);
                        }}
                    >
                        Tạo lịch mặc định
                    </Button>
                </div>
            )}

            <div className="manager-actions">
                {onClose && (
                    <Button variant="ghost" onClick={onClose}>
                        Hủy
                    </Button>
                )}
                <Button 
                    variant="primary" 
                    onClick={saveSchedule}
                    disabled={isSaving}
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu lịch làm việc'}
                </Button>
            </div>

            <div className="legend">
                <h4>Chú thích:</h4>
                <div className="legend-items">
                    <span className="legend-item">
                        <span className="legend-color available"></span>
                        Rảnh - Khách hàng có thể đặt lịch
                    </span>
                    <span className="legend-item">
                        <span className="legend-color busy"></span>
                        Bận - Đã có lịch hoặc không nhận thêm
                    </span>
                    <span className="legend-item">
                        <span className="legend-color off"></span>
                        Nghỉ - Không làm việc
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TrainerAvailabilityManager;
