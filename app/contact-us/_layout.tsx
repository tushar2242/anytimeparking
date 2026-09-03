import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useThemeStore from '@/src/features/theme/theme.service';

const WHATSAPP_NUMBER = '+13105550199';
const EMAIL_ADDRESS = 'support@anytimevalet.com';
const instagram = 'error_05__';
const Telegram = 'error_05';

const ContactUs: React.FC = () => {
    const isDarkMode = useThemeStore().isDarkMode;

    const openWhatsApp = () => {
        const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}`;
        Linking.openURL(url).catch(() => {
            alert('WhatsApp not installed on your device.');
        });
    };

    const openEmail = () => {
        const url = `mailto:${EMAIL_ADDRESS}`;
        Linking.openURL(url).catch(() => {
            alert('Could not open email client.');
        });
    };

    const openInstagram = () => {
        const url = `https://www.instagram.com/${instagram}/`;
        Linking.openURL(url).catch(() => {
            alert('Could not open Instagram.');
        });
    };

    const openTelegram = () => {
        const url = `https://t.me/${Telegram}`;
        Linking.openURL(url).catch(() => {
            alert('Could not open Telegram.');
        });
    };

    return (
        <View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#1c1c1e' : '#fff'}
            />
            <Text style={[styles.heading, isDarkMode && { color: '#ffffff' }]}>Contact Us</Text>

            <TouchableOpacity style={styles.option} onPress={openWhatsApp}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={[styles.text, isDarkMode && { color: '#ffffff' }]}>WhatsApp: {WHATSAPP_NUMBER}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={openEmail}>
                <Ionicons name="mail-outline" size={24} color={isDarkMode ? '#ffffff' : '#333'} />
                <Text style={[styles.text, isDarkMode && { color: '#ffffff' }]}>Email: {EMAIL_ADDRESS}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={openInstagram}>
                <Ionicons name="logo-instagram" size={24} color="#E1306C" />
                <Text style={[styles.text, isDarkMode && { color: '#ffffff' }]}>Instagram: @{instagram}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={openTelegram}>
                <Ionicons name="paper-plane" size={30} color="#0088cc" />
                <Text style={[styles.text, isDarkMode && { color: '#ffffff' }]}>Telegram: @{Telegram}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    text: {
        fontSize: 16,
        marginLeft: 10,
    },
});

export default ContactUs;
