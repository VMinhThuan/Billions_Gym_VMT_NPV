import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './WorkflowComponents.css';

const ScheduleSelection = ({ registrationId, selectedSchedule, onCreateSchedule, loading }) => {
    const [scheduleData, setScheduleData] = useState({
        cacNgayTap: [],
        khungGioTap: []
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const daysOfWeek = [
        { value: 'monday', label: 'Thứ 2' },
        { value: 'tuesday', label: 'Thứ 3' },
        { value: 'wednesday', label: 'Thứ 4' },
        { value: 'thursday', label: 'Thứ 5' },
        { value: 'friday', label: 'Thứ 6' },
        { value: 'saturday', label: 'Thứ 7' },
        { value: 'sunday', label: 'Chủ nhật' }
    ];

    const timeSlots = [
        '06:00-08:00',
        '08:00-10:00',
        '10:00-12:00',
        '14:00-16:00',
        '16:00-18:00',
        '18:00-20:00',
        '20:00-22:00'
    ];

    const handleDayChange = (day) => {
        setScheduleData(prev => ({
            ...prev,
            cacNgayTap: prev.cacNgayTap.includes(day)
                ? prev.cacNgayTap.filter(d => d !== day)
                : [...prev.cacNgayTap, day]
        }));
    };

    const handleTimeSlotChange = (timeSlot) => {
        setScheduleData(prev => ({
            ...prev,
            khungGioTap: prev.khungGioTap.includes(timeSlot)
                ? prev.khungGioTap.filter(t => t !== timeSlot)
                : [...prev.khungGioTap, timeSlot]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (scheduleData.cacNgayTap.length === 0) {
            setError('Vui lòng chọn ít nhất một ngày tập');
            return;
        }

        if (scheduleData.khungGioTap.length === 0) {
            setError('Vui lòng chọn ít nhất một khung giờ tập');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await onCreateSchedule(scheduleData);
        } catch (err) {
            setError('Lỗi khi tạo lịch tập');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="schedule-selection">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin lịch tập...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="schedule-selection">
            <div className="selection-header">
                <h3>Tạo lịch tập luyện</h3>
                <p>Thiết lập lịch tập luyện phù hợp với thời gian của bạn.</p>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
                {/* Days Selection */}
                <div className="schedule-section">
                    <h4>Chọn ngày tập trong tuần</h4>
                    <div className="days-grid">
                        {daysOfWeek.map((day) => (
                            <label key={day.value} className="day-option">
                                <input
                                    type="checkbox"
                                    checked={scheduleData.cacNgayTap.includes(day.value)}
                                    onChange={() => handleDayChange(day.value)}
                                />
                                <span className="day-label">{day.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Time Slots Selection */}
                <div className="schedule-section">
                    <h4>Chọn khung giờ tập</h4>
                    <div className="time-slots-grid">
                        {timeSlots.map((timeSlot) => (
                            <label key={timeSlot} className="time-slot-option">
                                <input
                                    type="checkbox"
                                    checked={scheduleData.khungGioTap.includes(timeSlot)}
                                    onChange={() => handleTimeSlotChange(timeSlot)}
                                />
                                <span className="time-slot-label">{timeSlot}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Schedule Preview */}
                {(scheduleData.cacNgayTap.length > 0 || scheduleData.khungGioTap.length > 0) && (
                    <div className="schedule-preview">
                        <h4>Xem trước lịch tập</h4>
                        <div className="preview-content">
                            <div className="preview-section">
                                <strong>Ngày tập:</strong>
                                <div className="selected-days">
                                    {scheduleData.cacNgayTap.map(day => {
                                        const dayInfo = daysOfWeek.find(d => d.value === day);
                                        return (
                                            <span key={day} className="selected-item">
                                                {dayInfo?.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="preview-section">
                                <strong>Khung giờ:</strong>
                                <div className="selected-times">
                                    {scheduleData.khungGioTap.map(timeSlot => (
                                        <span key={timeSlot} className="selected-item">
                                            {timeSlot}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting || scheduleData.cacNgayTap.length === 0 || scheduleData.khungGioTap.length === 0}
                    >
                        {submitting ? 'Đang tạo lịch tập...' : 'Tạo lịch tập'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScheduleSelection;
