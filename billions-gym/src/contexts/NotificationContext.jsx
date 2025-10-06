import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationContainer from '../components/Notification/NotificationContainer';
import { useLanguage } from './LanguageContext';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const { content } = useLanguage();

    const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const showNotification = useCallback((data) => {
        const notification = {
            id: generateId(),
            title: data.title,
            message: data.message,
            type: data.type,
            duration: data.duration || 3000,
        };

        setNotifications(prev => [...prev, notification]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const showSuccess = useCallback((title, message, duration = 1500) => {
        showNotification({ title, message, type: 'success', duration });
    }, [showNotification]);

    const showError = useCallback((title, message, duration = 3000) => {
        showNotification({ title, message, type: 'error', duration });
    }, [showNotification]);

    const showWarning = useCallback((title, message, duration = 1500) => {
        showNotification({ title, message, type: 'warning', duration });
    }, [showNotification]);

    const showInfo = useCallback((title, message, duration = 1500) => {
        showNotification({ title, message, type: 'info', duration });
    }, [showNotification]);

    const showCreateSuccess = useCallback((itemName) => {
        showSuccess(`Thêm ${itemName} thành công!`, `${itemName} đã được tạo mới trong hệ thống.`);
    }, [showSuccess]);

    const showUpdateSuccess = useCallback((itemName) => {
        showSuccess(`Cập nhật ${itemName} thành công!`, `Thông tin ${itemName} đã được cập nhật.`);
    }, [showSuccess]);

    const showDeleteSuccess = useCallback((itemName) => {
        showSuccess(`Xóa ${itemName} thành công!`, `${itemName} đã được xóa khỏi hệ thống.`);
    }, [showSuccess]);

    const showCreateError = useCallback((itemName, error) => {
        showError(`Không thể thêm ${itemName}`, error || `Có lỗi xảy ra khi tạo ${itemName}. Vui lòng thử lại.`);
    }, [showError]);

    const showUpdateError = useCallback((itemName, error) => {
        showError(`Không thể cập nhật ${itemName}`, error || `Có lỗi xảy ra khi cập nhật ${itemName}. Vui lòng thử lại.`);
    }, [showError]);

    const showDeleteError = useCallback((itemName, error) => {
        showError(`Không thể xóa ${itemName}`, error || `Có lỗi xảy ra khi xóa ${itemName}. Vui lòng thử lại.`);
    }, [showError]);

    const showLoginSuccess = useCallback(() => {
        showSuccess(content.loginSuccess, ``, 1500);
    }, [showSuccess, content.loginSuccess]);

    const showLoginError = useCallback((error) => {
        showError(content.loginFailed, error || content.pleaseCheckInfo, 3000);
    }, [showError, content.loginFailed, content.pleaseCheckInfo]);

    const showLogoutSuccess = useCallback(() => {
        showInfo(content.logoutSuccess, ``, 1500);
    }, [showInfo, content.logoutSuccess]);

    const showNetworkError = useCallback(() => {
        showError(content.networkError, content.checkConnection, 1500);
    }, [showError, content.networkError, content.checkConnection]);

    const showSessionExpired = useCallback(() => {
        showWarning(content.sessionExpired, content.pleaseLoginAgain, 1500);
    }, [showWarning, content.sessionExpired, content.pleaseLoginAgain]);

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
            showDeleteError,
            showLoginSuccess,
            showLoginError,
            showLogoutSuccess,
            showNetworkError,
            showSessionExpired
        }}>
            {children}
            <NotificationContainer
                notifications={notifications}
                onClose={removeNotification}
            />
        </NotificationContext.Provider>
    );
};
