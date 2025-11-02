import React from 'react';
import Notification from './Notification';
import './Notification.css';

const NotificationContainer = ({ notifications, onClose }) => {
    if (notifications.length === 0) return null;

    return (
        <div className="notification-container">
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    {...notification}
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
