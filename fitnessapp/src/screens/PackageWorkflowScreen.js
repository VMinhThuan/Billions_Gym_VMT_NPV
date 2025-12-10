import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../api/apiService';
import { useAuth } from '../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PackageWorkflowScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { registrationId } = route.params || {};
    const { userInfo } = useAuth();

    const [loading, setLoading] = useState(true);
    const [workflowData, setWorkflowData] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load

    // Branch selection
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(false);

    // Trainer selection
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState(null);
    const [gioTapUuTien, setGioTapUuTien] = useState([]);
    const [soNgayTapTrongTuan, setSoNgayTapTrongTuan] = useState(3);

    // Schedule builder states
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
        if (registrationId) {
            fetchWorkflowStatus();
        }
    }, [registrationId]);

    const fetchWorkflowStatus = async () => {
        try {
            setLoading(true);
            const response = await apiService.apiCall(
                `/package-workflow/workflow-status/${registrationId}`,
                'GET',
                null,
                true
            );

            if (response.success) {
                console.log('📊 Workflow status:', {
                    currentStep: response.data.currentStep,
                    trangThaiDangKy: response.data.registration?.trangThaiDangKy,
                    isOwner: response.data.isOwner,
                    branchId: response.data.registration?.branchId?._id,
                });

                setWorkflowData(response.data);
                setSelectedBranchId(response.data.registration?.branchId?._id);

                // Chỉ set currentStep khi lần đầu load
                if (isInitialLoad) {
                    setIsInitialLoad(false);

                    // Set current step based on workflow status
                    if (response.data.currentStep === 'completed' ||
                        response.data.registration?.trangThaiDangKy === 'HOAN_THANH') {
                        const totalSteps = response.data.isOwner ? 4 : 3;
                        setCurrentStep(totalSteps - 1);
                    } else {
                        // Nếu là owner và workflow chưa hoàn thành, luôn bắt đầu từ bước 0 (chọn chi nhánh)
                        if (response.data.isOwner) {
                            console.log('🎯 Owner - Starting from step 0 (Select Branch)');
                            setCurrentStep(0);
                        } else {
                            // Partner bắt đầu từ bước select trainer
                            const stepIndex = getStepIndex(response.data.currentStep, response.data.isOwner);
                            console.log('🎯 Partner - Setting initial step to:', stepIndex, 'for step:', response.data.currentStep);
                            setCurrentStep(stepIndex);
                        }
                    }
                }

                return response;
            } else {
                setError(response.message || 'Không thể tải thông tin workflow');
                return null;
            }
        } catch (err) {
            console.error('❌ Error fetching workflow status:', err);
            setError('Lỗi khi tải thông tin workflow');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getStepIndex = (stepName, isOwner) => {
        const steps = isOwner
            ? ['selectBranch', 'selectTrainer', 'createSchedule', 'completed']
            : ['selectTrainer', 'createSchedule', 'completed'];
        return steps.indexOf(stepName);
    };

    const fetchBranches = async () => {
        try {
            const response = await apiService.apiCall('/chinhanh', 'GET', null, true);
            if (response.success) {
                setBranches(response.data);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    };

    const fetchTrainers = async () => {
        try {
            const response = await apiService.apiCall(
                `/package-workflow/available-trainers/${registrationId}`,
                'POST',
                {
                    gioTapUuTien,
                    soNgayTapTrongTuan,
                },
                true
            );

            if (response.success) {
                const list = Array.isArray(response.data?.availablePTs)
                    ? response.data.availablePTs
                    : Array.isArray(response.data)
                        ? response.data
                        : [];
                setTrainers(list);
            }
        } catch (err) {
            console.error('Error fetching trainers:', err);
        }
    };

    const handleSelectBranch = async (branchId) => {
        try {
            console.log('🏢 handleSelectBranch called with branchId:', branchId);
            console.log('🏢 branchId type:', typeof branchId);
            console.log('🏢 branchId value:', JSON.stringify(branchId));

            if (!branchId) {
                Alert.alert('Lỗi', 'Không tìm thấy ID chi nhánh');
                return;
            }

            setLoading(true);
            const response = await apiService.apiCall(
                `/chitietgoitap/${registrationId}/branch`,
                'PATCH',
                { branchId },
                true
            );

            if (response.success) {
                setSelectedBranchId(branchId);
                setShowBranchModal(false);
                await fetchWorkflowStatus();
                setCurrentStep(1);
            } else {
                Alert.alert('Lỗi', response.message || 'Không thể cập nhật chi nhánh');
            }
        } catch (err) {
            console.error('Error selecting branch:', err);
            Alert.alert('Lỗi', 'Lỗi khi cập nhật chi nhánh');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrainer = async () => {
        if (!selectedTrainerId) {
            Alert.alert('Thông báo', 'Vui lòng chọn PT');
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.apiCall(
                `/package-workflow/select-trainer/${registrationId}`,
                'POST',
                {
                    ptId: selectedTrainerId,
                    gioTapUuTien,
                    soNgayTapTrongTuan,
                },
                true
            );

            if (response.success) {
                const statusResponse = await fetchWorkflowStatus();

                // Chỉ tăng currentStep nếu workflow chưa hoàn thành
                if (statusResponse?.data?.currentStep !== 'completed' &&
                    statusResponse?.data?.registration?.trangThaiDangKy !== 'HOAN_THANH') {
                    // Nếu là owner: từ bước 1 (selectTrainer) -> bước 2 (createSchedule)
                    // Nếu là partner: từ bước 0 (selectTrainer) -> bước 1 (createSchedule)
                    setCurrentStep(prev => prev + 1);
                }
            } else {
                Alert.alert('Lỗi', response.message || 'Không thể chọn PT');
            }
        } catch (err) {
            console.error('Error selecting trainer:', err);
            Alert.alert('Lỗi', 'Lỗi khi chọn PT');
        } finally {
            setLoading(false);
        }
    };

    // Schedule Builder Functions
    const fetchAvailableSessions = async () => {
        try {
            setSessionsLoading(true);

            // Lấy thông tin đăng ký để có chiNhanhId, goiTapId
            const registrationResponse = await apiService.apiCall(
                `/chitietgoitap/${registrationId}`,
                'GET',
                null,
                true
            );

            if (!registrationResponse.success) {
                throw new Error('Không thể lấy thông tin đăng ký');
            }

            const registration = registrationResponse.data;

            const today = new Date();
            const tuanBatDau = new Date(today);
            tuanBatDau.setDate(today.getDate() - today.getDay() + 1); // Bắt đầu từ Thứ 2
            tuanBatDau.setHours(0, 0, 0, 0);

            const goiTapId = registration.goiTapId?._id || registration.maGoiTap?._id;

            if (!goiTapId) {
                throw new Error('Không tìm thấy thông tin gói tập');
            }

            console.log('🔍 Fetching sessions with params:', {
                chiNhanhId: registration.branchId._id,
                tuanBatDau: tuanBatDau.toISOString(),
                goiTapId: goiTapId
            });

            const response = await apiService.apiCall(
                `/lich-tap/available-sessions?chiNhanhId=${registration.branchId._id}&tuanBatDau=${encodeURIComponent(tuanBatDau.toISOString())}&goiTapId=${goiTapId}`,
                'GET',
                null,
                true
            );

            if (response.success) {
                console.log('✅ Sessions received:', response.data.sessions?.length || 0);
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

    const handleCreateScheduleWithSessions = async () => {
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

        await handleCreateSchedule(scheduleData);
    };

    // Effect to load sessions when reaching schedule creation step
    useEffect(() => {
        const isScheduleStep = workflowData?.isOwner ? currentStep === 2 : currentStep === 1;
        if (isScheduleStep && registrationId) {
            fetchAvailableSessions();
        }
    }, [currentStep, registrationId, workflowData]);

    const handleCreateSchedule = async (scheduleData) => {
        try {
            setLoading(true);
            const response = await apiService.apiCall(
                `/package-workflow/generate-schedule/${registrationId}`,
                'POST',
                {
                    registrationId,
                    ...scheduleData
                },
                true
            );

            if (response.success) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await fetchWorkflowStatus();
                setCurrentStep(prev => prev + 1);
            } else {
                Alert.alert('Lỗi', response.message || 'Không thể tạo lịch tập');
            }
        } catch (err) {
            console.error('Error creating schedule:', err);
            if (err.response?.status === 409) {
                setCurrentStep(prev => prev + 1);
            } else {
                Alert.alert('Lỗi', 'Lỗi khi tạo lịch tập');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteWorkflow = async () => {
        try {
            setLoading(true);
            const response = await apiService.apiCall(
                `/package-workflow/complete-workflow/${registrationId}`,
                'POST',
                {},
                true
            );

            if (response.success) {
                Alert.alert(
                    'Thành công',
                    'Đăng ký gói tập thành công! Bạn có thể bắt đầu tập luyện ngay.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'MainTabs' }],
                                });
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Lỗi', response.message || 'Không thể hoàn thành workflow');
            }
        } catch (err) {
            console.error('Error completing workflow:', err);
            Alert.alert('Lỗi', 'Lỗi khi hoàn thành workflow');
        } finally {
            setLoading(false);
        }
    };

    const getStepTitle = (stepIndex, isOwner) => {
        const steps = isOwner
            ? ['Chọn chi nhánh', 'Chọn PT + lịch', 'Tạo lịch tập', 'Hoàn thành']
            : ['Chọn PT + lịch', 'Tạo lịch tập', 'Hoàn thành'];
        return steps[stepIndex] || '';
    };

    const renderProgressSteps = () => {
        if (!workflowData) return null;

        const totalSteps = workflowData.isOwner ? 4 : 3;

        return (
            <View style={styles.stepsContainer}>
                {Array.from({ length: totalSteps }, (_, index) => (
                    <React.Fragment key={index}>
                        <View style={styles.stepWrapper}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    index <= currentStep && styles.stepCircleActive,
                                ]}
                            >
                                <Text style={styles.stepNumber}>
                                    {index < currentStep ? '✓' : index + 1}
                                </Text>
                            </View>
                            <Text style={styles.stepTitle}>
                                {getStepTitle(index, workflowData.isOwner)}
                            </Text>
                        </View>
                        {index < totalSteps - 1 && (
                            <View style={styles.stepConnector} />
                        )}
                    </React.Fragment>
                ))}
            </View>
        );
    };

    const renderBranchSelection = () => {
        if (branches.length === 0) {
            fetchBranches();
        }

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepDescription}>
                    Chọn chi nhánh tập luyện cho gói tập của bạn
                </Text>

                {workflowData?.registration?.branchId && (
                    <View style={styles.currentBranchCard}>
                        <View style={styles.branchInfo}>
                            <Text style={styles.branchLabel}>📍 Chi nhánh hiện tại</Text>
                            <Text style={styles.branchName}>
                                {typeof workflowData.registration.branchId === 'object'
                                    ? workflowData.registration.branchId.tenChiNhanh
                                    : 'Chi nhánh đã chọn'}
                            </Text>
                            <Text style={styles.branchAddress}>
                                {typeof workflowData.registration.branchId === 'object'
                                    ? workflowData.registration.branchId.diaChi
                                    : ''}
                            </Text>
                        </View>
                        <View style={styles.branchActions}>
                            <TouchableOpacity
                                style={styles.btnConfirm}
                                onPress={() => {
                                    const branchId = typeof workflowData.registration.branchId === 'object'
                                        ? workflowData.registration.branchId._id
                                        : workflowData.registration.branchId;
                                    console.log('🏢 Confirming current branch:', branchId);
                                    handleSelectBranch(branchId);
                                }}
                                disabled={loading}
                            >
                                <Text style={styles.btnConfirmText}>Xác nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnChange}
                                onPress={() => setShowBranchModal(true)}
                                disabled={loading}
                            >
                                <Text style={styles.btnChangeText}>Đổi chi nhánh</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <Modal
                    visible={showBranchModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowBranchModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn chi nhánh</Text>
                                <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                                    <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalBody}>
                                {branches.map((branch) => (
                                    <TouchableOpacity
                                        key={branch._id}
                                        style={[
                                            styles.branchItem,
                                            selectedBranchId === branch._id && styles.branchItemSelected,
                                        ]}
                                        onPress={() => handleSelectBranch(branch._id)}
                                    >
                                        <View>
                                            <Text style={styles.branchItemName}>{branch.tenChiNhanh}</Text>
                                            <Text style={styles.branchItemAddress}>{branch.diaChi}</Text>
                                        </View>
                                        {selectedBranchId === branch._id && (
                                            <Text style={styles.branchItemCheck}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    };

    const renderTrainerSelection = () => {
        if (trainers.length === 0) {
            fetchTrainers();
        }

        const timeSlots = [
            '06:00-08:00', '08:00-10:00', '10:00-12:00', '14:00-16:00',
            '16:00-18:00', '18:00-20:00', '20:00-22:00',
        ];

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepDescription}>
                    Chọn PT và thiết lập lịch trình ưu tiên
                </Text>

                <View style={styles.preferencesCard}>
                    <Text style={styles.preferencesTitle}>Thời gian ưu tiên</Text>
                    <View style={styles.timeSlotsGrid}>
                        {timeSlots.map((slot) => (
                            <TouchableOpacity
                                key={slot}
                                style={[
                                    styles.timeSlotChip,
                                    gioTapUuTien.includes(slot) && styles.timeSlotChipActive,
                                ]}
                                onPress={() => {
                                    if (gioTapUuTien.includes(slot)) {
                                        setGioTapUuTien(gioTapUuTien.filter((t) => t !== slot));
                                    } else {
                                        setGioTapUuTien([...gioTapUuTien, slot]);
                                    }
                                }}
                            >
                                <Text
                                    style={[
                                        styles.timeSlotText,
                                        gioTapUuTien.includes(slot) && styles.timeSlotTextActive,
                                    ]}
                                >
                                    {slot}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.preferencesTitle}>Số ngày tập/tuần</Text>
                    <View style={styles.daysGrid}>
                        {[3, 4, 5, 6, 7].map((days) => (
                            <TouchableOpacity
                                key={days}
                                style={[
                                    styles.dayChip,
                                    soNgayTapTrongTuan === days && styles.dayChipActive,
                                ]}
                                onPress={() => setSoNgayTapTrongTuan(days)}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        soNgayTapTrongTuan === days && styles.dayTextActive,
                                    ]}
                                >
                                    {days}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.btnRefresh}
                        onPress={fetchTrainers}
                        disabled={loading}
                    >
                        <Text style={styles.btnRefreshText}>🔄 Tìm PT phù hợp</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.trainersContainer}>
                    {trainers.map((trainer) => (
                        <TouchableOpacity
                            key={trainer._id}
                            style={[
                                styles.trainerCard,
                                selectedTrainerId === trainer._id && styles.trainerCardSelected,
                            ]}
                            onPress={() => setSelectedTrainerId(trainer._id)}
                        >
                            <View style={styles.trainerHeader}>
                                <View style={styles.trainerAvatar}>
                                    <Text style={styles.trainerAvatarText}>
                                        {trainer.hoTen?.charAt(0) || 'P'}
                                    </Text>
                                </View>
                                <View style={styles.trainerInfo}>
                                    <Text style={styles.trainerName}>{trainer.hoTen}</Text>
                                    <Text style={styles.trainerSpecialty}>
                                        {trainer.chuyenMon || 'Personal Trainer'}
                                    </Text>
                                </View>
                                {selectedTrainerId === trainer._id && (
                                    <Text style={styles.trainerCheck}>✓</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.btnNext, styles.btnSolid]}
                    onPress={handleSelectTrainer}
                    disabled={loading || !selectedTrainerId}
                >
                    <Text style={styles.btnNextText}>Tiếp tục</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderScheduleCreation = () => {
        if (sessionsLoading) {
            return (
                <View style={styles.stepContent}>
                    <ActivityIndicator size="large" color="#da2128" />
                    <Text style={styles.loadingText}>Đang tải danh sách buổi tập...</Text>
                </View>
            );
        }

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepDescription}>
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

                                    // Kiểm tra xem time slot đã qua chưa
                                    const now = new Date();
                                    const slotDate = new Date(day.date);
                                    const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
                                    slotDate.setHours(endHour, endMinute, 0, 0);
                                    const isPast = slotDate < now;

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
                    style={[styles.btnNext, styles.btnSolid, selectedSessions.length === 0 && styles.btnDisabled]}
                    onPress={handleCreateScheduleWithSessions}
                    disabled={loading || selectedSessions.length === 0}
                >
                    <Text style={styles.btnNextText}>
                        {loading ? 'Đang tạo lịch...' : 'Tạo lịch tập'}
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

                                    // Kiểm tra buổi tập đã qua chưa
                                    const now = new Date();
                                    const sessionDate = new Date(session.ngay);
                                    const [endHour, endMinute] = session.gioKetThuc.split(':').map(Number);
                                    sessionDate.setHours(endHour, endMinute, 0, 0);
                                    const isSessionPast = sessionDate < now;

                                    // Nếu buổi tập đã qua, không hiển thị
                                    if (isSessionPast) return null;

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

    const renderWorkflowComplete = () => {
        return (
            <View style={styles.stepContent}>
                <View style={styles.completedContainer}>
                    <Text style={styles.completedIcon}>🎉</Text>
                    <Text style={styles.completedTitle}>Hoàn tất đăng ký gói tập!</Text>
                    <Text style={styles.completedText}>
                        Gói tập của bạn đã được kích hoạt và sẵn sàng sử dụng.
                    </Text>

                    {workflowData?.registration && (
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Thông tin gói tập</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Gói tập:</Text>
                                <Text style={styles.summaryValue}>
                                    {workflowData.registration.goiTapId?.tenGoiTap || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Chi nhánh:</Text>
                                <Text style={styles.summaryValue}>
                                    {workflowData.registration.branchId?.tenChiNhanh || 'N/A'}
                                </Text>
                            </View>
                            {workflowData.workflowSteps?.selectTrainer?.data && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>PT:</Text>
                                    <Text style={styles.summaryValue}>
                                        {workflowData.workflowSteps.selectTrainer.data.hoTen || 'N/A'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.btnHome}
                        onPress={() => {
                            navigation.navigate('Main', { screen: 'Home' });
                        }}
                    >
                        <Text style={styles.btnHomeText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStepContent = () => {
        if (!workflowData) return null;

        const { isOwner } = workflowData;

        if (
            workflowData.currentStep === 'completed' ||
            workflowData.registration?.trangThaiDangKy === 'HOAN_THANH'
        ) {
            return renderWorkflowComplete();
        }

        if (isOwner) {
            switch (currentStep) {
                case 0: return renderBranchSelection();
                case 1: return renderTrainerSelection();
                case 2: return renderScheduleCreation();
                case 3: return renderWorkflowComplete();
                default: return null;
            }
        } else {
            switch (currentStep) {
                case 0: return renderTrainerSelection();
                case 1: return renderScheduleCreation();
                case 2: return renderWorkflowComplete();
                default: return null;
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#da2128" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>❌</Text>
                <Text style={styles.errorTitle}>Lỗi xảy ra</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.btnRetry} onPress={fetchWorkflowStatus}>
                    <Text style={styles.btnRetryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#0a0a0a']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Hoàn tất đăng ký gói tập</Text>
                {workflowData?.registration?.goiTapId && (
                    <Text style={styles.packageName}>
                        {workflowData.registration.goiTapId.tenGoiTap}
                    </Text>
                )}
                {workflowData?.isOwner && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Người thanh toán</Text>
                    </View>
                )}
            </LinearGradient>

            {renderProgressSteps()}

            <View style={styles.content}>
                <Text style={styles.currentStepTitle}>
                    {getStepTitle(currentStep, workflowData?.isOwner)}
                </Text>
                {renderStepContent()}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
    loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 20 },
    errorIcon: { fontSize: 64, marginBottom: 16 },
    errorTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    errorText: { fontSize: 16, color: '#999', textAlign: 'center', marginBottom: 24 },
    btnRetry: { backgroundColor: '#da2128', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
    btnRetryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    header: { padding: 24, paddingTop: 60, alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    packageName: { fontSize: 18, color: '#da2128', marginBottom: 12 },
    badge: { backgroundColor: '#da2128', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    stepsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#141414', alignItems: 'center' },
    stepWrapper: { alignItems: 'center', flex: 1 },
    stepConnector: { height: 2, backgroundColor: '#fff', flex: 0.5, marginBottom: 30 },
    stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    stepCircleActive: { backgroundColor: '#da2128' },
    stepNumber: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    stepTitle: { color: '#999', fontSize: 12, textAlign: 'center' },
    content: { padding: 20 },
    currentStepTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    stepContent: { marginTop: 16 },
    stepDescription: { fontSize: 14, color: '#999', marginBottom: 20 },
    currentBranchCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#262626' },
    branchInfo: { marginBottom: 16 },
    branchLabel: { color: '#999', fontSize: 14, marginBottom: 8 },
    branchName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    branchAddress: { color: '#999', fontSize: 14 },
    branchActions: { flexDirection: 'row', gap: 12 },
    btnConfirm: { flex: 1, backgroundColor: '#da2128', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    btnChange: { flex: 1, backgroundColor: '#262626', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnChangeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#262626' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalClose: { color: '#999', fontSize: 24 },
    modalBody: { padding: 20 },
    branchItem: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#262626' },
    branchItemSelected: { borderColor: '#da2128', backgroundColor: '#2a1a1a' },
    branchItemName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    branchItemAddress: { color: '#999', fontSize: 14 },
    branchItemCheck: { color: '#da2128', fontSize: 24 },
    preferencesCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#262626' },
    preferencesTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
    timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    timeSlotChip: { backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#262626' },
    timeSlotChipActive: { backgroundColor: '#da2128', borderColor: '#da2128' },
    timeSlotText: { color: '#999', fontSize: 14 },
    timeSlotTextActive: { color: '#fff', fontWeight: '600' },
    daysGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    dayChip: { flex: 1, backgroundColor: '#1a1a1a', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#262626' },
    dayChipActive: { backgroundColor: '#da2128', borderColor: '#da2128' },
    dayText: { color: '#999', fontSize: 16, fontWeight: '600' },
    dayTextActive: { color: '#fff' },
    btnRefresh: { backgroundColor: '#262626', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnRefreshText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    trainersContainer: { marginBottom: 20 },
    trainerCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#262626' },
    trainerCardSelected: { borderColor: '#da2128', backgroundColor: '#2a1a1a' },
    trainerHeader: { flexDirection: 'row', alignItems: 'center' },
    trainerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#da2128', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    trainerAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    trainerInfo: { flex: 1 },
    trainerName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    trainerSpecialty: { color: '#999', fontSize: 14 },
    trainerCheck: { color: '#da2128', fontSize: 24 },
    scheduleCard: { backgroundColor: '#141414', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#262626' },
    scheduleInfo: { color: '#fff', fontSize: 16, marginBottom: 12 },
    scheduleItem: { color: '#999', fontSize: 14, marginBottom: 8 },
    completedContainer: { alignItems: 'center', paddingVertical: 40 },
    completedIcon: { fontSize: 80, marginBottom: 20 },
    completedTitle: { fontSize: 24, fontWeight: 'bold', color: '#4ade80', marginBottom: 12, textAlign: 'center' },
    completedText: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
    summaryCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, width: '100%', marginBottom: 32, borderWidth: 1, borderColor: '#333' },
    summaryTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { color: '#aaa', fontSize: 14 },
    summaryValue: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
    btnNext: { borderRadius: 12, marginTop: 20 },
    btnSolid: { backgroundColor: '#da2128', paddingVertical: 16, alignItems: 'center' },
    btnNextText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    btnHome: { marginTop: 16, paddingVertical: 12 },
    btnHomeText: { color: '#da2128', fontSize: 16, fontWeight: '600', textAlign: 'center' },
    btnDisabled: { backgroundColor: '#333', opacity: 0.5 },

    // Schedule Builder Styles - Dark Theme
    loadingText: { marginTop: 10, color: '#999', fontSize: 14, textAlign: 'center' },
    weekContainer: { marginBottom: 20 },
    weekContent: { paddingRight: 16 },
    dayColumn: { width: 120, marginRight: 12 },
    dayHeader: { backgroundColor: '#da2128', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
    dayName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    dayDate: { color: '#fff', fontSize: 12, marginTop: 4 },
    timeSlotCard: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 8, minHeight: 60, justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
    timeSlotPast: { backgroundColor: '#0f0f0f', opacity: 0.5, borderColor: '#222' },
    timeSlotSelected: { backgroundColor: '#1a3a2a', borderWidth: 2, borderColor: '#4ade80' },
    timeSlotAvailable: { backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#da2128' },
    timeSlotLabel: { fontSize: 12, fontWeight: '600', color: '#fff', marginBottom: 4 },
    timeSlotStatus: { fontSize: 11, color: '#888' },
    timeSlotStatusSelected: { fontSize: 11, color: '#4ade80', fontWeight: '600' },
    timeSlotStatusAvailable: { fontSize: 11, color: '#ff6b6b', fontWeight: '600' },
    selectedSummary: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 20, marginTop: 20, borderWidth: 1, borderColor: '#333' },
    selectedCount: { fontSize: 16, fontWeight: 'bold', color: '#da2128', marginBottom: 12 },
    selectedList: { maxHeight: 200 },
    selectedItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
    selectedDay: { fontSize: 14, fontWeight: '600', color: '#fff', width: 50 },
    selectedTime: { fontSize: 14, color: '#ccc', flex: 1 },
    selectedTrainer: { fontSize: 14, color: '#ccc', marginRight: 12 },
    selectedRemove: { fontSize: 24, color: '#da2128', fontWeight: 'bold' },

    // Session Modal Styles - Dark Theme
    sessionModal: { backgroundColor: '#0a0a0a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    modalSubtitle: { fontSize: 14, color: '#999', marginTop: 4 },
    modalBody: { padding: 20 },
    modalInfo: { backgroundColor: '#1a2a3a', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#2a3a4a' },
    modalInfoText: { fontSize: 14, color: '#66b3ff' },
    sessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 2, borderColor: '#333' },
    sessionCardSelected: { borderColor: '#da2128', backgroundColor: '#2a1a1a' },
    sessionInfo: { flex: 1 },
    sessionName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    sessionPT: { fontSize: 14, color: '#ccc', marginBottom: 4 },
    sessionSlots: { fontSize: 12, color: '#4ade80' },
    sessionCheck: { fontSize: 24, color: '#da2128', fontWeight: 'bold' },
});

export default PackageWorkflowScreen;
