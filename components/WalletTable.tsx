import React, {ReactNode} from 'react';
import {StyleSheet, Text, useColorScheme, View} from 'react-native';
import {Colors} from './Colors';
import { walletAssetsAtom } from './atoms/wallet';
import { useAtom } from 'jotai';

export const WalletTable = () => {
const [walletAssets] = useAtom(walletAssetsAtom);
  return (
    <View >
        <Text className='text-bold text-lg'>Wallet assets</Text>
    {walletAssets.map(a => <Text key={a.address }>
      {a.symbol}: {a.amount.toString()}
      </Text>)}
    </View>
  );
};