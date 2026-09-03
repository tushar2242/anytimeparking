import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TicketData } from './CardParkingTypes';

interface ReturnTicketDetailsStepProps {
    ticket: TicketData;
    isDarkMode: boolean;
    onConfirmReturn: () => void;
    onResetWorkflow: () => void;
}

export default function ReturnTicketDetailsStep({
    ticket,
    isDarkMode,
    onConfirmReturn,
    onResetWorkflow,
}: ReturnTicketDetailsStepProps) {
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Found Ticket Summary Card */}
            <View style={[styles.ticketCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>Vehicle Details</Text>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>PARKED</Text>
                    </View>
                </View>

                <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Ticket ID</Text>
                    <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticket.ticketId}</Text>
                </View>

                <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Vehicle Number</Text>
                    <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticket.vehicleNumber}</Text>
                </View>

                <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Vehicle Model</Text>
                    <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticket.vehicleType}</Text>
                </View>

                <View style={styles.ticketDetailRow}>
                    <Text style={styles.ticketDetailLabel}>Customer Name</Text>
                    <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticket.ownerName}</Text>
                </View>

                {ticket.phone ? (
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Phone Number</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticket.phone}</Text>
                    </View>
                ) : null}

                {ticket.parkingSite ? (
                    <View style={styles.ticketDetailRow}>
                        <Text style={styles.ticketDetailLabel}>Parking Location</Text>
                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticket.parkingSite}</Text>
                    </View>
                ) : null}
            </View>

            {/* Action Buttons Row - One Line Side-by-Side */}
            <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                    style={styles.returnVehicleBtn}
                    onPress={onConfirmReturn}
                    activeOpacity={0.8}
                >
                    <Ionicons name="key" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.returnVehicleBtnText}>RETURN VEHICLE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.cancelRequestBtn,
                        isDarkMode && { backgroundColor: 'rgba(255, 59, 48, 0.12)', borderColor: 'rgba(255, 59, 48, 0.3)' },
                    ]}
                    onPress={onResetWorkflow}
                    activeOpacity={0.8}
                >
                    <Ionicons name="close-circle-outline" size={18} color={isDarkMode ? '#FF453A' : '#FF3B30'} style={{ marginRight: 6 }} />
                    <Text style={[styles.cancelRequestBtnText, isDarkMode && { color: '#FF453A' }]}>CANCEL</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 110,
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E9F0',
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
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F1F3F5',
    },
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    statusPill: {
        backgroundColor: 'rgba(255, 133, 27, 0.12)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FF851B',
    },
    ticketDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    ticketDetailLabel: {
        fontSize: 13,
        color: '#8E8E93',
    },
    ticketDetailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    returnVehicleBtn: {
        flex: 1.2,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0066FF',
        shadowColor: '#0066FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    returnVehicleBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    cancelRequestBtn: {
        flex: 0.8,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF5F5',
        borderWidth: 1.5,
        borderColor: '#FFCDD2',
    },
    cancelRequestBtnText: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
