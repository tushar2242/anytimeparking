import React from 'react'
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { Text, Badge } from 'react-native-paper'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import useThemeStore from '@/src/features/theme/theme.service'

interface OrderCardProps {
    hotel: string
    address: string
    datetime: string
    amount: string
    status: string
    valetSlot: number
    image: string
    id: string
}

export default function OrderCard({
    hotel,
    address,
    datetime,
    amount,
    status,
    valetSlot,
    image,
    id
}: OrderCardProps) {
    const router = useRouter();
    const isDarkMode = useThemeStore().isDarkMode;

    const getBadgeStyle = () => {
        switch (status.toLowerCase()) {
            case 'requested': return styles.requestedBadge
            case 'accepted': return styles.acceptedBadge
            case 'parked': return styles.parkedBadge
            case 'returned': return styles.returnedBadge
            case 'cancelled': return styles.cancelledBadge
            default: return styles.defaultBadge
        }
    }

    const getBadgeTextStyle = () => {
        switch (status.toLowerCase()) {
            case 'requested': return styles.requestedText
            case 'accepted': return styles.acceptedText
            case 'parked': return styles.parkedText
            case 'returned': return styles.returnedText
            case 'cancelled': return styles.cancelledText
            default: return styles.defaultText
        }
    }

    const handlePress = () => {
        router.push(`/order-detail/${id}` as any);
    }

    return (
        <TouchableOpacity
            style={[styles.card, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image} />
                    ) : (
                        <View style={[styles.image, styles.placeholderImage, isDarkMode && { backgroundColor: '#2c2c2e' }]}>
                            <Ionicons name="business" size={30} color={isDarkMode ? '#a0a0a0' : '#495057'} />
                        </View>
                    )}
                </View>

                <View style={styles.details}>
                    <View style={styles.header}>
                        <Text variant="titleMedium" style={[styles.hotel, isDarkMode && { color: '#ffffff' }]} numberOfLines={1}>
                            {hotel}
                        </Text>
                        <View style={[styles.badge, getBadgeStyle(), isDarkMode && status.toLowerCase() === 'requested' && { backgroundColor: '#2c2c2e' }]}>
                            <Text style={[styles.badgeText, getBadgeTextStyle(), isDarkMode && status.toLowerCase() === 'requested' && { color: '#a0a0a0' }]}>{status}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location-sharp" size={14} color={isDarkMode ? '#a0a0a0' : '#6c757d'} />
                        <Text style={[styles.infoText, isDarkMode && { color: '#a0a0a0' }]} numberOfLines={1}>{address}</Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#a0a0a0' : '#6c757d'} />
                                <Text style={[styles.metaText, isDarkMode && { color: '#a0a0a0' }]}>{datetime.split(',')[0]}</Text>
                            </View>
                            <View style={[styles.metaSeparator, isDarkMode && { backgroundColor: '#2c2c2e' }]} />
                            <View style={styles.metaItem}>
                                <Feather name="users" size={14} color={isDarkMode ? '#a0a0a0' : '#6c757d'} />
                                <Text style={[styles.metaText, isDarkMode && { color: '#a0a0a0' }]}>{valetSlot}</Text>
                            </View>
                        </View>
                        <Text style={[styles.amount, isDarkMode && { color: '#81c784', backgroundColor: '#1b3b22' }]}>₹{amount}</Text>
                    </View>
                </View>
            </View>
            <View style={[styles.cardFooter, isDarkMode && { backgroundColor: '#1c1c1e', borderTopColor: '#2c2c2e' }]}>
                <Text style={[styles.viewDetailText, isDarkMode && { color: '#64b5f6' }]}>View Order Details</Text>
                <Feather name="chevron-right" size={16} color={isDarkMode ? '#64b5f6' : '#007AFF'} />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f3f5',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 12,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    placeholderImage: {
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    details: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    hotel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    requestedBadge: { backgroundColor: '#e9ecef' },
    requestedText: { color: '#495057' },
    acceptedBadge: { backgroundColor: '#e7f5ff' },
    acceptedText: { color: '#228be6' },
    parkedBadge: { backgroundColor: '#fff4e6' },
    parkedText: { color: '#fd7e14' },
    returnedBadge: { backgroundColor: '#ebfbee' },
    returnedText: { color: '#40c057' },
    cancelledBadge: { backgroundColor: '#fff5f5' },
    cancelledText: { color: '#fa5252' },
    defaultBadge: { backgroundColor: '#f8f9fa' },
    defaultText: { color: '#666' },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 4,
        fontSize: 13,
        color: '#6c757d',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#6c757d',
    },
    metaSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#dee2e6',
        marginHorizontal: 8,
    },
    amount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2e7d32',
        backgroundColor: '#e8f5e9',
        padding: 6,
        borderRadius: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f3f5',
        backgroundColor: '#fafafa',
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#007AFF',
    }
})
