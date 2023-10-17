import React, {useEffect, useState} from 'react';
import {FlatList, Image, Pressable, View} from 'react-native';
import {useAtom} from 'jotai';
import {selectedPoolAtom, selectedPoolStateAtom} from '../components/atoms/pools';
import {U64_MAX} from '@solendprotocol/solend-sdk';
import Typography from '../components/Typography';
import Metric from '../components/Metric';
import {formatPercent, formatToken, formatUsd} from '../util/numberFormatter';
import SplashScreen from 'react-native-splash-screen';
import BigNumber from 'bignumber.js';
import TransactionModal from '../components/TransactionModal';
import {useAuthorization} from '../components/providers/AuthorizationProvider';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../colors';
import {GradientText} from '../components/GradientText';
import ColorRender from '../components/ColorRender';
import {configPointsAtom} from '../components/atoms/points';

function MainScreen() {
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPoolState] = useAtom(selectedPoolStateAtom);
  const [config] = useAtom(configPointsAtom);
  const {loadAll, selectedReserve, setSelectedReserve} = useAuthorization();
  const [showDisabled, setShowDisabled] = useState(false);
  const reserves =
    (showDisabled
      ? selectedPool?.reserves
      : selectedPool?.reserves.filter(r => !r.disabled)
    )?.sort((a, b) =>
      a.totalSupplyUsd.isGreaterThan(b.totalSupplyUsd) ? -1 : 1,
    ) ?? [];

  useEffect(() => {
    SplashScreen.hide();
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
    <View className="bg-neutral p-4 grow flex">
      {selectedReserve && (
        <TransactionModal
          selectedReserve={selectedReserve}
          setSelectedReserve={setSelectedReserve}
        />
      )}
      <ColorRender />
      <Typography level="headline" textClassName="mb-1">
        Pool assets
      </Typography>
      <View className="border-t border-line flex justify-between flex-row mb-4 pt-2">
        <Metric
          label="Total supply"
          align="center"
          value={
            !totalSupplyUsd.isEqualTo(0)
              ? `${formatUsd(totalSupplyUsd.toString())}`
              : '-'
          }
        />
        <Metric
          label="Total borrow"
          align="center"
          value={
            !totalBorrowUsd.isEqualTo(0)
              ? `${formatUsd(totalBorrowUsd.toString())}`
              : '-'
          }
        />
        <Metric
          label="TVL"
          align="center"
          value={
            !totalAvailableUsd.isEqualTo(0)
              ? `${formatUsd(totalAvailableUsd.toString())}`
              : '-'
          }
        />
      </View>
      <Typography level="headline" textClassName="mb-1">
        Assets
      </Typography>
      <View className="flex-1">
        <FlatList
          className="border-t border-line flex-1"
          refreshing={isFetching || selectedPoolState === 'loading'}
          onRefresh={async () => {
            setIsFetching(true);
            await loadAll();
            setIsFetching(false);
          }}
          data={reserves}
          renderItem={item => {
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

            const supplyConfig = config?.find(
              c => c.reserve === item.item.address && c.side === 'supply',
            );
            const borrowConfig = config?.find(
              c => c.reserve === item.item.address && c.side === 'borrow',
            );

            return (
              <Pressable
                key={item.item.address}
                onPress={() => setSelectedReserve(item.item)}
                className="px-2 flex flex-row justify-between py-2 border-line border-b">
                <View className="w-24 flex justify-center items-center">
                  {item.item.logo ? (
                    <Image
                      className="h-8 w-8 overflow-hidden rounded-full m-2"
                      source={{uri: item.item.logo}}
                    />
                  ) : (
                    <View className="h-8 w-8 overflow-hidden rounded-full bg-line flex items-center justify-center border-b">
                      <Typography level="disclosure" color="secondary">
                        {item.item.address[0]}
                      </Typography>
                    </View>
                  )}
                  <Typography>{item.item.symbol ?? ''}</Typography>
                  <Typography level="caption" color="secondary">
                    {formatUsd(item.item.price.toString())}
                  </Typography>
                </View>
                <View className="flex-auto">
                  <View className="flex flex-row justify-around mt-2 mb-3">
                    <Metric
                      label="Supply APR"
                      align="center"
                      value={
                        <View className="flex flex-row justify-between align-center">
                          <Typography level="title">
                            {formatPercent(item.item.supplyInterest.toString())}
                          </Typography>
                          {supplyConfig && (
                            <LinearGradient
                              colors={[colors.brand, colors.brandAlt]}
                              className="absolute right-[-48px] bottom-0 ml-1 p-[1px] rounded-full border flex flex-row justify-center items-center">
                              <View className="px-2 rounded-full bg-neutral borderflex flex-row justify-center items-center">
                                <GradientText
                                  fontSize={10}
                                  colors={[colors.brand, colors.brandAlt]}>
                                  {supplyConfig?.weight}x◉
                                </GradientText>
                              </View>
                            </LinearGradient>
                          )}
                        </View>
                      }
                    />
                    <Metric
                      label="Borrow APR"
                      align="center"
                      value={
                        <View className="flex flex-row justify-between align-center">
                          <Typography level="title">
                            {formatPercent(item.item.borrowInterest.toString())}
                          </Typography>
                          {borrowConfig && (
                            <LinearGradient
                              colors={[colors.brand, colors.brandAlt]}
                              className="absolute right-[-48px] bottom-0 ml-1 p-[1px] h-5 rounded-full border flex flex-row justify-center items-center">
                              <View className="px-2 rounded-full bg-neutral borderflex flex-row justify-center items-center">
                                <GradientText
                                  fontSize={10}
                                  colors={[colors.brand, colors.brandAlt]}>
                                  {borrowConfig?.weight}x◉
                                </GradientText>
                              </View>
                            </LinearGradient>
                          )}
                        </View>
                      }
                    />
                  </View>
                  <View className="bg-neutralAlt px-2 py-1">
                    <Metric
                      label="Total supply"
                      row
                      color={atSupplyLimit ? 'secondary' : undefined}
                      value={
                        <Typography level="caption">
                          {formatToken(item.item.totalSupply.toString())}{' '}
                          {item.item.symbol ?? ''}
                        </Typography>
                      }
                    />
                    <Metric
                      label="Total borrow"
                      row
                      color={atBorrowLimit ? 'secondary' : undefined}
                      value={
                        <Typography level="caption">
                          {formatToken(item.item.totalBorrow.toString())}{' '}
                          {item.item.symbol ?? ''}
                        </Typography>
                      }
                    />
                    <Metric
                      label="Open LTV/BW"
                      row
                      value={
                        <Typography level="caption">
                          {formatPercent(item.item.loanToValueRatio, false, 0)}

                          <Typography color="secondary" level="caption">
                            {' '}
                            /{' '}
                          </Typography>

                          {item.item.addedBorrowWeightBPS.toString() !== U64_MAX
                            ? formatToken(
                                item.item.borrowWeight.toString(),
                                2,
                                false,
                                false,
                              )
                            : '∞'}
                        </Typography>
                      }
                    />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
      <Pressable
        onPress={() => setShowDisabled(!showDisabled)}
        className="flex flex-row justify-center items-center">
        <View className="border-b border-line w-full absolute" />
        <View className=" px-2 bg-neutral flex flex-row justify-center items-center">
          <Typography color="secondary">
            {showDisabled ? 'Hide' : 'Show'} deprecated
          </Typography>
        </View>
      </Pressable>
    </View>
  );
}

export default React.memo(MainScreen);
