import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ValetSite {
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

interface SiteSelectionStepProps {
    sites: ValetSite[];
    selectedSite: ValetSite | null;
    loadingSites: boolean;
    isDarkMode: boolean;
    themeColor: string;
    onSelectSite: (site: ValetSite) => void;
    onRetry: () => void;
    onContinue: () => void;
}

export default function SiteSelectionStep({
    sites,
    selectedSite,
    loadingSites,
    isDarkMode,
    themeColor,
    onSelectSite,
    onRetry,
    onContinue,
}: SiteSelectionStepProps) {
    return (
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
                        <TouchableOpacity style={[styles.retryButton, { backgroundColor: themeColor }]} onPress={onRetry}>
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
                                onPress={() => onSelectSite(site)}
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
                onPress={onContinue}
                activeOpacity={0.85}
            >
                <Text style={styles.continueButtonText}>CONTINUE TO VEHICLE DETAILS</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
        </View>
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
});
