import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GoalProgressChart = ({ current = 0, target = 100, title = "Mục tiêu", unit = "" }) => {
    const { colors } = useTheme();

    const percentage = Math.min((current / target) * 100, 100);
    const radius = 60;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getProgressColor = () => {
        if (percentage >= 100) return colors.success;
        if (percentage >= 75) return colors.warning;
        return colors.primary;
    };

    const getProgressText = () => {
        if (percentage >= 100) return "Hoàn thành!";
        if (percentage >= 75) return "Sắp đạt mục tiêu!";
        if (percentage >= 50) return "Đang tiến bộ tốt";
        return "Tiếp tục cố gắng!";
    };

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <View style={styles.circleContainer}>
                    {/* Background Circle */}
                    <View style={[styles.circle, { borderColor: colors.border }]}>
                        {/* Progress Circle using multiple segments for smooth animation */}
                        <View style={styles.progressContainer}>
                            {Array.from({ length: 100 }, (_, i) => {
                                const segmentPercentage = (i + 1) / 100;
                                const isActive = segmentPercentage <= percentage / 100;
                                const angle = (i * 360) / 100;

                                return (
                                    <View
                                        key={i}
                                        style={[
                                            styles.progressSegment,
                                            {
                                                transform: [{ rotate: `${angle}deg` }],
                                                opacity: isActive ? 1 : 0,
                                            }
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.progressBar,
                                                {
                                                    backgroundColor: getProgressColor(),
                                                    width: strokeWidth,
                                                    height: radius * 2,
                                                    borderRadius: strokeWidth / 2,
                                                }
                                            ]}
                                        />
                                    </View>
                                );
                            })}
                        </View>

                        {/* Center Content */}
                        <View style={styles.centerContent}>
                            <Text style={[styles.percentage, { color: colors.text }]}>
                                {Math.round(percentage)}%
                            </Text>
                            <Text style={[styles.value, { color: colors.textSecondary }]}>
                                {current}{unit}
                            </Text>
                            <Text style={[styles.target, { color: colors.textMuted }]}>
                                / {target}{unit}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.progressText, { color: getProgressColor() }]}>
                    {getProgressText()}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    circleContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    progressSegment: {
        position: 'absolute',
        width: 70,
        height: 70,
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    progressBar: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    centerContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    percentage: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    target: {
        fontSize: 12,
    },
    infoContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default GoalProgressChart;
