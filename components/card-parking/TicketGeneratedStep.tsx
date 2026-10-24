import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VehicleInspectionSummary from '@/components/card-parking/VehicleInspectionSummary';
import { formatDateTime } from '@/src/utils/date';
import { ValetSite } from '@/components/card-parking/SiteSelectionStep';

const qrcode = require('qrcode-generator');

interface TicketGeneratedStepProps {
    createdTicket: any;
    ticketNumber: string;
    parkingTime: string;
    selectedSite: ValetSite | null;
    licensePlate: string;
    brand: string;
    customBrand: string;
    model: string;
    color: string;
    driverName: string;
    phone: string;
    keySlot: string;
    webTicketUrl: string;
    baseURL: string;
    isDarkMode: boolean;
    themeColor: string;
    themeColorLight: string;
    onSavePdf: () => void;
    onOpenWebsite: () => void;
    onShareLink: () => void;
    onSendWhatsApp: () => void;
    onDone: () => void;
}

export default function TicketGeneratedStep({
    createdTicket,
    ticketNumber,
    parkingTime,
    selectedSite,
    licensePlate,
    brand,
    customBrand,
    model,
    color,
    driverName,
    phone,
    keySlot,
    webTicketUrl,
    baseURL,
    isDarkMode,
    themeColor,
    themeColorLight,
    onSavePdf,
    onOpenWebsite,
    onShareLink,
    onSendWhatsApp,
    onDone,
}: TicketGeneratedStepProps) {
    const getLocalQrUri = (text: string): string => {
        if (!text) return '';
        try {
            const qr = qrcode(4, 'L');
            qr.addData(text);
            qr.make();
            return qr.createDataURL(10, 4);
        } catch (err) {
            return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
        }
    };

    const getTicketWebUrl = (tNo: string): string => {
        if (!tNo) return '';
        if (webTicketUrl) return webTicketUrl;
        if (createdTicket?.ticket_url || createdTicket?.web_url || createdTicket?.url) {
            return createdTicket.ticket_url || createdTicket.web_url || createdTicket.url;
        }
        if (baseURL && baseURL.startsWith('http')) {
            const cleanBase = baseURL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
            const webBase = cleanBase.includes('valet-api.')
                ? cleanBase.replace('valet-api.', 'valet.')
                : cleanBase;
            return `${webBase}/ticket/${encodeURIComponent(tNo)}`;
        }
        return `https://valet.botsupport.in/ticket/${encodeURIComponent(tNo)}`;
    };

    const activeTicketNumber = createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber;

    return (
        <View style={styles.innerContent}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScrollContainer}>
                <View style={styles.successBanner}>
                    <View style={styles.successIconWrapper}>
                        <Ionicons name="checkmark" size={24} color="#fff" />
                    </View>
                    <View style={styles.successTexts}>
                        <Text style={styles.successTitle}>Vehicle Check-In Successful</Text>
                        <Text style={styles.successSubtitleStatus}>
                            Status: {(createdTicket?.status || 'PARKED').toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Styled Valet Ticket Card */}
                <View style={[styles.ticketCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Ticket Number</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {activeTicketNumber}
                        </Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Parking Location</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {createdTicket?.parking_site || createdTicket?.site_name || createdTicket?.site?.name || selectedSite?.name || 'Valet Hub'}
                        </Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Check-In Time</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {createdTicket?.entry_time
                                ? formatDateTime(createdTicket.entry_time)
                                : (createdTicket?.created_at ? formatDateTime(createdTicket.created_at) : parkingTime)}
                        </Text>
                    </View>
                    {(createdTicket?.key_slot || keySlot) ? (
                        <View style={styles.ticketDetailRow}>
                            <Text style={styles.ticketDetailLabel}>Key Slot #</Text>
                            <Text style={[styles.ticketDetailValue, { color: themeColor }]}>
                                {createdTicket?.key_slot || keySlot}
                            </Text>
                        </View>
                    ) : null}

                    <View style={[styles.ticketDivider, isDarkMode && { backgroundColor: '#2C2C2E' }]} />

                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>License Plate</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {(createdTicket?.car_no || createdTicket?.vehicle_number || licensePlate || '').toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Vehicle Model</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {[createdTicket?.brand || (brand === 'Other' ? customBrand : brand), createdTicket?.model || model].filter(Boolean).join(' ') || createdTicket?.vehicle_type || 'Vehicle'}
                        </Text>
                    </View>
                    {(createdTicket?.color || color) ? (
                        <View style={styles.ticketDetailRow}>
                            <Text style={styles.ticketDetailLabel}>Vehicle Color</Text>
                            <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                                {createdTicket?.color || color}
                            </Text>
                        </View>
                    ) : null}
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Customer Name</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {createdTicket?.name || createdTicket?.customer_name || createdTicket?.owner_name || driverName}
                        </Text>
                    </View>
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Phone Number</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>
                            {createdTicket?.phone || createdTicket?.phone_no || createdTicket?.mobile_no || phone}
                        </Text>
                    </View>

                    {/* 4-Angle Inspection Photos */}
                    <VehicleInspectionSummary />

                    {/* Local QR Code View */}
                    <TouchableOpacity style={styles.qrImageBorder} onPress={onSavePdf} activeOpacity={0.85}>
                        {getLocalQrUri(activeTicketNumber) ? (
                            <Image
                                source={{ uri: getLocalQrUri(activeTicketNumber) }}
                                style={styles.ticketQrImage}
                            />
                        ) : (
                            <ActivityIndicator size="large" color={themeColor} />
                        )}
                        <View style={styles.pdfOverlayInside}>
                            <Ionicons name="document-text-outline" size={14} color={themeColor} />
                            <Text style={[styles.pdfOverlayTextInside, { color: themeColor }]}>Tap to Save PDF Ticket</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.scanConfirmMessage}>Customer scans QR upon pickup to retrieve vehicle</Text>
                </View>

                {/* Customer Digital Portal Web Link */}
                <View style={[styles.webLinkCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <View style={styles.webLinkHeader}>
                        <View style={[styles.webIconCircle, { backgroundColor: themeColorLight }]}>
                            <Ionicons name="globe-outline" size={20} color={themeColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.webLinkTitle, isDarkMode && { color: '#fff' }]}>
                                Customer Digital Ticket
                            </Text>
                            <Text style={[styles.webLinkSubtitle, isDarkMode && { color: '#64D2FF' }]} numberOfLines={1}>
                                {getTicketWebUrl(activeTicketNumber)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.webLinkButtonsRow}>
                        <TouchableOpacity
                            style={styles.openWebButton}
                            onPress={onOpenWebsite}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="open-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.openWebButtonText}>VIEW TICKET ON WEB</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.shareWebButton, isDarkMode && { backgroundColor: '#2C2C2E', borderColor: '#3A3A3C' }]}
                            onPress={onShareLink}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="share-social-outline" size={18} color={isDarkMode ? '#fff' : themeColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* WhatsApp Dispatch Button */}
                <TouchableOpacity style={styles.whatsappButton} onPress={onSendWhatsApp} activeOpacity={0.85}>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.whatsappButtonText}>SEND TICKET ON WHATSAPP</Text>
                </TouchableOpacity>

                {/* Done / Next Check-in */}
                <TouchableOpacity
                    style={[styles.shareTicketButton, { borderColor: themeColor }]}
                    onPress={onDone}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-done-circle-outline" size={20} color={themeColor} style={{ marginRight: 8 }} />
                    <Text style={[styles.shareTicketButtonText, { color: themeColor }]}>DONE / CHECK-IN NEXT VEHICLE</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    innerContent: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 90,
    },
    ticketScrollContainer: {
        paddingBottom: 24,
    },
    successBanner: {
        backgroundColor: '#E2F8E7',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    successIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    successTexts: {
        flex: 1,
    },
    successTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1C9A39',
    },
    successSubtitleStatus: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1C9A39',
        marginTop: 2,
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        padding: 18,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    ticketDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 10,
    },
    ticketDetailRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    ticketDetailLabel: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
    },
    ticketDetailValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    qrImageBorder: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E9F0',
        alignItems: 'center',
        marginVertical: 10,
        width: 170,
        height: 170,
    },
    ticketQrImage: {
        width: 120,
        height: 120,
    },
    pdfOverlayInside: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    pdfOverlayTextInside: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
    },
    scanConfirmMessage: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    webLinkCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },
    webLinkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    webIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    webLinkTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    webLinkSubtitle: {
        fontSize: 12,
        color: '#0066FF',
        fontWeight: '600',
        marginTop: 2,
    },
    webLinkButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    openWebButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#0066FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    openWebButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    shareWebButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#F5F7FB',
        borderWidth: 1,
        borderColor: '#E5E9F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    whatsappButton: {
        backgroundColor: '#25D366',
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 12,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    whatsappButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    shareTicketButton: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 16,
    },
    shareTicketButtonText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
