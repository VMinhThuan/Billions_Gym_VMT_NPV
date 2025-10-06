import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ExerciseList from './ExerciseList';
import BaiTapForm from './BaiTapForm';
import './EnhancedExerciseManager.css';

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

interface EnhancedExerciseManagerProps {
    onClose?: () => void;
}

const EnhancedExerciseManager: React.FC<EnhancedExerciseManagerProps> = ({ onClose }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateNew = () => {
        setEditingExercise(null);
        setCurrentView('form');
    };

    const handleEdit = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setCurrentView('form');
    };

    const handleDelete = (id: string) => {
        // The delete is handled in the ExerciseList component
        console.log('Exercise deleted:', id);
    };

    const handleFormSubmit = async (formData: any) => {
        setIsLoading(true);
        try {
            // Form submission is handled in BaiTapForm component
            setCurrentView('list');
            setEditingExercise(null);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormCancel = () => {
        setCurrentView('list');
        setEditingExercise(null);
    };

    const convertExerciseToFormData = (exercise: Exercise) => {
        return {
            tenBaiTap: exercise.tenBaiTap,
            moTa: exercise.moTa,
            nhomCo: exercise.nhomCo,
            mucDoKho: exercise.mucDoKho,
            thietBiSuDung: exercise.thietBiSuDung,
            soHiepvaSoLanLap: exercise.soHiepvaSoLanLap,
            mucTieuBaiTap: exercise.mucTieuBaiTap,
            videoHuongDan: exercise.videoHuongDan,
        };
    };

    if (currentView === 'form') {
        return (
            <div className={`enhanced-exercise-manager ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="form-header">
                    <button className="back-to-list-btn" onClick={handleFormCancel}>
                        <span className="back-icon">←</span>
                        <span>Quay lại danh sách</span>
                    </button>
                    
                    <div className="form-title">
                        <h1>{editingExercise ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới'}</h1>
                    </div>

                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        <span className="theme-icon">{isDarkMode ? '☀️' : '🌙'}</span>
                    </button>
                </div>

                <BaiTapForm
                    initialData={editingExercise ? convertExerciseToFormData(editingExercise) : undefined}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    isLoading={isLoading}
                />
            </div>
        );
    }

    return (
        <div className={`enhanced-exercise-manager ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <div className="manager-header">
                <div className="header-left">
                    <div className="header-title">
                        <h1 className="title">
                            <span className="title-icon">🏋️‍♂️</span>
                            Quản Lý Bài Tập
                        </h1>
                        <p className="subtitle">
                            Khám phá và quản lý thư viện bài tập phong phú
                        </p>
                    </div>
                </div>

                <div className="header-right">
                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        <span className="theme-icon">{isDarkMode ? '☀️' : '🌙'}</span>
                        <span className="theme-text">{isDarkMode ? 'Sáng' : 'Tối'}</span>
                    </button>

                    <button className="create-btn" onClick={handleCreateNew}>
                        <span className="btn-icon">➕</span>
                        <span>Thêm Bài Tập</span>
                    </button>

                    {onClose && (
                        <button className="close-btn" onClick={onClose}>
                            <span className="close-icon">✕</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Exercise List */}
            <ExerciseList
                onEdit={handleEdit}
                onDelete={handleDelete}
                showManagement={true}
            />
        </div>
    );
};

export default EnhancedExerciseManager;
