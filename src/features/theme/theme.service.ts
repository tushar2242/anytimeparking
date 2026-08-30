import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useThemeStore = create(
    combine(
        {
            isDarkMode: false,
        },
        (set) => ({
            loadTheme: async () => {
                try {
                    const storedTheme = await AsyncStorage.getItem('theme');
                    if (storedTheme === 'dark') {
                        set({ isDarkMode: true });
                    } else {
                        set({ isDarkMode: false });
                    }
                } catch (error) {
                    console.error('Failed to load theme:', error);
                }
            },
            toggleTheme: async () => {
                try {
                    set((state) => {
                        const nextMode = !state.isDarkMode;
                        AsyncStorage.setItem('theme', nextMode ? 'dark' : 'light');
                        return { isDarkMode: nextMode };
                    });
                } catch (error) {
                    console.error('Failed to toggle theme:', error);
                }
            },
        })
    )
);

export default useThemeStore;
