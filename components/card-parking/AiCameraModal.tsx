import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';

const { width } = Dimensions.get('window');

interface AiCameraModalProps {
    visible: boolean;
    hasPermission: boolean;
    cameraFacing: 'back' | 'front';
    torchOn: boolean;
    cameraRef: React.RefObject<any>;
    themeColor: string;
    onToggleTorch: () => void;
    onFlipCamera: () => void;
    onClose: () => void;
    onCapture: () => void;
    onPickGallery: () => void;
    onRequestPermission: () => void;
}

export default function AiCameraModal({
    visible,
    hasPermission,
    cameraFacing,
    torchOn,
    cameraRef,
    themeColor,
    onToggleTorch,
    onFlipCamera,
    onClose,
    onCapture,
    onPickGallery,
    onRequestPermission,
}: AiCameraModalProps) {
    if (!visible) return null;

    return (
        <View style={[StyleSheet.absoluteFillObject, styles.cameraModalContainer]}>
            {hasPermission ? (
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
                    <TouchableOpacity style={styles.grantAccessInlineButton} onPress={onRequestPermission}>
                        <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Camera Top Controls */}
            <View style={styles.cameraModalTopBar}>
                <TouchableOpacity style={styles.camSmallCtrlBtn} onPress={onToggleTorch}>
                    <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.camSmallCtrlBtn} onPress={onFlipCamera}>
                    <Ionicons name="camera-reverse" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.camSmallCtrlBtn} onPress={onClose}>
                    <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Aim Viewfinder Target */}
            <View style={styles.scanOverlayContainer}>
                <View style={styles.scanViewfinder}>
                    <View style={styles.scanCorners} />
                </View>
                <View style={styles.scanHelperBadge}>
                    <Ionicons name="sparkles" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                    <Text style={styles.scanHelperText}>
                        Align license plate & front of car inside frame
                    </Text>
                </View>
            </View>

            {/* Camera Shutter & Gallery Row */}
            <View style={styles.cameraActionsBar}>
                <TouchableOpacity style={styles.cameraSubActionButton} onPress={onPickGallery}>
                    <Ionicons name="images-outline" size={24} color="#fff" />
                    <Text style={styles.cameraSubActionLabel}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shutterButton} onPress={onCapture}>
                    <View style={[styles.shutterButtonInner, { backgroundColor: themeColor }]} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraSubActionButton} onPress={onClose}>
                    <Ionicons name="close-circle-outline" size={24} color="#fff" />
                    <Text style={styles.cameraSubActionLabel}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cameraModalContainer: {
        zIndex: 9999,
        backgroundColor: '#000',
        flex: 1,
    },
    cameraPlaceholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    cameraPlaceholderText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 14,
    },
    grantAccessInlineButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    grantAccessInlineText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    cameraModalTopBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 100,
    },
    camSmallCtrlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        width: width * 0.82,
        height: 180,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#0066FF',
        backgroundColor: 'rgba(0, 102, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanCorners: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    scanHelperBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 18,
    },
    scanHelperText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    cameraActionsBar: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    cameraSubActionButton: {
        alignItems: 'center',
        width: 60,
    },
    cameraSubActionLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    shutterButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 4,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
});
