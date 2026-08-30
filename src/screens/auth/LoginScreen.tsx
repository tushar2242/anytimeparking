import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back 👋</Text>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
            />
            <Button mode="contained" onPress={() => { }} style={styles.button}>
                Login
            </Button>

            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
                <Text style={styles.link}>{"Don't have an account? Sign up"}</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 26, marginBottom: 20, textAlign: 'center' },
    input: { marginBottom: 16 },
    button: { marginTop: 8, paddingVertical: 4 },
    link: { textAlign: 'center', marginTop: 16, color: 'rgba(255,77,77,1.00)' },
});
