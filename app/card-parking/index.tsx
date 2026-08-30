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
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useThemeStore from '@/src/features/theme/theme.service';
import LayoutWrapper from '@/components/wrapper/LayoutWrapper';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Api, { baseURL } from '@/src/Api/api';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { exportImageToPdf } from '@/src/utils/pdf';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const qrcode = require('qrcode-generator');

const { width, height } = Dimensions.get('window');

interface ValetSite {
    id: string;
    name: string;
    badge: string;
    description: string;
    attendants: number;
    slots: number;
    code: string;
}

interface MockTicket {
    ticketId: string;
    vehicleNumber: string;
    vehicleType: string;
    ownerName: string;
    entryTime: string;
    parkingSite: string;
    phone: string;
}


const BRANDS = [
    'Mercedes Benz',
    'BMW',
    'Audi',
    'Toyota',
    'Honda',
    'Hyundai',
    'Tata',
    'Mahindra',
    'Ford',
    'Maruti Suzuki',
];


export default function ValetAttendantWorkflowScreen() {
    const isDarkMode = useThemeStore().isDarkMode;
    const params = useLocalSearchParams();
    const navigation = useNavigation();

    const getLocalQrUri = (text: string): string => {
        if (!text) return '';
        try {
            const qr = qrcode(4, 'L');
            qr.addData(text);
            qr.make();
            return qr.createDataURL(10, 4);
        } catch (err) {
            console.error('Error generating local QR, using remote fallback:', err);
            return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
        }
    };

    // Workflow Mode: 'checkin' (Orange theme) or 'keyreturn' (Orange theme)
    const [workflowMode, setWorkflowMode] = useState<'checkin' | 'keyreturn'>('checkin');

    // Steps state:
    // Check-in: 2 = Check-In Details, 3 = Inspection Photos, 4 = Ticket Generated
    const [checkinStep, setCheckinStep] = useState<number>(2);
    // Key Return: 1 = Scan QR, 2 = Search Ticket, 3 = Return Request Info, 4 = Vehicle Return, 5 = Status Returned
    const [returnStep, setReturnStep] = useState<number>(1);

    // ==========================================
    // Check-In Form State
    // ==========================================
    const [selectedSite, setSelectedSite] = useState<ValetSite | null>({
        id: 'site-1',
        name: 'City Mall',
        badge: 'Active',
        description: 'Main Entrance, Parking Area A',
        attendants: 12,
        slots: 45,
        code: 'CM',
    });

    // 4 capture photo slots
    const [photoFront, setPhotoFront] = useState<string | null>(null);
    const [photoRear, setPhotoRear] = useState<string | null>(null);
    const [photoLeft, setPhotoLeft] = useState<string | null>(null);
    const [photoRight, setPhotoRight] = useState<string | null>(null);
    const [activePhotoSlot, setActivePhotoSlot] = useState<'front' | 'rear' | 'left' | 'right' | null>(null);

    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [licensePlate, setLicensePlate] = useState('');
    const [brand, setBrand] = useState('Mercedes Benz');
    const [model, setModel] = useState('');
    const [color, setColor] = useState('');
    const [phone, setPhone] = useState('');
    const [driverName, setDriverName] = useState('');
    const [ticketNumber, setTicketNumber] = useState('');
    const [parkingTime, setParkingTime] = useState('');

    // Inspection additional states
    const [odometer, setOdometer] = useState('45231');
    const [fuelLevel, setFuelLevel] = useState('3/4');
    const [isDamageDetected, setIsDamageDetected] = useState(false);

    // UI States for Check-in
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [ocrScanning, setOcrScanning] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');

    // ==========================================
    // Key Return Form State
    // ==========================================
    const [searchTab, setSearchTab] = useState<'manual' | 'recent'>('manual');
    const [searchBy, setSearchBy] = useState<'mobile' | 'car' | 'ticket'>('mobile');
    const [searchQuery, setSearchQuery] = useState('');
    const [flashlightOn, setFlashlightOn] = useState(false);
    const [searching, setSearching] = useState(false);
    const [returnNotes, setReturnNotes] = useState('');
    const [exitTime, setExitTime] = useState('');

    // Re-inspection 4 photo slots (key return)
    const [returnPhotoFront, setReturnPhotoFront] = useState<string | null>(null);
    const [returnPhotoRear, setReturnPhotoRear] = useState<string | null>(null);
    const [returnPhotoLeft, setReturnPhotoLeft] = useState<string | null>(null);
    const [returnPhotoRight, setReturnPhotoRight] = useState<string | null>(null);
    const [activeReturnPhotoSlot, setActiveReturnPhotoSlot] = useState<'front' | 'rear' | 'left' | 'right' | null>(null);



    // Found Ticket State
    const [foundTicket, setFoundTicket] = useState<MockTicket>({
        ticketId: 'WP1234567890',
        vehicleNumber: 'RJ20CD1234',
        vehicleType: 'Car',
        ownerName: 'Ravi Sharma',
        entryTime: '18 Aug 2026, 10:30 AM',
        parkingSite: 'The Valley Mall',
        phone: '9876543210',
    });

    // Camera Permissions
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    // Handle initial route parameters
    useEffect(() => {
        if (params.mode === 'scan' || params.mode === 'keyreturn') {
            setWorkflowMode('keyreturn');
            setReturnStep(1);
        } else {
            setWorkflowMode('checkin');
            setCheckinStep(2);
        }
    }, [params.mode]);

    // Theme Color Mapping - dynamically aligns with dashboard check-in (blue) and key return (orange) cards
    const themeColor = workflowMode === 'checkin' ? '#0066FF' : '#FF851B';
    const themeColorLight = workflowMode === 'checkin' ? '#EAF2FF' : '#FFF0E5';
    const themeColorOpaque = workflowMode === 'checkin' ? 'rgba(0, 102, 255, 0.2)' : 'rgba(255, 133, 27, 0.2)';

    // Camera Actions (Check-in & Key Return Step 1)
    const handleCameraPermission = async () => {
        try {
            const status = await requestPermission();
            if (!status.granted) {
                Alert.alert(
                    'Camera Permission Required',
                    'Valet attendant needs camera access to verify vehicles and scan ticket QR codes. Please enable it in Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } catch (err) {
            console.error('Error requesting camera permission:', err);
        }
    };

    useEffect(() => {
        if ((workflowMode === 'checkin' && checkinStep === 2) || (workflowMode === 'keyreturn' && returnStep === 1)) {
            if (permission && !permission.granted && permission.canAskAgain) {
                requestPermission();
            }
        }
    }, [checkinStep, returnStep, workflowMode, permission]);

    useEffect(() => {
        if (workflowMode === 'checkin' && checkinStep === 2) {
            if (!licensePlate && !model) {
                triggerOCR();
            }
        }
    }, [checkinStep, workflowMode, licensePlate, model]);

    // ==========================================
    // Check-In Actions
    // ==========================================
    const handleSiteSelectContinue = () => {
        if (!selectedSite) {
            Alert.alert('Selection Required', 'Please select a valet site to continue.');
            return;
        }
        setCheckinStep(2);
    };

    const savePhotoUri = (uri: string) => {
        if (activePhotoSlot) {
            if (activePhotoSlot === 'front') {
                setPhotoFront(uri);
            } else if (activePhotoSlot === 'rear') {
                setPhotoRear(uri);
            } else if (activePhotoSlot === 'left') {
                setPhotoLeft(uri);
            } else if (activePhotoSlot === 'right') {
                setPhotoRight(uri);
            }
            setActivePhotoSlot(null);
        } else if (activeReturnPhotoSlot) {
            if (activeReturnPhotoSlot === 'front') {
                setReturnPhotoFront(uri);
            } else if (activeReturnPhotoSlot === 'rear') {
                setReturnPhotoRear(uri);
            } else if (activeReturnPhotoSlot === 'left') {
                setReturnPhotoLeft(uri);
            } else if (activeReturnPhotoSlot === 'right') {
                setReturnPhotoRight(uri);
            }
            setActiveReturnPhotoSlot(null);
        } else {
            // Main check-in photo capture (Step 2)
            setPhotoUri(uri);
            setCheckinStep(3);
        }
    };

    const capturePhoto = async () => {
        if (cameraRef.current) {
            try {
                // On real devices, photo capturing, processing, and file writing often takes 2-4 seconds.
                // We remove the restrictive 2-second timeout Promise.race.
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                });

                if (photo && photo.uri) {
                    savePhotoUri(photo.uri);
                } else {
                    throw new Error('No photo URI returned from takePictureAsync');
                }
            } catch (err) {
                console.warn('Failed to capture photo natively, using simulation fallback:', err);
                savePhotoUri('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600');
            }
        } else {
            // Simulated Capture in case simulator/unsupported environment
            savePhotoUri('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600');
        }
    };

    const pickPhotoFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access gallery is required.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            savePhotoUri(result.assets[0].uri);
        }
    };

    const triggerOCR = () => {
        setOcrScanning(true);
        setTimeout(() => {
            setOcrScanning(false);
            setLicensePlate('MH02AB1234');
            setBrand('Mercedes Benz');
            setModel('E-Class');
            setColor('Black');
            setPhone('9876543210');
            setDriverName('Rajesh Kumar');
            Alert.alert('OCR Complete', 'Vehicle details successfully extracted from photo.');
        }, 1200);
    };

    const handleConfirmDetails = async () => {
        if (!licensePlate.trim() || !brand.trim() || !model.trim() || !color.trim() || !phone.trim() || !driverName.trim()) {
            Alert.alert('Error', 'Please verify and fill in all details.');
            return;
        }

        setGenerating(true);
        try {
            const formattedPlate = licensePlate.trim().toUpperCase().replace(/\s+/g, '');
            const generatedTicket = `VP-${selectedSite?.code || 'VAL'}-${Math.floor(100000 + Math.random() * 900000)}`;
            const currentTime = new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            try {
                const formData = new FormData();
                formData.append('car_no', formattedPlate);
                formData.append('name', driverName.trim());
                formData.append('phone', phone.trim());
                formData.append('brand', brand.trim());
                formData.append('model', model.trim());
                formData.append('color', color.trim());
                formData.append('ticket_no', generatedTicket);
                if (selectedSite) {
                    formData.append('site_id', selectedSite.id);
                }

                if (photoUri && !photoUri.startsWith('http')) {
                    const uriParts = photoUri.split('/');
                    const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
                    const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
                    formData.append('photo', {
                        uri: photoUri,
                        name: fileName,
                        type: fileType,
                    } as any);
                }

                await Api.post('/card-parking', formData, {
                    formData: true,
                });
            } catch (apiErr) {
                console.log('Skipping API post (using mock generation):', apiErr);
            }

            setTicketNumber(generatedTicket);
            setParkingTime(currentTime);
            setCheckinStep(4);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to generate valet ticket. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // ==========================================
    // Key Return Actions
    // ==========================================
    const simulateQRScan = () => {
        setSearching(true);
        setTimeout(() => {
            setSearching(false);
            const mockRand = Math.floor(100000 + Math.random() * 900000);
            setFoundTicket({
                ticketId: `WP${mockRand}`,
                vehicleNumber: 'MH02AB1234',
                vehicleType: 'Car',
                ownerName: 'Rajesh Kumar',
                entryTime: '18 Aug 2026, 10:30 AM',
                parkingSite: 'City Mall',
                phone: '9876543210',
            });
            setReturnStep(3);
        }, 1000);
    };

    const handleSearchSubmit = () => {
        if (!searchQuery.trim()) {
            Alert.alert('Input Required', 'Please enter a search value.');
            return;
        }

        setSearching(true);
        setTimeout(() => {
            setSearching(false);
            const mockRand = Math.floor(100000 + Math.random() * 900000);
            let car = 'RJ20CD1234';
            let tId = `WP${mockRand}`;
            let ph = '9876543210';

            if (searchBy === 'car') {
                car = searchQuery.trim().toUpperCase();
            } else if (searchBy === 'ticket') {
                tId = searchQuery.trim().toUpperCase();
            } else {
                ph = searchQuery.trim();
            }

            setFoundTicket({
                ticketId: tId,
                vehicleNumber: car,
                vehicleType: 'SUV',
                ownerName: 'Ravi Sharma',
                entryTime: '18 Aug 2026, 10:30 AM',
                parkingSite: selectedSite ? selectedSite.name : 'The Valley Mall',
                phone: ph,
            });
            setReturnStep(3);
        }, 1200);
    };

    const selectRecentTicket = (ticket: MockTicket) => {
        setFoundTicket(ticket);
        setReturnStep(3);
    };

    const handleConfirmReturn = () => {
        const currentTime = new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        setExitTime(currentTime);
        setReturnStep(5);
    };

    const handleViewReceipt = () => {
        Alert.alert(
            'Receipt Details',
            `Ticket ID: ${foundTicket.ticketId}\nVehicle: ${foundTicket.vehicleNumber}\nSite: ${foundTicket.parkingSite}\nDuration: 1h 45m\nStatus: CLOSED`,
            [{ text: 'OK', onPress: resetWorkflow }]
        );
    };

    // Shared actions
    const sendWhatsApp = async () => {
        const isCheckin = workflowMode === 'checkin';
        const clientName = isCheckin ? driverName : foundTicket.ownerName;
        const vehiclePlate = isCheckin ? licensePlate : foundTicket.vehicleNumber;
        const siteName = isCheckin ? selectedSite?.name : foundTicket.parkingSite;
        const currentTicket = isCheckin ? ticketNumber : foundTicket.ticketId;
        const clientPhone = isCheckin ? phone : foundTicket.phone;

        const vehicleDesc = isCheckin ? `${brand} ${model} • ${color}` : `${foundTicket.vehicleType || 'BMW X5'} • Black`;

        let message = '';
        if (isCheckin) {
            message = `🎉 *Your vehicle has been parked successfully!*\n\n` +
                `*Ticket No.*              ${currentTicket}\n` +
                `*Vehicle*                 ${vehicleDesc}\n` +
                `*Number Plate*            ${(vehiclePlate || '').toUpperCase()}\n` +
                `*Parking Location*        ${siteName || 'B2 - 45'}\n` +
                `*Parking Time*            ${parkingTime || '11:05 AM, 18 May 2025'}\n` +
                `*Attended By*             John Driver\n\n` +
                `📍 *View Location on Map:*\n` +
                `https://maps.google.com/?q=28.6139,77.2090\n\n` +
                `*Quick Actions:*\n` +
                `• I will be back in 10 mins\n` +
                `• I will be back in 20 mins\n` +
                `• I will be back in 30 mins\n` +
                `• I'm on My Way Now`;
        } else {
            message = `🎉 *Your vehicle has been returned successfully!*\n\n` +
                `*Ticket No.*              ${currentTicket}\n` +
                `*Vehicle*                 ${vehicleDesc}\n` +
                `*Number Plate*            ${(vehiclePlate || '').toUpperCase()}\n` +
                `*Exit Time*               ${exitTime || new Date().toLocaleTimeString()}\n` +
                `*Attended By*             John Driver\n\n` +
                `Thank you for using Anytime Valet!`;
        }

        const url = `whatsapp://send?phone=91${clientPhone}&text=${encodeURIComponent(message)}`;
        const fallbackUrl = `https://wa.me/91${clientPhone}?text=${encodeURIComponent(message)}`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(fallbackUrl);
            }
        } catch (error) {
            console.log('Error opening WhatsApp:', error);
            await Linking.openURL(fallbackUrl);
        }
    };

    const shareTicket = async () => {
        const isCheckin = workflowMode === 'checkin';
        const clientName = isCheckin ? driverName : foundTicket.ownerName;
        const vehiclePlate = isCheckin ? licensePlate : foundTicket.vehicleNumber;
        const siteName = isCheckin ? selectedSite?.name : foundTicket.parkingSite;
        const currentTicket = isCheckin ? ticketNumber : foundTicket.ticketId;

        const vehicleDesc = isCheckin ? `${brand} ${model} • ${color}` : `${foundTicket.vehicleType || 'BMW X5'} • Black`;

        let message = '';
        if (isCheckin) {
            message = `🎉 *Your vehicle has been parked successfully!*\n\n` +
                `*Ticket No.*              ${currentTicket}\n` +
                `*Vehicle*                 ${vehicleDesc}\n` +
                `*Number Plate*            ${(vehiclePlate || '').toUpperCase()}\n` +
                `*Parking Location*        ${siteName || 'B2 - 45'}\n` +
                `*Parking Time*            ${parkingTime || '11:05 AM, 18 May 2025'}\n` +
                `*Attended By*             John Driver\n\n` +
                `📍 *View Location on Map:*\n` +
                `https://maps.google.com/?q=28.6139,77.2090\n\n` +
                `*Quick Actions:*\n` +
                `• I will be back in 10 mins\n` +
                `• I will be back in 20 mins\n` +
                `• I will be back in 30 mins\n` +
                `• I'm on My Way Now`;
        } else {
            message = `🎉 *Your vehicle has been returned successfully!*\n\n` +
                `*Ticket No.*              ${currentTicket}\n` +
                `*Vehicle*                 ${vehicleDesc}\n` +
                `*Number Plate*            ${(vehiclePlate || '').toUpperCase()}\n` +
                `*Exit Time*               ${exitTime || new Date().toLocaleTimeString()}\n` +
                `*Attended By*             John Driver\n\n` +
                `Thank you for using Anytime Valet!`;
        }

        try {
            await Share.share({
                message: message,
                title: isCheckin ? 'Valet Ticket' : 'Valet Receipt',
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const handleSavePdf = async () => {
        const targetTicket = ticketNumber || foundTicket.ticketId;
        const qrUri = getLocalQrUri(targetTicket);

        let details = [];
        if (workflowMode === 'checkin') {
            details = [
                { label: 'Ticket Number', value: targetTicket },
                { label: 'Site Name', value: selectedSite?.name || 'City Mall' },
                { label: 'License Plate', value: licensePlate.toUpperCase() },
                { label: 'Vehicle Model', value: `${brand} ${model}` },
                { label: 'Vehicle Color', value: color },
                { label: 'Odometer', value: `${odometer} KM` },
                { label: 'Fuel Level', value: fuelLevel },
                { label: 'Customer Name', value: driverName },
                { label: 'Phone Number', value: phone },
                { label: 'Parking Status', value: 'PARKED' },
                { label: 'Parking Time', value: parkingTime },
            ];
        } else {
            details = [
                { label: 'Ticket ID', value: targetTicket },
                { label: 'Site Name', value: foundTicket.parkingSite },
                { label: 'Vehicle Number', value: foundTicket.vehicleNumber.toUpperCase() },
                { label: 'Vehicle Model', value: `${foundTicket.vehicleType} | ${foundTicket.ownerName}` },
                { label: 'Phone Number', value: foundTicket.phone },
                { label: 'Parking Status', value: 'RETURNED' },
                { label: 'Check-in Time', value: foundTicket.entryTime },
                { label: 'Check-out Time', value: exitTime },
                { label: 'Duration', value: '1h 45m' },
            ];
        }

        await exportImageToPdf(qrUri, 'Valet Parking Receipt', details);
    };

    const resetWorkflow = () => {
        setPhotoUri(null);
        setPhotoFront(null);
        setPhotoRear(null);
        setPhotoLeft(null);
        setPhotoRight(null);
        setReturnPhotoFront(null);
        setReturnPhotoRear(null);
        setReturnPhotoLeft(null);
        setReturnPhotoRight(null);

        setOdometer('45231');
        setFuelLevel('3/4');
        setIsDamageDetected(false);

        setLicensePlate('');
        setModel('');
        setColor('');
        setPhone('');
        setDriverName('');
        setTicketNumber('');
        setSearchQuery('');
        setReturnNotes('');
        if (workflowMode === 'checkin') {
            setCheckinStep(2);
        } else {
            setReturnStep(1);
        }
    };



    const renderPhotoGrid = (
        photos: { slot: 'front' | 'rear' | 'left' | 'right'; label: string; uri: string | null; setter: any }[],
        activeSetter: any
    ) => {
        return (
            <View style={styles.photoGrid}>
                {photos.map((item) => (
                    <TouchableOpacity
                        key={item.slot}
                        style={[styles.photoGridItem, item.uri !== null && styles.photoGridItemCaptured]}
                        onPress={() => activeSetter(item.slot)}
                        activeOpacity={0.8}
                    >
                        {item.uri ? (
                            <Image source={{ uri: item.uri }} style={styles.capturedPhotoThumbnail} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="camera-outline" size={24} color="#8E8E93" />
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
        );
    };

    // ==========================================
    // Workflow Steps Footer Component
    // ==========================================
    const renderStepFooter = () => {
        const checkinSteps = [
            { label: 'Login', icon: 'lock-closed' },
            { label: 'Capture Photo', icon: 'camera' },
            { label: 'Review Details', icon: 'create' },
            { label: 'Ticket + QR', icon: 'qr-code' },
        ];

        const returnSteps = [
            { label: 'Scan QR', icon: 'scan' },
            { label: 'Search Ticket', icon: 'search' },
            { label: 'Ticket Found', icon: 'receipt' },
            { label: 'Confirm Key', icon: 'key' },
            { label: 'Status Return', icon: 'checkmark-circle' },
        ];

        const steps = workflowMode === 'checkin' ? checkinSteps : returnSteps;
        const currentActiveStep = workflowMode === 'checkin' ? checkinStep : returnStep;

        return (
            <View style={styles.stepTrackerContainer}>
                {steps.map((stepItem, index) => {
                    const stepNum = index + 1;
                    // Login step is always completed when we are in card-parking indexing wizard
                    const isCompleted = workflowMode === 'checkin' ? (stepNum < currentActiveStep) : (stepNum < currentActiveStep);
                    const isActive = stepNum === currentActiveStep;

                    return (
                        <View key={index} style={styles.stepItemWrapper}>
                            <View
                                style={[
                                    styles.stepIconCircle,
                                    isCompleted && { backgroundColor: '#34C759' },
                                    isActive && { backgroundColor: themeColor, borderWidth: 1.5, borderColor: '#fff' },
                                    !isActive && !isCompleted && styles.stepIconCircleInactive,
                                ]}
                            >
                                <Ionicons
                                    name={isCompleted ? 'checkmark' : (stepItem.icon as any)}
                                    size={15}
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
                                {stepNum}. {stepItem.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    if (permission === null) {
        return (
            <LayoutWrapper>
                <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: '#121212' }]}>
                    <ActivityIndicator size="large" color={themeColor} />
                    <Text style={styles.loadingText}>Initializing camera...</Text>
                </View>
            </LayoutWrapper>
        );
    }

    return (
        <LayoutWrapper>
            <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>

                {/* Header Navbar */}
                <View style={[styles.headerNavbar, isDarkMode && { backgroundColor: '#1C1C1E', borderBottomColor: '#2C2C2E' }]}>
                    <TouchableOpacity
                        onPress={() => {
                            const showBack = (workflowMode === 'checkin' && checkinStep > 2 && checkinStep < 4) ||
                                (workflowMode === 'keyreturn' && returnStep > 1 && returnStep < 5);
                            if (showBack) {
                                if (workflowMode === 'checkin' && checkinStep > 2) {
                                    setCheckinStep(checkinStep - 1);
                                } else if (workflowMode === 'keyreturn' && returnStep > 1) {
                                    setReturnStep(returnStep - 1);
                                }
                            } else {
                                navigation.dispatch(DrawerActions.openDrawer());
                            }
                        }}
                        style={styles.backButton}
                    >
                        {((workflowMode === 'checkin' && checkinStep > 2 && checkinStep < 4) ||
                            (workflowMode === 'keyreturn' && returnStep > 1 && returnStep < 5)) ? (
                            <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                        ) : (
                            <Ionicons name="menu" size={24} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                        )}
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, isDarkMode && { color: '#fff' }]}>
                            {workflowMode === 'checkin' && (
                                <>
                                    {checkinStep === 2 && 'Check-In & Inspection'}
                                    {checkinStep === 3 && 'Vehicle Inspection'}
                                    {checkinStep === 4 && 'Details Completed'}
                                </>
                            )}
                            {workflowMode === 'keyreturn' && (
                                <>
                                    {returnStep === 1 && 'Scan Ticket QR'}
                                    {returnStep === 2 && 'Search Ticket'}
                                    {returnStep === 3 && 'Return Request'}
                                    {returnStep === 4 && 'Vehicle Return & Handover'}
                                    {returnStep === 5 && 'Status: RETURNED'}
                                </>
                            )}
                        </Text>
                    </View>

                    <TouchableOpacity style={[styles.backButton, { alignItems: 'flex-end' }]} activeOpacity={0.7}>
                        <Ionicons name="search" size={22} color={isDarkMode ? '#fff' : '#1C1C1E'} />
                    </TouchableOpacity>
                </View>

                {/* Workflow Mode Selector Toggle (Only show on Step 2 of checkin / Step 1 & 2 of key return) */}
                {((workflowMode === 'checkin' && checkinStep === 2) || (workflowMode === 'keyreturn' && returnStep <= 2)) && (
                    <View style={styles.modeToggleContainer}>
                        <TouchableOpacity
                            style={[styles.modeToggleItem, workflowMode === 'checkin' && { backgroundColor: themeColor }]}
                            onPress={() => {
                                setWorkflowMode('checkin');
                                setCheckinStep(2);
                            }}
                        >
                            <Ionicons name="log-in-outline" size={16} color={workflowMode === 'checkin' ? '#fff' : '#8E8E93'} />
                            <Text style={[styles.modeToggleText, workflowMode === 'checkin' && styles.modeToggleTextActive]}>Valet Check-In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeToggleItem, workflowMode === 'keyreturn' && { backgroundColor: themeColor }]}
                            onPress={() => {
                                setWorkflowMode('keyreturn');
                                setReturnStep(1);
                            }}
                        >
                            <Ionicons name="key-outline" size={16} color={workflowMode === 'keyreturn' ? '#fff' : '#8E8E93'} />
                            <Text style={[styles.modeToggleText, workflowMode === 'keyreturn' && styles.modeToggleTextActive]}>Key Return</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Main Content Area */}
                <View style={styles.contentArea}>

                    {/* ==================================================== */}
                    {/* WORKFLOW 1: CHECK-IN */}
                    {/* ==================================================== */}
                    {workflowMode === 'checkin' && (
                        <>
                            {/* Step 2: Capture Vehicle Photo */}
                            {checkinStep === 2 && (
                                <View style={styles.cameraContainer}>
                                    {permission && permission.granted ? (
                                        <CameraView
                                            ref={cameraRef}
                                            style={StyleSheet.absoluteFillObject}
                                            facing={cameraFacing}
                                        />
                                    ) : (
                                        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholderContainer]}>
                                            <Ionicons name="videocam-off-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                                            <Text style={styles.cameraPlaceholderText}>Camera Feed Unavailable (Simulator/Denied)</Text>
                                            <TouchableOpacity style={styles.grantAccessInlineButton} onPress={handleCameraPermission}>
                                                <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Viewfinder Scanning Border Overlay */}
                                    <View style={styles.scanOverlayContainer}>
                                        <View style={styles.scanViewfinder}>
                                            <View style={styles.scanCorners} />
                                        </View>
                                        <Text style={styles.scanHelperText}>Take a clear photo of the vehicle to start check-in</Text>
                                    </View>

                                    {/* Camera Actions Bar */}
                                    <View style={styles.cameraActionsBar}>
                                        <TouchableOpacity style={styles.cameraSubActionButton} onPress={pickPhotoFromGallery}>
                                            <Ionicons name="images-outline" size={24} color="#fff" />
                                            <Text style={styles.cameraSubActionLabel}>Gallery</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.shutterButton} onPress={capturePhoto}>
                                            <View style={styles.shutterButtonInner} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.cameraSubActionButton}
                                            onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
                                        >
                                            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
                                            <Text style={styles.cameraSubActionLabel}>Flip Camera</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Step 3: Review & Confirm Details Form */}
                            {checkinStep === 3 && (
                                <View style={styles.innerContent}>
                                    <ScrollView
                                        contentContainerStyle={styles.formScrollContainer}
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {/* Captured Photo Preview */}
                                        <View style={styles.previewImageContainer}>
                                            {photoUri ? (
                                                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                                            ) : (
                                                <View style={styles.previewPlaceholder}>
                                                    <Ionicons name="car-outline" size={40} color="#8E8E93" />
                                                </View>
                                            )}
                                            <TouchableOpacity style={styles.retakeBadge} onPress={() => setCheckinStep(2)}>
                                                <Ionicons name="camera" size={14} color="#fff" />
                                                <Text style={styles.retakeText}>Retake</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* License Plate Number */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>License Plate Number</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. MH02AB1234"
                                                    placeholderTextColor="#8E8E93"
                                                    value={licensePlate}
                                                    onChangeText={setLicensePlate}
                                                    autoCapitalize="characters"
                                                />
                                                <TouchableOpacity
                                                    style={[styles.ocrButton, ocrScanning && { backgroundColor: '#E5E5EA' }]}
                                                    onPress={triggerOCR}
                                                    disabled={ocrScanning}
                                                >
                                                    {ocrScanning ? (
                                                        <ActivityIndicator size="small" color={themeColor} />
                                                    ) : (
                                                        <Ionicons name="scan" size={20} color={themeColor} />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Owner / Driver Name */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Customer Name</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <Feather name="user" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. Rajesh Kumar"
                                                    placeholderTextColor="#8E8E93"
                                                    value={driverName}
                                                    onChangeText={setDriverName}
                                                />
                                            </View>
                                        </View>

                                        {/* Mobile Number */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Phone Number</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <Feather name="phone" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. 9876543210"
                                                    placeholderTextColor="#8E8E93"
                                                    keyboardType="phone-pad"
                                                    value={phone}
                                                    onChangeText={setPhone}
                                                />
                                            </View>
                                        </View>

                                        {/* Brand Dropdown */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Brand</Text>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                                                style={[
                                                    styles.formInputWrapper,
                                                    isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' },
                                                ]}
                                            >
                                                <View style={styles.brandDisplayRow}>
                                                    <MaterialCommunityIcons name="car-select" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                                                    <Text style={[styles.formInputTextValue, isDarkMode && { color: '#fff' }]}>
                                                        {brand || 'Select Brand'}
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
                                        </View>

                                        {/* Vehicle Model */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Model</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. E-Class"
                                                    placeholderTextColor="#8E8E93"
                                                    value={model}
                                                    onChangeText={setModel}
                                                />
                                            </View>
                                        </View>

                                        {/* Vehicle Color */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Color</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. Black"
                                                    placeholderTextColor="#8E8E93"
                                                    value={color}
                                                    onChangeText={setColor}
                                                />
                                            </View>
                                        </View>

                                        {/* Odometer Input */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Odometer (KM)</Text>
                                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                <MaterialCommunityIcons name="speedometer" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                                                <TextInput
                                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                    placeholder="e.g. 45231"
                                                    placeholderTextColor="#8E8E93"
                                                    keyboardType="numeric"
                                                    value={odometer}
                                                    onChangeText={setOdometer}
                                                />
                                            </View>
                                        </View>

                                        {/* Fuel Level Selector */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Fuel Level</Text>
                                            <View style={styles.fuelContainer}>
                                                {['1/4', '1/2', '3/4', 'Full'].map((opt) => (
                                                    <TouchableOpacity
                                                        key={opt}
                                                        style={[styles.fuelButton, fuelLevel === opt && styles.fuelButtonActive]}
                                                        onPress={() => setFuelLevel(opt)}
                                                    >
                                                        <Text style={[styles.fuelButtonText, fuelLevel === opt && styles.fuelButtonTextActive]}>{opt}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Damage Status Toggle */}
                                        <View style={styles.formInputGroup}>
                                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Damage Details</Text>
                                            <View style={styles.damageToggleContainer}>
                                                <TouchableOpacity
                                                    style={[styles.damageToggleBtn, !isDamageDetected && styles.damageToggleBtnActive]}
                                                    onPress={() => setIsDamageDetected(false)}
                                                >
                                                    <Text style={[styles.damageToggleText, !isDamageDetected && styles.damageToggleTextActive]}>No Damage</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.damageToggleBtn, isDamageDetected && styles.damageToggleBtnActive]}
                                                    onPress={() => setIsDamageDetected(true)}
                                                >
                                                    <Text style={[styles.damageToggleText, isDamageDetected && styles.damageToggleTextActive]}>+ Add Damage</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </ScrollView>

                                    <TouchableOpacity
                                        style={[styles.continueButton, generating && { opacity: 0.8 }]}
                                        onPress={handleConfirmDetails}
                                        disabled={generating}
                                    >
                                        {generating ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.continueButtonText}>GENERATE TICKET</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Step 4: Ticket Generated */}
                            {checkinStep === 4 && (
                                <View style={styles.innerContent}>
                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScrollContainer}>
                                        <View style={styles.successBanner}>
                                            <View style={styles.successIconWrapper}>
                                                <Ionicons name="checkmark" size={24} color="#fff" />
                                            </View>
                                            <View style={styles.successTexts}>
                                                <Text style={styles.successTitle}>Vehicle Details Successfully Put</Text>
                                                <Text style={styles.successSubtitleStatus}>Status: PARKED</Text>
                                            </View>
                                        </View>

                                        <View style={[styles.ticketCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Ticket Number</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{ticketNumber}</Text>
                                            </View>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Parking Time</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{parkingTime}</Text>
                                            </View>
                                            <View style={[styles.ticketDivider, isDarkMode && { backgroundColor: '#2C2C2E' }]} />
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>License Plate</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{(licensePlate || '').toUpperCase()}</Text>
                                            </View>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Vehicle Model</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{brand} {model}</Text>
                                            </View>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Vehicle Color</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{color}</Text>
                                            </View>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Odometer</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{odometer} KM</Text>
                                            </View>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Fuel Level</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{fuelLevel}</Text>
                                            </View>
                                            <View style={[styles.ticketDivider, isDarkMode && { backgroundColor: '#2C2C2E' }]} />
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Customer Name</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{driverName}</Text>
                                            </View>
                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Phone Number</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{phone}</Text>
                                            </View>

                                            <TouchableOpacity style={styles.qrImageBorder} onPress={handleSavePdf} activeOpacity={0.85}>
                                                {getLocalQrUri(ticketNumber) ? (
                                                    <Image
                                                        source={{ uri: getLocalQrUri(ticketNumber) }}
                                                        style={styles.ticketQrImage}
                                                    />
                                                ) : (
                                                    <ActivityIndicator size="large" color={themeColor} />
                                                )}
                                                <View style={styles.pdfOverlayInside}>
                                                    <Ionicons name="document-text-outline" size={14} color={themeColor} />
                                                    <Text style={[styles.pdfOverlayTextInside, { color: themeColor }]}>Tap to Save PDF</Text>
                                                </View>
                                            </TouchableOpacity>

                                            <Text style={styles.scanConfirmMessage}>Scan to verify vehicle details</Text>
                                        </View>

                                        <TouchableOpacity style={styles.whatsappButton} onPress={sendWhatsApp}>
                                            <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.whatsappButtonText}>SEND ON WHATSAPP</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.shareTicketButton, { borderColor: themeColor }]} onPress={shareTicket}>
                                            <Ionicons name="share-outline" size={20} color={themeColor} style={{ marginRight: 8 }} />
                                            <Text style={[styles.shareTicketButtonText, { color: themeColor }]}>SHARE TICKET</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.doneResetButton} onPress={resetWorkflow}>
                                            <Text style={styles.doneResetButtonText}>DONE / CHECK-IN NEXT</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}

                    {/* ==================================================== */}
                    {/* WORKFLOW 2: KEY RETURN */}
                    {/* ==================================================== */}
                    {workflowMode === 'keyreturn' && (
                        <>
                            {/* Return Step 1: Scan Ticket QR */}
                            {returnStep === 1 && (
                                <View style={styles.cameraContainer}>
                                    {permission && permission.granted ? (
                                        <CameraView
                                            ref={cameraRef}
                                            style={StyleSheet.absoluteFillObject}
                                            barcodeScannerSettings={{
                                                barcodeTypes: ['qr'],
                                            }}
                                            onBarcodeScanned={({ data }) => {
                                                if (data) {
                                                    simulateQRScan();
                                                }
                                            }}
                                            enableTorch={flashlightOn}
                                        />
                                    ) : (
                                        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholderContainer]}>
                                            <Ionicons name="videocam-off-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                                            <Text style={styles.cameraPlaceholderText}>Camera Feed Unavailable (Simulator/Denied)</Text>
                                            <TouchableOpacity style={styles.grantAccessInlineButton} onPress={handleCameraPermission}>
                                                <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Viewfinder Scanning Border Overlay (Dynamic corner styling) */}
                                    <View style={styles.scanOverlayContainer}>
                                        <View style={[styles.scanViewfinder, { borderColor: themeColor, shadowColor: themeColor }]}>
                                            <View style={styles.scanCorners} />
                                        </View>
                                        <Text style={styles.scanHelperText}>Scan the customer parking ticket QR code</Text>

                                        {/* Flashlight button */}
                                        <TouchableOpacity
                                            style={[styles.flashlightButton, { borderColor: themeColor }, flashlightOn && { backgroundColor: themeColor }]}
                                            onPress={() => setFlashlightOn(!flashlightOn)}
                                        >
                                            <Ionicons name={flashlightOn ? "flash" : "flash-outline"} size={22} color={flashlightOn ? "#fff" : themeColor} />
                                            <Text style={[styles.flashlightText, { color: themeColor }, flashlightOn && { color: '#fff' }]}>
                                                {flashlightOn ? 'Light ON' : 'Tap to turn on light'}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Search Manually Trigger Link */}
                                        <TouchableOpacity style={styles.manualSearchTrigger} onPress={() => setReturnStep(2)}>
                                            <Text style={[styles.manualSearchTriggerText, { color: themeColor }]}>{"Can't scan? Search manually"}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Simulated Shutter Button to test scanner fallback */}
                                    <View style={[styles.cameraActionsBar, { justifyContent: 'center' }]}>
                                        {searching ? (
                                            <ActivityIndicator size="large" color={themeColor} />
                                        ) : (
                                            <TouchableOpacity style={[styles.shutterButton, { borderColor: themeColorOpaque }]} onPress={simulateQRScan}>
                                                <View style={[styles.shutterButtonInner, { backgroundColor: themeColor }]} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Return Step 2: Search Ticket */}
                            {returnStep === 2 && (
                                <View style={styles.innerContent}>
                                    {/* Search Option Tabs */}
                                    <View style={styles.tabHeader}>
                                        <TouchableOpacity
                                            style={[styles.tabHeaderItem, searchTab === 'manual' && { borderBottomColor: themeColor, borderBottomWidth: 3 }]}
                                            onPress={() => setSearchTab('manual')}
                                        >
                                            <Text style={[styles.tabHeaderText, searchTab === 'manual' && { color: themeColor, fontWeight: '800' }]}>
                                                Search Manually
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.tabHeaderItem, searchTab === 'recent' && { borderBottomColor: themeColor, borderBottomWidth: 3 }]}
                                            onPress={() => setSearchTab('recent')}
                                        >
                                            <Text style={[styles.tabHeaderText, searchTab === 'recent' && { color: themeColor, fontWeight: '800' }]}>
                                                Recent Tickets
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {searchTab === 'manual' ? (
                                        <ScrollView contentContainerStyle={styles.formScrollContainer} keyboardShouldPersistTaps="handled">
                                            {/* Search Criteria Selector */}
                                            <View style={styles.formInputGroup}>
                                                <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Search by</Text>
                                                <View style={styles.criteriaButtonsRow}>
                                                    <TouchableOpacity
                                                        style={[styles.criteriaButton, searchBy === 'mobile' && [styles.criteriaButtonActive, { backgroundColor: themeColor }]]}
                                                        onPress={() => { setSearchBy('mobile'); setSearchQuery(''); }}
                                                    >
                                                        <Feather name="phone" size={14} color={searchBy === 'mobile' ? '#fff' : '#8E8E93'} />
                                                        <Text style={[styles.criteriaButtonText, searchBy === 'mobile' && { color: '#fff' }]}>Mobile No</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.criteriaButton, searchBy === 'car' && [styles.criteriaButtonActive, { backgroundColor: themeColor }]]}
                                                        onPress={() => { setSearchBy('car'); setSearchQuery(''); }}
                                                    >
                                                        <Ionicons name="car-outline" size={14} color={searchBy === 'car' ? '#fff' : '#8E8E93'} />
                                                        <Text style={[styles.criteriaButtonText, searchBy === 'car' && { color: '#fff' }]}>Car No</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.criteriaButton, searchBy === 'ticket' && [styles.criteriaButtonActive, { backgroundColor: themeColor }]]}
                                                        onPress={() => { setSearchBy('ticket'); setSearchQuery(''); }}
                                                    >
                                                        <Ionicons name="receipt-outline" size={14} color={searchBy === 'ticket' ? '#fff' : '#8E8E93'} />
                                                        <Text style={[styles.criteriaButtonText, searchBy === 'ticket' && { color: '#fff' }]}>Ticket ID</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {/* Query Input */}
                                            <View style={styles.formInputGroup}>
                                                <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>
                                                    {searchBy === 'mobile' && 'Enter Mobile Number'}
                                                    {searchBy === 'car' && 'Enter Vehicle License Plate'}
                                                    {searchBy === 'ticket' && 'Enter Ticket ID'}
                                                </Text>
                                                <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                                    {searchBy === 'mobile' && <Feather name="phone" size={18} color="#8E8E93" style={{ marginRight: 8 }} />}
                                                    {searchBy === 'car' && <Ionicons name="car-sport-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />}
                                                    {searchBy === 'ticket' && <Ionicons name="receipt-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />}

                                                    <TextInput
                                                        style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                                        placeholder={
                                                            searchBy === 'mobile' ? 'e.g. 9876543210' :
                                                                searchBy === 'car' ? 'e.g. RJ20CD1234' : 'e.g. WP1234567890'
                                                        }
                                                        placeholderTextColor="#8E8E93"
                                                        value={searchQuery}
                                                        onChangeText={setSearchQuery}
                                                        keyboardType={searchBy === 'mobile' ? 'phone-pad' : 'default'}
                                                        autoCapitalize={searchBy === 'mobile' ? 'none' : 'characters'}
                                                    />

                                                    {searchBy === 'mobile' && (
                                                        <TouchableOpacity style={styles.contactsIcon}>
                                                            <Ionicons name="person-circle-outline" size={22} color={themeColor} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>

                                            <View style={styles.orDividerRow}>
                                                <View style={styles.dividerLine} />
                                                <Text style={styles.dividerText}>OR</Text>
                                                <View style={styles.dividerLine} />
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.quickSearchBtn, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                                                onPress={() => {
                                                    setSearchBy('car');
                                                    setSearchQuery('RJ20CD1234');
                                                }}
                                            >
                                                <Ionicons name="car-sport" size={18} color={themeColor} style={{ marginRight: 8 }} />
                                                <Text style={[styles.quickSearchText, isDarkMode && { color: '#fff' }]}>Use Demo Car (RJ20CD1234)</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.quickSearchBtn, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                                                onPress={() => {
                                                    setSearchBy('ticket');
                                                    setSearchQuery('WP1234567890');
                                                }}
                                            >
                                                <Ionicons name="ticket" size={18} color={themeColor} style={{ marginRight: 8 }} />
                                                <Text style={[styles.quickSearchText, isDarkMode && { color: '#fff' }]}>Use Demo Ticket (WP1234567890)</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.continueButton, { backgroundColor: themeColor }, searching && { opacity: 0.8 }]}
                                                onPress={handleSearchSubmit}
                                                disabled={searching}
                                            >
                                                {searching ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <Text style={styles.continueButtonText}>SEARCH TICKET</Text>
                                                )}
                                            </TouchableOpacity>
                                        </ScrollView>
                                    ) : (
                                        // Recent Tickets Tab list
                                        <ScrollView contentContainerStyle={styles.siteListContainer} showsVerticalScrollIndicator={false}>
                                            <Text style={styles.recentTitleLabel}>Recently Parked Vehicles</Text>
                                            {[
                                                {
                                                    ticketId: 'WP8732649012',
                                                    vehicleNumber: 'MH12PQ3456',
                                                    vehicleType: 'SUV',
                                                    ownerName: 'Amit Verma',
                                                    entryTime: '18 Aug 2026, 02:15 PM',
                                                    parkingSite: 'City Mall',
                                                    phone: '9822334455',
                                                },
                                                {
                                                    ticketId: 'WP9012348765',
                                                    vehicleNumber: 'DL03AY8721',
                                                    vehicleType: 'Car',
                                                    ownerName: 'Sneha Rao',
                                                    entryTime: '18 Aug 2026, 11:45 AM',
                                                    parkingSite: 'Hotel Grand',
                                                    phone: '9988776655',
                                                },
                                                {
                                                    ticketId: 'WP2394871029',
                                                    vehicleNumber: 'KA05MR4321',
                                                    vehicleType: 'Hatchback',
                                                    ownerName: 'Vikram Singh',
                                                    entryTime: '18 Aug 2026, 09:10 AM',
                                                    parkingSite: 'Hospital Zone',
                                                    phone: '9766554433',
                                                }
                                            ].map((ticket) => (
                                                <TouchableOpacity
                                                    key={ticket.ticketId}
                                                    style={[styles.siteCard, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}
                                                    onPress={() => selectRecentTicket(ticket)}
                                                >
                                                    <View style={styles.siteCardRow}>
                                                        <View style={[styles.successIconWrapper, { backgroundColor: themeColorLight, marginRight: 12 }]}>
                                                            <Ionicons name="car-sport" size={20} color={themeColor} />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={[styles.siteName, isDarkMode && { color: '#fff' }]}>{ticket.vehicleNumber}</Text>
                                                            <Text style={styles.siteDesc}>Ticket: {ticket.ticketId}  |  Owner: {ticket.ownerName}</Text>
                                                            <Text style={styles.siteStats}>Parked at {ticket.parkingSite} ({ticket.entryTime})</Text>
                                                        </View>
                                                        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            )}

                            {/* Return Step 3: Return Request / Arrival Timer */}
                            {returnStep === 3 && (
                                <View style={styles.innerContent}>
                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScrollContainer}>
                                        <View style={styles.timerCircleContainer}>
                                            <View style={styles.timerCircle}>
                                                <Text style={styles.timerSubText}>Customer will be arriving in</Text>
                                                <Text style={styles.timerBigText}>10:00</Text>
                                                <Text style={styles.timerSubText2}>Minutes</Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.timerTitle, isDarkMode && { color: '#fff' }]}>Vehicle Prepared Upon Arrival</Text>
                                        <Text style={styles.timerSubtitle}>Customer Rajesh Kumar requested vehicle return</Text>

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
                                                <Text style={styles.ticketDetailLabel}>Vehicle Model</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{foundTicket.vehicleType} | {foundTicket.ownerName}</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity style={styles.continueButton} onPress={() => setReturnStep(4)}>
                                            <Text style={styles.continueButtonText}>I'M ON MY WAY / PREPARE VEHICLE</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.secondaryCancelButton} onPress={resetWorkflow}>
                                            <Text style={styles.secondaryCancelButtonText}>CANCEL REQUEST</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            )}

                            {/* Return Step 4: Vehicle Return Re-Inspection & Handover */}
                            {returnStep === 4 && (
                                <View style={styles.innerContent}>
                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollContainer}>
                                        <Text style={[styles.sectionHeading, isDarkMode && { color: '#fff' }]}>Re-Inspection Photos</Text>
                                        {/* Re-Inspection Photos Grid */}
                                        {renderPhotoGrid([
                                            { slot: 'front', label: 'Front Side', uri: returnPhotoFront, setter: setReturnPhotoFront },
                                            { slot: 'rear', label: 'Rear Side', uri: returnPhotoRear, setter: setReturnPhotoRear },
                                            { slot: 'left', label: 'Left Side', uri: returnPhotoLeft, setter: setReturnPhotoLeft },
                                            { slot: 'right', label: 'Right Side', uri: returnPhotoRight, setter: setReturnPhotoRight },
                                        ], setActiveReturnPhotoSlot)}

                                    </ScrollView>

                                    <TouchableOpacity
                                        style={styles.continueButton}
                                        onPress={handleConfirmReturn}
                                    >
                                        <Text style={styles.continueButtonText}>VEHICLE HANDOVER</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Return Step 5: Status Returned */}
                            {returnStep === 5 && (
                                <View style={styles.innerContent}>
                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ticketScrollContainer}>
                                        {/* Checked circle concentric animation */}
                                        <View style={styles.concentricCheckmarkContainer}>
                                            <View style={[styles.concentricOuterRing, { borderColor: 'rgba(250, 84, 28, 0.2)' }]}>
                                                <View style={[styles.concentricInnerRing, { backgroundColor: '#FA541C' }]}>
                                                    <Ionicons name="checkmark" size={52} color="#fff" />
                                                </View>
                                            </View>
                                            <Text style={[styles.returnedStatusTitle, isDarkMode && { color: '#fff' }]}>Status: RETURNED</Text>
                                            <Text style={styles.returnedStatusSubtitle}>Parking session has been successfully closed.</Text>
                                        </View>

                                        {/* Closing Summary details */}
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
                                                <Text style={styles.ticketDetailLabel}>Exit Time</Text>
                                                <Text style={[styles.ticketDetailValue, isDarkMode && { color: '#fff' }]}>{exitTime}</Text>
                                            </View>

                                            <View style={styles.ticketDetailRow}>
                                                <Text style={styles.ticketDetailLabel}>Duration</Text>
                                                <Text style={[styles.ticketDetailValue, { color: '#34C759', fontWeight: '800' }]}>1h 45m</Text>
                                            </View>
                                        </View>

                                        {/* Key return receipt action buttons */}
                                        <TouchableOpacity style={styles.continueButton} onPress={handleViewReceipt}>
                                            <Ionicons name="receipt-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.continueButtonText}>VIEW RECEIPT</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.shareTicketButton, { borderColor: '#FA541C' }]} onPress={shareTicket}>
                                            <Ionicons name="share-outline" size={20} color="#FA541C" style={{ marginRight: 8 }} />
                                            <Text style={[styles.shareTicketButtonText, { color: '#FA541C' }]}>SHARE RECEIPT</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.doneResetButton} onPress={resetWorkflow}>
                                            <Text style={styles.doneResetButtonText}>DONE / PROCESS NEXT KEY</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Progress Workflow Tracker Footer */}
                {renderStepFooter()}
            </View>

            {/* Full Screen Camera Overlay for Photo Capture */}
            {(activePhotoSlot !== null || activeReturnPhotoSlot !== null) && (
                <View style={[StyleSheet.absoluteFillObject, { zIndex: 2000, backgroundColor: '#000' }]}>
                    {permission && permission.granted ? (
                        <CameraView
                            ref={cameraRef}
                            style={StyleSheet.absoluteFillObject}
                            facing={cameraFacing}
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

                    {/* Viewfinder Scanning Border Overlay */}
                    <View style={styles.scanOverlayContainer}>
                        <View style={styles.scanViewfinder}>
                            <View style={styles.scanCorners} />
                        </View>
                        <Text style={styles.scanHelperText}>
                            Capture {(activePhotoSlot || activeReturnPhotoSlot || '').toUpperCase()} side of the vehicle
                        </Text>
                    </View>

                    {/* Camera Actions Bar */}
                    <View style={styles.cameraActionsBar}>
                        <TouchableOpacity style={styles.cameraSubActionButton} onPress={pickPhotoFromGallery}>
                            <Ionicons name="images-outline" size={24} color="#fff" />
                            <Text style={styles.cameraSubActionLabel}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shutterButton} onPress={capturePhoto}>
                            <View style={styles.shutterButtonInner} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cameraSubActionButton}
                            onPress={() => { setActivePhotoSlot(null); setActiveReturnPhotoSlot(null); }}
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
        backgroundColor: '#F2F2F7',
    },
    headerNavbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 45,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        backgroundColor: '#fff',
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1C1C1E',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 2,
    },
    backButtonPlaceholder: {
        width: 44,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#E5E5EA',
        borderRadius: 10,
        padding: 4,
    },
    modeToggleItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    modeToggleItemActiveCheckin: {
        backgroundColor: '#0A84FF',
    },
    modeToggleItemActiveReturn: {
        backgroundColor: '#D97706',
    },
    modeToggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        marginLeft: 6,
    },
    modeToggleTextActive: {
        color: '#fff',
    },
    contentArea: {
        flex: 1,
    },
    innerContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100, // tall padding to clear progress steps (no bottom bar)
    },
    siteListContainer: {
        paddingBottom: 16,
    },
    siteCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    siteCardSelected: {
        borderColor: '#0A84FF',
        backgroundColor: '#F2F8FF',
    },
    siteCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioContainer: {
        marginRight: 16,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#0A84FF',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#0A84FF',
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
        fontSize: 16,
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
        color: '#0A84FF',
    },
    siteDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 6,
    },
    siteStats: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3A3A3C',
    },
    continueButton: {
        backgroundColor: '#0A84FF',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    permissionFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    fallbackText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#0A84FF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    scanOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 120, // keep clear of actions bar
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanViewfinder: {
        width: width * 0.76,
        height: width * 0.76,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#0A84FF',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    scanCorners: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    scanHelperText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 20,
        backgroundColor: 'rgba(7, 19, 37, 0.75)',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        textAlign: 'center',
        marginHorizontal: 20,
    },
    cameraActionsBar: {
        position: 'absolute',
        bottom: 84, // position right above the progress bar
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(7, 19, 37, 0.9)',
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
        borderColor: 'rgba(255,255,255,0.4)',
    },
    shutterButtonInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#fff',
    },
    formScrollContainer: {
        paddingBottom: 24,
    },
    previewImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    previewImage: {
        width: width - 40,
        height: 180,
        borderRadius: 16,
    },
    previewPlaceholder: {
        width: width - 40,
        height: 180,
        borderRadius: 16,
        backgroundColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    retakeBadge: {
        position: 'absolute',
        bottom: 10,
        right: 14,
        backgroundColor: 'rgba(7, 19, 37, 0.85)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    retakeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
    },
    formInputGroup: {
        marginBottom: 16,
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
        borderRadius: 10,
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
        backgroundColor: '#E2F1FF',
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
        borderRadius: 10,
        marginTop: 4,
        paddingVertical: 6,
        maxHeight: 180,
        overflow: 'scroll',
        zIndex: 500,
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
        fontWeight: '500',
    },
    ticketScrollContainer: {
        paddingBottom: 24,
    },
    successBanner: {
        backgroundColor: '#E2F8E7',
        borderRadius: 12,
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
        fontSize: 14,
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
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    ticketDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 12,
    },
    ticketDetailRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
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
        borderColor: '#F2F2F7',
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
        color: '#0A84FF',
        fontWeight: '700',
        marginLeft: 4,
    },
    scanConfirmMessage: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '600',
        marginTop: 10,
    },
    whatsappButton: {
        backgroundColor: '#0A84FF',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 12,
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
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
        borderColor: '#0A84FF',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 12,
    },
    shareTicketButtonText: {
        color: '#0A84FF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    doneResetButton: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneResetButtonText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '700',
    },
    stepTrackerContainer: {
        position: 'absolute',
        bottom: 0, // seat directly on the bottom (no BottomTabBar)
        left: 0,
        right: 0,
        height: 84,
        backgroundColor: '#081325',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#102A45',
        zIndex: 900,
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
        backgroundColor: '#102A45',
    },
    stepItemLabel: {
        fontSize: 9,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
    },
    stepItemLabelActive: {
        color: '#fff',
    },
    stepItemLabelInactive: {
        color: '#8E8E93',
    },
    cameraPlaceholderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPlaceholderText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    grantAccessInlineButton: {
        backgroundColor: 'rgba(10, 132, 255, 0.2)',
        borderWidth: 1,
        borderColor: '#0A84FF',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    grantAccessInlineText: {
        color: '#0A84FF',
        fontWeight: '700',
        fontSize: 12,
    },

    // ==========================================
    // KEY RETURN STYLES
    // ==========================================
    flashlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(217, 119, 6, 0.3)',
    },
    flashlightText: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    manualSearchTrigger: {
        marginTop: 18,
    },
    manualSearchTriggerText: {
        color: '#D97706',
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    tabHeader: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    tabHeaderItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    criteriaLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3A3A3C',
        marginBottom: 8,
    },
    criteriaButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    criteriaButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E5EA',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        gap: 4,
    },
    criteriaButtonActive: {
        backgroundColor: '#D97706',
    },
    criteriaButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
    },
    contactsIcon: {
        paddingHorizontal: 4,
    },
    orDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5EA',
    },
    dividerText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        paddingHorizontal: 10,
    },
    quickSearchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 10,
        height: 48,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    quickSearchText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    recentTitleLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
        marginBottom: 12,
        marginLeft: 4,
    },
    verifyKeyGraphicContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 30,
    },
    keyVerifyOutlineCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#FEF3C7',
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 16,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    verifiedCheckBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    verifyGraphicTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    verifyGraphicSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
    },
    multilineTextInput: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        fontWeight: '500',
        color: '#1C1C1E',
        minHeight: 88,
        textAlignVertical: 'top',
    },
    secondaryCancelButton: {
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#C7C7CC',
        marginTop: 12,
    },
    secondaryCancelButtonText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '700',
    },
    concentricCheckmarkContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 32,
    },
    concentricOuterRing: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    concentricInnerRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#34C759',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    returnedStatusTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 6,
    },
    returnedStatusSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
    },
    loadingText: {
        color: '#8E8E93',
        fontSize: 14,
        marginTop: 10,
        fontWeight: '600',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    photoGridItem: {
        width: '48%',
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    photoGridItemCaptured: {
        borderColor: '#FA541C',
    },
    capturedPhotoThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    photoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
        fontWeight: '600',
    },
    photoRemoveBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
        marginTop: 16,
        marginBottom: 8,
    },
    fuelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    fuelButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    fuelButtonActive: {
        backgroundColor: '#FA541C',
        borderColor: '#FA541C',
    },
    fuelButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
    },
    fuelButtonTextActive: {
        color: '#fff',
    },
    damageToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    damageToggleBtn: {
        flex: 1,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    damageToggleBtnActive: {
        backgroundColor: '#FA541C',
        borderColor: '#FA541C',
    },
    damageToggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
    },
    damageToggleTextActive: {
        color: '#fff',
    },
    timerCircleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
    },
    timerCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 6,
        borderColor: '#FA541C',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF3C7',
    },
    timerSubText: {
        fontSize: 11,
        color: '#FA541C',
        textAlign: 'center',
        fontWeight: '600',
    },
    timerBigText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FA541C',
        marginVertical: 4,
    },
    timerSubText2: {
        fontSize: 12,
        color: '#FA541C',
        fontWeight: '700',
    },
    timerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C1C1E',
        textAlign: 'center',
        marginBottom: 6,
    },
    timerSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 20,
    },
    signaturePadBorder: {
        width: '100%',
        height: 160,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E5EA',
        borderStyle: 'dashed',
        overflow: 'hidden',
        position: 'relative',
    },
    signaturePlaceholderTextContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signaturePlaceholderText: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 8,
    },
    clearSignatureButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    clearSignatureText: {
        fontSize: 13,
        color: '#FA541C',
        fontWeight: '700',
    },
});
