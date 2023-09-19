import React from 'react';
import { Animated, Easing, View } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';

export default function Loading({full}: {full?: boolean}) {

    const spinValue = new Animated.Value(0)

    Animated.loop(
        Animated.timing(spinValue, {
          toValue: 360,
          duration: 300000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()

      const rotateValue =    spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"]
   })
  return (
    <View className={`${full ? 'h-full ' : ''}flex justify-center items-center bg-neutral`}>
        <Animated.View
        style={{
          transform: [{ rotate: rotateValue }],
        }}>
        <Icon name='sync' color={colors.brand} size={96}/>
        </Animated.View>
    </View>
  );
}