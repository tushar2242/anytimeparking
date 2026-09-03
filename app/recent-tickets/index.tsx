import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/src/features/theme/theme.service';
import useValetStore from '@/src/features/valetOrder/order.service';
import BottomTabBar from '@/components/navigation/BottomTabBar';

// Mock/Sample Recent Tickets Data as fallback when API data is empty
const MOCK_TICKETS = [
    {
        id: '1',
        ticketId: 'VP-983075',
        vehicleNumber: '7XYZ123',
        vehicleModel: 'Mercedes-Benz E-Class',
        vehicleColor: 'Black',
        ownerName: 'Michael Scott',
        phone: '(310) 555-0199',
        parkingSite: 'LAX Terminal 4 Valet Lot A',
        keySlot: 'Key Box #A-14',
        status: 'parked',
        requestedAt: 'Sep 2, 2026 at 11:29 PM',
        entryTime: '11:29 PM',
        exitTime: null,
        duration: '1h 45m',
    },
    {
        id: '2',
        ticketId: 'VP-882194',
        vehicleNumber: 'ABC-1234',
        vehicleModel: 'BMW 5 Series',
        vehicleColor: 'Silver',
        ownerName: 'David Miller',
        phone: '(212) 555-0143',
        parkingSite: 'Beverly Hills Grand Valet',
        keySlot: 'Key Box #B-08',
        status: 'returned',
        requestedAt: 'Sep 2, 2026 at 09:15 PM',
        entryTime: '09:15 PM',
        exitTime: '10:45 PM',
        duration: '1h 30m',
    },
    {
        id: '3',
        ticketId: 'VP-774102',
        vehicleNumber: 'TEX-4589',
        vehicleModel: 'Tesla Model S',
        vehicleColor: 'White',
        ownerName: 'Sarah Johnson',
        phone: '(415) 555-2671',
        parkingSite: 'Downtown Plaza Valet',
        keySlot: 'Key Box #C-02',
        status: 'parked',
        requestedAt: 'Sep 2, 2026 at 08:30 PM',
        entryTime: '08:30 PM',
        exitTime: null,
        duration: '3h 15m',
    },
    {
        id: '4',
        ticketId: 'VP-663219',
        vehicleNumber: 'FL-8821',
        vehicleModel: 'Ford Explorer',
        vehicleColor: 'Grey',
        ownerName: 'James Wilson',
        phone: '(305) 555-8833',
        parkingSite: 'Manhattan Center Valet',
        keySlot: 'Key Box #A-05',
        status: 'returned',
        requestedAt: 'Sep 2, 2026 at 06:00 PM',
        entryTime: '06:00 PM',
        exitTime: '08:15 PM',
        duration: '2h 15m',
    },
];

