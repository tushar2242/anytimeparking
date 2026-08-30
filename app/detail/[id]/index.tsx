
import {
    ScrollView,
    View,
    StyleSheet,
    Dimensions,
    Image,
    FlatList,
    TouchableOpacity,
    StatusBar
} from 'react-native'
import { Text, Button, Divider } from 'react-native-paper'
import { Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DetailCarousel from '@/src/ui/carousel/DetailCarousel'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import useValetStore from '@/src/features/valetOrder/order.service'
import { showToast } from '@/src/utils/toast'
import { Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { useEffect, useState, useRef } from 'react';
import { Polyline } from 'react-native-maps';
import useThemeStore from '@/src/features/theme/theme.service';

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

export default function HotelDetailPage() {
    const [currentLocation, setCurrentLocation] = useState({
        latitude: 0,
        longitude: 0,
    });
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const mapRef = useRef<MapView>(null);

    const shareHotel = async () => {
        try {
            await Share.share({
                message:
                    'Check out Hotel Royal Stay in New Delhi!\nhttps://example.com/hotel/royal-stay',
                url: 'https://example.com/hotel/royal-stay',
                title: 'Hotel Royal Stay'
            })
        } catch (error) {
            console.log(error)
        }
    }

    const { id } = useLocalSearchParams<{ id: string }>()
    const store = useValetStore()
    const router = useRouter()
    const valet = store.valet?.detail;
    const rawSite = valet?.valet_site || valet?.site || valet?.valetSite;
    const site = Array.isArray(rawSite) ? rawSite[0] : rawSite;

    const parsedLat = Number(site?.latitude || valet?.pickup_lat || (valet as any)?.pickup?.lat);
    const parsedLng = Number(site?.longitude || valet?.pickup_lng || (valet as any)?.pickup?.lng);
    const hotelLocation = {
        latitude: (!isNaN(parsedLat) && parsedLat !== 0) ? parsedLat : 23.5467,
        longitude: (!isNaN(parsedLng) && parsedLng !== 0) ? parsedLng : 74.4335,
    };

    const isCoordinatesAvailable = !!((site?.latitude && site?.longitude) || valet?.pickup_lat || (valet as any)?.pickup?.lat);

    const handleOpenInGoogleMaps = () => {
        const address = `${site?.name || ''}, ${site?.address || ''}, ${site?.city || ''}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
    };

    useEffect(() => {
        if (id) {
            store.get.detail(id)
        }
    }, [id])

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();

                console.log("Permission:", status);

                if (status !== "granted") {
                    return;
                }

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

                console.log("Location:", location.coords);

                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            } catch (err) {
                console.log("Error fetching location:", err);
            }
        })();
    }, []);

    useEffect(() => {
        if (!valet) return;
        const currentSite = valet.valet_site || valet.site;
        if (!currentSite) return;
        if (currentLocation.latitude === 0 && currentLocation.longitude === 0) return;

        const fetchRoadRoute = async () => {
            const lat1 = currentLocation.latitude;
            const lon1 = currentLocation.longitude;
            const parsedLat2 = Number(currentSite.latitude);
            const parsedLng2 = Number(currentSite.longitude);
            const lat2 = (!isNaN(parsedLat2) && parsedLat2 !== 0) ? parsedLat2 : 23.5467;
            const lon2 = (!isNaN(parsedLng2) && parsedLng2 !== 0) ? parsedLng2 : 74.4335;

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
    }, [currentLocation.latitude, currentLocation.longitude, site?.latitude, site?.longitude]);

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
                    points.push(hotelLocation);

                    if (points.length > 1) {
                        mapRef.current?.fitToCoordinates(points, {
                            edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
                            animated: true,
                        });
                    } else {
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
    }, [routeCoordinates, hotelLocation.latitude, hotelLocation.longitude, currentLocation.latitude, currentLocation.longitude]);

    const isDarkMode = useThemeStore().isDarkMode;

    if (!valet || String(valet.id || valet.order_id || (valet as any)._id) !== String(id)) {
        return (
            <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: '#121212' }]}>
                <Text style={[styles.loadingText, isDarkMode && { color: '#a0a0a0' }]}>Loading...</Text>
            </View>
        );
    }



    const price = valet.amount || site?.amount || 0;

    console.log("Valet Site:", site);
    console.log("Current Location:", currentLocation);

    async function handleBook() {
        try {
            await store.bookOrder(id)
            showToast('Booking successful!')
            const timeout = setTimeout(() => {
                router.push('/')
            }, 1000);
            return () => clearTimeout(timeout);
        } catch (err) {
            console.error('Error booking order:', err);
        }
    }

    async function handleCancel() {
        try {
            await store.cancelOrder(id)
            showToast('Booking Cancelled successful!')
            const timeout = setTimeout(() => {
                router.push('/')
            }, 1000);
            return () => clearTimeout(timeout);
        } catch (err) {
            console.error('Error cancelling order:', err);
        }
    }

    function handleBack() {
        router.back()
    }

    return (
        <View style={[styles.page, isDarkMode && { backgroundColor: '#121212' }]}>
            <ScrollView
                style={isDarkMode && { backgroundColor: '#121212' }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Icons */}
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={handleBack} style={[styles.iconButton, isDarkMode && { backgroundColor: 'rgba(30, 30, 30, 0.95)' }]}>
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={shareHotel} style={[styles.iconButton, isDarkMode && { backgroundColor: 'rgba(30, 30, 30, 0.95)' }]}>
                        <Ionicons name="share-social" size={24} color={isDarkMode ? '#fff' : '#333'} />
                    </TouchableOpacity>
                </View>

                {/* Image Carousel */}
                {/* Driver X Image Header */}
                <View style={{ position: 'relative', width: '100%', height: 270, backgroundColor: isDarkMode ? '#1c1c1e' : '#000', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        source={require('@/assets/images/driverxlogo.jpeg')}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                    {/* Overlay to intercept touches and open Google Maps */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        onPress={handleOpenInGoogleMaps}
                        activeOpacity={0.9}
                    />
                </View>

                {/* Content Container */}
                <View style={styles.content}>
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>{site?.name || 'Valet Site'}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={18} color={isDarkMode ? '#a0a0a0' : '#666'} />
                            <Text style={[styles.subtitle, isDarkMode && { color: '#a0a0a0' }]}>
                                {site?.address || ''}, {site?.city || ''}
                            </Text>
                        </View>
                    </View>



                    <Divider style={[styles.divider, isDarkMode && { backgroundColor: '#2c2c2e' }]} />

                    {/* Price & Drivers Card */}
                    <View style={[styles.priceCard, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                        <View style={styles.priceRow}>
                            <View>
                                <Text style={[styles.priceLabel, isDarkMode && { color: '#a0a0a0' }]}>Price per Driver</Text>
                                <Text style={[styles.price, isDarkMode && { color: '#ffffff' }]}>₹{price}</Text>
                            </View>
                            <View style={styles.driversInfo}>
                                <Ionicons name="people" size={20} color="#2e7d32" />
                                <Text style={[styles.driversText, isDarkMode && { color: '#81c784' }]}>{valet.valet_slot} Drivers</Text>
                            </View>
                        </View>
                    </View>


                    {/* Status Badge */}
                    {valet.status === 'booked' && (
                        <View style={[styles.statusBadge, isDarkMode && { backgroundColor: '#1b3b22', borderColor: '#2c2c2e' }]}>
                            <Ionicons name="checkmark-circle" size={22} color="#2e7d32" />
                            <Text style={[styles.statusText, isDarkMode && { color: '#81c784' }]}>Booking Confirmed</Text>
                        </View>
                    )}

                    {/* Notes Section */}
                    <View style={[styles.notesCard, isDarkMode && { backgroundColor: '#2a1a1a', borderColor: '#3a2020' }]}>
                        <View style={styles.noteHeader}>
                            <Ionicons name="information-circle" size={20} color="#e71010" />
                            <Text style={[styles.noteTitle, isDarkMode && { color: '#ffb3b3' }]}>Notice -:</Text>
                        </View>
                        <Text style={[styles.notesText, isDarkMode && { color: '#ffb3b3' }]}>
                            {valet?.note || 'Please drive safely and follow all parking rules.'}

                        </Text>
                        <Text style={[styles.notesText, isDarkMode && { color: '#ffb3b3' }]}>
                            {valet?.note || 'Read all Policy.'}
                        </Text>
                    </View>

                    {/* Parking Location Section */}

                    <TouchableOpacity
                        style={[styles.locationCard, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}
                        onPress={() =>
                            Linking.openURL(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    `${site?.name || ''}, ${site?.address || ''}, ${site?.city || ''}`
                                )}`
                            )
                        }
                    >
                    </TouchableOpacity>
                </View>
            </ScrollView>


            {/* Bottom Action Bar */}
            <View style={[styles.bottomBar, isDarkMode && { backgroundColor: '#1c1c1e', borderTopColor: '#2c2c2e' }]}>
                {valet.status === 'booked' ? (
                    <View style={styles.bookedActions}>
                        <Button
                            mode="contained"
                            buttonColor="#dc3545"
                            style={styles.cancelButton}
                            labelStyle={styles.buttonLabel}
                            onPress={handleCancel}
                            icon="close-circle"
                        >
                            Cancel Booking
                        </Button>
                    </View>
                ) : (
                    <View style={styles.actionButtons}>
                        <Button
                            mode="outlined"
                            buttonColor="#999"

                            style={[styles.outlinedButton, isDarkMode && { borderColor: '#444' }]}
                            labelStyle={[styles.outlinedButtonLabel, isDarkMode && { color: '#fff' }]}
                            onPress={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            mode="contained"
                            buttonColor="#2e7d32"

                            style={styles.bookButton}
                            labelStyle={styles.buttonLabel}
                            onPress={handleBook}
                            icon="calendar-check"
                        >
                            Book Now
                        </Button>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    headerIcons: {
        position: 'absolute',
        top: 15,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10
    },
    iconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4
    },
    scrollContent: {
        paddingBottom: 140
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20
    },
    titleSection: {
        marginBottom: 8
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
    divider: {
        marginVertical: 20,
        backgroundColor: '#e0e0e0'
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
        backgroundColor: '#e8f5e9',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#2e7d32',
        gap: 10
    },
    statusText: {
        color: '#2e7d32',
        fontWeight: '700',
        fontSize: 17
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
    section: {
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10
    },
    sectionIcon: {
        fontSize: 24
    },
    sectionTitle: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#1a1a1a'
    },
    sectionText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#555',
        lineHeight: 22,
        position: 'absolute',
    },
    bottomBar: {
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
        elevation: 8
    },
    bookedActions: {
        width: '100%'
    },
    cancelButton: {
        borderRadius: 12,
        paddingVertical: 6
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center'
    },
    outlinedButton: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        paddingVertical: 6
    },
    outlinedButtonLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff'
    },
    bookButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 6
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3
    },
    mapImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee',
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
    priceSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
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
})