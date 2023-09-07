import React from 'react';
import {
    Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import ConnectButton from './ConnectButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';
import Modal from 'react-native-modal/dist/modal';
import Typography from './Typography';
import { useAtom, useSetAtom } from 'jotai';
import { poolsAtom, poolsWithMetaDataAtom, ReserveWithMetadataType, selectedPoolAddressAtom } from './atoms/pools';
import { formatAddress } from '@solendprotocol/solend-sdk';

function PoolRow({ reserves }: { reserves: Array<ReserveWithMetadataType> }) {
  const shownIcons = reserves.slice(0, 12);
  const extraIcons = reserves.slice(12);

  if (!reserves.length)
    return (
      <Typography level='label' color='secondary'>
        -
      </Typography>
    );
  return (
    <View className='flex flex-row'>
      {shownIcons
        .map((reserve) => (
            reserve.logo ? <Image
            className='h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line'
            source={{uri: reserve.logo}}
          /> : <View className='h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line flex items-center justify-center'>
              <Typography level='disclosure' color='secondary'>{reserve.address[0]}</Typography>
          </View>
        )).concat(
            <View className='h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line flex items-center justify-center'>
                <Typography level='disclosure' color='secondary'>+{extraIcons.length}</Typography>
            </View>
        )}
    </View>
  );
}

export function PoolsModal({visible, setVisible}: {visible: boolean, setVisible: (arg: boolean) => void}) {
    const windowWidth = Dimensions.get('window').width;
    const [pools] = useAtom(poolsWithMetaDataAtom);
    const setSelectedPoolAddress = useSetAtom(selectedPoolAddressAtom);

  return (
      

<Modal
// We use the state here to toggle visibility of Bottom Sheet 
  isVisible={visible}
  animationIn='slideInLeft'
  animationOut='slideOutLeft'
// We pass our function as default function to close the Modal
onBackdropPress={() => setVisible(false)}
onBackButtonPress={() => setVisible(false)} 
avoidKeyboard
style={{
  margin: 0
}}
>

    <View style={[styles.bottomSheet, { width: windowWidth * 0.6 }]} className='pt-2'>
    <Typography level='headline'>
        Pools
    </Typography>
    <FlatList
    className='w-full border-t border-line mt-2'
        data={Object.values(pools)}
        renderItem={(pool) => <Pressable onPress={() => {
            setSelectedPoolAddress(pool.item.address);
            setVisible(false);
            }} className='flex border-b border-line p-2 w-full'>
            <Typography>
                {pool.item.name ?? formatAddress(pool.item.address)}
            </Typography>
            <PoolRow reserves={pool.item.reserves}/> 
        </Pressable>}
    />
  </View>
</Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
      position: 'absolute',
      left: 0,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.neutral,
      top: 0,
      bottom: 0,
  },
});