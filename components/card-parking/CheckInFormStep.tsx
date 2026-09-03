import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { FormState, CameraState } from './CardParkingTypes';

interface CheckInFormStepProps {
    form: FormState;
    cameraState: CameraState;
    isDarkMode: boolean;
    hasCameraPermission: boolean | null;
    cameraRef: React.RefObject<any>;
    onFormChange: (field: keyof FormState, value: string | null) => void;
    onTriggerOCR: () => void;
    onGenerateTicket: () => void;
    onEnableCameraPermission: () => void;
}

export default function CheckInFormStep({
    form,
    cameraState,
    isDarkMode,
    hasCameraPermission,
    cameraRef,
    onFormChange,
    onTriggerOCR,
    onGenerateTicket,
    onEnableCameraPermission,
}: CheckInFormStepProps) {
    return (
        <ScrollView
            contentContainerStyle={styles.formScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {/* Top Live Camera Preview / Captured Photo Box */}
            <View style={styles.topCameraPreviewCard}>
                {form.photoUri ? (
                    <>
                        <Image
                            source={{ uri: form.photoUri }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                        />
                        <View style={styles.topScanOverlay}>
                            <TouchableOpacity
                                style={[
                                    styles.topOcrTriggerBtn,
                                    { backgroundColor: 'rgba(0, 0, 0, 0.8)', borderColor: '#0066FF', borderWidth: 1.5 },
                                ]}
                                onPress={() => onFormChange('photoUri', null)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.topOcrTriggerText}>CHANGE / RETAKE PHOTO</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        {hasCameraPermission ? (
                            <CameraView
                                ref={cameraRef}
                                style={StyleSheet.absoluteFillObject}
                                facing={cameraState.facing}
                            />
                        ) : (
                            <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholderContainer]}>
                                <Ionicons name="videocam-off-outline" size={36} color="#8E8E93" style={{ marginBottom: 6 }} />
                                <Text style={styles.cameraPlaceholderText}>Camera Feed Unavailable</Text>
                                <TouchableOpacity style={styles.grantAccessInlineButton} onPress={onEnableCameraPermission}>
                                    <Text style={styles.grantAccessInlineText}>Enable Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Viewfinder Overlay & OCR Trigger */}
                        <View style={styles.topScanOverlay}>
                            <View style={styles.topScanCorners} />
                            <TouchableOpacity
                                style={[styles.topOcrTriggerBtn, cameraState.ocrScanning && { opacity: 0.7 }]}
                                onPress={onTriggerOCR}
                                disabled={cameraState.ocrScanning}
                                activeOpacity={0.8}
                            >
                                {cameraState.ocrScanning ? (
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                                ) : (
                                    <Ionicons name="camera" size={18} color="#fff" style={{ marginRight: 6 }} />
                                )}
                                <Text style={styles.topOcrTriggerText}>
                                    {cameraState.ocrScanning ? 'Scanning Plate...' : 'SCAN & AUTOFILL DETAILS'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* License Plate Number */}
            <View style={styles.formInputGroup}>
                <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>License Plate Number</Text>
                <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <TextInput
                        style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                        placeholder="e.g. 7XYZ123"
                        placeholderTextColor="#8E8E93"
                        value={form.licensePlate}
                        onChangeText={(val) => onFormChange('licensePlate', val)}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.scanIconInsideInput} onPress={onTriggerOCR}>
                        <Ionicons name="scan-outline" size={20} color="#0066FF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Customer Name */}
            <View style={styles.formInputGroup}>
                <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Customer Name</Text>
                <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <Ionicons name="person-outline" size={18} color="#8E8E93" style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                        placeholder="Customer Full Name"
                        placeholderTextColor="#8E8E93"
                        value={form.driverName}
                        onChangeText={(val) => onFormChange('driverName', val)}
                    />
                </View>
            </View>

            {/* Phone Number */}
            <View style={styles.formInputGroup}>
                <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Phone Number</Text>
                <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                    <Ionicons name="call-outline" size={18} color="#8E8E93" style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                        placeholder="10-digit Phone Number"
                        placeholderTextColor="#8E8E93"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={form.phone}
                        onChangeText={(val) => onFormChange('phone', val)}
                    />
                </View>
            </View>

            {/* Vehicle Brand & Model */}
            <View style={styles.formRowTwoCols}>
                <View style={[styles.formInputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Brand</Text>
                    <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                        <TextInput
                            style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                            placeholder="e.g. Mercedes"
                            placeholderTextColor="#8E8E93"
                            value={form.brand}
                            onChangeText={(val) => onFormChange('brand', val)}
                        />
                    </View>
                </View>

                <View style={[styles.formInputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Model</Text>
                    <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                        <TextInput
                            style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                            placeholder="e.g. E-Class"
                            placeholderTextColor="#8E8E93"
                            value={form.model}
                            onChangeText={(val) => onFormChange('model', val)}
                        />
                    </View>
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.continueButton, cameraState.generating && { opacity: 0.7 }]}
                onPress={onGenerateTicket}
                disabled={cameraState.generating}
                activeOpacity={0.8}
            >
                {cameraState.generating ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                    <Ionicons name="ticket" size={20} color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.continueButtonText}>
                    {cameraState.generating ? 'GENERATING TICKET...' : 'GENERATE TICKET'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    formScrollContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 110,
    },
    topCameraPreviewCard: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 18,
        position: 'relative',
        borderWidth: 1.5,
        borderColor: '#0066FF',
    },
    topScanOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    topScanCorners: {
        position: 'absolute',
        top: 20,
        left: 24,
        right: 24,
        bottom: 60,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 14,
        borderStyle: 'dashed',
    },
    topOcrTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0066FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    topOcrTriggerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cameraPlaceholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPlaceholderText: {
        color: '#8E8E93',
        fontSize: 13,
        marginBottom: 8,
    },
    grantAccessInlineButton: {
        backgroundColor: '#0066FF',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 14,
    },
    grantAccessInlineText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    formInputGroup: {
        marginBottom: 14,
    },
    formInputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 6,
    },
    formInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E9F0',
        paddingHorizontal: 14,
    },
    formInputText: {
        flex: 1,
        fontSize: 14,
        color: '#1C1C1E',
        fontWeight: '600',
    },
    scanIconInsideInput: {
        padding: 4,
    },
    formRowTwoCols: {
        flexDirection: 'row',
    },
    continueButton: {
        backgroundColor: '#0066FF',
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#0066FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
