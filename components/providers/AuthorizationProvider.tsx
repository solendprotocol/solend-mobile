import {PublicKey} from '@solana/web3.js';
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
  ReauthorizeAPI,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {toUint8Array} from 'js-base64';
import {useState, useCallback, useMemo, ReactNode, useEffect} from 'react';
import React from 'react';

import {RPC_ENDPOINT} from './ConnectionProvider';
import { useAtom, useSetAtom } from 'jotai';
import { setPublicKeyAtom } from '../atoms/wallet';
import { loadPoolsAtom, poolsAtom, selectedPoolAddressAtom, selectedPoolAtom, unqiueAssetsAtom } from '../atoms/pools';
import { configAtom } from '../atoms/config';
import { loadMetadataAtom } from '../atoms/metadata';
import { alertAndLog } from '../../util/alertAndLog';

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

type Authorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

function getAccountFromAuthorizedAccount(account: AuthorizedAccount): Account {
  return {
    ...account,
    publicKey: getPublicKeyFromAddress(account.address),
  };
}

function getAuthorizationFromAuthorizationResult(
  authorizationResult: AuthorizationResult,
  previouslySelectedAccount?: Account,
): Authorization {
  let selectedAccount: Account;
  if (
    // We have yet to select an account.
    previouslySelectedAccount == null ||
    // The previously selected account is no longer in the set of authorized addresses.
    !authorizationResult.accounts.some(
      ({address}) => address === previouslySelectedAccount.address,
    )
  ) {
    const firstAccount = authorizationResult.accounts[0];
    selectedAccount = getAccountFromAuthorizedAccount(firstAccount);
  } else {
    selectedAccount = previouslySelectedAccount;
  }
  return {
    accounts: authorizationResult.accounts.map(getAccountFromAuthorizedAccount),
    authToken: authorizationResult.auth_token,
    selectedAccount,
  };
}

function getPublicKeyFromAddress(address: Base64EncodedAddress): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}

export const APP_IDENTITY = {
  name: 'React Native dApp',
  uri: 'https://solanamobile.com',
  icon: 'favicon.ico',
};

export interface AuthorizationProviderContext {
  accounts: Account[] | null;
  authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<Account>;
  deauthorizeSession: (wallet: DeauthorizeAPI) => void;
  connect: () => void;
  onChangeAccount: (nextSelectedAccount: Account) => void;
  selectedAccount: Account | null;
}

const AuthorizationContext = React.createContext<AuthorizationProviderContext>({
  accounts: null,
  authorizeSession: (_wallet: AuthorizeAPI & ReauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  deauthorizeSession: (_wallet: DeauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  connect: () => {
    throw new Error('AuthorizationProvider not initialized');
  }, 
  onChangeAccount: (_nextSelectedAccount: Account) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  selectedAccount: null,
});

function AuthorizationProvider(props: {children: ReactNode}) {
  const setPublicKeyInAtom = useSetAtom(setPublicKeyAtom);
  const setSelectedPoolAddress = useSetAtom(selectedPoolAddressAtom);
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const {children} = props;
  const setPools = useSetAtom(poolsAtom);
  const [config] = useAtom(configAtom);
  const loadPools = useSetAtom(loadPoolsAtom);
  const [unqiueAssets] = useAtom(unqiueAssetsAtom);
  const loadMetadata = useSetAtom(loadMetadataAtom);
  const [authorization, setAuthorization] = useState<Authorization | null>(
    null,
  );

  useEffect(() => {
    setPublicKeyInAtom(authorization?.selectedAccount?.publicKey.toBase58() ?? null);
  }, [authorization?.selectedAccount?.publicKey.toBase58(), setPublicKeyInAtom]);

  useEffect(() => {
    setSelectedPoolAddress('4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY');

    setPools(Object.fromEntries(
      config.map((pool) => [
        pool.address,
        {
          name: pool.name,
          authorityAddress: pool.authorityAddress,
          address: pool.address,
          owner: pool.owner,
          reserves: [],
        },
      ]),
    ));
    loadPools();
  }, [])

  useEffect(() => {
    if (unqiueAssets.length > 0) {
      loadMetadata();
    }
  }, [unqiueAssets.length]);


  const handleAuthorizationResult = useCallback(
    async (
      authorizationResult: AuthorizationResult,
    ): Promise<Authorization> => {
      const nextAuthorization = getAuthorizationFromAuthorizationResult(
        authorizationResult,
        authorization?.selectedAccount,
      );
      await setAuthorization(nextAuthorization);
      return nextAuthorization;
    },
    [authorization, setAuthorization],
  );
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
      return (await handleAuthorizationResult(authorizationResult))
        .selectedAccount;
    },
    [authorization, handleAuthorizationResult],
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
      setAuthorization(null);
    },
    [authorization, setAuthorization],
  );
  const onChangeAccount = useCallback(
    (nextSelectedAccount: Account) => {
      setAuthorization(currentAuthorization => {
        if (
          !currentAuthorization?.accounts.some(
            ({address}) => address === nextSelectedAccount.address,
          )
        ) {
          throw new Error(
            `${nextSelectedAccount.address} is not one of the available addresses`,
          );
        }
        return {
          ...currentAuthorization,
          selectedAccount: nextSelectedAccount,
        };
      });
    },
    [setAuthorization],
  );
  const value = useMemo(
    () => ({
      accounts: authorization?.accounts ?? null,
      authorizeSession,
      deauthorizeSession,
      connect,
      onChangeAccount,
      selectedAccount: authorization?.selectedAccount ?? null,
    }),
    [authorization, authorizeSession, deauthorizeSession, onChangeAccount, connect],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

const useAuthorization = () => React.useContext(AuthorizationContext);

export {AuthorizationProvider, useAuthorization};
