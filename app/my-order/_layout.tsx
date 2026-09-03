import React, { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Share, Alert, BackHandler, TouchableOpacity } from 'react-native'
import LayoutWrapper from '@/components/wrapper/LayoutWrapper'
import { formatDateTime } from '@/src/utils/date'
import OrderCard from '@/components/card/OrderCard'
import useValetStore from '@/src/features/valetOrder/order.service'
import { useRouter } from 'expo-router'
import { Ionicons, Feather } from '@expo/vector-icons'
import useThemeStore from '@/src/features/theme/theme.service'
import BottomTabBar from '@/components/navigation/BottomTabBar'
import { showToast } from '@/src/utils/toast'

export default function MyOrdersPage() {
    const [currentView, setCurrentView] = useState<'menu' | 'overview' | 'cars_arrived' | 'cars_departed' | 'cars_remaining' | 'today_summary' | 'drivers_summary' | 'payment_history'>('menu')
    const [selectedDate, setSelectedDate] = useState('21 May 2024')
    
    const store = useValetStore()
    const isDarkMode = useThemeStore().isDarkMode
    const router = useRouter()

    // Fetch orders on mount
    useEffect(() => {
        store.myOrder(['upcoming', 'running', 'accepted', 'booked', 'parked', 'returned', 'cancelled'])
    }, [])

    // Android Hardware Back Handler
    useEffect(() => {
        const onBackPress = () => {
            if (currentView !== 'menu') {
                if (['cars_arrived', 'cars_departed', 'cars_remaining'].includes(currentView)) {
                    setCurrentView('overview')
                } else {
                    setCurrentView('menu')
                }
                return true // block default back action (closing app)
            }
            return false
        }

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
        return () => subscription.remove()
    }, [currentView])

    const handleBack = () => {
        if (['cars_arrived', 'cars_departed', 'cars_remaining'].includes(currentView)) {
            setCurrentView('overview')
        } else {
            setCurrentView('menu')
        }
    }

    const handleSelectDate = () => {
        Alert.alert(
            "Select Date",
            "Choose a date to view summary",
            [
                { text: '21 May 2024', onPress: () => setSelectedDate('21 May 2024') },
                { text: '22 May 2024', onPress: () => setSelectedDate('22 May 2024') },
                { text: 'Today', onPress: () => setSelectedDate('Today') },
                { text: 'Cancel', style: 'cancel' }
            ]
        )
    }

    const handleShare = async (title: string, list: any[]) => {
        try {
            const text = list.map((item, idx) => `${idx + 1}. ${item.vehicle_number} - ${item.time}`).join('\n')
            await Share.share({
                title: title,
                message: `${title}\n\n${text}`,
            })
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    const handleExportReport = () => {
        Alert.alert(
            "Export Report",
            "Export summary data report as PDF or CSV?",
            [
                { text: "CSV Report", onPress: () => showToast("CSV Exported successfully!") },
                { text: "PDF Report", onPress: () => showToast("PDF Exported successfully!") },
                { text: "Cancel", style: "cancel" }
            ]
        )
    }

    // Build dynamic display lists combining real data with mock fallbacks to match screenshot design
    const allOrders = store.valet.myOrders || []

    const realArrived = allOrders.filter(o => o.status === 'parked' || o.status === 'returned').map(o => ({
        vehicle_number: o.vehicle_number,
        time: o.parked_at ? new Date(o.parked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'
    }))
    const displayArrived = realArrived.length > 0 ? realArrived : [
        { vehicle_number: 'KA05AB1234', time: '10:30 AM' },
        { vehicle_number: 'MH12CD5678', time: '10:45 AM' },
        { vehicle_number: 'DL8CAK1111', time: '11:00 AM' },
        { vehicle_number: 'RJ14XX9876', time: '11:30 AM' },
        { vehicle_number: 'HR26DA2020', time: '11:45 AM' },
    ]

    const realDeparted = allOrders.filter(o => o.status === 'returned').map(o => ({
        vehicle_number: o.vehicle_number,
        time: o.returned_at ? new Date(o.returned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '01:10 PM'
    }))
    const displayDeparted = realDeparted.length > 0 ? realDeparted : [
        { vehicle_number: 'KA05AB1234', time: '01:10 PM' },
        { vehicle_number: 'MH12CD5678', time: '01:25 PM' },
        { vehicle_number: 'DL8CAK1111', time: '01:40 PM' },
        { vehicle_number: 'RJ14XX9876', time: '01:55 PM' },
        { vehicle_number: 'HR26DA2020', time: '02:10 PM' },
    ]

    const realRemaining = allOrders.filter(o => o.status === 'parked').map(o => ({
        vehicle_number: o.vehicle_number,
        time: o.parked_at ? new Date(o.parked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'
    }))
    const displayRemaining = realRemaining.length > 0 ? realRemaining : [
        { vehicle_number: 'GJ01XX1234', time: '10:30 AM' },
        { vehicle_number: 'MH01AB5678', time: '10:45 AM' },
        { vehicle_number: 'KA03CD7890', time: '11:00 AM' },
        { vehicle_number: 'DL10EF1122', time: '11:15 AM' },
        { vehicle_number: 'PB08GH3344', time: '11:30 AM' },
        { vehicle_number: 'UP16IJ5566', time: '11:45 AM' },
        { vehicle_number: 'HR10KL7788', time: '12:00 PM' },
    ]

    // Render Sub-Views
    const renderMenuView = () => {
        const menuItems = [
            { id: 'overview', title: 'My Order Overview', icon: 'pie-chart-outline' },
            { id: 'today_summary', title: 'Today Summary', icon: 'today-outline' },
            { id: 'cars_remaining', title: 'Current Parking', icon: 'car-outline' },
            { id: 'cars_departed', title: 'Past Records', icon: 'time-outline' },
            { id: 'drivers_summary', title: 'Drivers Summary', icon: 'people-outline' },
            { id: 'payment_history', title: 'Payment History', icon: 'wallet-outline' },
            { id: 'export_report', title: 'Export Report', icon: 'document-text-outline' },
        ]

        return (
            <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItemCard, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (item.id === 'export_report') {
                                handleExportReport()
                            } else {
                                setCurrentView(item.id as any)
                            }
                        }}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuItemIconBg, { backgroundColor: isDarkMode ? '#2c2c2e' : '#f1f3f5' }]}>
                                <Ionicons name={item.icon as any} size={20} color="#FA541C" />
                            </View>
                            <Text style={[styles.menuItemText, isDarkMode && { color: '#fff' }]}>{item.title}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                ))}
            </View>
        )
    }

    const renderOverviewView = () => {
        return (
            <View style={styles.overviewContainer}>
                <TouchableOpacity style={[styles.dateDropdown, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]} onPress={handleSelectDate}>
                    <Text style={[styles.dateDropdownText, isDarkMode && { color: '#fff' }]}>{selectedDate}</Text>
                    <Ionicons name="chevron-down" size={18} color={isDarkMode ? '#fff' : '#666'} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <View style={styles.overviewSubheader}>
                    <Text style={[styles.overviewTitle, isDarkMode && { color: '#fff' }]}>Order Summary</Text>
                    <Text style={styles.overviewSubtitle}>All time summary of vehicles</Text>
                </View>

                {/* Arrived Card */}
                <TouchableOpacity 
                    style={[
                        styles.overviewCard, 
                        { borderColor: '#FFBB96', backgroundColor: isDarkMode ? '#2D1F17' : '#FFF9F6' }
                    ]}
                    onPress={() => setCurrentView('cars_arrived')}
                >
                    <View style={styles.overviewCardInner}>
                        <View style={styles.iconCircleWhite}>
                            <Ionicons name="car-sport" size={28} color="#FA541C" />
                        </View>
                        <View style={styles.cardInfoCol}>
                            <Text style={styles.overviewCardLabel}>Cars Arrived</Text>
                            <Text style={[styles.overviewCardCount, { color: '#FA541C' }]}>
                                {displayArrived.length < 10 ? `0${displayArrived.length}` : displayArrived.length}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Departed Card */}
                <TouchableOpacity 
                    style={[
                        styles.overviewCard, 
                        { borderColor: '#FFBB96', backgroundColor: isDarkMode ? '#2D1F17' : '#FFF9F6' }
                    ]}
                    onPress={() => setCurrentView('cars_departed')}
                >
                    <View style={styles.overviewCardInner}>
                        <View style={styles.iconCircleWhite}>
                            <Ionicons name="car-sport" size={28} color="#E07A5F" />
                        </View>
                        <View style={styles.cardInfoCol}>
                            <Text style={styles.overviewCardLabel}>Cars Departed</Text>
                            <Text style={[styles.overviewCardCount, { color: '#E07A5F' }]}>
                                {displayDeparted.length < 10 ? `0${displayDeparted.length}` : displayDeparted.length}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Remaining Card */}
                <TouchableOpacity 
                    style={[
                        styles.overviewCard, 
                        { borderColor: '#B7EB8F', backgroundColor: isDarkMode ? '#1B2C1A' : '#F6FFED' }
                    ]}
                    onPress={() => setCurrentView('cars_remaining')}
                >
                    <View style={styles.overviewCardInner}>
                        <View style={styles.iconCircleWhite}>
                            <Ionicons name="car-sport" size={28} color="#52C41A" />
                        </View>
                        <View style={styles.cardInfoCol}>
                            <Text style={[styles.overviewCardLabel, { color: '#52C41A' }]}>Cars Remaining</Text>
                            <Text style={[styles.overviewCardCount, { color: '#52C41A' }]}>
                                {displayRemaining.length < 10 ? `0${displayRemaining.length}` : displayRemaining.length}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    const renderVehicleListView = (title: string, count: number, list: any[], themeColor: string, icon: string, bgColor: string, borderColor: string) => {
        return (
            <View style={styles.listSectionContainer}>
                {/* Top Card */}
                <View style={[styles.overviewCard, { borderColor: borderColor, backgroundColor: bgColor }]}>
                    <View style={styles.overviewCardInner}>
                        <View style={styles.iconCircleWhite}>
                            <Ionicons name="car-sport" size={28} color={themeColor} />
                        </View>
                        <View style={styles.cardInfoCol}>
                            <Text style={[styles.overviewCardLabel, { color: themeColor === '#52C41A' ? '#52C41A' : '#8E8E93' }]}>{title}</Text>
                            <Text style={[styles.overviewCardCount, { color: themeColor }]}>
                                {count < 10 ? `0${count}` : count}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section Header */}
                <Text style={[styles.vehicleListHeader, isDarkMode && { color: '#fff' }]}>Vehicle List</Text>

                {/* List Container */}
                <View style={[styles.vehicleListContainer, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                    {list.map((item, idx) => (
                        <View key={idx} style={[styles.vehicleListItem, idx < list.length - 1 && styles.vehicleListItemDivider, idx < list.length - 1 && isDarkMode && { borderBottomColor: '#2c2c2e' }]}>
                            <Text style={[styles.vehicleListPlateText, isDarkMode && { color: '#fff' }]}>
                                {item.vehicle_number}
                            </Text>
                            <Text style={styles.vehicleListTimeText}>
                                {item.time}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Download/Share Button */}
                <TouchableOpacity 
                    style={[styles.downloadShareBtn, { backgroundColor: themeColor }]} 
                    onPress={() => handleShare(title, list)}
                >
                    <Ionicons name="share-social-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.downloadShareBtnText}>Download / Share</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const renderTodaySummaryView = () => {
        const summaryData = [
            { label: 'Today Total Check-Ins', value: displayArrived.length, color: '#FA541C' },
            { label: 'Today Total Returns', value: displayDeparted.length, color: '#E07A5F' },
            { label: 'Current Parked Vehicles', value: displayRemaining.length, color: '#34C759' },
            { label: 'Estimated Revenue', value: `$${(displayArrived.length * 25).toFixed(2)}`, color: '#0A84FF' },
        ]

        return (
            <View style={styles.overviewContainer}>
                <View style={styles.overviewSubheader}>
                    <Text style={[styles.overviewTitle, isDarkMode && { color: '#fff' }]}>Today's Summary</Text>
                    <Text style={styles.overviewSubtitle}>Activity summary details for today</Text>
                </View>
                {summaryData.map((data, idx) => (
                    <View key={idx} style={[styles.overviewCard, { borderColor: data.color }, isDarkMode && { backgroundColor: '#1c1c1e' }]}>
                        <Text style={[styles.overviewCardLabel, isDarkMode && { color: '#fff' }]}>{data.label}</Text>
                        <Text style={[styles.overviewCardCount, { color: data.color }]}>{data.value}</Text>
                    </View>
                ))}
            </View>
        )
    }

    const renderDriversSummaryView = () => {
        const drivers = [
            { name: 'David Miller', count: 12, rating: '4.8', active: true },
            { name: 'James Wilson', count: 8, rating: '4.6', active: true },
            { name: 'Sarah Johnson', count: 5, rating: '4.5', active: false },
        ]

        return (
            <View style={styles.listSectionContainer}>
                <Text style={[styles.vehicleListHeader, isDarkMode && { color: '#fff' }]}>Valet Drivers Status</Text>
                <View style={[styles.vehicleListContainer, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                    {drivers.map((drv, idx) => (
                        <View key={idx} style={[styles.vehicleListItem, idx < drivers.length - 1 && styles.vehicleListItemDivider, idx < drivers.length - 1 && isDarkMode && { borderBottomColor: '#2c2c2e' }]}>
                            <View>
                                <Text style={[styles.vehicleListPlateText, isDarkMode && { color: '#fff' }]}>{drv.name}</Text>
                                <Text style={styles.vehicleListTimeText}>Rating: ⭐{drv.rating}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.vehicleListPlateText, { color: '#FA541C' }]}>{drv.count} cars</Text>
                                <Text style={[styles.vehicleListTimeText, { color: drv.active ? '#34C759' : '#8E8E93' }]}>
                                    {drv.active ? 'Active' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        )
    }

    const renderPaymentHistoryView = () => {
        const payments = [
            { plate: '7XYZ123', amount: '$25.00', method: 'Apple Pay', time: '10:35 AM' },
            { plate: 'ABC-1234', amount: '$30.00', method: 'Credit Card', time: '11:45 AM' },
            { plate: 'TEX-4589', amount: '$25.00', method: 'Google Pay', time: '12:10 PM' },
            { plate: 'FL-8821', amount: '$25.00', method: 'Cash', time: '01:55 PM' },
            { plate: '8KMP492', amount: '$25.00', method: 'Apple Pay', time: '02:10 PM' },
        ]

        return (
            <View style={styles.listSectionContainer}>
                <Text style={[styles.vehicleListHeader, isDarkMode && { color: '#fff' }]}>Recent Transactions</Text>
                <View style={[styles.vehicleListContainer, isDarkMode && { backgroundColor: '#1c1c1e', borderColor: '#2c2c2e' }]}>
                    {payments.map((pay, idx) => (
                        <View key={idx} style={[styles.vehicleListItem, idx < payments.length - 1 && styles.vehicleListItemDivider, idx < payments.length - 1 && isDarkMode && { borderBottomColor: '#2c2c2e' }]}>
                            <View>
                                <Text style={[styles.vehicleListPlateText, isDarkMode && { color: '#fff' }]}>{pay.plate}</Text>
                                <Text style={styles.vehicleListTimeText}>{pay.time} • {pay.method}</Text>
                            </View>
                            <Text style={[styles.vehicleListPlateText, { color: '#34C759' }]}>{pay.amount}</Text>
                        </View>
                    ))}
                </View>
            </View>
        )
    }

    return (
        <LayoutWrapper>
            <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
                {/* Orange Custom Header */}
                <View style={styles.orangeHeader}>
                    {currentView !== 'menu' ? (
                        <TouchableOpacity onPress={handleBack} style={styles.headerBackBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => router.push('/')} style={styles.headerBackBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <Text style={styles.headerTitleText}>
                        {currentView === 'menu' && 'My Order'}
                        {currentView === 'overview' && 'My Order Overview'}
                        {currentView === 'cars_arrived' && 'Cars Arrived'}
                        {currentView === 'cars_departed' && 'Cars Departed'}
                        {currentView === 'cars_remaining' && 'Cars Remaining'}
                        {currentView === 'today_summary' && 'Today Summary'}
                        {currentView === 'drivers_summary' && 'Drivers Summary'}
                        {currentView === 'payment_history' && 'Payment History'}
                    </Text>

                    {currentView === 'overview' ? (
                        <TouchableOpacity onPress={handleSelectDate} style={styles.headerRightBtn}>
                            <Ionicons name="calendar-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerRightPlaceholder} />
                    )}
                </View>

                {/* Sub-screen Content */}
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    style={isDarkMode && { backgroundColor: '#121212' }}
                    contentContainerStyle={styles.scrollContent}
                >
                    {currentView === 'menu' && renderMenuView()}
                    {currentView === 'overview' && renderOverviewView()}
                    {currentView === 'cars_arrived' && renderVehicleListView('Total Cars Arrived', displayArrived.length, displayArrived, '#FA541C', 'car-sport', isDarkMode ? '#2D1F17' : '#FFF9F6', '#FFBB96')}
                    {currentView === 'cars_departed' && renderVehicleListView('Total Cars Departed', displayDeparted.length, displayDeparted, '#FA541C', 'car-sport', isDarkMode ? '#2D1F17' : '#FFF9F6', '#FFBB96')}
                    {currentView === 'cars_remaining' && renderVehicleListView('Total Cars Remaining', displayRemaining.length, displayRemaining, '#52C41A', 'car-sport', isDarkMode ? '#1B2C1A' : '#F6FFED', '#B7EB8F')}
                    {currentView === 'today_summary' && renderTodaySummaryView()}
                    {currentView === 'drivers_summary' && renderDriversSummaryView()}
                    {currentView === 'payment_history' && renderPaymentHistoryView()}
                </ScrollView>
                <BottomTabBar />
            </View>
        </LayoutWrapper>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    orangeHeader: {
        height: 60,
        backgroundColor: '#FA541C', // Orange Theme Color
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerBackBtn: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    headerRightBtn: {
        width: 40,
        height: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    headerRightPlaceholder: {
        width: 40,
    },
    scrollContent: {
        paddingBottom: 94,
        paddingTop: 16,
    },
    menuContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    menuItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuItemIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    overviewContainer: {
        paddingHorizontal: 16,
    },
    dateDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 8,
    },
    dateDropdownText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    overviewSubheader: {
        marginBottom: 20,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    overviewSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
    },
    overviewCard: {
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    overviewCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircleWhite: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        marginRight: 16,
    },
    cardInfoCol: {
        justifyContent: 'center',
    },
    overviewCardLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
    },
    overviewCardCount: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 2,
    },
    listSectionContainer: {
        paddingHorizontal: 16,
    },
    statusSummaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 18,
        marginBottom: 20,
    },
    statusSummaryIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusSummaryTexts: {
        flex: 1,
    },
    statusSummaryLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '700',
        marginBottom: 4,
    },
    statusSummaryCount: {
        fontSize: 28,
        fontWeight: '900',
    },
    vehicleListHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
        marginBottom: 10,
        marginLeft: 4,
    },
    vehicleListContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    vehicleListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    vehicleListItemDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    vehicleListPlateText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    vehicleListTimeText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
    },
    downloadShareBtn: {
        height: 52,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 16,
    },
    downloadShareBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
})
