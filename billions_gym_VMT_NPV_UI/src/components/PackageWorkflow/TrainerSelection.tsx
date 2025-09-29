import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../Button';
import Card from '../Card';
import Loading from '../Loading';
import { useCrudNotifications } from '../../hooks/useNotification';
import './PackageWorkflow.css';

interface PT {
    _id: string;
    hoTen: string;
    danhGia: number;
    kinhNghiem: number;
    chuyenMon: string;
    moTa: string;
    anhDaiDien?: string;
}

interface TrainerSelectionProps {
    chiTietGoiTapId: string;
    onTrainerSelected: (ptId: string) => void;
    onBack: () => void;
}

const TrainerSelection: React.FC<TrainerSelectionProps> = ({
    chiTietGoiTapId,
    onTrainerSelected,
    onBack
}) => {
    const [availablePTs, setAvailablePTs] = useState<PT[]>([]);
    const [recommendedPT, setRecommendedPT] = useState<PT | null>(null);
    const [selectedPT, setSelectedPT] = useState<string>('');
    const [gioTapUuTien, setGioTapUuTien] = useState<string[]>([]);
    const [soNgayTapTrongTuan, setSoNgayTapTrongTuan] = useState<number>(3);
    const [isLoading, setIsLoading] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const notifications = useCrudNotifications();

    const timeSlots = [
        '06:00-08:00', '08:00-10:00', '10:00-12:00',
        '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'
    ];

    useEffect(() => {
        fetchAvailableTrainers();
    }, []);

    const fetchAvailableTrainers = async () => {
        setIsLoading(true);
        try {
            const response = await api.post(`/api/package-workflow/available-trainers/${chiTietGoiTapId}`, {
                gioTapUuTien,
                soNgayTapTrongTuan
            });

            if (response.success) {
                setAvailablePTs(response.data.availablePTs);
                setRecommendedPT(response.data.recommendedPT);
                if (response.data.recommendedPT) {
                    setSelectedPT(response.data.recommendedPT._id);
                }
            }
        } catch (error) {
            notifications.generic.error('Không thể tải danh sách PT');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeSlotChange = (timeSlot: string) => {
        setGioTapUuTien(prev => 
            prev.includes(timeSlot) 
                ? prev.filter(t => t !== timeSlot)
                : [...prev, timeSlot]
        );
    };

    const handleSelectTrainer = async () => {
        if (!selectedPT) {
            notifications.generic.error('Vui lòng chọn PT');
            return;
        }

        setIsSelecting(true);
        try {
            const response = await api.post(`/api/package-workflow/select-trainer/${chiTietGoiTapId}`, {
                ptId: selectedPT,
                gioTapUuTien,
                soNgayTapTrongTuan
            });

            if (response.success) {
                notifications.generic.success('Đã chọn PT thành công!');
                onTrainerSelected(selectedPT);
            }
        } catch (error) {
            notifications.generic.error('Không thể chọn PT');
        } finally {
            setIsSelecting(false);
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={`star ${index < Math.floor(rating) ? 'star-filled' : 'star-empty'}`}
            >
                ★
            </span>
        ));
    };

    if (isLoading) {
        return (
            <div className="trainer-selection-container">
                <Loading text="Đang tìm kiếm PT phù hợp..." />
            </div>
        );
    }

    return (
        <div className="trainer-selection-container">
            <div className="workflow-header">
                <h2>Chọn Huấn Luyện Viên</h2>
                <p>Chọn PT phù hợp với lịch tập và mục tiêu của bạn</p>
            </div>

            {/* Preferences Section */}
            <Card className="preferences-card">
                <h3>Tùy chọn lịch tập</h3>
                
                <div className="preference-group">
                    <label>Số ngày tập trong tuần:</label>
                    <select 
                        value={soNgayTapTrongTuan} 
                        onChange={(e) => setSoNgayTapTrongTuan(Number(e.target.value))}
                    >
                        <option value={2}>2 ngày/tuần</option>
                        <option value={3}>3 ngày/tuần</option>
                        <option value={4}>4 ngày/tuần</option>
                        <option value={5}>5 ngày/tuần</option>
                        <option value={6}>6 ngày/tuần</option>
                    </select>
                </div>

                <div className="preference-group">
                    <label>Khung giờ ưu tiên:</label>
                    <div className="time-slots-grid">
                        {timeSlots.map(slot => (
                            <label key={slot} className="time-slot-option">
                                <input
                                    type="checkbox"
                                    checked={gioTapUuTien.includes(slot)}
                                    onChange={() => handleTimeSlotChange(slot)}
                                />
                                <span>{slot}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <Button 
                    variant="secondary" 
                    onClick={fetchAvailableTrainers}
                    disabled={isLoading}
                >
                    Tìm PT phù hợp
                </Button>
            </Card>

            {/* Recommended Trainer */}
            {recommendedPT && (
                <Card className="recommended-trainer-card">
                    <div className="recommended-badge">
                        <span>🏆 Được đề xuất</span>
                    </div>
                    <div className="trainer-info">
                        <div className="trainer-avatar">
                            {recommendedPT.anhDaiDien ? (
                                <img src={recommendedPT.anhDaiDien} alt={recommendedPT.hoTen} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {recommendedPT.hoTen.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="trainer-details">
                            <h3>{recommendedPT.hoTen}</h3>
                            <div className="trainer-rating">
                                {renderStars(recommendedPT.danhGia || 0)}
                                <span>({recommendedPT.danhGia?.toFixed(1) || '0.0'})</span>
                            </div>
                            <p className="trainer-specialty">{recommendedPT.chuyenMon}</p>
                            <p className="trainer-experience">{recommendedPT.kinhNghiem} năm kinh nghiệm</p>
                            <p className="trainer-description">{recommendedPT.moTa}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Available Trainers List */}
            <div className="trainers-list">
                <h3>Danh sách PT có sẵn ({availablePTs.length})</h3>
                
                {availablePTs.length === 0 ? (
                    <Card className="no-trainers-card">
                        <p>Không tìm thấy PT phù hợp với khung giờ bạn chọn.</p>
                        <p>Vui lòng thử chọn khung giờ khác hoặc liên hệ để được hỗ trợ.</p>
                    </Card>
                ) : (
                    <div className="trainers-grid">
                        {availablePTs.map(pt => (
                            <Card 
                                key={pt._id} 
                                className={`trainer-card ${selectedPT === pt._id ? 'selected' : ''}`}
                                onClick={() => setSelectedPT(pt._id)}
                            >
                                <div className="trainer-card-content">
                                    <div className="trainer-avatar-small">
                                        {pt.anhDaiDien ? (
                                            <img src={pt.anhDaiDien} alt={pt.hoTen} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {pt.hoTen.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="trainer-info-compact">
                                        <h4>{pt.hoTen}</h4>
                                        <div className="trainer-rating-small">
                                            {renderStars(pt.danhGia || 0)}
                                            <span>({pt.danhGia?.toFixed(1) || '0.0'})</span>
                                        </div>
                                        <p className="trainer-specialty-small">{pt.chuyenMon}</p>
                                        <p className="trainer-experience-small">{pt.kinhNghiem} năm</p>
                                    </div>
                                    <div className="selection-indicator">
                                        {selectedPT === pt._id && <span>✓</span>}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="workflow-actions">
                <Button variant="ghost" onClick={onBack}>
                    Quay lại
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSelectTrainer}
                    disabled={!selectedPT || isSelecting}
                >
                    {isSelecting ? 'Đang xử lý...' : 'Chọn PT này'}
                </Button>
            </div>
        </div>
    );
};

export default TrainerSelection;
