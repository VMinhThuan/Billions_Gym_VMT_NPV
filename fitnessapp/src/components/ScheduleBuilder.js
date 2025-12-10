import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Dimensions
} from 'react-native';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const ScheduleBuilder = ({ registrationId, onCreateSchedule, loading: parentLoading }) => {
    const [availableSessions, setAvailableSessions] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [weekInfo, setWeekInfo] = useState(null);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);

    const TIME_SLOTS = [
        { id: 1, start: '06:00', end: '08:00', label: '06:00 - 08:00' },
        { id: 2, start: '08:00', end: '10:00', label: '08:00 - 10:00' },
        { id: 3, start: '10:00', end: '12:00', label: '10:00 - 12:00' },
        { id: 4, start: '13:00', end: '15:00', label: '13:00 - 15:00' },
        { id: 5, start: '15:00', end: '17:00', label: '15:00 - 17:00' },
        { id: 6, start: '17:00', end: '19:00', label: '17:00 - 19:00' },
        { id: 7, start: '19:00', end: '21:00', label: '19:00 - 21:00' },
        { id: 8, start: '21:00', end: '23:00', label: '21:00 - 23:00' }
    ];

    useEffect(() => {
        fetchAvailableSessions();
    }, [registrationId]);

    const fetchAvailableSessions = async () => {
        try {
            setSessionsLoading(true);
            const response = await apiService.apiCall(
                `/package-workflow/available-sessions/${registrationId}`,
                'GET',
                null,
                true
            );

            if (response.success) {
                setAvailableSessions(response.data.sessions || []);
                setWeekInfo(response.data.weekInfo || null);
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách buổi tập');
        } finally {
            setSessionsLoading(false);
        }
    };

    const getSessionsForTimeSlot = (date, timeSlot) => {
        if (!availableSessions) return [];

        return availableSessions.filter(session => {
            const sessionDate = new Date(session.ngay).toDateString();
            const targetDate = new Date(date).toDateString();
            const sessionStart = session.gioBatDau.substring(0, 5);

            return sessionDate === targetDate && sessionStart === timeSlot.start;
        });
    };

    const handleTimeSlotClick = (date, timeSlot) => {
        const sessions = getSessionsForTimeSlot(date, timeSlot);
        if (sessions.length === 0) return;

        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayName = dayNames[new Date(date).getDay()];

        setSelectedTimeSlot({
            date,
            timeSlot,
            sessions,
            dayName
        });
        setShowSessionModal(true);
    };

    const handleSessionSelect = (session) => {
        const isSelected = selectedSessions.find(s => s._id === session._id);

        if (isSelected) {
            setSelectedSessions(selectedSessions.filter(s => s._id !== session._id));
        } else {
            // Kiểm tra xem đã chọn buổi nào trong cùng slot chưa
            const hasSelectedInSlot = selectedSessions.some(s => {
                const sDate = new Date(s.ngay).toDateString();
                const sessionDate = new Date(session.ngay).toDateString();
                const sStart = s.gioBatDau.substring(0, 5);
                const sessionStart = session.gioBatDau.substring(0, 5);
                return sDate === sessionDate && sStart === sessionStart;
            });

            if (hasSelectedInSlot) {
                Alert.alert('Thông báo', 'Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca');
                return;
            }

            setSelectedSessions([...selectedSessions, session]);
        }
        setShowSessionModal(false);
    };

    const handleCreateSchedule = async () => {
        if (selectedSessions.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 buổi tập');
            return;
        }

        const scheduleData = {
            selectedSessions: selectedSessions,
            danhSachBuoiTap: selectedSessions.map(session => ({
                buoiTapId: session._id,
                ngayTap: session.ngay,
                gioBatDau: session.gioBatDau,
                gioKetThuc: session.gioKetThuc,
                ptPhuTrach: session.ptPhuTrach._id
            }))
        };

        await onCreateSchedule(scheduleData);
    };

    if (sessionsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#da2128" />
                <Text style={styles.loadingText}>Đang tải danh sách buổi tập...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                Chọn các ca tập phù hợp với lịch trình của bạn
            </Text>

            {weekInfo && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.weekContainer}
                    contentContainerStyle={styles.weekContent}
                >
                    {weekInfo.days.map((day, dayIndex) => (
                        <View key={dayIndex} style={styles.dayColumn}>
                            <View style={styles.dayHeader}>
                                <Text style={styles.dayName}>{day.dayName}</Text>
                                <Text style={styles.dayDate}>
                                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                                </Text>
                            </View>

                            {TIME_SLOTS.map(timeSlot => {
                                const sessions = getSessionsForTimeSlot(day.date, timeSlot);
                                const selectedSession = sessions.find(session =>
                                    selectedSessions.find(s => s._id === session._id)
                                );
                                const isPast = new Date(`${day.date}T${timeSlot.end}`) < new Date();

                                return (
                                    <TouchableOpacity
                                        key={timeSlot.id}
                                        style={[
                                            styles.timeSlotCard,
                                            isPast && styles.timeSlotPast,
                                            selectedSession && styles.timeSlotSelected,
                                            sessions.length > 0 && !isPast && !selectedSession && styles.timeSlotAvailable
                                        ]}
                                        onPress={() => handleTimeSlotClick(day.date, timeSlot)}
                                        disabled={isPast || sessions.length === 0}
                                    >
                                        <Text style={styles.timeSlotLabel}>{timeSlot.label}</Text>
                                        {isPast ? (
                                            <Text style={styles.timeSlotStatus}>Đã qua</Text>
                                        ) : sessions.length === 0 ? (
                                            <Text style={styles.timeSlotStatus}>Trống</Text>
                                        ) : selectedSession ? (
                                            <Text style={styles.timeSlotStatusSelected}>
                                                {selectedSession.ptPhuTrach?.hoTen || 'Đã chọn'}
                                            </Text>
                                        ) : (
                                            <Text style={styles.timeSlotStatusAvailable}>
                                                {sessions.length} buổi
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            )}

            {selectedSessions.length > 0 && (
                <View style={styles.selectedSummary}>
                    <Text style={styles.selectedCount}>Đã chọn: {selectedSessions.length} buổi</Text>
                    <ScrollView style={styles.selectedList}>
                        {selectedSessions.map(session => (
                            <View key={session._id} style={styles.selectedItem}>
                                <Text style={styles.selectedDay}>
                                    {new Date(session.ngay).toLocaleDateString('vi-VN', { weekday: 'short' })}
                                </Text>
                                <Text style={styles.selectedTime}>
                                    {session.gioBatDau.substring(0, 5)} - {session.gioKetThuc.substring(0, 5)}
                                </Text>
                                <Text style={styles.selectedTrainer}>{session.ptPhuTrach?.hoTen}</Text>
                                <TouchableOpacity onPress={() => handleSessionSelect(session)}>
                                    <Text style={styles.selectedRemove}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <TouchableOpacity
                style={[styles.btnCreate, selectedSessions.length === 0 && styles.btnDisabled]}
                onPress={handleCreateSchedule}
                disabled={parentLoading || selectedSessions.length === 0}
            >
                <Text style={styles.btnCreateText}>
                    {parentLoading ? 'Đang tạo lịch...' : 'Tạo lịch tập'}
                </Text>
            </TouchableOpacity>

            {/* Modal chọn buổi tập */}
            <Modal
                visible={showSessionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSessionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.sessionModal}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chọn buổi tập</Text>
                                <Text style={styles.modalSubtitle}>
                                    {selectedTimeSlot?.dayName} - {selectedTimeSlot?.timeSlot.label}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.modalInfo}>
                                <Text style={styles.modalInfoText}>
                                    ℹ️ Bạn chỉ có thể chọn 1 buổi tập trong mỗi ca
                                </Text>
                            </View>
                            {selectedTimeSlot?.sessions.map(session => {
                                const isSelected = selectedSessions.find(s => s._id === session._id);
                                const availableSlots = (session.soLuongToiDa || 0) - (session.soLuongHienTai || 0);

                                return (
                                    <TouchableOpacity
                                        key={session._id}
                                        style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
                                        onPress={() => handleSessionSelect(session)}
                                    >
                                        <View style={styles.sessionInfo}>
                                            <Text style={styles.sessionName}>{session.tenBuoiTap}</Text>
                                            <Text style={styles.sessionPT}>
                                                PT: {session.ptPhuTrach?.hoTen || 'N/A'}
                                            </Text>
                                            <Text style={styles.sessionSlots}>
                                                Còn {availableSlots} chỗ
                                            </Text>
                                        </View>
                                        {isSelected && <Text style={styles.sessionCheck}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    weekContainer: {
        marginBottom: 20,
    },
    weekContent: {
        paddingRight: 16,
    },
    dayColumn: {
        width: 120,
        marginRight: 12,
    },
    dayHeader: {
        backgroundColor: '#da2128',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    dayName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    dayDate: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    timeSlotCard: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        minHeight: 60,
        justifyContent: 'center',
    },
    timeSlotPast: {
        backgroundColor: '#e0e0e0',
        opacity: 0.5,
    },
    timeSlotSelected: {
        backgroundColor: '#d4edda',
        borderWidth: 2,
        borderColor: '#28a745',
    },
    timeSlotAvailable: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    timeSlotLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    timeSlotStatus: {
        fontSize: 11,
        color: '#666',
    },
    timeSlotStatusSelected: {
        fontSize: 11,
        color: '#28a745',
        fontWeight: '600',
    },
    timeSlotStatusAvailable: {
        fontSize: 11,
        color: '#ff6b6b',
        fontWeight: '600',
    },
    selectedSummary: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    selectedCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#da2128',
        marginBottom: 12,
    },
    selectedList: {
        maxHeight: 200,
    },
    selectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedDay: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        width: 50,
    },
    selectedTime: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    selectedTrainer: {
        fontSize: 14,
        color: '#666',
        marginRight: 12,
    },
    selectedRemove: {
        fontSize: 24,
        color: '#da2128',
        fontWeight: 'bold',
    },
    btnCreate: {
        backgroundColor: '#da2128',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnDisabled: {
        backgroundColor: '#ccc',
    },
    btnCreateText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    sessionModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    modalClose: {
        fontSize: 28,
        color: '#666',
    },
    modalBody: {
        padding: 20,
    },
    modalInfo: {
        backgroundColor: '#e7f3ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    modalInfoText: {
        fontSize: 14,
        color: '#0066cc',
    },
    sessionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    sessionCardSelected: {
        borderColor: '#da2128',
        backgroundColor: '#fff5f5',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    sessionPT: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    sessionSlots: {
        fontSize: 12,
        color: '#28a745',
    },
    sessionCheck: {
        fontSize: 24,
        color: '#da2128',
        fontWeight: 'bold',
    },
});

export default ScheduleBuilder;
