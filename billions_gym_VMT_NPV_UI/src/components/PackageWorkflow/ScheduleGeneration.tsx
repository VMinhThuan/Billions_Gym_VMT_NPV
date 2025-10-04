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
    ngayTrongTuan: string;
    gioBatDau: string;
    gioKetThuc: string;
}

const ScheduleGeneration: React.FC<ScheduleGenerationProps> = ({
    chiTietGoiTapId,
    selectedPTId,
    onScheduleGenerated,
    onBack
}) => {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [ptSchedule, setPtSchedule] = useState<any[]>([]);
    const [isLoadingPTSchedule, setIsLoadingPTSchedule] = useState(false);
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

    const availableTimeSlots = [
        '06:00-08:00', '08:00-10:00', '10:00-12:00',
        '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'
    ];

    useEffect(() => {
        fetchPTSchedule();
    }, [selectedPTId]);

    const fetchPTSchedule = async () => {
        setIsLoadingPTSchedule(true);
        try {
            console.log('🔍 Fetching PT schedule for ID:', selectedPTId);
            const response = await api.get(`/api/package-workflow/trainer-schedule/${selectedPTId}`);
            console.log('🔍 PT Schedule API response:', response);

            if (response.success) {
                // API trả về { lichLamViec: [...], cacBuoiTapDaLenLich: [...] }
                const scheduleData = response.data?.lichLamViec || [];
                console.log('🔍 Extracted lichLamViec:', scheduleData);
                setPtSchedule(Array.isArray(scheduleData) ? scheduleData : []);
            } else {
                console.log('🔍 API response not successful:', response);
                setPtSchedule([]);
            }
        } catch (error) {
            console.error('Error fetching PT schedule:', error);
            setPtSchedule([]);
        } finally {
            setIsLoadingPTSchedule(false);
        }
    };

    const handleDaySelection = (day: string) => {
        setSelectedDays(prev => {
            const newDays = prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day];

            // Update time slots when days change
            setTimeSlots(prevSlots =>
                prevSlots.filter(slot => newDays.includes(slot.ngayTrongTuan))
            );

            return newDays;
        });
    };

    const handleTimeSlotChange = (day: string, timeRange: string) => {
        const [gioBatDau, gioKetThuc] = timeRange.split('-');

        setTimeSlots(prev => {
            const filtered = prev.filter(slot => slot.ngayTrongTuan !== day);
            return [...filtered, { ngayTrongTuan: day, gioBatDau, gioKetThuc }];
        });
    };

    const isPTAvailable = (day: string, timeRange: string) => {
        const ptDaySchedule = ptSchedule.find(schedule => schedule.thu === day);

        // Nếu PT chưa có lịch làm việc thì coi như rảnh (available)
        if (!ptDaySchedule) {
            console.log('🔍 No schedule found for day:', day, '- Assuming PT is available');
            return true;
        }

        const [startTime, endTime] = timeRange.split('-');

        // Kiểm tra xem có slot nào rảnh trong khung giờ này không
        return ptDaySchedule.gioLamViec.some((slot: any) =>
            slot.trangThai === 'RANH' &&
            slot.gioBatDau <= startTime &&
            slot.gioKetThuc >= endTime
        );
    };

    const handleGenerateSchedule = async () => {
        if (selectedDays.length === 0) {
            notifications.generic.error('Vui lòng chọn ít nhất 1 ngày tập');
            return;
        }

        if (timeSlots.length !== selectedDays.length) {
            notifications.generic.error('Vui lòng chọn khung giờ cho tất cả các ngày đã chọn');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await api.post(`/api/package-workflow/generate-schedule/${chiTietGoiTapId}`, {
                cacNgayTap: selectedDays,
                khungGioTap: timeSlots
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

    if (isLoadingPTSchedule) {
        return (
            <div className="schedule-generation-container">
                <Loading text="Đang tải lịch làm việc của PT..." />
            </div>
        );
    }

    return (
        <div className="schedule-generation-container">
            <div className="workflow-header">
                <h2>Tạo Lịch Tập</h2>
                <p>Chọn ngày và giờ tập phù hợp với lịch của bạn và PT</p>
            </div>

            {/* Day Selection */}
            <Card className="day-selection-card">
                <h3>Chọn ngày tập trong tuần</h3>
                <div className="days-grid">
                    {daysOfWeek.map(day => (
                        <label key={day.key} className="day-option">
                            <input
                                type="checkbox"
                                checked={selectedDays.includes(day.key)}
                                onChange={() => handleDaySelection(day.key)}
                            />
                            <span className="day-label">{day.label}</span>
                        </label>
                    ))}
                </div>
                <p className="selection-info">
                    Đã chọn: {selectedDays.length} ngày
                </p>
            </Card>

            {/* Time Slot Selection */}
            {selectedDays.length > 0 && (
                <Card className="time-selection-card">
                    <h3>Chọn khung giờ tập</h3>
                    {selectedDays.map(day => {
                        const dayLabel = daysOfWeek.find(d => d.key === day)?.label;
                        const currentTimeSlot = timeSlots.find(slot => slot.ngayTrongTuan === day);

                        return (
                            <div key={day} className="day-time-selection">
                                <h4>{dayLabel}</h4>
                                <div className="time-slots-grid">
                                    {availableTimeSlots.map(timeRange => {
                                        const isAvailable = isPTAvailable(day, timeRange);
                                        const isSelected = currentTimeSlot &&
                                            `${currentTimeSlot.gioBatDau}-${currentTimeSlot.gioKetThuc}` === timeRange;

                                        return (
                                            <label
                                                key={timeRange}
                                                className={`time-slot-option ${!isAvailable ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`time-${day}`}
                                                    value={timeRange}
                                                    checked={isSelected}
                                                    disabled={!isAvailable}
                                                    onChange={() => handleTimeSlotChange(day, timeRange)}
                                                />
                                                <span className="time-range">{timeRange}</span>
                                                {!isAvailable && <span className="unavailable-badge">PT bận</span>}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </Card>
            )}

            {/* Schedule Preview */}
            {timeSlots.length > 0 && (
                <Card className="schedule-preview-card">
                    <h3>Xem trước lịch tập</h3>
                    <div className="schedule-preview">
                        {timeSlots.map(slot => {
                            const dayLabel = daysOfWeek.find(d => d.key === slot.ngayTrongTuan)?.label;
                            return (
                                <div key={slot.ngayTrongTuan} className="schedule-item">
                                    <span className="day">{dayLabel}</span>
                                    <span className="time">{slot.gioBatDau} - {slot.gioKetThuc}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* PT Availability Info */}
            <Card className="pt-availability-card">
                <h3>Lịch làm việc của PT</h3>
                {!ptSchedule || ptSchedule.length === 0 ? (
                    <p>PT chưa cập nhật lịch làm việc</p>
                ) : (
                    <div className="pt-schedule-grid">
                        {ptSchedule.map(schedule => {
                            const dayLabel = daysOfWeek.find(d => d.key === schedule.thu)?.label;
                            return (
                                <div key={schedule.thu} className="pt-day-schedule">
                                    <h4>{dayLabel}</h4>
                                    <div className="pt-time-slots">
                                        {schedule.gioLamViec.map((slot: any, index: number) => (
                                            <span
                                                key={index}
                                                className={`pt-time-slot ${slot.trangThai.toLowerCase()}`}
                                            >
                                                {slot.gioBatDau}-{slot.gioKetThuc}
                                                <small>({slot.trangThai === 'RANH' ? 'Rảnh' : slot.trangThai === 'BAN' ? 'Bận' : 'Nghỉ'})</small>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Action Buttons */}
            <div className="workflow-actions">
                <Button variant="ghost" onClick={onBack}>
                    Quay lại
                </Button>
                <Button
                    variant="primary"
                    onClick={handleGenerateSchedule}
                    disabled={selectedDays.length === 0 || timeSlots.length !== selectedDays.length || isGenerating}
                >
                    {isGenerating ? 'Đang tạo lịch...' : 'Tạo lịch tập'}
                </Button>
            </div>
        </div>
    );
};

export default ScheduleGeneration;
