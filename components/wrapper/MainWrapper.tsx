import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

const MainWrapper = ({ children }: any) => {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
    },
});

export default MainWrapper;