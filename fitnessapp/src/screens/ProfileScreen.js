import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    RefreshControl,
    Alert,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { logout, userInfo } = useAuth();
    const { colors, isDarkMode, toggleTheme } = useTheme();

    const [refreshing, setRefreshing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const userRole = userInfo?.vaiTro || 'HoiVien';

    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState({
        name: "",
        email: "",
        phone: "",
        joinDate: "",
        membershipType: "",
        totalWorkouts: 0,
        currentStreak: 0,
        achievements: 0,
        height: "",
        weight: ""
    });

    const [hangHoiVien, setHangHoiVien] = useState({
        tenHang: "",
        tenHienThi: "",
        mauSac: "#FFD700",
        icon: "🥉",
        quyenLoi: [],
        soTienTichLuy: 0,
        soThangLienTuc: 0,
        soBuoiTapDaTap: 0
    });


    useEffect(() => {
        fetchProfileData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProfileData();
        });

        return unsubscribe;
    }, [navigation]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            const currentUserId = await apiService.getMyProfile();
            if (!currentUserId) {
                return;
            }

            const [profile, workouts, bodyStats, membership, hangHoiVienData] = await Promise.allSettled([
                apiService.getMyProfile(),
                apiService.getMyWorkoutPlans(),
                apiService.getMyLatestBodyStats(),
                apiService.getMyMembership(),
                apiService.getHangHoiVienCuaHoiVien(currentUserId)
            ]);

            if (profile.status === 'fulfilled' && profile.value) {
                const userData = profile.value;
                setUserProfile(prev => ({
                    ...prev,
                    name: userData.hoTen || userInfo?.hoTen || 'Thành viên',
                    email: userData.email || '',
                    phone: userData.sdt || userInfo?.sdt || '',
                    joinDate: userData.ngayThamGia ?
                        new Date(userData.ngayThamGia).toLocaleDateString('vi-VN') : ''
                }));
            }

            if (workouts.status === 'fulfilled' && workouts.value) {
                const workoutData = workouts.value;
                const completedWorkouts = workoutData.filter(w => w.trangThai === 'DaHoanThanh');
                const streak = calculateWorkoutStreak(completedWorkouts);

                setUserProfile(prev => ({
                    ...prev,
                    totalWorkouts: completedWorkouts.length,
                    currentStreak: streak,
                    achievements: Math.floor(completedWorkouts.length / 5)
                }));
            }

            if (bodyStats.status === 'fulfilled' && bodyStats.value) {
                const stats = bodyStats.value;
                setUserProfile(prev => ({
                    ...prev,
                    weight: stats.canNang ? `${stats.canNang}` : '',
                    height: stats.chieuCao ? `${stats.chieuCao}` : ''
                }));
            }

            if (membership.status === 'fulfilled' && membership.value) {
                const membershipData = membership.value;
                const activeMembership = membershipData.find(m =>
                    m.trangThai === 'DangHoatDong' && new Date(m.ngayKetThuc) > new Date()
                );

                if (activeMembership) {
                    setUserProfile(prev => ({
                        ...prev,
                        membershipType: activeMembership.maGoiTap?.tenGoiTap || 'Gói cơ bản'
                    }));
                }
            }

            if (hangHoiVienData.status === 'fulfilled' && hangHoiVienData.value) {
                const hangData = hangHoiVienData.value;

                if (hangData && hangData.data && hangData.data.hangHoiVien) {
                    const hangInfo = hangData.data.hangHoiVien;
                    setHangHoiVien({
                        tenHang: hangInfo.tenHang,
                        tenHienThi: hangInfo.tenHienThi,
                        mauSac: hangInfo.mauSac,
                        icon: hangInfo.icon,
                        quyenLoi: hangInfo.quyenLoi || [],
                        soTienTichLuy: hangData.data.soTienTichLuy || 0,
                        soThangLienTuc: hangData.data.soThangLienTuc || 0,
                        soBuoiTapDaTap: hangData.data.soBuoiTapDaTap || 0
                    });
                } else if (hangData && hangData.hangHoiVien) {
                    const hangInfo = hangData.hangHoiVien;
                    setHangHoiVien({
                        tenHang: hangInfo.tenHang,
                        tenHienThi: hangInfo.tenHienThi,
                        mauSac: hangInfo.mauSac,
                        icon: hangInfo.icon,
                        quyenLoi: hangInfo.quyenLoi || [],
                        soTienTichLuy: hangData.soTienTichLuy || 0,
                        soThangLienTuc: hangData.soThangLienTuc || 0,
                        soBuoiTapDaTap: hangData.soBuoiTapDaTap || 0
                    });
                    console.log('✅ Set hang hoi vien (direct):', hangInfo.tenHienThi);
                } else {
                    console.log('❌ No hang hoi vien data found in response');
                    console.log('Available keys:', Object.keys(hangData));
                }
            } else {
                console.log('❌ Hang hoi vien API failed:', hangHoiVienData);
            }

        } catch (error) {
            console.error('Error fetching profile data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const calculateWorkoutStreak = (workouts) => {
        if (!workouts.length) return 0;

        const sortedWorkouts = workouts
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
        await fetchProfileData();
        setRefreshing(false);
    };


    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ]
        );
    };

    const getMenuItemsByRole = () => {
        const commonAccountItems = [
            {
                title: "Thông tin cá nhân",
                icon: "person-outline",
                onPress: () => navigation.navigate('EditProfile', { userProfile })
            },
            {
                title: "Đổi mật khẩu",
                icon: "lock-outline",
                onPress: () => navigation.navigate('ChangePassword')
            }
        ];

        const commonSettingsItems = [
            {
                title: "Thông báo",
                icon: "notifications-outline",
                hasSwitch: true,
                switchValue: notificationsEnabled,
                onSwitchChange: setNotificationsEnabled
            },
            {
                title: "Chế độ tối",
                icon: "contrast",
                hasSwitch: true,
                switchValue: isDarkMode,
                onSwitchChange: toggleTheme
            }
        ];

        const commonSupportItems = [
            {
                title: "Trung tâm trợ giúp",
                icon: "help-outline",
                onPress: () => Alert.alert("Thông báo", "Chức năng đang phát triển")
            },
            {
                title: "Liên hệ chúng tôi",
                icon: "mail-outline",
                onPress: () => Alert.alert("Liên hệ", "Email: support@billionsgym.com\nĐiện thoại: 1900 1234")
            },
            {
                title: "Đánh giá ứng dụng",
                icon: "star-outline",
                onPress: () => Alert.alert("Thông báo", "Cảm ơn bạn đã sử dụng ứng dụng!")
            }
        ];

        switch (userRole) {
            case 'HoiVien':
                return [
                    {
                        section: "Tài khoản",
                        items: [
                            ...commonAccountItems,
                            {
                                title: "Mục tiêu fitness",
                                icon: "flag-outline",
                                onPress: () => navigation.navigate('EditFitnessGoals', { fitnessGoals })
                            },
                            {
                                title: "Xem bài tập",
                                icon: "fitness-outline",
                                onPress: () => navigation.navigate('Exercises')
                            },
                            {
                                title: "Lịch sử tập luyện",
                                icon: "time-outline",
                                onPress: () => navigation.navigate('WorkoutTracking')
                            },
                            {
                                title: "Đặt lịch PT",
                                icon: "calendar-outline",
                                onPress: () => navigation.navigate('Classes')
                            },
                            {
                                title: "Thành viên",
                                icon: "card-membership",
                                onPress: () => navigation.navigate('Membership')
                            },
                            {
                                title: "Thành tích",
                                icon: "trophy-outline",
                                onPress: () => Alert.alert("Thông báo", "Chức năng đang phát triển")
                            }
                        ]
                    },
                    {
                        section: "Cài đặt",
                        items: [
                            ...commonSettingsItems,
                            {
                                title: "Ngôn ngữ",
                                icon: "language",
                                subtitle: "Tiếng Việt",
                                onPress: () => Alert.alert("Thông báo", "Chức năng đang phát triển")
                            }
                        ]
                    },
                    {
                        section: "Hỗ trợ",
                        items: commonSupportItems
                    }
                ];

            case 'PT':
                return [
                    {
                        section: "Tài khoản",
                        items: [
                            ...commonAccountItems,
                            {
                                title: "Hồ sơ PT",
                                icon: "fitness-center",
                                onPress: () => Alert.alert("Thông báo", "Chức năng hồ sơ PT đang phát triển")
                            },
                            {
                                title: "Chứng chỉ & Kinh nghiệm",
                                icon: "school-outline",
                                onPress: () => Alert.alert("Thông báo", "Chức năng quản lý chứng chỉ đang phát triển")
                            }
                        ]
                    },
                    {
                        section: "Công việc",
                        items: [
                            {
                                title: "Quản lý học viên",
                                icon: "people-outline",
                                onPress: () => navigation.jumpTo('PTStudents')
                            },
                            {
                                title: "Lịch làm việc",
                                icon: "calendar-outline",
                                onPress: () => navigation.jumpTo('PTSchedule')
                            },
                            {
                                title: "Doanh thu",
                                icon: "attach-money",
                                onPress: () => navigation.jumpTo('PTRevenue')
                            },
                            {
                                title: "Quản lý lịch hẹn",
                                icon: "event-note",
                                onPress: () => navigation.navigate('PTBookings')
                            },
                            {
                                title: "Báo cáo hiệu suất",
                                icon: "bar-chart-outline",
                                onPress: () => Alert.alert("Thông báo", "Chức năng báo cáo đang phát triển")
                            }
                        ]
                    },
                    {
                        section: "Cài đặt",
                        items: commonSettingsItems
                    },
                    {
                        section: "Hỗ trợ",
                        items: commonSupportItems
                    }
                ];

            case 'OngChu':
                return [
                    {
                        section: "Tài khoản",
                        items: [
                            ...commonAccountItems,
                            {
                                title: "Hồ sơ quản lý",
                                icon: "business-outline",
                                onPress: () => Alert.alert("Thông báo", "Chức năng hồ sơ quản lý đang phát triển")
                            }
                        ]
                    },
                    {
                        section: "Quản lý",
                        items: [
                            {
                                title: "Quản lý thành viên",
                                icon: "people-outline",
                                onPress: () => navigation.jumpTo('AdminMemberManagement')
                            },
                            {
                                title: "Báo cáo & Thống kê",
                                icon: "bar-chart-outline",
                                onPress: () => navigation.jumpTo('AdminReports')
                            },
                            {
                                title: "Quản lý PT",
                                icon: "fitness-center",
                                onPress: () => Alert.alert("Thông báo", "Chức năng quản lý PT đang phát triển")
                            },
                            {
                                title: "Quản lý thanh toán",
                                icon: "payment",
                                onPress: () => Alert.alert("Thông báo", "Chức năng quản lý thanh toán đang phát triển")
                            },
                            {
                                title: "Quản lý gói tập",
                                icon: "card-membership",
                                onPress: () => Alert.alert("Thông báo", "Chức năng quản lý gói tập đang phát triển")
                            },
                            {
                                title: "Cài đặt hệ thống",
                                icon: "settings-outline",
                                onPress: () => Alert.alert("Thông báo", "Chức năng cài đặt hệ thống đang phát triển")
                            }
                        ]
                    },
                    {
                        section: "Cài đặt",
                        items: commonSettingsItems
                    },
                    {
                        section: "Hỗ trợ",
                        items: commonSupportItems
                    }
                ];

            default:
                return [
                    {
                        section: "Tài khoản",
                        items: commonAccountItems
                    },
                    {
                        section: "Cài đặt",
                        items: commonSettingsItems
                    },
                    {
                        section: "Hỗ trợ",
                        items: commonSupportItems
                    }
                ];
        }
    };

    const menuItems = getMenuItemsByRole();

    const renderProfileHeader = () => {
        return (
            <View style={styles.profileHeaderContainer}>
                {/* Avatar with gradient border and edit button */}
                <View style={styles.avatarWrapper}>
                    <LinearGradient
                        colors={['#FFC9E9', '#F5F2B8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradientBorder}
                    >
                        <View style={styles.avatarInner}>
                            <Text style={styles.avatarText}>
                                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Edit button on avatar */}
                    <TouchableOpacity
                        style={styles.editButtonOnAvatar}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <MaterialIcons name="edit" size={16} color="#262135" />
                    </TouchableOpacity>
                </View>

                {/* Name */}
                <Text style={styles.profileName}>{userProfile.name || 'User Name'}</Text>

                {/* Weight and Height display */}
                {(userProfile.height || userProfile.weight) && (
                    <View style={styles.weightHeightContainer}>
                        {userProfile.height && (
                            <View style={styles.measurementItem}>
                                <Text style={styles.measurementValue}>{userProfile.height}</Text>
                                <Text style={styles.measurementUnit}>CM</Text>
                            </View>
                        )}
                        {userProfile.weight && (
                            <View style={styles.measurementItem}>
                                <Text style={styles.measurementValue}>{userProfile.weight}</Text>
                                <Text style={styles.measurementUnit}>KG</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderStatsCards = () => {
        switch (userRole) {
            // case 'HoiVien':
            //     return (
            //         <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
            //             <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            //                 <Text style={[styles.statValue, { color: colors.text }]}>{userProfile.totalWorkouts}</Text>
            //                 <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Buổi tập</Text>
            //             </View>
            //             <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            //                 <Text style={[styles.statValue, { color: colors.text }]}>{userProfile.currentStreak}</Text>
            //                 <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ngày streak</Text>
            //             </View>
            //             <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            //                 <Text style={[styles.statValue, { color: colors.text }]}>{userProfile.achievements}</Text>
            //                 <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thành tích</Text>
            //             </View>
            //         </View>
            //     );

            case 'PT':
                return (
                    <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Học viên</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>8</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Buổi hôm nay</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>4.8⭐</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đánh giá</Text>
                        </View>
                    </View>
                );

            case 'OngChu':
                return (
                    <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>156</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thành viên</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>8</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>PT</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>85%</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tỷ lệ lưu chân</Text>
                        </View>
                    </View>
                );

            default:
                return (
                    <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dữ liệu</Text>
                        </View>
                    </View>
                );
        }
    };


    const renderMenuItem = (item, index) => (
        <TouchableOpacity
            key={index}
            style={[
                styles.menuItem,
                {
                    backgroundColor: colors.card,
                    borderBottomColor: isDarkMode ? colors.border : 'transparent'
                }
            ]}
            onPress={item.onPress}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                    <Ionicons name={item.icon} size={20} color={colors.text} />
                </View>
                <View style={styles.menuItemContent}>
                    <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                    {item.subtitle && (
                        <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                    )}
                </View>
            </View>

            <View style={styles.menuItemRight}>
                {item.hasSwitch ? (
                    <Switch
                        value={item.switchValue}
                        onValueChange={item.onSwitchChange}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={item.switchValue ? '#fff' : '#f4f3f4'}
                    />
                ) : (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={colors.textMuted} />
                )}
            </View>
        </TouchableOpacity>
    );

    const renderMenuSection = (section) => (
        <View key={section.section} style={[styles.menuSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{section.section}</Text>
            <View style={styles.menuItems}>
                {Array.isArray(section.items) ? section.items.map(renderMenuItem) : null}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[
                styles.header,
                {
                    backgroundColor: colors.background,
                    borderBottomColor: isDarkMode ? colors.borderLight : 'transparent'
                }
            ]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Cá nhân</Text>
                <TouchableOpacity style={[styles.settingsButton, { backgroundColor: colors.card }]}>
                    <MaterialIcons name="settings" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderProfileHeader()}

                {menuItems.map(renderMenuSection)}

                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color={colors.primary} />
                    <Text style={[styles.logoutText, { color: colors.primary }]}>Đăng xuất</Text>
                </TouchableOpacity>

                <View style={styles.appInfo}>
                    <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Billions Gym v1.0.0</Text>
                    <Text style={[styles.appCopyright, { color: colors.textMuted }]}>© 2024 Billions Gym. All rights reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

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
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    settingsButton: {
        padding: 8,
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    // New Profile Header Styles matching Figma
    profileHeaderContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarGradientBorder: {
        width: 174,
        height: 174,
        borderRadius: 87,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: '#262135',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    editButtonOnAvatar: {
        position: 'absolute',
        bottom: 10,
        right: 0,
        width: 31,
        height: 31,
        borderRadius: 15.5,
        backgroundColor: '#F5F2B8',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'MontserratAlternates-SemiBold', // May need to install font
        marginBottom: 12,
        textAlign: 'center',
    },
    weightHeightContainer: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    measurementItem: {
        alignItems: 'center',
    },
    measurementValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    measurementUnit: {
        fontSize: 10,
        color: '#FFFFFF',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        paddingVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statCard: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    menuSection: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    menuSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    menuItems: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemContent: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    menuItemSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    menuItemRight: {
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 20,
    },
    appVersion: {
        fontSize: 14,
        marginBottom: 4,
    },
    appCopyright: {
        fontSize: 12,
    },
});

export default ProfileScreen;
