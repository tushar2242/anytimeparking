import React from 'react';
import { View, StyleSheet } from 'react-native';
import DriverHome from '@/components/home/DriverHome';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import LayoutWrapper from '@/components/wrapper/LayoutWrapper';

const HomeComp = () => {
    return (
        <LayoutWrapper>
            <View style={styles.container}>
                <DriverHome />
                <BottomTabBar />
            </View>
        </LayoutWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default HomeComp;
