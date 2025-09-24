import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPassword from '../screens/ForgotPassword';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import WorkoutPlansScreen from '../screens/WorkoutPlansScreen';
import NutritionScreen from '../screens/NutritionScreen';
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
import WorkoutPredictionScreen from '../screens/WorkoutPredictionScreen';
import RoleTestScreen from '../screens/RoleTestScreen';
import RoleBasedNavigator from './RoleBasedNavigator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = 'home';
                        return <MaterialIcons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'WorkoutPlans') {
                        iconName = 'fitness-center';
                        return <MaterialIcons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'Nutrition') {
                        iconName = 'restaurant';
                        return <MaterialIcons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'WorkoutPrediction') {
                        iconName = 'trending-up';
                        return <MaterialIcons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'Profile') {
                        iconName = 'person';
                        return <MaterialIcons name={iconName} size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    height: 80,
                    paddingBottom: 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
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
                name="WorkoutPrediction"
                component={WorkoutPredictionScreen}
                options={{ tabBarLabel: 'Dự báo' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Cá nhân' }}
            />
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

    console.log("🚀 AppNavigator - userToken:", userToken ? "present" : "missing");
    console.log("🚀 AppNavigator - isLoading:", isLoading);
    console.log("🚀 AppNavigator - userInfo:", userInfo);
    console.log("🚀 AppNavigator - userRole:", userRole);

    if (isLoading) {
        return <LoadingScreen />;
    }

    // Xác định route ban đầu
    let initialRouteName = "Onboarding";
    if (userToken && (userInfo || userRole)) {
        initialRouteName = "Main";
        console.log("🚀 AppNavigator - Setting initial route to Main with user data");
    } else if (userToken) {
        console.log("🚀 AppNavigator - Have token but missing user data, going to Login");
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
                <Stack.Screen name="Main" component={RoleBasedNavigator} />
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
