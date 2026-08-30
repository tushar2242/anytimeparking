import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/src/features/theme/theme.service';

export default function PolicyScreen() {
    const isDarkMode = useThemeStore().isDarkMode;

    return (
        <ScrollView
            style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            <Text style={[styles.heading, isDarkMode && { color: '#ffffff' }]}>Driver Policy & Guidelines</Text>
            <Text style={[styles.introText, isDarkMode && { color: '#a0a0a0' }]}>
                Please read and follow our platform policies to ensure a safe, efficient, and professional experience for everyone.
            </Text>

            {/* Privacy Policy */}
            <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e', shadowColor: '#000' }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#2e7d32" />
                    <Text style={[styles.cardTitle, isDarkMode && { color: '#ffffff' }]}>1. Privacy & Location Tracking</Text>
                </View>
                <Text style={[styles.cardText, isDarkMode && { color: '#a0a0a0' }]}>
                    We collect your background location coordinates to assign nearby booking requests and help valet sites monitor vehicle movement. By turning on Duty Status, you consent to this continuous tracking.
                </Text>
            </View>

            {/* Terms of Service */}
            <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e', shadowColor: '#000' }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="document-text-outline" size={24} color="#0a7cff" />
                    <Text style={[styles.cardTitle, isDarkMode && { color: '#ffffff' }]}>2. Terms of Service & Conduct</Text>
                </View>
                <Text style={[styles.cardText, isDarkMode && { color: '#a0a0a0' }]}>
                    Drivers must maintain a professional behavior. Any vehicle damage due to negligent driving or violation of parking rules will result in immediate suspension and investigation.
                </Text>
            </View>

            {/* Safety Guidelines */}
            <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e', shadowColor: '#000' }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="car-outline" size={24} color="#ff9500" />
                    <Text style={[styles.cardTitle, isDarkMode && { color: '#ffffff' }]}>3. Safety & Vehicle Handling</Text>
                </View>
                <Text style={[styles.cardText, isDarkMode && { color: '#a0a0a0' }]}>
                    Always respect local speed limits and follow designated valet site parking maps. Do not operate customer vehicles if you are fatigued or under any influence. Check low bumpers and tight spaces carefully.
                </Text>
            </View>

            {/* Wallet & Payouts Policy */}
            <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e', shadowColor: '#000' }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="wallet-outline" size={24} color="#5856d6" />
                    <Text style={[styles.cardTitle, isDarkMode && { color: '#ffffff' }]}>4. Payouts & Commission</Text>
                </View>
                <Text style={[styles.cardText, isDarkMode && { color: '#a0a0a0' }]}>
                    Your wallet balance reflects earnings from completed bookings. Withdrawal requests are processed within 24 to 48 hours according to platform rules. Unauthorized or cancelled bookings are subject to audit before payout approval.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 10,
        textAlign: 'center',
    },
    introText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    cardText: {
        fontSize: 13,
        color: '#48484A',
        lineHeight: 18,
    },
});
