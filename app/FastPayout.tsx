import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import useThemeStore from '@/src/features/theme/theme.service';

const FastPayoutsScreen = () => {
    const isDarkMode = useThemeStore().isDarkMode;

    return (
        <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>⚡ Fast Payouts</Text>
            <Text style={[styles.text, isDarkMode && { color: '#a0a0a0' }]}>
                Withdraw your earnings quickly and securely.
            </Text>
        </View>
    );
};

export default FastPayoutsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1a1a1a',
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
    },
});