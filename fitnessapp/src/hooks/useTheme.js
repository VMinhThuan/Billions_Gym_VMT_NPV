import { useContext } from 'react';
import { ThemeContext } from '../store/ThemeContext';

const DEFAULT_COLORS = {
    background: '#ffffff',
    surface: '#ffffff',
    card: '#f8f9fa',
    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    primary: '#DA2128',
    primaryLight: '#e74c3c',
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
};

const DEFAULT_THEME = {
    isDarkMode: false,
    toggleTheme: () => {
        console.log('toggleTheme fallback called');
    },
    colors: { ...DEFAULT_COLORS }
};

export { DEFAULT_THEME };

// Completely safe function to get colors - always returns a valid object
const getSafeColors = (contextColors) => {
    // If no colors provided, return defaults
    if (!contextColors || typeof contextColors !== 'object') {
        return { ...DEFAULT_COLORS };
    }
    
    // Create a new object with all default properties, then override with context values
    const safeColors = {};
    
    // First, set all default properties
    Object.keys(DEFAULT_COLORS).forEach(key => {
        safeColors[key] = DEFAULT_COLORS[key];
    });
    
    // Then override with context values if they exist
    Object.keys(contextColors).forEach(key => {
        if (contextColors[key] != null) {
            safeColors[key] = contextColors[key];
        }
    });
    
    return safeColors;
};

export const useTheme = () => {
    let context;
    
    try {
        context = useContext(ThemeContext);
    } catch (error) {
        console.error('Error getting theme context:', error);
        context = null;
    }
    
    // If no context, return complete default theme
    if (!context) {
        console.warn('useTheme: No context available, using defaults');
        return {
            isDarkMode: false,
            toggleTheme: DEFAULT_THEME.toggleTheme,
            colors: getSafeColors(null)
        };
    }
    
    // Ensure we always return a complete theme object
    const safeTheme = {
        isDarkMode: Boolean(context.isDarkMode),
        toggleTheme: typeof context.toggleTheme === 'function' ? context.toggleTheme : DEFAULT_THEME.toggleTheme,
        colors: getSafeColors(context.colors)
    };
    
    return safeTheme;
};

export const useThemeFallback = () => {
    console.warn('Using fallback theme');
    return {
        isDarkMode: false,
        toggleTheme: () => {},
        colors: DEFAULT_COLORS,
    };
};
