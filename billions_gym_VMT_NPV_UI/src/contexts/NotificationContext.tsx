import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification from '../components/Notification';

interface NotificationData {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface NotificationContextType {
    showNotification: (data: NotificationData) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notification, setNotification] = useState<NotificationData | null>(null);
    const [show, setShow] = useState(false);

    const showNotification = (data: NotificationData) => {
        setNotification(data);
        setShow(true);
    };

    const showSuccess = (message: string, duration = 3000) => {
        showNotification({ message, type: 'success', duration });
    };

    const showError = (message: string, duration = 5000) => {
        showNotification({ message, type: 'error', duration });
    };

    const showWarning = (message: string, duration = 4000) => {
        showNotification({ message, type: 'warning', duration });
    };

    const showInfo = (message: string, duration = 3000) => {
        showNotification({ message, type: 'info', duration });
    };

    const handleClose = () => {
        setShow(false);
        setTimeout(() => setNotification(null), 300); // Wait for animation to complete
    };

    return (
        <NotificationContext.Provider value={{
            showNotification,
            showSuccess,
            showError,
            showWarning,
            showInfo
        }}>
            {children}
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    show={show}
                    onClose={handleClose}
                />
            )}
        </NotificationContext.Provider>
    );
};
