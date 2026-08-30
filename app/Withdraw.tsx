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
    StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAuthStore from '@/src/features/auth/auth.service';
import useDriverStore from '@/src/features/user/user.service';
import useThemeStore from '@/src/features/theme/theme.service';
import Api from '@/src/Api/api';
import { showToast } from '@/src/utils/toast';

export default function WithdrawScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const authStore = useAuthStore();
    const driverStore = useDriverStore();
    const themeStore = useThemeStore();
    const isDarkMode = themeStore.isDarkMode;

    const walletBalance = authStore.user?.wallet_balance || 0;
    const driverProfile = driverStore.driver.data;

    const [amount, setAmount] = useState('');
    const [checked, setChecked] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        // Fetch current driver bank details and wallet balance on mount
        driverStore.getProfile();
        authStore.actions.me().catch((err) => console.log('Failed to fetch auth info on mount:', err));
    }, []);

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

    const receiveAmount = Number(amount || 0);

    const handleWithdraw = async () => {
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }

        if (numAmount < 100) {
            Alert.alert('Error', 'Minimum withdrawal amount is ₹100.');
            return;
        }

        if (numAmount > walletBalance) {
            Alert.alert('Error', 'Insufficient balance in wallet.');
            return;
        }

        if (!hasBankDetails) {
            Alert.alert('Error', 'Please add bank details first.');
            return;
        }

        if (!checked) {
            Alert.alert('Error', 'Please confirm that your bank details are correct.');
            return;
        }

        setWithdrawing(true);
        try {
            await Api.post('/driver/withdraw', {
                amount: numAmount,
            });

            showToast('Withdrawal request submitted successfully!');

            // Refresh profile wallet balance
            await authStore.actions.me();
            
            router.back();
        } catch (error: any) {
            console.error('Withdrawal failed:', error);
            // The global handleApiError already handles showing toast, but let's show detail if it doesn't match
            Alert.alert('Error', typeof error === 'string' ? error : 'Failed to process withdrawal. Please try again.');
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#f8f9fa' }}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            {/* Header */}
            <View style={[
                styles.header,
                { paddingTop: insets.top || 16 },
                isDarkMode && { backgroundColor: '#1c1c1e', borderBottomColor: '#2c2c2e' }
            ]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, isDarkMode && { backgroundColor: '#2c2c2e' }]}
                >
                    <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && { color: '#fff' }]}>Withdraw to Bank</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance */}
                <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                    <Text style={[styles.label, isDarkMode && { color: '#a0a0a0' }]}>Available Balance</Text>
                    <Text style={[styles.balance, isDarkMode && { color: '#81c784' }]}>₹{walletBalance.toFixed(2)}</Text>
                </View>

                {/* Bank */}
                <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                    <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Bank Account</Text>

                    {hasBankDetails ? (
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
                            </View>

                            <TouchableOpacity onPress={() => router.push('/AddBank')}>
                                <Text style={styles.change}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.noBankContainer}>
                            <Feather name="alert-triangle" size={28} color="#ff9800" style={{ marginBottom: 8 }} />
                            <Text style={[styles.noBankText, isDarkMode && { color: '#ccc' }]}>
                                No bank account linked. Please add your bank details to enable withdrawals.
                            </Text>
                            <TouchableOpacity
                                style={styles.addBankButton}
                                onPress={() => router.push('/AddBank')}
                            >
                                <Feather name="plus" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.addBankButtonText}>Add Bank Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Amount */}
                <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                    <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Enter Amount</Text>

                    <TextInput
                        style={[styles.input, isDarkMode && { backgroundColor: '#2c2c2e', color: '#fff', borderColor: '#444' }]}
                        placeholder="₹ Enter amount"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    />

                    <Text style={[styles.note, isDarkMode && { color: '#888' }]}>
                        Minimum ₹100 • Maximum ₹{walletBalance.toFixed(2)}
                    </Text>
                </View>

                {/* Summary */}
                <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                    <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Withdrawal Summary</Text>

                    <View style={styles.row}>
                        <Text style={isDarkMode && { color: '#fff' }}>Amount</Text>
                        <Text style={isDarkMode && { color: '#fff' }}>₹{receiveAmount.toFixed(2)}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={isDarkMode && { color: '#fff' }}>Processing Fee</Text>
                        <Text style={isDarkMode && { color: '#fff' }}>₹0.00</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={isDarkMode && { color: '#fff' }}>GST</Text>
                        <Text style={isDarkMode && { color: '#fff' }}>₹0.00</Text>
                    </View>

                    <View style={[styles.line, isDarkMode && { backgroundColor: '#2c2c2e' }]} />

                    <View style={styles.row}>
                        <Text style={[styles.receive, isDarkMode && { color: '#fff' }]}>{"You'll Receive"}</Text>
                        <Text style={[styles.receive, isDarkMode && { color: '#81c784' }]}>₹{receiveAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Notes */}
                <View style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                    <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Important</Text>

                    <Text style={[styles.note, isDarkMode && { color: '#aaa' }]}>• Withdrawal time: 5-30 minutes</Text>
                    <Text style={[styles.note, isDarkMode && { color: '#aaa' }]}>• Bank account must be verified.</Text>
                    <Text style={[styles.note, isDarkMode && { color: '#aaa' }]}>• Minimum withdrawal ₹100.</Text>
                    <Text style={[styles.note, isDarkMode && { color: '#aaa' }]}>• Amount cannot exceed wallet balance.</Text>
                </View>

                {/* Checkbox */}
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setChecked(!checked)}
                    disabled={!hasBankDetails}
                >
                    <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={hasBankDetails ? '#0A84FF' : '#888'}
                    />

                    <Text style={[{ marginLeft: 10 }, isDarkMode && { color: '#fff' }, !hasBankDetails && { color: '#888' }]}>
                        I confirm my bank details are correct.
                    </Text>
                </TouchableOpacity>

                {/* Button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        { opacity: checked && Number(amount) >= 100 && Number(amount) <= walletBalance && hasBankDetails && !withdrawing ? 1 : 0.5 },
                    ]}
                    onPress={handleWithdraw}
                    disabled={!checked || Number(amount) < 100 || Number(amount) > walletBalance || !hasBankDetails || withdrawing}
                >
                    {withdrawing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Withdraw Now</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 45,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f3f5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    card: {
        backgroundColor: '#fff',
        margin: 15,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    label: {
        color: '#666',
        fontSize: 14,
    },

    balance: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
        color: '#2e7d32',
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 15,
    },

    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
        padding: 15,
        borderRadius: 10,
    },

    bankName: {
        fontSize: 16,
        fontWeight: '700',
    },

    bankText: {
        color: '#666',
        marginTop: 2,
        fontSize: 14,
    },

    change: {
        color: '#0A84FF',
        fontWeight: '600',
    },

    noBankContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
    },

    noBankText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginVertical: 12,
        lineHeight: 20,
    },

    addBankButton: {
        backgroundColor: '#0A84FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },

    addBankButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },

    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        padding: 15,
        fontSize: 18,
    },

    note: {
        color: '#777',
        marginTop: 8,
        fontSize: 13,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 8,
    },

    line: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 10,
    },

    receive: {
        fontWeight: 'bold',
        fontSize: 17,
    },

    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
        marginTop: 10,
    },

    button: {
        backgroundColor: '#0A84FF',
        margin: 20,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },

    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
});