import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import Card from './Card';
import { api } from '../services/api';
import './EntityForm.css';

interface Field {
    name: string;
    label: string;
    type?: string;
    options?: string[] | { value: string; label: string; disabled?: boolean; }[];
    validation?: {
        required?: boolean;
        pattern?: RegExp;
        message?: string;
        maxSize?: number; // for file uploads in MB
        minDate?: string; // for date validation
    };
}

interface EntityFormProps {
    title: string;
    fields: Field[];
    initialData?: Record<string, any>;
    onClose: () => void;
    onSave: (data: Record<string, any>) => void;
    onFieldChange?: (name: string, value: any) => void;
}

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const EntityForm = ({ title, fields, initialData, onClose, onSave, onFieldChange }: EntityFormProps) => {
    const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            // Set preview image if exists
            if (initialData.anhDaiDien) {
                setPreviewImage(initialData.anhDaiDien);
            }
        }
    }, [initialData]);

    const validateField = (field: Field, value: any): string | null => {
        if (field.validation?.required && (!value || value.toString().trim() === '')) {
            return `${field.label} là bắt buộc`;
        }

        if (field.validation?.pattern && value && !field.validation.pattern.test(value)) {
            return field.validation.message || `${field.label} không đúng định dạng`;
        }

        if (field.validation?.minDate && value && field.type === 'date') {
            const selectedDate = new Date(value);
            const minDate = new Date(field.validation.minDate);
            if (selectedDate < minDate) {
                return field.validation.message || `${field.label} phải từ ngày ${minDate.toLocaleDateString('vi-VN')} trở đi`;
            }
        }

        return null;
    };

    const checkDuplicateEmail = async (email: string, currentId?: string): Promise<boolean> => {
        try {
            const [members, pts] = await Promise.all([
                api.get('/api/user/hoivien'),
                api.get('/api/user/pt')
            ]);

            const allUsers = [...(Array.isArray(members) ? members : []), ...(Array.isArray(pts) ? pts : [])];
            return allUsers.some(user =>
                user.email === email && (!currentId || user._id !== currentId)
            );
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    };

    const checkDuplicatePhone = async (sdt: string, currentId?: string): Promise<boolean> => {
        try {
            const [members, pts] = await Promise.all([
                api.get('/api/user/hoivien'),
                api.get('/api/user/pt')
            ]);

            const allUsers = [...(Array.isArray(members) ? members : []), ...(Array.isArray(pts) ? pts : [])];
            return allUsers.some(user =>
                user.sdt === sdt && (!currentId || user._id !== currentId)
            );
        } catch (error) {
            console.error('Error checking phone:', error);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const newErrors: Record<string, string> = {};

        for (const field of fields) {
            const value = formData[field.name];
            const error = validateField(field, value);
            console.log(`🔍 Field: ${field.name}, Value: ${value}, Error: ${error}`);
            if (error) {
                newErrors[field.name] = error;
            }
        }

        console.log('🔍 Form validation errors:', newErrors);
        console.log('🔍 Form data:', formData);

        setErrors(newErrors);

        // Only submit if no errors
        if (Object.keys(newErrors).length === 0) {
            const finalData = { ...formData };

            // Final cleanup: remove optional fields if they are empty
            fields.forEach(field => {
                if (!field.validation?.required) {
                    const value = finalData[field.name];
                    if (value === '' || value === null || value === undefined) {
                        delete finalData[field.name];
                    }
                }
            });

            console.log('🚀 EntityForm - Final data being sent to onSave:', finalData);
            onSave(finalData);
        }
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (onFieldChange) {
            onFieldChange(name, value);
        }
    };

    const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (name: string, file: File | null) => {
        if (!file) return;

        const field = fields.find(f => f.name === name);
        const maxSize = field?.validation?.maxSize || 5; // Default 5MB

        if (file.size > maxSize * 1024 * 1024) {
            setErrors(prev => ({ ...prev, [name]: `Kích thước file không được vượt quá ${maxSize}MB` }));
            return;
        }

        try {
            // Compress image if it's an image file
            if (file.type.startsWith('image/')) {
                const compressedImage = await compressImage(file, 800, 0.8);
                setPreviewImage(compressedImage);
                setFormData(prev => ({ ...prev, [name]: compressedImage }));
            } else {
                // For non-image files, use original method
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setPreviewImage(result);
                    setFormData(prev => ({ ...prev, [name]: result }));
                };
                reader.readAsDataURL(file);
            }

            // Clear any existing error
            if (errors[name]) {
                setErrors(prev => ({ ...prev, [name]: '' }));
            }
        } catch (error) {
            console.error('Error processing file:', error);
            setErrors(prev => ({ ...prev, [name]: 'Lỗi khi xử lý file' }));
        }
    };

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e?.stopPropagation()}>
                <div className="modal-header" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                    <div className="modal-title-section">
                        <h2 className="modal-title">{title}</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="entity-form">
                    <div className="form-grid">
                        {fields.map(field => (
                            <div key={field.name} className={`form-group ${field.type === 'textarea' || field.type === 'file' ? 'full-width' : ''}`}>
                                <label className="form-label">{field.label}</label>
                                {field.type === 'file' ? (
                                    <div className="file-upload-container">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                                            className="file-input"
                                            id={`file-${field.name}`}
                                        />
                                        <label htmlFor={`file-${field.name}`} className="file-upload-label">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>Chọn ảnh (sẽ tự động nén)</span>
                                        </label>
                                        {field.validation?.maxSize && (
                                            <p className="file-size-hint">Tối đa {field.validation.maxSize}MB (ảnh sẽ được nén tự động)</p>
                                        )}
                                        {previewImage && (
                                            <div className="image-preview">
                                                <img src={previewImage} alt="Preview" />
                                                <button type="button" onClick={() => { setPreviewImage(null); setFormData(prev => ({ ...prev, [field.name]: '' })); }} className="remove-image">
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : field.type === 'radio' ? (
                                    <div className="radio-group">
                                        {field.options?.map(option => {
                                            const optionValue = typeof option === 'string' ? option : option.value;
                                            const optionLabel = typeof option === 'string' ? option : option.label;
                                            return (
                                                <label key={optionValue} className="radio-option">
                                                    <input
                                                        type="radio"
                                                        name={field.name}
                                                        value={optionValue}
                                                        checked={formData[field.name] === optionValue}
                                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                                        className={errors[field.name] ? 'error' : ''}
                                                    />
                                                    <span className="radio-label">{optionLabel}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : field.options ? (
                                    <select
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className={`form-input form-select ${errors[field.name] ? 'error' : ''}`}
                                    >
                                        <option value="">Chọn {field.label.toLowerCase()}</option>
                                        {field.options.map(option => {
                                            if (typeof option === 'string') {
                                                return <option key={option} value={option}>{option}</option>;
                                            } else {
                                                return (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                        disabled={option.disabled || false}
                                                    >
                                                        {option.label}
                                                    </option>
                                                );
                                            }
                                        })}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className={`form-input form-textarea ${errors[field.name] ? 'error' : ''}`}
                                        rows={3}
                                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                                    />
                                ) : field.type === 'date' ? (
                                    <input
                                        type="date"
                                        value={formData[field.name] ? new Date(formData[field.name]).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleChange(field.name, e.target.value ? new Date(e.target.value).toISOString() : '')}
                                        className={`form-input ${errors[field.name] ? 'error' : ''}`}
                                        min={field.validation?.minDate ? new Date(field.validation.minDate).toISOString().split('T')[0] : undefined}
                                    />
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className={`form-input ${errors[field.name] ? 'error' : ''}`}
                                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                                    />
                                )}
                                {errors[field.name] && (
                                    <span className="error-message">{errors[field.name]}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Hủy
                        </Button>
                        <Button type="submit" variant="primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {initialData ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );

    const modalRoot = document.getElementById('modal-root');
    return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
};

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'danger' }: ConfirmModalProps) => {
    const modalContent = (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-content" onClick={(e) => e?.stopPropagation()}>
                <div className="confirm-modal-header">
                    <div className={`confirm-modal-icon ${type}`}>
                        {type === 'danger' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : type === 'warning' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <div className="confirm-modal-text">
                        <h3 className="confirm-modal-title">{title}</h3>
                        <p className="confirm-modal-message">{message}</p>
                    </div>
                </div>

                <div className="confirm-modal-actions">
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button type="button" variant={type === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );

    const modalRoot = document.getElementById('modal-root');
    return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
};

export default EntityForm;
export { ConfirmModal };
export type { EntityFormProps, ConfirmModalProps };
