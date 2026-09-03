import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderNavbarProps {
    workflowMode: 'checkin' | 'keyreturn';
    checkinStep: number;
    returnStep: number;
    isDarkMode: boolean;
    onBackOrMenuPress: () => void;
    onModeChange: (mode: 'checkin' | 'keyreturn') => void;
}

export default function HeaderNavbar({
    workflowMode,
    checkinStep,
    returnStep,
    isDarkMode,
    onBackOrMenuPress,
    onModeChange,
}: HeaderNavbarProps) {
    const insets = useSafeAreaInsets();
    const headerPaddingTop = Math.max(insets.top, 20) + 10;

    const showBack =
        (workflowMode === 'checkin' && checkinStep > 2) ||
        (workflowMode === 'keyreturn' && returnStep > 1 && returnStep < 5);

    return (
        <View
            style={[
                styles.headerNavbar,
                { paddingTop: headerPaddingTop },
                isDarkMode && { backgroundColor: '#1C1C1E', borderBottomColor: '#2C2C2E' },
            ]}
        >
            <TouchableOpacity onPress={onBackOrMenuPress} style={styles.backButton}>
                {showBack ? (
                    <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                ) : (
                    <Ionicons name="menu" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                )}
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
                <View style={[styles.modeToggleContainer, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                    <TouchableOpacity
                        style={[
                            styles.modeTabBtn,
                            workflowMode === 'checkin' && { backgroundColor: '#0066FF' },
                        ]}
                        onPress={() => onModeChange('checkin')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="car-sport"
                            size={14}
                            color={workflowMode === 'checkin' ? '#fff' : isDarkMode ? '#8E8E93' : '#6E7A90'}
                            style={{ marginRight: 4 }}
                        />
                        <Text
                            style={[
                                styles.modeTabText,
                                workflowMode === 'checkin' ? { color: '#fff', fontWeight: '800' } : isDarkMode ? { color: '#8E8E93' } : { color: '#6E7A90' },
                            ]}
                        >
                            Check-In
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.modeTabBtn,
                            workflowMode === 'keyreturn' && { backgroundColor: '#FF851B' },
                        ]}
                        onPress={() => onModeChange('keyreturn')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="key"
                            size={14}
                            color={workflowMode === 'keyreturn' ? '#fff' : isDarkMode ? '#8E8E93' : '#6E7A90'}
                            style={{ marginRight: 4 }}
                        />
                        <Text
                            style={[
                                styles.modeTabText,
                                workflowMode === 'keyreturn' ? { color: '#fff', fontWeight: '800' } : isDarkMode ? { color: '#8E8E93' } : { color: '#6E7A90' },
                            ]}
                        >
                            Key Return
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
                <Ionicons name="search" size={20} color={isDarkMode ? '#fff' : '#1C1C1E'} />
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
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E9F0',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F3F5',
        borderRadius: 20,
        padding: 3,
    },
    modeTabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    modeTabText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
