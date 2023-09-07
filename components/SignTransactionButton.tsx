import React, {useState, useCallback} from 'react';
import {Button} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Keypair, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import {
  SolendActionCore,
} from '@solendprotocol/solend-sdk';
import {useAuthorization} from './providers/AuthorizationProvider';
import {useConnection} from './providers/ConnectionProvider';
import {alertAndLog} from '../util/alertAndLog';
import { useAtom } from 'jotai';
import { publicKeyAtom } from './atoms/wallet';
import { selectedPoolAtom } from './atoms/pools';

export default function SignTransactionButton() {
  const {connection} = useConnection();
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [publicKey] = useAtom(publicKeyAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);

  const signTransaction = useCallback(async () => {
    if (!publicKey || !selectedPool) return;
    return transact(async (wallet: Web3MobileWallet) => {
      // Construct a transaction. This transaction uses web3.js `SystemProgram`
      // to create a transfer that sends lamports to randomly generated address.
      const [authorizationResult, latestBlockhash] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);
      const solendAction = await SolendActionCore.buildDepositTxns(
        selectedPool,
        selectedPool.reserves.find(r => r.mintAddress === 'So11111111111111111111111111111111111111112')!,
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
    }).catch(e => console.log('sign error', e));
  }, [authorizeSession, connection]);

  return (
    <Button
      title="Sign Transaction"
      disabled={signingInProgress}
      onPress={async () => {
        if (signingInProgress) {
          return;
        }
        setSigningInProgress(true);
        try {
          const signedTransaction = await signTransaction();
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
      }}
    />
  );
}
