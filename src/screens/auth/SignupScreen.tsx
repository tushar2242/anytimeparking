import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const SignupScreen = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account 🚀</Text>

            <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
            />
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
                Sign Up
            </Button>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
};

export default SignupScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 26, marginBottom: 20, textAlign: 'center' },
    input: { marginBottom: 16 },
    button: { marginTop: 8, paddingVertical: 4 },
    link: { textAlign: 'center', marginTop: 16, color: '#007bff' },
});
