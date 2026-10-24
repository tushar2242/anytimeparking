import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CheckInStepperProps {
    step: number;
    themeColor: string;
    isDarkMode: boolean;
    onStepPress: (stepNum: number) => void;
}

export default function CheckInStepper({
    step,
    themeColor,
    isDarkMode,
    onStepPress,
}: CheckInStepperProps) {
    const steps = [
        { stepNum: 1, label: 'Select Site', icon: 'business' },
        { stepNum: 2, label: 'Vehicle Details', icon: 'create' },
        { stepNum: 3, label: 'Digital Ticket', icon: 'qr-code' },
    ];

    return (
        <View style={[styles.stepTrackerContainer, isDarkMode && { backgroundColor: '#0B1422', borderBottomColor: '#1A2942' }]}>
            {steps.map((item) => {
                const isCompleted = item.stepNum < step;
                const isActive = item.stepNum === step;

                return (
                    <TouchableOpacity
                        key={item.stepNum}
                        style={styles.stepItemWrapper}
                        onPress={() => onStepPress(item.stepNum)}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.stepIconCircle,
                                isCompleted && { backgroundColor: '#34C759' },
                                isActive && { backgroundColor: themeColor, borderWidth: 1.5, borderColor: '#fff' },
                                !isActive && !isCompleted && styles.stepIconCircleInactive,
                            ]}
                        >
                            <Ionicons
                                name={isCompleted ? 'checkmark' : (item.icon as any)}
                                size={14}
                                color={isActive || isCompleted ? '#fff' : '#8E8E93'}
                            />
                        </View>
                        <Text
                            style={[
                                styles.stepItemLabel,
                                isActive && styles.stepItemLabelActive,
                                isCompleted && { color: '#34C759' },
                                !isActive && !isCompleted && styles.stepItemLabelInactive,
                            ]}
                            numberOfLines={1}
                        >
                            {item.stepNum}. {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    stepTrackerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#071325',
        borderBottomWidth: 1,
        borderBottomColor: '#102A45',
    },
    stepItemWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    stepIconCircleInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    stepItemLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        textAlign: 'center',
    },
    stepItemLabelActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    stepItemLabelInactive: {
        color: '#8E8E93',
    },
});
