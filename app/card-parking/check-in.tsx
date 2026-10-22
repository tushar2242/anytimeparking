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
    Platform,
    KeyboardAvoidingView,
    Keyboard,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import VehicleAnglePhotosUpload from '@/components/card-parking/VehicleAnglePhotosUpload';
import VehicleInspectionSummary from '@/components/card-parking/VehicleInspectionSummary';
import { useVehiclePhotosStore } from '@/src/features/cardParking/vehiclePhotos.store';
import useThemeStore from '@/src/features/theme/theme.service';
import LayoutWrapper from '@/components/wrapper/LayoutWrapper';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Api, { baseURL } from '@/src/Api/api';
import * as WebBrowser from 'expo-web-browser';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { exportImageToPdf } from '@/src/utils/pdf';
import { formatDateTime } from '@/src/utils/date';

const qrcode = require('qrcode-generator');
const { width } = Dimensions.get('window');

interface ValetSite {
    id: string;
    name: string;
    badge?: string;
    description?: string;
    attendants?: number;
    slots?: number;
    code?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
}

const BRANDS = [
    'Tesla',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Toyota',
    'Honda',
    'Hyundai',
    'Ford',
    'Chevrolet',
    'Jeep',
    'Porsche',
    'Lexus',
    'Kia',
    'Cadillac',
    'Tata',
    'Mahindra',
    'Maruti Suzuki',
    'Other',
];

