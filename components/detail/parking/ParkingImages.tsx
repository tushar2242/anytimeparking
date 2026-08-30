import React, { useEffect } from 'react';
import { Dimensions, Image, FlatList, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import useParkingStore from '@/src/features/details/parking.service';

const { width } = Dimensions.get('window');


const ParkingImages = (props: any) => {


    const store = useParkingStore()


    useEffect(() => {
        store.actions.fetchSlot(props?.site_id);
    }, [props?.site_id]);

    console.log("Parking Slots:", store.slots);

    return (
        <>
            {
                store.slots.length > 0 && store.slots.map((p) => {
                    // console.log(p.images)
                    return (
                        <View style={styles.section} key={p.id}>
                            {p.images.length > 0 && (
                                <FlatList
                                    data={p.images}
                                    numColumns={2}
                                    scrollEnabled={false}
                                    renderItem={({ item }) => (
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={{
                                                    uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Map_marker.svg/800px-Map_marker.svg.png"
                                                }}
                                                style={{
                                                    width: "100%",
                                                    height: 220,
                                                    borderRadius: 15,
                                                }}
                                            />
                                        </View>
                                    )}
                                />
                            )}
                        </View>
                    )
                })
            }

        </>

    );
};

export default ParkingImages;

const styles = StyleSheet.create({
    section: {
        marginTop: 16,
        paddingHorizontal: 2,
        // backgroundColor: '#500000ff',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 6,
    },
    imageContainer: {
        width: (width - 60) / 2,
        height: 120,
        marginBlock: 10,
        marginRight: 12,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    noImages: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
    },

});
