import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import NotificationContainer from '../components/Notification/NotificationContainer';
import { NotificationProps } from '../components/Notification/Notification';

interface NotificationData {
    title: string;
    message?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface NotificationContextType {
    showNotification: (data: NotificationData) => void;
    showSuccess: (title: string, message?: string, duration?: number) => void;
    showError: (title: string, message?: string, duration?: number) => void;
    showWarning: (title: string, message?: string, duration?: number) => void;
    showInfo: (title: string, message?: string, duration?: number) => void;
    // CRUD operation helpers
    showCreateSuccess: (itemName: string) => void;
    showUpdateSuccess: (itemName: string) => void;
    showDeleteSuccess: (itemName: string) => void;
    showCreateError: (itemName: string, error?: string) => void;
    showUpdateError: (itemName: string, error?: string) => void;
    showDeleteError: (itemName: string, error?: string) => void;
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
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);

    const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const showNotification = useCallback((data: NotificationData) => {
        const notification: NotificationProps = {
            id: generateId(),
            title: data.title,
            message: data.message,
            type: data.type,
            duration: data.duration || 5000,
            onClose: () => {}, // Will be set below
        };

        setNotifications(prev => [...prev, notification]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const showSuccess = useCallback((title: string, message?: string, duration = 4000) => {
        showNotification({ title, message, type: 'success', duration });
    }, [showNotification]);

    const showError = useCallback((title: string, message?: string, duration = 6000) => {
        showNotification({ title, message, type: 'error', duration });
    }, [showNotification]);

    const showWarning = useCallback((title: string, message?: string, duration = 5000) => {
        showNotification({ title, message, type: 'warning', duration });
    }, [showNotification]);

    const showInfo = useCallback((title: string, message?: string, duration = 4000) => {
        showNotification({ title, message, type: 'info', duration });
    }, [showNotification]);

    // CRUD operation helpers
    const showCreateSuccess = useCallback((itemName: string) => {
        showSuccess(`Thêm ${itemName} thành công!`, `${itemName} đã được tạo mới trong hệ thống.`);
    }, [showSuccess]);

    const showUpdateSuccess = useCallback((itemName: string) => {
        showSuccess(`Cập nhật ${itemName} thành công!`, `Thông tin ${itemName} đã được cập nhật.`);
    }, [showSuccess]);

    const showDeleteSuccess = useCallback((itemName: string) => {
        showSuccess(`Xóa ${itemName} thành công!`, `${itemName} đã được xóa khỏi hệ thống.`);
    }, [showSuccess]);

    const showCreateError = useCallback((itemName: string, error?: string) => {
        showError(`Không thể thêm ${itemName}`, error || `Có lỗi xảy ra khi tạo ${itemName}. Vui lòng thử lại.`);
    }, [showError]);

    const showUpdateError = useCallback((itemName: string, error?: string) => {
        showError(`Không thể cập nhật ${itemName}`, error || `Có lỗi xảy ra khi cập nhật ${itemName}. Vui lòng thử lại.`);
    }, [showError]);

    const showDeleteError = useCallback((itemName: string, error?: string) => {
        showError(`Không thể xóa ${itemName}`, error || `Có lỗi xảy ra khi xóa ${itemName}. Vui lòng thử lại.`);
    }, [showError]);

    return (
        <NotificationContext.Provider value={{
            showNotification,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            showCreateSuccess,
            showUpdateSuccess,
            showDeleteSuccess,
            showCreateError,
            showUpdateError,
            showDeleteError
        }}>
            {children}
            <NotificationContainer
                notifications={notifications}
                onClose={removeNotification}
            />
        </NotificationContext.Provider>
    );
};
