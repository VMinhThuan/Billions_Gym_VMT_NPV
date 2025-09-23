import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

const ChartContainer = ({ title, children, style }) => {
    const themeContext = useTheme();
    const colors = themeContext.colors;

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
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
        fontWeight: 'bold',
        marginBottom: 15,
    },
    chartContent: {
        borderRadius: 12,
        padding: 16,
        minHeight: 200,
    },
});

export default ChartContainer;
