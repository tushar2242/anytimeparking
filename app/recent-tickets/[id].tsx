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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/src/features/theme/theme.service';
import BottomTabBar from '@/components/navigation/BottomTabBar';

export default function TicketDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDarkMode = useThemeStore().isDarkMode;

    // Ticket details data (fallback to mock if specific ID is loaded)
    const ticketData = {
        ticketId: typeof id === 'string' && id.startsWith('VP') ? id : `VP-983075`,
        status: 'parked',
        vehicleNumber: '7XYZ123',
        vehicleModel: 'Mercedes-Benz E-Class',
        vehicleColor: 'Obsidian Black',
        ownerName: 'Michael Scott',
        phone: '+1 (310) 555-0199',
        parkingSite: 'LAX Terminal 4 Valet Lot A',
        attendedBy: 'Alex Morgan (Valet Manager)',
        entryTime: 'Sep 2, 2026 at 11:29 PM',
        exitTime: 'Pending / Active Session',
        duration: '1h 45m',
        // Key Generation Details
        keyTagNumber: 'KEY-BOX-A14',
        keySlotLocation: 'Storage Box Shelf A - Slot #14',
        keyHandoverStatus: 'Secured in Valet Storage',
        keyGeneratedAt: 'Sep 2, 2026 at 11:30 PM',
        // Initial inspection photos checklist
        inspectionPhotos: [
            { label: 'Front View', captured: true },
            { label: 'Rear View', captured: true },
            { label: 'Left Side', captured: true },
            { label: 'Right Side', captured: true },
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
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 133, 27, 0.15)' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#FF851B' }]}>ACTIVE PARKED</Text>
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
