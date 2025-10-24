import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PTDashboardScreen from '../screens/PTDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import PTBookingsScreen from '../screens/PTBookingsScreen';
import PTPaymentScreen from '../screens/PTPaymentScreen';
import PTStudentsScreen from '../screens/PTStudentsScreen';
import PTRevenueScreen from '../screens/PTRevenueScreen';
import PTScheduleScreen from '../screens/PTScheduleScreen';
import AdminMemberManagementScreen from '../screens/AdminMemberManagementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import WorkoutPlansScreen from '../screens/WorkoutPlansScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ClassBookingScreen from '../screens/ClassBookingScreen';
import MembershipScreen from '../screens/MembershipScreen';
import WorkoutPredictionScreen from '../screens/WorkoutPredictionScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// HoiVien Tab Navigator
const HoiVienTabNavigator = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'WorkoutPlans') {
                        iconName = 'fitness-center';
                    } else if (route.name === 'Nutrition') {
                        iconName = 'restaurant';
                    } else if (route.name === 'Booking') {
                        iconName = 'event';
                    } else if (route.name === 'Profile') {
                        iconName = 'person';
                    }

                    return <MaterialIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'Trang chủ' }}
            />
            <Tab.Screen
                name="WorkoutPlans"
                component={WorkoutPlansScreen}
                options={{ tabBarLabel: 'Lịch tập' }}
            />
            <Tab.Screen
                name="Nutrition"
                component={NutritionScreen}
                options={{ tabBarLabel: 'Dinh dưỡng' }}
            />
            <Tab.Screen
                name="Booking"
                component={ClassBookingScreen}
                options={{ tabBarLabel: 'Đặt lịch' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
};

// PT Tab Navigator
const PTTabNavigator = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'PTDashboard') {
                        iconName = 'dashboard';
                    } else if (route.name === 'PTSchedule') {
                        iconName = 'schedule';
                    } else if (route.name === 'PTRevenue') {
                        iconName = 'attach-money';
                    } else if (route.name === 'PTStudents') {
                        iconName = 'people';
                    } else if (route.name === 'PTProfile') {
                        iconName = 'person';
                    }

                    return <MaterialIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
            })}
        >
            <Tab.Screen
                name="PTDashboard"
                component={PTDashboardScreen}
                options={{ tabBarLabel: 'Tổng quan' }}
            />
            <Tab.Screen
                name="PTSchedule"
                component={PTScheduleScreen}
                options={{ tabBarLabel: 'Lịch làm việc' }}
            />
            <Tab.Screen
                name="PTRevenue"
                component={PTRevenueScreen}
                options={{ tabBarLabel: 'Doanh thu' }}
            />
            <Tab.Screen
                name="PTStudents"
                component={PTStudentsScreen}
                options={{ tabBarLabel: 'Học viên' }}
            />
            <Tab.Screen
                name="PTProfile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'AdminDashboard') {
                        iconName = 'dashboard';
                    } else if (route.name === 'MemberManagement') {
                        iconName = 'people';
                    } else if (route.name === 'Reports') {
                        iconName = 'assessment';
                    } else if (route.name === 'AdminProfile') {
                        iconName = 'admin-panel-settings';
                    }

                    return <MaterialIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
            })}
        >
            <Tab.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ tabBarLabel: 'Bảng điều khiển' }}
            />
            <Tab.Screen
                name="MemberManagement"
                component={AdminMemberManagementScreen}
                options={{ tabBarLabel: 'Quản lý thành viên' }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportsScreen}
                options={{ tabBarLabel: 'Báo cáo' }}
            />
            <Tab.Screen
                name="AdminProfile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
        </Tab.Navigator>
    );
};

// Main Role-Based Navigator
const RoleBasedNavigator = () => {
    const { userRole, userInfo, isLoading, userToken } = useAuth();

    console.log("🎭 RoleBasedNavigator - userRole:", userRole);
    console.log("🎭 RoleBasedNavigator - userInfo:", userInfo);
    console.log("🎭 RoleBasedNavigator - isLoading:", isLoading);
    console.log("🎭 RoleBasedNavigator - userToken:", userToken ? "present" : "missing");

    // Hiển thị loading nếu đang kiểm tra auth
    if (isLoading || !userToken) {
        console.log("🎭 RoleBasedNavigator - showing loading screen or no token");
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>Đang tải...</Text>
            </View>
        );
    }

    // Lấy role từ userInfo nếu userRole chưa được set, hoặc từ userInfo
    let role = userRole || userInfo?.vaiTro;

    // Nếu vẫn không có role, thử lấy từ token (decode nếu cần)
    if (!role && userInfo) {
        role = userInfo.vaiTro || 'HoiVien';
    }

    // Default role nếu không xác định được
    if (!role) {
        console.log("🎭 No role found, defaulting to HoiVien");
        role = 'HoiVien';
    }

    console.log("🎭 Final role determined:", role);
    console.log("🎭 userRole from context:", userRole);
    console.log("🎭 userInfo?.vaiTro:", userInfo?.vaiTro);

    // Render component theo role
    const renderNavigatorByRole = () => {
        switch (role) {
            case 'HoiVien':
                console.log("🎭 Rendering HoiVienTabNavigator");
                return <HoiVienTabNavigator />;
            case 'PT':
                return <PTTabNavigator />;
            case 'OngChu':
                console.log("🎭 Rendering AdminTabNavigator");
                return <AdminTabNavigator />;
            default:
                console.log("🎭 Unknown role, defaulting to HoiVien:", role);
                return <HoiVienTabNavigator />;
        }
    };

    return renderNavigatorByRole();
};

// Stack Navigator for all role-based screens
const MainStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoleBasedTabs" component={RoleBasedNavigator} />

            {/* Common screens for all roles */}
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="WorkoutPrediction" component={WorkoutPredictionScreen} />
            <Stack.Screen name="Membership" component={MembershipScreen} />

            {/* PT specific screens */}
            <Stack.Screen name="PTBookings" component={PTBookingsScreen} />
            <Stack.Screen name="PTPayments" component={PTPaymentScreen} />
            <Stack.Screen name="PTBookingDetail" component={PTDashboardScreen} />
            <Stack.Screen name="AddBooking" component={PTDashboardScreen} />
            <Stack.Screen name="StudentDetail" component={PTDashboardScreen} />
            <Stack.Screen name="CreatePTPayment" component={PTDashboardScreen} />

            {/* Admin specific screens */}
            <Stack.Screen name="MemberDetail" component={HomeScreen} />
            <Stack.Screen name="AddMember" component={HomeScreen} />
            <Stack.Screen name="ExtendMembership" component={HomeScreen} />
            <Stack.Screen name="PTManagement" component={HomeScreen} />
            <Stack.Screen name="PaymentManagement" component={HomeScreen} />
            <Stack.Screen name="PackageManagement" component={HomeScreen} />
            <Stack.Screen name="Settings" component={HomeScreen} />
        </Stack.Navigator>
    );
};

export default MainStackNavigator;