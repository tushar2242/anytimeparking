import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/src/features/theme/theme.service';
import { useVehiclePhotosStore } from '@/src/features/cardParking/vehiclePhotos.store';

export interface VehicleInspectionSummaryProps {
    title?: string;
    themeColor?: string;
    photos?:
        | {
              front?: string | null;
              rear?: string | null;
              left?: string | null;
              right?: string | null;
          }
        | (string | null | undefined)[];
}

export default function VehicleInspectionSummary({
    title = 'Photos',
    themeColor = '#0066FF',
    photos,
}: VehicleInspectionSummaryProps = {}) {
    const isDarkMode = useThemeStore().isDarkMode;
    const store = useVehiclePhotosStore();

    // Extract all valid, captured image URIs
    let capturedUris: string[] = [];

    if (Array.isArray(photos)) {
        capturedUris = photos.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    } else if (photos) {
        capturedUris = [photos.front, photos.rear, photos.left, photos.right].filter(
            (u): u is string => typeof u === 'string' && u.trim().length > 0
        );
    } else {
        capturedUris = [store.photoFront, store.photoRear, store.photoLeft, store.photoRight].filter(
            (u): u is string => typeof u === 'string' && u.trim().length > 0
        );
    }

    if (capturedUris.length === 0) {
        return null;
    }

    const isSingle = capturedUris.length === 1;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="camera" size={15} color={themeColor} style={{ marginRight: 6 }} />
                <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>
                    {title} {capturedUris.length > 1 ? `(${capturedUris.length})` : ''}
                </Text>
            </View>
            <View style={[styles.photosRow, isSingle && styles.singlePhotoRow]}>
                {capturedUris.map((uri, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.photoItem,
                            isSingle ? styles.singlePhotoItem : capturedUris.length === 2 ? styles.halfPhotoItem : styles.multiPhotoItem,
                        ]}
                    >
                        <Image
                            source={{ uri }}
                            style={[styles.photoThumb, isSingle && styles.singlePhotoThumb]}
                            resizeMode="cover"
                        />
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
        flexWrap: 'wrap',
        gap: 8,
    },
    singlePhotoRow: {
        justifyContent: 'center',
    },
    photoItem: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    singlePhotoItem: {
        width: '100%',
        maxWidth: 240,
    },
    halfPhotoItem: {
        flex: 1,
        minWidth: '46%',
    },
    multiPhotoItem: {
        width: '23%',
        minWidth: 64,
    },
    photoThumb: {
        width: '100%',
        height: 64,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
    },
    singlePhotoThumb: {
        height: 120,
    },
});