export default function RecentTicketsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDarkMode = useThemeStore().isDarkMode;
    const valetStore = useValetStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'parked' | 'returned'>('all');
    const [loading, setLoading] = useState(false);

    const storeOrders = valetStore.valet.myOrders || [];

    useEffect(() => {
        setLoading(true);
        valetStore
            .myOrder(['upcoming', 'running', 'completed', 'accepted', 'booked', 'parked', 'returned', 'cancelled'])
            .finally(() => setLoading(false));
    }, []);

    // Format raw order data or fallback to MOCK_TICKETS
    const ticketsList = storeOrders.length > 0
        ? storeOrders.map((ord: any) => ({
            id: String(ord.id || ord.order_id || Math.random()),
            ticketId: ord.ticket_number || ord.order_id || `VP-${ord.id || '983075'}`,
            vehicleNumber: ord.vehicle_number || '7XYZ123',
            vehicleModel: ord.vehicle_model || ord.vehicle_name || 'Valet Vehicle',
            vehicleColor: ord.vehicle_color || 'Black',
            ownerName: ord.customer_name || ord.user_name || 'Customer',
            phone: ord.customer_phone || ord.phone || 'N/A',
            parkingSite: ord.parking_site || ord.location || 'Valet Lot',
            keySlot: ord.key_slot || `Key Box #${ord.id || '01'}`,
            status: (ord.status === 'returned' || ord.status === 'completed') ? 'returned' : 'parked',
            requestedAt: ord.requested_at ? new Date(ord.requested_at).toLocaleString() : 'Recent',
            entryTime: ord.parked_at ? new Date(ord.parked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:29 PM',
            exitTime: ord.returned_at ? new Date(ord.returned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            duration: '1h 45m',
        }))
        : MOCK_TICKETS;

    // Filter tickets based on search query and status filter
    const filteredTickets = ticketsList.filter((item) => {
        const matchesSearch =
            item.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            selectedStatus === 'all' ? true : item.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    const headerPaddingTop = Math.max(insets.top, 20) + 12;

    const renderTicketCard = ({ item }: { item: typeof MOCK_TICKETS[0] }) => {
        const isReturned = item.status === 'returned';

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={[
                    styles.ticketCard,
                    isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' },
                ]}
                onPress={() => router.push(`/recent-tickets/${item.id}` as any)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.ticketIdRow}>
                        <Ionicons name="receipt-outline" size={18} color="#0066FF" style={{ marginRight: 6 }} />
                        <Text style={[styles.ticketIdText, isDarkMode && { color: '#fff' }]}>
                            {item.ticketId}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            isReturned
                                ? { backgroundColor: 'rgba(52, 199, 89, 0.12)' }
                                : { backgroundColor: 'rgba(255, 133, 27, 0.12)' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusBadgeText,
                                isReturned ? { color: '#34C759' } : { color: '#FF851B' },
                            ]}
                        >
                            {isReturned ? 'RETURNED' : 'PARKED'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.vehicleInfoRow}>
                        <Ionicons name="car" size={20} color={isDarkMode ? '#0A84FF' : '#0066FF'} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.vehicleNumberText, isDarkMode && { color: '#fff' }]}>
                                {item.vehicleNumber}
                            </Text>
                            <Text style={[styles.vehicleModelText, isDarkMode && { color: '#8E8E93' }]}>
                                {item.vehicleModel} • {item.vehicleColor}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardDetailsGrid}>
                        <View style={styles.detailCol}>
                            <Text style={styles.detailLabel}>Customer</Text>
                            <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>
                                {item.ownerName}
                            </Text>
                        </View>
                        <View style={styles.detailCol}>
                            <Text style={styles.detailLabel}>Key Location</Text>
                            <Text style={[styles.detailValue, { color: '#0066FF', fontWeight: '700' }]}>
                                {item.keySlot}
                            </Text>
                        </View>
                        <View style={styles.detailCol}>
                            <Text style={styles.detailLabel}>Time</Text>
                            <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>
                                {item.entryTime}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterText}>Tap to view ticket & key details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#0066FF" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FB' }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Top Navbar */}
            <View style={[styles.topNavbar, { paddingTop: headerPaddingTop, borderBottomColor: isDarkMode ? '#2C2C2E' : '#E5E9F0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, isDarkMode && { color: '#fff' }]}>Recent Tickets</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Search and Filters */}
            <View style={styles.searchSection}>
                <View style={[styles.searchBar, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <Feather name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search Ticket ID, Vehicle #, Name..."
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, isDarkMode && { color: '#fff' }]}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#8E8E93" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Chips */}
                <View style={styles.filterChipRow}>
                    {(['all', 'parked', 'returned'] as const).map((status) => {
                        const isSelected = selectedStatus === status;
                        const label = status === 'all' ? 'All Tickets' : status === 'parked' ? 'Parked Vehicles' : 'Returned';

                        return (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.filterChip,
                                    isSelected
                                        ? { backgroundColor: '#0066FF' }
                                        : [styles.filterChipInactive, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }],
                                ]}
                                onPress={() => setSelectedStatus(status)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        isSelected ? { color: '#fff', fontWeight: '700' } : [styles.filterChipTextInactive, isDarkMode && { color: '#8E8E93' }],
                                    ]}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Main List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0066FF" />
                    <Text style={[styles.loadingText, isDarkMode && { color: '#8E8E93' }]}>Loading recent tickets...</Text>
                </View>
            ) : filteredTickets.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="receipt-outline" size={54} color="#8E8E93" style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyTitle, isDarkMode && { color: '#fff' }]}>No Tickets Found</Text>
                    <Text style={styles.emptySubText}>Try searching with a different keyword or filter.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTickets}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTicketCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Bottom Navigation Tab Bar */}
            <BottomTabBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topNavbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 46,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E9F0',
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1C1C1E',
    },
    filterChipRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    filterChipInactive: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterChipTextInactive: {
        color: '#6E7A90',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 110, // Padding above bottom tab bar
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E9F0',
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ticketIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ticketIdText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardBody: {
        marginBottom: 10,
    },
    vehicleInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    vehicleNumberText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    vehicleModelText: {
        fontSize: 12,
        color: '#6E7A90',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F3F5',
        marginVertical: 10,
    },
    cardDetailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailCol: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#8E8E93',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#F1F3F5',
    },
    cardFooterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0066FF',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6E7A90',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    emptySubText: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 4,
        textAlign: 'center',
    },
});
