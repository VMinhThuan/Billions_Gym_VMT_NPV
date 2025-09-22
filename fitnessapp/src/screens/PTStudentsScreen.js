import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const PTStudentsScreen = ({ navigation }) => {
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const { userInfo } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await apiService.getMyStudents();
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading students:', error);
            // Silent error - just show empty list
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStudents();
        setRefreshing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const renderStudentItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.studentCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('StudentDetail', { studentId: item._id })}
        >
            <View style={styles.studentHeader}>
                <View style={styles.avatarContainer}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                            <MaterialIcons name="person" size={24} color={colors.primary} />
                        </View>
                    )}
                </View>
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                        {item.hoTen || 'N/A'}
                    </Text>
                    <Text style={[styles.studentPhone, { color: colors.textSecondary }]}>
                        {item.sdt || 'N/A'}
                    </Text>
                    <Text style={[styles.lastBooking, { color: colors.textSecondary }]}>
                        Buổi tập cuối: {formatDate(item.lastBookingDate)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
                >
                    <MaterialIcons name="fitness-center" size={16} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.studentStats}>
                <View style={styles.statItem}>
                    <MaterialIcons name="event" size={16} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        Tổng buổi tập
                    </Text>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                        {item.totalSessions || 0}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialIcons name="schedule" size={16} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        Hoàn thành
                    </Text>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                        {item.completedSessions || 0}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialIcons name="trending-up" size={16} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        Tiến độ
                    </Text>
                    <Text style={[styles.statNumber, { color: colors.text }]}>
                        {item.totalSessions > 0 
                            ? Math.round((item.completedSessions / item.totalSessions) * 100)
                            : 0}%
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerTitle}>Học viên của tôi</Text>
                <Text style={styles.headerSubtitle}>
                    {students.length} học viên
                </Text>
            </View>

            {/* Students List */}
            <FlatList
                data={students}
                keyExtractor={(item) => item._id}
                renderItem={renderStudentItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="people" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {loading ? 'Đang tải...' : 'Chưa có học viên nào'}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            Học viên sẽ xuất hiện sau khi có lịch hẹn được xác nhận
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    listContainer: {
        padding: 16,
    },
    studentCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    studentPhone: {
        fontSize: 14,
        marginBottom: 2,
    },
    lastBooking: {
        fontSize: 12,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statText: {
        fontSize: 12,
        marginVertical: 4,
        textAlign: 'center',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 64,
        paddingHorizontal: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8,
    },
});

export default PTStudentsScreen;