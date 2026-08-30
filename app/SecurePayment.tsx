import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import useThemeStore from '@/src/features/theme/theme.service';

const SecurePaymentsScreen = () => {
    const isDarkMode = useThemeStore().isDarkMode;

    return (
        <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>🔒 Secure Payments</Text>
            <Text style={[styles.text, isDarkMode && { color: '#a0a0a0' }]}>
                Your transactions are protected with advanced security.
            </Text>
        </View>
    );
};

export default SecurePaymentsScreen;

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