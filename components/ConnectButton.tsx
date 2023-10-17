import React, {ComponentProps, useState} from 'react';
import {Button, View} from 'react-native';

import {useAuthorization} from './providers/AuthorizationProvider';
import {publicKeyAtom} from './atoms/wallet';
import {useAtom} from 'jotai';
import SolendButton from './Button';
import Typography from './Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../colors';
import {formatAddress} from '@solendprotocol/solend-sdk';

type Props = Readonly<ComponentProps<typeof Button>>;

export default function ConnectButton(props: Props & {navigation: any}) {
  const {connect} = useAuthorization();
  const [authorizationInProgress] = useState(false);
  const [publicKey] = useAtom(publicKeyAtom);

  return (
    <>
      <SolendButton
        {...props}
        onPress={publicKey ? () => props.navigation.openDrawer() : connect}
        disabled={authorizationInProgress}>
        <View className="flex flex-row justify-center items-center">
          <Icon
            name="account-balance-wallet"
            color={colors.neutral}
            size={16}
          />
          <Typography color="neutral">
            {' '}
            {publicKey ? formatAddress(publicKey) : props.title}
          </Typography>
        </View>
      </SolendButton>
    </>
  );
}
