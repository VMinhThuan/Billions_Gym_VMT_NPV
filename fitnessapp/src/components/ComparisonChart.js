import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ComparisonChart = ({ data = [] }) => {
    const themeContext = useTheme();
    const colors = themeContext.colors;

    // Generate sample data if none provided
    const comparisonData = data.length > 0 ? data : [
        { week: 'Tuần 1', workouts: 8, calories: 3200 },
        { week: 'Tuần 2', workouts: 12, calories: 4500 },
        { week: 'Tuần 3', workouts: 10, calories: 3800 },
        { week: 'Tuần 4', workouts: 15, calories: 5200 },
    ];

    const maxWorkouts = Math.max(...(comparisonData || []).map(d => d.workouts || 0), 1);
    const maxCalories = Math.max(...(comparisonData || []).map(d => d.calories || 0), 1);

    const renderBar = (item, index) => {
        const workoutHeight = (item.workouts / maxWorkouts) * 100;
        const calorieHeight = (item.calories / maxCalories) * 100;

        return (
            <View key={index} style={styles.barContainer}>
                <View style={styles.barsWrapper}>
                    {/* Workout Bar */}
                    <View style={styles.barWrapper}>
                        <View style={styles.barBackground}>
                            <View
                                style={[
                                    styles.workoutBar,
                                    {
                                        height: workoutHeight,
                                        backgroundColor: colors.primary
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.barValue, { color: colors.text }]}>{item.workouts}</Text>
                    </View>

                    {/* Calorie Bar */}
                    <View style={styles.barWrapper}>
                        <View style={styles.barBackground}>
                            <View
                                style={[
                                    styles.calorieBar,
                                    {
                                        height: calorieHeight,
                                        backgroundColor: colors.info
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.barValue, { color: colors.text }]}>{item.calories}</Text>
                    </View>
                </View>
                <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{item.week}</Text>
            </View>
        );
    };

    const totalWorkouts = (comparisonData || []).reduce((sum, d) => sum + (d.workouts || 0), 0);
    const totalCalories = (comparisonData || []).reduce((sum, d) => sum + (d.calories || 0), 0);
    const avgWorkouts = Math.round(totalWorkouts / Math.max(comparisonData?.length || 1, 1));
    const avgCalories = Math.round(totalCalories / Math.max(comparisonData?.length || 1, 1));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.legend}>
                    <View style={[styles.legendItem, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>Buổi tập</Text>
                </View>
                <View style={styles.legend}>
                    <View style={[styles.legendItem, { backgroundColor: colors.info }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>Calories</Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <View style={styles.barsContainer}>
                    {(comparisonData || []).map(renderBar)}
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <MaterialIcons name="trending-up" size={16} color={colors.success} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trung bình:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{avgWorkouts} buổi/tuần</Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialIcons name="flash-on" size={16} color={colors.info} />
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{avgCalories.toLocaleString()}/tuần</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 20,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendItem: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '500',
    },
    chartContainer: {
        height: 140,
        justifyContent: 'flex-end',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 100,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barsWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
        marginBottom: 8,
    },
    barWrapper: {
        alignItems: 'center',
    },
    barBackground: {
        width: 20,
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 10,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    workoutBar: {
        width: '100%',
        borderRadius: 10,
    },
    calorieBar: {
        width: '100%',
        borderRadius: 10,
    },
    barValue: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    weekLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginLeft: 4,
        marginRight: 4,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ComparisonChart;
