import React, { useState, useEffect } from 'react';
import './Notification.css';

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
    show: boolean;
}

const Notification: React.FC<NotificationProps> = ({
    message,
    type,
    duration = 5000,
    onClose,
    show
}) => {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!visible) return null;

    return (
        <div
            className={`notification notification-${type} ${visible ? 'notification-show' : ''}`}
            onClick={(e) => {
                // Close when clicking on the overlay (outside the content)
                if (e.target === e.currentTarget) {
                    setVisible(false);
                    onClose?.();
                }
            }}
        >
            <div className="notification-content">
                <div className="notification-icon">
                    {type === 'success' && '✓'}
                    {type === 'error' && '✕'}
                    {type === 'warning' && '⚠'}
                    {type === 'info' && 'ℹ'}
                </div>
                <div className="notification-message">{message}</div>
                <button
                    className="notification-close"
                    onClick={() => {
                        setVisible(false);
                        onClose?.();
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Notification;
