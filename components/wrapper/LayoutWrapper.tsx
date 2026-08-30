import React from 'react'
import { View, StyleSheet } from 'react-native'
import useThemeStore from '@/src/features/theme/theme.service'

export default function LayoutWrapper({ children }: {
    children: React.ReactNode
}) {
    const isDarkMode = useThemeStore().isDarkMode

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
    content: {
        flex: 1,
        padding: 0
    }
})
