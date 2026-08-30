import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'
import Api from '@/src/Api/api'

const OTPScreen = () => {
    const router = useRouter()
    const params = useLocalSearchParams()
    const [otp, setOtp] = useState('')
    const isDarkMode = useThemeStore().isDarkMode
    const [timer, setTimer] = useState(60)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (timer === 0) return
        const interval = setInterval(() => {
            setTimer(prev => prev - 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [timer])

    const email = typeof params.email === 'string' ? params.email : ''
    const fullName = typeof params.fullName === 'string' ? params.fullName : ''
    const phone = typeof params.phone === 'string' ? params.phone : ''
    const licenseNumber = typeof params.licenseNumber === 'string' ? params.licenseNumber : ''
    const password = typeof params.password === 'string' ? params.password : ''

    const handleResend = async () => {
        if (timer > 0) return
        try {
            setLoading(true)
            await Api.post('/signup/send-otp', {
                email,
                role: 'driver'
            })
            Alert.alert('OTP Sent', `A new OTP was sent to ${email || 'your email'}.`)
            setTimer(60)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a valid 6-digit code.')
            return
        }

        try {
            setLoading(true)
            await Api.post('/driver/register', {
                email,
                phone,
                name: fullName,
                password,
                license_number: licenseNumber,
                otp
            })

            Alert.alert('Success', 'OTP verified and account registered successfully.', [
                {
                    text: 'Continue to Login',
                    onPress: () => router.replace('/login' as any),
                },
            ])
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
            <View style={[styles.inner, isDarkMode && { backgroundColor: '#121212' }]}>
                <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>Verify your account</Text>
                <Text style={[styles.subtitle, isDarkMode && { color: '#a0a0a0' }]}>
                    Enter the 6-digit code sent to {email || 'your email'}.
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>OTP Code</Text>
                    <TextInput
                        style={[styles.input, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333', color: '#fff' }]}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="123456"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, isDarkMode && { backgroundColor: '#fff' }, loading && { opacity: 0.7 }]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={isDarkMode ? '#000' : '#fff'} />
                    ) : (
                        <Text style={[styles.buttonText, isDarkMode && { color: '#000' }]}>Verify OTP</Text>
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
                        {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
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
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#212529',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 32,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#495057',
        marginBottom: 8,
    },
    input: {
        height: 56,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#212529',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    button: {
        height: 56,
        backgroundColor: '#000',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    resendButton: {
        marginTop: 20,
        alignSelf: 'center',
    },
    resendText: {
        color: '#007bff',
        fontWeight: '700',
    },
})

export default OTPScreen
