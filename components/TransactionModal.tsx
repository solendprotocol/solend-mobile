import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {Section} from '../components/Section';
import ConnectButton from '../components/ConnectButton';
import AccountInfo from '../components/AccountInfo';
import {useFocusEffect} from '@react-navigation/native';
import {
  useAuthorization,
  Account,
} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import { publicKeyAtom, walletAssetsAtom } from '../components/atoms/wallet';
import { useAtom } from 'jotai';
import { SelectedReserveType, rateLimiterAtom, selectedPoolAtom } from '../components/atoms/pools';
import { ActionType, ReserveType, SolendActionCore, U64_MAX, titleCase } from '@solendprotocol/solend-sdk';
import { Web3MobileWallet, transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Connection, Transaction } from '@solana/web3.js';
import { alertAndLog } from '../util/alertAndLog';
import Typography from '../components/Typography';
import SplashScreen from 'react-native-splash-screen';
import colors from '../colors';
import BigNumber from 'bignumber.js';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReserveStats from '../components/ReserveStats';
import SolendButton from './Button';
import { selectedObligationAtom } from './atoms/obligations';
import { ActionConfig, borrowConfigs, repayConfigs, supplyConfigs, withdrawConfigs } from '../util/configs';
import ConfirmButton from './ConfirmButton';
import Result, { ResultConfigType } from './Result';
import { formatToken, formatUsd } from '../util/numberFormatter';

