import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    StatusBar,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { format } from 'date-fns'
import useDriverStore from '@/src/features/user/user.service'
import { showToast } from '@/src/utils/toast'
import { Ionicons } from '@expo/vector-icons'
import { baseURL } from '@/src/Api/api'
import { LinearGradient } from 'expo-linear-gradient'
import BottomTabBar from '@/components/navigation/BottomTabBar'

const genderOptions = [
    { key: 'male', label: 'Male', icon: 'male' },
    { key: 'female', label: 'Female', icon: 'female' },
    { key: 'other', label: 'Other', icon: 'person' }
]

// Premium color palette
const COLORS = {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#818CF8',
    secondary: '#0EA5E9',
    accent: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderFocus: '#6366F1',
    text: '#1E293B',
    textSecondary: '#64748B',
    textLight: '#94A3B8',
    gradient: ['#6366F1', '#4F46E5', '#4338CA']
}

interface InputFieldProps {
    label: string
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad'
    icon?: string
    editable?: boolean
    multiline?: boolean
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    icon,
    editable = true,
    multiline = false
}) => {
    const [isFocused, setIsFocused] = useState(false)
    const animatedBorder = useRef(new Animated.Value(0)).current

    const handleFocus = () => {
        setIsFocused(true)
        Animated.spring(animatedBorder, {
            toValue: 1,
            useNativeDriver: false,
            friction: 8
        }).start()
    }

    const handleBlur = () => {
        setIsFocused(false)
        Animated.spring(animatedBorder, {
            toValue: 0,
            useNativeDriver: false,
            friction: 8
        }).start()
    }

    const borderColor = animatedBorder.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.borderFocus]
    })

    return (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <Animated.View style={[
                styles.inputWrapper,
                { borderColor },
                isFocused && styles.inputWrapperFocused
            ]}>
                {icon && (
                    <Ionicons
                        name={icon as any}
                        size={20}
                        color={isFocused ? COLORS.primary : COLORS.textLight}
                        style={styles.inputIcon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        icon && styles.inputWithIcon,
                        multiline && styles.inputMultiline,
                        !editable && styles.inputDisabled
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                    placeholderTextColor={COLORS.textLight}
                    keyboardType={keyboardType}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    editable={editable}
                    multiline={multiline}
                    numberOfLines={multiline ? 3 : 1}
                />
            </Animated.View>
        </View>
    )
}

interface DatePickerFieldProps {
    label: string
    value: string
    onPress: () => void
    icon?: string
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ label, value, onPress, icon }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
            style={styles.datePickerWrapper}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon && (
                <Ionicons
                    name={icon as any}
                    size={20}
                    color={COLORS.textLight}
                    style={styles.inputIcon}
                />
            )}
            <Text style={[
                styles.datePickerText,
                !value && styles.datePickerPlaceholder
            ]}>
                {value || 'Select date'}
            </Text>
            <Ionicons name="chevron-down-outline" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
    </View>
)

interface SectionProps {
    title: string
    icon: string
    children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
                <Ionicons name={icon as any} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
)

