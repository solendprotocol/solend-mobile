import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import ConnectButton from './ConnectButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';

export function Header({ leftNavigation, rightNavigation }: {leftNavigation: any, rightNavigation: any}) {
  return (
    <ImageBackground source={require('../assets/market-hero.png')} resizeMethod='scale' resizeMode='cover' imageStyle={{
    }}>
      <View className="p-2 border-b border-line flex flex-row justify-between align-center">
    <View className='flex flex-row justify-between items-center'><TouchableOpacity onPress={() => leftNavigation.openDrawer()} className='flex justify-center'><Icon name="menu" size={32} color={colors.primary}/></TouchableOpacity>
      <Image
        className='h-12 w-24'
        source={require('../assets/logo.dark.png')}
      />
      </View>
        <ConnectButton
          title="Connect wallet"
          navigation={rightNavigation}
        />
      </View>
      </ImageBackground>
  );
}
