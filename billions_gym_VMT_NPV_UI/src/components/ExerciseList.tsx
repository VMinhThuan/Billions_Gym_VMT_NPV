import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import ExerciseDetail from './ExerciseDetail';
import './ExerciseList.css';

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

interface ExerciseListProps {
    onEdit?: (exercise: Exercise) => void;
    onDelete?: (id: string) => void;
    showManagement?: boolean;
}

const ExerciseList: React.FC<ExerciseListProps> = ({ 
    onEdit, 
    onDelete, 
    showManagement = false 
}) => {
    const { isDarkMode } = useTheme();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterNhomCo, setFilterNhomCo] = useState('');
    const [filterMucDoKho, setFilterMucDoKho] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/baitap');
            setExercises(response || []);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            setExercises([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExerciseClick = (exercise: Exercise) => {
        setSelectedExercise(exercise);
        setShowDetail(true);
    };

    const handleDeleteExercise = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;

        try {
            await api.delete(`/api/baitap/${id}`);
            await fetchExercises();
            if (onDelete) onDelete(id);
        } catch (error) {
            console.error('Error deleting exercise:', error);
            alert('Có lỗi xảy ra khi xóa bài tập!');
        }
    };

    const handleEditExercise = (exercise: Exercise, event: React.MouseEvent) => {
        event.stopPropagation();
        if (onEdit) onEdit(exercise);
    };

    // Filter exercises based on search and filters
    const filteredExercises = exercises.filter(exercise => {
        const matchesSearch = exercise.tenBaiTap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             exercise.moTa.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesNhomCo = !filterNhomCo || exercise.nhomCo === filterNhomCo;
        const matchesMucDoKho = !filterMucDoKho || exercise.mucDoKho === filterMucDoKho;
        
        return matchesSearch && matchesNhomCo && matchesMucDoKho;
    });

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
                label: 'NGƯỜI MỚI', 
                color: '#10b981', 
                bgColor: 'rgba(16, 185, 129, 0.1)' 
            },
            'INTERMEDIATE': { 
                label: 'TRUNG BÌNH', 
                color: '#f59e0b', 
                bgColor: 'rgba(245, 158, 11, 0.1)' 
            },
            'ADVANCED': { 
                label: 'NÂNG CAO', 
                color: '#f97316', 
                bgColor: 'rgba(249, 115, 22, 0.1)' 
            },
            'EXPERT': { 
                label: 'CHUYÊN GIA', 
                color: '#dc2626', 
                bgColor: 'rgba(220, 38, 38, 0.1)' 
            }
        };
        return info[mucDoKho] || { label: mucDoKho, color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
    };

    const getTimeDisplay = (soHiepvaSoLanLap: number) => {
        if (soHiepvaSoLanLap <= 0) return '';
        
        // Convert to time format (assuming it's in minutes)
        const hours = Math.floor(soHiepvaSoLanLap / 60);
        const minutes = soHiepvaSoLanLap % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} giờ`;
        }
        return `${minutes.toString().padStart(2, '0')}:30 phút`;
    };

    if (showDetail && selectedExercise) {
        return (
            <ExerciseDetail
                exercise={selectedExercise}
                onBack={() => setShowDetail(false)}
                onEdit={onEdit}
                onDelete={onDelete}
                showManagement={showManagement}
            />
        );
    }

    return (
        <div className={`exercise-list ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Search and Filter Bar */}
            <div className="exercise-filters">
                <div className="search-container">
                    <div className="search-icon">🔍</div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài tập..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <select
                    value={filterNhomCo}
                    onChange={(e) => setFilterNhomCo(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Tất cả nhóm cơ</option>
                    <option value="CHEST">💪 Ngực</option>
                    <option value="BACK">🔙 Lưng</option>
                    <option value="SHOULDERS">🤷 Vai</option>
                    <option value="BICEPS">💪 Cơ Nhị Đầu</option>
                    <option value="TRICEPS">🦾 Cơ Tam Đầu</option>
                    <option value="LEGS">🦵 Chân</option>
                    <option value="CORE">🎯 Cơ Lõi</option>
                    <option value="CARDIO">❤️ Tim Mạch</option>
                </select>

                <select
                    value={filterMucDoKho}
                    onChange={(e) => setFilterMucDoKho(e.target.value)}
                    className="filter-select"
                >
                    <option value="">Tất cả mức độ</option>
                    <option value="BEGINNER">Người Mới</option>
                    <option value="INTERMEDIATE">Trung Bình</option>
                    <option value="ADVANCED">Nâng Cao</option>
                    <option value="EXPERT">Chuyên Gia</option>
                </select>
            </div>

            {/* Exercise Grid */}
            <div className="exercise-grid">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Đang tải bài tập...</p>
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🏋️‍♂️</div>
                        <h3>Không tìm thấy bài tập nào</h3>
                        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    filteredExercises.map((exercise) => {
                        const mucDoKhoInfo = getMucDoKhoInfo(exercise.mucDoKho);
                        const timeDisplay = getTimeDisplay(exercise.soHiepvaSoLanLap);
                        
                        return (
                            <div 
                                key={exercise._id} 
                                className="exercise-card"
                                onClick={() => handleExerciseClick(exercise)}
                            >
                                {/* Card Image */}
                                <div className="card-image-container">
                                    {exercise.hinhAnh ? (
                                        <img 
                                            src={exercise.hinhAnh} 
                                            alt={exercise.tenBaiTap}
                                            className="card-image"
                                        />
                                    ) : (
                                        <div className="card-image-placeholder">
                                            <span className="placeholder-icon">🏋️‍♂️</span>
                                        </div>
                                    )}
                                    
                                    {/* Popular Badge (you can add logic to determine popularity) */}
                                    <div className="popular-badge">POPULAR</div>
                                    
                                    {/* Management Actions */}
                                    {showManagement && (
                                        <div className="card-management">
                                            <button
                                                className="management-btn edit-btn"
                                                onClick={(e) => handleEditExercise(exercise, e)}
                                                title="Chỉnh sửa"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="management-btn delete-btn"
                                                onClick={(e) => handleDeleteExercise(exercise._id!, e)}
                                                title="Xóa"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="card-content">
                                    <h3 className="exercise-title">{exercise.tenBaiTap}</h3>
                                    
                                    <div className="exercise-meta">
                                        <div className="meta-item">
                                            <span className="meta-icon">🕒</span>
                                            <span className="meta-text">
                                                {timeDisplay || '05:30 - 06:30 am'}
                                            </span>
                                        </div>
                                        
                                        <div className="meta-item">
                                            <span className="meta-icon">🏠</span>
                                            <span className="meta-text">
                                                {getNhomCoLabel(exercise.nhomCo)}
                                            </span>
                                        </div>
                                        
                                        <div className="meta-item">
                                            <span className="meta-icon">👥</span>
                                            <span className="meta-text">
                                                {exercise.soHiepvaSoLanLap > 0 ? `${exercise.soHiepvaSoLanLap} lần` : '1/25'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Difficulty Level */}
                                    <div 
                                        className="difficulty-badge"
                                        style={{ 
                                            color: mucDoKhoInfo.color,
                                            backgroundColor: mucDoKhoInfo.bgColor,
                                            borderColor: mucDoKhoInfo.color
                                        }}
                                    >
                                        {mucDoKhoInfo.label}
                                    </div>

                                    {/* Rating Stars */}
                                    <div className="rating-stars">
                                        {'★★★★★'.split('').map((star, index) => (
                                            <span key={index} className="star">★</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ExerciseList;
