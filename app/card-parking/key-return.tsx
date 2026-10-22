import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
    Share,
    Linking,
    StatusBar,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useThemeStore from '@/src/features/theme/theme.service';
import LayoutWrapper from '@/components/wrapper/LayoutWrapper';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Api from '@/src/Api/api';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { exportImageToPdf } from '@/src/utils/pdf';
import { formatDateTime } from '@/src/utils/date';

const qrcode = require('qrcode-generator');
const { width } = Dimensions.get('window');

interface TicketData {
    ticketId: string;
    vehicleNumber: string;
    vehicleType: string;
    ownerName: string;
    entryTime: string;
    parkingSite: string;
    phone: string;
    keySlot?: string;
    photo?: string | null;
}

export default function KeyReturnScreen() {
    const isDarkMode = useThemeStore().isDarkMode;
    const navigation = useNavigation();
    const router = useRouter();
    const params = useLocalSearchParams<{ ticketId?: string; mode?: string; search?: string }>();
    const insets = useSafeAreaInsets();

    const themeColor = '#FF851B';
    const themeColorLight = isDarkMode ? '#2C1E14' : '#FFF0E5';

    // Step state:
    // 1 = Locate Ticket (Scan QR / Manual Search / Active Parked Cars)
    // 2 = Vehicle Return Request & Verification
    // 3 = Vehicle Re-Inspection & Handover
    // 4 = Status: RETURNED (Closed)
    const [step, setStep] = useState<number>(1);

    // Discovery Tab (in Step 1)
    const [searchTab, setSearchTab] = useState<'scan' | 'manual' | 'active'>('manual');
    const [searchQuery, setSearchQuery] = useState('');
    const [flashlightOn, setFlashlightOn] = useState(false);
    const [searching, setSearching] = useState(false);
    const [scanned, setScanned] = useState(false);

    // Active parked vehicles list
    const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
    const [loadingActive, setLoadingActive] = useState(false);

    // Found / Selected Ticket
    const [foundTicket, setFoundTicket] = useState<TicketData>({
        ticketId: '',
        vehicleNumber: '',
        vehicleType: '',
        ownerName: '',
        entryTime: '',
        parkingSite: '',
        phone: '',
        keySlot: '',
    });

    // Re-inspection 4 photo slots (Step 3)
    const [returnPhotoFront, setReturnPhotoFront] = useState<string | null>(null);
    const [returnPhotoRear, setReturnPhotoRear] = useState<string | null>(null);
    const [returnPhotoLeft, setReturnPhotoLeft] = useState<string | null>(null);
    const [returnPhotoRight, setReturnPhotoRight] = useState<string | null>(null);
    const [activeReturnPhotoSlot, setActiveReturnPhotoSlot] = useState<'front' | 'rear' | 'left' | 'right' | null>(null);

    // Handover checklist (Step 3)
    const [fuelLevel, setFuelLevel] = useState<string>('Full');
    const [noDamageVerified, setNoDamageVerified] = useState<boolean>(true);
    const [returnNotes, setReturnNotes] = useState('');
    const [exitTime, setExitTime] = useState('');
    const [isReturning, setIsReturning] = useState(false);

    // Camera Permissions
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    // Handle incoming ticketId param (e.g. from recent tickets or notification)
    useEffect(() => {
        if (params.ticketId) {
            lookupTicket(params.ticketId);
        } else if (params.search) {
            setSearchQuery(params.search);
            lookupTicket(params.search);
        } else if (params.mode === 'scan') {
            setSearchTab('scan');
        }
    }, [params.ticketId, params.search, params.mode]);

    // Fetch active parked cars
    const loadActiveParkedCars = async () => {
        setLoadingActive(true);
        try {
            const res = await Api.get('/card-parking');
            const list = res?.data || res?.tickets || (Array.isArray(res) ? res : []);
            const formatted: TicketData[] = list
                .filter((item: any) => item.status !== 'returned' && item.status !== 'cancelled')
                .map((item: any) => ({
                    ticketId: item.ticket_no || item.ticket_id || item.id || '',
                    vehicleNumber: item.car_no || item.vehicle_number || 'Unknown',
                    vehicleType: item.vehicle_type || [item.brand, item.model].filter(Boolean).join(' ') || 'Vehicle',
                    ownerName: item.name || item.customer_name || 'Customer',
                    entryTime: (item.entry_time || item.created_at) ? formatDateTime(item.entry_time || item.created_at) : 'Recent',
                    parkingSite: item.parking_site || 'Valet Hub',
                    phone: item.phone || item.mobile_no || '',
                    keySlot: item.key_slot || '',
                    photo: item.photo || null,
                }));
            setActiveTickets(formatted);
        } catch (e) {
            setActiveTickets([]);
        } finally {
            setLoadingActive(false);
        }
    };

    useEffect(() => {
        loadActiveParkedCars();
    }, []);

    const handleCameraPermission = async () => {
        try {
            const status = await requestPermission();
            if (!status.granted) {
                Alert.alert(
                    'Camera Permission Required',
                    'Camera access is required to scan ticket QR codes and verify return photos.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => Linking.openSettings() },
                    ]
                );
            }
        } catch (err) {
            console.error('Error requesting camera permission:', err);
        }
    };

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

    // Lookup ticket by query string (ticket id, plate, or phone)
    const lookupTicket = async (rawQuery: string) => {
        const query = rawQuery.trim();
        if (!query) {
            Alert.alert('Input Required', 'Please enter a ticket number or vehicle plate.');
            return;
        }

        setSearching(true);
        try {
            let ticketData: any = null;

            // Direct ID lookup
            try {
                const res = await Api.get(`/card-parking/${encodeURIComponent(query)}`);
                ticketData = res?.data || res?.ticket || res;
            } catch (e) {
                // Search fallback
                try {
                    const searchRes = await Api.get('/card-parking', { query: { search: query } });
                    const list = searchRes?.data || (Array.isArray(searchRes) ? searchRes : []);
                    if (list.length > 0) {
                        ticketData = list[0];
                    }
                } catch (sErr) {
                    console.log('Search fallback err:', sErr);
                }
            }

            // Check orders if not found in car-parking
            if (!ticketData || (!ticketData.car_no && !ticketData.ticket_no && !ticketData.id)) {
                try {
                    const orderRes = await Api.get(`/order/${encodeURIComponent(query)}`);
                    const orderItem = orderRes?.data?.order || orderRes?.data || orderRes;
                    if (orderItem && (orderItem.id || orderItem.order_id || orderItem.vehicle_number)) {
                        ticketData = {
                            id: orderItem.id || orderItem.order_id,
                            ticket_no: orderItem.ticket_number || orderItem.order_id || `VP-${orderItem.id}`,
                            car_no: orderItem.vehicle_number,
                            vehicle_type: orderItem.vehicle_model || orderItem.vehicle_name || 'Vehicle',
                            name: orderItem.customer_name || orderItem.user_name || 'Customer',
                            mobile_no: orderItem.customer_phone || orderItem.phone || '',
                            parking_site: orderItem.site?.name || 'Valet Hub',
                            created_at: orderItem.requested_at || orderItem.created_at,
                        };
                    }
                } catch (oErr) {
                    console.log('Order search fallback err:', oErr);
                }
            }

            if (ticketData && (ticketData.car_no || ticketData.ticket_no || ticketData.id)) {
                const tId = ticketData.ticket_no || ticketData.ticket_number || ticketData.ticket_id || ticketData.id || query;
                const car = ticketData.car_no || ticketData.vehicle_number || query;
                const vType = ticketData.vehicle_type || [ticketData.brand, ticketData.model].filter(Boolean).join(' ') || 'Vehicle';
                const owner = ticketData.name || ticketData.customer_name || 'Customer';
                const ph = ticketData.mobile_no || ticketData.phone_no || ticketData.phone || '';
                const siteName = ticketData.parking_site || 'Valet Hub';
                const entryT = (ticketData.entry_time || ticketData.created_at) ? formatDateTime(ticketData.entry_time || ticketData.created_at) : '1h 30m ago';
                const kSlot = ticketData.key_slot || 'Bay A-12';

                setFoundTicket({
                    ticketId: tId,
                    vehicleNumber: car,
                    vehicleType: vType,
                    ownerName: owner,
                    entryTime: entryT,
                    parkingSite: siteName,
                    phone: ph,
                    keySlot: kSlot,
                    photo: ticketData.photo || null,
                });
                setStep(2);
            } else {
                Alert.alert(
                    'Ticket Not Found',
                    `No active vehicle ticket was found matching "${query}". Please verify the number.`,
                    [{ text: 'OK', onPress: () => setScanned(false) }]
                );
            }
        } catch (err) {
            console.error('Error finding ticket:', err);
            Alert.alert('Search Error', 'Unable to retrieve ticket details. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const selectActiveTicket = (ticket: TicketData) => {
        setFoundTicket(ticket);
        setStep(2);
    };

    // Re-inspection photo capture
    const saveReturnPhotoUri = (uri: string) => {
        if (activeReturnPhotoSlot === 'front') setReturnPhotoFront(uri);
        else if (activeReturnPhotoSlot === 'rear') setReturnPhotoRear(uri);
        else if (activeReturnPhotoSlot === 'left') setReturnPhotoLeft(uri);
        else if (activeReturnPhotoSlot === 'right') setReturnPhotoRight(uri);
        setActiveReturnPhotoSlot(null);
    };

    const captureReturnPhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
                if (photo && photo.uri) {
                    saveReturnPhotoUri(photo.uri);
                } else {
                    throw new Error('No photo URI');
                }
            } catch (err) {
                saveReturnPhotoUri('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600');
            }
        } else {
            saveReturnPhotoUri('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600');
        }
    };

    const pickReturnPhotoFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is required.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            saveReturnPhotoUri(result.assets[0].uri);
        }
    };

    // Complete vehicle return
    const handleConfirmReturn = async () => {
        setIsReturning(true);
        const currentTime = new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        try {
            const returnId = foundTicket.ticketId || foundTicket.vehicleNumber;
            const formData = new FormData();
            formData.append('status', 'returned');
            formData.append('exit_time', new Date().toISOString());
            formData.append('fuel_level', fuelLevel);
            if (returnNotes) {
                formData.append('notes', returnNotes);
            }

            if (returnPhotoFront && !returnPhotoFront.startsWith('http')) {
                const uriParts = returnPhotoFront.split('/');
                const fileName = uriParts[uriParts.length - 1] || 'return_photo.jpg';
                formData.append('photo', {
                    uri: returnPhotoFront,
                    name: fileName,
                    type: 'image/jpeg',
                } as any);
            }

            await Api.post(`/card-parking/${encodeURIComponent(returnId)}/return`, formData, { formData: true }).catch(() => {
                return Api.put(`/card-parking/${encodeURIComponent(returnId)}`, formData, { formData: true });
            }).catch((e) => console.log('Local return state notice:', e));
        } catch (e) {
            console.log('Return update notice:', e);
        } finally {
            setIsReturning(false);
            setExitTime(currentTime);
            setStep(4);
        }
    };

    const handleViewReceipt = () => {
        Alert.alert(
            'Valet Return Receipt',
            `Ticket ID: ${foundTicket.ticketId}\nVehicle: ${foundTicket.vehicleNumber}\nSite: ${foundTicket.parkingSite}\nKey Slot: ${foundTicket.keySlot || 'A-12'}\nCheck-In: ${foundTicket.entryTime}\nCheck-Out: ${exitTime}\nStatus: CLOSED`,
            [{ text: 'OK' }]
        );
    };

    const sendWhatsAppReceipt = async () => {
        const vehicleDesc = `${foundTicket.vehicleType || 'Vehicle'} • ${(foundTicket.vehicleNumber || '').toUpperCase()}`;
        const message =
            `🎉 *Your vehicle has been returned successfully!*\n\n` +
            `*Ticket No.*              ${foundTicket.ticketId}\n` +
            `*Vehicle*                 ${vehicleDesc}\n` +
            `*Parking Location*        ${foundTicket.parkingSite}\n` +
            `*Return Time*             ${exitTime || new Date().toLocaleTimeString()}\n` +
            `*Status*                  CLOSED\n\n` +
            `Thank you for using Anytime Valet! We hope you enjoyed our service.`;

        const url = `whatsapp://send?phone=91${foundTicket.phone}&text=${encodeURIComponent(message)}`;
        const fallbackUrl = `https://wa.me/91${foundTicket.phone}?text=${encodeURIComponent(message)}`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(fallbackUrl);
            }
        } catch (error) {
            await Linking.openURL(fallbackUrl);
        }
    };

    const handleSavePdfReceipt = async () => {
        const targetTicket = foundTicket.ticketId || 'VP-RETURN';
        const qrUri = getLocalQrUri(targetTicket);

        const details = [
            { label: 'Ticket ID', value: targetTicket },
            { label: 'Site Name', value: foundTicket.parkingSite },
            { label: 'Vehicle Number', value: foundTicket.vehicleNumber.toUpperCase() },
            { label: 'Vehicle Model', value: `${foundTicket.vehicleType} | ${foundTicket.ownerName}` },
            { label: 'Key Slot', value: foundTicket.keySlot || 'A-12' },
            { label: 'Customer Phone', value: foundTicket.phone },
            { label: 'Parking Status', value: 'RETURNED' },
            { label: 'Check-In Time', value: foundTicket.entryTime },
            { label: 'Exit Time', value: exitTime },
            { label: 'Fuel Handover', value: fuelLevel },
        ];

        await exportImageToPdf(qrUri, 'Valet Parking Return Receipt', details);
    };

    const resetWorkflow = () => {
        setSearchQuery('');
        setScanned(false);
        setReturnPhotoFront(null);
        setReturnPhotoRear(null);
        setReturnPhotoLeft(null);
        setReturnPhotoRight(null);
        setActiveReturnPhotoSlot(null);
        setReturnNotes('');
        setExitTime('');
        setFoundTicket({
            ticketId: '',
            vehicleNumber: '',
            vehicleType: '',
            ownerName: '',
            entryTime: '',
            parkingSite: '',
            phone: '',
            keySlot: '',
        });
        setStep(1);
        loadActiveParkedCars();
    };

    const headerPaddingTop = Math.max(insets.top, 20) + 8;

    return (
        <LayoutWrapper>
            <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                    backgroundColor="transparent"
                    translucent={true}
                />

                {/* Top Modular Navigation Bar */}
                <View
                    style={[
                        styles.headerNavbar,
                        { paddingTop: headerPaddingTop },
                        isDarkMode && { backgroundColor: '#1C1C1E', borderBottomColor: '#2C2C2E' },
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => {
                            if (step > 1 && step < 4) {
                                setStep(step - 1);
                            } else {
                                navigation.dispatch(DrawerActions.openDrawer());
                            }
                        }}
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        {step > 1 && step < 4 ? (
                            <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                        ) : (
                            <Ionicons name="menu" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                        )}
                    </TouchableOpacity>

                    {/* Mode Switcher Pill */}
                    <View style={[styles.modeToggleContainer, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                        <TouchableOpacity
                            style={styles.modeTabBtn}
                            onPress={() => router.push('/card-parking/check-in' as any)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="car-sport" size={14} color={isDarkMode ? '#8E8E93' : '#6E7A90'} style={{ marginRight: 5 }} />
                            <Text style={[styles.modeTabText, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]}>
                                Check-In
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modeTabBtn, { backgroundColor: themeColor }]}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="key" size={14} color="#fff" style={{ marginRight: 5 }} />
                            <Text style={[styles.modeTabText, { color: '#fff', fontWeight: '800' }]}>
                                Key Return
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setFlashlightOn(!flashlightOn)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={flashlightOn ? "flash" : "flash-outline"}
                            size={20}
                            color={flashlightOn ? themeColor : (isDarkMode ? '#fff' : '#1C1C1E')}
                        />
                    </TouchableOpacity>
                </View>

                {/* Key Return Progress Stepper */}
                <View style={[styles.stepTrackerContainer, isDarkMode && { backgroundColor: '#0B1422', borderBottomColor: '#1A2942' }]}>
                    {[
                        { stepNum: 1, label: 'Locate Ticket', icon: 'scan' },
                        { stepNum: 2, label: 'Vehicle Verify', icon: 'shield-checkmark' },
                        { stepNum: 3, label: 'Re-Inspection', icon: 'camera' },
                        { stepNum: 4, label: 'Returned', icon: 'checkmark-circle' },
                    ].map((item) => {
                        const isCompleted = item.stepNum < step;
                        const isActive = item.stepNum === step;

                        return (
                            <TouchableOpacity
                                key={item.stepNum}
                                style={styles.stepItemWrapper}
                                onPress={() => {
                                    if (item.stepNum < step || (step === 4 && item.stepNum === 4)) {
                                        setStep(item.stepNum);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.stepIconCircle,
                                        isCompleted && { backgroundColor: '#34C759' },
                                        isActive && { backgroundColor: themeColor, borderWidth: 1.5, borderColor: '#fff' },
                                        !isActive && !isCompleted && styles.stepIconCircleInactive,
                                    ]}
                                >
                                    <Ionicons
                                        name={isCompleted ? 'checkmark' : (item.icon as any)}
                                        size={14}
                                        color={isActive || isCompleted ? '#fff' : '#8E8E93'}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.stepItemLabel,
                                        isActive && styles.stepItemLabelActive,
                                        isCompleted && { color: '#34C759' },
                                        !isActive && !isCompleted && styles.stepItemLabelInactive,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.stepNum}. {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Main Content Area */}
                <View style={styles.contentArea}>
                    {/* ==================================================== */}
                    {/* STEP 1: LOCATE TICKET (SCAN / MANUAL / ACTIVE CARS) */}
                    {/* ==================================================== */}
                    {step === 1 && (
                        <View style={styles.innerContent}>
                            {/* Search Sub-Tabs */}
                            <View style={[styles.tabHeader, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                <TouchableOpacity
                                    style={[styles.tabHeaderItem, searchTab === 'manual' && { borderBottomColor: themeColor, borderBottomWidth: 3 }]}
                                    onPress={() => setSearchTab('manual')}
                                >
                                    <Ionicons name="search-outline" size={15} color={searchTab === 'manual' ? themeColor : '#8E8E93'} style={{ marginRight: 4 }} />
                                    <Text style={[styles.tabHeaderText, searchTab === 'manual' && { color: themeColor, fontWeight: '800' }]}>
                                        Manual Search
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.tabHeaderItem, searchTab === 'scan' && { borderBottomColor: themeColor, borderBottomWidth: 3 }]}
                                    onPress={async () => {
                                        if (!permission?.granted) await requestPermission();
                                        setScanned(false);
                                        setSearchTab('scan');
                                    }}
                                >
                                    <Ionicons name="qr-code-outline" size={15} color={searchTab === 'scan' ? themeColor : '#8E8E93'} style={{ marginRight: 4 }} />
                                    <Text style={[styles.tabHeaderText, searchTab === 'scan' && { color: themeColor, fontWeight: '800' }]}>
                                        Scan QR
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.tabHeaderItem, searchTab === 'active' && { borderBottomColor: themeColor, borderBottomWidth: 3 }]}
                                    onPress={() => {
                                        setSearchTab('active');
                                        loadActiveParkedCars();
                                    }}
                                >
                                    <Ionicons name="car-outline" size={15} color={searchTab === 'active' ? themeColor : '#8E8E93'} style={{ marginRight: 4 }} />
                                    <Text style={[styles.tabHeaderText, searchTab === 'active' && { color: themeColor, fontWeight: '800' }]}>
                                        Active Cars
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* TAB 1: LIVE QR SCANNER */}
                            {searchTab === 'scan' && (
                                <View style={styles.qrScannerContainer}>
                                    {permission && permission.granted ? (
                                        <CameraView
                                            ref={cameraRef}
                                            style={StyleSheet.absoluteFillObject}
                                            facing="back"
                                            barcodeScannerSettings={{
                                                barcodeTypes: ['qr'],
                                            }}
                                            onBarcodeScanned={scanned ? undefined : ({ data }) => {
                                                if (data && !scanned) {
                                                    setScanned(true);
                                                    lookupTicket(data);
                                                }
                                            }}
                                            enableTorch={flashlightOn}
                                        />
                                    ) : (
                                        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholderContainer]}>
                                            <Ionicons name="videocam-off-outline" size={44} color="#8E8E93" style={{ marginBottom: 10 }} />
                                            <Text style={styles.cameraPlaceholderText}>Camera Access Required for Scanner</Text>
                                            <TouchableOpacity style={styles.grantAccessInlineButton} onPress={handleCameraPermission}>
                                                <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Viewfinder Reticle */}
                                    <View style={styles.scanOverlayContainer}>
                                        <View style={[styles.scanViewfinder, { borderColor: themeColor, shadowColor: themeColor }]}>
                                            <View style={styles.scanCorners} />
                                        </View>
                                        <Text style={styles.scanHelperText}>Align Customer Valet QR inside frame</Text>

                                        <TouchableOpacity
                                            style={[styles.flashlightButton, flashlightOn && { backgroundColor: themeColor }]}
                                            onPress={() => setFlashlightOn(!flashlightOn)}
                                        >
                                            <Ionicons name={flashlightOn ? "flash" : "flash-outline"} size={20} color={flashlightOn ? "#fff" : themeColor} />
                                            <Text style={[styles.flashlightText, { color: flashlightOn ? '#fff' : themeColor }]}>
                                                {flashlightOn ? 'Torch Active' : 'Turn Torch On'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* TAB 2: MANUAL SEARCH */}
                            {searchTab === 'manual' && (
                                <ScrollView contentContainerStyle={styles.formScrollContainer} keyboardShouldPersistTaps="handled">
                                    <View style={styles.formInputGroup}>
                                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>
                                            Ticket #, Plate #, or Phone Number
                                        </Text>
                                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <Ionicons name="search-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                placeholder="e.g. VP-DTM-123456 or DL 01 AB 1234"
                                                placeholderTextColor="#8E8E93"
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                autoCapitalize="characters"
                                            />
                                            <TouchableOpacity
                                                style={[styles.qrScanInlineBtn, { backgroundColor: themeColorLight }]}
                                                onPress={async () => {
                                                    if (!permission?.granted) await requestPermission();
                                                    setScanned(false);
                                                    setSearchTab('scan');
                                                }}
                                                activeOpacity={0.75}
                                            >
                                                <Ionicons name="qr-code" size={16} color={themeColor} />
                                                <Text style={[styles.qrScanInlineText, { color: themeColor }]}>Scan QR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.continueButton, { backgroundColor: themeColor, marginTop: 8 }, searching && { opacity: 0.8 }]}
                                        onPress={() => lookupTicket(searchQuery)}
                                        disabled={searching}
                                        activeOpacity={0.85}
                                    >
                                        {searching ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 6 }} />
                                                <Text style={styles.continueButtonText}>FIND VEHICLE TICKET</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    {/* Quick helper note */}
                                    <View style={[styles.infoTipBox, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                        <Ionicons name="information-circle-outline" size={18} color={themeColor} style={{ marginRight: 8 }} />
                                        <Text style={[styles.infoTipText, isDarkMode && { color: '#8E8E93' }]}>
                                            Enter the full ticket number from customer's pass or the vehicle license plate number to retrieve ticket.
                                        </Text>
                                    </View>
                                </ScrollView>
                            )}

                            {/* TAB 3: ACTIVE PARKED VEHICLES */}
                            {searchTab === 'active' && (
                                <ScrollView contentContainerStyle={styles.siteListContainer} showsVerticalScrollIndicator={false}>
                                    <View style={styles.listHeaderRow}>
                                        <Text style={[styles.sectionHeading, isDarkMode && { color: '#fff' }]}>
                                            Currently Parked Vehicles ({activeTickets.length})
                                        </Text>
                                        <TouchableOpacity onPress={loadActiveParkedCars}>
                                            <Ionicons name="refresh" size={18} color={themeColor} />
                                        </TouchableOpacity>
                                    </View>

                                    {loadingActive ? (
                                        <ActivityIndicator size="small" color={themeColor} style={{ marginTop: 24 }} />
                                    ) : activeTickets.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="car-outline" size={44} color="#8E8E93" style={{ marginBottom: 8 }} />
                                            <Text style={[styles.emptyTitle, isDarkMode && { color: '#fff' }]}>No Parked Vehicles</Text>
                                            <Text style={styles.emptySubtitle}>All checked-in vehicles have been returned.</Text>
                                        </View>
                                    ) : (
                                        activeTickets.map((ticket) => (
                                            <TouchableOpacity
                                                key={ticket.ticketId}
                                                style={[styles.siteCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                                                onPress={() => selectActiveTicket(ticket)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.siteCardRow}>
                                                    <View style={[styles.cardIconBox, { backgroundColor: themeColorLight }]}>
                                                        <Ionicons name="key" size={20} color={themeColor} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Text style={[styles.siteName, isDarkMode && { color: '#fff' }]}>{ticket.vehicleNumber}</Text>
                                                            <View style={[styles.statusBadge, { backgroundColor: '#E2F8E7' }]}>
                                                                <Text style={[styles.statusBadgeText, { color: '#1C9A39' }]}>PARKED</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.siteDesc}>
                                                            Ticket: {ticket.ticketId}  •  Customer: {ticket.ownerName}
                                                        </Text>
                                                        <Text style={[styles.siteStats, isDarkMode && { color: '#8E8E93' }]}>
                                                            Bay: {ticket.keySlot || 'A-12'}  •  Entry: {ticket.entryTime}
                                                        </Text>
                                                    </View>
                                                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" style={{ marginLeft: 6 }} />
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 2: VEHICLE RETURN REQUEST & VERIFICATION */}
                    {/* ==================================================== */}
                    {step === 2 && (
                        <View style={styles.innerContent}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScrollContainer}>
                                {/* Vehicle Banner Card */}
                                <View style={styles.vehicleImageBannerCard}>
                                    <Image
                                        source={{
                                            uri: foundTicket.photo || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800'
                                        }}
                                        style={styles.vehicleBannerImage}
                                        resizeMode="cover"
                                    />
                                    <View style={[styles.vehicleBannerBadge, { backgroundColor: themeColor }]}>
                                        <Ionicons name="car-sport" size={14} color="#fff" style={{ marginRight: 4 }} />
                                        <Text style={styles.vehicleBannerBadgeText}>{foundTicket.vehicleNumber || 'VEHICLE'}</Text>
                                    </View>
                                </View>

                                <View style={[styles.acceptVerifyBadge, { backgroundColor: themeColorLight }]}>
                                    <Ionicons name="shield-checkmark" size={16} color={themeColor} style={{ marginRight: 6 }} />
                                    <Text style={[styles.acceptVerifyBadgeText, { color: themeColor }]}>
                                        Customer pickup requested • Verify details before key release
                                    </Text>
                                </View>

                                {/* Ticket Details Card */}
                                <View style={[styles.ticketCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Ticket ID</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.ticketId}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>License Plate</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.vehicleNumber}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Vehicle Model</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.vehicleType}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Customer Name</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.ownerName}</Text>
                                    </View>
                                    {foundTicket.phone ? (
                                        <View style={styles.ticketDetailRow}>
                                            <Text style={styles.ticketDetailLabel}>Phone Number</Text>
                                            <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.phone}</Text>
                                        </View>
                                    ) : null}
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Assigned Key Slot</Text>
                                        <Text style={[styles.ticketDetailValue, { color: themeColor }]}>{foundTicket.keySlot || 'Bay A-12'}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Parking Location</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.parkingSite}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Check-In Time</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.entryTime}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.returnVehicleBtn, { backgroundColor: themeColor }]}
                                        onPress={() => setStep(3)}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="checkmark-done-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.returnVehicleBtnText}>PROCEED TO HANDOVER</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.cancelRequestBtn, isDarkMode && { backgroundColor: 'rgba(255, 59, 48, 0.12)', borderColor: '#FF453A' }]}
                                        onPress={resetWorkflow}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close-circle-outline" size={18} color="#FF3B30" style={{ marginRight: 4 }} />
                                        <Text style={styles.cancelRequestBtnText}>CANCEL</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 3: RE-INSPECTION & HANDOVER CHECKLIST */}
                    {/* ==================================================== */}
                    {step === 3 && (
                        <View style={styles.innerContent}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContainer}>
                                <Text style={[styles.sectionHeading, isDarkMode && { color: '#fff' }]}>
                                    Departure Re-Inspection Photos
                                </Text>
                                <Text style={styles.sectionSubtitle}>
                                    Record vehicle return condition to prevent damage disputes
                                </Text>

                                {/* 4-angle Departure Photo Grid */}
                                <View style={[styles.photoGrid, { marginTop: 12 }]}>
                                    {[
                                        { slot: 'front' as const, label: 'Front Return', uri: returnPhotoFront, setter: setReturnPhotoFront },
                                        { slot: 'rear' as const, label: 'Rear Return', uri: returnPhotoRear, setter: setReturnPhotoRear },
                                        { slot: 'left' as const, label: 'Left Return', uri: returnPhotoLeft, setter: setReturnPhotoLeft },
                                        { slot: 'right' as const, label: 'Right Return', uri: returnPhotoRight, setter: setReturnPhotoRight },
                                    ].map((item) => (
                                        <TouchableOpacity
                                            key={item.slot}
                                            style={[
                                                styles.photoGridItem,
                                                item.uri !== null && { borderColor: '#34C759' },
                                                isDarkMode && { backgroundColor: '#1C1C1E', borderColor: item.uri ? '#34C759' : '#2C2C2E' },
                                            ]}
                                            onPress={() => setActiveReturnPhotoSlot(item.slot)}
                                            activeOpacity={0.8}
                                        >
                                            {item.uri ? (
                                                <Image source={{ uri: item.uri }} style={styles.capturedPhotoThumbnail} />
                                            ) : (
                                                <View style={styles.photoPlaceholder}>
                                                    <Ionicons name="camera-outline" size={22} color="#8E8E93" />
                                                    <Text style={styles.photoPlaceholderLabel}>{item.label}</Text>
                                                </View>
                                            )}
                                            {item.uri && (
                                                <TouchableOpacity
                                                    style={styles.photoRemoveBadge}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        item.setter(null);
                                                    }}
                                                >
                                                    <Ionicons name="close" size={12} color="#fff" />
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Fuel Gauge Selector */}
                                <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }, { marginTop: 14 }]}>
                                    Fuel Level at Handover
                                </Text>
                                <View style={styles.fuelContainer}>
                                    {['E', '1/4', '1/2', '3/4', 'Full'].map((lvl) => (
                                        <TouchableOpacity
                                            key={lvl}
                                            style={[
                                                styles.fuelButton,
                                                fuelLevel === lvl && { backgroundColor: themeColor, borderColor: themeColor },
                                                isDarkMode && fuelLevel !== lvl && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' },
                                            ]}
                                            onPress={() => setFuelLevel(lvl)}
                                        >
                                            <Text
                                                style={[
                                                    styles.fuelButtonText,
                                                    fuelLevel === lvl && { color: '#fff' },
                                                    isDarkMode && fuelLevel !== lvl && { color: '#fff' },
                                                ]}
                                            >
                                                {lvl}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Condition / Damage Checkbox */}
                                <TouchableOpacity
                                    style={[
                                        styles.damageVerifyBox,
                                        noDamageVerified && { borderColor: '#34C759', backgroundColor: isDarkMode ? '#14281E' : '#E8F8EE' },
                                        isDarkMode && !noDamageVerified && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' },
                                    ]}
                                    onPress={() => setNoDamageVerified(!noDamageVerified)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={noDamageVerified ? "checkbox" : "square-outline"}
                                        size={22}
                                        color={noDamageVerified ? "#34C759" : "#8E8E93"}
                                    />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={[styles.damageVerifyTitle, isDarkMode && { color: '#fff' }]}>
                                            Vehicle inspected with customer
                                        </Text>
                                        <Text style={styles.damageVerifySubtitle}>
                                            No new damages, scratches, or missing items reported
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Attendant Notes */}
                                <View style={[styles.formInputGroup, { marginTop: 12 }]}>
                                    <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Handover Remarks / Notes</Text>
                                    <TextInput
                                        style={[
                                            styles.multilineTextInput,
                                            isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E', color: '#fff' },
                                        ]}
                                        placeholder="Optional handover remarks or key notes..."
                                        placeholderTextColor="#8E8E93"
                                        value={returnNotes}
                                        onChangeText={setReturnNotes}
                                        multiline={true}
                                        numberOfLines={3}
                                    />
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.continueButton, { backgroundColor: themeColor }, isReturning && { opacity: 0.8 }]}
                                onPress={handleConfirmReturn}
                                disabled={isReturning}
                                activeOpacity={0.85}
                            >
                                {isReturning ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="key" size={18} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.continueButtonText}>COMPLETE HANDOVER & RETURN VEHICLE</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 4: STATUS RETURNED & FINAL RECEIPT */}
                    {/* ==================================================== */}
                    {step === 4 && (
                        <View style={styles.innerContent}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScrollContainer}>
                                {/* Animated Concentric Checkmark Ring */}
                                <View style={styles.concentricCheckmarkContainer}>
                                    <View style={[styles.concentricOuterRing, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                                        <View style={[styles.concentricInnerRing, { backgroundColor: '#34C759' }]}>
                                            <Ionicons name="checkmark" size={48} color="#fff" />
                                        </View>
                                    </View>
                                    <Text style={[styles.returnedStatusTitle, isDarkMode && { color: '#fff' }]}>
                                        Status: RETURNED
                                    </Text>
                                    <Text style={styles.returnedStatusSubtitle}>
                                        Vehicle handover complete. Valet session is closed.
                                    </Text>
                                </View>

                                {/* Closing Summary Details */}
                                <View style={[styles.ticketCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Ticket ID</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.ticketId}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Vehicle Number</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.vehicleNumber}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Customer Name</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.ownerName}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Check-In Time</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.entryTime}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Check-Out Time</Text>
                                        <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{exitTime}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Fuel Level Handed</Text>
                                        <Text style={[styles.ticketDetailValue, { color: themeColor }]}>{fuelLevel}</Text>
                                    </View>
                                    <View style={styles.ticketDetailRow}>
                                        <Text style={styles.ticketDetailLabel}>Parking Status</Text>
                                        <Text style={[styles.ticketDetailValue, { color: '#34C759' }]}>CLOSED & COMPLETED</Text>
                                    </View>
                                </View>

                                {/* Action Buttons Row */}
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.returnVehicleBtn, { backgroundColor: themeColor }]}
                                        onPress={handleViewReceipt}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="document-text-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={styles.returnVehicleBtnText}>VIEW RECEIPT</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.cancelRequestBtn, { borderColor: themeColor, backgroundColor: themeColorLight }]}
                                        onPress={handleSavePdfReceipt}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="download-outline" size={18} color={themeColor} style={{ marginRight: 4 }} />
                                        <Text style={[styles.cancelRequestBtnText, { color: themeColor }]}>PDF RECEIPT</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* WhatsApp Share */}
                                <TouchableOpacity style={styles.whatsappButton} onPress={sendWhatsAppReceipt} activeOpacity={0.85}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.whatsappButtonText}>SEND RECEIPT ON WHATSAPP</Text>
                                </TouchableOpacity>

                                {/* Done Reset Button */}
                                <TouchableOpacity
                                    style={[styles.doneResetButtonStyled, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                                    onPress={resetWorkflow}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done-circle-outline" size={20} color={themeColor} style={{ marginRight: 6 }} />
                                    <Text style={[styles.doneResetButtonStyledText, isDarkMode && { color: '#fff' }]}>
                                        DONE / PROCESS NEXT KEY RETURN
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Bottom Navigation Tab Bar */}
                <BottomTabBar />
            </View>

            {/* Full Screen Camera Modal for Departure Photo Capture */}
            {activeReturnPhotoSlot !== null && (
                <View style={[StyleSheet.absoluteFillObject, { zIndex: 2000, backgroundColor: '#000' }]}>
                    {permission && permission.granted ? (
                        <CameraView
                            ref={cameraRef}
                            style={StyleSheet.absoluteFillObject}
                            facing="back"
                            enableTorch={flashlightOn}
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholderContainer, { backgroundColor: '#000' }]}>
                            <Ionicons name="videocam-off-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                            <Text style={styles.cameraPlaceholderText}>Camera Feed Unavailable</Text>
                            <TouchableOpacity style={styles.grantAccessInlineButton} onPress={handleCameraPermission}>
                                <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Viewfinder Overlay */}
                    <View style={styles.scanOverlayContainer}>
                        <View style={styles.scanViewfinder}>
                            <View style={styles.scanCorners} />
                        </View>
                        <Text style={styles.scanHelperText}>
                            Capture {activeReturnPhotoSlot.toUpperCase()} side of the vehicle
                        </Text>
                    </View>

                    {/* Camera Actions Bar */}
                    <View style={styles.cameraActionsBar}>
                        <TouchableOpacity style={styles.cameraSubActionButton} onPress={pickReturnPhotoFromGallery}>
                            <Ionicons name="images-outline" size={24} color="#fff" />
                            <Text style={styles.cameraSubActionLabel}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shutterButton} onPress={captureReturnPhoto}>
                            <View style={[styles.shutterButtonInner, { backgroundColor: themeColor }]} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cameraSubActionButton}
                            onPress={() => setActiveReturnPhotoSlot(null)}
                        >
                            <Ionicons name="close-circle-outline" size={24} color="#fff" />
                            <Text style={styles.cameraSubActionLabel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </LayoutWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FB',
    },
    headerNavbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E9F0',
    },
    headerIconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F3F5',
        borderRadius: 22,
        padding: 4,
    },
    modeTabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 18,
    },
    modeTabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    stepTrackerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        paddingVertical: 12,
        backgroundColor: '#071325',
        borderBottomWidth: 1,
        borderBottomColor: '#102A45',
    },
    stepItemWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    stepIconCircleInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    stepItemLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        textAlign: 'center',
    },
    stepItemLabelActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    stepItemLabelInactive: {
        color: '#8E8E93',
    },
    contentArea: {
        flex: 1,
    },
    innerContent: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 90,
    },
    tabHeader: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    tabHeaderItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    tabHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },
    qrScannerContainer: {
        height: 360,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'relative',
    },
    scanOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanViewfinder: {
        width: width * 0.65,
        height: width * 0.65,
        borderRadius: 18,
        borderWidth: 2,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanCorners: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    scanHelperText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 16,
        backgroundColor: 'rgba(7, 19, 37, 0.75)',
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 14,
    },
    flashlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 18,
        marginTop: 12,
    },
    flashlightText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    formScrollContainer: {
        paddingBottom: 24,
    },
    formInputGroup: {
        marginBottom: 14,
    },
    formInputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3A3A3C',
        marginBottom: 6,
    },
    formInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 12,
    },
    formInputText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    qrScanInlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 6,
    },
    qrScanInlineText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    continueButton: {
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#FF851B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    infoTipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },
    infoTipText: {
        flex: 1,
        fontSize: 12,
        color: '#6E7A90',
        lineHeight: 16,
    },
    siteListContainer: {
        paddingBottom: 24,
    },
    listHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#8E8E93',
    },
    siteCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    siteCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconBox: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    siteName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    siteDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    siteStats: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3A3A3C',
        marginTop: 3,
    },
    ticketScrollContainer: {
        paddingBottom: 24,
    },
    vehicleImageBannerCard: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 14,
        position: 'relative',
        backgroundColor: '#1C1C1E',
    },
    vehicleBannerImage: {
        width: '100%',
        height: '100%',
    },
    vehicleBannerBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    vehicleBannerBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    acceptVerifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    acceptVerifyBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        padding: 16,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
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
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
        marginBottom: 12,
    },
    returnVehicleBtn: {
        flex: 1.2,
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    returnVehicleBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cancelRequestBtn: {
        flex: 0.8,
        height: 50,
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
        fontSize: 12,
        fontWeight: '700',
    },
    photoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    photoGridItem: {
        width: '23%',
        height: 76,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    capturedPhotoThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    photoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderLabel: {
        fontSize: 9,
        color: '#8E8E93',
        marginTop: 3,
        fontWeight: '600',
        textAlign: 'center',
    },
    photoRemoveBadge: {
        position: 'absolute',
        top: 3,
        right: 3,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fuelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 14,
    },
    fuelButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 3,
    },
    fuelButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
    },
    damageVerifyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    damageVerifyTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    damageVerifySubtitle: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 2,
    },
    multilineTextInput: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        fontWeight: '500',
        color: '#1C1C1E',
        minHeight: 76,
        textAlignVertical: 'top',
    },
    concentricCheckmarkContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
    },
    concentricOuterRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    concentricInnerRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    returnedStatusTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    returnedStatusSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
    },
    whatsappButton: {
        backgroundColor: '#25D366',
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    whatsappButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    doneResetButtonStyled: {
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F2F2F7',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 6,
        marginBottom: 16,
    },
    doneResetButtonStyledText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 0.5,
    },
    cameraPlaceholderContainer: {
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPlaceholderText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    grantAccessInlineButton: {
        backgroundColor: 'rgba(255, 133, 27, 0.2)',
        borderWidth: 1,
        borderColor: '#FF851B',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    grantAccessInlineText: {
        color: '#FF851B',
        fontWeight: '700',
        fontSize: 12,
    },
    cameraActionsBar: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    cameraSubActionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
    },
    cameraSubActionLabel: {
        color: '#fff',
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    shutterButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    shutterButtonInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
});
