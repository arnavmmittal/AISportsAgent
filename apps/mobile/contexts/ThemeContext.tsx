import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';
import { getThemeColors } from '@/constants/theme';

type Theme = 'light' | 'dark';
type ThemeColors = ReturnType<typeof getThemeColors>;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDarkMode: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Role-based default: coaches get light, athletes get dark
        const userRole = await SecureStore.getItemAsync('user_role');
        if (userRole === 'COACH') {
          setTheme('light');
        } else if (userRole === 'ATHLETE') {
          setTheme('dark');
        } else {
          // Fallback to system preference
          const colorScheme = Appearance.getColorScheme();
          setTheme(colorScheme === 'dark' ? 'dark' : 'light');
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Always render the provider — use default 'dark' until preferences load
  // (returning <>{children}</> without provider causes useTheme to crash)
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode: theme === 'dark', colors: getThemeColors(theme === 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
