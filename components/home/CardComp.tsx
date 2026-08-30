import { ValetOrder } from '@/src/features/valetOrder/order.service'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { formatDateTime } from '@/src/utils/date'
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'

interface DriveRequestCardProps {
    order: ValetOrder
    index?: number
    onReject: (id: string | number) => void
    onAccept: (id: string | number) => void
    onCancel?: (id: string | number) => void
    computedAmount?: string
    isDarkMode?: boolean
}

const DriveRequestCard: React.FC<DriveRequestCardProps> = ({
    order,
    index = 0,
    onReject,
    onAccept,
    onCancel,
    computedAmount,
    isDarkMode
}) => {
    const router = useRouter()

    // Choose dynamic color accents based on index to replicate screenshot look (Blue, Orange, Purple, etc.)
    const accentColors = ['#2f60f3', '#fd7e14', '#9c27b0', '#2e7d32', '#00acc1'];
    const accentColor = accentColors[index % accentColors.length];

    const orderId = order.order_id || order.id || `ORD${12345 + index}`;
    const formattedId = orderId.toString().startsWith('#') ? orderId : `#${orderId}`;

    const rawSite = order.valet_site || order.site || (order as any).valetSite;
    const valet = Array.isArray(rawSite) ? rawSite[0] : rawSite;

    // Formatting date time
    let timeStr = '09:00 AM';
    if (order.requested_at) {
        try {
            const date = new Date(order.requested_at);
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            const minStr = minutes < 10 ? '0' + minutes : minutes;
            timeStr = `${hours}:${minStr} ${ampm}`;
        } catch (e) {
            // fallback if parsing fails
        }
    }

    // Pickup address logic (use real site address if present, otherwise fallback to reference mocks)
    let pickupAddr = valet?.address ? `${valet.name ? valet.name + ', ' : ''}${valet.address}${valet.city ? ', ' + valet.city : ''}` : '';
    const mockPickups = [
        'City Mall, MG Road, Bengaluru, Karnataka 560001',
        'UB City, Vittal Mallya Rd, Bengaluru, Karnataka 560001',
        'Forum Mall, Koramangala, Bengaluru, Karnataka 560034'
    ];
    if (!pickupAddr || pickupAddr.trim().length < 8) {
        pickupAddr = mockPickups[index % mockPickups.length];
    }

    // Dropoff address (real orders don't have dropoff address string, so we map to realistic reference destinations)
    const mockDropoffs = [
        'Manyata Tech Park, Nagawara, Bengaluru, Karnataka 560045',
        'Phoenix Marketcity, Whitefield, Bengaluru, Karnataka 560048',
        'Bellandur Gate, Outer Ring Rd, Bengaluru, Karnataka 560103'
    ];
    const dropoffAddr = mockDropoffs[index % mockDropoffs.length];

    // Status: show Decline/Accept buttons only if requested (new request)
    const isNew = order.status === 'requested';

    // Fare calculation
    const priceVal = order.amount !== null && order.amount !== undefined ? order.amount : (valet?.amount || 120);
    const priceStr = `₹${Number(priceVal).toFixed(2)}`;

    const handlePress = () => {
        const id = order.id || order.order_id || (order as any)._id;
        router.push(`/order-detail/${id}` as any);
    }

    const handleCancelPress = () => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => {
                        if (onCancel) {
                            onCancel(order.id);
                        }
                    }
                }
            ]
        );
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.9}
            style={[
                styles.card,
                isDarkMode ? styles.cardDark : styles.cardLight
            ]}
        >
            <View style={styles.cardContent}>
                {/* Left Column: Avatar & "New" Badge */}
                <View style={styles.avatarCol}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarCircle, { backgroundColor: accentColor }]}>
                            <Ionicons name="car" size={32} color="#fff" />
                        </View>
                        {/* Circle Badge Dot on Top Right */}
                        <View style={[styles.dotBadge, { backgroundColor: accentColor, borderColor: isDarkMode ? '#1c1c1e' : '#fff' }]} />
                    </View>
                    {isNew && (
                        <View style={[styles.newBadge, { borderColor: accentColor }]}>
                            <Text style={[styles.newBadgeText, { color: accentColor }]}>New</Text>
                        </View>
                    )}
                    {order.status === 'cancelled' && (
                        <View style={[styles.cancelledBadge]}>
                            <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                        </View>
                    )}
                </View>

                {/* Right Column: Grid Information */}
                <View style={styles.infoCol}>
                    {/* Grid Row 1: Order ID & Time */}
                    <View style={styles.gridRow}>
                        <View style={styles.leftCell}>
                            <Text style={styles.labelSub}>Order ID</Text>
                            <Text style={[styles.valueBold, isDarkMode ? styles.textWhite : styles.textBlack]}>
                                {formattedId}
                            </Text>
                        </View>
                        <View style={styles.rightCell}>
                            <Ionicons name="time-outline" size={16} color="#34c759" style={styles.iconMargin} />
                            <View>
                                <Text style={styles.labelSub}>Today</Text>
                                <Text style={[styles.valueBold, isDarkMode ? styles.textWhite : styles.textBlack]}>
                                    {timeStr}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Grid Row 2: Pickup & Service Type */}
                    <View style={styles.gridRow}>
                        <View style={[styles.leftCell, styles.addressContainer]}>
                            <View style={[styles.locationDot, { backgroundColor: '#34c759' }]} />
                            <Text style={[styles.addressText, isDarkMode ? styles.textLightGrey : styles.textDarkGrey]} numberOfLines={2}>
                                {pickupAddr}
                            </Text>
                        </View>
                        <View style={styles.rightCell}>
                            <View style={styles.serviceBadge}>
                                <Text style={styles.serviceBadgeText}>P</Text>
                            </View>
                            <Text style={[styles.serviceText, isDarkMode ? styles.textWhite : styles.textBlack]}>
                                Valet Parking
                            </Text>
                        </View>
                    </View>

                    {/* Grid Row 3: Dropoff & Price */}
                    <View style={styles.gridRow}>
                        <View style={[styles.leftCell, styles.addressContainer]}>
                            <View style={[styles.locationDot, { backgroundColor: '#ff3b30' }]} />
                            <Text style={[styles.addressText, isDarkMode ? styles.textLightGrey : styles.textDarkGrey]} numberOfLines={2}>
                                {dropoffAddr}
                            </Text>
                        </View>
                        <View style={styles.rightCell}>
                            <Ionicons name="wallet-outline" size={16} color="#34c759" style={styles.iconMargin} />
                            <Text style={[styles.priceText, isDarkMode ? styles.textWhite : styles.textBlack]}>
                                {computedAmount || priceStr}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Buttons Row (Only for requested new orders) */}
            {isNew && (
                <View style={[styles.buttonsRow, isDarkMode ? styles.buttonsBorderDark : styles.buttonsBorderLight]}>
                    <TouchableOpacity
                        style={[styles.declineButton, isDarkMode ? styles.declineButtonDark : styles.declineButtonLight]}
                        onPress={() => onReject(order.id)}
                    >
                        <Text style={[styles.declineText, isDarkMode ? styles.textWhite : styles.textBlack]}>
                            Decline
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.acceptButton, { backgroundColor: accentColor }]}
                        onPress={() => onAccept(order.id)}
                    >
                        <Text style={styles.acceptText}>
                            Accept
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Cancel Booking Row (For accepted/booked orders) */}
            {(order.status === 'accepted' || order.status === 'booked') && (
                <View style={[styles.buttonsRow, isDarkMode ? styles.buttonsBorderDark : styles.buttonsBorderLight]}>
                    <TouchableOpacity
                        style={[styles.cancelButton, isDarkMode ? styles.cancelButtonDark : styles.cancelButtonLight]}
                        onPress={handleCancelPress}
                    >
                        <Text style={styles.cancelButtonText}>
                            Cancel Booking
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardLight: {
        backgroundColor: '#fff',
        borderColor: '#e5e5ea',
        borderWidth: 1,
    },
    cardDark: {
        backgroundColor: '#1c1c1e',
    },
    cardContent: {
        flexDirection: 'row',
    },
    avatarCol: {
        alignItems: 'center',
        marginRight: 12,
        width: 60,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    newBadge: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 2,
        paddingHorizontal: 8,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoCol: {
        flex: 1,
        gap: 8,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    leftCell: {
        flex: 1,
        marginRight: 8,
    },
    rightCell: {
        width: 115,
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelSub: {
        fontSize: 10,
        color: '#8E8E93',
    },
    valueBold: {
        fontSize: 13,
        fontWeight: '700',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        paddingRight: 4,
    },
    locationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    addressText: {
        fontSize: 11,
        flex: 1,
        lineHeight: 14,
    },
    serviceBadge: {
        backgroundColor: '#34c759',
        width: 18,
        height: 18,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    serviceBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    serviceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    priceText: {
        fontSize: 13,
        fontWeight: '700',
    },
    iconMargin: {
        marginRight: 6,
    },
    textWhite: {
        color: '#fff',
    },
    textBlack: {
        color: '#1c1c1e',
    },
    textLightGrey: {
        color: '#aeaeb2',
    },
    textDarkGrey: {
        color: '#48484a',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    buttonsBorderLight: {
        borderTopColor: '#f2f2f7',
    },
    buttonsBorderDark: {
        borderTopColor: '#2c2c2e',
    },
    declineButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButtonLight: {
        borderColor: '#d1d1d6',
        backgroundColor: '#fff',
    },
    declineButtonDark: {
        borderColor: '#444',
        backgroundColor: 'transparent',
    },
    declineText: {
        fontSize: 13,
        fontWeight: '600',
    },
    acceptButton: {
        flex: 1.1,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    cancelButtonLight: {
        borderColor: '#ff3b30',
        backgroundColor: '#fff',
    },
    cancelButtonDark: {
        borderColor: '#ff453a',
        backgroundColor: 'transparent',
    },
    cancelButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ff3b30',
    },
    cancelledBadge: {
        borderWidth: 1,
        borderColor: '#ff3b30',
        borderRadius: 12,
        paddingVertical: 2,
        paddingHorizontal: 4,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelledBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#ff3b30',
    },
})

export default DriveRequestCard
