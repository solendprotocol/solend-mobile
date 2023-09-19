import React, {useCallback, useEffect, useRef, useState} from 'react';
import { FlatList, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import { publicKeyAtom } from '../components/atoms/wallet';
import { useAtom } from 'jotai';
import { SelectedReserveType, selectedPoolAtom } from '../components/atoms/pools';
import { ReserveType, U64_MAX } from '@solendprotocol/solend-sdk';
import Typography from '../components/Typography';
import Metric from '../components/Metric';
import { formatPercent, formatToken, formatUsd } from '../util/numberFormatter';
import SplashScreen from 'react-native-splash-screen';
import BigNumber from 'bignumber.js';
import colors from '../colors';
import TransactionModal from '../components/TransactionModal';
import ColorRender from '../components/ColorRender';

export default function MainScreen() {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedReserve, setSelectedReserve] = useState<SelectedReserveType | null>(null);
  const [showDisabled, setShowDisabled] = useState(false);
  const reserves =
    (showDisabled
      ? selectedPool?.reserves
      : selectedPool?.reserves.filter((r) => !r.disabled)
    )?.sort((a, b) => a.totalSupplyUsd.isGreaterThan(b.totalSupplyUsd) ? -1 : 1) ?? [];

  useEffect(() => {
    SplashScreen.hide()
  }, []);

  const totalSupplyUsd =
    selectedPool?.reserves.reduce(
      (arr, r) => r.totalSupplyUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);
  const totalBorrowUsd =
    selectedPool?.reserves.reduce(
      (arr, r) => r.totalBorrowUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);
  const totalAvailableUsd =
    selectedPool?.reserves.reduce(
      (arr, r) => r.availableAmountUsd.plus(arr),
      BigNumber(0),
    ) ?? new BigNumber(0);

  return (
    <View
      className="bg-neutral p-4 grow flex"
    >
    {selectedReserve && <TransactionModal
    selectedReserve={selectedReserve}
    setSelectedReserve={setSelectedReserve}
    initialAction='deposit'
    />}
        <ColorRender />
          <Typography level='headline' textClassName='mb-1'>
            Pool assets
          </Typography>
          <View
            className='border-t border-line flex justify-between flex-row mb-4 pt-2'
          >
            <Metric
              label='Total supply'
              align='center'
              value={!totalSupplyUsd.isEqualTo(0) ? `${formatUsd(totalSupplyUsd.toString())}` : '-'}
            />
            <Metric
              label='Total borrow'
              align='center'
              value={!totalBorrowUsd.isEqualTo(0) ? `${formatUsd(totalBorrowUsd.toString())}` : '-'}
            />
            <Metric
              label='TVL'
              align='center'
              value={!totalAvailableUsd.isEqualTo(0) ? `${formatUsd(totalAvailableUsd.toString())}` : '-'}
            />
          </View>
          <Typography level='headline' textClassName='mb-1'>
            Assets
          </Typography>
          <View className='flex-1'>
            <FlatList
            className='border-t border-line'
              data={reserves}
              style={{ flex: 1 }}
              renderItem={(item) => {
              

        const atSupplyLimit =
        item.item.reserveSupplyCap.eq(0) ||
        item.item.totalSupply.isGreaterThanOrEqualTo(
          item.item.reserveSupplyCap.times(
            Math.min(0.9999, 1 - 1 / Number(item.item.reserveSupplyCap)),
          ),
        );

      const atBorrowLimit =
        item.item.reserveBorrowCap.eq(0) ||
        item.item.totalBorrow.isGreaterThanOrEqualTo(
          item.item.reserveBorrowCap.times(
            Math.min(0.9999, 1 - 1 / Number(item.item.reserveBorrowCap)),
          ),
        );


              return <Pressable key={item.item.address} onPress={() => setSelectedReserve(item.item)} className='flex flex-row justify-between py-2 border-line border-b'>
                <View className='w-32 flex justify-center items-center'>
                {item.item.logo ? <Image
            className='h-8 w-8 overflow-hidden rounded-full m-2'
            source={{uri: item.item.logo}}
          /> : <View className='h-8 w-8 overflow-hidden rounded-full bg-line flex items-center justify-center border-b'>
              <Typography level='disclosure' color='secondary'>{item.item.address[0]}</Typography>
          </View>}
              <Typography>{item.item.symbol}</Typography>
              <Typography level='caption' color='secondary'>{formatUsd(item.item.price.toString())}</Typography>
              </View>
              <View className='flex-auto'>
                <View className='flex flex-row justify-between'>
                <Typography level='title'>
                  {formatPercent(item.item.supplyInterest.toString())} <Typography level='caption' color='secondary'>Supply APR</Typography>
                </Typography>
                <Typography level='title'>
                  {formatPercent(item.item.borrowInterest.toString())} <Typography level='caption' color='secondary'>Borrow APR</Typography>
                </Typography>
                </View>
                <Metric
                  label='Total supply'  
                  row
                  color={atSupplyLimit ? 'secondary' : undefined}
                  value={`${formatToken(item.item.totalSupply.toString())} ${item.item.symbol}`}
                />
              <Metric
                label='Total borrow'  
                row
                color={atBorrowLimit ? 'secondary' : undefined}
                value={`${formatToken(item.item.totalBorrow.toString())} ${item.item.symbol}`}
              />
              <Metric
                  label='Open LTV/BW'  
                  row
                  value={<>{formatPercent(item.item.loanToValueRatio, false, 0)}
                  
                  <Typography color='secondary' level='caption'>
                        {' '}/{' '}
                      </Typography>
                      
                      {item.item.addedBorrowWeightBPS.toString() !== U64_MAX
                          ? formatToken(
                              item.item.borrowWeight.toString(),
                              2,
                              false,
                              false,
                            )
                          : '∞'}
                    </>}
                />
              </View>
              </Pressable>}}
            />
            </View>
        <Pressable 
          onPress={() => setShowDisabled(!showDisabled)}
          className='flex flex-row justify-center items-center'
        >
          <View className='border-b border-line w-full absolute'/>
            <View className=' px-2 bg-neutral flex flex-row justify-center items-center'>
              <Typography color='secondary'>{showDisabled ? 'Hide' : 'Show'} deprecated</Typography>
            </View>
        </Pressable>
      </View>
  );
}