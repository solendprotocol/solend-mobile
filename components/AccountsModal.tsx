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
import { selectedObligationAtom } from './atoms/obligations';
import { formatToken, formatUsd } from '../util/numberFormatter';
import Metric from './Metric';
import UtilizationBar from './UtilizationBar';
import SolendButton from './Button';
import { publicKeyAtom, walletAssetsAtom } from './atoms/wallet';
import { useAuthorization } from './providers/AuthorizationProvider';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

export function AccountsModal({visible, setVisible}: {visible: boolean, setVisible: (arg: boolean) => void}) {
    const windowWidth = Dimensions.get('window').width;
    const [pools] = useAtom(poolsWithMetaDataAtom);
    const [walletAssets] = useAtom(walletAssetsAtom);
    const [publicKey] = useAtom(publicKeyAtom);
    const {deauthorizeSession} = useAuthorization();
    const setSelectedPoolAddress = useSetAtom(selectedPoolAddressAtom);
    const [selectedObligation, setSelectedObligation] = useAtom(
      selectedObligationAtom,
    );

  return (
      

<Modal
// We use the state here to toggle visibility of Bottom Sheet 
  isVisible={visible}
  animationIn='slideInRight'
  animationOut='slideOutRight'
// We pass our function as default function to close the Modal
onBackdropPress={() => setVisible(false)}
onBackButtonPress={() => setVisible(false)} 
avoidKeyboard
style={{
  margin: 0
}}
>

    <View style={[styles.bottomSheet, { width: windowWidth * 0.8}]} className='p-2'>
    <Typography level='headline'>
        Account ({formatAddress(publicKey ?? '')})
    </Typography>
    <View className='flex w-full flex-row mt-2 justify-between'>
      <SolendButton buttonStyle='tag'>
        <Typography level='caption'><Icon
          name='content-copy'
          size={8}
        />{' '}Copy address</Typography>
      </SolendButton>
      <SolendButton buttonStyle='tag' onPress={() => {
        transact(async wallet => {
          await deauthorizeSession(wallet);
        });
        setVisible(false);
        }}>
        <Typography level='caption' 
        ><Icon
          name='logout'
          size={8}
        />{' '}Disconnect</Typography>
      </SolendButton>
    </View>
   <View className='flex border border-line w-full flex-row mt-2 p-2 justify-between'>
    <Metric
    label='Net value'
    value={formatUsd(selectedObligation?.netAccountValue?.toString() ?? '0')}
    />
    <Metric
    label='Supply balance'
    align='center'
    value={formatUsd(selectedObligation?.totalSupplyValue?.toString() ?? '0')}
    />
    <Metric
    label='Borrow balance'
    align='right'
    value={formatUsd(selectedObligation?.totalBorrowValue?.toString() ?? '0')}
    />
    </View>

<View className='border-line p-2 border-l border-b border-r'>
    <View className='flex flex-row justify-between mb-2'>
    <Metric
    label='Weighted borrow'
    value={formatUsd(selectedObligation?.weightedTotalBorrowValue?.toString() ?? '0')}
    />
    <Metric
    label='Borrow limit'
    align='right'
    value={formatUsd(selectedObligation?.borrowLimit?.toString() ?? '0')}
    /></View>
    <UtilizationBar
      onClick={() => {}}
      showBreakdown={true}
    />
    <Metric
    row
    extraClassName='mt-2'
    label='Liquidation threshold'
    value={formatUsd(selectedObligation?.liquidationThreshold?.toString() ?? '0')}
    />
    </View>
  <View className='w-full flex flex-row mt-2 border-t border-line py-1 justify-between'>
    <Typography level='caption' color='secondary'>Asset supplied</Typography>
    <Typography level='caption' color='secondary'>Asset balance</Typography>
  </View>
  {selectedObligation?.deposits.map((position) => (
              <View
                key={position.reserveAddress}
                className='flex flex-row justify-between w-full'
              >
                <View>
                  <Typography>{position.symbol ?? 'Loading...'}</Typography>
                  <Typography color='secondary' level='label'>
                    {position.price ? formatUsd(position.price?.toString()) : 0}
                  </Typography>
                </View>
                <View>
                  <Typography>{formatToken(position.amount.toString())}</Typography>
                  <Typography color='secondary' level='label' textClassName='text-right'>
                    {formatUsd(position.amountUsd.toString())}
                  </Typography>
                </View>
              </View>
            ))}


<View className='w-full flex flex-row mt-2 border-t border-line py-1 justify-between'>
    <Typography level='caption' color='secondary'>Asset borrowed</Typography>
    <Typography level='caption' color='secondary'>Asset balance</Typography>
  </View>
  {selectedObligation?.borrows.map((position) => (
              <View
                key={position.reserveAddress}
                className='flex flex-row justify-between w-full'
              >
                <View>
                  <Typography>{position.symbol ?? 'Loading...'}</Typography>
                  <Typography color='secondary' level='label'>
                    {position.price ? formatUsd(position.price?.toString()) : 0}
                  </Typography>
                </View>
                <View>
                  <Typography>{formatToken(position.amount.toString())}</Typography>
                  <Typography color='secondary' level='label' textClassName='text-right'>
                    {formatUsd(position.amountUsd.toString())}
                  </Typography>
                </View>
              </View>
            ))}
            <View className='w-full flex flex-row mt-2 border-t border-line py-1 justify-between'>
                <Typography level='caption' color='secondary'>Wallet assets</Typography>
                <Typography level='caption' color='secondary'>Asset balance</Typography>
              </View>
  </View>
  
</Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
      position: 'absolute',
      right: 0,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.neutral,
      top: 0,
      bottom: 0,
  },
});