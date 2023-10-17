import React from 'react';
import {Text, View} from 'react-native';

// Rending all colors so tailwind picks up on the theme colors
export default function ColorRender() {
  return (
    <View className="hidden">
      <Text className="text-primary">x</Text>

      <Text className="text-secondary">x</Text>

      <Text className="text-line">x</Text>

      <Text className="text-neutralAlt">x</Text>

      <Text className="text-neutral">x</Text>

      <Text className="text-overlay">x</Text>

      <Text className="text-brandAlt">x</Text>

      <Text className="text-brand">x</Text>
    </View>
  );
}
