import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import useAuthStore from '@/src/features/auth/auth.service';
import LayoutWrapper from '@/components/wrapper/LayoutWrapper';


const WalletScreen: React.FC = () => {
    const navigation = useNavigation();
    const store = useAuthStore();
    const router = useRouter();

    const walletBalance = store.user?.wallet_balance || 0;


    return (
        <LayoutWrapper>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Wallet</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Primary Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceCardHeader}>
                        <View style={styles.walletIconContainer}>
                            <Ionicons name="wallet" size={24} color="#fff" />
                        </View>
                        <Text style={styles.balanceLabel}>Total Balance</Text>
                    </View>

                    <Text style={styles.balanceAmount}>₹{walletBalance.toFixed(2)}</Text>

                    <View style={styles.cardFooter}>
                        <TouchableOpacity
                            style={styles.transactionLink}
                            onPress={() => router.push('/transaction/list' as any)}
                        >
                            <Text style={styles.transactionLinkText}>View All Transactions</Text>
                            <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Balance Breakdown Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Withdrawal Balance</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoLeft}>
                                <View style={styles.iconCircle}>
                                    <MaterialCommunityIcons name="currency-inr" size={20} color="#43A047" />
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>Available to Withdraw</Text>
                                    <Text style={styles.infoSubLabel}>Order earnings & bonuses</Text>
                                </View>
                            </View>
                            <Text style={styles.infoAmount}>₹{walletBalance.toFixed(2)}</Text>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.withdrawButton}
                            onPress={() => router.push('/Withdraw')}
                        >
                            <Text style={styles.withdrawButtonText}>Withdraw to Bank</Text>

                            <Feather name="external-link" size={16} color="#fff" />
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Quick Actions/Info */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => router.push('/SecurePayment')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#e7f5ff' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#228be6" />
                        </View>
                        <Text style={styles.actionText}>Secure Payments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => router.push('/FastPayout')}
                    >

                        <View style={[styles.actionIcon, { backgroundColor: '#ebfbee' }]}>
                            <Ionicons name="flash" size={20} color="#40c057" />
                        </View>
                        <Text style={styles.actionText}>Fast Payouts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => router.push('/Support')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fff5f5' }]}>
                            <Ionicons name="headset" size={20} color="#fa5252" />
                        </View>
                        <Text style={styles.actionText}>24/7 Support</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </LayoutWrapper >
    );
};

export default WalletScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontSize: 22,
        fontWeight: '700',
        color: '#212529',
    },
    balanceCard: {
        margin: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    balanceCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    walletIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    balanceLabel: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 'bold',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 20,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    transactionLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionLinkText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginRight: 6,
        fontWeight: '600',
    },
    section: {
        marginTop: 8,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#484849',
        marginBottom: 12,
        marginLeft: 4,
    },
    infoCard: {
        backgroundColor: '#e7e7e7',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e7e7e7',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f3f5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
    },
    infoSubLabel: {
        fontSize: 12,
        color: '#868e96',
    },
    infoAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212529',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f3f5',
        marginBottom: 16,
    },
    withdrawButton: {
        backgroundColor: '#000',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    withdrawButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginRight: 8,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 32,
        marginBottom: 40,
    },
    actionItem: {
        alignItems: 'center',
        flex: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#495057',
        textAlign: 'center',
    },
});
