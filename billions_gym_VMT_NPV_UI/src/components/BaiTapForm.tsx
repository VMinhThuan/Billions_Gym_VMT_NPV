import React, { useState, useEffect } from 'react';
import './BaiTapForm.css';

interface BaiTapFormData {
    tenBaiTap: string;
    moTa: string;
    hinhAnh: File | null;
    nhomCo: string;
    mucDoKho: string;
    thietBiSuDung: string;
    soHiepvaSoLanLap: number;
    mucTieuBaiTap: string;
    hinhAnhMinhHoa: File | null;
    videoHuongDan: string;
}

interface BaiTapFormProps {
    initialData?: Partial<BaiTapFormData>;
    onSubmit: (data: BaiTapFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const BaiTapForm: React.FC<BaiTapFormProps> = ({ 
    initialData, 
    onSubmit, 
    onCancel, 
    isLoading = false 
}) => {
    const [formData, setFormData] = useState<BaiTapFormData>({
        tenBaiTap: '',
        moTa: '',
        hinhAnh: null,
        nhomCo: '',
        mucDoKho: '',
        thietBiSuDung: '',
        soHiepvaSoLanLap: 0,
        mucTieuBaiTap: '',
        hinhAnhMinhHoa: null,
        videoHuongDan: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof BaiTapFormData, string>>>({});
    const [previewImages, setPreviewImages] = useState<{
        hinhAnh: string | null;
        hinhAnhMinhHoa: string | null;
    }>({
        hinhAnh: null,
        hinhAnhMinhHoa: null,
    });

    // Initialize form data
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const nhomCoOptions = [
        { value: 'CHEST', label: '💪 Ngực (Chest)', icon: '🫁' },
        { value: 'BACK', label: '🔙 Lưng (Back)', icon: '🦴' },
        { value: 'SHOULDERS', label: '🤷 Vai (Shoulders)', icon: '💪' },
        { value: 'BICEPS', label: '💪 Cơ Nhị Đầu (Biceps)', icon: '🦾' },
        { value: 'TRICEPS', label: '🦾 Cơ Tam Đầu (Triceps)', icon: '💪' },
        { value: 'FOREARMS', label: '🤏 Cẳng Tay (Forearms)', icon: '🦴' },
        { value: 'QUADS', label: '🦵 Cơ Tứ Đầu (Quadriceps)', icon: '🏃' },
        { value: 'HAMSTRINGS', label: '🦵 Cơ Gân Kheo (Hamstrings)', icon: '🏃‍♀️' },
        { value: 'GLUTES', label: '🍑 Cơ Mông (Glutes)', icon: '🏋️' },
        { value: 'CALVES', label: '🦵 Cơ Bắp Chân (Calves)', icon: '🚶' },
        { value: 'ABS', label: '🏋️ Cơ Bụng (Abs)', icon: '💎' },
        { value: 'CORE', label: '🎯 Cơ Lõi (Core)', icon: '⚡' },
        { value: 'CARDIO', label: '❤️ Tim Mạch (Cardio)', icon: '💓' },
        { value: 'FULL_BODY', label: '🏃‍♂️ Toàn Thân (Full Body)', icon: '🔥' }
    ];

    const mucDoKhoOptions = [
        { value: 'BEGINNER', label: 'Người Mới Bắt Đầu', color: '#10b981', icon: '🟢' },
        { value: 'INTERMEDIATE', label: 'Trung Bình', color: '#f59e0b', icon: '🟡' },
        { value: 'ADVANCED', label: 'Nâng Cao', color: '#f97316', icon: '🟠' },
        { value: 'EXPERT', label: 'Chuyên Gia', color: '#dc2626', icon: '🔴' }
    ];

    const thietBiOptions = [
        { value: 'BODYWEIGHT', label: 'Trọng Lượng Cơ Thể', icon: '💪' },
        { value: 'DUMBBELLS', label: 'Tạ Đơn', icon: '🏋️' },
        { value: 'BARBELL', label: 'Tạ Đòn', icon: '🏋️‍♂️' },
        { value: 'KETTLEBELL', label: 'Kettlebell', icon: '⚖️' },
        { value: 'RESISTANCE_BANDS', label: 'Dây Kháng Lực', icon: '🎗️' },
        { value: 'CABLE_MACHINE', label: 'Máy Cáp', icon: '🔗' },
        { value: 'SMITH_MACHINE', label: 'Máy Smith', icon: '🏗️' },
        { value: 'LEG_PRESS', label: 'Máy Đạp Chân', icon: '🦵' },
        { value: 'PULL_UP_BAR', label: 'Xà Đơn', icon: '🏃‍♂️' },
        { value: 'BENCH', label: 'Ghế Tập', icon: '🪑' },
        { value: 'TREADMILL', label: 'Máy Chạy Bộ', icon: '🏃' },
        { value: 'BIKE', label: 'Xe Đạp Tập', icon: '🚴' },
        { value: 'ROWING_MACHINE', label: 'Máy Chèo', icon: '🚣' },
        { value: 'MEDICINE_BALL', label: 'Bóng Y Tế', icon: '⚽' },
        { value: 'FOAM_ROLLER', label: 'Con Lăn Massage', icon: '🧽' },
        { value: 'YOGA_MAT', label: 'Thảm Yoga', icon: '🧘' },
        { value: 'NONE', label: 'Không Cần Thiết Bị', icon: '❌' }
    ];

    const mucTieuOptions = [
        { value: 'STRENGTH', label: 'Tăng Sức Mạnh', icon: '💪', color: '#dc2626' },
        { value: 'MUSCLE_BUILDING', label: 'Xây Dựng Cơ Bắp', icon: '🏗️', color: '#7c3aed' },
        { value: 'ENDURANCE', label: 'Tăng Sức Bền', icon: '🏃', color: '#059669' },
        { value: 'FLEXIBILITY', label: 'Tăng Độ Dẻo Dai', icon: '🤸', color: '#0891b2' },
        { value: 'BALANCE', label: 'Cải Thiện Thăng Bằng', icon: '⚖️', color: '#7c2d12' },
        { value: 'COORDINATION', label: 'Phối Hợp Vận Động', icon: '🎯', color: '#be185d' },
        { value: 'FAT_LOSS', label: 'Giảm Mỡ', icon: '🔥', color: '#ea580c' },
        { value: 'CARDIO', label: 'Cải Thiện Tim Mạch', icon: '❤️', color: '#e11d48' },
        { value: 'REHABILITATION', label: 'Phục Hồi Chức Năng', icon: '🏥', color: '#0d9488' },
        { value: 'WARM_UP', label: 'Khởi Động', icon: '🌡️', color: '#f59e0b' },
        { value: 'COOL_DOWN', label: 'Thư Giãn', icon: '❄️', color: '#3b82f6' }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));

        // Clear error when user starts typing
        if (errors[name as keyof BaiTapFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        const file = files?.[0] || null;
        
        setFormData(prev => ({
            ...prev,
            [name]: file
        }));

        // Create preview URL
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewImages(prev => ({
                    ...prev,
                    [name]: event.target?.result as string
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImages(prev => ({
                ...prev,
                [name]: null
            }));
        }

        // Clear error
        if (errors[name as keyof BaiTapFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof BaiTapFormData, string>> = {};

        if (!formData.tenBaiTap.trim()) {
            newErrors.tenBaiTap = 'Tên bài tập là bắt buộc';
        }

        if (!formData.nhomCo) {
            newErrors.nhomCo = 'Vui lòng chọn nhóm cơ';
        }

        if (!formData.mucDoKho) {
            newErrors.mucDoKho = 'Vui lòng chọn mức độ khó';
        }

        if (formData.videoHuongDan && !isValidUrl(formData.videoHuongDan)) {
            newErrors.videoHuongDan = 'URL video không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    const getSelectedOption = (options: any[], value: string) => {
        return options.find(option => option.value === value);
    };

    return (
        <div className="baitap-form-container">
            <div className="baitap-form-header">
                <h2 className="form-title">
                    <span className="form-icon">🏋️‍♂️</span>
                    {initialData ? 'Cập Nhật Bài Tập' : 'Thêm Bài Tập Mới'}
                </h2>
                <p className="form-subtitle">
                    Tạo và quản lý bài tập với đầy đủ thông tin chi tiết
                </p>
            </div>

            <form onSubmit={handleSubmit} className="baitap-form">
                <div className="form-grid">
                    {/* Tên Bài Tập */}
                    <div className="form-group full-width">
                        <label className="form-label required">
                            <span className="label-icon">📝</span>
                            Tên Bài Tập
                        </label>
                        <input
                            type="text"
                            name="tenBaiTap"
                            value={formData.tenBaiTap}
                            onChange={handleInputChange}
                            className={`form-input ${errors.tenBaiTap ? 'error' : ''}`}
                            placeholder="Nhập tên bài tập (VD: Push-up, Squat, Deadlift...)"
                        />
                        {errors.tenBaiTap && <div className="error-message">{errors.tenBaiTap}</div>}
                    </div>

                    {/* Nhóm Cơ */}
                    <div className="form-group">
                        <label className="form-label required">
                            <span className="label-icon">💪</span>
                            Nhóm Cơ
                        </label>
                        <select
                            name="nhomCo"
                            value={formData.nhomCo}
                            onChange={handleInputChange}
                            className={`form-select ${errors.nhomCo ? 'error' : ''}`}
                        >
                            <option value="">-- Chọn nhóm cơ --</option>
                            {nhomCoOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.nhomCo && <div className="error-message">{errors.nhomCo}</div>}
                        {formData.nhomCo && (
                            <div className="selected-preview">
                                <span className="preview-icon">{getSelectedOption(nhomCoOptions, formData.nhomCo)?.icon}</span>
                                <span className="preview-text">{getSelectedOption(nhomCoOptions, formData.nhomCo)?.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Mức Độ Khó */}
                    <div className="form-group">
                        <label className="form-label required">
                            <span className="label-icon">📊</span>
                            Mức Độ Khó
                        </label>
                        <select
                            name="mucDoKho"
                            value={formData.mucDoKho}
                            onChange={handleInputChange}
                            className={`form-select ${errors.mucDoKho ? 'error' : ''}`}
                        >
                            <option value="">-- Chọn mức độ khó --</option>
                            {mucDoKhoOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.mucDoKho && <div className="error-message">{errors.mucDoKho}</div>}
                        {formData.mucDoKho && (
                            <div className="difficulty-preview" style={{ 
                                backgroundColor: getSelectedOption(mucDoKhoOptions, formData.mucDoKho)?.color + '20',
                                borderColor: getSelectedOption(mucDoKhoOptions, formData.mucDoKho)?.color
                            }}>
                                <span className="preview-icon">{getSelectedOption(mucDoKhoOptions, formData.mucDoKho)?.icon}</span>
                                <span className="preview-text">{getSelectedOption(mucDoKhoOptions, formData.mucDoKho)?.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Thiết Bị Sử Dụng */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🏋️</span>
                            Thiết Bị Sử Dụng
                        </label>
                        <select
                            name="thietBiSuDung"
                            value={formData.thietBiSuDung}
                            onChange={handleInputChange}
                            className="form-select"
                        >
                            <option value="">-- Chọn thiết bị --</option>
                            {thietBiOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                        {formData.thietBiSuDung && (
                            <div className="selected-preview">
                                <span className="preview-icon">{getSelectedOption(thietBiOptions, formData.thietBiSuDung)?.icon}</span>
                                <span className="preview-text">{getSelectedOption(thietBiOptions, formData.thietBiSuDung)?.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Mục Tiêu Bài Tập */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🎯</span>
                            Mục Tiêu Bài Tập
                        </label>
                        <select
                            name="mucTieuBaiTap"
                            value={formData.mucTieuBaiTap}
                            onChange={handleInputChange}
                            className="form-select"
                        >
                            <option value="">-- Chọn mục tiêu --</option>
                            {mucTieuOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                        {formData.mucTieuBaiTap && (
                            <div className="goal-preview" style={{ 
                                backgroundColor: getSelectedOption(mucTieuOptions, formData.mucTieuBaiTap)?.color + '20',
                                borderColor: getSelectedOption(mucTieuOptions, formData.mucTieuBaiTap)?.color
                            }}>
                                <span className="preview-icon">{getSelectedOption(mucTieuOptions, formData.mucTieuBaiTap)?.icon}</span>
                                <span className="preview-text">{getSelectedOption(mucTieuOptions, formData.mucTieuBaiTap)?.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Số Hiệp và Số Lần Lặp */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🔢</span>
                            Số Hiệp × Số Lần Lặp Đề Xuất
                        </label>
                        <input
                            type="number"
                            name="soHiepvaSoLanLap"
                            value={formData.soHiepvaSoLanLap}
                            onChange={handleInputChange}
                            className="form-input"
                            min="0"
                            placeholder="VD: 3 hiệp × 12 lần = 36"
                        />
                        <div className="input-hint">
                            Tổng số lần thực hiện (hiệp × lần lặp)
                        </div>
                    </div>

                    {/* Mô Tả Chi Tiết */}
                    <div className="form-group full-width">
                        <label className="form-label">
                            <span className="label-icon">📋</span>
                            Mô Tả Chi Tiết
                        </label>
                        <textarea
                            name="moTa"
                            value={formData.moTa}
                            onChange={handleInputChange}
                            className="form-textarea"
                            rows={4}
                            placeholder="Mô tả cách thực hiện bài tập, lưu ý kỹ thuật, lợi ích, các biến thể..."
                        />
                    </div>

                    {/* Video Hướng Dẫn */}
                    <div className="form-group full-width">
                        <label className="form-label">
                            <span className="label-icon">🎥</span>
                            Video Hướng Dẫn (URL)
                        </label>
                        <input
                            type="url"
                            name="videoHuongDan"
                            value={formData.videoHuongDan}
                            onChange={handleInputChange}
                            className={`form-input ${errors.videoHuongDan ? 'error' : ''}`}
                            placeholder="https://youtube.com/watch?v=... hoặc link video khác"
                        />
                        {errors.videoHuongDan && <div className="error-message">{errors.videoHuongDan}</div>}
                        {formData.videoHuongDan && isValidUrl(formData.videoHuongDan) && (
                            <div className="video-preview">
                                <span className="preview-icon">✅</span>
                                <span className="preview-text">URL video hợp lệ</span>
                            </div>
                        )}
                    </div>

                    {/* Hình Ảnh Chính */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🖼️</span>
                            Hình Ảnh Chính
                        </label>
                        <div className="file-input-container">
                            <input
                                type="file"
                                name="hinhAnh"
                                onChange={handleFileChange}
                                className="file-input"
                                accept="image/*"
                                id="hinhAnh"
                            />
                            <label htmlFor="hinhAnh" className="file-input-label">
                                <span className="file-icon">📁</span>
                                Chọn hình ảnh chính
                            </label>
                        </div>
                        {previewImages.hinhAnh && (
                            <div className="image-preview">
                                <img src={previewImages.hinhAnh} alt="Preview" />
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, hinhAnh: null }));
                                        setPreviewImages(prev => ({ ...prev, hinhAnh: null }));
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Hình Ảnh Minh Họa */}
                    <div className="form-group">
                        <label className="form-label">
                            <span className="label-icon">🎨</span>
                            Hình Ảnh Minh Họa Bổ Sung
                        </label>
                        <div className="file-input-container">
                            <input
                                type="file"
                                name="hinhAnhMinhHoa"
                                onChange={handleFileChange}
                                className="file-input"
                                accept="image/*"
                                id="hinhAnhMinhHoa"
                            />
                            <label htmlFor="hinhAnhMinhHoa" className="file-input-label">
                                <span className="file-icon">📁</span>
                                Chọn hình minh họa
                            </label>
                        </div>
                        {previewImages.hinhAnhMinhHoa && (
                            <div className="image-preview">
                                <img src={previewImages.hinhAnhMinhHoa} alt="Preview" />
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, hinhAnhMinhHoa: null }));
                                        setPreviewImages(prev => ({ ...prev, hinhAnhMinhHoa: null }));
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-cancel"
                        disabled={isLoading}
                    >
                        <span className="btn-icon">❌</span>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading}
                    >
                        <span className="btn-icon">
                            {isLoading ? '⏳' : initialData ? '💾' : '➕'}
                        </span>
                        {isLoading ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BaiTapForm;
