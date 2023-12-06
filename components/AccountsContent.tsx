import React, {useMemo} from 'react';
import BigNumber from 'bignumber.js';
import {Pressable, StyleSheet, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';
import Typography from './Typography';
import {useAtom} from 'jotai';
import {selectedPoolAtom} from './atoms/pools';
import {formatAddress} from '@solendprotocol/solend-sdk';
import {
  selectedObligationAddressAtom,
  selectedObligationAtom,
} from './atoms/obligations';
import {formatToken, formatUsd} from '../util/numberFormatter';
import Metric from './Metric';
import UtilizationBar from './UtilizationBar';
import SolendButton from './Button';
import {publicKeyAtom, walletAssetsAtom} from './atoms/wallet';
import {useAuthorization} from './providers/AuthorizationProvider';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {alertAndLog} from '../util/alertAndLog';

export default function AccountsContent({navigation}: {navigation: any}) {
  const [walletAssets] = useAtom(walletAssetsAtom);
  const [publicKey] = useAtom(publicKeyAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const {deauthorizeSession, connect, setSelectedReserve, setSelectedAction} =
    useAuthorization();
  const [selectedObligation] = useAtom(selectedObligationAtom);

  const walletContents = useMemo(
    () =>
      walletAssets.filter(
        asset =>
          selectedPool?.reserves
            .map(reserve => reserve.mintAddress)
            .includes(asset.mintAddress) && !asset.amount.isZero(),
      ),
    [walletAssets, selectedPool?.reserves],
  );

  if (!publicKey) {
    return (
      <View style={styles.bottomSheet} className="p-2">
        <SolendButton buttonStyle="tag" onPress={() => connect()}>
          <Typography level="caption">
            <Icon name="account-balance-wallet" size={8} /> Connect wallet
          </Typography>
        </SolendButton>
      </View>
    );
  }

  return (
    <>
      <Typography level="headline">
        Account ({formatAddress(publicKey ?? '')})
      </Typography>
      <View className="flex w-full flex-row mt-2 justify-between">
        <SolendButton
          buttonStyle="tag"
          onPress={() => {
            if (publicKey) {
              Clipboard.setString(publicKey);
              alertAndLog('Address copied!', publicKey);
            }
          }}>
          <Typography level="caption">
            <Icon name="content-copy" size={8} /> Copy address
          </Typography>
        </SolendButton>
        <SolendButton
          buttonStyle="tag"
          onPress={() => {
            transact(async wallet => {
              await deauthorizeSession(wallet);
            });
            navigation.closeDrawer();
          }}>
          <Typography level="caption">
            <Icon name="logout" size={8} /> Disconnect
          </Typography>
        </SolendButton>
      </View>
      <View className="flex border border-line w-full flex-row mt-2 p-2 justify-between">
        <Metric
          label="Net value"
          value={formatUsd(
            selectedObligation?.netAccountValue?.toString() ?? '0',
          )}
        />
        <Metric
          label="Supply balance"
          align="center"
          value={formatUsd(
            selectedObligation?.totalSupplyValue?.toString() ?? '0',
          )}
        />
        <Metric
          label="Borrow balance"
          align="right"
          value={formatUsd(
            selectedObligation?.totalBorrowValue?.toString() ?? '0',
          )}
        />
      </View>

      <View className="border-line p-2 border-l border-b border-r">
        <View className="flex flex-row justify-between mb-2">
          <Metric
            label="Weighted borrow"
            value={formatUsd(
              selectedObligation?.weightedTotalBorrowValue?.toString() ?? '0',
            )}
          />
          <Metric
            label="Borrow limit"
            align="right"
            value={formatUsd(
              selectedObligation?.borrowLimit?.toString() ?? '0',
            )}
          />
        </View>
        <UtilizationBar onClick={() => {}} showBreakdown={true} />
        <Metric
          row
          extraClassName="mt-2"
          label="Liquidation threshold"
          value={formatUsd(
            selectedObligation?.liquidationThreshold?.toString() ?? '0',
          )}
        />
      </View>
      <View className="w-full flex flex-row mt-2 border-t border-line py-1 justify-between">
        <Typography level="caption" color="secondary">
          Asset supplied
        </Typography>
        <Typography level="caption" color="secondary">
          Asset balance
        </Typography>
      </View>
      {selectedObligation?.deposits.map(position => (
        <Pressable
          key={position.reserveAddress}
          className="flex flex-row justify-between w-full py-1"
          onPress={() => {
            setSelectedReserve(
              selectedPool?.reserves.find(
                r => r.address === position.reserveAddress,
              ) ?? null,
            );
            setSelectedAction('withdraw');
          }}>
          <View>
            <Typography>{position.symbol ?? 'Loading...'}</Typography>
            <Typography color="secondary" level="label">
              {position.price ? formatUsd(position.price?.toString()) : 0}
            </Typography>
          </View>
          <View>
            <Typography>
              {formatToken(position.amount.toString())} {position.symbol}
            </Typography>
            <Typography
              color="secondary"
              level="label"
              textClassName="text-right">
              {formatUsd(position.amountUsd.toString())}
            </Typography>
          </View>
        </Pressable>
      ))}

      <View className="w-full flex flex-row mt-2 border-t border-line py-1 justify-between">
        <Typography level="caption" color="secondary">
          Asset borrowed
        </Typography>
        <Typography level="caption" color="secondary">
          Asset balance
        </Typography>
      </View>
      {selectedObligation?.borrows.map(position => (
        <Pressable
          key={position.reserveAddress}
          className="flex flex-row justify-between w-full py-1"
          onPress={() => {
            setSelectedReserve(
              selectedPool?.reserves.find(
                r => r.address === position.reserveAddress,
              ) ?? null,
            );
            setSelectedAction('repay');
          }}>
          <View>
            <Typography>{position.symbol ?? 'Loading...'}</Typography>
            <Typography color="secondary" level="label">
              {position.price ? formatUsd(position.price?.toString()) : 0}
            </Typography>
          </View>
          <View>
            <Typography>
              {formatToken(position.amount.toString())} {position.symbol}
            </Typography>
            <Typography
              color="secondary"
              level="label"
              textClassName="text-right">
              {formatUsd(position.amountUsd.toString())}
            </Typography>
          </View>
        </Pressable>
      ))}
      <View className="w-full flex flex-row mt-2 border-t border-line py-1 justify-between">
        <Typography level="caption" color="secondary">
          Wallet assets
        </Typography>
        <Typography level="caption" color="secondary">
          Asset balance
        </Typography>
      </View>
      {walletContents.map(mint => {
        const price =
          selectedPool?.reserves.find(r => r.mintAddress === mint.mintAddress)
            ?.price ?? new BigNumber(0);
        return (
          <Pressable
            key={mint.mintAddress}
            className="flex flex-row justify-between w-full py-1"
            onPress={() => {
              setSelectedReserve(
                selectedPool?.reserves.find(
                  r => r.mintAddress === mint.mintAddress,
                ) ?? null,
              );
              setSelectedAction('deposit');
            }}>
            <View>
              <Typography>{mint.symbol}</Typography>
              <Typography color="secondary" level="label">
                {formatUsd(price.toString())}
              </Typography>
            </View>
            <View>
              <Typography textClassName="text-right">
                {formatToken(mint.amount.toString())} {mint.symbol}
              </Typography>
              <Typography
                color="secondary"
                level="label"
                textClassName="text-right">
                {formatUsd(price.times(mint.amount).toString())}
              </Typography>
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    alignItems: 'center',
    backgroundColor: colors.neutral,
    height: '100%',
    justifyContent: 'center',
  },
});
