import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useThemeStore from '@/src/features/theme/theme.service';
import { useVehiclePhotosStore, PhotoSlot } from '@/src/features/cardParking/vehiclePhotos.store';

const { width } = Dimensions.get('window');

export interface VehicleAnglePhotosUploadProps {
    themeColor?: string;
    title?: string;
    subtitle?: string;
}

export default function VehicleAnglePhotosUpload({
    themeColor = '#0066FF',
    title = '4-Angle Vehicle Photos',
    subtitle = 'Tap any slot to take a photo with camera or upload from phone gallery',
}: VehicleAnglePhotosUploadProps = {}) {
    const isDarkMode = useThemeStore().isDarkMode;
    const themeColorLight = isDarkMode ? '#1E2A3A' : '#EAF2FF';

    // Store state (Independent - no props required)
    const { photoFront, photoRear, photoLeft, photoRight, setPhoto, countCaptured } = useVehiclePhotosStore();

    // Local modal / camera controls
    const [activeSlot, setActiveSlot] = useState<PhotoSlot | null>(null);
    const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
    const [torchOn, setTorchOn] = useState(false);

    // Camera Permissions
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    const pickPhotoFromGalleryForSlot = async (slot: PhotoSlot) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Gallery access is needed to upload vehicle photos from phone.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhoto(slot, result.assets[0].uri);
            }
        } catch (err) {
            console.error('Error picking photo from gallery:', err);
        }
    };

    const openCameraForSlot = async (slot: PhotoSlot) => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                Alert.alert(
                    'Camera Permission Needed',
                    'Please enable camera permissions to take photos, or upload directly from phone gallery.',
                    [
                        { text: 'Upload from Gallery', onPress: () => pickPhotoFromGalleryForSlot(slot) },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
                return;
            }
        }
        setActiveSlot(slot);
    };

    const handlePhotoSlotPress = (slot: PhotoSlot, currentUri: string | null) => {
        const slotTitles: Record<PhotoSlot, string> = {
            front: 'Front Angle',
            rear: 'Rear Angle',
            left: 'Left Side',
            right: 'Right Side',
        };
        const slotName = slotTitles[slot] || 'Vehicle';

        if (currentUri) {
            Alert.alert(
                `${slotName} Photo`,
                'Choose an option:',
                [
                    {
                        text: 'Take New Photo',
                        onPress: () => openCameraForSlot(slot),
                    },
                    {
                        text: 'Choose from Gallery',
                        onPress: () => pickPhotoFromGalleryForSlot(slot),
                    },
                    {
                        text: 'Remove Photo',
                        style: 'destructive',
                        onPress: () => setPhoto(slot, null),
                    },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        } else {
            Alert.alert(
                `Upload ${slotName} Photo`,
                'Take a photo with camera or upload from phone gallery:',
                [
                    {
                        text: 'Take Photo',
                        onPress: () => openCameraForSlot(slot),
                    },
                    {
                        text: 'Upload from Gallery',
                        onPress: () => pickPhotoFromGalleryForSlot(slot),
                    },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        }
    };

    const capturePhoto = async () => {
        if (cameraRef.current && activeSlot) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
                if (photo && photo.uri) {
                    setPhoto(activeSlot, photo.uri);
                    setActiveSlot(null);
                } else {
                    throw new Error('No photo URI returned');
                }
            } catch (err) {
                console.warn('Native photo capture error:', err);
                Alert.alert('Capture Notice', 'Could not capture photo. Please check camera permission or upload from gallery.');
            }
        } else {
            Alert.alert('Camera Unavailable', 'Please enable camera access or choose photo from gallery.');
        }
    };

    const pickPhotoFromModalGallery = async () => {
        if (!activeSlot) return;
        await pickPhotoFromGalleryForSlot(activeSlot);
        setActiveSlot(null);
    };

    const slots: { slot: PhotoSlot; label: string; uri: string | null }[] = [
        { slot: 'front', label: 'Front Angle', uri: photoFront },
        { slot: 'rear', label: 'Rear Angle', uri: photoRear },
        { slot: 'left', label: 'Left Side', uri: photoLeft },
        { slot: 'right', label: 'Right Side', uri: photoRight },
    ];

    return (
        <View style={styles.inspectionSection}>
            <View style={styles.inspectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="camera" size={16} color={themeColor} style={{ marginRight: 6 }} />
                    <Text style={[styles.inspectionTitle, isDarkMode && { color: '#fff' }]}>
                        {title}
                    </Text>
                </View>
                <Text style={[styles.inspectionCounter, { color: themeColor }]}>
                    {countCaptured()}/4 Captured
                </Text>
            </View>

            {subtitle ? (
                <Text style={[styles.inspectionSubtitle, isDarkMode && { color: '#8E8E93' }]}>
                    {subtitle}
                </Text>
            ) : null}

            {/* 4 Photo Angle Cards */}
            <View style={styles.photoGrid}>
                {slots.map((item) => (
                    <TouchableOpacity
                        key={item.slot}
                        style={[
                            styles.photoGridItem,
                            item.uri !== null && { borderColor: '#34C759' },
                            isDarkMode && { backgroundColor: '#1C1C1E', borderColor: item.uri ? '#34C759' : '#2C2C2E' },
                        ]}
                        onPress={() => handlePhotoSlotPress(item.slot, item.uri)}
                        activeOpacity={0.8}
                    >
                        {item.uri ? (
                            <>
                                <Image source={{ uri: item.uri }} style={styles.capturedPhotoThumbnail} />
                                <View style={styles.photoSuccessCheck}>
                                    <Ionicons name="checkmark-circle" size={15} color="#34C759" />
                                </View>
                                <TouchableOpacity
                                    style={styles.photoRemoveBadge}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setPhoto(item.slot, null);
                                    }}
                                >
                                    <Ionicons name="close" size={12} color="#fff" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <View style={[styles.photoIconCircle, { backgroundColor: themeColorLight }]}>
                                    <Ionicons name="camera-outline" size={18} color={themeColor} />
                                </View>
                                <Text style={[styles.photoPlaceholderLabel, isDarkMode && { color: '#8E8E93' }]}>
                                    {item.label}
                                </Text>
                                <Text style={[styles.photoUploadHint, { color: themeColor }]}>+ Upload</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Full-Screen Camera Modal for Active Angle Capture */}
            {activeSlot !== null && (
                <View style={[StyleSheet.absoluteFillObject, styles.cameraModalContainer]}>
                    {permission && permission.granted ? (
                        <CameraView
                            ref={cameraRef}
                            style={StyleSheet.absoluteFillObject}
                            facing={cameraFacing}
                            enableTorch={torchOn}
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholderContainer]}>
                            <Ionicons name="videocam-off-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                            <Text style={styles.cameraPlaceholderText}>Camera Feed Unavailable</Text>
                            <TouchableOpacity style={styles.grantAccessInlineButton} onPress={() => openCameraForSlot(activeSlot)}>
                                <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Camera Modal Top Bar: Torch, Flip, Close */}
                    <View style={styles.cameraModalTopBar}>
                        <TouchableOpacity
                            style={styles.camSmallCtrlBtn}
                            onPress={() => setTorchOn(!torchOn)}
                        >
                            <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.camSmallCtrlBtn}
                            onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
                        >
                            <Ionicons name="camera-reverse" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.camSmallCtrlBtn}
                            onPress={() => setActiveSlot(null)}
                        >
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Viewfinder Overlay */}
                    <View style={styles.scanOverlayContainer}>
                        <View style={styles.scanViewfinder}>
                            <View style={styles.scanCorners} />
                        </View>
                        <Text style={styles.scanHelperText}>
                            Capture {activeSlot.toUpperCase()} angle of vehicle
                        </Text>
                    </View>

                    {/* Camera Actions Bar */}
                    <View style={styles.cameraActionsBar}>
                        <TouchableOpacity style={styles.cameraSubActionButton} onPress={pickPhotoFromModalGallery}>
                            <Ionicons name="images-outline" size={24} color="#fff" />
                            <Text style={styles.cameraSubActionLabel}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shutterButton} onPress={capturePhoto}>
                            <View style={[styles.shutterButtonInner, { backgroundColor: themeColor }]} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cameraSubActionButton}
                            onPress={() => setActiveSlot(null)}
                        >
                            <Ionicons name="close-circle-outline" size={24} color="#fff" />
                            <Text style={styles.cameraSubActionLabel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inspectionSection: {
        marginBottom: 16,
        marginTop: 6,
    },
    inspectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    inspectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    inspectionCounter: {
        fontSize: 12,
        fontWeight: '700',
    },
    inspectionSubtitle: {
        fontSize: 11,
        color: '#8E8E93',
        marginBottom: 12,
    },
    photoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    photoGridItem: {
        width: '23%',
        height: 94,
        backgroundColor: '#fff',
        borderRadius: 12,
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
        borderRadius: 10,
    },
    photoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    photoIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    photoPlaceholderLabel: {
        fontSize: 9,
        color: '#8E8E93',
        fontWeight: '600',
        textAlign: 'center',
    },
    photoUploadHint: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 2,
    },
    photoSuccessCheck: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
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
    cameraModalContainer: {
        zIndex: 2000,
        backgroundColor: '#000',
    },
    cameraPlaceholderContainer: {
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPlaceholderText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
    },
    grantAccessInlineButton: {
        backgroundColor: 'rgba(0, 102, 255, 0.2)',
        borderWidth: 1,
        borderColor: '#0066FF',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    grantAccessInlineText: {
        color: '#0066FF',
        fontWeight: '700',
        fontSize: 12,
    },
    cameraModalTopBar: {
        position: 'absolute',
        top: 48,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    camSmallCtrlBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanViewfinder: {
        width: width * 0.76,
        height: width * 0.76,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#0066FF',
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
        fontSize: 13,
        fontWeight: '600',
        marginTop: 20,
        backgroundColor: 'rgba(7, 19, 37, 0.75)',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
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
