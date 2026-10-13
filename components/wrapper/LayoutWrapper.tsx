import React, { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'
import { useAuth } from '@/src/context/AuthContext'

export default function LayoutWrapper({ children }: {
    children: React.ReactNode
}) {
    const isDarkMode = useThemeStore().isDarkMode
    const { token, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !token) {
            router.replace('/login' as any)
        }
    }, [loading, token])

    if (loading || !token) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
            <View style={[styles.content, { backgroundColor: isDarkMode ? '#121212' : '#f9f9f9' }]}>
                {children}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        flex: 1,
        padding: 0
    }
})
