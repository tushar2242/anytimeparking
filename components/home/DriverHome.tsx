import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar, ScrollView, Dimensions } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../src/features/theme/theme.service';
import useAuthStore from '../../src/features/auth/auth.service';
import useValetStore from '../../src/features/valetOrder/order.service';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Premium city skyline and car illustration component in SVG
const CityIllustration = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const buildingColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 102, 255, 0.06)';
    const carColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 102, 255, 0.12)';

    return (
        <View style={styles.illustrationWrapper}>
            <Svg width={140} height={80} viewBox="0 0 140 80">
                {/* Skyline buildings */}
                <Rect x={10} y={30} width={12} height={50} rx={1} fill={buildingColor} />
                <Rect x={26} y={15} width={18} height={65} rx={1} fill={buildingColor} />
                <Rect x={48} y={38} width={10} height={42} rx={1} fill={buildingColor} />
                <Rect x={62} y={20} width={16} height={60} rx={1} fill={buildingColor} />
                <Rect x={82} y={35} width={12} height={45} rx={1} fill={buildingColor} />
                <Rect x={98} y={25} width={18} height={55} rx={1} fill={buildingColor} />
                <Rect x={120} y={40} width={10} height={40} rx={1} fill={buildingColor} />

                {/* Spires */}
                <Rect x={34} y={5} width={2} height={10} fill={buildingColor} />
                <Rect x={70} y={10} width={2} height={10} fill={buildingColor} />
                <Rect x={106} y={15} width={2} height={10} fill={buildingColor} />

                {/* Car Silhouette */}
                <Path
                    d="M 65,58 C 67,53 71,51 77,51 L 95,51 C 99,51 103,54 105,57 L 112,57 C 115,57 117,59 117,62 L 117,67 C 117,68 116,69 115,69 L 65,69 C 63,69 62,68 62,67 L 62,62 C 62,59 63,58 65,58 Z"
                    fill={carColor}
                />

                {/* Wheels */}
                <Path
                    d="M 72,69 A 3.5,3.5 0 0 1 79,69 Z M 100,69 A 3.5,3.5 0 0 1 107,69 Z"
                    fill={isDarkMode ? '#1C1C1E' : '#F2F2F7'}
                />
            </Svg>
        </View>
    );
};

