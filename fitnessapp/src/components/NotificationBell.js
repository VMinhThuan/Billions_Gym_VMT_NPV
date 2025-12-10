import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';
import { useNotificationListener } from '../hooks/useNotification';

const NotificationBell = () => {
    const navigation = useNavigation();
    const { userInfo } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const bellAnim = useRef(new Animated.Value(1)).current;

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!userInfo?._id) return;

        try {
            setLoading(true);
            const response = await apiService.apiCall(
                `/notifications/user/${userInfo._id}?limit=10`,
                'GET',
                null,
                true
            );
            if (response && response.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        if (!userInfo?._id) return;

        try {
            const response = await apiService.apiCall(
                `/notifications/test-unread/${userInfo._id}`,
                'GET',
                null,
                true
            );
            if (response && response.success) {
                setUnreadCount(response.data.unreadCount);

                // Animate bell when new notification
                if (response.data.unreadCount > 0) {
                    Animated.sequence([
                        Animated.timing(bellAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
                        Animated.timing(bellAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                    ]).start();
                }
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            console.log('🔔 Marking notification as read:', {
                notificationId,
                userId: userInfo._id,
                hasUserInfo: !!userInfo
            });

            const result = await apiService.apiCall(
                `/notifications/mark-read/${notificationId}`,
                'PUT',
                { userId: userInfo._id },
                true
            );

            console.log('✅ Mark as read result:', result);

            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, daDoc: true, thoiGianDoc: new Date() }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            console.error('Error details:', {
                message: error.message,
                userId: userInfo?._id,
                notificationId
            });
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await apiService.apiCall(
                '/notifications/mark-all-read',
                'PUT',
                { userId: userInfo._id },
                true
            );

            setNotifications(prev =>
                prev.map(notif => ({ ...notif, daDoc: true, thoiGianDoc: new Date() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Format time
    const formatTime = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    // Fetch data on mount
    useEffect(() => {
        if (userInfo?._id) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [userInfo?._id]);

    // Auto refresh every 30 seconds
    useEffect(() => {
        if (!userInfo?._id) return;

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [userInfo?._id]);

    // Listen for manual refresh events
    useNotificationListener(() => {
        if (userInfo?._id) {
            fetchNotifications();
            fetchUnreadCount();
        }
    });

    if (!userInfo) return null;

    return (
        <>
            {/* Bell Icon */}
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                style={styles.bellButton}
            >
                <Animated.View style={{ transform: [{ scale: bellAnim }] }}>
                    <Ionicons name="notifications-outline" size={24} color="white" />
                </Animated.View>

                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                visible={isOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.dropdownContainer}>
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Thông báo</Text>
                                <View style={styles.headerActions}>
                                    {unreadCount > 0 && (
                                        <TouchableOpacity
                                            onPress={markAllAsRead}
                                            style={styles.markAllBtn}
                                        >
                                            <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => setIsOpen(false)}
                                        style={styles.closeBtn}
                                    >
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Content */}
                            <ScrollView style={styles.scrollView}>
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#da2128" />
                                        <Text style={styles.loadingText}>Đang tải...</Text>
                                    </View>
                                ) : notifications.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                                        <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                                    </View>
                                ) : (
                                    notifications.map((notification) => (
                                        <TouchableOpacity
                                            key={notification._id}
                                            style={[
                                                styles.notificationItem,
                                                !notification.daDoc && styles.notificationUnread
                                            ]}
                                            onPress={() => {
                                                if (!notification.daDoc) {
                                                    markAsRead(notification._id);
                                                }

                                                // Navigate based on notification type
                                                if (notification.loaiThongBao === 'WORKFLOW' &&
                                                    notification.duLieuLienQuan?.registrationId) {
                                                    setIsOpen(false);
                                                    navigation.navigate('PackageWorkflow', {
                                                        registrationId: notification.duLieuLienQuan.registrationId
                                                    });
                                                }
                                            }}
                                        >
                                            <View style={styles.notificationContent}>
                                                <View
                                                    style={[
                                                        styles.dot,
                                                        !notification.daDoc ? styles.dotUnread : styles.dotRead
                                                    ]}
                                                />
                                                <View style={styles.notificationText}>
                                                    <Text style={styles.notificationTitle} numberOfLines={2}>
                                                        {notification.tieuDe}
                                                    </Text>
                                                    <Text style={styles.notificationBody} numberOfLines={3}>
                                                        {notification.noiDung}
                                                    </Text>
                                                    <Text style={styles.notificationTime}>
                                                        {formatTime(notification.createdAt)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    bellButton: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#da2128',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 10,
    },
    dropdownContainer: {
        width: 380,
        maxWidth: '95%',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        maxHeight: 500,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#141414',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markAllBtn: {
        padding: 4,
    },
    markAllText: {
        fontSize: 13,
        color: '#da2128',
        fontWeight: '600',
    },
    closeBtn: {
        padding: 4,
    },
    scrollView: {
        maxHeight: 400,
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        color: '#999',
        fontSize: 16,
    },
    notificationItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    notificationUnread: {
        backgroundColor: '#fef2f2',
        borderLeftWidth: 4,
        borderLeftColor: '#da2128',
    },
    notificationContent: {
        flexDirection: 'row',
        gap: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    dotUnread: {
        backgroundColor: '#da2128',
    },
    dotRead: {
        backgroundColor: '#d1d5db',
    },
    notificationText: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#141414',
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
});

export default NotificationBell;
