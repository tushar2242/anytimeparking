import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/src/features/theme/theme.service';
import { useVehiclePhotosStore } from '@/src/features/cardParking/vehiclePhotos.store';

export interface VehicleInspectionSummaryProps {
    title?: string;
    themeColor?: string;
    photos?: {
        front?: string | null;
        rear?: string | null;
        left?: string | null;
        right?: string | null;
    };
}

export default function VehicleInspectionSummary({
    title = 'Inspection Photos',
    themeColor = '#0066FF',
    photos,
}: VehicleInspectionSummaryProps = {}) {
    const isDarkMode = useThemeStore().isDarkMode;
    const store = useVehiclePhotosStore();

    const photoFront = photos ? photos.front : store.photoFront;
    const photoRear = photos ? photos.rear : store.photoRear;
    const photoLeft = photos ? photos.left : store.photoLeft;
    const photoRight = photos ? photos.right : store.photoRight;

    const items = [
        { label: 'Front', uri: photoFront },
        { label: 'Rear', uri: photoRear },
        { label: 'Left', uri: photoLeft },
        { label: 'Right', uri: photoRight },
    ];

    const capturedCount = items.filter((i) => !!i.uri).length;
    if (capturedCount === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="shield-checkmark" size={15} color={themeColor} style={{ marginRight: 6 }} />
                <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>
                    {title} ({capturedCount}/4)
                </Text>
            </View>
            <View style={styles.photosRow}>
                {items.map((item, idx) => (
                    <View key={idx} style={styles.photoItem}>
                        {item.uri ? (
                            <Image source={{ uri: item.uri }} style={styles.photoThumb} />
                        ) : (
                            <View style={[styles.photoEmpty, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                                <Ionicons name="image-outline" size={16} color="#8E8E93" />
                            </View>
                        )}
                        <Text style={[styles.photoLabel, isDarkMode && { color: '#8E8E93' }]}>
                            {item.label}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 10,
        marginBottom: 6,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E9F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    photosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    photoItem: {
        width: '23%',
        alignItems: 'center',
    },
    photoThumb: {
        width: '100%',
        height: 52,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
    },
    photoEmpty: {
        width: '100%',
        height: 52,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoLabel: {
        fontSize: 9,
        color: '#8E8E93',
        fontWeight: '600',
        marginTop: 3,
        textAlign: 'center',
    },
});
