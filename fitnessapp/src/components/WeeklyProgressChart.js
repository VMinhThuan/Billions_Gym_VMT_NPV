import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const chartWidth = width - 80; 

const WeeklyProgressChart = ({ data = [] }) => {
    const { colors } = useTheme();

    const weeklyData = data.length > 0 ? data : [
        { day: 'T2', workouts: 1, calories: 450 },
        { day: 'T3', workouts: 2, calories: 650 },
        { day: 'T4', workouts: 0, calories: 200 },
        { day: 'T5', workouts: 3, calories: 800 },
        { day: 'T6', workouts: 1, calories: 400 },
        { day: 'T7', workouts: 2, calories: 600 },
        { day: 'CN', workouts: 1, calories: 350 }
    ];

    const maxWorkouts = Math.max(...(weeklyData || []).map(d => d.workouts || 0), 1);
    const maxCalories = Math.max(...(weeklyData || []).map(d => d.calories || 0), 1);

    const renderBar = (item, index) => {
        const workoutHeight = (item.workouts / maxWorkouts) * 120;
        const calorieHeight = (item.calories / maxCalories) * 120;

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
                <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{item.day}</Text>
            </View>
        );
    };

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
                    {(weeklyData || []).map(renderBar)}
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <MaterialIcons name="fitness-center" size={16} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                        {(weeklyData || []).reduce((sum, d) => sum + (d.workouts || 0), 0)} buổi tập
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialIcons name="flash-on" size={16} color={colors.info} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                        {(weeklyData || []).reduce((sum, d) => sum + (d.calories || 0), 0).toLocaleString()} cal
                    </Text>
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
        height: 160,
        justifyContent: 'flex-end',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 120,
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
        width: 16,
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    workoutBar: {
        width: '100%',
        borderRadius: 8,
    },
    calorieBar: {
        width: '100%',
        borderRadius: 8,
    },
    barValue: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '500',
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
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default WeeklyProgressChart;
