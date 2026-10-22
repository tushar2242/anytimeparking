import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CheckInScreen from './check-in';
import KeyReturnScreen from './key-return';

export default function CardParkingIndexScreen() {
    const params = useLocalSearchParams<{ mode?: string; tab?: string; ticketId?: string }>();

    if (params.mode === 'scan' || params.mode === 'keyreturn' || params.ticketId) {
        return <KeyReturnScreen />;
    }

    return <CheckInScreen />;
}