export default function CheckInScreen() {
    const isDarkMode = useThemeStore().isDarkMode;
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const themeColor = '#0066FF';
    const themeColorLight = isDarkMode ? '#1E2A3A' : '#EAF2FF';

    // Steps: 1 = Select Site (optional/switchable), 2 = Enter Vehicle Details, 3 = Ticket Generated
    const [step, setStep] = useState<number>(2);

    // Valet Site Selection from Live API
    const [sites, setSites] = useState<ValetSite[]>([]);
    const [selectedSite, setSelectedSite] = useState<ValetSite | null>(null);
    const [loadingSites, setLoadingSites] = useState(false);
    const [createdTicket, setCreatedTicket] = useState<any>(null);

    // Vehicle form state
    const [licensePlate, setLicensePlate] = useState('');
    const [brand, setBrand] = useState('');
    const [customBrand, setCustomBrand] = useState('');
    const [model, setModel] = useState('');
    const [color, setColor] = useState('');
    const [driverName, setDriverName] = useState('');
    const [phone, setPhone] = useState('');
    const [keySlot, setKeySlot] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');
    const [parkingTime, setParkingTime] = useState('');
    const [webTicketUrl, setWebTicketUrl] = useState('');

    // UI flags
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [generating, setGenerating] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleInputFocus = (targetY: number) => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: targetY,
                animated: true,
            });
        }, 120);
    };

    // Fetch live valet sites from API
    const fetchSites = async () => {
        setLoadingSites(true);
        try {
            const res = await Api.get('/valet-sites');
            const rawList = res?.sites || res?.data || (Array.isArray(res) ? res : []);
            if (rawList.length > 0) {
                const mapped: ValetSite[] = rawList.map((s: any) => ({
                    id: String(s.id),
                    name: s.name || 'Valet Site',
                    badge: s.category || s.status || 'Active',
                    description: `${s.address || ''} ${s.city || ''}`.trim() || s.name || 'Valet Hub',
                    attendants: s.attendants || s.valet_slots || 0,
                    slots: s.slots || s.total_slots || s.valet_slots || 0,
                    code: s.code || `SITE-${s.id}`,
                    address: s.address,
                    city: s.city,
                    latitude: s.latitude ? Number(s.latitude) : undefined,
                    longitude: s.longitude ? Number(s.longitude) : undefined,
                }));
                setSites(mapped);
                setSelectedSite(mapped[0]);
            } else {
                setSites([]);
                setSelectedSite(null);
            }
        } catch (e) {
            console.log('Error fetching sites from API:', e);
            setSites([]);
            setSelectedSite(null);
        } finally {
            setLoadingSites(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

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



    // Submit Check-In & Generate Ticket via API
    const handleConfirmDetails = async () => {
        if (!licensePlate.trim()) {
            Alert.alert('Input Required', 'Please enter or scan the vehicle license plate number.');
            return;
        }
        if (!driverName.trim()) {
            Alert.alert('Input Required', 'Please enter customer name.');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Input Required', 'Please enter customer phone number.');
            return;
        }

        setGenerating(true);
        try {
            const formattedPlate = licensePlate.trim().toUpperCase().replace(/\s+/g, '');
            const currentTime = new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand.trim();
            const formData = new FormData();
            formData.append('car_no', formattedPlate);
            formData.append('name', driverName.trim());
            formData.append('phone', phone.trim());
            if (effectiveBrand) formData.append('brand', effectiveBrand);
            if (model.trim()) formData.append('model', model.trim());
            if (color.trim()) formData.append('color', color.trim());
            if (keySlot.trim()) formData.append('key_slot', keySlot.trim());
            if (selectedSite?.id) formData.append('site_id', selectedSite.id);
            if (selectedSite?.name) formData.append('parking_site', selectedSite.name);

            const { primaryPhoto, photoFront, photoRear, photoLeft, photoRight } =
                useVehiclePhotosStore.getState().getFormDataPhotos();

            if (primaryPhoto && !primaryPhoto.startsWith('http')) {
                const uriParts = primaryPhoto.split('/');
                const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
                const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
                formData.append('photo', {
                    uri: primaryPhoto,
                    name: fileName,
                    type: fileType,
                } as any);
            }
            if (photoFront && !photoFront.startsWith('http')) {
                const parts = photoFront.split('/');
                formData.append('photo_front', {
                    uri: photoFront,
                    name: parts[parts.length - 1] || 'front.jpg',
                    type: 'image/jpeg',
                } as any);
            }
            if (photoRear && !photoRear.startsWith('http')) {
                const parts = photoRear.split('/');
                formData.append('photo_rear', {
                    uri: photoRear,
                    name: parts[parts.length - 1] || 'rear.jpg',
                    type: 'image/jpeg',
                } as any);
            }
            if (photoLeft && !photoLeft.startsWith('http')) {
                const parts = photoLeft.split('/');
                formData.append('photo_left', {
                    uri: photoLeft,
                    name: parts[parts.length - 1] || 'left.jpg',
                    type: 'image/jpeg',
                } as any);
            }
            if (photoRight && !photoRight.startsWith('http')) {
                const parts = photoRight.split('/');
                formData.append('photo_right', {
                    uri: photoRight,
                    name: parts[parts.length - 1] || 'right.jpg',
                    type: 'image/jpeg',
                } as any);
            }

            const res = await Api.post('/card-parking', formData, { formData: true });
            const resData = res?.data?.ticket || res?.data || res?.ticket || res;

            if (!resData || (res.status && res.status >= 400)) {
                throw new Error(res?.message || res?.data?.message || 'Failed to create ticket on server');
            }

            // Extract real fields returned from API
            const returnedTicketNo =
                resData?.ticket_no ||
                resData?.ticket_number ||
                resData?.ticket_id ||
                (resData?.id ? `VP-${resData.id}` : formattedPlate);

            const returnedTime =
                resData?.entry_time
                    ? formatDateTime(resData.entry_time)
                    : (resData?.created_at ? formatDateTime(resData.created_at) : currentTime);

            const returnedUrl = resData?.ticket_url || resData?.url || resData?.web_url;

            setTicketNumber(returnedTicketNo);
            setParkingTime(returnedTime);
            if (returnedUrl) {
                setWebTicketUrl(returnedUrl);
            }
            setCreatedTicket(resData);
            setStep(3);
        } catch (e: any) {
            console.error('API Ticket Generation Error:', e);
            const errMsg = e?.response?.data?.message || e?.message || 'Failed to generate valet ticket via API. Please try again.';
            Alert.alert('Ticket Creation Failed', errMsg);
        } finally {
            setGenerating(false);
        }
    };

    const openTicketWebsite = async () => {
        const targetTicketNo = createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber;
        const url = getTicketWebUrl(targetTicketNo);
        if (!url) return;
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                await WebBrowser.openBrowserAsync(url);
            }
        } catch (e) {
            try {
                await WebBrowser.openBrowserAsync(url);
            } catch (err) {
                Alert.alert('Website Link', url);
            }
        }
    };

    const shareTicketLink = async () => {
        const targetTicketNo = createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber;
        const url = getTicketWebUrl(targetTicketNo);
        if (!url) return;
        try {
            await Share.share({
                title: `Valet Parking Ticket #${targetTicketNo}`,
                message: `View your digital valet parking ticket online: ${url}`,
                url: url,
            });
        } catch (e) {
            console.log('Error sharing ticket link:', e);
        }
    };

    const sendWhatsApp = async () => {
        const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand.trim();
        const displayTicketNo = createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber;
        const displayCarNo = (createdTicket?.car_no || createdTicket?.vehicle_number || licensePlate || '').toUpperCase();
        const displayModel = [createdTicket?.brand || effectiveBrand, createdTicket?.model || model].filter(Boolean).join(' ') || createdTicket?.vehicle_type || 'Vehicle';
        const displayColor = createdTicket?.color || color;
        const displayKeySlot = createdTicket?.key_slot || keySlot;
        const displayTime = createdTicket?.entry_time
            ? formatDateTime(createdTicket.entry_time)
            : (createdTicket?.created_at ? formatDateTime(createdTicket.created_at) : parkingTime);
        const ticketWebLink = getTicketWebUrl(displayTicketNo);
        const locationName = createdTicket?.parking_site || createdTicket?.site_name || createdTicket?.site?.name || selectedSite?.name || 'Valet Hub';

        let mapLink = '';
        if (selectedSite?.latitude && selectedSite?.longitude) {
            mapLink = `https://maps.google.com/?q=${selectedSite.latitude},${selectedSite.longitude}`;
        } else if (selectedSite?.address || selectedSite?.name) {
            const locQuery = [selectedSite.name, selectedSite.address, selectedSite.city].filter(Boolean).join(', ');
            mapLink = `https://maps.google.com/?q=${encodeURIComponent(locQuery)}`;
        }

        const message =
            `🎉 *Your vehicle has been parked successfully!*\n\n` +
            `*Ticket No.*              ${displayTicketNo}\n` +
            `*Vehicle*                 ${displayModel}${displayColor ? ` (${displayColor})` : ''}\n` +
            `*Number Plate*            ${displayCarNo}\n` +
            `*Parking Location*        ${locationName}\n` +
            (displayKeySlot ? `*Key Slot*                ${displayKeySlot}\n` : '') +
            `*Parking Time*            ${displayTime}\n\n` +
            (ticketWebLink ? `🌐 *View Digital Ticket on Website:*\n${ticketWebLink}\n\n` : '') +
            (mapLink ? `📍 *View Valet Location on Map:*\n${mapLink}\n\n` : '') +
            `*When you return, simply tap the link or scan the QR code to request vehicle retrieval.*`;

        const targetPhone = createdTicket?.phone || createdTicket?.phone_no || createdTicket?.mobile_no || phone;
        const cleanPhone = String(targetPhone).replace(/\D/g, '').replace(/^0+/, '');
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
        const fallbackUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

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

    const handleSavePdf = async () => {
        const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand.trim();
        const targetTicket = createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber;
        const qrUri = getLocalQrUri(targetTicket);
        const locationName = createdTicket?.parking_site || createdTicket?.site_name || createdTicket?.site?.name || selectedSite?.name || 'Valet Hub';
        const displayPlate = (createdTicket?.car_no || createdTicket?.vehicle_number || licensePlate || '').toUpperCase();
        const displayModel = [createdTicket?.brand || effectiveBrand, createdTicket?.model || model].filter(Boolean).join(' ') || createdTicket?.vehicle_type || 'N/A';
        const displayColor = createdTicket?.color || color || 'N/A';
        const displayKeySlot = createdTicket?.key_slot || keySlot || 'N/A';
        const displayName = createdTicket?.name || createdTicket?.customer_name || createdTicket?.owner_name || driverName;
        const displayPhone = createdTicket?.phone || createdTicket?.phone_no || createdTicket?.mobile_no || phone;
        const displayStatus = (createdTicket?.status || 'PARKED').toUpperCase();
        const displayTime = createdTicket?.entry_time
            ? formatDateTime(createdTicket.entry_time)
            : (createdTicket?.created_at ? formatDateTime(createdTicket.created_at) : parkingTime);

        const details = [
            { label: 'Ticket Number', value: targetTicket },
            { label: 'Site Name', value: locationName },
            { label: 'License Plate', value: displayPlate },
            { label: 'Vehicle Model', value: displayModel },
            { label: 'Vehicle Color', value: displayColor },
            { label: 'Key Slot', value: displayKeySlot },
            { label: 'Customer Name', value: displayName },
            { label: 'Phone Number', value: displayPhone },
            { label: 'Parking Status', value: displayStatus },
            { label: 'Parking Time', value: displayTime },
        ];

        await exportImageToPdf(qrUri, 'Valet Parking Check-In Ticket', details);
    };

    const resetWorkflow = () => {
        useVehiclePhotosStore.getState().resetPhotos();
        setLicensePlate('');
        setBrand('');
        setCustomBrand('');
        setModel('');
        setColor('');
        setPhone('');
        setDriverName('');
        setKeySlot('');
        setTicketNumber('');
        setWebTicketUrl('');
        setCreatedTicket(null);
        setStep(2);
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
                            if (step > 1 && step < 3) {
                                setStep(step - 1);
                            } else {
                                navigation.dispatch(DrawerActions.openDrawer());
                            }
                        }}
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        {step > 1 && step < 3 ? (
                            <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                        ) : (
                            <Ionicons name="menu" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                        )}
                    </TouchableOpacity>

                    {/* Mode Switcher Pill */}
                    <View style={[styles.modeToggleContainer, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                        <TouchableOpacity
                            style={[styles.modeTabBtn, { backgroundColor: themeColor }]}
                            activeOpacity={0.9}
                        >
                            <Ionicons name="car-sport" size={14} color="#fff" style={{ marginRight: 5 }} />
                            <Text style={[styles.modeTabText, { color: '#fff', fontWeight: '800' }]}>
                                Check-In
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modeTabBtn}
                            onPress={() => router.push('/card-parking/key-return' as any)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="key" size={14} color={isDarkMode ? '#8E8E93' : '#6E7A90'} style={{ marginRight: 5 }} />
                            <Text style={[styles.modeTabText, { color: isDarkMode ? '#8E8E93' : '#6E7A90' }]}>
                                Key Return
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={resetWorkflow}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh" size={20} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                    </TouchableOpacity>
                </View>

                {/* Check-In Progress Stepper */}
                <View style={[styles.stepTrackerContainer, isDarkMode && { backgroundColor: '#0B1422', borderBottomColor: '#1A2942' }]}>
                    {[
                        { stepNum: 1, label: 'Select Site', icon: 'business' },
                        { stepNum: 2, label: 'Vehicle Details', icon: 'create' },
                        { stepNum: 3, label: 'Digital Ticket', icon: 'qr-code' },
                    ].map((item) => {
                        const isCompleted = item.stepNum < step;
                        const isActive = item.stepNum === step;

                        return (
                            <TouchableOpacity
                                key={item.stepNum}
                                style={styles.stepItemWrapper}
                                onPress={() => {
                                    if (item.stepNum < 3 || step === 3) setStep(item.stepNum);
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
                    {/* STEP 1: VALET SITE SELECTION */}
                    {/* ==================================================== */}
                    {step === 1 && (
                        <View style={styles.innerContent}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContainer}>
                                <View style={styles.stepHeaderBox}>
                                    <Text style={[styles.sectionHeading, isDarkMode && { color: '#fff' }]}>
                                        Select Valet Parking Hub
                                    </Text>
                                    <Text style={styles.sectionSubtitle}>
                                        Assign this check-in to an active valet location
                                    </Text>
                                </View>

                                {loadingSites ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color={themeColor} />
                                        <Text style={[styles.loadingText, isDarkMode && { color: '#8E8E93' }]}>
                                            Loading live valet parking hubs...
                                        </Text>
                                    </View>
                                ) : sites.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="business-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                                        <Text style={[styles.emptyTitle, isDarkMode && { color: '#fff' }]}>No Valet Hubs Available</Text>
                                        <Text style={styles.emptySubtitle}>Could not load valet sites from server.</Text>
                                        <TouchableOpacity style={[styles.retryButton, { backgroundColor: themeColor }]} onPress={fetchSites}>
                                            <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
                                            <Text style={styles.retryButtonText}>Retry Loading</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    sites.map((site) => {
                                        const isSelected = selectedSite?.id === site.id;
                                        return (
                                            <TouchableOpacity
                                                key={site.id}
                                                style={[
                                                    styles.siteCard,
                                                    isSelected && styles.siteCardSelected,
                                                    isDarkMode && { backgroundColor: '#1C1C1E', borderColor: isSelected ? themeColor : '#2C2C2E' },
                                                ]}
                                                onPress={() => setSelectedSite(site)}
                                                activeOpacity={0.8}
                                            >
                                                <View style={styles.siteCardRow}>
                                                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                                        {isSelected && <View style={styles.radioInner} />}
                                                    </View>
                                                    <View style={styles.siteDetails}>
                                                        <View style={styles.siteNameRow}>
                                                            <Text style={[styles.siteName, isDarkMode && { color: '#fff' }]}>{site.name}</Text>
                                                            {site.badge ? (
                                                                <View style={styles.activeBadge}>
                                                                    <Text style={styles.activeBadgeText}>{site.badge}</Text>
                                                                </View>
                                                            ) : null}
                                                        </View>
                                                        {site.description ? (
                                                            <Text style={styles.siteDesc}>{site.description}</Text>
                                                        ) : null}
                                                        <Text style={[styles.siteStats, isDarkMode && { color: '#8E8E93' }]}>
                                                            {[
                                                                site.city,
                                                                site.slots ? `${site.slots} Open Slots` : null,
                                                                site.attendants ? `${site.attendants} Attendants` : null,
                                                                site.code,
                                                            ].filter(Boolean).join('  •  ') || 'Active Hub'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.continueButton, !selectedSite && sites.length > 0 && { opacity: 0.6 }]}
                                onPress={() => {
                                    if (sites.length > 0 && !selectedSite) {
                                        Alert.alert('Select Location', 'Please choose a valet location to continue.');
                                        return;
                                    }
                                    setStep(2);
                                }}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.continueButtonText}>CONTINUE TO VEHICLE DETAILS</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 2: VEHICLE DETAILS & 4-ANGLE INSPECTION */}
                    {/* ==================================================== */}
                    {step === 2 && (
                        <KeyboardAvoidingView
                            style={{ flex: 1 }}
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? headerPaddingTop + 20 : 0}
                        >
                            <View style={[styles.innerContent, isKeyboardVisible && { paddingBottom: 16 }]}>
                                <ScrollView
                                    ref={scrollViewRef}
                                    contentContainerStyle={[
                                        styles.formScrollContainer,
                                        isKeyboardVisible && { paddingBottom: 280 },
                                    ]}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    keyboardDismissMode="on-drag"
                                    automaticallyAdjustKeyboardInsets={true}
                                >
                                    {/* Active Valet Hub Banner */}
                                    {selectedSite ? (
                                        <View style={[styles.siteSelectedBadgeRow, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <Ionicons name="location-sharp" size={16} color={themeColor} style={{ marginRight: 6 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.siteSelectedBadgeText, isDarkMode && { color: '#fff' }]}>
                                                    Valet Hub: <Text style={{ fontWeight: '700' }}>{selectedSite.name}</Text>
                                                </Text>
                                                {selectedSite.address ? (
                                                    <Text style={{ fontSize: 11, color: '#8E8E93' }} numberOfLines={1}>
                                                        {selectedSite.address}{selectedSite.city ? `, ${selectedSite.city}` : ''}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            <TouchableOpacity onPress={() => setStep(1)} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <Text style={{ color: themeColor, fontSize: 12, fontWeight: '700' }}>Switch</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                    {/* Form Input: License Plate Number */}
                                    <View style={styles.formInputGroup}>
                                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>
                                            License Plate Number *
                                        </Text>
                                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <Ionicons name="car-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                placeholder="e.g. DL 01 AB 1234"
                                                placeholderTextColor="#8E8E93"
                                                value={licensePlate}
                                                onChangeText={setLicensePlate}
                                                autoCapitalize="characters"
                                                onFocus={() => handleInputFocus(0)}
                                            />
                                        </View>
                                    </View>

                                    {/* Form Input: Customer Name */}
                                    <View style={styles.formInputGroup}>
                                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Customer Full Name *</Text>
                                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <Feather name="user" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                placeholder="Customer Name"
                                                placeholderTextColor="#8E8E93"
                                                value={driverName}
                                                onChangeText={setDriverName}
                                                onFocus={() => handleInputFocus(70)}
                                            />
                                        </View>
                                    </View>

                                    {/* Form Input: Mobile Number */}
                                    <View style={styles.formInputGroup}>
                                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Customer Mobile Number *</Text>
                                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <Feather name="phone" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                placeholder="10-digit mobile number"
                                                placeholderTextColor="#8E8E93"
                                                keyboardType="phone-pad"
                                                value={phone}
                                                onChangeText={setPhone}
                                                onFocus={() => handleInputFocus(140)}
                                            />
                                        </View>
                                    </View>

                                    {/* Form Input: Vehicle Brand Dropdown */}
                                    <View style={styles.formInputGroup}>
                                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Brand</Text>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                                            style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                                        >
                                            <View style={styles.brandDisplayRow}>
                                                <MaterialCommunityIcons name="car-select" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                                                <Text style={[styles.formInputTextValue, isDarkMode && { color: '#fff' }]}>
                                                    {brand ? (brand === 'Other' ? (customBrand ? `Other: ${customBrand}` : 'Other (Custom Make)') : brand) : 'Select Brand'}
                                                </Text>
                                            </View>
                                            <Ionicons name={showBrandDropdown ? "chevron-up" : "chevron-down"} size={20} color="#8E8E93" />
                                        </TouchableOpacity>

                                        {showBrandDropdown && (
                                            <View style={[styles.dropdownContainer, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                {BRANDS.map((item) => (
                                                    <TouchableOpacity
                                                        key={item}
                                                        onPress={() => {
                                                            setBrand(item);
                                                            setShowBrandDropdown(false);
                                                        }}
                                                        style={styles.dropdownItem}
                                                    >
                                                        <Text style={[styles.dropdownItemText, isDarkMode && { color: '#fff' }]}>{item}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        {brand === 'Other' && (
                                            <View style={[styles.formInputWrapper, { marginTop: 8 }, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="Enter vehicle make / brand name"
                                                    placeholderTextColor="#8E8E93"
                                                    value={customBrand}
                                                    onChangeText={setCustomBrand}
                                                    onFocus={() => handleInputFocus(200)}
                                                />
                                            </View>
                                        )}
                                    </View>

                                    {/* Form Input Row: Model & Color */}
                                    <View style={styles.formRowTwo}>
                                        <View style={[styles.formInputGroup, { flex: 1, marginRight: 8 }]}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Model</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. X5, Model 3"
                                                    placeholderTextColor="#8E8E93"
                                                    value={model}
                                                    onChangeText={setModel}
                                                    onFocus={() => handleInputFocus(260)}
                                                />
                                            </View>
                                        </View>

                                        <View style={[styles.formInputGroup, { flex: 1, marginLeft: 8 }]}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Color</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. Black, White"
                                                    placeholderTextColor="#8E8E93"
                                                    value={color}
                                                    onChangeText={setColor}
                                                    onFocus={() => handleInputFocus(260)}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Form Input: Key Slot / Parking Bay */}
                                    <View style={styles.formInputGroup}>
                                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>
                                            Valet Key Tag / Bay Slot (Optional)
                                        </Text>
                                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <Ionicons name="key-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                placeholder="e.g. Slot A-14, Key Tag #88"
                                                placeholderTextColor="#8E8E93"
                                                value={keySlot}
                                                onChangeText={setKeySlot}
                                                onFocus={() => handleInputFocus(320)}
                                            />
                                        </View>
                                    </View>

                                    {/* 4-Angle Vehicle Photo Upload (Independent Component) */}
                                    <VehicleAnglePhotosUpload />
                                </ScrollView>

                                <TouchableOpacity
                                    style={[styles.continueButton, generating && { opacity: 0.8 }]}
                                    onPress={handleConfirmDetails}
                                    disabled={generating}
                                    activeOpacity={0.85}
                                >
                                    {generating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.continueButtonText}>GENERATE VALET TICKET</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 3: TICKET GENERATED & DIGITAL PASSES */}
                    {/* ==================================================== */}
                    {step === 3 && (
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
                                            {createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber}
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

                                    {/* 4-Angle Inspection Photos (Independent Component) */}
                                    <VehicleInspectionSummary />

                                    {/* Local QR Code View */}
                                    <TouchableOpacity style={styles.qrImageBorder} onPress={handleSavePdf} activeOpacity={0.85}>
                                        {getLocalQrUri(createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber) ? (
                                            <Image
                                                source={{ uri: getLocalQrUri(createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber) }}
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
                                                {getTicketWebUrl(createdTicket?.ticket_no || createdTicket?.ticket_number || ticketNumber)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.webLinkButtonsRow}>
                                        <TouchableOpacity
                                            style={styles.openWebButton}
                                            onPress={openTicketWebsite}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="open-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
                                            <Text style={styles.openWebButtonText}>VIEW TICKET ON WEB</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.shareWebButton, isDarkMode && { backgroundColor: '#2C2C2E', borderColor: '#3A3A3C' }]}
                                            onPress={shareTicketLink}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="share-social-outline" size={18} color={isDarkMode ? '#fff' : themeColor} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* WhatsApp Dispatch Button */}
                                <TouchableOpacity style={styles.whatsappButton} onPress={sendWhatsApp} activeOpacity={0.85}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.whatsappButtonText}>SEND TICKET ON WHATSAPP</Text>
                                </TouchableOpacity>

                                {/* Done / Next Check-in */}
                                <TouchableOpacity
                                    style={[styles.shareTicketButton, { borderColor: themeColor }]}
                                    onPress={resetWorkflow}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done-circle-outline" size={20} color={themeColor} style={{ marginRight: 8 }} />
                                    <Text style={[styles.shareTicketButtonText, { color: themeColor }]}>DONE / CHECK-IN NEXT VEHICLE</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Bottom Navigation Tab Bar (hidden when keyboard is open to give full screen to inputs) */}
                {!isKeyboardVisible && <BottomTabBar />}
            </View>


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
        paddingHorizontal: 12,
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
    stepHeaderBox: {
        marginBottom: 16,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
    },
    siteCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    siteCardSelected: {
        borderColor: '#0066FF',
        backgroundColor: '#F2F8FF',
    },
    siteCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    radioOuterSelected: {
        borderColor: '#0066FF',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0066FF',
    },
    siteDetails: {
        flex: 1,
    },
    siteNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    siteName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    activeBadge: {
        backgroundColor: '#E2F1FF',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0066FF',
    },
    siteDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
    },
    siteStats: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3A3A3C',
    },
    continueButton: {
        backgroundColor: '#0066FF',
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#0066FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    formScrollContainer: {
        paddingBottom: 24,
    },
    formInputGroup: {
        marginBottom: 14,
    },
    formRowTwo: {
        flexDirection: 'row',
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
    formInputTextValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    ocrButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EAF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandDisplayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        marginTop: 4,
        paddingVertical: 6,
        maxHeight: 180,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#1C1C1E',
        fontWeight: '600',
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
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    loadingText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    siteSelectedBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF2FF',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#D0E3FF',
    },
    siteSelectedBadgeText: {
        fontSize: 13,
        color: '#1C1C1E',
    },
});
