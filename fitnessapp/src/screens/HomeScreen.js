import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, ImageBackground, RefreshControl, Dimensions, Image, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from "../hooks/useAuth";
import { useTheme, DEFAULT_THEME } from "../hooks/useTheme";
import apiService from '../api/apiService';
import Chatbot from '../components/Chatbot';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation();
    const { logout, userInfo, userToken } = useAuth();
    const { colors } = useTheme();
    const isLightMode = colors?.background === DEFAULT_THEME.background;
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [memberData, setMemberData] = useState({
        workoutsThisWeek: 0,
        totalWorkouts: 0,
        currentStreak: 0,
        membershipDaysLeft: 0,
        packageName: '',
        nextClass: "Chưa có lịch",
        nextClassTime: "--:--",
        todayCalories: 0,
        weeklyGoal: 2000
    });
    const [hasPackage, setHasPackage] = useState(false);
    const [PTData, setPTData] = useState([]);

    // Upcoming classes 
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [loadingUpcoming, setLoadingUpcoming] = useState(false);

    //Workout 
    const [workoutData, setWorkoutData] = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(false);

    // Healthy meals
    const [healthyMeals, setHealthyMeals] = useState([]);
    const [loadingMeals, setLoadingMeals] = useState(false);
    const [currentMealType, setCurrentMealType] = useState('');

    // Exercises
    const [exercises, setExercises] = useState([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    const getMealTypeName = (type) => {
        // Hỗ trợ cả format cũ (SANG, TRUA) và format mới (Bữa sáng, Bữa trưa)
        const mealNames = {
            'SANG': 'Bữa sáng',
            'TRUA': 'Bữa trưa',
            'CHIEU': 'Ăn nhẹ',
            'TOI': 'Bữa tối',
            'Bữa sáng': 'Bữa sáng',
            'Bữa trưa': 'Bữa trưa',
            'Ăn nhẹ': 'Ăn nhẹ',
            'Bữa tối': 'Bữa tối',
            'Phụ 1': 'Phụ 1',
            'Phụ 2': 'Phụ 2',
            'Phụ 3': 'Phụ 3'
        };
        return mealNames[type] || 'Bữa ăn';
    };

    // Hàm xác định mealType theo giờ hiện tại
    const getCurrentMealType = () => {
        const currentHour = new Date().getHours();

        if (currentHour >= 5 && currentHour < 11) {
            return 'SANG'; // 5:00 - 10:59 AM
        } else if (currentHour >= 11 && currentHour < 14) {
            return 'TRUA'; // 11:00 AM - 1:59 PM
        } else if (currentHour >= 14 && currentHour < 18) {
            return 'CHIEU'; // 2:00 PM - 5:59 PM
        } else {
            return 'TOI'; // 6:00 PM - 4:59 AM
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchPTData();
        // Tự động load món ăn theo thời gian hiện tại
        const currentMeal = getCurrentMealType();
        fetchHealthyMeals(currentMeal);
        fetchExercises();
    }, []);

    // Debug: Log PTData changes
    useEffect(() => {
        console.log('💾 PTData state changed:', {
            length: PTData?.length,
            isArray: Array.isArray(PTData),
            firstItem: PTData?.[0]?.hoTen
        });
    }, [PTData]);

    const Avatar = ({ userProfile, size = 50 }) => {
        const getInitial = (name) => {
            if (!name) return 'U';
            return name.charAt(0).toUpperCase();
        };

        if (userProfile?.anhDaiDien) {
            return (
                <Image
                    source={{ uri: userProfile.anhDaiDien }}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        marginRight: 12,
                    }}
                    resizeMode="cover"
                />
            );
        }

        return (
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: '#DA2128',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                }}
            >
                <Text
                    style={{
                        color: 'white',
                        fontSize: size * 0.5,
                        fontWeight: 'bold',
                    }}
                >
                    {getInitial(userProfile?.hoTen)}
                </Text>
            </View>
        );
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            if (!userToken) {
                Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.', [
                    { text: 'OK', onPress: () => logout() }
                ]);
                return;
            }

            const [
                workoutPlans,
                bodyStats,
                ptBookings,
                nutritionInfo,
                membershipInfo
            ] = await Promise.allSettled([
                apiService.getMyWorkoutPlans(),
                apiService.getMyLatestBodyStats(),
                apiService.getMyPTBookings(),
                apiService.getMyNutritionInfo(),
                apiService.getMyMembership()
            ]);

            if (workoutPlans.status === 'fulfilled' && workoutPlans.value) {
                try {
                    const workouts = Array.isArray(workoutPlans.value) ? workoutPlans.value : [];
                    const completedWorkouts = workouts.filter(w => w.trangThai === 'DaHoanThanh');
                    const thisWeekWorkouts = completedWorkouts.filter(w => {
                        const workoutDate = new Date(w.ngayTap);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return workoutDate >= weekAgo;
                    });

                    setMemberData(prev => ({
                        ...prev,
                        totalWorkouts: completedWorkouts.length,
                        workoutsThisWeek: thisWeekWorkouts.length,
                        currentStreak: calculateStreak(completedWorkouts)
                    }));
                } catch (error) {
                    console.error('Error processing workout data:', error);
                }
            }

            if (ptBookings.status === 'fulfilled' && ptBookings.value) {
                try {
                    const bookings = Array.isArray(ptBookings.value) ? ptBookings.value : [];
                    const upcomingBookings = bookings
                        .filter(b => b.trangThai === 'DaXacNhan' && new Date(b.ngayGioHen) > new Date())
                        .sort((a, b) => new Date(a.ngayGioHen) - new Date(b.ngayGioHen));

                    if (upcomingBookings.length > 0) {
                        const nextBooking = upcomingBookings[0];
                        const bookingDate = new Date(nextBooking.ngayGioHen);
                        setMemberData(prev => ({
                            ...prev,
                            nextClass: `PT với ${nextBooking.maPT?.hoTen || 'PT'}`,
                            nextClassTime: bookingDate.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                        }));
                    }
                } catch (error) {
                }
            }

            if (membershipInfo.status === 'fulfilled' && membershipInfo.value) {
                try {
                    const memberships = Array.isArray(membershipInfo.value) ? membershipInfo.value : [];

                    console.log('🔍 Debug memberships:', {
                        total: memberships.length,
                        data: memberships.map(m => ({
                            id: m._id,
                            trangThaiThanhToan: m.trangThaiThanhToan,
                            trangThaiDangKy: m.trangThaiDangKy,
                            trangThaiSuDung: m.trangThaiSuDung,
                            ngayBatDau: m.ngayBatDau,
                            ngayKetThuc: m.ngayKetThuc,
                            maGoiTap: m.maGoiTap?.tenGoiTap,
                            goiTapId: m.goiTapId?.tenGoiTap
                        }))
                    });

                    // Tìm gói tập đang hoạt động - điều kiện linh hoạt hơn
                    const activeMembership = memberships.find(m => {
                        // Kiểm tra thanh toán
                        const isPaid = m.trangThaiThanhToan === 'DA_THANH_TOAN';

                        // Kiểm tra không bị hủy
                        const notCancelled = (!m.trangThaiDangKy || m.trangThaiDangKy !== 'DA_HUY') &&
                            (!m.trangThaiSuDung || !['DA_HUY', 'HET_HAN'].includes(m.trangThaiSuDung));

                        // Kiểm tra ngày kết thúc (nếu có)
                        const hasValidEndDate = !m.ngayKetThuc || new Date(m.ngayKetThuc) > new Date();

                        console.log('🔍 Check membership:', {
                            isPaid,
                            notCancelled,
                            hasValidEndDate,
                            result: isPaid && notCancelled && hasValidEndDate
                        });

                        return isPaid && notCancelled && hasValidEndDate;
                    });

                    if (activeMembership) {
                        const startDate = activeMembership.ngayBatDau ? new Date(activeMembership.ngayBatDau) : new Date();
                        const endDate = activeMembership.ngayKetThuc ? new Date(activeMembership.ngayKetThuc) : null;
                        const today = new Date();

                        console.log('📅 Date calculation:', {
                            ngayBatDau_raw: activeMembership.ngayBatDau,
                            ngayKetThuc_raw: activeMembership.ngayKetThuc,
                            startDate: startDate.toISOString(),
                            endDate: endDate ? endDate.toISOString() : null,
                            today: today.toISOString(),
                            diff_ms: endDate ? (endDate - today) : null
                        });

                        // Tính số ngày còn lại
                        let daysLeft = 0;
                        if (endDate) {
                            daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                        } else {
                            // Nếu không có ngày kết thúc, coi như còn nhiều ngày
                            daysLeft = 999;
                        }

                        // Lấy tên gói tập từ maGoiTap hoặc goiTapId
                        const packageName = activeMembership.maGoiTap?.tenGoiTap ||
                            activeMembership.goiTapId?.tenGoiTap ||
                            'Gói tập';

                        console.log('✅ Gói tập tìm thấy:', {
                            tenGoiTap: packageName,
                            ngayBatDau: startDate.toLocaleDateString('vi-VN'),
                            ngayKetThuc: endDate ? endDate.toLocaleDateString('vi-VN') : 'Không giới hạn',
                            soNgayConLai: daysLeft
                        });

                        setMemberData(prev => ({
                            ...prev,
                            membershipDaysLeft: Math.max(0, daysLeft),
                            packageName: packageName
                        }));
                        setHasPackage(true);
                    } else {
                        // Không có gói tập hoạt động
                        console.log('❌ Không tìm thấy gói tập hoạt động');
                        setMemberData(prev => ({
                            ...prev,
                            membershipDaysLeft: 0,
                            packageName: ''
                        }));
                        setHasPackage(false);
                    }
                } catch (error) {
                    console.error('Error processing membership data:', error);
                    setHasPackage(false);
                }
            } else {
                // Không có dữ liệu membership
                setHasPackage(false);
            }

            // Fetch upcoming classes (workout schedules)
            try {
                fetchUpcomingClasses();
            } catch (e) {
                console.warn('Failed to fetch upcoming classes:', e.message || e);
            }

            if (bodyStats.status === 'fulfilled' && bodyStats.value) {
                try {
                    const stats = bodyStats.value;
                    setMemberData(prev => ({
                        ...prev,
                        currentWeight: stats.canNang || 0,
                        currentHeight: stats.chieuCao || 0,
                        bmi: stats.bmi || 0
                    }));
                } catch (error) {
                    console.error('Error processing body stats data:', error);
                }
            }

            if (nutritionInfo.status === 'fulfilled' && nutritionInfo.value) {
                try {
                    const nutrition = nutritionInfo.value;
                    if (Array.isArray(nutrition)) {
                        const latestNutrition = nutrition[0] || {};
                        setMemberData(prev => ({
                            ...prev,
                            todayCalories: latestNutrition.caloriesConsumed || 0
                        }));
                    } else if (nutrition && typeof nutrition === 'object') {
                        setMemberData(prev => ({
                            ...prev,
                            todayCalories: nutrition.caloriesConsumed || 0
                        }));
                    }
                } catch (error) {
                    console.error('Error processing nutrition data:', error);
                }
            }

            // await fetchMembershipTimeRemaining(); // Đã tính số ngày từ ngayKetThuc ở trên, không cần gọi API này nữa

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPTData = async () => {
        try {
            console.log('🔄 HomeScreen - Fetching PT data...');
            const res = await apiService.getAllPT();
            
            console.log('📦 HomeScreen - Received from getAllPT():');
            console.log('  - Type:', typeof res);
            console.log('  - Is Array:', Array.isArray(res));
            console.log('  - Length:', res?.length);
            if (Array.isArray(res) && res.length > 0) {
                console.log('  - First 2 items:', res.slice(0, 2));
            }
            
            if (Array.isArray(res) && res.length > 0) {
                console.log(`✅ Valid array with ${res.length} PTs - Setting state`);
                setPTData(res);
            } else {
                console.log('⚠️ Invalid data or empty array - Setting to []');
                setPTData([]);
            }
        } catch (error) {
            console.error('❌ HomeScreen - Error fetching PT data:', error);
            setPTData([]);
        }
    };

    const calculateStreak = (completedWorkouts) => {
        if (!completedWorkouts.length) return 0;

        const sortedWorkouts = completedWorkouts
            .sort((a, b) => new Date(b.ngayTap) - new Date(a.ngayTap));

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const workout of sortedWorkouts) {
            const workoutDate = new Date(workout.ngayTap);
            workoutDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Refresh với mealType theo giờ hiện tại
        const currentMeal = getCurrentMealType();
        await Promise.all([
            fetchDashboardData(),
            fetchHealthyMeals(currentMeal),
            fetchExercises()
        ]);
        setRefreshing(false);
    };

    const banners = [
        {
            image: 'https://www.wheystore.vn/upload_images/images/2024/10/08/pt-gym-dam-nhan-vai-tro-gi.jpg',
            title: 'Huấn luyện viên cá nhân\nĐồng hành cùng bạn',
            buttonText: 'Đặt lịch tập ngay',
            onPress: () => navigation.navigate('Classes'),
        },
        {
            image: 'https://www.wheystore.vn/upload_images/images/2024/10/08/pt-gym-dam-nhan-vai-tro-gi.jpg',
            title: 'Tăng hiệu quả tập luyện\nVới chương trình riêng',
            buttonText: 'Xem chương trình',
            onPress: () => navigation.navigate('WorkoutPlans'),
        },
        {
            image: 'https://www.wheystore.vn/upload_images/images/2024/10/08/pt-gym-dam-nhan-vai-tro-gi.jpg',
            title: 'Chuyên gia dinh dưỡng\nTư vấn miễn phí',
            buttonText: 'Đặt lịch tư vấn',
            onPress: () => navigation.navigate('Nutrition'),
        },
    ];

    const renderCoachingBanner = () => {
        const [activeIndex, setActiveIndex] = useState(0);
        const flatListRef = useRef(null);
        const autoScrollInterval = useRef(null);

        const onViewRef = useRef(({ viewableItems }) => {
            if (viewableItems.length > 0) {
                setActiveIndex(viewableItems[0].index % banners.length);
            }
        });
        const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

        // Auto scroll effect
        useEffect(() => {
            autoScrollInterval.current = setInterval(() => {
                if (flatListRef.current) {
                    const nextIndex = (activeIndex + 1) % banners.length;
                    flatListRef.current.scrollToIndex({
                        index: nextIndex,
                        animated: true
                    });
                    setActiveIndex(nextIndex);
                }
            }, 3000); // Chuyển slide mỗi 3 giây

            return () => {
                if (autoScrollInterval.current) {
                    clearInterval(autoScrollInterval.current);
                }
            };
        }, [activeIndex]);

        return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <FlatList
                    ref={flatListRef}
                    data={banners}
                    keyExtractor={(_, idx) => idx.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewRef.current}
                    viewabilityConfig={viewConfigRef.current}
                    onScrollBeginDrag={() => {
                        // Dừng auto scroll khi user vuốt
                        if (autoScrollInterval.current) {
                            clearInterval(autoScrollInterval.current);
                        }
                    }}
                    onScrollEndDrag={() => {
                        // Khởi động lại auto scroll sau khi user thả tay
                        autoScrollInterval.current = setInterval(() => {
                            if (flatListRef.current) {
                                const nextIndex = (activeIndex + 1) % banners.length;
                                flatListRef.current.scrollToIndex({
                                    index: nextIndex,
                                    animated: true
                                });
                                setActiveIndex(nextIndex);
                            }
                        }, 3000);
                    }}
                    contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.bannerContainer,
                                {
                                    width: width - 30,
                                    alignSelf: 'center',
                                    marginLeft: 15,
                                    marginRight: 15,
                                }
                            ]}
                        >
                            <ImageBackground
                                source={{ uri: item.image }}
                                style={styles.bannerImageBackground}
                                imageStyle={styles.bannerImage}
                            >
                                <View style={[styles.bannerOverlay, { justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 30 }]}>
                                    <View style={{ alignItems: 'flex-start', width: '100%' }}>
                                        <Text style={[styles.bannerTitle, { textAlign: 'left', alignSelf: 'flex-start' }]}>
                                            {item.title}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.bannerButton,
                                            {
                                                position: 'absolute',
                                                right: 20,
                                                bottom: 20,
                                            }
                                        ]}
                                        onPress={item.onPress}
                                    >
                                        <Text style={styles.bannerButtonText}>{item.buttonText}</Text>
                                    </TouchableOpacity>
                                </View>
                            </ImageBackground>
                        </View>
                    )}
                />

                {/* Dots indicator */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                    {banners.map((_, idx) => (
                        <View
                            key={idx}
                            style={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                marginHorizontal: 3,
                                backgroundColor: activeIndex === idx ? '#DA2128' : '#C4C4C4',
                            }}
                        />
                    ))}
                </View>
            </View>
        );
    };

    const renderMembershipStatus = () => {
        const daysLeft = memberData.membershipDaysLeft;
        const totalDays = 30;
        const progress = Math.min(daysLeft / totalDays, 1);

        // Nếu đang loading, hiển thị loading state
        if (loading) {
            return (
                <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 0 }]}>
                            Trạng thái hội viên
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                            Đang tải...
                        </Text>
                    </View>
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ color: colors.textSecondary }}>Đang kiểm tra gói tập...</Text>
                    </View>
                </View>
            );
        }

        // Sau khi load xong, hiển thị theo trạng thái thực tế
        return (
            <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasPackage ? 20 : 10 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 0 }]}>
                        {hasPackage ? memberData.packageName : 'Trạng thái hội viên'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                        {hasPackage ? `${daysLeft} Ngày còn lại` : 'Chưa đăng ký'}
                    </Text>
                </View>
                {hasPackage && (
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: '#878787', marginBottom: 25, overflow: 'hidden' }}>
                        <View style={{
                            height: '100%',
                            width: `${progress * 100}%`,
                            backgroundColor: colors.primary,
                            borderRadius: 4
                        }} />
                    </View>
                )}
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                        paddingVertical: 14,
                        alignItems: 'center',
                        marginTop: hasPackage ? 4 : 15
                    }}
                    onPress={() => navigation.navigate('Membership')}
                >
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                        {hasPackage ? 'Làm mới ngay' : 'Đăng ký mới'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const fetchUpcomingClasses = async () => {
        try {
            setLoadingUpcoming(true);

            // userInfo có _id từ MongoDB, không phải id
            const userId = userInfo?._id || userInfo?.id;
            if (!userId) {
                console.log('❌ No user ID found');
                setUpcomingClasses([]);
                return;
            }

            const schedules = await apiService.getMemberSchedule(userId);
            const items = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayStr = today.toLocaleDateString('vi-VN');

            console.log('📅 [fetchUpcomingClasses] Filtering schedules for today:', todayStr);
            console.log('📅 [fetchUpcomingClasses] Total schedules received:', schedules?.length || 0);

            (schedules || []).forEach(lichTap => {
                // ...existing code...
                const buoiTaps = Array.isArray(lichTap.danhSachBuoiTap) ? lichTap.danhSachBuoiTap : [];

                buoiTaps.forEach(buoiItem => {
                    const ngayTap = buoiItem.ngayTap;
                    const buoiTapInfo = buoiItem.buoiTap || {};
                    const gioBatDau = buoiItem.gioBatDau;

                    if (ngayTap && gioBatDau) {
                        try {
                            const buoiDate = new Date(ngayTap);
                            buoiDate.setHours(0, 0, 0, 0);

                            // Chỉ lấy lịch tập hôm nay
                            if (buoiDate.getTime() === today.getTime()) {
                                // Parse giờ bắt đầu tập
                                const [hourStr, minuteStr] = gioBatDau.split(':');
                                const startHour = parseInt(hourStr, 10);
                                const startMinute = parseInt(minuteStr, 10) || 0;

                                const now = new Date();
                                // So sánh giờ bắt đầu tập với giờ hiện tại
                                if (
                                    startHour > now.getHours() ||
                                    (startHour === now.getHours() && startMinute >= now.getMinutes())
                                ) {
                                    const id = buoiItem._id || `${lichTap._id}_${Math.random().toString(36).slice(2, 8)}`;
                                    const tenBuoiTap = buoiTapInfo.tenBuoiTap || buoiItem.tenBuoiTap || 'Buổi tập';
                                    const imageUrl = buoiTapInfo.hinhAnhMinhHoa?.[0] || buoiTapInfo.hinhAnh || null;
                                    const timeText = gioBatDau || '';
                                    const ptName = buoiItem.ptPhuTrach?.hoTen || 'Chưa có PT';

                                    items.push({
                                        id,
                                        image: imageUrl ? { uri: imageUrl } : require('../../assets/images/onboarding-img1.avif'),
                                        name: tenBuoiTap,
                                        date: 'Hôm nay',
                                        time: timeText || '--:--',
                                        seatsLeft: buoiTapInfo.soLuongToiDa || 0,
                                        timestamp: buoiDate.getTime(),
                                        originalDate: ngayTap,
                                        ptName: ptName,
                                        chiNhanh: lichTap.chiNhanh?.tenChiNhanh || 'Chưa rõ'
                                    });
                                }
                            }
                        } catch (e) {
                            console.error('❌ Error parsing date:', e);
                        }
                    }
                });
            });

            // Sắp xếp theo thời gian nếu có
            items.sort((a, b) => {
                const timeA = a.time || '00:00';
                const timeB = b.time || '00:00';
                return timeA.localeCompare(timeB);
            });

            console.log('📅 [fetchUpcomingClasses] Today\'s schedules found:', {
                total: items.length,
                items: items.map(i => ({ name: i.name, time: i.time, date: i.originalDate }))
            });

            setUpcomingClasses(items);
        } catch (error) {
            console.error('❌ Error fetching upcoming classes:', error);
            setUpcomingClasses([]);
        } finally {
            setLoadingUpcoming(false);
        }
    };

    const renderUpcomingClasses = () => (
        <View style={[styles.upcomingClassesContainer, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1, marginBottom: 0 }]}>Lịch tập hôm nay</Text>
                <TouchableOpacity onPress={() => navigation.navigate('WorkoutPlans')}>
                    <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {loadingUpcoming ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
                </View>
            ) : upcomingClasses.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20, minHeight: 60 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>
                        Lịch tập hôm nay sẽ xuất hiện tại đây
                    </Text>
                </View>
            ) : (
                upcomingClasses.map(cls => (
                    <View key={cls.id} style={[styles.classCard, { backgroundColor: colors.card, padding: 18, position: 'relative', marginBottom: 12 }]}>
                        <Image source={cls.image} style={[styles.classImage, { width: 120, height: 120 }]} />
                        <View style={styles.classInfo}>
                            <Text style={[styles.className, { color: colors.text, fontSize: 21 }]}>{cls.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
                                <Text style={[styles.classMeta, { color: colors.textSecondary, marginLeft: 6, fontSize: 16 }]}>{cls.date}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                                <Text style={[styles.classMeta, { color: colors.textSecondary, marginLeft: 6, fontSize: 16 }]}>{cls.time}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <MaterialIcons name="event-seat" size={16} color={colors.textSecondary} />
                                <Text style={[styles.classMeta, { color: colors.textSecondary, marginLeft: 6, fontSize: 16 }]}>{cls.seatsLeft} chỗ còn lại</Text>
                            </View>
                        </View>
                        {/* Arrow right icon for each item */}
                        <TouchableOpacity style={{
                            position: 'absolute',
                            right: 12,
                            top: 12,
                            backgroundColor: 'transparent',
                            padding: 6,
                            zIndex: 2,
                        }}>
                            <Ionicons name="chevron-forward-outline" size={22} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{
                            position: 'absolute',
                            right: 12,
                            bottom: 12,
                            ...styles.classBookmark,
                            padding: 6
                        }}>
                            <MaterialIcons name="bookmark-outline" size={22} color={'#ffffff'} />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    );

    const fetchHealthyMeals = async (mealType = null) => {
        try {
            setLoadingMeals(true);
            const response = await apiService.getHealthyMeals(10, mealType);

            console.log('📊 API Response:', {
                success: response.success,
                dataLength: response.data?.length,
                total: response.total,
                mealTypeRequested: mealType
            });

            if (response.success && response.data) {
                // Map dữ liệu từ Meal model sang format cũ để UI không bị lỗi
                const mappedMeals = response.data.map(meal => ({
                    id: meal._id,
                    tenMonAn: meal.name,
                    moTa: meal.description,
                    hinhAnh: meal.image,
                    loaiMonAn: meal.mealType,
                    thongTinDinhDuong: {
                        calories: meal.nutrition?.caloriesKcal || 0,
                        protein: meal.nutrition?.proteinGrams || 0,
                        carbohydrate: meal.nutrition?.carbsGrams || 0,
                        fat: meal.nutrition?.fatGrams || 0,
                        fiber: meal.nutrition?.fiberGrams || 0
                    },
                    danhGia: meal.rating,
                    mucDoKho: meal.difficulty,
                    thoiGianNau: meal.cookingTimeMinutes,
                    buaAn: mealType
                }));

                console.log('🍽️ Số món ăn nhận được:', mappedMeals.length);
                console.log('📋 Danh sách món:', mappedMeals.map(m => m.tenMonAn));
                setHealthyMeals(mappedMeals);
                setCurrentMealType(mealType || '');
            }
        } catch (error) {
            console.error('Error fetching healthy meals:', error);
        } finally {
            setLoadingMeals(false);
        }
    };

    const fetchExercises = async () => {
        try {
            setLoadingExercises(true);
            const response = await apiService.getAllBaiTap();

            console.log('💪 Exercises Response:', {
                total: response?.length,
                first3: response?.slice(0, 3).map(ex => ex.tenBaiTap)
            });

            if (response && Array.isArray(response)) {
                // Lấy 3 bài tập đầu tiên
                setExercises(response.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching exercises:', error);
        } finally {
            setLoadingExercises(false);
        }
    };

    const renderHealthyMeals = () => {
        // Lấy tên buổi ăn từ món ăn đầu tiên nếu có
        const displayMealType = healthyMeals.length > 0 && healthyMeals[0].loaiMonAn
            ? getMealTypeName(healthyMeals[0].loaiMonAn)
            : 'Bữa ăn';

        return (
            <View style={[styles.healthyMealsContainer, { backgroundColor: colors.surface }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, marginBottom: 0 }]}>
                            {displayMealType}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                            Gợi ý cho bạn
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={{ paddingTop: 2 }}
                        onPress={() => navigation.navigate('Nutrition')}
                    >
                        <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>

                {loadingMeals ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
                    </View>
                ) : healthyMeals.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <MaterialIcons name="restaurant" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Chưa có bữa ăn nào</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>Vui lòng thử lại sau</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {healthyMeals.map(meal => (
                            <TouchableOpacity
                                key={meal.id}
                                style={[styles.mealCard, { backgroundColor: colors.card, position: 'relative', height: 250 }]}
                                onPress={() => {
                                    console.log('Meal clicked:', meal);
                                }}
                            >
                                <Image
                                    source={{ uri: meal.hinhAnh || 'https://via.placeholder.com/170x120' }}
                                    style={[styles.mealImage, { height: 120 }]}
                                />
                                <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={2}>
                                    {meal.tenMonAn}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <MaterialIcons name="local-fire-department" size={16} color="#ff6b6b" />
                                    <Text style={[styles.mealCalories, { color: colors.textSecondary, marginLeft: 4 }]}>
                                        {meal.thongTinDinhDuong?.calories || 0} kcal
                                    </Text>
                                </View>
                                {meal.danhGia && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <MaterialIcons name="star" size={14} color="#ffc107" />
                                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>
                                            {meal.danhGia.toFixed(1)}
                                        </Text>
                                    </View>
                                )}
                                <TouchableOpacity style={{
                                    position: 'absolute',
                                    right: 12,
                                    bottom: 12,
                                    borderRadius: 20,
                                    backgroundColor: '#da2128',
                                    padding: 6,
                                }}>
                                    <MaterialIcons name="bookmark-outline" size={22} color={'#ffffff'} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    };

    const renderExercises = () => (
        <View style={[styles.exercisesContainer, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, marginBottom: 0 }]}>
                        Bài tập phổ biến
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                        Khám phá các bài tập hiệu quả
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Workout')} style={{ paddingTop: 2 }}>
                    <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {loadingExercises ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
                </View>
            ) : exercises.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.textSecondary }}>Chưa có bài tập nào</Text>
                </View>
            ) : (
                <View style={{ gap: 28 }}>
                    {exercises.map((exercise, index) => (
                        <TouchableOpacity
                            key={exercise._id || index}
                            style={[
                                styles.exerciseCard,
                                {
                                    backgroundColor: colors.card,
                                    borderWidth: isLightMode ? 1 : 0,
                                    borderColor: isLightMode ? '#E5EFF9' : 'transparent'
                                }
                            ]}
                            onPress={() => {
                                console.log('Exercise clicked:', exercise.tenBaiTap);
                            }}
                        >
                            {/* Image Container with Overlay Badge */}
                            <View style={styles.exerciseImageContainer}>
                                <Image
                                    source={{ uri: exercise.hinhAnh || 'https://via.placeholder.com/319x200' }}
                                    style={styles.exerciseImage}
                                />
                            </View>

                            {/* Exercise Info Container */}
                            <View style={styles.exerciseInfo}>
                                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
                                    {exercise.tenBaiTap}
                                </Text>

                                {/* Meta Information Row */}
                                <View style={styles.exerciseMeta}>
                                    {/* Level */}
                                    {exercise.mucDoKho && (
                                        <>
                                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                                {exercise.mucDoKho}
                                            </Text>
                                            <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                                        </>
                                    )}

                                    {/* Time */}
                                    {exercise.thoiGian && (
                                        <>
                                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                                {exercise.thoiGian}
                                            </Text>
                                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                                {' phút'}
                                            </Text>
                                            <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                                        </>
                                    )}

                                    {/* Calories */}
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {exercise.kcal || 0}
                                    </Text>
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {' kcal'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    const renderCoaches = () => {
        const getCoachInitial = (name) => {
            if (!name) return 'PT';
            return name.charAt(0).toUpperCase();
        };

        const displayData = PTData && Array.isArray(PTData) ? PTData.slice(0, 5) : [];

        return (
            <View style={styles.coachesContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1, marginBottom: 0 }]}>
                        Huấn luyện viên
                    </Text>
                    <TouchableOpacity>
                        <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Debug: Show simple list first */}
                {displayData.length > 0 ? (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={displayData}
                        keyExtractor={(item, index) => item?._id || item?.id || `pt-${index}`}
                        renderItem={({ item: coach }) => (
                        <View style={[styles.coachCard, { backgroundColor: 'transparent', height: 190, padding: 0, marginRight: 20 }]}>
                            {coach.anhDaiDien ? (
                                <ImageBackground
                                    source={{ uri: coach.anhDaiDien }}
                                    style={[styles.coachImage, { height: 190, width: 170, borderRadius: 14, overflow: 'hidden', marginBottom: 0 }]}
                                    imageStyle={{ borderRadius: 14 }}
                                >
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        borderRadius: 14,
                                    }} />
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        paddingVertical: 8,
                                        paddingHorizontal: 6,
                                    }}>
                                        <Text style={[styles.coachName, { color: '#fff', textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }]} numberOfLines={1}>{coach.hoTen}</Text>
                                        <Text style={[styles.coachSpecialty, { color: '#fff', fontSize: 16, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]} numberOfLines={1}>{coach.chuyenMon}</Text>
                                    </View>
                                </ImageBackground>
                            ) : (
                                <View style={{
                                    height: 190,
                                    width: 170,
                                    borderRadius: 14,
                                    backgroundColor: '#DA2128',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                }}>
                                    <Text style={{
                                        fontSize: 60,
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        marginBottom: 10,
                                    }}>
                                        {getCoachInitial(coach.hoTen)}
                                    </Text>
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        paddingVertical: 8,
                                        paddingHorizontal: 6,
                                    }}>
                                        <Text style={[styles.coachName, { color: '#fff' }]} numberOfLines={1}>{coach.hoTen}</Text>
                                        <Text style={[styles.coachSpecialty, { color: '#fff', fontSize: 16 }]} numberOfLines={1}>{coach.chuyenMon}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                    />
                ) : (
                    <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.card, borderRadius: 12 }}>
                        <Text style={{ color: colors.text, opacity: 0.6 }}>
                            {PTData.length === 0 ? 'Đang tải huấn luyện viên...' : 'Không có huấn luyện viên'}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // Không cần hàm này nữa, số ngày còn lại đã được tính từ ngayKetThuc - ngayHienTai
    // const fetchMembershipTimeRemaining = async () => {
    //     try {
    //         const userId = userInfo?._id || userInfo?.id || userInfo?.userId;
    //         if (!userId) {
    //             console.error('Không tìm thấy userId, không thể lấy thời gian còn lại.');
    //             return;
    //         }
    //         const response = await apiService.apiCall(`/hanghoivien/thoi-gian-con-lai/${userId}`, 'GET');
    //         const timeRemaining = (response && response.data && response.data.data && typeof response.data.data.timeRemaining === 'number')
    //             ? response.data.data.timeRemaining
    //             : (response && response.data && typeof response.data.timeRemaining === 'number'
    //                 ? response.data.timeRemaining
    //                 : (response && typeof response.timeRemaining === 'number' ? response.timeRemaining : 0));

    //         const now = new Date();
    //         const year = now.getFullYear();
    //         const month = now.getMonth() + 1;
    //         const daysInMonth = new Date(year, month, 0).getDate();

    //         setMemberData(prev => ({
    //             ...prev,
    //             membershipDaysLeft: Math.max(0, Number(timeRemaining) || 0),
    //             membershipTotalDays: daysInMonth
    //         }));
    //     } catch (error) {
    //         console.error('Lỗi khi lấy thời gian còn lại của hạng hội viên:', error);
    //     }
    // };

    return (
        <>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
                    <View style={styles.headerLeft}>
                        <Avatar userProfile={userInfo} size={50} />
                        <View>
                            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Xin chào, 👋</Text>
                            <Text style={[styles.userNameText, { color: colors.text }]}>
                                {userInfo?.hoTen || userInfo?.sdt || 'Thành viên'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
                        <MaterialIcons name="notifications" size={30} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {renderCoachingBanner()}

                    {renderMembershipStatus()}

                    {renderExercises()}

                    {/* Chỉ hiển thị Lịch tập hôm nay nếu đã có gói tập */}
                    {hasPackage && renderUpcomingClasses()}

                    {renderHealthyMeals()}

                    {renderCoaches()}
                </ScrollView>
            </SafeAreaView>
            <Chatbot />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: '400',
    },
    userNameText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 2,
    },
    notificationButton: {
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '500',
        marginBottom: 15,
    },
    progressContainer: {
        padding: 20,
        margin: 15,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    nextClassTime: {
        fontSize: 14,
        marginBottom: 2,
    },
    nextClassButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    bannerContainer: {
        margin: 15,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    bannerImageBackground: {
        height: 200,
        justifyContent: 'center',
    },
    bannerImage: {
        borderRadius: 16,
    },
    bannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: 'regular',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
        lineHeight: 35,
    },
    bannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DA2128',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        shadowColor: '#DA2128',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    bannerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
        letterSpacing: 0.5,
    },
    membershipDays: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#DA2128',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#da2128',
    },
    coachesContainer: {
        margin: 15,
        marginTop: 0,
        borderRadius: 16,
        paddingTop: 20,
        paddingBottom: 60,
    },
    coachCard: {
        width: 170,
        borderRadius: 14,
        alignItems: 'center',
        marginRight: 16,
    },
    coachImage: {
        width: 120,
        borderRadius: 12,
        marginBottom: 12,
        resizeMode: 'contain',
    },
    coachName: {
        fontSize: 20,
        fontWeight: 'w600',
        marginBottom: 4,
        textAlign: 'center',
    },
    coachSpecialty: {
        fontSize: 18,
        fontWeight: 'w600',
        color: '#888',
        textAlign: 'center',
    },
    healthyMealsContainer: {
        padding: 20,
        margin: 15,
        marginTop: 0,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    mealCard: {
        width: 170,
        marginRight: 16,
        borderRadius: 14,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    mealImage: {
        width: '100%',
        height: 90,
        borderRadius: 10,
        marginBottom: 10,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    mealCalories: {
        fontSize: 14,
        flex: 1,
    },
    mealBookmark: {
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
        padding: 4,
        marginLeft: 8,
    },
    exercisesContainer: {
        padding: 20,
        margin: 15,
        marginTop: 0,
        marginBottom: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    exerciseCard: {
        width: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    exerciseImageContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    exerciseImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    workoutBadge: {
        position: 'absolute',
        left: 20,
        bottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 7.5,
        paddingVertical: 5,
        borderRadius: 4,
    },
    workoutBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Manrope',
        letterSpacing: 0.5,
    },
    exerciseInfo: {
        width: '100%',
        paddingTop: 16,
        paddingLeft: 20,
        paddingBottom: 16,
        paddingRight: 20,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Manrope',
        marginBottom: 6,
    },
    exerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metaText: {
        fontSize: 14,
        fontWeight: '400',
        fontFamily: 'Manrope',
    },
    metaDot: {
        fontSize: 14,
        fontWeight: '400',
        fontFamily: 'Manrope',
        marginHorizontal: 4,
    },
    workoutsContainer: {
        padding: 20,
        margin: 15,
        marginTop: 0,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    workoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    upcomingClassesContainer: {
        padding: 20,
        margin: 15,
        marginTop: 0,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    classCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 10,
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    classImage: {
        width: 80,
        height: 60,
        borderRadius: 10,
        marginRight: 14,
    },
    classInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    className: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    classMeta: {
        fontSize: 14,
    },
    classBookmark: {
        borderRadius: 20,
        backgroundColor: '#da2128',
        marginLeft: 8,
    },
});

export default HomeScreen;