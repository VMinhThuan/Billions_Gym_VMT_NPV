import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    StyleSheet,
    ImageBackground,
    RefreshControl,
    Dimensions,
    Image,
    FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from "../hooks/useAuth";
import { useTheme, DEFAULT_THEME } from "../hooks/useTheme";
import apiService from '../api/apiService';
import Chatbot from '../components/Chatbot';
import ChartContainer from '../components/ChartContainer';
import WeeklyProgressChart from '../components/WeeklyProgressChart';
import GoalProgressChart from '../components/GoalProgressChart';
import ComparisonChart from '../components/ComparisonChart';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation();
    const { logout, userInfo, userToken } = useAuth();
    const { colors } = useTheme();
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

    const [chartData, setChartData] = useState({
        weeklyProgress: [],
        goalProgress: {
            workouts: { current: 0, target: 5 },
            calories: { current: 0, target: 2000 }
        },
        comparisonData: []
    });
    // Upcoming classes loaded from backend
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [loadingUpcoming, setLoadingUpcoming] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            if (!userToken) {
                console.log('User not logged in, redirecting to login');
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

            // Generate chart data
            generateChartData();

            // Gọi API để lấy thời gian còn lại của hạng hội viên
            await fetchMembershipTimeRemaining();

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
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

    const generateChartData = () => {
        const weeklyProgress = [];
        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = days[6 - i];

            const workouts = Math.floor(Math.random() * 3);
            const calories = 200 + Math.floor(Math.random() * 600);

            weeklyProgress.push({
                day: dayName,
                workouts: workouts,
                calories: calories
            });
        }

        const comparisonData = [];
        for (let i = 3; i >= 0; i--) {
            const weekNumber = 4 - i;
            const workouts = 5 + Math.floor(Math.random() * 10);
            const calories = 2000 + Math.floor(Math.random() * 3000);

            comparisonData.push({
                week: `Tuần ${weekNumber}`,
                workouts: workouts,
                calories: calories
            });
        }

        setChartData({
            weeklyProgress,
            goalProgress: {
                workouts: {
                    current: memberData.workoutsThisWeek,
                    target: 5
                },
                calories: {
                    current: memberData.todayCalories,
                    target: memberData.weeklyGoal
                }
            },
            comparisonData
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const renderQuickActions = () => {
        const actions = [
            {
                title: "Đặt lịch PT",
                icon: "person-outline", // Thay thế icon hợp lệ
                color: "#DA2128",
                onPress: () => navigation.navigate('Classes')
            },
            {
                title: "Lịch tập",
                icon: "barbell-outline", // Thay thế icon hợp lệ
                color: "#141414",
                onPress: () => navigation.navigate('WorkoutPlans')
            },
            {
                title: "Dinh dưỡng",
                icon: "restaurant-outline", // Thay thế icon hợp lệ
                color: "#DA2128",
                onPress: () => navigation.navigate('Nutrition')
            },
            {
                title: "Thành viên",
                icon: "card-outline", // Thay thế icon hợp lệ
                color: "#141414",
                onPress: () => navigation.navigate('Membership')
            }
        ];

        return (
            <View style={[styles.quickActionsContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Truy cập nhanh</Text>
                <View style={styles.actionsGrid}>
                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.actionCard, { backgroundColor: colors.card }]}
                            onPress={action.onPress}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                                <MaterialIcons name={action.icon} size={24} color="white" />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
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
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{daysLeft} Ngày đếm ngược</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, marginBottom: 25, overflow: 'hidden' }}>
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

    // upcomingClasses state defined earlier; fetched from backend

    const fetchUpcomingClasses = async () => {
        try {
            setLoadingUpcoming(true);
            const schedules = await apiService.getAllWorkoutSchedules();

            // Map backend LichTap entries to UI shape used by this screen
            // Backend LichTap may contain cacBuoiTap (array of BuoiTap). We'll flatten first few buoiTap into upcoming items.
            const items = [];
            (schedules || []).forEach(lich => {
                // lich.cacBuoiTap may be populated with BuoiTap docs
                const buoiTaps = Array.isArray(lich.cacBuoiTap) ? lich.cacBuoiTap : [];
                buoiTaps.forEach(bt => {
                    // derive display fields
                    const id = bt._id || bt.id || `${lich._id}_${Math.random().toString(36).slice(2, 8)}`;
                    const imageUrl = bt.hinhAnh || bt.hinhAnhMinhHoa?.[0] || bt.anhDaiDien || null;
                    const name = bt.tenBuoiTap || bt.tenBuoiTap || (bt.tenBaiTap ? bt.tenBaiTap : (lich.hoTen || 'Buổi tập'));
                    // attempt to compute a readable date/time
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

            // If there are no buoi taps in schedules, try to fall back to top-level schedule dates
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
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1 }]}>Lớp học sắp tới</Text>
                <TouchableOpacity>
                    <Text style={{ color: colors.primary, fontSize: 18, textAlign: 'right' }}>Xem tất cả</Text>
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

    const healthyMeals = [
        {
            id: '1',
            image: { uri: 'https://images.unsplash.com/photo-1646809156467-6e825869b29f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            name: 'Grilled Chicken With Rice',
            calories: 310,
        },
        {
            id: '2',
            image: { uri: 'https://images.unsplash.com/photo-1661081090288-fd8ffc486dd7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            name: 'Grilled Fish With Rice',
            calories: 310,
        },
        {
            id: '3',
            image: { uri: 'https://img.taste.com.au/HYj36Q1G/w1200-h675-cfill-q80/taste/2016/11/middle-eastern-lamb-koftas-with-aromatic-lentil-rice-106574-1.jpeg' },
            name: 'Kofta With Basmati',
            calories: 310,
        },
    ];

    const renderHealthyMeals = () => (
        <View style={[styles.healthyMealsContainer, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1 }]}>Bữa ăn lành mạnh</Text>
                <TouchableOpacity>
                    <Text style={{ color: colors.primary, fontSize: 18, textAlign: 'right' }}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {healthyMeals.map(meal => (
                    <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.card, position: 'relative', height: 250 }]}>
                        <Image source={meal.image} style={[styles.mealImage, { height: 120 }]} />
                        <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={2}>
                            {meal.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>{meal.calories} kcal</Text>
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
        </View>
    );

    const coaches = [
        {
            id: '1',
            name: 'Ahmed Ehab',
            specialty: 'Strength Training',
            image: { uri: 'https://i.etsystatic.com/11657093/r/il/8cfe1b/5925373976/il_340x270.5925373976_74qf.jpg' },
        },
        {
            id: '2',
            name: 'Haneen Mohamed',
            specialty: 'Strength Training',
            image: { uri: 'https://www.dignitii.com/cdn/shop/articles/Screen_Shot_2022-02-24_at_10.26.16_PM_400x.png?v=1680271614' },
        },
    ];

    const renderCoaches = () => (
        <View style={styles.coachesContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, flex: 1 }]}>Huấn luyện viên</Text>
                <TouchableOpacity>
                    <Text style={{ color: colors.primary, fontSize: 18, textAlign: 'right' }}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {coaches.map(coach => (
                    <View key={coach.id} style={[styles.coachCard, { backgroundColor: 'transparent', height: 190, padding: 0, marginRight: 20 }]}>
                        <ImageBackground
                            source={coach.image}
                            style={[styles.coachImage, { height: 190, width: 170, borderRadius: 14, overflow: 'hidden', marginBottom: 0 }]}
                            imageStyle={{ borderRadius: 14 }}
                        >
                            <View style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                top: 0,
                                backgroundColor: 'rgba(0,0,0,0.18)',
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
                                <Text style={[styles.coachName, { color: '#fff', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]} numberOfLines={1}>{coach.name}</Text>
                                <Text style={[styles.coachSpecialty, { color: '#eee', fontSize: 16 }]} numberOfLines={1}>{coach.specialty}</Text>
                            </View>
                        </ImageBackground>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    Object.assign(styles, {
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
            height: 140,
            borderRadius: 12,
            marginBottom: 12,
            resizeMode: 'cover',
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
    });

    // Place this in your render tree, e.g. after renderCoachingBanner():
    // {renderCoaches()}

    Object.assign(styles, {
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
    });

    const extraStyles = StyleSheet.create({
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

    Object.assign(styles, extraStyles);

    // Định nghĩa hàm fetchMembershipTimeRemaining
    const fetchMembershipTimeRemaining = async () => {
        try {
            const userId = userInfo?._id || userInfo?.id || userInfo?.userId;
            if (!userId) {
                console.error('Không tìm thấy userId, không thể lấy thời gian còn lại.');
                return;
            }
            // Ensure userId is used in all API calls that require it
            const response = await apiService.apiCall(`/hanghoivien/thoi-gian-con-lai/${userId}`, 'GET');
            // api may return { success: true, data: { userId, timeRemaining } } or nested as result.data.data
            const timeRemaining = (response && response.data && response.data.data && typeof response.data.data.timeRemaining === 'number')
                ? response.data.data.timeRemaining
                : (response && response.data && typeof response.data.timeRemaining === 'number'
                    ? response.data.timeRemaining
                    : (response && typeof response.timeRemaining === 'number' ? response.timeRemaining : 0));

            // Example fix for user rank API (if used elsewhere in your code):
            // const rankResponse = await apiService.apiCall(`/users/${userId}/with-rank`, 'GET');
            // if (rankResponse && typeof rankResponse === 'object') {
            //     // handle rankResponse
            // } else {
            //     console.error('Error fetching user rank: Non-JSON response');
            // }

            // Lấy số ngày của tháng hiện tại
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
                        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Xin chào, 👋</Text>
                        <Text style={[styles.userNameText, { color: colors.text }]}>
                            {userInfo?.hoTen || userInfo?.sdt || 'Thành viên'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
                        <MaterialIcons name="notifications" size={24} color={colors.text} />
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

                    {renderUpcomingClasses()}

                    {renderHealthyMeals()}

                    {renderCoaches()}

                    {/* Charts Section
                    <ChartContainer title="Tiến độ tuần này">
                        <WeeklyProgressChart data={chartData.weeklyProgress} />
                    </ChartContainer> */}

                    {/* <View style={styles.chartsRow}>
                        <View style={styles.chartHalf}>
                            <ChartContainer title="Mục tiêu tập luyện" style={styles.halfChart}>
                                <GoalProgressChart
                                    current={chartData.goalProgress.workouts.current}
                                    target={chartData.goalProgress.workouts.target}
                                    title="Buổi tập"
                                    unit=" buổi"
                                />
                            </ChartContainer>
                        </View>
                        <View style={styles.chartHalf}>
                            <ChartContainer title="Mục tiêu calories" style={styles.halfChart}>
                                <GoalProgressChart
                                    current={chartData.goalProgress.calories.current}
                                    target={chartData.goalProgress.calories.target}
                                    title="Calories"
                                    unit=" cal"
                                />
                            </ChartContainer>
                        </View>
                    </View> */}

                    {/* <ChartContainer title="So sánh 4 tuần gần đây">
                        <ComparisonChart data={chartData.comparisonData} />
                    </ChartContainer> */}

                    {/* Next Class Card */}
                    {/* <View style={[styles.nextClassContainer, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Lớp học tiếp theo</Text>
                        <View style={[styles.nextClassCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                            <View style={styles.nextClassIcon}>
                                <MaterialIcons name="self-improvement" size={30} color={colors.primary} />
                            </View>
                            <View style={styles.nextClassInfo}>
                                <Text style={[styles.nextClassName, { color: colors.text }]}>{memberData.nextClass}</Text>
                                <Text style={[styles.nextClassTime, { color: colors.textSecondary }]}>Hôm nay - {memberData.nextClassTime}</Text>
                                <Text style={[styles.nextClassStatus, { color: colors.primary }]}>Đã đặt lịch</Text>
                            </View>
                            <TouchableOpacity style={[styles.nextClassButton, { backgroundColor: colors.primary }]}>
                                <Text style={styles.nextClassButtonText}>Chi tiết</Text>
                            </TouchableOpacity>
                        </View>
                    </View> */}

                    {/* Quick Actions */}
                    {/* {renderQuickActions()} */}

                    {/* Weekly Goal Progress */}
                    {/* <View style={[styles.goalSection, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mục tiêu tuần này</Text>
                        <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.goalProgress, { backgroundColor: colors.border }]}>
                                <View style={[styles.goalProgressBar, {
                                    width: `${(memberData.todayCalories / memberData.weeklyGoal) * 100}%`,
                                    backgroundColor: colors.primary
                                }]} />
                            </View>
                            <View style={styles.goalInfo}>
                                <Text style={[styles.goalCurrent, { color: colors.text }]}>{memberData.todayCalories}</Text>
                                <Text style={[styles.goalTarget, { color: colors.textSecondary }]}>/ {memberData.weeklyGoal} calories</Text>
                            </View>
                            <Text style={[styles.goalText, { color: colors.textSecondary }]}>Tuyệt vời! Bạn đang đạt được mục tiêu</Text>
                        </View>
                    </View> */}

                    {/* AI Suggestions */}
                    {/* <View style={[styles.aiSection, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>
                        <View style={[styles.aiCard, { backgroundColor: colors.card }]}>
                            <Ionicons name="bulb" size={24} color={colors.primary} />
                            <Text style={[styles.aiText, { color: colors.text }]}>
                                Thử lớp Pilates vào thứ 4 để cải thiện độ dẻo dai
                            </Text>
                        </View>
                        <View style={[styles.aiCard, { backgroundColor: colors.card }]}>
                            <Ionicons name="nutrition" size={24} color={colors.text} />
                            <Text style={[styles.aiText, { color: colors.text }]}>
                                Bổ sung protein sau buổi tập để phục hồi cơ bắp tốt hơn
                            </Text>
                        </View>
                    </View> */}
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
        padding: 8,
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
    progressGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    progressCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    progressIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    progressSubtitle: {
        fontSize: 12,
        textAlign: 'center',
    },
    nextClassContainer: {
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
    nextClassCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    nextClassIcon: {
        marginRight: 16,
    },
    nextClassInfo: {
        flex: 1,
    },
    nextClassName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    nextClassTime: {
        fontSize: 14,
        marginBottom: 2,
    },
    nextClassStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    nextClassButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    nextClassButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    quickActionsContainer: {
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
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
    },
    actionIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionTitle: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    goalSection: {
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
    goalCard: {
        padding: 16,
        borderRadius: 12,
    },
    goalProgress: {
        height: 8,
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
        backgroundColor: '#b3b3b3',
    },
    goalProgressBar: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#da2128',
    },
    goalInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    goalCurrent: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    goalTarget: {
        fontSize: 16,
        marginLeft: 4,
    },
    goalText: {
        fontSize: 14,
    },
    aiSection: {
        padding: 20,
        margin: 15,
        marginTop: 0,
        marginBottom: 30,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
    bannerContent: {
        alignItems: 'center',
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
    bannerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 12,
    },
    bannerDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 10,
        fontStyle: 'italic',
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
    aiCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    aiText: {
        flex: 1,
        fontSize: 14,
        marginLeft: 12,
        lineHeight: 20,
    },
    chartsRow: {
        flexDirection: 'row',
        marginHorizontal: 15,
        marginTop: 0,
        gap: 10,
    },
    chartHalf: {
        flex: 1,
    },
    halfChart: {
        margin: 0,
    },
    membershipContainer: {
        padding: 20,
        margin: 15,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'center',
    },
    membershipTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    membershipDays: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#DA2128',
    },
    progressText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#da2128',
    },
});

export default HomeScreen;