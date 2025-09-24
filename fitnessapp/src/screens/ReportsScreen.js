import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('revenue'); // revenue, members, workouts, ai
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month'); // week, month, quarter, year
    const [reportData, setReportData] = useState({});

    useEffect(() => {
        fetchReportData();
    }, [activeTab, selectedPeriod]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Mock data for different report types
            const mockData = {
                revenue: {
                    totalRevenue: 45000000,
                    growthRate: 15.5,
                    membershipRevenue: 28000000,
                    ptRevenue: 17000000,
                    monthlyData: [
                        { month: 'T1', amount: 35000000 },
                        { month: 'T2', amount: 38000000 },
                        { month: 'T3', amount: 45000000 },
                    ],
                    topPackages: [
                        { name: 'Gói 3 tháng', revenue: 15000000, count: 50 },
                        { name: 'Gói PT 8 buổi', revenue: 12000000, count: 40 },
                        { name: 'Gói 6 tháng', revenue: 10000000, count: 28 },
                    ]
                },
                members: {
                    totalMembers: 245,
                    newMembers: 35,
                    activeMembers: 180,
                    retentionRate: 85.5,
                    churnRate: 14.5,
                    membershipTypes: [
                        { name: 'Gói 1 tháng', count: 45, percentage: 18.4 },
                        { name: 'Gói 3 tháng', count: 120, percentage: 49.0 },
                        { name: 'Gói 6 tháng', count: 65, percentage: 26.5 },
                        { name: 'Gói 12 tháng', count: 15, percentage: 6.1 },
                    ],
                    ageGroups: [
                        { range: '18-25', count: 75, percentage: 30.6 },
                        { range: '26-35', count: 95, percentage: 38.8 },
                        { range: '36-45', count: 50, percentage: 20.4 },
                        { range: '46+', count: 25, percentage: 10.2 },
                    ]
                },
                workouts: {
                    totalSessions: 1250,
                    completionRate: 92.5,
                    averageSessionDuration: 65,
                    popularWorkouts: [
                        { name: 'Cardio', sessions: 450, percentage: 36.0 },
                        { name: 'Strength Training', sessions: 380, percentage: 30.4 },
                        { name: 'HIIT', sessions: 220, percentage: 17.6 },
                        { name: 'Yoga', sessions: 200, percentage: 16.0 },
                    ],
                    ptSessions: {
                        total: 320,
                        completed: 295,
                        cancelled: 25,
                        completionRate: 92.2
                    },
                    peakHours: [
                        { hour: '6-7', sessions: 85 },
                        { hour: '7-8', sessions: 120 },
                        { hour: '8-9', sessions: 95 },
                        { hour: '18-19', sessions: 110 },
                        { hour: '19-20', sessions: 140 },
                        { hour: '20-21', sessions: 85 },
                    ]
                },
                ai: {
                    totalRecommendations: 156,
                    acceptanceRate: 78.5,
                    nutritionRecommendations: 85,
                    workoutRecommendations: 71,
                    averageAccuracy: 88.3,
                    topRecommendations: [
                        { type: 'Dinh dưỡng giảm cân', count: 45, accuracy: 92.1 },
                        { type: 'Lịch tập tăng cơ', count: 38, accuracy: 89.5 },
                        { type: 'Gói tập phù hợp', count: 32, accuracy: 85.2 },
                        { type: 'Thực đơn tăng cân', count: 25, accuracy: 87.8 },
                    ],
                    memberSatisfaction: 4.3,
                    aiUsageGrowth: 25.8
                }
            };

            setReportData(mockData);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchReportData();
        setRefreshing(false);
    };

    const renderPeriodSelector = () => (
        <View style={styles.periodSelector}>
            {[
                { key: 'week', label: 'Tuần' },
                { key: 'month', label: 'Tháng' },
                { key: 'quarter', label: 'Quý' },
                { key: 'year', label: 'Năm' }
            ].map((period) => (
                <TouchableOpacity
                    key={period.key}
                    style={[
                        styles.periodButton,
                        selectedPeriod === period.key && styles.activePeriod
                    ]}
                    onPress={() => setSelectedPeriod(period.key)}
                >
                    <Text style={[
                        styles.periodText,
                        selectedPeriod === period.key && styles.activePeriodText
                    ]}>
                        {period.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderTabButton = (tab, title, icon) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
        >
            <MaterialIcons
                name={icon}
                size={18}
                color={activeTab === tab ? '#DA2128' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const renderRevenueReport = () => {
        const data = reportData.revenue || {};
        return (
            <ScrollView style={styles.reportContent}>
                {/* Revenue Overview */}
                <View style={styles.overviewCard}>
                    <Text style={styles.cardTitle}>Tổng quan doanh thu</Text>
                    <View style={styles.overviewStats}>
                        <View style={styles.mainStat}>
                            <Text style={styles.mainStatValue}>
                                {data.totalRevenue?.toLocaleString() || '0'}đ
                            </Text>
                            <Text style={styles.mainStatLabel}>Doanh thu tháng này</Text>
                        </View>
                        <View style={styles.growthIndicator}>
                            <MaterialIcons
                                name="trending-up"
                                size={20}
                                color="#4CAF50"
                            />
                            <Text style={styles.growthText}>+{data.growthRate || 0}%</Text>
                        </View>
                    </View>

                    <View style={styles.revenueBreakdown}>
                        <View style={styles.revenueItem}>
                            <Text style={styles.revenueLabel}>Gói tập</Text>
                            <Text style={styles.revenueValue}>
                                {data.membershipRevenue?.toLocaleString() || '0'}đ
                            </Text>
                        </View>
                        <View style={styles.revenueItem}>
                            <Text style={styles.revenueLabel}>PT</Text>
                            <Text style={styles.revenueValue}>
                                {data.ptRevenue?.toLocaleString() || '0'}đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Monthly Trend */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Xu hướng theo tháng</Text>
                    <View style={styles.chartContainer}>
                        {data.monthlyData?.map((item, index) => (
                            <View key={index} style={styles.chartItem}>
                                <View style={[
                                    styles.chartBar,
                                    { height: (item.amount / 50000000) * 100 }
                                ]} />
                                <Text style={styles.chartLabel}>{item.month}</Text>
                                <Text style={styles.chartValue}>
                                    {(item.amount / 1000000).toFixed(0)}M
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Packages */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Gói tập bán chạy</Text>
                    {data.topPackages?.map((package_, index) => (
                        <View key={index} style={styles.listItem}>
                            <View style={styles.listItemInfo}>
                                <Text style={styles.listItemName}>{package_.name}</Text>
                                <Text style={styles.listItemSubtext}>
                                    {package_.count} gói đã bán
                                </Text>
                            </View>
                            <Text style={styles.listItemValue}>
                                {package_.revenue.toLocaleString()}đ
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderMembersReport = () => {
        const data = reportData.members || {};
        return (
            <ScrollView style={styles.reportContent}>
                {/* Members Overview */}
                <View style={styles.overviewCard}>
                    <Text style={styles.cardTitle}>Tổng quan thành viên</Text>
                    <View style={styles.membersStats}>
                        <View style={styles.memberStat}>
                            <Text style={styles.memberStatValue}>{data.totalMembers || 0}</Text>
                            <Text style={styles.memberStatLabel}>Tổng thành viên</Text>
                        </View>
                        <View style={styles.memberStat}>
                            <Text style={[styles.memberStatValue, { color: '#4CAF50' }]}>
                                {data.newMembers || 0}
                            </Text>
                            <Text style={styles.memberStatLabel}>Thành viên mới</Text>
                        </View>
                        <View style={styles.memberStat}>
                            <Text style={[styles.memberStatValue, { color: '#2196F3' }]}>
                                {data.activeMembers || 0}
                            </Text>
                            <Text style={styles.memberStatLabel}>Đang hoạt động</Text>
                        </View>
                    </View>

                    <View style={styles.retentionStats}>
                        <View style={styles.retentionItem}>
                            <Text style={styles.retentionLabel}>Tỷ lệ giữ chân</Text>
                            <Text style={[styles.retentionValue, { color: '#4CAF50' }]}>
                                {data.retentionRate || 0}%
                            </Text>
                        </View>
                        <View style={styles.retentionItem}>
                            <Text style={styles.retentionLabel}>Tỷ lệ rời bỏ</Text>
                            <Text style={[styles.retentionValue, { color: '#F44336' }]}>
                                {data.churnRate || 0}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Membership Types */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Phân bố loại gói tập</Text>
                    {data.membershipTypes?.map((type, index) => (
                        <View key={index} style={styles.percentageItem}>
                            <View style={styles.percentageInfo}>
                                <Text style={styles.percentageName}>{type.name}</Text>
                                <Text style={styles.percentageCount}>{type.count} thành viên</Text>
                            </View>
                            <View style={styles.percentageBar}>
                                <View style={[
                                    styles.percentageFill,
                                    { width: `${type.percentage}%` }
                                ]} />
                            </View>
                            <Text style={styles.percentageValue}>{type.percentage}%</Text>
                        </View>
                    ))}
                </View>

                {/* Age Groups */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Phân bố độ tuổi</Text>
                    {data.ageGroups?.map((group, index) => (
                        <View key={index} style={styles.percentageItem}>
                            <View style={styles.percentageInfo}>
                                <Text style={styles.percentageName}>{group.range} tuổi</Text>
                                <Text style={styles.percentageCount}>{group.count} người</Text>
                            </View>
                            <View style={styles.percentageBar}>
                                <View style={[
                                    styles.percentageFill,
                                    { width: `${group.percentage}%`, backgroundColor: '#2196F3' }
                                ]} />
                            </View>
                            <Text style={styles.percentageValue}>{group.percentage}%</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderWorkoutsReport = () => {
        const data = reportData.workouts || {};
        return (
            <ScrollView style={styles.reportContent}>
                {/* Workout Overview */}
                <View style={styles.overviewCard}>
                    <Text style={styles.cardTitle}>Tổng quan tập luyện</Text>
                    <View style={styles.workoutStats}>
                        <View style={styles.workoutStat}>
                            <Text style={styles.workoutStatValue}>{data.totalSessions || 0}</Text>
                            <Text style={styles.workoutStatLabel}>Tổng buổi tập</Text>
                        </View>
                        <View style={styles.workoutStat}>
                            <Text style={[styles.workoutStatValue, { color: '#4CAF50' }]}>
                                {data.completionRate || 0}%
                            </Text>
                            <Text style={styles.workoutStatLabel}>Tỷ lệ hoàn thành</Text>
                        </View>
                        <View style={styles.workoutStat}>
                            <Text style={[styles.workoutStatValue, { color: '#FF9800' }]}>
                                {data.averageSessionDuration || 0}'
                            </Text>
                            <Text style={styles.workoutStatLabel}>Thời gian TB</Text>
                        </View>
                    </View>
                </View>

                {/* Popular Workouts */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Loại tập phổ biến</Text>
                    {data.popularWorkouts?.map((workout, index) => (
                        <View key={index} style={styles.percentageItem}>
                            <View style={styles.percentageInfo}>
                                <Text style={styles.percentageName}>{workout.name}</Text>
                                <Text style={styles.percentageCount}>{workout.sessions} buổi</Text>
                            </View>
                            <View style={styles.percentageBar}>
                                <View style={[
                                    styles.percentageFill,
                                    { width: `${workout.percentage}%`, backgroundColor: '#FF9800' }
                                ]} />
                            </View>
                            <Text style={styles.percentageValue}>{workout.percentage}%</Text>
                        </View>
                    ))}
                </View>

                {/* PT Sessions */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Buổi tập PT</Text>
                    <View style={styles.ptStats}>
                        <View style={styles.ptStatItem}>
                            <Text style={styles.ptStatValue}>{data.ptSessions?.total || 0}</Text>
                            <Text style={styles.ptStatLabel}>Tổng buổi</Text>
                        </View>
                        <View style={styles.ptStatItem}>
                            <Text style={[styles.ptStatValue, { color: '#4CAF50' }]}>
                                {data.ptSessions?.completed || 0}
                            </Text>
                            <Text style={styles.ptStatLabel}>Hoàn thành</Text>
                        </View>
                        <View style={styles.ptStatItem}>
                            <Text style={[styles.ptStatValue, { color: '#F44336' }]}>
                                {data.ptSessions?.cancelled || 0}
                            </Text>
                            <Text style={styles.ptStatLabel}>Đã hủy</Text>
                        </View>
                        <View style={styles.ptStatItem}>
                            <Text style={[styles.ptStatValue, { color: '#2196F3' }]}>
                                {data.ptSessions?.completionRate || 0}%
                            </Text>
                            <Text style={styles.ptStatLabel}>Tỷ lệ thành công</Text>
                        </View>
                    </View>
                </View>

                {/* Peak Hours */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Giờ cao điểm</Text>
                    <View style={styles.peakHoursChart}>
                        {data.peakHours?.map((hour, index) => (
                            <View key={index} style={styles.peakHourItem}>
                                <View style={[
                                    styles.peakHourBar,
                                    { height: (hour.sessions / 150) * 80 }
                                ]} />
                                <Text style={styles.peakHourLabel}>{hour.hour}</Text>
                                <Text style={styles.peakHourValue}>{hour.sessions}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderAIReport = () => {
        const data = reportData.ai || {};
        return (
            <ScrollView style={styles.reportContent}>
                {/* AI Overview */}
                <View style={styles.overviewCard}>
                    <Text style={styles.cardTitle}>Tổng quan AI</Text>
                    <View style={styles.aiStats}>
                        <View style={styles.aiStat}>
                            <Text style={styles.aiStatValue}>{data.totalRecommendations || 0}</Text>
                            <Text style={styles.aiStatLabel}>Gợi ý tạo ra</Text>
                        </View>
                        <View style={styles.aiStat}>
                            <Text style={[styles.aiStatValue, { color: '#4CAF50' }]}>
                                {data.acceptanceRate || 0}%
                            </Text>
                            <Text style={styles.aiStatLabel}>Tỷ lệ chấp nhận</Text>
                        </View>
                        <View style={styles.aiStat}>
                            <Text style={[styles.aiStatValue, { color: '#FF9800' }]}>
                                {data.averageAccuracy || 0}%
                            </Text>
                            <Text style={styles.aiStatLabel}>Độ chính xác TB</Text>
                        </View>
                    </View>

                    <View style={styles.aiBreakdown}>
                        <View style={styles.aiBreakdownItem}>
                            <Text style={styles.aiBreakdownLabel}>Gợi ý dinh dưỡng</Text>
                            <Text style={styles.aiBreakdownValue}>
                                {data.nutritionRecommendations || 0}
                            </Text>
                        </View>
                        <View style={styles.aiBreakdownItem}>
                            <Text style={styles.aiBreakdownLabel}>Gợi ý tập luyện</Text>
                            <Text style={styles.aiBreakdownValue}>
                                {data.workoutRecommendations || 0}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Top AI Recommendations */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Gợi ý AI phổ biến</Text>
                    {data.topRecommendations?.map((rec, index) => (
                        <View key={index} style={styles.aiRecItem}>
                            <View style={styles.aiRecInfo}>
                                <Text style={styles.aiRecName}>{rec.type}</Text>
                                <Text style={styles.aiRecCount}>{rec.count} lần sử dụng</Text>
                            </View>
                            <View style={styles.aiRecAccuracy}>
                                <Text style={styles.aiRecAccuracyValue}>{rec.accuracy}%</Text>
                                <Text style={styles.aiRecAccuracyLabel}>Chính xác</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* AI Performance */}
                <View style={styles.reportCard}>
                    <Text style={styles.cardTitle}>Hiệu suất AI</Text>
                    <View style={styles.performanceStats}>
                        <View style={styles.performanceItem}>
                            <View style={styles.performanceIcon}>
                                <MaterialIcons name="star" size={24} color="#FFD700" />
                            </View>
                            <View style={styles.performanceInfo}>
                                <Text style={styles.performanceValue}>
                                    {data.memberSatisfaction || 0}/5
                                </Text>
                                <Text style={styles.performanceLabel}>Đánh giá từ thành viên</Text>
                            </View>
                        </View>
                        <View style={styles.performanceItem}>
                            <View style={styles.performanceIcon}>
                                <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.performanceInfo}>
                                <Text style={styles.performanceValue}>
                                    +{data.aiUsageGrowth || 0}%
                                </Text>
                                <Text style={styles.performanceLabel}>Tăng trưởng sử dụng</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DA2128" />
                    <Text style={styles.loadingText}>Đang tạo báo cáo...</Text>
                </View>
            );
        }

        switch (activeTab) {
            case 'revenue':
                return renderRevenueReport();
            case 'members':
                return renderMembersReport();
            case 'workouts':
                return renderWorkoutsReport();
            case 'ai':
                return renderAIReport();
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Báo cáo thống kê</Text>
                <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => {
                        // TODO: Export report functionality
                        Alert.alert('Xuất báo cáo', 'Chức năng xuất báo cáo sẽ được cập nhật');
                    }}
                >
                    <MaterialIcons name="download" size={24} color="#DA2128" />
                </TouchableOpacity>
            </View>

            {/* Period Selector */}
            {renderPeriodSelector()}

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {renderTabButton('revenue', 'Doanh thu', 'attach-money')}
                {renderTabButton('members', 'Thành viên', 'people')}
                {renderTabButton('workouts', 'Tập luyện', 'fitness-center')}
                {renderTabButton('ai', 'AI', 'psychology')}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                >
                    {renderContent()}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    exportButton: {
        padding: 5,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
        marginHorizontal: 2,
    },
    activePeriod: {
        backgroundColor: '#DA2128',
    },
    periodText: {
        fontSize: 14,
        color: '#666',
    },
    activePeriodText: {
        color: 'white',
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 6,
        marginHorizontal: 2,
    },
    activeTab: {
        backgroundColor: '#f5f5f5',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    activeTabText: {
        color: '#DA2128',
        fontWeight: '500',
    },
    contentContainer: {
        flex: 1,
    },
    reportContent: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    overviewCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reportCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    overviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    mainStat: {
        flex: 1,
    },
    mainStatValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#DA2128',
        marginBottom: 4,
    },
    mainStatLabel: {
        fontSize: 14,
        color: '#666',
    },
    growthIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    growthText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 4,
    },
    revenueBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    revenueItem: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    revenueLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    revenueValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 120,
        marginVertical: 10,
    },
    chartItem: {
        alignItems: 'center',
        flex: 1,
    },
    chartBar: {
        backgroundColor: '#DA2128',
        width: 30,
        borderRadius: 4,
        marginBottom: 8,
    },
    chartLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    chartValue: {
        fontSize: 10,
        color: '#999',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    listItemInfo: {
        flex: 1,
    },
    listItemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    listItemSubtext: {
        fontSize: 12,
        color: '#666',
    },
    listItemValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#DA2128',
    },
    membersStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    memberStat: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    memberStatValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    memberStatLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    retentionStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
    },
    retentionItem: {
        flex: 1,
        alignItems: 'center',
    },
    retentionLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    retentionValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    percentageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    percentageInfo: {
        width: 120,
    },
    percentageName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    percentageCount: {
        fontSize: 12,
        color: '#666',
    },
    percentageBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginHorizontal: 10,
    },
    percentageFill: {
        height: '100%',
        backgroundColor: '#DA2128',
        borderRadius: 4,
    },
    percentageValue: {
        width: 40,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'right',
    },
    workoutStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    workoutStat: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    workoutStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    workoutStatLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    ptStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    ptStatItem: {
        width: '48%',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 10,
    },
    ptStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    ptStatLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    peakHoursChart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 100,
        marginVertical: 10,
    },
    peakHourItem: {
        alignItems: 'center',
        flex: 1,
    },
    peakHourBar: {
        backgroundColor: '#2196F3',
        width: 20,
        borderRadius: 2,
        marginBottom: 8,
    },
    peakHourLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    peakHourValue: {
        fontSize: 10,
        color: '#999',
    },
    aiStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    aiStat: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
    },
    aiStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    aiStatLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    aiBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
    },
    aiBreakdownItem: {
        flex: 1,
        alignItems: 'center',
    },
    aiBreakdownLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    aiBreakdownValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    aiRecItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    aiRecInfo: {
        flex: 1,
    },
    aiRecName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    aiRecCount: {
        fontSize: 12,
        color: '#666',
    },
    aiRecAccuracy: {
        alignItems: 'center',
    },
    aiRecAccuracyValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 2,
    },
    aiRecAccuracyLabel: {
        fontSize: 10,
        color: '#666',
    },
    performanceStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    performanceItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginHorizontal: 5,
    },
    performanceIcon: {
        marginRight: 10,
    },
    performanceInfo: {
        flex: 1,
    },
    performanceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    performanceLabel: {
        fontSize: 12,
        color: '#666',
    },
});

export default ReportsScreen;
