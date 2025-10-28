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
        nextClass: "Chưa có lịch",
        nextClassTime: "--:--",
        todayCalories: 0,
        weeklyGoal: 2000
    });
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
        const mealNames = {
            'SANG': 'Bữa sáng gợi ý',
            'TRUA': 'Bữa trưa gợi ý',
            'CHIEU': 'Bữa chiều gợi ý',
            'TOI': 'Bữa tối gợi ý'
        };
        return mealNames[type] || 'Bữa ăn';
    };

    useEffect(() => {
        fetchDashboardData();
        fetchPTData();
        fetchHealthyMeals();
        fetchExercises();
    }, []);

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
                    const activeMembership = memberships.find(m =>
                        m.trangThai === 'DangHoatDong' && new Date(m.ngayKetThuc) > new Date()
                    );

                    if (activeMembership) {
                        const endDate = new Date(activeMembership.ngayKetThuc);
                        const today = new Date();
                        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                        setMemberData(prev => ({
                            ...prev,
                            membershipDaysLeft: Math.max(0, daysLeft)
                        }));
                    }
                } catch (error) {
                    console.error('Error processing membership data:', error);
                }
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

            await fetchMembershipTimeRemaining();

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPTData = async () => {
        try {
            const res = await apiService.getAllPT();
            setPTData(res || []);
        } catch (error) {
            console.error('Error fetching PT data:', error);
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
        await Promise.all([
            fetchDashboardData(),
            fetchHealthyMeals(),
            fetchExercises()
        ]);
        setRefreshing(false);
    };

    const banners = [
        {
            image: 'https://www.wheystore.vn/upload_images/images/2024/10/08/pt-gym-dam-nhan-vai-tro-gi.jpg',
            title: 'Huấn luyện viên cá nhân\nĐồng hành cùng bạn',
            buttonText: 'Đặt lịch PT',
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

        const onViewRef = useRef(({ viewableItems }) => {
            if (viewableItems.length > 0) {
                setActiveIndex(viewableItems[0].index);
            }
        });
        const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

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

        return (
            <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18, marginBottom: 0 }]}>Trạng thái hội viên</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{daysLeft} Ngày còn lại</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: '#878787', marginBottom: 25, overflow: 'hidden' }}>
                    <View style={{
                        height: '100%',
                        width: `${progress * 100}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 4
                    }} />
                </View>
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                        paddingVertical: 14,
                        alignItems: 'center',
                        marginTop: 4
                    }}
                    onPress={() => navigation.navigate('Membership')}
                >
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Làm mới ngay</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const fetchUpcomingClasses = async () => {
        try {
            setLoadingUpcoming(true);
            const schedules = await apiService.getAllWorkoutSchedules();
            const items = [];
            (schedules || []).forEach(lich => {
                const buoiTaps = Array.isArray(lich.cacBuoiTap) ? lich.cacBuoiTap : [];
                buoiTaps.forEach(bt => {
                    const id = bt._id || bt.id || `${lich._id}_${Math.random().toString(36).slice(2, 8)}`;
                    const imageUrl = bt.hinhAnh || bt.hinhAnhMinhHoa?.[0] || bt.anhDaiDien || null;
                    const name = bt.tenBuoiTap || bt.tenBuoiTap || (bt.tenBaiTap ? bt.tenBaiTap : (lich.hoTen || 'Buổi tập'));
                    let dateText = 'Sắp tới';
                    let timeText = bt.gioBatDau || bt.gio || '';
                    if (bt.ngay) {
                        try { dateText = new Date(bt.ngay).toLocaleDateString('vi-VN'); } catch (e) { }
                    }

                    items.push({
                        id,
                        image: imageUrl ? { uri: imageUrl } : require('../../assets/images/onboarding-img1.avif'),
                        name: bt.tenBuoiTap || (bt.tenBaiTap ? bt.tenBaiTap : (lich.hoiVien?.hoTen || 'Buổi tập')),
                        date: dateText,
                        time: timeText || '--:--',
                        seatsLeft: bt.soCho || bt.soLuong || 0,
                    });
                });
            });

            if (items.length === 0) {
                (schedules || []).forEach(lich => {
                    const id = lich._id || Math.random().toString(36).slice(2, 8);
                    const nextDate = lich.ngayBatDau ? new Date(lich.ngayBatDau).toLocaleDateString('vi-VN') : 'Sắp tới';
                    items.push({
                        id,
                        image: require('../../assets/images/onboarding-img1.avif'),
                        name: lich.hoiVien?.hoTen || 'Lịch tập',
                        date: nextDate,
                        time: '--:--',
                        seatsLeft: 0,
                    });
                });
            }

            setUpcomingClasses(items);
        } catch (error) {
            console.error('Error fetching upcoming classes:', error);
            setUpcomingClasses([]);
        } finally {
            setLoadingUpcoming(false);
        }
    };

    const renderUpcomingClasses = () => (
        <View style={[styles.upcomingClassesContainer, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1, marginBottom: 0 }]}>Lịch tập sắp tới</Text>
                <TouchableOpacity>
                    <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {upcomingClasses.map(cls => (
                <View key={cls.id} style={[styles.classCard, { backgroundColor: colors.card, padding: 18, position: 'relative' }]}>
                    <Image source={cls.image} style={[styles.classImage, { width: 120, height: 120 }]} />
                    <View style={styles.classInfo}>
                        <Text style={[styles.className, { color: colors.text, fontSize: 21 }]}>{cls.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
                            <Text style={[styles.classMeta, { color: colors.textSecondary, marginLeft: 6, fontSize: 16 }]}>{cls.date === 'Tomorrow' ? 'Ngày mai' : cls.date}</Text>
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
            ))}
        </View>
    );

    const fetchHealthyMeals = async () => {
        try {
            setLoadingMeals(true);
            const response = await apiService.getHealthyMeals(10);

            console.log('📊 API Response:', {
                success: response.success,
                dataLength: response.data?.length,
                total: response.total,
                buaAn: response.buaAn,
                currentTime: response.currentTime
            });

            if (response.success && response.data) {
                console.log('🍽️ Số món ăn nhận được:', response.data.length);
                console.log('📋 Danh sách món:', response.data.map(m => m.tenMonAn));
                console.log('⏰ Bữa ăn hiện tại:', response.buaAn);
                setHealthyMeals(response.data);
                setCurrentMealType(response.buaAn || '');
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

    const renderHealthyMeals = () => (
        <View style={[styles.healthyMealsContainer, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, marginBottom: 0 }]}>
                        {currentMealType ? getMealTypeName(currentMealType) : 'Bữa ăn lành mạnh'}
                    </Text>
                    {currentMealType && (
                        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                            Gợi ý cho bạn
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={{ paddingTop: 2 }}>
                    <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {loadingMeals ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.textSecondary }}>Đang tải...</Text>
                </View>
            ) : healthyMeals.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: colors.textSecondary }}>Chưa có bữa ăn nào</Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {healthyMeals.map(meal => (
                        <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.card, position: 'relative', height: 250 }]}>
                            <Image
                                source={{ uri: meal.hinhAnh || 'https://via.placeholder.com/170x120' }}
                                style={[styles.mealImage, { height: 120 }]}
                            />
                            <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={2}>
                                {meal.tenMonAn}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
                                    {meal.thongTinDinhDuong?.calories || 0} kcal
                                </Text>
                            </View>
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
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );

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

        return (
            <View style={styles.coachesContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1, marginBottom: 0 }]}>Huấn luyện viên</Text>
                    <TouchableOpacity>
                        <Text style={{ color: colors.primary, fontSize: 15, textAlign: 'right' }}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={PTData.slice(0, 5)}
                    renderItem={({ item: coach }) => (
                        <View key={coach._id} style={[styles.coachCard, { backgroundColor: 'transparent', height: 190, padding: 0, marginRight: 20 }]}>
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
            </View>
        );
    };

    const fetchMembershipTimeRemaining = async () => {
        try {
            const userId = userInfo?._id || userInfo?.id || userInfo?.userId;
            if (!userId) {
                console.error('Không tìm thấy userId, không thể lấy thời gian còn lại.');
                return;
            }
            const response = await apiService.apiCall(`/hanghoivien/thoi-gian-con-lai/${userId}`, 'GET');
            const timeRemaining = (response && response.data && response.data.data && typeof response.data.data.timeRemaining === 'number')
                ? response.data.data.timeRemaining
                : (response && response.data && typeof response.data.timeRemaining === 'number'
                    ? response.data.timeRemaining
                    : (response && typeof response.timeRemaining === 'number' ? response.timeRemaining : 0));

            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const daysInMonth = new Date(year, month, 0).getDate();

            setMemberData(prev => ({
                ...prev,
                membershipDaysLeft: Math.max(0, Number(timeRemaining) || 0),
                membershipTotalDays: daysInMonth
            }));
        } catch (error) {
            console.error('Lỗi khi lấy thời gian còn lại của hạng hội viên:', error);
        }
    };

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

                    {renderUpcomingClasses()}

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