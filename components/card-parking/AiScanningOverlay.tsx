import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AiScanningOverlayProps {
    visible: boolean;
    isDarkMode: boolean;
    themeColor: string;
    message: string;
}

export default function AiScanningOverlay({
    visible,
    isDarkMode,
    themeColor,
    message,
}: AiScanningOverlayProps) {
    if (!visible) return null;

    return (
        <View style={styles.aiLoaderOverlay}>
            <View style={[styles.aiLoaderCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                <View style={[styles.aiLoaderPulseCircle, { backgroundColor: '#EAF2FF' }]}>
                    <ActivityIndicator size="large" color={themeColor} />
                </View>
                <View style={styles.geminiBadgeRow}>
                    <Ionicons name="sparkles" size={16} color="#0066FF" style={{ marginRight: 6 }} />
                    <Text style={styles.geminiBrandTitle}>Powered by Google Gemini AI</Text>
                </View>
                <Text style={[styles.aiLoaderTitle, isDarkMode && { color: '#fff' }]}>
                    Detecting Vehicle Details
                </Text>
                <Text style={styles.aiLoaderSubtitle}>
                    {message}
                </Text>
                <View style={styles.aiLoaderProgressBar}>
                    <View style={[styles.aiLoaderProgressFill, { backgroundColor: themeColor }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    aiLoaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10000,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    aiLoaderCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: '#E5E9F0',
    },
    aiLoaderPulseCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    geminiBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 10,
    },
    geminiBrandTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0066FF',
    },
    aiLoaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 6,
        textAlign: 'center',
    },
    aiLoaderSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 18,
    },
    aiLoaderProgressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#E5E9F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    aiLoaderProgressFill: {
        width: '75%',
        height: '100%',
        borderRadius: 3,
    },
});
