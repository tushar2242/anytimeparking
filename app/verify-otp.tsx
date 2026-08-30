import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert,
    ScrollView,
    StatusBar,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'
import Api from '@/src/Api/api'

export default function VerifyOTPScreen() {
    const router = useRouter()
    const params = useLocalSearchParams()
    const isDarkMode = useThemeStore().isDarkMode

    const target = typeof params.target === 'string' ? params.target : ''

    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [timer, setTimer] = useState(60)

    useEffect(() => {
        if (timer === 0) return
        const interval = setInterval(() => {
            setTimer(prev => prev - 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [timer])

    const handleResend = async () => {
        if (timer > 0) return
        try {
            setLoading(true)
            await Api.post('/forgot-password', { email: target, role: 'driver' })
            Alert.alert('OTP Resent', 'A new 6-digit verification code was sent.')
            setTimer(60)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP code')
            return
        }

        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all password fields')
            return
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match')
            return
        }

        try {
            setLoading(true)

            // Call the reset password API
            await Api.post('/reset-password', {
                email: target,
                role: 'driver',
                otp: otp,
                new_password: newPassword
            })

            Alert.alert(
                'Success',
                'Your password has been reset successfully.',
                [
                    {
                        text: 'Login Now',
                        onPress: () => router.replace('/login' as any)
                    }
                ]
            )
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView
            contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
            style={isDarkMode && { backgroundColor: '#121212' }}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                    <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#ffffff' : '#333'} />
                </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
                <View style={[styles.logoCircle, isDarkMode && { backgroundColor: '#1c1c1e', shadowColor: '#000' }]}>
                    <Ionicons name="shield-checkmark-sharp" size={40} color="#fbff00" />
                </View>
                <Text style={[styles.brandName, isDarkMode && { color: '#ffffff' }]}>Verify Recovery</Text>
            </View>

            <View style={styles.formContainer}>
                <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>Verify OTP</Text>
                <Text style={[styles.subtitle, isDarkMode && { color: '#a0a0a0' }]}>
                    We have sent a 6-digit OTP code to {target || 'your phone number'}.
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>OTP Code</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="key" size={18} color={isDarkMode ? '#777' : '#999'} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholder="Enter 6-digit code"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                            placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>New Password</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="lock" size={18} color={isDarkMode ? '#777' : '#999'} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholder="Enter new password"
                            secureTextEntry={!showPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color={isDarkMode ? '#777' : '#999'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Confirm New Password</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="lock" size={18} color={isDarkMode ? '#777' : '#999'} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholder="Confirm new password"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color={isDarkMode ? '#777' : '#999'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={[styles.button, isDarkMode && { backgroundColor: '#fff' }]} onPress={handleResetPassword} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={isDarkMode ? '#000' : '#fbff00'} />
                    ) : (
                        <Text style={[styles.buttonText, isDarkMode && { color: '#000' }]}>Reset Password</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.resendButton, timer > 0 && { opacity: 0.6 }]}
                    onPress={handleResend}
                    disabled={timer > 0}
                >
                    <Text style={[
                        styles.resendText,
                        isDarkMode && { color: '#0A84FF' },
                        timer > 0 && (isDarkMode ? { color: '#555' } : { color: '#999' })
                    ]}>
                        {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 44,
        height: 90,
        justifyContent: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    brandName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#212529',
        marginTop: 16,
        letterSpacing: -0.5,
    },
    formContainer: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#212529',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#868e96',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#495057',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f3f5',
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#212529',
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#000',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
        marginTop: 8,
    },
    buttonText: {
        color: '#fbff00',
        fontWeight: '700',
        fontSize: 16,
    },
    resendButton: {
        marginTop: 8,
        alignSelf: 'center',
        marginBottom: 40,
    },
    resendText: {
        color: '#007bff',
        fontWeight: '700',
        fontSize: 15,
    },
})
