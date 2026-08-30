import { useAuth } from '@/src/context/AuthContext'
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
    Dimensions,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'
import { LinearGradient } from 'expo-linear-gradient'

const { height } = Dimensions.get('window')

export default function LoginScreen() {
    const { login } = useAuth()
    const router = useRouter()

    const [form, setForm] = useState({
        phone: '',
        password: '',
        role: 'driver',
    })

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleLogin = async () => {
        const { phone, password } = form

        if (!phone || !password) {
            Alert.alert('Error', 'Please fill all fields')
            return
        }

        try {
            setLoading(true)
            await login(form)
        } catch (err) {
            console.error(err)
            Alert.alert('Login Failed', 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    };

    const isDarkMode = useThemeStore().isDarkMode;

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Curved Header Section */}
                <LinearGradient
                    colors={['#071325', '#0B1E36', '#0F2B4D']}
                    style={styles.headerCurve}
                >
                    <View style={styles.logoWrapper}>
                        <View style={styles.logoCircle}>
                            <View style={styles.carLogoOutline}>
                                <Ionicons name="car-sport-outline" size={44} color="#0A84FF" />
                            </View>
                            <Text style={styles.logoValetText}>VALET</Text>
                            <Text style={styles.logoParkingText}>PARKING</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Content Panel (White background) */}
                <View style={styles.contentPanel}>
                    <Text style={styles.titleText}>Welcome Back!</Text>
                    <Text style={styles.subtitleText}>Please login to your account</Text>

                    {/* Phone Number Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <View style={styles.inputWrapper}>
                            <Feather name="phone" size={18} color="#8E8E93" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="+91 9876543210"
                                keyboardType="phone-pad"
                                value={form.phone}
                                onChangeText={value => handleChange('phone', value)}
                                placeholderTextColor="#C7C7CC"
                            />
                        </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Feather name="lock" size={18} color="#8E8E93" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••••••"
                                secureTextEntry={!showPassword}
                                value={form.password}
                                onChangeText={value => handleChange('password', value)}
                                placeholderTextColor="#C7C7CC"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot' as any)}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.orText}>OR</Text>

                    <TouchableOpacity style={styles.signUpButton} onPress={() => router.push('/sign-up' as any)}>
                        <Text style={styles.signUpButtonText}>CREATE AN ACCOUNT</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>v1.0.0</Text>
                </View>
            </ScrollView>


        </View>
    )
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#071325',
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#fff',
    },
    headerCurve: {
        height: height * 0.32,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    logoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    logoCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: '#0A84FF',
        backgroundColor: 'rgba(7, 19, 37, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    carLogoOutline: {
        marginBottom: 4,
    },
    logoValetText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0A84FF',
        letterSpacing: 2,
    },
    logoParkingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 4,
        marginTop: 2,
    },
    contentPanel: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 30,
    },
    titleText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1C1C1E',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitleText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 22,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3A3A3C',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 28,
    },
    forgotPasswordText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0A84FF',
    },
    loginButton: {
        backgroundColor: '#0A84FF',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 1,
    },
    orText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        textAlign: 'center',
        marginVertical: 10,
    },
    signUpButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#0A84FF',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    signUpButtonText: {
        color: '#0A84FF',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    versionText: {
        fontSize: 12,
        color: '#C7C7CC',
        textAlign: 'center',
    },

})

