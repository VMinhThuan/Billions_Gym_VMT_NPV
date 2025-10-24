import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import CustomText from './CustomText';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

const ChartContainer = ({ title, children, style }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
            <CustomText style={[styles.title, { color: colors.text }]}>{title}</CustomText>
            <View style={[styles.chartContent, { backgroundColor: colors.card }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 15,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: 'normal',
        marginBottom: 15,
    },
    chartContent: {
        borderRadius: 12,
        padding: 16,
        minHeight: 200,
    },
});

export default ChartContainer;
