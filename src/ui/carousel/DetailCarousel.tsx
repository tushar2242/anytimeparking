import React from 'react'
import { View, Dimensions, Image } from 'react-native'
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window')



export default function DetailCarousel({ images }: any) {

    console.log(images)
    return (
        <View style={{ alignItems: 'center', height: 280, }}>
            <Carousel
                loop
                width={width}
                height={width * 0.6}
                autoPlay={true}
                data={images}
                scrollAnimationDuration={1000}
                renderItem={({ item }) => (
                    <Image
                        source={{ uri: item } as any}
                        style={{ width: '100%', height: '100%', borderRadius: 10 }}
                        resizeMode="contain"
                    />
                )}
            />
        </View>
    )
}
