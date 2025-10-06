import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../Card';
import Loading from '../Loading';
import { useCrudNotifications } from '../../hooks/useNotification';
import './PackageWorkflow.css';

interface TrainerScheduleViewProps {
    ptId: string;
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

interface ScheduledSession {
    _id: string;
    hoiVien: {
        _id: string;
        hoTen: string;
        sdt: string;
    };
    goiTap: {
        _id: string;
        tenGoiTap: string;
    };
    soLuongBuoiTap: number;
    trangThai: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    cacBuoiTap: any[];
}

interface TrainerScheduleData {
    lichLamViec: DaySchedule[];
    cacBuoiTapDaLenLich: ScheduledSession[];
}

const TrainerScheduleView: React.FC<TrainerScheduleViewProps> = ({ ptId }) => {
    const [scheduleData, setScheduleData] = useState<TrainerScheduleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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

    useEffect(() => {
        fetchScheduleData();
    }, [ptId]);

    const fetchScheduleData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/package-workflow/trainer-schedule/${ptId}`);
            if (response.success) {
                setScheduleData(response.data);
            }
        } catch (error) {
            console.error('Error fetching trainer schedule:', error);
            notifications.generic.error('Không thể tải lịch làm việc');
        } finally {
            setIsLoading(false);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (isLoading) {
        return (
            <div className="trainer-schedule-view">
                <Loading text="Đang tải lịch làm việc..." />
            </div>
        );
    }

    if (!scheduleData) {
        return (
            <div className="trainer-schedule-view">
                <div className="empty-state">
                    <h3>Không có dữ liệu lịch làm việc</h3>
                    <p>Vui lòng thiết lập lịch làm việc cho PT này</p>
                </div>
            </div>
        );
    }

    return (
        <div className="trainer-schedule-view">
            <div className="schedule-header">
                <h2>Lịch làm việc và buổi tập đã lên lịch</h2>
            </div>

            <div className="schedule-content">
                {/* Availability Schedule */}
                <div className="availability-section">
                    <h3>Lịch làm việc trong tuần</h3>
                    <div className="schedule-grid">
                        {daysOfWeek.map(day => {
                            const daySchedule = scheduleData.lichLamViec.find(s => s.thu === day.key);
                            
                            return (
                                <Card key={day.key} className="day-schedule-card">
                                    <div className="day-header">
                                        <h4>{day.label}</h4>
                                    </div>
                                    
                                    {daySchedule && daySchedule.gioLamViec.length > 0 ? (
                                        <div className="time-slots-display">
                                            {daySchedule.gioLamViec.map((slot, index) => (
                                                <div key={index} className="time-slot-display">
                                                    <span className="time-range">
                                                        {slot.gioBatDau} - {slot.gioKetThuc}
                                                    </span>
                                                    <span className={`status-badge ${getStatusColor(slot.trangThai)}`}>
                                                        {getStatusLabel(slot.trangThai)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-schedule">
                                            <span>Chưa thiết lập lịch</span>
                                        </div>
                                    )}
                                    
                                    {daySchedule?.ghiChu && (
                                        <div className="day-note-display">
                                            <small>{daySchedule.ghiChu}</small>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Scheduled Sessions */}
                <div className="sessions-section">
                    <h3>Các buổi tập đã lên lịch ({scheduleData.cacBuoiTapDaLenLich.length})</h3>
                    
                    {scheduleData.cacBuoiTapDaLenLich.length > 0 ? (
                        <div className="sessions-grid">
                            {scheduleData.cacBuoiTapDaLenLich.map(session => (
                                <Card key={session._id} className="session-card">
                                    <div className="session-header">
                                        <div className="member-info">
                                            <h4>{session.hoiVien?.hoTen || 'N/A'}</h4>
                                            <span className="member-phone">{session.hoiVien?.sdt || 'N/A'}</span>
                                        </div>
                                        <span className={`status-badge ${session.trangThai.toLowerCase()}`}>
                                            {session.trangThai}
                                        </span>
                                    </div>
                                    
                                    <div className="session-details">
                                        <div className="detail-item">
                                            <span className="label">Gói tập:</span>
                                            <span className="value">{session.goiTap?.tenGoiTap || 'N/A'}</span>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <span className="label">Số buổi:</span>
                                            <span className="value">{session.soLuongBuoiTap} buổi</span>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <span className="label">Thời gian:</span>
                                            <span className="value">
                                                {formatDate(session.ngayBatDau)} - {formatDate(session.ngayKetThuc)}
                                            </span>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <span className="label">Buổi đã tập:</span>
                                            <span className="value">
                                                {session.cacBuoiTap?.filter(b => b.trangThai === 'DA_HOAN_THANH').length || 0} / {session.soLuongBuoiTap}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h4>Chưa có buổi tập nào được lên lịch</h4>
                            <p>Các buổi tập sẽ hiển thị ở đây khi khách hàng đăng ký và chọn PT này</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="legend">
                <h4>Chú thích trạng thái:</h4>
                <div className="legend-items">
                    <span className="legend-item">
                        <span className="legend-color available"></span>
                        Rảnh - Có thể nhận thêm khách
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

export default TrainerScheduleView;
