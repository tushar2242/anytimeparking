import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import useTransactionStore from '@/src/features/transaction/trans.service'
import LayoutWrapper from '@/components/wrapper/LayoutWrapper'
import useThemeStore from '@/src/features/theme/theme.service'

const TABS: ('all' | 'pending' | 'completed')[] = ['all', 'pending', 'completed']

const TransactionListScreen: React.FC = () => {
    const router = useRouter()
    const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'completed'>('all')

    const { transaction } = useTransactionStore()
    const { list, loading } = transaction
    const { list: fetchTransactions, paginate } = useTransactionStore.getState().get
    const filteredList = (list || []).filter((item) => {
        // Hide bonus transactions
        if (item.type?.toLowerCase() === 'bonus') {
            return false;
        }

        if (selectedTab === 'pending') {
            return item.status === 'pending';
        }

        if (selectedTab === 'completed') {
            return item.status === 'completed';
        }

        return true;
    });

    // Run whenever the selected tab changes
    useEffect(() => {
        if (selectedTab === 'all') {
            fetchTransactions({});
        } else {
            paginate({
                status: selectedTab,
            });
        }
    }, [selectedTab]);

    const getTransactionIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'withdraw':
                return { name: 'arrow-up-right', color: '#fa5252', bgColor: '#fff5f5' };
            case 'payment':
                return { name: 'shopping-bag', color: '#228be6', bgColor: '#e7f5ff' };
            default:
                return { name: 'arrow-down-left', color: '#40c057', bgColor: '#ebfbee' };
        }
    }

    const renderItem = ({ item }: { item: any }) => {
        const icon = getTransactionIcon(item.type);
        const isDebit = item.type === 'withdraw' || item.type === 'payment';
        const isDarkMode = useThemeStore.getState().isDarkMode;
        
        const rawBgColor = isDarkMode ? '#2c2c2e' : icon.bgColor;
        const rawIconColor = isDarkMode ? (item.type === 'withdraw' || item.type === 'payment' ? '#fa5252' : '#81c784') : icon.color;

        return (
            <View style={[styles.transactionCard, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                <View style={styles.cardMain}>
                    <View style={[styles.iconContainer, { backgroundColor: rawBgColor }]}>
                        <Feather name={icon.name as any} size={20} color={rawIconColor} />
                    </View>
                    <View style={styles.details}>
                        <Text style={[styles.typeText, isDarkMode && { color: '#ffffff' }]}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
                        <Text style={[styles.dateText, isDarkMode && { color: '#a0a0a0' }]}>{new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={[styles.amountText, isDebit ? styles.debitText : styles.creditText]}>
                            {isDebit ? '-' : '+'}{'$'}{item.amount.toFixed(2)}
                        </Text>
                    </View>
                </View>
                <View style={[styles.cardFooter, isDarkMode && { borderTopColor: '#2c2c2e' }]}>
                    <Text style={[styles.refText, isDarkMode && { color: '#a0a0a0' }]}>Ref: {item.reference_id}</Text>
                    <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
                        <Text style={[styles.statusBadgeText, item.status === 'completed' ? styles.statusCompletedText : styles.statusPendingText]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>
        )
    }

    const isDarkMode = useThemeStore().isDarkMode;

    return (
        <LayoutWrapper>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
                <View style={[styles.header, isDarkMode && { backgroundColor: '#121212' }]}>
                    <TouchableOpacity
                        onPress={() => router.push('/wallet' as any)}
                        style={[styles.backButton, isDarkMode && { backgroundColor: '#2c2c2e' }]}
                    >
                        <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && { color: '#fff' }]}>Transactions</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={[styles.tabContainer, isDarkMode && { backgroundColor: '#121212', borderBottomColor: '#2c2c2e' }]}>
                    <View style={[styles.tabList, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, selectedTab === tab && (isDarkMode ? { backgroundColor: '#fff' } : styles.activeTabItem)]}
                                onPress={() => setSelectedTab(tab)}
                            >
                                <Text style={[styles.tabText, selectedTab === tab && { color: isDarkMode ? '#000' : '#fff' }]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <View style={[styles.loaderContainer, isDarkMode && { backgroundColor: '#121212' }]}>
                        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredList}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIconContainer, isDarkMode && { backgroundColor: '#2c2c2e' }]}>
                                    <Feather name="list" size={40} color={isDarkMode ? '#666' : '#adb5bd'} />
                                </View>
                                <Text style={[styles.emptyTitle, isDarkMode && { color: '#ffffff' }]}>No Transactions</Text>
                                <Text style={[styles.emptySubtitle, isDarkMode && { color: '#a0a0a0' }]}>
                                    {"You don't have any "}{selectedTab === 'all' ? '' : selectedTab}{" Transactions yet."}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </LayoutWrapper>
    )
}

export default TransactionListScreen

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
        fontSize: 18,
        fontWeight: '700',
        color: '#212529',
    },
    tabContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5',
    },
    tabList: {
        flexDirection: 'row',
        backgroundColor: '#f1f3f5',
        borderRadius: 12,
        padding: 4,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    activeTabItem: {
        backgroundColor: '#000',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6c757d',
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    transactionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f3f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    details: {
        flex: 1,
    },
    typeText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 12,
        color: '#868e96',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '800',
    },
    debitText: {
        color: '#fa5252',
    },
    creditText: {
        color: '#40c057',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f8f9fa',
    },
    refText: {
        fontSize: 11,
        color: '#adb5bd',
        fontFamily: 'System',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusCompleted: {
        backgroundColor: '#ebfbee',
    },
    statusCompletedText: {
        color: '#40c057',
    },
    statusPending: {
        backgroundColor: '#fff9db',
    },
    statusPendingText: {
        color: '#f59f00',
    },
    loaderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f3f5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#868e96',
        textAlign: 'center',
        lineHeight: 20,
    },
})
