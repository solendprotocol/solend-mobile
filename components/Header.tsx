import React, { useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import ConnectButton from './ConnectButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';
import { PoolsModal } from './PoolsModal';

export function Header() {
  const [isPoolsModalOpen, setIsPoolsModalOpen] = useState<boolean>(false);
  return (
    <>
    <PoolsModal visible={isPoolsModalOpen} setVisible={setIsPoolsModalOpen}/>
      <View className="p-2 border-b-2 border-line bg-neutral flex flex-row justify-between align-center">
    <View className='flex flex-row justify-between items-center'><TouchableOpacity onPress={() => setIsPoolsModalOpen(true)} className='flex justify-center'><Icon name="menu" size={32} color={colors.primary}/></TouchableOpacity>
      <Image
        className='h-12 w-24'
        source={require('../assets/logo.dark.png')}
      />
      </View>
        <ConnectButton
          title="Connect wallet"
        />
      </View>
      </>
  );
}
