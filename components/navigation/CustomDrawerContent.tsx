import React from 'react'
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'
import { View, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'
import { useAuth } from '@/src/context/AuthContext'

export default function CustomDrawerContent(props: any) {

    const router = useRouter()
    const pathname = usePathname()
    const themeStore = useThemeStore()
    const isDarkMode = themeStore.isDarkMode
    const { logout } = useAuth()

    const isActive = (route: string) => pathname === route

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout()
                        } catch (error) {
                            console.error('Logout failed:', error)
                        }
                    }
                }
            ]
        )
    }

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, backgroundColor: isDarkMode ? '#1c1c1e' : '#fff' }}>
            <View style={styles.container}>
                <View style={styles.menu}>

                    <DrawerItem
                        label="Home"
                        focused={isActive('/') || isActive('/home')}
                        labelStyle={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}
                        activeTintColor={isDarkMode ? '#0A84FF' : '#484849'}
                        inactiveTintColor={isDarkMode ? '#a0a0a0' : '#444'}
                        activeBackgroundColor={isDarkMode ? '#2c2c2e' : '#eee'}
                        icon={({ color, size }) => (
                            <Ionicons name="home-outline" color={color} size={size} />
                        )}
                        onPress={() => router.push('/' as any)}
                    />

                    <DrawerItem
                        label="My Profile"
                        focused={isActive('/profile')}
                        labelStyle={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}
                        activeTintColor={isDarkMode ? '#0A84FF' : '#484849'}
                        inactiveTintColor={isDarkMode ? '#a0a0a0' : '#444'}
                        activeBackgroundColor={isDarkMode ? '#2c2c2e' : '#eee'}
                        icon={({ color, size }) => (
                            <Ionicons name="person-outline" color={color} size={size} />
                        )}
                        onPress={() => router.push('/profile' as any)}
                    />

                    <DrawerItem
                        label="QR Parking"
                        focused={isActive('/card-parking')}
                        labelStyle={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}
                        activeTintColor={isDarkMode ? '#0A84FF' : '#484849'}
                        inactiveTintColor={isDarkMode ? '#a0a0a0' : '#444'}
                        activeBackgroundColor={isDarkMode ? '#2c2c2e' : '#eee'}
                        icon={({ color, size }) => (
                            <Ionicons name="qr-code-outline" color={color} size={size} />
                        )}
                        onPress={() => router.push('/card-parking' as any)}
                    />

                    <DrawerItem
                        label="Recent Tickets"
                        focused={isActive('/recent-tickets')}
                        labelStyle={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}
                        activeTintColor={isDarkMode ? '#0A84FF' : '#484849'}
                        inactiveTintColor={isDarkMode ? '#a0a0a0' : '#444'}
                        activeBackgroundColor={isDarkMode ? '#2c2c2e' : '#eee'}
                        icon={({ color, size }) => (
                            <Ionicons name="receipt-outline" color={color} size={size} />
                        )}
                        onPress={() => router.push('/recent-tickets' as any)}
                    />

                </View>

                <View style={[styles.footer, { borderTopColor: isDarkMode ? '#38383a' : '#e0e0e0' }]}>
                    <DrawerItem
                        label="Log Out"
                        labelStyle={[styles.label, { color: isDarkMode ? '#FF453A' : '#D32F2F', fontWeight: '600' }]}
                        activeTintColor={isDarkMode ? '#FF453A' : '#D32F2F'}
                        inactiveTintColor={isDarkMode ? '#FF453A' : '#D32F2F'}
                        icon={({ color, size }) => (
                            <Ionicons name="log-out-outline" color={color} size={size} />
                        )}
                        onPress={handleLogout}
                    />
                </View>
            </View>
        </DrawerContentScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    menu: {
        paddingVertical: 20,
    },
    footer: {
        paddingVertical: 15,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    label: {
        fontSize: 16,
    }
})
