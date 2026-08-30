import React, { useState, useEffect, useRef } from 'react'
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    Linking,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native'
import { Text, Button, Divider, ActivityIndicator } from 'react-native-paper'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import useValetStore from '@/src/features/valetOrder/order.service'
import { formatDateTime } from '@/src/utils/date'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, Polyline } from 'react-native-maps'
import * as Location from 'expo-location'
import { BlurView } from 'expo-blur'
import useThemeStore from '@/src/features/theme/theme.service'

const { width } = Dimensions.get('window')

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function OrderDetailPage() {
    const { id } = useLocalSearchParams()
    const store = useValetStore()
    const order = store.valet.detail
    const insets = useSafeAreaInsets()
    const router = useRouter()

    const [currentLocation, setCurrentLocation] = useState({
        latitude: 0,
        longitude: 0,
    });
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [hotelLocation, setHotelLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (id) {
            store.get.detail(id)
        }
    }, [id])

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;

                const lastLocation = await Location.getLastKnownPositionAsync({});
                if (lastLocation) {
                    setCurrentLocation({
                        latitude: lastLocation.coords.latitude,
                        longitude: lastLocation.coords.longitude,
                    });
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            } catch (err) {
                console.log("Error fetching location:", err);
            }
        })();
    }, []);

    const rawValet = order?.valet_site || order?.site || order?.valetSite
    const valet = Array.isArray(rawValet) ? rawValet[0] : rawValet

    useEffect(() => {
        if (!valet) return;

        const geocodeAddress = async () => {
            setIsGeocoding(true);
            setGeocodeError(null);
            try {
                const addressParts = [
                    valet.name,
                    valet.address,
                    valet.city,
                    valet.state,
                    valet.pincode,
                    'India'
                ].filter(Boolean);

                const fullAddressString = addressParts.join(', ');
                console.log("Geocoding address:", fullAddressString);

                const geocoded = await Location.geocodeAsync(fullAddressString);

                if (geocoded && geocoded.length > 0) {
                    const firstResult = geocoded[0];
                    setHotelLocation({
                        latitude: firstResult.latitude,
                        longitude: firstResult.longitude,
                    });
                } else {
                    throw new Error("No coordinates returned for this address");
                }
            } catch (err: any) {
                console.log("Geocoding error:", err);
                setGeocodeError("Could not determine coordinates for this address.");
            } finally {
                setIsGeocoding(false);
            }
        };

        geocodeAddress();
    }, [valet?.name, valet?.address, valet?.city, valet?.state, valet?.pincode]);

    const handleOpenInGoogleMaps = () => {
        if (!valet) return;
        const addressParts = [
            valet.name,
            valet.address,
            valet.city,
            valet.state,
            valet.pincode
        ].filter(Boolean);
        const address = addressParts.join(', ') || 'Valet Service';
        let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        if (currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
            url += `&origin=${currentLocation.latitude},${currentLocation.longitude}`;
        }
        Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
    };

    useEffect(() => {
        if (!valet) return;
        if (currentLocation.latitude === 0 && currentLocation.longitude === 0) return;
        if (!hotelLocation) return;

        const fetchRoadRoute = async () => {
            const lat1 = currentLocation.latitude;
            const lon1 = currentLocation.longitude;
            const lat2 = hotelLocation.latitude;
            const lon2 = hotelLocation.longitude;

            const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

            try {
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error(`Route request failed: ${res.status}`);
                }

                const data = await res.json();
                const route = data?.routes?.[0];
                const coords = route?.geometry?.coordinates;

                if (coords?.length) {
                    const mapped = coords.map((point: [number, number]) => ({
                        latitude: point[1],
                        longitude: point[0],
                    }));
                    setRouteCoordinates(mapped);
                } else {
                    setRouteCoordinates([
                        { latitude: lat1, longitude: lon1 },
                        { latitude: lat2, longitude: lon2 }
                    ]);
                }

                if (route) {
                    setDistance(route.distance / 1000); // km
                    setDuration(route.duration / 60); // minutes
                }
            } catch (error) {
                console.log('Road route fetch failed:', error);
                setRouteCoordinates([
                    { latitude: lat1, longitude: lon1 },
                    { latitude: lat2, longitude: lon2 }
                ]);
                const straightLineDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
                setDistance(straightLineDist);
                setDuration(straightLineDist * 2);
            }
        };

        fetchRoadRoute();
    }, [currentLocation.latitude, currentLocation.longitude, hotelLocation?.latitude, hotelLocation?.longitude]);

    useEffect(() => {
        if (mapRef.current) {
            const timer = setTimeout(() => {
                if (routeCoordinates.length > 0) {
                    mapRef.current?.fitToCoordinates(routeCoordinates, {
                        edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
                        animated: true,
                    });
                } else {
                    const points = [];
                    if (currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
                        points.push(currentLocation);
                    }
                    if (hotelLocation) {
                        points.push(hotelLocation);
                    }

                    if (points.length > 1) {
                        mapRef.current?.fitToCoordinates(points, {
                            edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
                            animated: true,
                        });
                    } else if (hotelLocation) {
                        mapRef.current?.animateToRegion({
                            latitude: hotelLocation.latitude,
                            longitude: hotelLocation.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }, 1000);
                    }
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [routeCoordinates, hotelLocation?.latitude, hotelLocation?.longitude, currentLocation.latitude, currentLocation.longitude]);

    const isDarkMode = useThemeStore().isDarkMode;

    if (!order || String(order.id || order.order_id || (order as any)._id) !== String(id)) {
        return (
            <View style={[styles.centered, isDarkMode && { backgroundColor: '#121212' }]}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    const handleCall = () => {
        const phone = valet?.phone || valet?.contact_phone
        if (phone) {
            Linking.openURL(`tel:${phone}`)
        }
    }

    const handleWhatsApp = () => {
        const phone = valet?.phone || valet?.contact_phone
        if (phone) {
            let cleanPhone = phone.replace(/[^0-9]/g, '')
            if (cleanPhone.length === 10) {
                cleanPhone = '91' + cleanPhone
            }
            Linking.openURL(`https://wa.me/${cleanPhone}`).catch(err => console.error("Failed to open WhatsApp:", err))
        }
    }

    const getBadgeStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'requested':
                return { backgroundColor: '#007AFF' }; // Blue
            case 'accepted':
            case 'booked':
            case 'parked':
                return { backgroundColor: '#34C759' }; // Green
            case 'returned':
                return { backgroundColor: '#8E8E93' }; // Gray
            case 'cancelled':
                return { backgroundColor: '#FF3B30' }; // Red
            default:
                return { backgroundColor: '#8E8E93' };
        }
    };

    return (
        <View style={[styles.page, isDarkMode && { backgroundColor: '#121212' }]}>
            <ScrollView
                style={isDarkMode && { backgroundColor: '#121212' }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Driver X Image Header */}
                <View style={{ position: 'relative', width: '100%', height: 270, backgroundColor: isDarkMode ? '#1c1c1e' : '#000', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        source={require('@/assets/images/driver.png')}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                </View>

                {/* Content Container */}
                <View style={styles.content}>
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>{valet?.name || 'Valet Service'}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={18} color={isDarkMode ? '#a0a0a0' : '#666'} />
                            <Text style={[styles.subtitle, isDarkMode && { color: '#a0a0a0' }]}>
                                {valet?.address || ''}, {valet?.city || ''}
                            </Text>
                        </View>
                    </View>



                    {/* Price & Drivers Card */}
                    <View style={[styles.priceCard, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                        <View style={styles.priceRow}>
                            <View>
                                <Text style={[styles.priceLabel, isDarkMode && { color: '#a0a0a0' }]}>Price per Driver</Text>
                                <Text style={[styles.price, isDarkMode && { color: '#ffffff' }]}>₹{Number(order.amount || valet?.amount || 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.driversInfo}>
                                <Ionicons name="people" size={20} color="#2e7d32" />
                                <Text style={[styles.driversText, isDarkMode && { color: '#81c784' }]}>{order.valet_slot || 1} Drivers</Text>
                            </View>
                        </View>
                    </View>

                    {/* Status Badge */}
                    {order.status !== 'requested' && order.status !== 'upcoming' && (
                        <View style={[styles.statusBadge, getBadgeStyle(order.status)]}>
                            <Ionicons name="information-circle-outline" size={20} color="#fff" />
                            <Text style={styles.statusBadgeText}>Status: {order.status}</Text>
                        </View>
                    )}

                    {/* Notice/Notes Section */}
                    <View style={[styles.notesCard, isDarkMode && { backgroundColor: '#2a1a1a', borderColor: '#3a2020' }]}>
                        <View style={styles.noteHeader}>
                            <Ionicons name="information-circle" size={22} color="#e71010" />
                            <Text style={[styles.noteTitle, isDarkMode && { color: '#ffb3b3' }]}>Notice -:</Text>
                        </View>
                        <Text style={[styles.notesText, isDarkMode && { color: '#ffb3b3' }]}>
                            {order.notes || 'Please drive safely and follow all parking rules.'}
                        </Text>
                        <Text style={[styles.notesText, isDarkMode && { color: '#ffb3b3' }]}>
                            Read all Policy
                        </Text>
                    </View>

                    {/* Contact Information Card */}
                    <Text style={[styles.sectionHeaderTitle, isDarkMode && { color: '#ffffff' }]}>📞 Contact Information</Text>
                    <View style={[styles.contactRow, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactName, isDarkMode && { color: '#ffffff' }]}>{valet?.contact_person}</Text>
                            <Text style={[styles.contactPhone, isDarkMode && { color: '#a0a0a0' }]}>{valet?.phone || valet?.contact_phone}</Text>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity onPress={handleCall} style={styles.callIconButton}>
                                <Ionicons name="call" size={22} color="#2e7d32" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleWhatsApp} style={styles.whatsappIconButton}>
                                <FontAwesome5 name="whatsapp" size={22} color="#25D366" />
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>

            <View style={[styles.buttonBar, { paddingBottom: Math.max(insets.bottom, 12) }, isDarkMode && { backgroundColor: '#1c1c1e', borderTopColor: '#2c2c2e' }]}>
                <Button
                    icon="arrow-left"
                    mode="outlined"
                    style={[styles.outlinedButton, isDarkMode && { borderColor: '#444' }]}
                    labelStyle={isDarkMode && { color: '#fff' }}
                    onPress={() => router.back()}>
                    Back
                </Button>
                {(order.status === 'requested' || order.status === 'upcoming') && (
                    <Button
                        icon="check"
                        mode="contained"
                        style={styles.bookButton}
                        buttonColor="#2e7d32"
                        loading={isBooking}
                        disabled={isBooking}
                        onPress={async () => {
                            setIsBooking(true);
                            try {
                                await store.bookOrder(order.id);
                                if (id) {
                                    await store.get.detail(id);
                                }
                            } catch (err) {
                                console.log(err);
                            } finally {
                                setIsBooking(false);
                            }
                        }}>
                        Book Order
                    </Button>
                )}
                {(order.status === 'accepted' || order.status === 'booked') && (
                    <Button
                        icon="close"
                        mode="contained"
                        style={styles.cancelButton}
                        buttonColor="#ff3b30"
                        loading={isCancelling}
                        disabled={isCancelling}
                        onPress={async () => {
                            Alert.alert(
                                "Cancel Booking",
                                "Are you sure you want to cancel this booking?",
                                [
                                    { text: "No", style: "cancel" },
                                    { 
                                        text: "Yes, Cancel", 
                                        style: "destructive",
                                        onPress: async () => {
                                            setIsCancelling(true);
                                            try {
                                                await store.cancelOrder(order.id);
                                                if (id) {
                                                    await store.get.detail(id);
                                                }
                                            } catch (err) {
                                                console.log(err);
                                            } finally {
                                                setIsCancelling(false);
                                            }
                                        }
                                    }
                                ]
                            );
                        }}>
                        Cancel Booking
                    </Button>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    page: {
        marginTop: 40,
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    scrollContent: {
        paddingBottom: 140
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20
    },
    titleSection: {
        marginBottom: 16
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        flex: 1
    },
    routeCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    routeCol: {
        alignItems: 'center',
        flex: 1,
    },
    routeValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 4,
    },
    routeLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    routeDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#e0e0e0',
    },
    priceCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    priceLabel: {
        fontSize: 16,
        color: '#000',
        marginBottom: 6,
        fontWeight: 'bold'
    },
    price: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2e7d32'
    },
    driversInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    driversText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2e7d32'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10
    },
    statusBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    notesCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#2e7d32',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },
    noteTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111'
    },
    notesText: {
        fontSize: 15,
        paddingLeft: 20,
        lineHeight: 22,
        color: '#555'
    },
    sectionHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        color: '#1a1a1a',
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    contactPhone: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    contactActions: {
        flexDirection: 'row',
        gap: 15,
    },
    callIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    whatsappIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EAFDF1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleMapsLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        marginBottom: 20,
    },
    buttonBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 16,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        flexDirection: 'row',
        gap: 12,
    },
    outlinedButton: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#ccc',
        paddingVertical: 6,
    },
    bookButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 6,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 6,
    },
    divider: {
        marginVertical: 16,
        backgroundColor: '#e0e0e0',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    text: {
        fontSize: 15,
        color: '#555',
    },
    mapPlaceholder: {
        width: '100%',
        height: 270,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D1D6',
    },
    mapPlaceholderContent: {
        alignItems: 'center',
        paddingHorizontal: 30,
        textAlign: 'center',
    },
    mapPlaceholderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginTop: 10,
        textAlign: 'center',
    },
    mapPlaceholderSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
        textAlign: 'center',
    },
    mapPlaceholderAddress: {
        fontSize: 13,
        color: '#3A3A3C',
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    mapButtonContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
})
