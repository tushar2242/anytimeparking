import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import FastPayoutsScreen from '@/app/FastPayout';
import SecurePaymentsScreen from '@/app/SecurePayment';
import SupportScreen from '@/app/Support';
import WalletScreen from '@/app/Withdraw';



const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
    // @ts-ignore
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        <Stack.Screen
            name="SecurePayments"
            component={SecurePaymentsScreen}
        />
        <Stack.Screen
            name="FastPayout"
            component={FastPayoutsScreen}
        />
        <Stack.Screen
            name="Support"
            component={SupportScreen}
        />
        <Stack.Screen
            name="Wallet"
            component={WalletScreen}
        />
    </Stack.Navigator>
);


export default AuthNavigator;

