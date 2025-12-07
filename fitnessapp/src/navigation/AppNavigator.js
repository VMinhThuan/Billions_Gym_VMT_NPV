import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPassword from '../screens/ForgotPassword';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import WorkoutPlansScreen from '../screens/WorkoutPlansScreen';
import ClassBookingScreen from '../screens/ClassBookingScreen';
import MembershipScreen from '../screens/MembershipScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditFitnessGoalsScreen from '../screens/EditFitnessGoalsScreen';
import EditAvatarScreen from '../screens/EditAvatarScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import WorkoutTrackingScreen from '../screens/WorkoutTrackingScreen';
import MonthlyMembershipScreen from '../screens/MonthlyMembershipScreen';
import RoleTestScreen from '../screens/RoleTestScreen';
import PTDashboardScreen from '../screens/PTDashboardScreen';
import PTBookingsScreen from '../screens/PTBookingsScreen';
import PTScheduleScreen from '../screens/PTScheduleScreen';
import PTStudentsScreen from '../screens/PTStudentsScreen';
import PTRevenueScreen from '../screens/PTRevenueScreen';
import PTPaymentScreen from '../screens/PTPaymentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { colors } = useTheme();
    const tabLabels = {
        Home: 'Trang chủ',
        Workout: 'Tập luyện',
        Classes: 'Lịch tập',
        Profile: 'Hồ sơ',
    };

    const AnimatedTabBar = ({ state, descriptors, navigation }) => {
        const tabWidthRefs = React.useRef([]);
        const tabRefs = React.useRef([]);
        const containerRef = React.useRef(null);
        const [layouts, setLayouts] = React.useState([]);
        const [containerWidth, setContainerWidth] = React.useState(0);
        const translateX = React.useRef(new Animated.Value(0)).current;
        const indicatorWidth = React.useRef(new Animated.Value(0)).current;

        const tabBarHeight = 60;

        const prevIndexRef = React.useRef(state.index);
        const EXTRA_PADDING = 40;
        const MIN_INDICATOR_WIDTH = 100;

        const measureTabs = () => {
            if (!containerRef.current) return;
            const promises = state.routes.map((_, i) => new Promise(resolve => {
                const node = tabRefs.current[i];
                if (!node) return resolve(null);
                try {
                    node.measureLayout(
                        containerRef.current,
                        (x, y, width, height) => resolve({ x, width }),
                        () => resolve(null)
                    );
                } catch (err) {
                    resolve(null);
                }
            }));

            Promise.all(promises).then(results => {
                const next = results.map(r => r || { x: 0, width: 0 });
                setLayouts(next);

                const layout = next[prevIndexRef.current];
                if (layout) {
                    const targetWidth = Math.max(layout.width + EXTRA_PADDING, MIN_INDICATOR_WIDTH);
                    const targetX = layout.x + (layout.width - targetWidth) / 2;
                    translateX.setValue(targetX);
                    indicatorWidth.setValue(targetWidth);
                }
            });
        };

        React.useEffect(() => {
            const layout = layouts[state.index];
            if (!layout || !layout.width) {
                if (containerWidth && state.routes.length) {
                    const inner = containerWidth - 24;
                    const targetWidth = Math.max(inner / state.routes.length + EXTRA_PADDING, MIN_INDICATOR_WIDTH);
                    const slotCenter = (inner * (state.index + 0.5)) / state.routes.length;
                    const targetX = 12 + slotCenter - targetWidth / 2;

                    const prevLayout = layouts[prevIndexRef.current];
                    const distance = prevLayout ? Math.abs(prevLayout.x - targetX) : 0;
                    const baseDuration = 220;
                    const duration = Math.min(420, Math.max(120, Math.round(baseDuration * (1 + distance / 120))));
                    if (!prevLayout) {
                        translateX.setValue(targetX);
                        indicatorWidth.setValue(targetWidth);
                    } else {
                        Animated.parallel([
                            Animated.timing(translateX, { toValue: targetX, duration, useNativeDriver: false }),
                            Animated.timing(indicatorWidth, { toValue: targetWidth, duration, useNativeDriver: false }),
                        ]).start();
                    }
                } else {
                    measureTabs();
                }
                return;
            }

            const targetWidth = Math.max(layout.width + EXTRA_PADDING, MIN_INDICATOR_WIDTH);
            const targetX = layout.x + (layout.width - targetWidth) / 2;

            let distance = 0;
            const prevLayout = layouts[prevIndexRef.current];
            if (prevLayout) {
                const prevWidth = Math.max(prevLayout.width + EXTRA_PADDING, MIN_INDICATOR_WIDTH);
                const prevX = prevLayout.x + (prevLayout.width - prevWidth) / 2;
                distance = Math.abs(prevX - targetX);
            }
            const baseDuration = 220;
            const duration = Math.min(420, Math.max(160, Math.round(baseDuration * (1 + distance / 120))));

            if (!prevLayout) {
                translateX.setValue(targetX);
                indicatorWidth.setValue(targetWidth);
            } else {
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: targetX,
                        duration,
                        useNativeDriver: false,
                    }),
                    Animated.timing(indicatorWidth, {
                        toValue: targetWidth,
                        duration,
                        useNativeDriver: false,
                    }),
                ]).start();
            }

            prevIndexRef.current = state.index;
        }, [state.index, layouts]);



        React.useEffect(() => {
            const t = setTimeout(() => measureTabs(), 50);
            return () => clearTimeout(t);
        }, [state.routes.length]);

        return (
            <View ref={containerRef} onLayout={(e) => { setContainerWidth(e.nativeEvent.layout.width); measureTabs(); }} style={{
                backgroundColor: '#1C1C1E',
                height: tabBarHeight,
                paddingHorizontal: 12,
                borderRadius: 34,
                marginHorizontal: 15,
                marginBottom: 20,
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
            }}>
                {/* sliding indicator */}
                {layouts[state.index] ? (
                    <Animated.View style={{
                        position: 'absolute',
                        left: 0,
                        top: (tabBarHeight - 44) / 2,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.primary,
                        width: indicatorWidth,
                        transform: [{ translateX }],
                    }} />
                ) : (
                    <View style={{
                        position: 'absolute',
                        left: 12,
                        top: (tabBarHeight - 44) / 2,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#007AFF',
                        minWidth: 80,
                    }} />
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                    {state.routes.map((route, index) => {
                        const focused = state.index === index;
                        const { options } = descriptors[route.key];

                        let iconName = 'ellipse';
                        if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                        if (route.name === 'Workout') iconName = focused ? 'barbell' : 'barbell-outline';
                        if (route.name === 'Classes') iconName = focused ? 'calendar' : 'calendar-outline';
                        if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!focused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <Animated.View key={route.key} style={{ paddingHorizontal: 6 }}>
                                <TouchableOpacity ref={el => tabRefs.current[index] = el} onPress={onPress} activeOpacity={0.8} style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', position: 'relative' }}>
                                    <Ionicons name={iconName} size={focused ? 20 : 22} color={focused ? '#FFFFFF' : '#9CA3AF'} />
                                    <Text style={{ color: focused ? '#FFFFFF' : '#9CA3AF', fontSize: 12, marginTop: 4 }} numberOfLines={1} ellipsizeMode='tail'>{tabLabels[route.name] || route.name}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <Tab.Navigator tabBar={(props) => <AnimatedTabBar {...props} />} screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Workout" component={WorkoutPlansScreen} />
            <Tab.Screen name="Classes" component={ClassBookingScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const LoadingScreen = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
};

const AppNavigator = () => {
    const { userToken, isLoading, userInfo, userRole } = useAuth();
    if (isLoading) {
        return <LoadingScreen />;
    }

    let initialRouteName = "Onboarding";
    if (userToken && (userInfo || userRole)) {
        initialRouteName = "Main";
    } else if (userToken) {
        initialRouteName = "Login";
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRouteName}
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="RoleTest" component={RoleTestScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen name="Membership" component={MembershipScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="EditFitnessGoals" component={EditFitnessGoalsScreen} />
                <Stack.Screen name="EditAvatar" component={EditAvatarScreen} />
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                <Stack.Screen name="Exercises" component={ExercisesScreen} />
                <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
                <Stack.Screen name="WorkoutTracking" component={WorkoutTrackingScreen} />
                <Stack.Screen name="MonthlyMembership" component={MonthlyMembershipScreen} />
                <Stack.Screen name="PTDashboard" component={PTDashboardScreen} />
                <Stack.Screen name="PTBookings" component={PTBookingsScreen} />
                <Stack.Screen name="PTSchedule" component={PTScheduleScreen} />
                <Stack.Screen name="PTStudents" component={PTStudentsScreen} />
                <Stack.Screen name="PTRevenue" component={PTRevenueScreen} />
                <Stack.Screen name="PTPayment" component={PTPaymentScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AppNavigator;