export default function DriverHome() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const navigation = useNavigation();
    const themeStore = useThemeStore();
    const isDarkMode = themeStore.isDarkMode;

    const { user: authContextUser } = useAuth();
    const authStore = useAuthStore();
    const currentUser = authContextUser || authStore.user;

    const driverName = currentUser?.name || currentUser?.phone || 'Valet Staff';
    const driverRole = currentUser?.role
        ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1))
        : 'Valet Driver';

    const valetStore = useValetStore();
    const myOrders = valetStore.valet.myOrders || [];

    useEffect(() => {
        // Fetch fresh driver orders and user profile on mount
        valetStore.myOrder(['upcoming', 'running', 'completed', 'accepted', 'booked', 'parked', 'returned', 'cancelled']);
        authStore.actions.me().catch(() => {});
    }, []);

    // Calculate real dynamic stats directly from user orders without dummy fallbacks
    const today = new Date().toDateString();
    const todayOrders = myOrders.filter(order => order.requested_at && new Date(order.requested_at).toDateString() === today);

    const ticketsTodayCount = todayOrders.length;
    const keysReturnedCount = myOrders.filter(order => order.status === 'returned' || order.status === 'completed').length;
    const vehiclesParkedCount = myOrders.filter(order => order.status === 'parked' || order.status === 'running').length;

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const headerPaddingTop = Math.max(insets.top, 20) + 12;

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FB' }]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent={true}
            />

            {/* Custom Header Bar */}
            <View style={[styles.headerBar, { paddingTop: headerPaddingTop, borderBottomColor: isDarkMode ? '#2C2C2E' : '#E5E9F0' }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={openDrawer}
                        style={[styles.menuButton, {
                            backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                            borderColor: isDarkMode ? '#2C2C2E' : '#E5E9F0'
                        }]}
                    >
                        <Ionicons name="menu" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                        <Text style={[styles.helloText, { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>
                            Hello, {driverName}
                        </Text>
                        <Text style={[styles.roleText, { color: isDarkMode ? '#8E8E93' : '#7A7A7A' }]}>
                            {driverRole}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.circleButton, {
                            backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                            borderColor: isDarkMode ? '#2C2C2E' : '#E5E9F0'
                        }]}
                    >
                        <Feather name="search" size={20} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.circleButton, {
                            backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                            borderColor: isDarkMode ? '#2C2C2E' : '#E5E9F0'
                        }]}
                    >
                        <Feather name="bell" size={20} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome section with background illustration */}
                <View style={styles.welcomeSection}>
                    <View style={styles.welcomeTextContainer}>
                        <Text style={[styles.welcomeSubText, { color: isDarkMode ? '#A5A5A5' : '#6E7A90' }]}>
                            Welcome back,
                        </Text>
                        <Text style={[styles.welcomeMainText, { color: isDarkMode ? '#FFFFFF' : '#0B1C33' }]}>
                            {driverName} 👋
                        </Text>
                    </View>
                    <CityIllustration isDarkMode={isDarkMode} />
                </View>

                {/* Cards Container */}
                <View style={styles.cardsContainer}>
                    {/* Generate Ticket Card */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/card-parking', params: { mode: 'generate' } } as any)}
                        style={styles.cardWrapper}
                    >
                        <LinearGradient
                            colors={['#007BFF', '#0056B3']}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                                    <Ionicons name="receipt" size={30} color="#FFFFFF" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.cardTitle}>Generate Ticket</Text>
                                    <Text style={styles.cardDescription}>
                                        Create a new parking ticket and generate its QR code
                                    </Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="chevron-forward" size={20} color="#0066FF" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Key Return Card */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/card-parking', params: { mode: 'scan' } } as any)}
                        style={styles.cardWrapper}
                    >
                        <LinearGradient
                            colors={['#FF851B', '#E65C00']}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                                    <Ionicons name="key" size={30} color="#FFFFFF" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.cardTitle}>Key Return</Text>
                                    <Text style={styles.cardDescription}>
                                        Scan customer QR code to release vehicle
                                    </Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="chevron-forward" size={20} color="#FF7A00" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats Container Grid */}
                <View style={[styles.statsCard, {
                    backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                    shadowColor: isDarkMode ? '#000000' : '#4E5D78'
                }]}>
                    <View style={styles.statsRow}>
                        {/* Tickets Today */}
                        <View style={styles.statColumn}>
                            <View style={[styles.statIconBox, { backgroundColor: isDarkMode ? 'rgba(0,123,255,0.15)' : '#EAF2FF' }]}>
                                <Ionicons name="receipt" size={18} color="#007BFF" />
                            </View>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#0B1C33' }]}>
                                {ticketsTodayCount}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]} numberOfLines={2}>
                                Tickets Today
                            </Text>
                        </View>

                        {/* Keys Returned */}
                        <View style={styles.statColumn}>
                            <View style={[styles.statIconBox, { backgroundColor: isDarkMode ? 'rgba(255,133,27,0.15)' : '#FFF0E5' }]}>
                                <Ionicons name="key" size={18} color="#FF851B" />
                            </View>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#0B1C33' }]}>
                                {keysReturnedCount}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]} numberOfLines={2}>
                                Keys Returned
                            </Text>
                        </View>

                        {/* Vehicles Parked */}
                        <View style={styles.statColumn}>
                            <View style={[styles.statIconBox, { backgroundColor: isDarkMode ? 'rgba(40,167,69,0.15)' : '#E8F8EE' }]}>
                                <Ionicons name="car" size={18} color="#28A745" />
                            </View>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#0B1C33' }]}>
                                {vehiclesParkedCount}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]} numberOfLines={2}>
                                Vehicles Parked
                            </Text>
                        </View>

                        {/* Avg Parking Time */}
                        {/* <View style={styles.statColumn}>
                            <View style={[styles.statIconBox, { backgroundColor: isDarkMode ? 'rgba(111,66,193,0.15)' : '#F2E6FF' }]}>
                                <Ionicons name="time" size={18} color="#6F42C1" />
                            </View>
                            <Text style={[styles.statValue, { color: isDarkMode ? '#FFFFFF' : '#0B1C33' }]}>
                                {avgParkingTime}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]} numberOfLines={2}>
                                Avg. Parking Time
                            </Text>
                        </View> */}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userInfo: {
        marginLeft: 12,
        justifyContent: 'center',
    },
    helloText: {
        fontSize: 15,
        fontWeight: '700',
    },
    roleText: {
        fontSize: 12,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationDot: {
        position: 'absolute',
        top: 11,
        right: 12,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#FF3B30',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 100, // Safe padding above bottom tab bar
    },
    welcomeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        position: 'relative',
        minHeight: 80,
    },
    welcomeTextContainer: {
        flex: 1,
        zIndex: 2,
    },
    welcomeSubText: {
        fontSize: 16,
        fontWeight: '500',
    },
    welcomeMainText: {
        fontSize: 30,
        fontWeight: '800',
        marginTop: 6,
    },
    illustrationWrapper: {
        position: 'absolute',
        right: 0,
        bottom: -5,
        zIndex: 1,
    },
    cardsContainer: {
        gap: 20,
        marginBottom: 28,
    },
    cardWrapper: {
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
    card: {
        borderRadius: 24,
        padding: 24,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 18,
    },
    arrowContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsCard: {
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statColumn: {
        width: (width - 64) / 4,
        alignItems: 'center',
    },
    statIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 4,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 12,
    },
});
