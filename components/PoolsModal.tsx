import React from 'react';
import {FlatList, Image, Pressable, StyleSheet, View} from 'react-native';
import ConnectButton from './ConnectButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';
import Modal from 'react-native-modal/dist/modal';
import Typography from './Typography';
import {useAtom, useSetAtom} from 'jotai';
import {selectedPoolAtom} from './atoms/pools';
import {PoolMetadataCoreType, formatAddress} from '@solendprotocol/solend-sdk';
import {configAtom} from './atoms/config';

function PoolRow({reserves}: {reserves: PoolMetadataCoreType['reserves']}) {
  const shownIcons = reserves.slice(0, 12);
  const extraIcons = reserves.slice(12);

  if (!reserves.length) {
    return (
      <Typography level="label" color="secondary">
        -
      </Typography>
    );
  }
  return (
    <View className="flex flex-row">
      {shownIcons
        .map(reserve =>
          reserve.logo ? (
            <Image
              key={reserve.address}
              className="h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line"
              source={{uri: reserve.logo}}
            />
          ) : (
            <View
              key={reserve.mintAddress}
              className="h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line flex items-center justify-center">
              <Typography level="disclosure" color="secondary">
                {reserve.mintAddress[0]}
              </Typography>
            </View>
          ),
        )
        .concat(
          extraIcons.length > 1 ? (
            <View
              key="extra"
              className="h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line flex items-center justify-center">
              <Typography level="disclosure" color="secondary">
                +{extraIcons.length}
              </Typography>
            </View>
          ) : extraIcons.length === 1 ? (
            extraIcons[0].logo ? (
              <Image
                className="h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line"
                source={{uri: extraIcons[0].logo}}
              />
            ) : (
              <View
                key="extra"
                className="h-4 w-4 overflow-hidden rounded-full mr-[-6px] bg-line flex items-center justify-center">
                <Typography level="disclosure" color="secondary">
                  {extraIcons[0].mintAddress[0]}
                </Typography>
              </View>
            )
          ) : (
            <View key="extra" />
          ),
        )}
    </View>
  );
}

export function PoolsModal({navigation}: {navigation: any}) {
  const [config] = useAtom(configAtom);
  const setSelectedPoolAddress = useSetAtom(selectedPoolAtom);

  return (
    <View style={styles.bottomSheet} className="pt-2">
      <Typography level="headline">Pools</Typography>
      <FlatList
        className="w-full border-t border-line mt-2"
        data={Object.values(config)}
        renderItem={pool => (
          <Pressable
            key={pool.item.address}
            onPress={() => {
              setSelectedPoolAddress(pool.item.address);
              navigation.closeDrawer();
            }}
            className="flex border-b border-line p-2 w-full">
            <Typography>
              {pool.item.name ?? formatAddress(pool.item.address)}
            </Typography>
            <PoolRow reserves={pool.item.reserves} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.neutral,
  },
});