export default function DriverProfileForm() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        license_number: '',
        dob: '',
        license_expiry: '',
        gender: 'male',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        id_proof_type: '',
        id_proof_number: '',
        poster: null as any,
        profile_image: null as any,
    })

    const [showDOBPicker, setShowDOBPicker] = useState(false)
    const [showLicenseExpiryPicker, setShowLicenseExpiryPicker] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fadeAnim = useRef(new Animated.Value(0)).current
    const slideAnim = useRef(new Animated.Value(30)).current
    const scaleAnim = useRef(new Animated.Value(0.95)).current

    const store = useDriverStore()

    useEffect(() => {
        init()
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true
            })
        ]).start()
    }, [])

    const handleChange = (key: string, value: any) => {
        setForm({ ...form, [key]: value })
    }

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0]
            const uri = asset.uri
            const fileType = uri.substring(uri.lastIndexOf('.') + 1)
            const fileName = `profile.${fileType}`
            handleChange('poster', {
                uri: uri,
                type: `image/${fileType}`,
                name: fileName,
            })
            handleChange('poster', {
                uri: asset.uri,
                name: 'profile.jpg',
                type: 'image/jpeg',
            })
        }
    }

    const formatDateToYMD = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } catch (e) {
            return '';
        }
    };

    const getProfileImageUri = (imagePath: string | null | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('file://') || imagePath.startsWith('content://')) {
            return imagePath;
        }
        const cleanBaseUrl = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        const cleanImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${cleanBaseUrl}${cleanImagePath}`;
    };

    async function init() {
        setLoading(true)
        try {
            const res = await store.getProfile()
            if (res) {
                setForm({
                    ...res,
                    dob: formatDateToYMD(res.dob),
                    license_expiry: formatDateToYMD(res.license_expiry),
                    poster: res.profile_image ? { uri: getProfileImageUri(res.profile_image) } : null
                })
            }
        } catch (error) {
            console.error('Failed to load profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        setSaving(true)
        try {
            const res = await store.updateProfile(form)
            if (res) {
                showToast('Profile updated successfully!')
                init()
            } else {
                showToast('Failed to update profile')
            }
        } catch (error) {
            console.error('Failed to update profile', error)
            showToast('Something went wrong')
        } finally {
            setSaving(false)
        }
    }


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

            <ScrollView
                contentContainerStyle={styles.mainScrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with gradient */}
                <LinearGradient
                    colors={COLORS.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <Text style={styles.headerSubtitle}>Manage your account details</Text>
                    </View>

                    {/* Profile Image */}
                    <TouchableOpacity
                        onPress={handleImagePick}
                        style={styles.profileImageContainer}
                        activeOpacity={0.8}
                    >
                        <View style={styles.profileImageWrapper}>
                            {form.poster ? (
                                <Image
                                    source={{ uri: getProfileImageUri(form.poster.uri) || getProfileImageUri(form.profile_image) || undefined }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Ionicons name="person" size={45} color={COLORS.textLight} />
                                </View>
                            )}
                            <View style={styles.cameraIconContainer}>
                                <Ionicons name="camera" size={16} color={COLORS.surface} />
                            </View>
                        </View>
                        <Text style={styles.changePhotoText}>Tap to change photo</Text>
                    </TouchableOpacity>
                </LinearGradient>

                <Animated.View
                    style={[
                        styles.formContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    {/* Personal Information */}
                    <Section title="Personal Information" icon="person-circle-outline">
                        <InputField
                            label="Full Name"
                            value={form.name}
                            onChangeText={val => handleChange('name', val)}
                            icon="person-outline"
                            placeholder="Enter your full name"
                        />

                        <InputField
                            label="Email Address"
                            value={form.email}
                            onChangeText={val => handleChange('email', val)}
                            keyboardType="email-address"
                            icon="mail-outline"
                            placeholder="your@email.com"
                        />

                        <InputField
                            label="Phone Number"
                            value={form.phone}
                            onChangeText={val => handleChange('phone', val)}
                            keyboardType="phone-pad"
                            icon="call-outline"
                            placeholder="(555) 000-0000"
                        />

                        {/* Gender Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Gender</Text>
                            <View style={styles.genderContainer}>
                                {genderOptions.map(g => (
                                    <TouchableOpacity
                                        key={g.key}
                                        onPress={() => handleChange('gender', g.key)}
                                        style={[
                                            styles.genderOption,
                                            form.gender === g.key && styles.genderOptionActive
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={g.icon as any}
                                            size={20}
                                            color={form.gender === g.key ? COLORS.surface : COLORS.textSecondary}
                                        />
                                        <Text style={[
                                            styles.genderText,
                                            form.gender === g.key && styles.genderTextActive
                                        ]}>
                                            {g.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <DatePickerField
                            label="Date of Birth"
                            value={form.dob}
                            onPress={() => setShowDOBPicker(true)}
                            icon="calendar-outline"
                        />
                        {showDOBPicker && (
                            <DateTimePicker
                                value={form.dob ? new Date(form.dob) : new Date()}
                                mode="date"
                                display="default"
                                maximumDate={new Date()}
                                onChange={(_, date) => {
                                    setShowDOBPicker(false)
                                    if (date) handleChange('dob', format(date, 'yyyy-MM-dd'))
                                }}
                            />
                        )}
                    </Section>

                    {/* License Information */}
                    <Section title="License & ID" icon="card-outline">
                        <InputField
                            label="License Number"
                            value={form.license_number}
                            onChangeText={val => handleChange('license_number', val)}
                            icon="document-text-outline"
                            placeholder="DL-XXXX-XXXX-XXXX"
                        />

                        <DatePickerField
                            label="License Expiry Date"
                            value={form.license_expiry}
                            onPress={() => setShowLicenseExpiryPicker(true)}
                            icon="time-outline"
                        />
                        {showLicenseExpiryPicker && (
                            <DateTimePicker
                                value={form.license_expiry ? new Date(form.license_expiry) : new Date()}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={(_, date) => {
                                    setShowLicenseExpiryPicker(false)
                                    if (date) handleChange('license_expiry', format(date, 'yyyy-MM-dd'))
                                }}
                            />
                        )}

                        <InputField
                            label="ID Proof Type"
                            value={form.id_proof_type}
                            onChangeText={val => handleChange('id_proof_type', val)}
                            icon="id-card-outline"
                            placeholder="Aadhar / PAN / Passport"
                        />

                        <InputField
                            label="ID Proof Number"
                            value={form.id_proof_number}
                            onChangeText={val => handleChange('id_proof_number', val)}
                            icon="barcode-outline"
                            placeholder="Enter ID number"
                        />
                    </Section>

                    {/* Address Information */}
                    <Section title="Address Details" icon="location-outline">
                        <InputField
                            label="Street Address"
                            value={form.address}
                            onChangeText={val => handleChange('address', val)}
                            icon="home-outline"
                            placeholder="Enter street address"
                            multiline
                        />

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <InputField
                                    label="City"
                                    value={form.city}
                                    onChangeText={val => handleChange('city', val)}
                                    placeholder="City"
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <InputField
                                    label="State"
                                    value={form.state}
                                    onChangeText={val => handleChange('state', val)}
                                    placeholder="State"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <InputField
                                    label="Country"
                                    value={form.country}
                                    onChangeText={val => handleChange('country', val)}
                                    placeholder="Country"
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <InputField
                                    label="Pincode"
                                    value={form.pincode}
                                    onChangeText={val => handleChange('pincode', val)}
                                    keyboardType="number-pad"
                                    placeholder="XXXXXX"
                                />
                            </View>
                        </View>
                    </Section>

                    {/* Submit Button */}
                    <View style={[styles.submitButtonContainer, saving && styles.submitButtonContainerDisabled]}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                            disabled={saving}
                        >
                            <LinearGradient
                                colors={saving ? ['#94A3B8', '#94A3B8'] : COLORS.gradient as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButtonGradient}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color={COLORS.surface} />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={22} color={COLORS.surface} />
                                        <Text style={styles.submitButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomSpacing} />
                </Animated.View>
            </ScrollView>
            <BottomTabBar />
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 45,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.surface,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 4,
        fontWeight: '500',
    },
    profileImageContainer: {
        alignItems: 'center',
    },
    profileImageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: COLORS.surface,
    },
    profileImagePlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: COLORS.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.surface,
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: COLORS.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.surface,
    },
    changePhotoText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 10,
        fontWeight: '500',
    },
    mainScrollContent: {
        flexGrow: 1,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        marginTop: -30,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        marginTop: -30,
    },
    section: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sectionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: 0.3,
    },
    sectionContent: {},
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
    },
    inputWrapperFocused: {
        backgroundColor: COLORS.surface,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    inputWithIcon: {},
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    inputDisabled: {
        color: COLORS.textLight,
    },
    datePickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        height: 50,
    },
    datePickerText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    datePickerPlaceholder: {
        color: COLORS.textLight,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    genderOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        gap: 6,
    },
    genderOptionActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    genderText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    genderTextActive: {
        color: COLORS.surface,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    submitButtonContainer: {
        marginTop: 16,
        marginBottom: 10,
        borderRadius: 14,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        backgroundColor: 'transparent',
    },
    submitButtonContainerDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    bottomSpacing: {
        height: 94,
    },
})
