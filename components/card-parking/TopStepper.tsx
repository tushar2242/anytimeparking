import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopStepperProps {
    workflowMode: 'checkin' | 'keyreturn';
    checkinStep: number;
    returnStep: number;
    themeColor: string;
    onStepPress: (targetStepNum: number) => void;
}

export default function TopStepper({
    workflowMode,
    checkinStep,
    returnStep,
    themeColor,
    onStepPress,
}: TopStepperProps) {
    const checkinSteps = [
        { label: 'Login', icon: 'lock-closed' },
        { label: 'Enter Details', icon: 'create' },
        { label: 'Ticket + QR', icon: 'qr-code' },
    ];

    const returnSteps = [
        { label: 'Scan / Search', icon: 'scan' },
        { label: 'Ticket Details', icon: 'receipt' },
        { label: 'Confirm Key', icon: 'key' },
        { label: 'Status Return', icon: 'checkmark-circle' },
    ];

    const steps = workflowMode === 'checkin' ? checkinSteps : returnSteps;

    let currentActiveStep = checkinStep;
    if (workflowMode === 'keyreturn') {
        if (returnStep <= 2) currentActiveStep = 1;
        else if (returnStep === 3) currentActiveStep = 2;
        else if (returnStep === 4) currentActiveStep = 3;
        else currentActiveStep = 4;
    }

    return (
        <View style={styles.stepTrackerContainer}>
            {steps.map((stepItem, index) => {
                const stepNum = index + 1;
                const isCompleted = stepNum < currentActiveStep;
                const isActive = stepNum === currentActiveStep;

                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.stepItemWrapper}
                        onPress={() => onStepPress(stepNum)}
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
                                name={isCompleted ? 'checkmark' : (stepItem.icon as any)}
                                size={15}
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
                            {stepNum}. {stepItem.label}
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
        paddingHorizontal: 8,
        paddingVertical: 10,
        backgroundColor: '#081325',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
