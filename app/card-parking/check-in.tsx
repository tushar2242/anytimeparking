import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    StatusBar,
    Platform,
    Keyboard,
    Share,
    Linking,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { scanVehicleWithAI } from '@/src/features/cardParking/vehicleAiScanner.service';
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

import CheckInHeader from '@/components/card-parking/CheckInHeader';
import CheckInStepper from '@/components/card-parking/CheckInStepper';
import SiteSelectionStep, { ValetSite } from '@/components/card-parking/SiteSelectionStep';
import VehicleDetailsFormStep from '@/components/card-parking/VehicleDetailsFormStep';
import TicketGeneratedStep from '@/components/card-parking/TicketGeneratedStep';
import AiCameraModal from '@/components/card-parking/AiCameraModal';
import AiScanningOverlay from '@/components/card-parking/AiScanningOverlay';

const qrcode = require('qrcode-generator');

interface VehicleFormState {
    licensePlate: string;
    brand: string;
    customBrand: string;
    model: string;
    color: string;
    driverName: string;
    phone: string;
    keySlot: string;
}

interface TicketResultState {
    ticketNumber: string;
    parkingTime: string;
    webTicketUrl: string;
    createdTicket: any;
}

interface UiCameraState {
    isAiScanning: boolean;
    scanLoaderMessage: string;
    isCameraScannerOpen: boolean;
    cameraFacing: 'back' | 'front';
    torchOn: boolean;
}

const initialFormState: VehicleFormState = {
    licensePlate: '',
    brand: '',
    customBrand: '',
    model: '',
    color: '',
    driverName: '',
    phone: '',
    keySlot: '',
};

const initialTicketState: TicketResultState = {
    ticketNumber: '',
    parkingTime: '',
    webTicketUrl: '',
    createdTicket: null,
};

const initialCameraState: UiCameraState = {
    isAiScanning: false,
    scanLoaderMessage: 'Analyzing vehicle photo with Gemini Vision AI...',
    isCameraScannerOpen: false,
    cameraFacing: 'back',
    torchOn: false,
};

