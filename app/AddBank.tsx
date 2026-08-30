import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useDriverStore from '@/src/features/user/user.service';
import useAuthStore from '@/src/features/auth/auth.service';
import { showToast } from '@/src/utils/toast';
import useThemeStore from '@/src/features/theme/theme.service';

export default function AddBankScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const driverStore = useDriverStore();
    const authStore = useAuthStore();
    const themeStore = useThemeStore();
    const isDarkMode = themeStore.isDarkMode;

    const driverProfile = driverStore.driver.data;
    const user = authStore.user;

    const [bankName, setBankName] = useState('');
    const [holderName, setHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const hasBankDetails = !!(
        driverProfile?.bank_name &&
        (driverProfile?.bank_account_number || driverProfile?.account_number)
    );

    const formatAccountNumber = (num: string) => {
        if (!num) return '';
        const clean = num.replace(/\s/g, '');
        if (clean.length <= 4) return clean;
        const last4 = clean.slice(-4);
        return `XXXX XXXX ${last4}`;
    };

    useEffect(() => {
        // Fetch current driver profile/bank details from API on mount
        driverStore.getProfile();
    }, []);

    useEffect(() => {
        // Pre-fill form with existing bank details from profile if available
        if (driverProfile) {
            setBankName(driverProfile.bank_name || '');
            setHolderName(
                driverProfile.bank_holder_name || 
                driverProfile.account_holder_name || 
                driverProfile.name || 
                user?.name || 
                ''
            );
            setAccountNumber(driverProfile.bank_account_number || driverProfile.account_number || '');
            setConfirmAccountNumber(driverProfile.bank_account_number || driverProfile.account_number || '');
            setIfscCode(driverProfile.bank_ifsc || driverProfile.ifsc_code || '');
        }
    }, [driverProfile]);

    const handleSave = async () => {
        const trimmedBankName = bankName.trim();
        const trimmedHolderName = holderName.trim();
        const trimmedAccountNumber = accountNumber.trim();
        const trimmedConfirmAccountNumber = confirmAccountNumber.trim();
        const trimmedIfscCode = ifscCode.trim().toUpperCase();

        if (!trimmedBankName || !trimmedHolderName || !trimmedAccountNumber || !trimmedIfscCode) {
            Alert.alert('Error', 'Please fill in all the details.');
            return;
        }

        if (trimmedAccountNumber !== trimmedConfirmAccountNumber) {
            Alert.alert('Error', 'Account numbers do not match.');
            return;
        }

        if (trimmedAccountNumber.length < 9 || trimmedAccountNumber.length > 18) {
            Alert.alert('Error', 'Please enter a valid bank account number.');
            return;
        }

        // IFSC code validation (typically 11 characters alphanumeric)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(trimmedIfscCode)) {
            Alert.alert('Error', 'Please enter a valid IFSC code (e.g., HDFC0000245).');
            return;
        }

        setSaving(true);
        try {
            await driverStore.updateBank({
                bank_name: trimmedBankName,
                account_holder_name: trimmedHolderName,
                account_number: trimmedAccountNumber,
                ifsc_code: trimmedIfscCode,
            });

            showToast('Bank details updated successfully!');
            // Refresh local driver profile store
            await driverStore.getProfile();
            setShowForm(false);
        } catch (error) {
            console.error('Failed to save bank details:', error);
            Alert.alert('Error', 'Failed to save bank details. Please check your inputs and try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#f8f9fa' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            <ScrollView
                contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={[
                    styles.header,
                    { paddingTop: insets.top || 16 },
                    isDarkMode && { backgroundColor: '#1c1c1e', borderBottomColor: '#2c2c2e' }
                ]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, isDarkMode && { backgroundColor: '#2c2c2e' }]}
                    >
                        <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && { color: '#fff' }]}>Add/Change Bank Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Subtitle / Tip */}
                <View style={[styles.alertCard, isDarkMode && { backgroundColor: '#1b3040' }]}>
                    <Ionicons name="shield-checkmark" size={24} color="#0A84FF" />
                    <View style={styles.alertTextContainer}>
                        <Text style={[styles.alertTitle, isDarkMode && { color: '#81c784' }]}>Verification Process</Text>
                        <Text style={[styles.alertDesc, isDarkMode && { color: '#a0b0c0' }]}>
                            Please verify your details carefully. Your payouts will be sent directly to this bank account.
                        </Text>
                    </View>
                </View>

                {/* Current Bank Details Preview */}
                {hasBankDetails && (
                    <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                        <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Current Bank Details</Text>
                        
                        <View style={[styles.bankCard, isDarkMode && { backgroundColor: '#2c2c2e' }]}>
                            <Ionicons name="card-outline" size={28} color="#0A84FF" />

                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.bankName, isDarkMode && { color: '#fff' }]}>
                                    {driverProfile.bank_name}
                                </Text>
                                <Text style={[styles.bankText, isDarkMode && { color: '#aaa' }]}>
                                    {driverProfile.bank_holder_name || driverProfile.account_holder_name || driverProfile.name}
                                </Text>
                                <Text style={[styles.bankText, isDarkMode && { color: '#aaa' }]}>
                                    {formatAccountNumber(driverProfile.bank_account_number || driverProfile.account_number)}
                                </Text>
                                <Text style={[styles.bankText, isDarkMode && { color: '#aaa' }]}>
                                    IFSC: {driverProfile.bank_ifsc || driverProfile.ifsc_code}
                                </Text>
                            </View>
                        </View>

                        {!showForm && (
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setShowForm(true)}
                            >
                                <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.editButtonText}>Change Details</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Form Fields */}
                {(!hasBankDetails || showForm) && (
                    <>
                        <View style={[styles.formCard, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, isDarkMode && { color: '#a0a0a0' }]}>Bank Name</Text>
                                <TextInput
                                    style={[styles.input, isDarkMode && { backgroundColor: '#2c2c2e', color: '#fff', borderColor: '#444' }]}
                                    value={bankName}
                                    onChangeText={setBankName}
                                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, isDarkMode && { color: '#a0a0a0' }]}>Account Holder Name</Text>
                                <TextInput
                                    style={[styles.input, isDarkMode && { backgroundColor: '#2c2c2e', color: '#fff', borderColor: '#444' }]}
                                    value={holderName}
                                    onChangeText={setHolderName}
                                    placeholder="Enter account holder name"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, isDarkMode && { color: '#a0a0a0' }]}>Bank Account Number</Text>
                                <TextInput
                                    style={[styles.input, isDarkMode && { backgroundColor: '#2c2c2e', color: '#fff', borderColor: '#444' }]}
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    placeholder="Enter account number"
                                    keyboardType="numeric"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                    secureTextEntry={true}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, isDarkMode && { color: '#a0a0a0' }]}>Confirm Account Number</Text>
                                <TextInput
                                    style={[styles.input, isDarkMode && { backgroundColor: '#2c2c2e', color: '#fff', borderColor: '#444' }]}
                                    value={confirmAccountNumber}
                                    onChangeText={setConfirmAccountNumber}
                                    placeholder="Re-enter account number"
                                    keyboardType="numeric"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, isDarkMode && { color: '#a0a0a0' }]}>IFSC Code</Text>
                                <TextInput
                                    style={[styles.input, isDarkMode && { backgroundColor: '#2c2c2e', color: '#fff', borderColor: '#444' }]}
                                    value={ifscCode}
                                    onChangeText={setIfscCode}
                                    placeholder="e.g. HDFC0001234"
                                    autoCapitalize="characters"
                                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                                />
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, saving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveButtonText}>Save Details</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {showForm && hasBankDetails && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowForm(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 40,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 45,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f3f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212529',
    },
    alertCard: {
        flexDirection: 'row',
        backgroundColor: '#e7f5ff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
    },
    alertTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    alertTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0052cc',
        marginBottom: 4,
    },
    alertDesc: {
        fontSize: 13,
        color: '#334e68',
        lineHeight: 18,
    },
    formCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#495057',
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#212529',
        backgroundColor: '#fff',
    },
    saveButton: {
        backgroundColor: '#0A84FF',
        marginHorizontal: 16,
        marginTop: 24,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 12,
    },
    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
    },
    bankName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
    },
    bankText: {
        fontSize: 14,
        color: '#495057',
        marginTop: 4,
    },
    editButton: {
        backgroundColor: '#0A84FF',
        marginTop: 16,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#dee2e6',
        marginHorizontal: 16,
        marginTop: 12,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    cancelButtonText: {
        color: '#495057',
        fontSize: 16,
        fontWeight: '700',
    },
});
