import React, {useCallback, useEffect, useState} from 'react';
import {Button, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {Section} from '../components/Section';
import ConnectButton from '../components/ConnectButton';
import AccountInfo from '../components/AccountInfo';
import {
  useAuthorization,
  Account,
} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import SignMessageButton from '../components/SignMessageButton';
import SignTransactionButton from '../components/SignTransactionButton';
import { publicKeyAtom, walletAssetsAtom } from '../components/atoms/wallet';
import { useAtom } from 'jotai';
import { WalletTable } from '../components/WalletTable';
import { selectedPoolAtom } from '../components/atoms/pools';
import { ReserveType, SolendActionCore } from '@solendprotocol/solend-sdk';
import { Web3MobileWallet, transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Transaction } from '@solana/web3.js';
import { alertAndLog } from '../util/alertAndLog';
import Typography from '../components/Typography';
import Metric from '../components/Metric';
import { formatToken } from '../util/numberFormatter';

export default function MainScreen() {
  const {connection} = useConnection();
  const {selectedAccount} = useAuthorization();
  const [balance, setBalance] = useState<number | null>(null);
  const [publicKey] = useAtom(publicKeyAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);
  // We need to get the height of the phone and use it relatively, 
  // This is because height of phones vary
  const windowHeight = Dimensions.get('window').height;
  
  // This state would determine if the drawer sheet is visible or not
  const [selectedReserve, setSelectedReserve] = useState<ReserveType | null>(null);

  const fetchAndUpdateBalance = useCallback(
    async (account: Account) => {
      console.log('Fetching balance for: ' + account.publicKey);
      const fetchedBalance = await connection.getBalance(account.publicKey);
      console.log('Balance fetched: ' + fetchedBalance);
      setBalance(fetchedBalance);
    },
    [connection],
  );

  useEffect(() => {
    if (!selectedAccount) {
      return;
    }
    fetchAndUpdateBalance(selectedAccount);
  }, [fetchAndUpdateBalance, selectedAccount]);


  const signTransaction = useCallback(async () => {
    if (!publicKey || !selectedPool) return;
    const signedTransaction = await transact(async (wallet: Web3MobileWallet) => {
      // Construct a transaction. This transaction uses web3.js `SystemProgram`
      // to create a transfer that sends lamports to randomly generated address.
      const [authorizationResult, latestBlockhash] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);
      const solendAction = await SolendActionCore.buildDepositTxns(
        selectedPool,
        selectedPool.reserves.find(r => r.mintAddress === selectedReserve?.mintAddress)!,
        connection,
        '1000',
        authorizationResult.publicKey,
      );
  

    const lendingTxn = new Transaction({
      feePayer: authorizationResult.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
    }).add(...solendAction.setupIxs, ...solendAction.preTxnIxs, ...solendAction.lendingIxs, ...solendAction.postTxnIxs, ...solendAction.cleanupIxs);

      // Sign a transaction and receive
      const signedTransactions = await wallet.signTransactions({
        transactions: [lendingTxn],
      });

      return signedTransactions[0];
    });


    if (signingInProgress) {
      return;
    }
    setSigningInProgress(true);
    try {
      const txHash = await connection.sendRawTransaction(signedTransaction!.serialize())
      await connection.confirmTransaction(txHash, 'finalized');
      alertAndLog(
        'Transaction signed',
        'View SignTransactionButton.tsx for implementation.',
      );
    } catch (err: any) {
      alertAndLog(
        'Error during signing',
        err instanceof Error ? err.message : err,
      );
    } finally {
      setSigningInProgress(false);
    }
  }, [authorizeSession, connection, selectedReserve?.mintAddress]);

  return (
    <>
    <Modal
// We use the state here to toggle visibility of Bottom Sheet 
  isVisible={Boolean(selectedReserve)}
// We pass our function as default function to close the Modal
onBackdropPress={() => setSelectedReserve(null)}
onBackButtonPress={() => setSelectedReserve(null)} 
avoidKeyboard
style={{
  margin: 0
}}
>

    <View style={[styles.bottomSheet, { height: windowHeight * 0.6 }]}>
      <View style={{ flex: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row' }}>
        <Pressable onPress={() => setSelectedReserve(null)}>
          <Text>x</Text>
        </Pressable>
      </View>
      <View style={{ paddingVertical: 16 }}>
        <Text> 1000 decimals of {selectedReserve?.symbol}</Text>
       <Button title='Deposit' onPress={() => signTransaction()}/>
       <Button title='Borrow'/>
       <Button title='Withdraw'/>
       <Button title='Repay'/>
    </View>
  </View>
</Modal>
      <View style={styles.mainContainer} className="bg-neutral">
        <Text>
          {publicKey}
        </Text>
        {/* Forces tailwind to load the colors */}
        <View className='hidden'>
        <Text className='text-primary'>
          x
        </Text>

        <Text className='text-secondary'>
          x
        </Text>

        <Text className='text-line'>
          x
        </Text>

        <Text className='text-neutralAlt'>
          x
        </Text>

        <Text className='text-neutral'>
          x
        </Text>

        <Text className='text-overlay'>
          x
        </Text>

        <Text className='text-brandAlt'>
          x
        </Text>

        <Text className='text-brand'>
          x
        </Text>
        </View>
        <View
          >
          {selectedAccount ? (
            <>
              <WalletTable
              />
            </>
          ) : null}
          <Typography level='display'>
            Pool assets
          </Typography>
            <FlatList
              data={selectedPool?.reserves}
              renderItem={(item) => <TouchableOpacity onPress={() => setSelectedReserve(item.item)} className='flex flex-row justify-between'>
              <Typography>{item.item.symbol}</Typography>
              <Metric
                label='Total supply'  
                row
                value={formatToken(item.item.totalSupply.toString())}
              />
              </TouchableOpacity>}
            />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    height: '100%',
    flex: 1,
  },
  scrollContainer: {
    height: '100%',
  },
  buttonGroup: {
    flexDirection: 'column',
    paddingVertical: 4,
  },
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  bottomSheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: 'white',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      paddingVertical: 23,
      paddingHorizontal: 25,
      bottom: 0,
      borderWidth: 1,
      borderColor: 'red'
  },
});
