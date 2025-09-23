import React, { useState, useEffect } from "react";
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
    Image
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Check if user is logged in using AuthContext
            if (!userToken) {
                console.log('User not logged in, redirecting to login');
                Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.', [
                    { text: 'OK', onPress: () => logout() }
                ]);
                return;
            }

            // Fetch multiple data sources in parallel
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

            // Process workout data
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

            // Process PT booking data for next class
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
                    // Silent error handling for PT booking data
                }
            }

            // Process membership data
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

            // Process body stats data
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

            // Process nutrition data
            if (nutritionInfo.status === 'fulfilled' && nutritionInfo.value) {
                try {
                    const nutrition = nutritionInfo.value;
                    // Handle both array and object responses
                    if (Array.isArray(nutrition)) {
                        // If it's an array, get the latest entry
                        const latestNutrition = nutrition[0] || {};
                        setMemberData(prev => ({
                            ...prev,
                            todayCalories: latestNutrition.caloriesConsumed || 0
                        }));
                    } else if (nutrition && typeof nutrition === 'object') {
                        // If it's an object, use it directly
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

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStreak = (completedWorkouts) => {
        if (!completedWorkouts.length) return 0;

        // Sort workouts by date (newest first)
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
        // Generate weekly progress data (last 7 days)
        const weeklyProgress = [];
        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = days[6 - i];

            // Generate sample data (in real app, this would come from API)
            const workouts = Math.floor(Math.random() * 3);
            const calories = 200 + Math.floor(Math.random() * 600);

            weeklyProgress.push({
                day: dayName,
                workouts: workouts,
                calories: calories
            });
        }

        // Generate comparison data (last 4 weeks)
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
                icon: "person",
                color: "#DA2128",
                onPress: () => navigation.navigate('ClassBooking')
            },
            {
                title: "Lịch tập",
                icon: "fitness-center",
                color: "#141414",
                onPress: () => navigation.navigate('WorkoutPlans')
            },
            {
                title: "Dinh dưỡng",
                icon: "restaurant",
                color: "#DA2128",
                onPress: () => navigation.navigate('Nutrition')
            },
            {
                title: "Thành viên",
                icon: "card-membership",
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

    const renderFitnessProgress = () => {
        const progressData = [
            {
                title: "Tuần này",
                value: memberData.workoutsThisWeek.toString(),
                subtitle: "buổi tập",
                icon: "fitness-center",
                color: "#DA2128"
            },
            {
                title: "Streak",
                value: memberData.currentStreak.toString(),
                subtitle: "ngày",
                icon: "local-fire-department",
                color: "#141414"
            },
            {
                title: "Calories",
                value: memberData.todayCalories.toString(),
                subtitle: "hôm nay",
                icon: "flash-on",
                color: "#DA2128"
            },
            {
                title: "Còn lại",
                value: memberData.membershipDaysLeft.toString(),
                subtitle: "ngày",
                icon: "schedule",
                color: "#141414"
            }
        ];

        return (
            <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tiến độ của bạn</Text>
                <View style={styles.progressGrid}>
                    {progressData.map((item, index) => (
                        <View key={index} style={[styles.progressCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.progressIcon, { backgroundColor: item.color }]}>
                                <MaterialIcons name={item.icon} size={20} color="white" />
                            </View>
                            <Text style={[styles.progressValue, { color: colors.text }]}>{item.value}</Text>
                            <Text style={[styles.progressTitle, { color: colors.text }]}>{item.title}</Text>
                            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Xin chào!</Text>
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
                    {/* Progress Cards */}
                    {renderFitnessProgress()}

                    {/* Charts Section */}
                    <ChartContainer title="Tiến độ tuần này">
                        <WeeklyProgressChart data={chartData.weeklyProgress} />
                    </ChartContainer>

                    <View style={styles.chartsRow}>
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
                    </View>

                    <ChartContainer title="So sánh 4 tuần gần đây">
                        <ComparisonChart data={chartData.comparisonData} />
                    </ChartContainer>

                    {/* Next Class Card */}
                    <View style={[styles.nextClassContainer, { backgroundColor: colors.surface }]}>
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
                    </View>

                    {/* Quick Actions */}
                    {renderQuickActions()}

                    {/* Weekly Goal Progress */}
                    <View style={[styles.goalSection, { backgroundColor: colors.surface }]}>
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
                    </View>

                    {/* AI Suggestions */}
                    <View style={[styles.aiSection, { backgroundColor: colors.surface }]}>
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
                    </View>
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
        fontSize: 20,
        fontWeight: 'bold',
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
    },
    goalProgressBar: {
        height: '100%',
        borderRadius: 4,
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
});

export default HomeScreen;
