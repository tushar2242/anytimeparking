import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckInHeaderProps {
    step: number;
    headerPaddingTop: number;
    isDarkMode: boolean;
    themeColor: string;
    onBackOrDrawer: () => void;
    onNavigateKeyReturn: () => void;
    onResetWorkflow: () => void;
}

export default function CheckInHeader({
    step,
    headerPaddingTop,
    isDarkMode,
    themeColor,
    onBackOrDrawer,
    onNavigateKeyReturn,
    onResetWorkflow,
}: CheckInHeaderProps) {
    return (
        <View
            style={[
                styles.headerNavbar,
                { paddingTop: headerPaddingTop },
                isDarkMode && { backgroundColor: '#1C1C1E', borderBottomColor: '#2C2C2E' },
            ]}
        >
            <TouchableOpacity
                onPress={onBackOrDrawer}
                style={styles.headerIconButton}
                activeOpacity={0.7}
            >
                {step > 1 && step < 3 ? (
                    <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                ) : (
                    <Ionicons name="menu" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                )}
            </TouchableOpacity>

            {/* Mode Switcher Pill */}
            <View style={[styles.modeToggleContainer, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                <TouchableOpacity
                    style={[styles.modeTabBtn, { backgroundColor: themeColor }]}
                    activeOpacity={0.9}
                >
                    <Ionicons name="car-sport" size={14} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={[styles.modeTabText, { color: '#fff', fontWeight: '800' }]}>
                        Check-In
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.modeTabBtn}
                    onPress={onNavigateKeyReturn}
                    activeOpacity={0.7}
                >
                    <Ionicons name="key" size={14} color={isDarkMode ? '#8E8E93' : '#6E7A90'} style={{ marginRight: 5 }} />
                    <Text style={[styles.modeTabText, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]}>
                        Key Return
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.headerIconButton}
                onPress={onResetWorkflow}
                activeOpacity={0.7}
            >
                <Ionicons name="refresh" size={20} color={isDarkMode ? '#fff' : '#1C1C1E'} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    headerNavbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E9F0',
    },
    headerIconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F3F5',
        borderRadius: 22,
        padding: 4,
    },
    modeTabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 18,
    },
    modeTabText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
