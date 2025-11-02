import React, { useState, useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({
    message,
    type = 'success',
    duration = 5000,
    onClose,
    show = false
}) => {
    const [isVisible, setIsVisible] = useState(show);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            setIsExiting(false);

            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose && onClose();
        }, 300);
    };

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '✅';
        }
    };

    const getTypeClass = () => {
        switch (type) {
            case 'success':
                return 'toast-success';
            case 'error':
                return 'toast-error';
            case 'warning':
                return 'toast-warning';
            case 'info':
                return 'toast-info';
            default:
                return 'toast-success';
        }
    };

    return (
        <div className={`toast-notification ${getTypeClass()} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {getIcon()}
                </div>
                <div className="toast-message">
                    {message}
                </div>
                <button
                    className="toast-close"
                    onClick={handleClose}
                    aria-label="Đóng thông báo"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default ToastNotification;
