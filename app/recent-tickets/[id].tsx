import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/src/features/theme/theme.service';
import BottomTabBar from '@/components/navigation/BottomTabBar';

import Api from '@/src/Api/api';

export default function TicketDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDarkMode = useThemeStore().isDarkMode;
    const [loading, setLoading] = React.useState(true);

    const [liveTicket, setLiveTicket] = React.useState<any>(null);

    React.useEffect(() => {
        if (!id) return;
        const fetchTicket = async () => {
            setLoading(true);
            try {
                // Try fetching card-parking ticket
                try {
                    const res = await Api.get(`/card-parking/${encodeURIComponent(String(id))}`);
                    const data = res.data || res.ticket || res;
                    if (data && (data.id || data.ticket_no || data.car_no)) {
                        setLiveTicket(data);
                        return;
                    }
                } catch (e) {
                    console.log('Direct card-parking lookup notice:', e);
                }

                // If not found in card-parking direct endpoint, try order detail
                try {
                    const orderRes = await Api.get(`/order/${encodeURIComponent(String(id))}`);
                    const orderData = orderRes.data?.order || orderRes.data || orderRes;
                    if (orderData && (orderData.id || orderData.order_id || orderData.vehicle_number)) {
                        setLiveTicket(orderData);
                        return;
                    }
                } catch (oErr) {
                    console.log('Order detail lookup notice:', oErr);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [id]);

    // Build unified ticketData from liveTicket
    const tId = liveTicket?.ticket_no || liveTicket?.ticket_number || liveTicket?.order_id || (typeof id === 'string' ? id : `VP-${liveTicket?.id || ''}`);
    const carNo = liveTicket?.car_no || liveTicket?.vehicle_number || 'N/A';
    const vModel = liveTicket?.vehicle_model || liveTicket?.vehicle_type || [liveTicket?.brand, liveTicket?.model].filter(Boolean).join(' ') || 'Vehicle';
    const vColor = liveTicket?.color || liveTicket?.vehicle_color || 'N/A';
    const custName = liveTicket?.name || liveTicket?.customer_name || liveTicket?.owner_name || liveTicket?.user_name || 'Customer';
    const custPhone = liveTicket?.mobile_no || liveTicket?.phone_no || liveTicket?.phone || liveTicket?.customer_phone || 'N/A';
    const pSite = liveTicket?.parking_site || liveTicket?.site?.name || liveTicket?.valet_site?.name || liveTicket?.location || 'Valet Site';
    const isRet = liveTicket?.status === 'returned' || liveTicket?.status === 'completed';
    const reqAt = liveTicket?.created_at ? new Date(liveTicket.created_at).toLocaleString() : (liveTicket?.requested_at ? new Date(liveTicket.requested_at).toLocaleString() : 'Recent');
    const exitT = liveTicket?.exit_time ? new Date(liveTicket.exit_time).toLocaleString() : (liveTicket?.returned_at ? new Date(liveTicket.returned_at).toLocaleString() : (isRet ? 'Completed' : 'Active Session'));

    const ticketData = {
        ticketId: tId,
        status: isRet ? 'returned' : 'parked',
        vehicleNumber: carNo,
        vehicleModel: vModel,
        vehicleColor: vColor,
        ownerName: custName,
        phone: custPhone,
        parkingSite: pSite,
        attendedBy: liveTicket?.driver?.name || liveTicket?.attended_by || 'Valet Driver',
        entryTime: reqAt,
        exitTime: exitT,
        keyTagNumber: liveTicket?.key_slot ? `KEY-${liveTicket.key_slot}` : `KEY-BOX-${String(id || '').slice(-4).toUpperCase()}`,
        keySlotLocation: liveTicket?.key_slot || (liveTicket?.valet_slot ? `Slot #${liveTicket.valet_slot}` : 'Valet Storage Shelf'),
        keyHandoverStatus: isRet ? 'Handed over to owner' : 'Secured in Valet Storage',
        keyGeneratedAt: reqAt,
        inspectionPhotos: [
            { label: 'Front View', captured: !!liveTicket?.photo || !!liveTicket?.photo_front },
            { label: 'Rear View', captured: !!liveTicket?.photo_rear },
            { label: 'Left Side', captured: !!liveTicket?.photo_left },
            { label: 'Right Side', captured: !!liveTicket?.photo_right },
        ],
    };

    const headerPaddingTop = Math.max(insets.top, 20) + 12;

    const handleShareWhatsApp = () => {
        const text = `🚗 *Valet Parking Ticket Details*\n\n` +
            `*Ticket ID:* ${ticketData.ticketId}\n` +
            `*Vehicle:* ${ticketData.vehicleModel} (${ticketData.vehicleNumber})\n` +
            `*Customer:* ${ticketData.ownerName}\n` +
            `*Key Slot:* ${ticketData.keySlotLocation}\n` +
            `*Entry Time:* ${ticketData.entryTime}\n` +
            `*Location:* ${ticketData.parkingSite}`;

        const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert('Share', text);
                }
            })
            .catch(() => Alert.alert('Share', text));
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FB' }]}>
                <ActivityIndicator size="large" color="#0066FF" />
                <Text style={[styles.loadingText, isDarkMode && { color: '#8E8E93' }]}>Loading ticket details...</Text>
            </View>
        );
    }

    if (!liveTicket) {
        return (
            <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FB' }]}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
                <View style={[styles.topNavbar, { paddingTop: headerPaddingTop, borderBottomColor: isDarkMode ? '#2C2C2E' : '#E5E9F0' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, isDarkMode && { color: '#fff' }]}>Ticket Details</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={54} color="#8E8E93" style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyTitle, isDarkMode && { color: '#fff' }]}>Ticket Not Found</Text>
                    <Text style={styles.emptySubText}>Could not find details for ticket #{String(id)}.</Text>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.secondaryBtn, { marginTop: 20, paddingHorizontal: 24 }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.secondaryBtnText}>GO BACK</Text>
                    </TouchableOpacity>
                </View>
                <BottomTabBar />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FB' }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Top Navbar */}
            <View style={[styles.topNavbar, { paddingTop: headerPaddingTop, borderBottomColor: isDarkMode ? '#2C2C2E' : '#E5E9F0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, isDarkMode && { color: '#fff' }]}>Ticket Details</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Main Status Header Card */}
                <View style={[styles.statusHeaderCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <View style={styles.statusBadgeRow}>
                        <View style={styles.ticketIdPill}>
                            <Ionicons name="receipt" size={16} color="#0066FF" style={{ marginRight: 6 }} />
                            <Text style={styles.ticketIdPillText}>{ticketData.ticketId}</Text>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                isRet
                                    ? { backgroundColor: 'rgba(52, 199, 89, 0.15)' }
                                    : { backgroundColor: 'rgba(255, 133, 27, 0.15)' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    isRet ? { color: '#34C759' } : { color: '#FF851B' },
                                ]}
                            >
                                {isRet ? 'RETURNED' : 'ACTIVE PARKED'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.vehicleTitle, isDarkMode && { color: '#fff' }]}>
                        {ticketData.vehicleNumber}
                    </Text>
                    <Text style={styles.vehicleSubtitle}>
                        {ticketData.vehicleModel} • {ticketData.vehicleColor}
                    </Text>
                </View>

                {/* Section 1: Ticket Generation Details */}
                <View style={[styles.sectionCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Ionicons name="document-text-outline" size={20} color="#0066FF" style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Ticket Generation Info</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Customer Name</Text>
                        <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>{ticketData.ownerName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Phone Number</Text>
                        <Text style={[styles.detailValue, { color: '#0066FF', fontWeight: '700' }]}>{ticketData.phone}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Parking Location</Text>
                        <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>{ticketData.parkingSite}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Entry Time</Text>
                        <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>{ticketData.entryTime}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Attended By</Text>
                        <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>{ticketData.attendedBy}</Text>
                    </View>

                    {/* Initial Inspection Checklist */}
                    <Text style={[styles.subSectionTitle, isDarkMode && { color: '#fff' }]}>Vehicle Inspection Photos</Text>
                    <View style={styles.photoChipsRow}>
                        {ticketData.inspectionPhotos.map((photo, idx) => (
                            <View key={idx} style={[styles.photoChip, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                                <Ionicons name="checkmark-circle" size={16} color="#34C759" style={{ marginRight: 6 }} />
                                <Text style={[styles.photoChipText, isDarkMode && { color: '#fff' }]}>{photo.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Section 2: Key Generation & Handover Details */}
                <View style={[styles.sectionCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Ionicons name="key-outline" size={20} color="#FF851B" style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Key Storage & Generation</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Key Tag Code</Text>
                        <Text style={[styles.detailValue, { color: '#FF851B', fontWeight: '800' }]}>{ticketData.keyTagNumber}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Key Slot Location</Text>
                        <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>{ticketData.keySlotLocation}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Key Storage Status</Text>
                        <Text style={[styles.detailValue, { color: '#34C759', fontWeight: '700' }]}>{ticketData.keyHandoverStatus}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Key Tagged At</Text>
                        <Text style={[styles.detailValue, isDarkMode && { color: '#fff' }]}>{ticketData.keyGeneratedAt}</Text>
                    </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn]}
                        onPress={handleShareWhatsApp}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>SHARE TICKET</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.secondaryBtn, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                        onPress={() => router.push('/card-parking' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="scan-outline" size={18} color="#0066FF" style={{ marginRight: 8 }} />
                        <Text style={styles.secondaryBtnText}>RETURN KEY</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

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
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 110, // Safe padding above bottom tab bar
    },
    statusHeaderCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E9F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    statusBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ticketIdPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 102, 255, 0.08)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    ticketIdPillText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0066FF',
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    vehicleTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    vehicleSubtitle: {
        fontSize: 14,
        color: '#6E7A90',
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F1F3F5',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#8E8E93',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    subSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1C1C1E',
        marginTop: 14,
        marginBottom: 10,
    },
    photoChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
    },
    photoChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtn: {
        backgroundColor: '#25D366',
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryBtn: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E9F0',
    },
    secondaryBtnText: {
        color: '#0066FF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
