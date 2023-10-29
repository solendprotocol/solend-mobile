import {PublicKey} from '@solana/web3.js';
import {
  AuthorizeAPI,
  Base64EncodedAddress,
  DeauthorizeAPI,
  ReauthorizeAPI,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {toUint8Array} from 'js-base64';
import {useState, useCallback, useMemo, ReactNode, useEffect} from 'react';
import React from 'react';

import {RPC_ENDPOINT} from './ConnectionProvider';
import {useAtom, useSetAtom} from 'jotai';
import {
  publicKeyAtom,
  rawWalletDataAtom,
  setPublicKeyAtom,
} from '../atoms/wallet';
import {
  SelectedReserveType,
  poolsAtom,
  selectedPoolAtom,
  unqiueAssetsAtom,
} from '../atoms/pools';
import {configAtom} from '../atoms/config';
import {loadMetadataAtom} from '../atoms/metadata';
import {alertAndLog} from '../../util/alertAndLog';
import {switchboardAtom} from '../atoms/settings';
import {loadable} from 'jotai/utils';
import {loadObligationsAtom} from '../atoms/obligations';
import {ActionType} from '@solendprotocol/solend-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getPublicKeyFromAddress(address: Base64EncodedAddress): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}

export const APP_IDENTITY = {
  name: 'Solend Mobile',
  uri: 'https://solend.fi/',
  icon: 'icon.png',
};

export interface AuthorizationProviderContext {
  authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => void;
  deauthorizeSession: (wallet: DeauthorizeAPI) => void;
  connect: () => void;
  selectedReserve: SelectedReserveType | null;
  setSelectedReserve: (reserve: SelectedReserveType | null) => void;
  selectedAction: ActionType;
  setSelectedAction: (reserve: ActionType) => void;
  loadAll: () => void;
}

const AuthorizationContext = React.createContext<AuthorizationProviderContext>({
  authorizeSession: (_wallet: AuthorizeAPI & ReauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  deauthorizeSession: (_wallet: DeauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  connect: () => {
    throw new Error('AuthorizationProvider not initialized');
  },
  loadAll: () => {},
  selectedReserve: null,
  setSelectedReserve: () => {},
  selectedAction: 'deposit',
  setSelectedAction: () => {},
});

function AuthorizationProvider(props: {children: ReactNode}) {
  const [selectedReserve, setSelectedReserve] =
    useState<SelectedReserveType | null>(null);
  const setPublicKeyInAtom = useSetAtom(setPublicKeyAtom);
  const setSelectedPoolAddress = useSetAtom(selectedPoolAtom);
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const {children} = props;
  const setPools = useSetAtom(poolsAtom);
  const [switchboardProgram] = useAtom(loadable(switchboardAtom));
  const [selectedAction, setSelectedAction] = useState<ActionType>('deposit');
  const refreshWallet = useSetAtom(rawWalletDataAtom);
  const [publicKey] = useAtom(publicKeyAtom);
  const [config] = useAtom(configAtom);
  const [unqiueAssets] = useAtom(unqiueAssetsAtom);
  const [authorization, setAuthorization] = useState<{
    publicKey: PublicKey;
    authToken: string;
  } | null>(null);
  const loadObligation = useSetAtom(loadObligationsAtom);
  const loadMetadata = useSetAtom(loadMetadataAtom);

  const loadAll = useCallback(async () => {
    if (switchboardProgram.state !== 'hasData') {
      return;
    }
    const reloadPromises = [];
    // This blocks the JS thread too much
    // reloadPromises.push(loadPools());

    reloadPromises.push(setSelectedPoolAddress(null, true));
    if (publicKey) {
      reloadPromises.push(loadObligation(true));
      reloadPromises.push(refreshWallet());
    }
    await Promise.all(reloadPromises);
  }, [
    setSelectedPoolAddress,
    loadObligation,
    refreshWallet,
    switchboardProgram,
    publicKey,
  ]);

  useEffect(() => {
    setPublicKeyInAtom(authorization?.publicKey.toBase58() ?? null);
  }, [authorization?.publicKey, setPublicKeyInAtom]);

  async function onStart() {
    const [cachedAuthToken, cachedBase64Address] = await Promise.all([
      AsyncStorage.getItem('authToken'),
      AsyncStorage.getItem('base64Address'),
    ]);
    if (cachedBase64Address && cachedAuthToken) {
      const pubkeyAsByteArray = getPublicKeyFromAddress(cachedBase64Address);
      setAuthorization({
        publicKey: pubkeyAsByteArray,
        authToken: cachedAuthToken,
      });
      await setPublicKeyInAtom(authorization?.publicKey.toBase58() ?? null);
    }
    setSelectedPoolAddress('4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY');

    setPools(
      Object.fromEntries(
        config.map(pool => [
          pool.address,
          {
            name: pool.name,
            authorityAddress: pool.authorityAddress,
            address: pool.address,
            owner: pool.owner,
            reserves: [],
          },
        ]),
      ),
    );
  }

  useEffect(() => {
    onStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (unqiueAssets.length > 0) {
      loadMetadata();
    }
  }, [unqiueAssets.length, loadMetadata]);

  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI & ReauthorizeAPI) => {
      const authorizationResult = await (authorization
        ? wallet.reauthorize({
            auth_token: authorization.authToken,
            identity: APP_IDENTITY,
          })
        : wallet.authorize({
            cluster: RPC_ENDPOINT,
            identity: APP_IDENTITY,
          }));

      const firstAccount = authorizationResult.accounts[0];
      AsyncStorage.setItem('authToken', authorizationResult.auth_token);
      AsyncStorage.setItem('base64Address', firstAccount.address);
      setAuthorization({
        authToken: authorizationResult.auth_token,
        publicKey: getPublicKeyFromAddress(firstAccount.address),
      });
      return;
    },
    [authorization],
  );

  const connect = useCallback(async () => {
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

  const deauthorizeSession = useCallback(
    async (wallet: DeauthorizeAPI) => {
      if (authorization?.authToken == null) {
        return;
      }
      await wallet.deauthorize({auth_token: authorization.authToken});
      AsyncStorage.clear();
      setAuthorization(null);
    },
    [authorization, setAuthorization],
  );

  const value = useMemo(
    () => ({
      selectedReserve,
      selectedAction,
      authorizeSession,
      deauthorizeSession,
      setSelectedReserve,
      setSelectedAction,
      connect,
      loadAll,
    }),
    [
      selectedReserve,
      selectedAction,
      authorizeSession,
      deauthorizeSession,
      setSelectedReserve,
      setSelectedAction,
      connect,
      loadAll,
    ],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

const useAuthorization = () => React.useContext(AuthorizationContext);

export {AuthorizationProvider, useAuthorization};
