import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl, Modal, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../api/apiService';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

const ClassBookingScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const colors = themeContext.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedTab, setSelectedTab] = useState('pt');
    const [ptSessions, setPtSessions] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState('08:00');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchBookingData();
    }, [selectedDate]);

    useEffect(() => {
        setCurrentMonth(selectedDate);
    }, [selectedDate]);

    const fetchBookingData = async () => {
        try {
            setLoading(true);

            // Fetch PT trainers and my bookings
            const [ptTrainersData, myBookingsData] = await Promise.allSettled([
                apiService.getAllPT(),
                apiService.getMyPTBookings()
            ]);

            if (ptTrainersData.status === 'fulfilled' && ptTrainersData.value) {
                const trainers = ptTrainersData.value;

                // Ensure trainers is an array before mapping
                if (Array.isArray(trainers)) {
                    // Transform trainer data to PT session format
                    const transformedSessions = trainers.map(trainer => ({
                        id: trainer._id,
                        trainer: trainer.hoTen || 'Personal Trainer',
                        specialty: trainer.chuyenMon || 'Tập luyện chung',
                        experience: `${trainer.kinhNghiem || 1} năm`,
                        rating: trainer.danhGia || 4.5,
                        price: `${(trainer.giaTheoGio || 500000).toLocaleString('vi-VN')} đồng/buổi`,
                        availableSlots: generateTimeSlots(),
                        description: trainer.moTa || 'Huấn luyện viên cá nhân chuyên nghiệp',
                        booked: false,
                        email: trainer.email,
                        sdt: trainer.sdt,
                        anhDaiDien: trainer.anhDaiDien || null
                    }));

                    setPtSessions(transformedSessions);
                } else {
                    console.warn('Trainers data is not an array:', trainers);
                    setPtSessions([]);
                }
            }

            if (myBookingsData.status === 'fulfilled' && myBookingsData.value) {
                const bookings = Array.isArray(myBookingsData.value) ? myBookingsData.value : [];
                setMyBookings(bookings);

                // Update booked status for PT sessions
                const bookedTrainerIds = bookings
                    .filter(booking =>
                        booking.trangThai === 'DaXacNhan' &&
                        new Date(booking.ngayGioHen).toDateString() === selectedDate.toDateString()
                    )
                    .map(booking => booking.maPT?._id || booking.maPT);

                setPtSessions(prev => prev.map(session => ({
                    ...session,
                    booked: bookedTrainerIds.includes(session.id)
                })));
            }

        } catch (error) {
            console.error('Error fetching booking data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu đặt lịch. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 21; hour += 2) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookingData();
        setRefreshing(false);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Dễ': return '#4CAF50';
            case 'Trung bình': return '#FF9800';
            case 'Khó': return '#DA2128';
            default: return '#666';
        }
    };

    const handleBookClass = (classItem) => {
        setSelectedClass(classItem);
        setModalVisible(true);
    };

    const confirmBooking = async () => {
        try {
            const bookingData = {
                maPT: selectedClass.id,
                ngayGioHen: new Date(selectedDate.toDateString() + ' ' + selectedTime + ':00'),
                ghiChu: `Đặt lịch PT với ${selectedClass.trainer}`
            };

            await apiService.createPTBooking(bookingData);

            Alert.alert(
                "Đặt lịch thành công",
                `Bạn đã đặt lịch PT với ${selectedClass.trainer} thành công!`,
                [{ text: "OK", onPress: () => setModalVisible(false) }]
            );

            // Refresh data to show updated booking status
            await fetchBookingData();

        } catch (error) {
            Alert.alert('Lỗi', 'Không thể đặt lịch. Vui lòng thử lại.');
        }
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        setShowDatePicker(Platform.OS === 'ios');
        setSelectedDate(currentDate);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDateRange = () => {
        const today = new Date();
        const dates = [];

        // Show 30 days from today
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const generateCalendarDays = (month) => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();

        // Get first day of month and number of days
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, monthIndex, day));
        }

        return days;
    };

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(currentMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    const isDateDisabled = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const isDateSelected = (date) => {
        return date && date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date) => {
        const today = new Date();
        return date && date.toDateString() === today.toDateString();
    };

    const renderDateSelector = () => {
        const dates = getDateRange();

        return (
            <View style={[styles.dateSelector, { borderBottomColor: colors.border }]}>
                <View style={styles.dateHeader}>
                    <Text style={[styles.selectedDateText, { color: colors.text }]}>
                        {formatDate(selectedDate)}
                    </Text>
                    <TouchableOpacity
                        style={[styles.calendarButton, { backgroundColor: colors.surface }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {dates.map((date, index) => {
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                        const dayNumber = date.getDate();
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dateItem,
                                    { backgroundColor: colors.card },
                                    isSelected && [styles.dateItemSelected, { backgroundColor: colors.primary }],
                                    isToday && !isSelected && [styles.todayItem, { borderColor: colors.primary }]
                                ]}
                                onPress={() => setSelectedDate(date)}
                            >
                                <Text style={[
                                    styles.dateDay,
                                    { color: colors.textSecondary },
                                    isSelected && [styles.dateDaySelected, { color: '#fff' }]
                                ]}>
                                    {dayName}
                                </Text>
                                <Text style={[
                                    styles.dateNumber,
                                    { color: colors.text },
                                    isSelected && [styles.dateNumberSelected, { color: '#fff' }]
                                ]}>
                                    {dayNumber}
                                </Text>
                                {isToday && !isSelected && (
                                    <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderGroupClassCard = (classItem) => (
        <View key={classItem.id} style={[styles.classCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                    <Text style={[styles.className, { color: colors.text }]}>{classItem.name}</Text>
                    <Text style={[styles.classInstructor, { color: colors.textSecondary }]}>Với {classItem.instructor}</Text>
                    <Text style={[styles.classDescription, { color: colors.textSecondary }]}>{classItem.description}</Text>
                </View>
                {classItem.booked && (
                    <View style={[styles.bookedBadge, { backgroundColor: colors.success + '20' }]}>
                        <MaterialIcons name="check-circle" size={20} color={colors.success} />
                        <Text style={[styles.bookedText, { color: colors.success }]}>Đã đặt</Text>
                    </View>
                )}
            </View>

            <View style={styles.classDetails}>
                <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{classItem.time}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons name="trending-up" size={16} color={getDifficultyColor(classItem.difficulty)} />
                    <Text style={[styles.detailText, { color: getDifficultyColor(classItem.difficulty) }]}>
                        {classItem.difficulty}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons name="people" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {classItem.spotsLeft}/{classItem.totalSpots} chỗ trống
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.bookButton,
                    { backgroundColor: colors.primary },
                    classItem.spotsLeft === 0 && [styles.bookButtonDisabled, { backgroundColor: colors.textMuted }],
                    classItem.booked && [styles.bookButtonBooked, { backgroundColor: colors.success }]
                ]}
                disabled={classItem.spotsLeft === 0}
                onPress={() => handleBookClass(classItem)}
            >
                <Text style={[
                    styles.bookButtonText,
                    classItem.spotsLeft === 0 && [styles.bookButtonTextDisabled, { color: colors.textSecondary }],
                    classItem.booked && styles.bookButtonTextBooked
                ]}>
                    {classItem.booked ? 'Đã đặt lịch' : classItem.spotsLeft === 0 ? 'Hết chỗ' : 'Đặt lịch'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderPTCard = (ptSession) => (
        <View key={ptSession.id} style={[styles.ptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.ptCardContent}>
                {/* Rating - Top Right Corner */}
                <View style={styles.ratingTopRight}>
                    <View style={[styles.ratingContainer, { backgroundColor: colors.warning + '20' }]}>
                        <MaterialIcons name="star" size={16} color={colors.warning} />
                        <Text style={[styles.ratingText, { color: colors.warning }]}>{ptSession.rating}</Text>
                    </View>
                </View>

                {/* PT Image - Centered */}
                <View style={styles.ptImageSection}>
                    {ptSession.anhDaiDien ? (
                        <Image
                            source={{ uri: ptSession.anhDaiDien }}
                            style={[styles.ptImage, { borderColor: colors.border }]}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.ptImagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MaterialIcons name="person" size={60} color={colors.textSecondary} />
                        </View>
                    )}
                </View>

                {/* PT Info - Below Image */}
                <View style={styles.ptInfoSection}>
                    <Text style={[styles.className, { color: colors.text }]}>{ptSession.trainer}</Text>
                    <Text style={[styles.classInstructor, { color: colors.textSecondary }]}>Chuyên về {ptSession.specialty}</Text>
                    <Text style={[styles.classDescription, { color: colors.textSecondary }]}>{ptSession.description}</Text>
                </View>

                <View style={styles.classDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="work" size={16} color={colors.textSecondary} />
                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{ptSession.experience} kinh nghiệm</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="monetization-on" size={16} color={colors.primary} />
                            <Text style={[styles.detailText, { color: colors.primary }]}>{ptSession.price}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.timeSlots}>
                    <Text style={[styles.timeSlotsTitle, { color: colors.text }]}>Giờ có thể đặt:</Text>
                    <View style={styles.timeSlotsList}>
                        {ptSession.availableSlots.map((slot, index) => (
                            <View key={index} style={[styles.timeSlot, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.timeSlotText, { color: colors.text }]}>{slot}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.bookButton,
                    { backgroundColor: colors.primary },
                    ptSession.booked && [styles.bookButtonBooked, { backgroundColor: colors.success }]
                ]}
                onPress={() => handleBookClass(ptSession)}
            >
                <Text style={[styles.bookButtonText, ptSession.booked && styles.bookButtonTextBooked]}>
                    {ptSession.booked ? 'Đã đặt lịch' : 'Đặt lịch PT'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Đặt lịch</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: colors.surface }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <MaterialIcons name="calendar-today" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {renderDateSelector()}

            <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'group' && [styles.tabActive, { backgroundColor: colors.primary }]]}
                    onPress={() => setSelectedTab('group')}
                >
                    <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'group' && [styles.tabTextActive, { color: '#fff' }]]}>
                        Lớp học nhóm
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'pt' && [styles.tabActive, { backgroundColor: colors.primary }]]}
                    onPress={() => setSelectedTab('pt')}
                >
                    <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'pt' && [styles.tabTextActive, { color: '#fff' }]]}>
                        Personal Trainer
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {selectedTab === 'group' ? (
                    <View style={styles.classList}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Chức năng lớp học nhóm đang được phát triển
                        </Text>
                    </View>
                ) : (
                    <View style={styles.ptScrollContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.ptHorizontalList}
                        >
                            {ptSessions.map(renderPTCard)}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            {/* Booking Confirmation Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Xác nhận đặt lịch</Text>

                        {selectedClass && (
                            <View style={styles.modalContent}>
                                <Text style={[styles.modalClassName, { color: colors.text }]}>
                                    {selectedTab === 'group' ? selectedClass.name : selectedClass.trainer}
                                </Text>
                                <Text style={[styles.modalClassDetails, { color: colors.textSecondary }]}>
                                    {selectedTab === 'group'
                                        ? `${selectedClass.time} - ${selectedClass.instructor}`
                                        : `${selectedClass.specialty} - ${selectedClass.price}`
                                    }
                                </Text>
                                <Text style={[styles.modalDate, { color: colors.primary }]}>
                                    Ngày: {selectedDate.toLocaleDateString('vi-VN')}
                                </Text>

                                {selectedTab === 'pt' && (
                                    <View style={styles.timePickerContainer}>
                                        <Text style={[styles.timePickerLabel, { color: colors.text }]}>Chọn giờ:</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
                                            {selectedClass.availableSlots?.map((slot, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={[
                                                        styles.timeSlotButton,
                                                        { backgroundColor: colors.card, borderColor: colors.border },
                                                        selectedTime === slot && [styles.timeSlotSelected, { backgroundColor: colors.primary }]
                                                    ]}
                                                    onPress={() => setSelectedTime(slot)}
                                                >
                                                    <Text style={[
                                                        styles.timeSlotButtonText,
                                                        { color: colors.text },
                                                        selectedTime === slot && [styles.timeSlotButtonTextSelected, { color: '#fff' }]
                                                    ]}>
                                                        {slot}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButtonCancel, { backgroundColor: colors.surface }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonCancelText, { color: colors.textSecondary }]}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButtonConfirm, { backgroundColor: colors.primary }]}
                                onPress={confirmBooking}
                            >
                                <Text style={styles.modalButtonConfirmText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Calendar Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.calendarModalOverlay}>
                    <View style={[styles.calendarModal, { backgroundColor: colors.surface }]}>
                        {/* Calendar Header */}
                        <View style={[styles.calendarHeader, { backgroundColor: colors.primary }]}>
                            <TouchableOpacity
                                style={styles.calendarNavButton}
                                onPress={() => navigateMonth(-1)}
                            >
                                <MaterialIcons name="chevron-left" size={24} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.calendarTitleContainer}>
                                <Text style={styles.calendarYear}>
                                    {currentMonth.getFullYear()}
                                </Text>
                                <Text style={styles.calendarMonth}>
                                    {currentMonth.toLocaleDateString('vi-VN', { month: 'long' })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.calendarNavButton}
                                onPress={() => navigateMonth(1)}
                            >
                                <MaterialIcons name="chevron-right" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Days Header */}
                        <View style={[styles.calendarDaysHeader, { backgroundColor: colors.card }]}>
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => (
                                <Text key={index} style={[styles.calendarDayHeader, { color: colors.textSecondary }]}>
                                    {day}
                                </Text>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View style={styles.calendarGrid}>
                            {generateCalendarDays(currentMonth).map((date, index) => {
                                const disabled = isDateDisabled(date);
                                const selected = isDateSelected(date);
                                const today = isToday(date);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.calendarDay,
                                            { backgroundColor: colors.surface },
                                            selected && [styles.calendarDaySelected, { backgroundColor: colors.primary }],
                                            today && !selected && [styles.calendarDayToday, { borderColor: colors.primary }],
                                            disabled && [styles.calendarDayDisabled, { backgroundColor: colors.borderLight }]
                                        ]}
                                        onPress={() => {
                                            if (date && !disabled) {
                                                setSelectedDate(date);
                                                setShowDatePicker(false);
                                            }
                                        }}
                                        disabled={disabled}
                                    >
                                        <Text style={[
                                            styles.calendarDayText,
                                            { color: colors.text },
                                            selected && [styles.calendarDayTextSelected, { color: '#fff' }],
                                            disabled && [styles.calendarDayTextDisabled, { color: colors.textMuted }]
                                        ]}>
                                            {date ? date.getDate() : ''}
                                        </Text>
                                        {today && !selected && (
                                            <View style={[styles.calendarTodayDot, { backgroundColor: colors.primary }]} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Calendar Footer */}
                        <View style={[styles.calendarFooter, { borderTopColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.calendarButton, { backgroundColor: colors.surface }]}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={[styles.calendarButtonText, { color: colors.text }]}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.calendarButton, { backgroundColor: colors.primary }]}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={styles.calendarButtonTextSelected}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    calendarButton: {
        padding: 8,
        borderRadius: 20,
    },
    dateSelector: {
        paddingVertical: 20,
        paddingLeft: 20,
        borderBottomWidth: 1,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingRight: 20,
    },
    selectedDateText: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    dateItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderRadius: 12,
    },
    dateItemSelected: {
        // backgroundColor will be set dynamically
    },
    dateDay: {
        fontSize: 14,
        marginBottom: 4,
    },
    dateDaySelected: {
        // color will be set dynamically
    },
    dateNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateNumberSelected: {
        // color will be set dynamically
    },
    todayItem: {
        borderWidth: 2,
    },
    todayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        margin: 20,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        // backgroundColor will be set dynamically
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    tabTextActive: {
        // color will be set dynamically
    },
    scrollView: {
        flex: 1,
    },
    classList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    classCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    ptScrollContainer: {
        paddingVertical: 10,
    },
    ptHorizontalList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    ptCard: {
        width: width * 0.85,
        marginRight: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        justifyContent: 'space-between',
        minHeight: 500,
    },
    ptCardContent: {
        flex: 1,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    ptImageSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    ptImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
    },
    ptImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ptInfoSection: {
        marginBottom: 16,
        alignItems: 'center',
    },
    ptNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingTopRight: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
    },
    ratingCenterContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    classInstructor: {
        fontSize: 16,
        marginBottom: 4,
        textAlign: 'center',
    },
    classDescription: {
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center',
    },
    bookedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    bookedText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    classDetails: {
        alignItems: 'center',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    detailText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    timeSlots: {
        marginBottom: 16,
    },
    timeSlotsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    timeSlotsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    timeSlot: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '500',
    },
    bookButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    bookButtonDisabled: {
        // backgroundColor will be set dynamically
    },
    bookButtonBooked: {
        // backgroundColor will be set dynamically
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    bookButtonTextDisabled: {
        // color will be set dynamically
    },
    bookButtonTextBooked: {
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalContent: {
        marginBottom: 24,
    },
    modalClassName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalClassDetails: {
        fontSize: 14,
        marginBottom: 4,
    },
    modalDate: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButtonCancel: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        marginRight: 8,
    },
    modalButtonCancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonConfirm: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        marginLeft: 8,
    },
    modalButtonConfirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    timePickerContainer: {
        marginTop: 16,
    },
    timePickerLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    timePicker: {
        maxHeight: 50,
    },
    timeSlotButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    timeSlotSelected: {
        // backgroundColor will be set dynamically
    },
    timeSlotButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    timeSlotButtonTextSelected: {
        // color will be set dynamically
    },
    // Custom Calendar Styles
    calendarModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarModal: {
        width: '100%',
        maxWidth: 350,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    calendarNavButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    calendarTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    calendarYear: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    calendarMonth: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 4,
    },
    calendarDaysHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    calendarDayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 4,
    },
    calendarDay: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
        borderRadius: 12,
        position: 'relative',
    },
    calendarDaySelected: {
        // backgroundColor will be set dynamically
    },
    calendarDayToday: {
        borderWidth: 2,
    },
    calendarDayDisabled: {
        // backgroundColor will be set dynamically
    },
    calendarDayText: {
        fontSize: 16,
        fontWeight: '500',
    },
    calendarDayTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    calendarDayTextDisabled: {
        // color will be set dynamically
    },
    calendarTodayDot: {
        position: 'absolute',
        bottom: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    calendarFooter: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        gap: 12,
    },
    calendarButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    calendarButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    calendarButtonTextSelected: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
        paddingHorizontal: 20,
    },
});

export default ClassBookingScreen;
