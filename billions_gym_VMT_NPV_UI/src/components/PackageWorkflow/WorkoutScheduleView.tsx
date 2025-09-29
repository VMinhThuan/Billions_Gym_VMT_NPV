import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../Button';
import Card from '../Card';
import Loading from '../Loading';
import { useCrudNotifications } from '../../hooks/useNotification';
import './PackageWorkflow.css';

interface WorkoutScheduleViewProps {
    chiTietGoiTapId: string;
    onComplete: () => void;
    onBack: () => void;
}

interface BuoiTap {
    _id: string;
    ngayTap: Date;
    gioBatDauDuKien: string;
    gioKetThucDuKien: string;
    trangThaiXacNhan: string;
    trangThaiTap: string;
    cacBaiTap: any[];
}

interface LichTap {
    _id: string;
    ngayBatDau: Date;
    ngayKetThuc: Date;
    pt: {
        _id: string;
        hoTen: string;
        danhGia: number;
        chuyenMon: string;
    };
    cacBuoiTap: BuoiTap[];
    soNgayTapTrongTuan: number;
    cacNgayTap: string[];
    khungGioTap: Array<{
        ngayTrongTuan: string;
        gioBatDau: string;
        gioKetThuc: string;
    }>;
    trangThaiLich: string;
}

const WorkoutScheduleView: React.FC<WorkoutScheduleViewProps> = ({
    chiTietGoiTapId,
    onComplete,
    onBack
}) => {
    const [lichTap, setLichTap] = useState<LichTap | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(0);
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
        fetchWorkoutSchedule();
    }, []);

    const fetchWorkoutSchedule = async () => {
        setIsLoading(true);
        try {
            // Get member ID from chiTietGoiTap first
            const chiTietResponse = await api.get(`/api/chitietgoitap/${chiTietGoiTapId}`);
            if (chiTietResponse && chiTietResponse.maHoiVien) {
                const response = await api.get(`/api/package-workflow/member-schedule/${chiTietResponse.maHoiVien}`);
                if (response.success && response.data.length > 0) {
                    // Find the schedule for this specific package registration
                    const relevantSchedule = response.data.find((schedule: any) => 
                        schedule.chiTietGoiTap === chiTietGoiTapId
                    );
                    setLichTap(relevantSchedule || response.data[0]);
                }
            }
        } catch (error) {
            notifications.generic.error('Không thể tải lịch tập');
        } finally {
            setIsLoading(false);
        }
    };

    const getWeeksInSchedule = () => {
        if (!lichTap) return [];
        
        const startDate = new Date(lichTap.ngayBatDau);
        const endDate = new Date(lichTap.ngayKetThuc);
        const weeks = [];
        
        let currentWeekStart = new Date(startDate);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Start from Monday
        
        while (currentWeekStart <= endDate) {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            weeks.push({
                start: new Date(currentWeekStart),
                end: weekEnd,
                label: `Tuần ${weeks.length + 1}`
            });
            
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        
        return weeks;
    };

    const getSessionsForWeek = (weekIndex: number) => {
        if (!lichTap) return [];
        
        const weeks = getWeeksInSchedule();
        if (!weeks[weekIndex]) return [];
        
        const weekStart = weeks[weekIndex].start;
        const weekEnd = weeks[weekIndex].end;
        
        return lichTap.cacBuoiTap.filter(session => {
            const sessionDate = new Date(session.ngayTap);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getDayOfWeek = (date: Date) => {
        const dayIndex = new Date(date).getDay();
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[dayIndex];
    };

    const getStatusBadge = (status: string) => {
        const statusMap = {
            'CHO_XAC_NHAN': { label: 'Chờ xác nhận', class: 'pending' },
            'DA_XAC_NHAN': { label: 'Đã xác nhận', class: 'confirmed' },
            'DA_HUY': { label: 'Đã hủy', class: 'cancelled' },
            'DA_HOAN_THANH': { label: 'Hoàn thành', class: 'completed' },
            'CHUA_HOAN_THANH': { label: 'Chưa hoàn thành', class: 'incomplete' }
        };
        
        const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, class: 'default' };
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    if (isLoading) {
        return (
            <div className="workout-schedule-view">
                <Loading text="Đang tải lịch tập..." />
            </div>
        );
    }

    if (!lichTap) {
        return (
            <div className="workout-schedule-view">
                <Card className="no-schedule-card">
                    <h3>Chưa có lịch tập</h3>
                    <p>Lịch tập chưa được tạo. Vui lòng quay lại bước trước để tạo lịch.</p>
                    <Button variant="primary" onClick={onBack}>
                        Quay lại tạo lịch
                    </Button>
                </Card>
            </div>
        );
    }

    const weeks = getWeeksInSchedule();
    const currentWeekSessions = getSessionsForWeek(selectedWeek);

    return (
        <div className="workout-schedule-view">
            <div className="workflow-header">
                <h2>Lịch Tập Của Bạn</h2>
                <p>Xem và quản lý lịch tập đã được tạo</p>
            </div>

            {/* Schedule Overview */}
            <Card className="schedule-overview-card">
                <div className="schedule-info">
                    <div className="info-item">
                        <span className="label">Huấn luyện viên:</span>
                        <span className="value">{lichTap.pt.hoTen}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Chuyên môn:</span>
                        <span className="value">{lichTap.pt.chuyenMon}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Đánh giá:</span>
                        <span className="value">⭐ {lichTap.pt.danhGia?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Thời gian:</span>
                        <span className="value">{formatDate(lichTap.ngayBatDau)} - {formatDate(lichTap.ngayKetThuc)}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Số ngày/tuần:</span>
                        <span className="value">{lichTap.soNgayTapTrongTuan} ngày</span>
                    </div>
                </div>
            </Card>

            {/* Weekly Schedule */}
            <Card className="weekly-schedule-card">
                <div className="week-selector">
                    <h3>Lịch tập theo tuần</h3>
                    <div className="week-tabs">
                        {weeks.map((week, index) => (
                            <button
                                key={index}
                                className={`week-tab ${selectedWeek === index ? 'active' : ''}`}
                                onClick={() => setSelectedWeek(index)}
                            >
                                {week.label}
                                <small>({formatDate(week.start)} - {formatDate(week.end)})</small>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="week-sessions">
                    {currentWeekSessions.length === 0 ? (
                        <div className="no-sessions">
                            <p>Không có buổi tập nào trong tuần này</p>
                        </div>
                    ) : (
                        <div className="sessions-grid">
                            {currentWeekSessions.map(session => (
                                <Card key={session._id} className="session-card">
                                    <div className="session-header">
                                        <div className="session-date">
                                            <span className="day">{getDayOfWeek(session.ngayTap)}</span>
                                            <span className="date">{formatDate(session.ngayTap)}</span>
                                        </div>
                                        <div className="session-time">
                                            {session.gioBatDauDuKien} - {session.gioKetThucDuKien}
                                        </div>
                                    </div>
                                    
                                    <div className="session-status">
                                        {getStatusBadge(session.trangThaiXacNhan)}
                                        {getStatusBadge(session.trangThaiTap)}
                                    </div>

                                    <div className="session-exercises">
                                        {session.cacBaiTap.length > 0 ? (
                                            <div>
                                                <strong>Bài tập:</strong>
                                                <ul>
                                                    {session.cacBaiTap.map((exercise, index) => (
                                                        <li key={index}>
                                                            {exercise.baiTap?.tenBaiTap || 'Chưa có bài tập'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="no-exercises">PT sẽ thêm bài tập sau</p>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Schedule Pattern */}
            <Card className="schedule-pattern-card">
                <h3>Mẫu lịch tập hàng tuần</h3>
                <div className="pattern-grid">
                    {daysOfWeek.map(day => {
                        const isWorkoutDay = lichTap.cacNgayTap.includes(day.key);
                        const timeSlot = lichTap.khungGioTap.find(slot => slot.ngayTrongTuan === day.key);
                        
                        return (
                            <div key={day.key} className={`pattern-day ${isWorkoutDay ? 'workout-day' : 'rest-day'}`}>
                                <div className="day-label">{day.label}</div>
                                {isWorkoutDay && timeSlot ? (
                                    <div className="workout-time">
                                        {timeSlot.gioBatDau} - {timeSlot.gioKetThuc}
                                    </div>
                                ) : (
                                    <div className="rest-label">Nghỉ</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="workflow-actions">
                <Button variant="ghost" onClick={onBack}>
                    Chỉnh sửa lịch
                </Button>
                <Button variant="primary" onClick={onComplete}>
                    Hoàn thành
                </Button>
            </div>
        </div>
    );
};

export default WorkoutScheduleView;
