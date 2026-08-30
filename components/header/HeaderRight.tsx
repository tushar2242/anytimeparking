import React, { useState, useEffect } from 'react'
import {
    View, TextInput, StyleSheet, TouchableOpacity,
    LayoutAnimation, Platform, UIManager, FlatList, Text,
    Dimensions, Pressable
} from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import useAuthStore from '@/src/features/auth/auth.service'

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

const MOCK_DATA = [
    { id: '1', name: 'Order #1234' },
    { id: '2', name: 'Order #5678' },
    { id: '3', name: 'Valet Service' },
    { id: '4', name: 'Payment Issue' },
    { id: '5', name: 'Profile Settings' }
]

export default function HeaderRight() {
    const router = useRouter()
    const [searchVisible, setSearchVisible] = useState(false)
    const [query, setQuery] = useState('')
    const [filteredResults, setFilteredResults] = useState([])

    const toggleSearch = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setSearchVisible(!searchVisible)
        setQuery('')
        setFilteredResults([])
    }

    useEffect(() => {
        if (query.trim() === '') {
            setFilteredResults([])
        } else {
            const results = MOCK_DATA.filter(item =>
                item.name.toLowerCase().includes(query.toLowerCase())
            )
            setFilteredResults(results)
        }
    }, [query])

    const handleItemPress = (item: any) => {
        router.push('/detail/' + item?.id as any)
        toggleSearch()
    }

    const { width, height } = Dimensions.get('window')

    return (
        <View style={styles.container}>
            {searchVisible && (
                <Pressable
                    style={[styles.fullScreenOverlay, { width: width * 2, height: height * 2 }]}
                    onPress={toggleSearch}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
                </Pressable>
            )}

            {searchVisible ? (
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color="#666" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search orders, transactions..."
                        value={query}
                        onChangeText={setQuery}
                        style={styles.input}
                        autoFocus
                        returnKeyType="search"
                        placeholderTextColor="#adb5bd"
                    />
                    <TouchableOpacity onPress={toggleSearch} style={styles.closeSearchButton}>
                        <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.iconRow}>
                    <TouchableOpacity
                        onPress={toggleSearch}
                        style={styles.iconButton}
                    >
                        <Feather name="search" size={20} color="#333" />
                    </TouchableOpacity>
                </View>
            )}

            {filteredResults.length > 0 && (
                <FlatList
                    data={filteredResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.resultItem} onPress={() => handleItemPress(item)}>
                            <Feather name="search" size={14} color="#adb5bd" style={{ marginRight: 12 }} />
                            <Text style={styles.resultText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    style={styles.resultList}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e9ecef',
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    profilePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb'
    },
    walletChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        paddingLeft: 4,
        paddingRight: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 4,
    },
    walletIconBg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    walletAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f3f5',
        paddingHorizontal: 12,
        borderRadius: 20,
        height: 38,
        width: 260,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#212529',
        fontWeight: '500',
    },
    closeSearchButton: {
        padding: 4,
    },
    resultList: {
        position: 'absolute',
        backgroundColor: '#fff',
        top: 45,
        right: 0,
        width: 260,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        maxHeight: 250,
        borderWidth: 1,
        borderColor: '#f1f3f5',
        overflow: 'hidden',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderColor: '#f8f9fa',
    },
    resultText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
    },
    fullScreenOverlay: {
        position: 'absolute',
        top: -100,
        left: -Dimensions.get('window').width,
        zIndex: -1,
    }
})
