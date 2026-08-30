import React from 'react';
import { View, StyleSheet } from 'react-native';
import DriverHome from '@/components/home/DriverHome';
import BottomTabBar from '@/components/navigation/BottomTabBar';

const HomeComp = () => {
    return (
        <View style={styles.container}>
            <DriverHome />
            <BottomTabBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default HomeComp;
