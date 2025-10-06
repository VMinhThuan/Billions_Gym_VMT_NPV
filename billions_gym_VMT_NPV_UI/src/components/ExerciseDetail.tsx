import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ExerciseDetail.css';

interface Exercise {
    _id?: string;
    tenBaiTap: string;
    moTa: string;
    hinhAnh: string;
    nhomCo: string;
    mucDoKho: string;
    thietBiSuDung: string;
    soHiepvaSoLanLap: number;
    mucTieuBaiTap: string;
    hinhAnhMinhHoa: string;
    videoHuongDan: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ExerciseDetailProps {
    exercise: Exercise;
    onBack: () => void;
    onEdit?: (exercise: Exercise) => void;
    onDelete?: (id: string) => void;
    showManagement?: boolean;
}

const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
    exercise,
    onBack,
    onEdit,
    onDelete,
    showManagement = false
}) => {
    const { isDarkMode } = useTheme();

    const getNhomCoLabel = (nhomCo: string) => {
        const labels: { [key: string]: string } = {
            'CHEST': '💪 Ngực',
            'BACK': '🔙 Lưng',
            'SHOULDERS': '🤷 Vai',
            'BICEPS': '💪 Cơ Nhị Đầu',
            'TRICEPS': '🦾 Cơ Tam Đầu',
            'FOREARMS': '🤏 Cẳng Tay',
            'QUADS': '🦵 Cơ Tứ Đầu',
            'HAMSTRINGS': '🦵 Cơ Gân Kheo',
            'GLUTES': '🍑 Cơ Mông',
            'CALVES': '🦵 Cơ Bắp Chân',
            'ABS': '🏋️ Cơ Bụng',
            'CORE': '🎯 Cơ Lõi',
            'CARDIO': '❤️ Tim Mạch',
            'FULL_BODY': '🏃‍♂️ Toàn Thân'
        };
        return labels[nhomCo] || nhomCo;
    };

    const getMucDoKhoInfo = (mucDoKho: string) => {
        const info: { [key: string]: { label: string; color: string; bgColor: string } } = {
            'BEGINNER': { 
                label: 'Người Mới', 
                color: '#10b981', 
                bgColor: 'rgba(16, 185, 129, 0.1)' 
            },
            'INTERMEDIATE': { 
                label: 'Trung Bình', 
                color: '#f59e0b', 
                bgColor: 'rgba(245, 158, 11, 0.1)' 
            },
            'ADVANCED': { 
                label: 'Nâng Cao', 
                color: '#f97316', 
                bgColor: 'rgba(249, 115, 22, 0.1)' 
            },
            'EXPERT': { 
                label: 'Chuyên Gia', 
                color: '#dc2626', 
                bgColor: 'rgba(220, 38, 38, 0.1)' 
            }
        };
        return info[mucDoKho] || { label: mucDoKho, color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
    };

    const handleEdit = () => {
        if (onEdit) onEdit(exercise);
    };

    const handleDelete = () => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
        if (onDelete && exercise._id) {
            onDelete(exercise._id);
            onBack();
        }
    };

    const mucDoKhoInfo = getMucDoKhoInfo(exercise.mucDoKho);

    return (
        <div className={`exercise-detail ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <div className="detail-header">
                <button className="back-btn" onClick={onBack}>
                    <span className="back-icon">←</span>
                    <span>Quay lại</span>
                </button>
                
                {showManagement && (
                    <div className="header-actions">
                        <button className="action-btn edit-btn" onClick={handleEdit}>
                            <span className="btn-icon">✏️</span>
                            Chỉnh sửa
                        </button>
                        <button className="action-btn delete-btn" onClick={handleDelete}>
                            <span className="btn-icon">🗑️</span>
                            Xóa
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="detail-content">
                {/* Hero Section */}
                <div className="detail-hero">
                    <div className="hero-image">
                        {exercise.hinhAnh ? (
                            <img src={exercise.hinhAnh} alt={exercise.tenBaiTap} />
                        ) : (
                            <div className="image-placeholder">
                                <span className="placeholder-icon">🏋️‍♂️</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="hero-info">
                        <h1 className="exercise-title">{exercise.tenBaiTap}</h1>
                        
                        <div className="exercise-badges">
                            <span className="badge nhom-co-badge">
                                {getNhomCoLabel(exercise.nhomCo)}
                            </span>
                            <span 
                                className="badge difficulty-badge"
                                style={{ 
                                    color: mucDoKhoInfo.color,
                                    backgroundColor: mucDoKhoInfo.bgColor,
                                    borderColor: mucDoKhoInfo.color
                                }}
                            >
                                {mucDoKhoInfo.label}
                            </span>
                        </div>

                        <div className="exercise-stats">
                            <div className="stat-item">
                                <span className="stat-icon">🕒</span>
                                <span className="stat-label">Thời gian</span>
                                <span className="stat-value">
                                    {exercise.soHiepvaSoLanLap > 0 ? `${exercise.soHiepvaSoLanLap} phút` : '30 phút'}
                                </span>
                            </div>
                            
                            <div className="stat-item">
                                <span className="stat-icon">🔥</span>
                                <span className="stat-label">Cường độ</span>
                                <span className="stat-value">{mucDoKhoInfo.label}</span>
                            </div>
                            
                            {exercise.thietBiSuDung && (
                                <div className="stat-item">
                                    <span className="stat-icon">🏋️</span>
                                    <span className="stat-label">Thiết bị</span>
                                    <span className="stat-value">{exercise.thietBiSuDung}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                <div className="detail-section">
                    <h2 className="section-title">
                        <span className="section-icon">📝</span>
                        Mô tả bài tập
                    </h2>
                    <p className="exercise-description">{exercise.moTa}</p>
                </div>

                {/* Target Section */}
                {exercise.mucTieuBaiTap && (
                    <div className="detail-section">
                        <h2 className="section-title">
                            <span className="section-icon">🎯</span>
                            Mục tiêu
                        </h2>
                        <p className="exercise-target">{exercise.mucTieuBaiTap}</p>
                    </div>
                )}

                {/* Illustration Image */}
                {exercise.hinhAnhMinhHoa && (
                    <div className="detail-section">
                        <h2 className="section-title">
                            <span className="section-icon">🖼️</span>
                            Hình ảnh minh họa
                        </h2>
                        <div className="illustration-container">
                            <img 
                                src={exercise.hinhAnhMinhHoa} 
                                alt={`Minh họa ${exercise.tenBaiTap}`}
                                className="illustration-image"
                            />
                        </div>
                    </div>
                )}

                {/* Video Section */}
                {exercise.videoHuongDan && (
                    <div className="detail-section">
                        <h2 className="section-title">
                            <span className="section-icon">🎥</span>
                            Video hướng dẫn
                        </h2>
                        <div className="video-container">
                            <button 
                                className="video-btn"
                                onClick={() => window.open(exercise.videoHuongDan, '_blank')}
                            >
                                <span className="video-icon">▶️</span>
                                <span>Xem video hướng dẫn</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="detail-section">
                    <h2 className="section-title">
                        <span className="section-icon">ℹ️</span>
                        Thông tin chi tiết
                    </h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Nhóm cơ</span>
                            <span className="info-value">{getNhomCoLabel(exercise.nhomCo)}</span>
                        </div>
                        
                        <div className="info-item">
                            <span className="info-label">Mức độ khó</span>
                            <span className="info-value">{mucDoKhoInfo.label}</span>
                        </div>
                        
                        {exercise.thietBiSuDung && (
                            <div className="info-item">
                                <span className="info-label">Thiết bị sử dụng</span>
                                <span className="info-value">{exercise.thietBiSuDung}</span>
                            </div>
                        )}
                        
                        {exercise.soHiepvaSoLanLap > 0 && (
                            <div className="info-item">
                                <span className="info-label">Số hiệp/lần lặp</span>
                                <span className="info-value">{exercise.soHiepvaSoLanLap}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExerciseDetail;
