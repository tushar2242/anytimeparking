import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/src/features/theme/theme.service';

export default function BottomTabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const isDarkMode = useThemeStore().isDarkMode;

    const isDashboardActive = pathname === '/' || pathname === '/home';
    const isQRActive = pathname.includes('/card-parking');
    const isOrdersActive = pathname.includes('/my-order');
    const isProfileActive = pathname.includes('/profile');

    const handlePress = (route: string) => {
        router.push(route as any);
    };

    const activeColor = '#0066FF'; // Premium Blue active color
    const requestColor = '#FF851B'; // Orange for Request
    const inactiveColor = isDarkMode ? '#8E8E93' : '#1C1C1E'; // Dark grey/black for light mode, lighter for dark mode

    const getTabColor = (isActive: boolean, isRequest: boolean) => {
        if (isRequest) {
            return requestColor;
        }
        return isActive ? activeColor : inactiveColor;
    };

    return (
        <View style={[styles.tabBarContainer, isDarkMode ? styles.darkTabBar : styles.lightTabBar]}>
            {/* Tab 1: Dashboard */}
            <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => handlePress('/')}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={isDashboardActive ? "home" : "home-outline"} 
                    size={24} 
                    color={getTabColor(isDashboardActive, false)} 
                />
                <Text style={[
                    styles.tabLabel, 
                    { color: getTabColor(isDashboardActive, false) }
                ]}>
                    Dashboard
                </Text>
            </TouchableOpacity>

            {/* Tab 2: Request */}
            <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => handlePress('/card-parking')}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={isQRActive ? "clipboard" : "clipboard-outline"} 
                    size={24} 
                    color={getTabColor(isQRActive, true)} 
                />
                <Text style={[
                    styles.tabLabel, 
                    { color: getTabColor(isQRActive, true) }
                ]}>
                    Request
                </Text>
            </TouchableOpacity>

            {/* Tab 3: My Orders */}
            <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => handlePress('/my-order')}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={isOrdersActive ? "document-text" : "document-text-outline"} 
                    size={24} 
                    color={getTabColor(isOrdersActive, false)} 
                />
                <Text style={[
                    styles.tabLabel, 
                    { color: getTabColor(isOrdersActive, false) }
                ]}>
                    My Orders
                </Text>
            </TouchableOpacity>

            {/* Tab 4: Profile */}
            <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => handlePress('/profile')}
                activeOpacity={0.7}
            >
                <Ionicons 
                    name={isProfileActive ? "person" : "person-outline"} 
                    size={24} 
                    color={getTabColor(isProfileActive, false)} 
                />
                <Text style={[
                    styles.tabLabel, 
                    { color: getTabColor(isProfileActive, false) }
                ]}>
                    Profile
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
        height: 74,
        borderTopWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: Platform.OS === 'ios' ? 14 : 6,
        paddingTop: 6,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    lightTabBar: {
        backgroundColor: '#ffffff',
        borderTopColor: '#f1f3f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 12,
    },
    darkTabBar: {
        backgroundColor: '#1c1c1e',
        borderTopColor: '#2c2c2e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 12,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
});