export default function CheckInScreen() {
    const isDarkMode = useThemeStore().isDarkMode;
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const themeColor = '#0066FF';
    const themeColorLight = isDarkMode ? '#1E2A3A' : '#EAF2FF';

    // Current step: 1 = Select Site, 2 = Vehicle Details, 3 = Ticket Generated
    const [step, setStep] = useState<number>(2);

    // Site selection state
    const [siteState, setSiteState] = useState<{
        sites: ValetSite[];
        selectedSite: ValetSite | null;
        loadingSites: boolean;
    }>({
        sites: [],
        selectedSite: null,
        loadingSites: false,
    });

    // Grouped form, ticket, camera & submitting state
    const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(initialFormState);
    const [ticketResult, setTicketResult] = useState<TicketResultState>(initialTicketState);
    const [cameraUi, setCameraUi] = useState<UiCameraState>(initialCameraState);
    const [generating, setGenerating] = useState(false);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);
    const cameraAutoOpenedRef = useRef(false);
    const scrollViewRef = useRef<any>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Keyboard listener
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

    // State updaters
    const updateForm = (fields: Partial<VehicleFormState>) => {
        setVehicleForm((prev) => ({ ...prev, ...fields }));
    };

    const updateCameraUi = (fields: Partial<UiCameraState>) => {
        setCameraUi((prev) => ({ ...prev, ...fields }));
    };

    // ==========================================
    // 1. CAMERA & AI SCANNING HANDLERS
    // ==========================================
    const cameraActions = useMemo(() => {
        const processImageForAi = async (uri: string) => {
            updateCameraUi({
                isCameraScannerOpen: false,
                isAiScanning: true,
                scanLoaderMessage: 'Analyzing vehicle with AI...',
            });

            useVehiclePhotosStore.getState().setPhoto('front', uri);

            try {
                const result = await scanVehicleWithAI(uri);
                updateForm({
                    ...(result.licensePlate ? { licensePlate: result.licensePlate } : {}),
                    ...(result.brand ? { brand: result.brand } : {}),
                    ...(result.model ? { model: result.model } : {}),
                    ...(result.color ? { color: result.color } : {}),
                });
            } catch (err: any) {
                console.error('AI Scanning error:', err);
            } finally {
                updateCameraUi({ isAiScanning: false });
            }
        };

        const pickGalleryAndScan = async () => {
            try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Gallery access is needed to select a vehicle image.');
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.4,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    await processImageForAi(result.assets[0].uri);
                }
            } catch (err) {
                console.error('Gallery pick error:', err);
            }
        };

        const openCamera = async () => {
            try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Camera Permission Needed',
                        'Camera access is required to take a car photo and auto-fill details.',
                        [
                            { text: 'Upload from Gallery', onPress: pickGalleryAndScan },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.4,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    await processImageForAi(result.assets[0].uri);
                }
            } catch (err) {
                console.error('Error opening camera:', err);
            }
        };

        const capturePhoto = async () => {
            if (cameraRef.current) {
                try {
                    const photo = await cameraRef.current.takePictureAsync({ quality: 0.4 });
                    if (photo?.uri) {
                        await processImageForAi(photo.uri);
                    } else {
                        Alert.alert('Error', 'Failed to capture photo');
                    }
                } catch (e: any) {
                    console.warn('Camera capture error:', e);
                    Alert.alert('Camera Error', 'Could not capture photo. Please try again or choose from gallery.');
                }
            }
        };

        return {
            openCamera,
            capturePhoto,
            pickGalleryAndScan,
            toggleTorch: () => setCameraUi((prev) => ({ ...prev, torchOn: !prev.torchOn })),
            flipCamera: () =>
                setCameraUi((prev) => ({
                    ...prev,
                    cameraFacing: prev.cameraFacing === 'back' ? 'front' : 'back',
                })),
            closeCamera: () => updateCameraUi({ isCameraScannerOpen: false }),
        };
    }, []);

    // Auto-trigger camera when reaching step 2
    useEffect(() => {
        if (step === 2 && !cameraAutoOpenedRef.current) {
            cameraAutoOpenedRef.current = true;
            const timer = setTimeout(() => {
                cameraActions.openCamera();
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [step, cameraActions]);

    // ==========================================
    // 2. SITE ACTIONS & DATA FETCHING
    // ==========================================
    const siteActions = useMemo(() => {
        const fetchSites = async () => {
            setSiteState((prev) => ({ ...prev, loadingSites: true }));
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
                    setSiteState({
                        sites: mapped,
                        selectedSite: mapped[0],
                        loadingSites: false,
                    });
                } else {
                    setSiteState({ sites: [], selectedSite: null, loadingSites: false });
                }
            } catch (e) {
                console.log('Error fetching sites from API:', e);
                setSiteState({ sites: [], selectedSite: null, loadingSites: false });
            }
        };

        return {
            fetchSites,
            selectSite: (site: ValetSite) => setSiteState((prev) => ({ ...prev, selectedSite: site })),
        };
    }, []);

    useEffect(() => {
        siteActions.fetchSites();
    }, [siteActions]);

    // ==========================================
    // 3. TICKET URL & QR CODE HELPERS
    // ==========================================
    const ticketHelpers = useMemo(() => {
        const getQrUri = (text: string): string => {
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

        const getWebUrl = (tNo: string): string => {
            if (!tNo) return '';
            if (ticketResult.webTicketUrl) return ticketResult.webTicketUrl;
            const ct = ticketResult.createdTicket;
            if (ct?.ticket_url || ct?.web_url || ct?.url) {
                return ct.ticket_url || ct.web_url || ct.url;
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

        return { getQrUri, getWebUrl };
    }, [ticketResult]);

    // ==========================================
    // 4. CHECK-IN SUBMISSION & DISPATCH ACTIONS
    // ==========================================
    const checkInActions = useMemo(() => {
        const confirmDetails = async () => {
            const { licensePlate, driverName, phone, brand, customBrand, model, color, keySlot } = vehicleForm;
            const { selectedSite } = siteState;

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
                formData.append('mobile_no', phone.trim());
                if (effectiveBrand) formData.append('brand', effectiveBrand);
                if (model.trim()) formData.append('model', model.trim());
                if (color.trim()) formData.append('color', color.trim());
                if (effectiveBrand || model.trim()) {
                    formData.append('vehicle_type', `${effectiveBrand} ${model.trim()}`.trim());
                }
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

                setTicketResult({
                    ticketNumber: returnedTicketNo,
                    parkingTime: returnedTime,
                    webTicketUrl: returnedUrl || '',
                    createdTicket: resData || {
                        ticket_no: returnedTicketNo,
                        car_no: formattedPlate,
                        name: driverName.trim(),
                        phone: phone.trim(),
                        status: 'parked',
                        entry_time: new Date().toISOString(),
                    },
                });
                setStep(3);
            } catch (e: any) {
                console.error('API Ticket Generation Error:', e);
                const errMsg =
                    e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    e?.message ||
                    'Failed to generate valet ticket via API. Please try again.';
                Alert.alert('Ticket Creation Failed', errMsg);
            } finally {
                setGenerating(false);
            }
        };

        const openWebsite = async () => {
            const ct = ticketResult.createdTicket;
            const targetTicketNo = ct?.ticket_no || ct?.ticket_number || ticketResult.ticketNumber;
            const url = ticketHelpers.getWebUrl(targetTicketNo);
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

        const shareTicket = async () => {
            const ct = ticketResult.createdTicket;
            const targetTicketNo = ct?.ticket_no || ct?.ticket_number || ticketResult.ticketNumber;
            const url = ticketHelpers.getWebUrl(targetTicketNo);
            if (!url) return;
            try {
                await Share.share({
                    title: `Valet Parking Ticket #${targetTicketNo}`,
                    message: `View your digital valet parking ticket online: ${url}`,
                    url,
                });
            } catch (e) {
                console.log('Error sharing ticket link:', e);
            }
        };

        const sendWhatsApp = async () => {
            const { brand, customBrand, model, color, licensePlate, keySlot, phone } = vehicleForm;
            const { selectedSite } = siteState;
            const ct = ticketResult.createdTicket;

            const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand.trim();
            const displayTicketNo = ct?.ticket_no || ct?.ticket_number || ticketResult.ticketNumber;
            const displayCarNo = (ct?.car_no || ct?.vehicle_number || licensePlate || '').toUpperCase();
            const displayModel =
                [ct?.brand || effectiveBrand, ct?.model || model].filter(Boolean).join(' ') ||
                ct?.vehicle_type ||
                'Vehicle';
            const displayColor = ct?.color || color;
            const displayKeySlot = ct?.key_slot || keySlot;
            const displayTime = ct?.entry_time
                ? formatDateTime(ct.entry_time)
                : (ct?.created_at ? formatDateTime(ct.created_at) : ticketResult.parkingTime);
            const ticketWebLink = ticketHelpers.getWebUrl(displayTicketNo);
            const locationName = ct?.parking_site || ct?.site_name || ct?.site?.name || selectedSite?.name || 'Valet Hub';

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

            const targetPhone = ct?.phone || ct?.phone_no || ct?.mobile_no || phone;
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

        const savePdf = async () => {
            const { brand, customBrand, model, color, licensePlate, keySlot, driverName, phone } = vehicleForm;
            const { selectedSite } = siteState;
            const ct = ticketResult.createdTicket;

            const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand.trim();
            const targetTicket = ct?.ticket_no || ct?.ticket_number || ticketResult.ticketNumber;
            const qrUri = ticketHelpers.getQrUri(targetTicket);
            const locationName = ct?.parking_site || ct?.site_name || ct?.site?.name || selectedSite?.name || 'Valet Hub';
            const displayPlate = (ct?.car_no || ct?.vehicle_number || licensePlate || '').toUpperCase();
            const displayModel =
                [ct?.brand || effectiveBrand, ct?.model || model].filter(Boolean).join(' ') ||
                ct?.vehicle_type ||
                'N/A';
            const displayColor = ct?.color || color || 'N/A';
            const displayKeySlot = ct?.key_slot || keySlot || 'N/A';
            const displayName = ct?.name || ct?.customer_name || ct?.owner_name || driverName;
            const displayPhone = ct?.phone || ct?.phone_no || ct?.mobile_no || phone;
            const displayStatus = (ct?.status || 'PARKED').toUpperCase();
            const displayTime = ct?.entry_time
                ? formatDateTime(ct.entry_time)
                : (ct?.created_at ? formatDateTime(ct.created_at) : ticketResult.parkingTime);

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
            setVehicleForm(initialFormState);
            setTicketResult(initialTicketState);
            cameraAutoOpenedRef.current = false;
            setStep(2);
        };

        return {
            confirmDetails,
            openWebsite,
            shareTicket,
            sendWhatsApp,
            savePdf,
            resetWorkflow,
        };
    }, [vehicleForm, siteState, ticketResult, ticketHelpers]);

    const handleInputFocus = (targetY: number) => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: targetY,
                animated: true,
            });
        }, 120);
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
                <CheckInHeader
                    step={step}
                    headerPaddingTop={headerPaddingTop}
                    isDarkMode={isDarkMode}
                    themeColor={themeColor}
                    onBackOrDrawer={() => {
                        if (step > 1 && step < 3) {
                            setStep(step - 1);
                        } else {
                            navigation.dispatch(DrawerActions.openDrawer());
                        }
                    }}
                    onNavigateKeyReturn={() => router.push('/card-parking/key-return' as any)}
                    onResetWorkflow={checkInActions.resetWorkflow}
                />

                {/* Check-In Progress Stepper */}
                <CheckInStepper
                    step={step}
                    themeColor={themeColor}
                    isDarkMode={isDarkMode}
                    onStepPress={(targetStep) => {
                        if (targetStep < 3 || step === 3) setStep(targetStep);
                    }}
                />

                {/* Main Content Area */}
                <View style={styles.contentArea}>
                    {step === 1 && (
                        <SiteSelectionStep
                            sites={siteState.sites}
                            selectedSite={siteState.selectedSite}
                            loadingSites={siteState.loadingSites}
                            isDarkMode={isDarkMode}
                            themeColor={themeColor}
                            onSelectSite={siteActions.selectSite}
                            onRetry={siteActions.fetchSites}
                            onContinue={() => {
                                if (siteState.sites.length > 0 && !siteState.selectedSite) {
                                    Alert.alert('Select Location', 'Please choose a valet location to continue.');
                                    return;
                                }
                                setStep(2);
                            }}
                        />
                    )}

                    {step === 2 && (
                        <VehicleDetailsFormStep
                            isDarkMode={isDarkMode}
                            themeColor={themeColor}
                            isKeyboardVisible={isKeyboardVisible}
                            headerPaddingTop={headerPaddingTop}
                            scrollViewRef={scrollViewRef}
                            selectedSite={siteState.selectedSite}
                            licensePlate={vehicleForm.licensePlate}
                            brand={vehicleForm.brand}
                            model={vehicleForm.model}
                            color={vehicleForm.color}
                            driverName={vehicleForm.driverName}
                            phone={vehicleForm.phone}
                            keySlot={vehicleForm.keySlot}
                            generating={generating}
                            onSwitchSite={() => setStep(1)}
                            onOpenAiCamera={cameraActions.openCamera}
                            onChangeLicensePlate={(licensePlate) => updateForm({ licensePlate })}
                            onChangeDriverName={(driverName) => updateForm({ driverName })}
                            onChangePhone={(phone) => updateForm({ phone })}
                            onChangeBrand={(brand) => updateForm({ brand })}
                            onChangeModel={(model) => updateForm({ model })}
                            onChangeColor={(color) => updateForm({ color })}
                            onChangeKeySlot={(keySlot) => updateForm({ keySlot })}
                            onInputFocus={handleInputFocus}
                            onSubmit={checkInActions.confirmDetails}
                        />
                    )}

                    {step === 3 && (
                        <TicketGeneratedStep
                            createdTicket={ticketResult.createdTicket}
                            ticketNumber={ticketResult.ticketNumber}
                            parkingTime={ticketResult.parkingTime}
                            selectedSite={siteState.selectedSite}
                            licensePlate={vehicleForm.licensePlate}
                            brand={vehicleForm.brand}
                            customBrand={vehicleForm.customBrand}
                            model={vehicleForm.model}
                            color={vehicleForm.color}
                            driverName={vehicleForm.driverName}
                            phone={vehicleForm.phone}
                            keySlot={vehicleForm.keySlot}
                            webTicketUrl={ticketResult.webTicketUrl}
                            baseURL={baseURL}
                            isDarkMode={isDarkMode}
                            themeColor={themeColor}
                            themeColorLight={themeColorLight}
                            onSavePdf={checkInActions.savePdf}
                            onOpenWebsite={checkInActions.openWebsite}
                            onShareLink={checkInActions.shareTicket}
                            onSendWhatsApp={checkInActions.sendWhatsApp}
                            onDone={checkInActions.resetWorkflow}
                        />
                    )}
                </View>

                {/* Bottom Navigation Tab Bar (hidden when keyboard is open) */}
                {!isKeyboardVisible && <BottomTabBar />}

                {/* Full-Screen Camera Scanner Modal */}
                <AiCameraModal
                    visible={cameraUi.isCameraScannerOpen}
                    hasPermission={Boolean(cameraPermission?.granted)}
                    cameraFacing={cameraUi.cameraFacing}
                    torchOn={cameraUi.torchOn}
                    cameraRef={cameraRef}
                    themeColor={themeColor}
                    onToggleTorch={cameraActions.toggleTorch}
                    onFlipCamera={cameraActions.flipCamera}
                    onClose={cameraActions.closeCamera}
                    onCapture={cameraActions.capturePhoto}
                    onPickGallery={cameraActions.pickGalleryAndScan}
                    onRequestPermission={requestCameraPermission}
                />

                {/* Full-Screen AI Loading Overlay */}
                <AiScanningOverlay
                    visible={cameraUi.isAiScanning}
                    isDarkMode={isDarkMode}
                    themeColor={themeColor}
                    message={cameraUi.scanLoaderMessage}
                />
            </View>
        </LayoutWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FB',
    },
    contentArea: {
        flex: 1,
    },
});
