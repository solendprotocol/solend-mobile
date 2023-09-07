import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, {ComponentProps, useState, useCallback} from 'react';
import {Button, Text, View} from 'react-native';

import {useAuthorization} from './providers/AuthorizationProvider';
import {alertAndLog} from '../util/alertAndLog';
import { publicKeyAtom } from './atoms/wallet';
import { useAtom } from 'jotai';
import SolendButton from './Button';
import Typography from './Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';
import { formatAddress } from '@solendprotocol/solend-sdk';
import { AccountsModal } from './AccountsModal';

type Props = Readonly<ComponentProps<typeof Button>>;

const WALLET_PREFIX_SUFFIX_LENGTH = 6;

export default function ConnectButton(props: Props) {
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState<boolean>(false);
  const {authorizeSession} = useAuthorization();
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const [publicKey] = useAtom(publicKeyAtom);
  const handleConnectPress = useCallback(async () => {
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await transact(async wallet => {
        await authorizeSession(wallet);
      });
    } catch (err: any) {
      alertAndLog(
        'Error during connect',
        err instanceof Error ? err.message : err,
      );
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress, authorizeSession]);
  return (
    <>
    <AccountsModal
     visible={isAccountsModalOpen}
     setVisible={setIsAccountsModalOpen}
    />
      <SolendButton
      {...props} onPress={publicKey ? () => setIsAccountsModalOpen(true) : handleConnectPress} disabled={authorizationInProgress}>
        <View className='flex flex-row justify-center items-center'>
        <Icon name='account-balance-wallet' color={colors.neutral} size={16}/>
        <Typography color='neutral'>
          {' '}
        {publicKey ? formatAddress(publicKey) : props.title}
        </Typography></View>
      </SolendButton>
    </>
  );
}
