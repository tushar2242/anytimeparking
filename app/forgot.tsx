import React, { useState } from 'react'
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
import { useRouter } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'
import Api from '@/src/Api/api'

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const isDarkMode = useThemeStore().isDarkMode

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address')
            return
        }

        try {
            setLoading(true)
            
            // Call the forgot password API
            await Api.post('/forgot-password', { email, role: 'driver' })
            
            Alert.alert(
                'Verification Sent',
                `A 6-digit OTP code has been sent to ${email}.`,
                [
                    {
                        text: 'Verify',
                        onPress: () => {
                            router.push({
                                pathname: '/verify-otp',
                                params: { target: email }
                            } as any)
                        }
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
                    <Ionicons name="key-sharp" size={40} color="#fbff00" />
                </View>
                <Text style={[styles.brandName, isDarkMode && { color: '#ffffff' }]}>Recover Password</Text>
            </View>

            <View style={styles.formContainer}>
                <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>Forgot Password?</Text>
                <Text style={[styles.subtitle, isDarkMode && { color: '#a0a0a0' }]}>
                    {"Don't worry! Enter your registered email address below, and we will send you an OTP to reset your password."}
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Email Address</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="mail" size={18} color={isDarkMode ? '#777' : '#999'} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            placeholderTextColor={isDarkMode ? '#666' : '#999'}
                        />
                    </View>
                </View>

                <TouchableOpacity style={[styles.button, isDarkMode && { backgroundColor: '#fff' }]} onPress={handleSendOTP} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color={isDarkMode ? '#000' : '#fbff00'} />
                    ) : (
                        <Text style={[styles.buttonText, isDarkMode && { color: '#000' }]}>Send OTP</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, isDarkMode && { color: '#a0a0a0' }]}>Remember password? </Text>
                    <TouchableOpacity onPress={() => router.push('/login' as any)}>
                        <Text style={[styles.linkText, isDarkMode && { color: '#ffffff' }]}>Sign In</Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 24,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 15,
        color: '#868e96',
    },
    linkText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
})
