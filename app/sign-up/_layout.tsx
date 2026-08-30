import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '@/src/features/theme/theme.service';
import Api from '@/src/Api/api';

const SignupScreen = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [agree, setAgree] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const router = useRouter()

    const isDarkMode = useThemeStore().isDarkMode;

    return (
        <ScrollView
            contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
            style={isDarkMode && { backgroundColor: '#121212' }}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity> */}
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>Create Account</Text>
                <Text style={[styles.subtitle, isDarkMode && { color: '#a0a0a0' }]}>Enter your details to register as a driver</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Full Name</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="user" size={18} color={isDarkMode ? '#777' : '#adb5bd'} style={styles.inputIcon} />
                        <TextInput
                            placeholder="John Doe"
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholderTextColor={isDarkMode ? '#666' : '#adb5bd'}
                            value={form.fullName}
                            onChangeText={(val) => setForm({ ...form, fullName: val })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Email Address</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="mail" size={18} color={isDarkMode ? '#777' : '#adb5bd'} style={styles.inputIcon} />
                        <TextInput
                            placeholder="name@example.com"
                            keyboardType="email-address"
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholderTextColor={isDarkMode ? '#666' : '#adb5bd'}
                            value={form.email}
                            onChangeText={(val) => setForm({ ...form, email: val })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Phone Number</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="phone" size={18} color={isDarkMode ? '#777' : '#adb5bd'} style={styles.inputIcon} />
                        <TextInput
                            placeholder="1234567890"
                            keyboardType="phone-pad"
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholderTextColor={isDarkMode ? '#666' : '#adb5bd'}
                            value={form.phone}
                            onChangeText={(val) => setForm({ ...form, phone: val })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>License Number</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="file-text" size={18} color={isDarkMode ? '#777' : '#adb5bd'} style={styles.inputIcon} />
                        <TextInput
                            placeholder="LIC12345"
                            autoCapitalize="characters"
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholderTextColor={isDarkMode ? '#666' : '#adb5bd'}
                            value={form.licenseNumber}
                            onChangeText={(val) => setForm({ ...form, licenseNumber: val })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Password</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="lock" size={18} color={isDarkMode ? '#777' : '#adb5bd'} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Enter password"
                            secureTextEntry={!showPassword}
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholderTextColor={isDarkMode ? '#666' : '#adb5bd'}
                            value={form.password}
                            onChangeText={(val) => setForm({ ...form, password: val })}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color={isDarkMode ? '#777' : '#adb5bd'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#a0a0a0' }]}>Confirm Password</Text>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#333' }]}>
                        <Feather name="lock" size={18} color={isDarkMode ? '#777' : '#adb5bd'} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Repeat password"
                            secureTextEntry={!showConfirm}
                            style={[styles.input, isDarkMode && { color: '#ffffff' }]}
                            placeholderTextColor={isDarkMode ? '#666' : '#adb5bd'}
                            value={form.confirmPassword}
                            onChangeText={(val) => setForm({ ...form, confirmPassword: val })}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                            <Feather name={showConfirm ? 'eye' : 'eye-off'} size={18} color={isDarkMode ? '#777' : '#adb5bd'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setAgree(!agree)}
                    style={styles.checkboxWrapper}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, isDarkMode && { borderColor: '#444' }, agree && styles.checkedBox]}>
                        {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.termsText, isDarkMode && { color: '#a0a0a0' }]}>
                        I agree to the <Text style={[styles.linkText, isDarkMode && { color: '#ffffff' }]}>Terms of Service</Text> and <Text style={[styles.linkText, isDarkMode && { color: '#ffffff' }]}>Privacy Policy</Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, isDarkMode && { backgroundColor: '#fff' }, (!agree || loading) && styles.buttonDisabled, (!agree || loading) && isDarkMode && { backgroundColor: '#222' }]}
                    disabled={!agree || loading}
                    onPress={async () => {
                        if (!form.fullName || !form.email || !form.phone || !form.licenseNumber || !form.password || !form.confirmPassword) {
                            Alert.alert('Missing fields', 'Please fill all required fields.');
                            return;
                        }

                        if (form.password !== form.confirmPassword) {
                            Alert.alert('Password mismatch', 'Passwords do not match.');
                            return;
                        }

                        if (!agree) {
                            Alert.alert('Terms required', 'Please agree to the terms of service.');
                            return;
                        }

                        try {
                            setLoading(true);
                            await Api.post('/signup/send-otp', {
                                email: form.email,
                                role: 'driver'
                            });
                            
                            const query = `?email=${encodeURIComponent(form.email)}&fullName=${encodeURIComponent(form.fullName)}&phone=${encodeURIComponent(form.phone)}&licenseNumber=${encodeURIComponent(form.licenseNumber)}&password=${encodeURIComponent(form.password)}`
                            router.push(`/otp${query}` as any)
                        } catch (err) {
                            console.error(err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color={isDarkMode ? '#000' : '#fff'} />
                    ) : (
                        <Text style={[styles.buttonText, isDarkMode && { color: '#000' }]}>Create Account</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, isDarkMode && { color: '#a0a0a0' }]}>Already have an account? </Text>
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
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 20,
        height: 80,
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
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
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
        fontSize: 14,
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
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#212529',
        fontWeight: '500',
    },
    checkboxWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 32,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#dee2e6',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedBox: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: '#868e96',
        lineHeight: 18,
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
    },
    buttonDisabled: {
        backgroundColor: '#adb5bd',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
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

export default SignupScreen