export default function TransactionModal({selectedReserve, setSelectedReserve, initialAction}: {selectedReserve: SelectedReserveType, setSelectedReserve: (reserve: SelectedReserveType | null) => void, initialAction: ActionType}) {
  const {connection} = useConnection();
  const inputEl = useRef<TextInput | null>(null);
  const [publicKey] = useAtom(publicKeyAtom);
  const [wallet] = useAtom(walletAssetsAtom);
  const [rateLimiter] = useAtom(rateLimiterAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [result, setResult] = useState<ResultConfigType | null>(null);
  const [selectedObligation] = useAtom(selectedObligationAtom);
  const [useUsd, setUseUsd] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ActionType>(initialAction)
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);

  function handleAmountChange(value: string) {
    if (useUsd) {
        setUsdAmount(value);
        setAmount(value.length ? new BigNumber(value).dividedBy(selectedReserve.price)
        .decimalPlaces(selectedReserve.decimals).toString() : '');
    } else {
        setAmount(value.length ? new BigNumber(value).decimalPlaces(selectedReserve.decimals).toString() : '');
        setUsdAmount(value.length ? new BigNumber(value).times(selectedReserve.price).toString() : '');
    }
  }

  function handleSelectAction(action: ActionType) {
    if (selectedAction !== action) {
        setAmount('')
    }
    setSelectedAction(action)
  }
  function handleClose() {
    setAmount('');
    setSelectedReserve(null);
  }

  useFocusEffect(
    useCallback(() => {
     // When the screen is focused
     const focus = () => {
      setTimeout(() => {
       inputEl?.current?.focus();
      }, 1);
     };
     focus();
     return focus; // cleanup
    }, []),
  );

  let config: ActionConfig;

  if (selectedAction === 'deposit') {
    config = supplyConfigs;
  } else if (selectedAction === 'borrow') {
    config = borrowConfigs;
  } else if (selectedAction === 'withdraw') {
    config = withdrawConfigs;
} else {
    config = repayConfigs;
}

const stats = config.getNewCalculations(selectedObligation, selectedReserve, amount);


const invalidMessage = supplyConfigs.verifyAction(
    new BigNumber(amount),
    selectedObligation,
    selectedReserve,
    wallet,
    rateLimiter
)

const sendTransaction = useCallback(async (txn: Transaction, connection: Connection) => {
    let txnHash = '';
    const signedTransaction = await transact(async (wallet: Web3MobileWallet) => {

      await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);

        const signedTransactions = await wallet.signTransactions({
          transactions: [txn],
        });
  
        return signedTransactions[0];
      });

      if (signingInProgress) {
        return txnHash;
      }

      setSigningInProgress(true);
      try {
        txnHash = await connection.sendRawTransaction(signedTransaction!.serialize())
      } catch (err: any) {
        alertAndLog(
          'Error during signing',
          err instanceof Error ? err.message : err,
        );
      } finally {
        setSigningInProgress(false);
      }
      return txnHash;
}, [authorizeSession, connection, transact, selectedReserve])

  const performAction = () => {
    const reserveConfig = selectedPool?.reserves.find(r => r.mintAddress === selectedReserve?.mintAddress);
    if (!publicKey || !selectedPool || !reserveConfig) return;

      const amountNominal = new BigNumber(amount)
        .shiftedBy(reserveConfig.decimals)
        .toFixed(0);
        
      return config.action(
        amountNominal,
        publicKey,
        selectedPool,
        reserveConfig,
        connection,
        sendTransaction,
        setResult
      );

  }
  const buttonText =
    !BigNumber(amount).isZero() && !BigNumber(amount).isNaN()
      ? invalidMessage ??
        `${titleCase(selectedAction)} ${new BigNumber(amount).toFormat()} ${
          selectedReserve.symbol
        }`
      : 'Enter an amount';

  return (
    <Modal
// We use the state here to toggle visibility of Bottom Sheet 
  isVisible={Boolean(selectedReserve)}
// We pass our function as default function to close the Modal
onBackdropPress={() => handleClose()}
onBackButtonPress={() => handleClose()} 
swipeDirection='down'
onSwipeComplete={() => handleClose()} 
swipeThreshold={25}
avoidKeyboard
style={{
  margin: 0
}}
>
    {result ? <View style={[styles.bottomSheet]} className='p-16 h-2/4'><Result result={result} setResult={setResult}/></View> : <View style={[styles.bottomSheet]} className='p-2 pb-4'>
      <View className='flex flex-row w-full'>
        <Pressable className={`basis-1/4 flex justify-center items-center h-12 bg-neutralAlt ${selectedAction === 'deposit' ? `border-t-2 border-primary bg-neutral` : 'border-t-2 border-neutralAlt'}`} onPress={() => handleSelectAction('deposit')}>
          <Typography level='headline'>Supply</Typography>
        </Pressable>
        <Pressable className={`basis-1/4 flex justify-center items-center h-12 bg-neutralAlt ${selectedAction === 'borrow' ? `border-t-2 border-primary bg-neutral` : 'border-t-2 border-neutralAlt'}`} onPress={() => handleSelectAction('borrow')}>
          <Typography level='headline'>Borrow</Typography>
        </Pressable>
        <Pressable className={`basis-1/4 flex justify-center items-center h-12 bg-neutralAlt ${selectedAction === 'withdraw' ? `border-t-2 border-primary bg-neutral` : 'border-t-2 border-neutralAlt'}`} onPress={() => handleSelectAction('withdraw')}>
          <Typography level='headline'>Withdraw</Typography>
        </Pressable>
        <Pressable className={`basis-1/4 flex justify-center items-center h-12 bg-neutralAlt ${selectedAction === 'repay' ? `border-t-2 border-primary bg-neutral` : 'border-t-2 border-neutralAlt'}`} onPress={() => handleSelectAction('repay')}>
          <Typography level='headline'>Repay</Typography>
        </Pressable>
      </View>
      <View className='w-full flex flex-row pt-8 justify-center items-center'>
      <Pressable className='w-12 h-12 border border-line rounded-full flex justify-center items-center' onPress={() => {
        if (!selectedReserve) return;
        setAmount(
        config.calculateMax(
            selectedReserve,
            wallet,
            selectedObligation,
            rateLimiter,
        ).toString()
      )}}>
          <Typography level='label'>MAX</Typography>
          </Pressable>
          <View 
  className='text-primary flex-auto flex flex-row items-center justify-center'
  >
  <Pressable
  className='text-primary'
  onPress={() => inputEl.current?.focus()}
  aria-disabled
  >{useUsd && <TextInput
  editable={false} 
  selectTextOnFocus={false}
  style={{
    fontSize: 40 - 1.4 * ((amount ?? '').toString().length + 1),
    color: amount.length ? colors.primary : colors.secondary,
  }}
  >
    $
    </TextInput>}</Pressable>
          <TextInput
          value={useUsd ? usdAmount : amount}
          onChangeText={handleAmountChange}
          ref={inputEl}
          caretHidden
          className='text-primary'
          autoFocus
          allowFontScaling
          style={{
            fontSize: 40 - 1.4 * ((amount ?? '').toString().length + 1)
          }}
  placeholder='0'
  textAlign='center'
  placeholderTextColor={colors.secondary}
  keyboardType='numeric'
          />
          <Pressable
          className='text-primary'
          onPress={() => inputEl.current?.focus()}
          aria-disabled
          >{!useUsd && <TextInput
          editable={false} 
          selectTextOnFocus={false}
          style={{
            fontSize: 40 - 1.4 * ((amount ?? '').toString().length + 1),
            color: amount.length ? colors.primary : colors.secondary,
          }}
          >
            {selectedReserve.symbol}
            </TextInput>}</Pressable>
          </View>
          <Pressable
            onPress={() => {
                setUseUsd(!useUsd);
            }}
            className='w-12 h-12 border border-line rounded-full flex justify-center items-center'
          >
          <Typography><Icon name='swap-vert' size={16}/></Typography>
          </Pressable>
      </View>
      <View className='w-full flex flex-row justify-center pb-8'>
        <Typography color='secondary' level='caption'>
            {useUsd ? `${formatToken(amount.length ? amount : '0', selectedReserve.decimals)} ${selectedReserve.symbol}` : (usdAmount.length ? formatUsd(usdAmount) : '$0')}
        </Typography>
       </View>
      {selectedReserve && <ReserveStats
        reserve={selectedReserve}
        action={selectedAction}
        {...stats}
      />}
      <ConfirmButton
        value={amount}
        onClick={() => performAction()}
        needsConnect={!publicKey}
        onFinish={setResult}
        finishText={publicKey ? buttonText : 'Connect your wallet'}
        action={selectedAction}
        disabled={Boolean(invalidMessage) || amount === '0'}
        symbol={selectedReserve.symbol}
      />
  </View>}
</Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
      position: 'absolute',
      backgroundColor: colors.neutral,
      justifyContent: 'flex-start',
      alignItems: 'center',
      left: 0,
      right: 0,
      bottom: 0,
  },
});
