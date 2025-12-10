import { useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';

// Event name constant
export const NOTIFICATION_EVENTS = {
    REFRESH: 'refreshNotifications',
};

// Hook to emit notification refresh event
export const useNotificationRefresh = () => {
    const refreshNotifications = useCallback(() => {
        DeviceEventEmitter.emit(NOTIFICATION_EVENTS.REFRESH);
    }, []);

    return { refreshNotifications };
};

// Hook to listen for notification refresh events
export const useNotificationListener = (callback) => {
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(
            NOTIFICATION_EVENTS.REFRESH,
            callback
        );

        return () => {
            subscription.remove();
        };
    }, [callback]);
};
