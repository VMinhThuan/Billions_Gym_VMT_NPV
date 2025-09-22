import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Load theme preference from storage
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = !isDarkMode;
            setIsDarkMode(newTheme);
            await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    // Ensure we always provide a complete and safe theme object
    const theme = {
        isDarkMode: Boolean(isDarkMode),
        toggleTheme,
        colors: {
            // Background colors
            background: isDarkMode ? '#141414' : '#ffffff',
            surface: isDarkMode ? '#1f1f1f' : '#ffffff',
            card: isDarkMode ? '#2a2a2a' : '#f8f9fa',

            // Text colors
            text: isDarkMode ? '#ffffff' : '#000000',
            textSecondary: isDarkMode ? '#cccccc' : '#666666',
            textMuted: isDarkMode ? '#999999' : '#999999',

            // Primary colors
            primary: '#DA2128',
            primaryLight: isDarkMode ? '#ff4757' : '#e74c3c',

            // Border colors
            border: isDarkMode ? '#333333' : '#e0e0e0',
            borderLight: isDarkMode ? '#2a2a2a' : '#f0f0f0',

            // Status colors
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db',

            // Shadow colors
            shadow: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
            shadowLight: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
        }
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};
