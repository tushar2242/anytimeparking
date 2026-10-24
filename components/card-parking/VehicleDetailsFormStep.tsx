import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ValetSite } from '@/components/card-parking/SiteSelectionStep';
import VehicleInspectionSummary from '@/components/card-parking/VehicleInspectionSummary';

interface VehicleDetailsFormStepProps {
    isDarkMode: boolean;
    themeColor: string;
    isKeyboardVisible: boolean;
    headerPaddingTop: number;
    scrollViewRef: React.RefObject<any>;
    selectedSite: ValetSite | null;
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
    driverName: string;
    phone: string;
    keySlot: string;
    generating: boolean;
    onSwitchSite: () => void;
    onOpenAiCamera: () => void;
    onChangeLicensePlate: (val: string) => void;
    onChangeDriverName: (val: string) => void;
    onChangePhone: (val: string) => void;
    onChangeBrand: (val: string) => void;
    onChangeModel: (val: string) => void;
    onChangeColor: (val: string) => void;
    onChangeKeySlot: (val: string) => void;
    onInputFocus: (targetY: number) => void;
    onSubmit: () => void;
}

export default function VehicleDetailsFormStep({
    isDarkMode,
    themeColor,
    isKeyboardVisible,
    headerPaddingTop,
    scrollViewRef,
    selectedSite,
    licensePlate,
    brand,
    model,
    color,
    driverName,
    phone,
    keySlot,
    generating,
    onSwitchSite,
    onOpenAiCamera,
    onChangeLicensePlate,
    onChangeDriverName,
    onChangePhone,
    onChangeBrand,
    onChangeModel,
    onChangeColor,
    onChangeKeySlot,
    onInputFocus,
    onSubmit,
}: VehicleDetailsFormStepProps) {
    return (
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
                            <TouchableOpacity onPress={onSwitchSite} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                                <Text style={{ color: themeColor, fontSize: 12, fontWeight: '700' }}>Switch</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* AI Smart Scan Banner */}
                    <TouchableOpacity
                        style={[styles.aiScanBanner, isDarkMode && { backgroundColor: '#1A273A', borderColor: '#2E4C7A' }]}
                        onPress={onOpenAiCamera}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.aiScanIconCircle, { backgroundColor: themeColor }]}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                            <Text style={[styles.aiScanTitle, isDarkMode && { color: '#fff' }]}>
                                Scan Car to Auto-Fill
                            </Text>
                            <Text style={styles.aiScanSubtitle}>
                                Take photo of license plate & vehicle
                            </Text>
                        </View>
                        <View style={[styles.aiScanActionBtn, { backgroundColor: themeColor }]}>
                            <Ionicons name="sparkles" size={14} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.aiScanActionText}>SCAN</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Form Input: License Plate Number */}
                    <View style={styles.formInputGroup}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>
                                License Plate Number *
                            </Text>
                        </View>
                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                            <Ionicons name="car-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                placeholderTextColor="#8E8E93"
                                value={licensePlate}
                                onChangeText={onChangeLicensePlate}
                                autoCapitalize="characters"
                                onFocus={() => onInputFocus(0)}
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
                                placeholderTextColor="#8E8E93"
                                value={driverName}
                                onChangeText={onChangeDriverName}
                                autoCapitalize="words"
                                onFocus={() => onInputFocus(70)}
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
                                placeholderTextColor="#8E8E93"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={onChangePhone}
                                onFocus={() => onInputFocus(140)}
                            />
                        </View>
                    </View>

                    {/* Form Input: Vehicle Brand */}
                    <View style={styles.formInputGroup}>
                        <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Brand</Text>
                        <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                            <MaterialCommunityIcons name="car-select" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                placeholderTextColor="#8E8E93"
                                value={brand}
                                onChangeText={onChangeBrand}
                                onFocus={() => onInputFocus(200)}
                            />
                        </View>
                    </View>

                    {/* Form Input Row: Model & Color */}
                    <View style={styles.formRowTwo}>
                        <View style={[styles.formInputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Vehicle Model</Text>
                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                <TextInput
                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                    placeholderTextColor="#8E8E93"
                                    value={model}
                                    onChangeText={onChangeModel}
                                    onFocus={() => onInputFocus(260)}
                                />
                            </View>
                        </View>

                        <View style={[styles.formInputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={[styles.formInputLabel, isDarkMode && { color: '#fff' }]}>Color</Text>
                            <View style={[styles.formInputWrapper, isDarkMode && { backgroundColor: '#1C1C1E', borderColor: '#2C2C2E' }]}>
                                <TextInput
                                    style={[styles.formInputText, isDarkMode && { color: '#fff' }]}
                                    placeholderTextColor="#8E8E93"
                                    value={color}
                                    onChangeText={onChangeColor}
                                    onFocus={() => onInputFocus(260)}
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
                                placeholderTextColor="#8E8E93"
                                value={keySlot}
                                onChangeText={onChangeKeySlot}
                                onFocus={() => onInputFocus(320)}
                            />
                        </View>
                    </View>

                    {/* Captured Vehicle Photos Preview */}
                    <VehicleInspectionSummary themeColor={themeColor} title="Captured Vehicle Photo" />
                </ScrollView>

                <TouchableOpacity
                    style={[styles.continueButton, generating && { opacity: 0.8 }]}
                    onPress={onSubmit}
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
    );
}

const styles = StyleSheet.create({
    innerContent: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 90,
    },
    formScrollContainer: {
        paddingBottom: 24,
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
    aiScanBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF2FF',
        borderWidth: 1,
        borderColor: '#C7DDFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    aiScanIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiScanTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0066FF',
    },
    aiScanSubtitle: {
        fontSize: 12,
        color: '#6E7A90',
        marginTop: 2,
    },
    aiScanActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    aiScanActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
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
});
