import { PublicKey } from '@solana/web3.js';
import { atom } from 'jotai';
import {
  atomFamily,
  selectAtom,
} from 'jotai/utils';
import { publicKeyAtom } from './wallet';
import { connectionAtom, switchboardAtom } from './settings';
import { metadataAtom } from './metadata';
import { selectedObligationAtom } from './obligations';
import BigNumber from 'bignumber.js';
import {
  createObligationAddress,
  ReserveType,
  fetchPools,
  getReservesOfPool,
  parseLendingMarket,
  parseRateLimiter,
  PoolType,
} from '@solendprotocol/solend-sdk';
import { DEBUG_MODE, PROGRAM_ID } from '../../util/config';
import { atomWithRefresh } from './shared';

export type ReserveWithMetadataType = ReserveType & {
  symbol: string;
  logo: string | null;
};

export type SelectedReserveType = ReserveType & {
  symbol: string;
  logo: string | null;
};

export type SelectedPoolType = {
  name: string | null;
  address: string;
  reserves: Array<SelectedReserveType>;
};

export const poolsStateAtom = atom<'initial' | 'loading' | 'error' | 'done'>(
  (get) =>
    Object.values(get(poolsAtom)).reduce(
      (acc, p) => p.reserves.length + acc,
      0,
    ) === 0
      ? 'loading'
      : 'done',
);

export const poolsAtom = atom<{ [address: string]: PoolType }>({});

export const loadPoolsAtom = atom(
  (get) => {
    get(poolsAtom);
  },
  async (get, set) => {
    console.log(9999);
    const connection = get(connectionAtom);
    console.log(">>>>1");
    const pools = get(poolsAtom);
    console.log(">>>>2");
    const switchboardProgram = await get(switchboardAtom);
    console.log(">>>>3");
    const currentSlot = await get(currentSlotAtom);
    console.log(">>>>4");

    console.log(123, pools);

    set(
      poolsAtom,
      await fetchPools(
        Object.values(pools),
        connection,
        switchboardProgram,
        PROGRAM_ID,
        currentSlot,
        DEBUG_MODE,
      ),
    );
  },
);

export const poolsFamily = atomFamily((address: string) =>
  atom(
    (get) => {
      return get(poolsWithMetaDataAtom)[address];
    },
    (get, set, arg: PoolType) => {
      const prev = get(poolsAtom);
      set(poolsAtom, { ...prev, [address]: { ...prev[address], ...arg } });
    },
  ),
);

export const reserveToMintMapAtom = atom((get) => {
  const pools = get(poolsAtom);

  return Object.fromEntries(
    Object.values(pools)
      .flatMap((pool) => pool.reserves)
      .map((r) => [r.address, r.mintAddress]),
  );
});

export const poolsWithMetaDataAtom = atom((get) => {
  const metadata = get(metadataAtom);
  const pools = get(poolsAtom);

  return Object.fromEntries(
    Object.values(pools).map((p) => [
      p.address,
      {
        ...p,
        totalSupplyUsd: p.reserves.reduce(
          (acc, r) => r.totalSupplyUsd.plus(acc),
          BigNumber(0),
        ),
        reserves: p.reserves.map((r) => ({
          ...r,
          symbol: metadata[r.mintAddress]?.symbol,
          logo: metadata[r.mintAddress]?.logoUri,
        })),
      },
    ]),
  );
});

export const currentSlotAtom = atomWithRefresh(async (get) => {
  const connection = get(connectionAtom);
  return connection.getSlot();
});

export const rateLimiterAtom = atom(async (get) => {
  const selectedPoolAddress = get(selectedPoolAddressAtom);
  const connection = get(connectionAtom);
  if (!selectedPoolAddress) return null;
  const currentSlot = await get(currentSlotAtom);
  const pool = await connection.getAccountInfo(
    new PublicKey(selectedPoolAddress),
  );
  if (pool) {
    const raterLimiter = parseLendingMarket(
      new PublicKey(selectedPoolAddress),
      pool,
    ).info.rateLimiter;

    return parseRateLimiter(raterLimiter, currentSlot);
  }

  return null;
});

export const selectedPoolAddressAtom = atom<string | null>(null);

export const selectedReserveAddressAtom = atom<string | null>(null);

export const selectedPoolAtom = atom(
  (get) => {
    const selectedPoolAddress = get(selectedPoolAddressAtom);
    if (!selectedPoolAddress) return null;
    const metadata = get(metadataAtom);
    const selectedPool = get(poolsFamily(selectedPoolAddress));
    console.log(selectedPoolAddress, selectedPool);
    if (!selectedPool) return null;
    return {
      ...selectedPool,
      reserves: selectedPool.reserves.map((r) => {
        const addressString = r.mintAddress;
        const tokenMetadata = metadata[addressString];

        return {
          ...r,
          symbol: tokenMetadata?.symbol,
          logo: tokenMetadata?.logoUri,
        };
      }),
    };
  },
  async (get, set, newSelectedPoolAddress: string | null) => {
    if (!newSelectedPoolAddress) return;
    const [connection, publicKey] = await Promise.all([
      get(connectionAtom),
      get(publicKeyAtom),
    ])
    const switchboardProgram = await get(switchboardAtom);
    const poolToUpdateAtom = poolsFamily(newSelectedPoolAddress);
    if (!poolToUpdateAtom) {
      throw Error('Selected pool not found');
    }

    let newSelectedObligationAddress: string | null = null;
    if (publicKey) {
      newSelectedObligationAddress = await createObligationAddress(
        publicKey,
        newSelectedPoolAddress,
        PROGRAM_ID,
      );
    }
    const currentSlot = await get(currentSlotAtom);

    getReservesOfPool(
      new PublicKey(newSelectedPoolAddress),
      connection,
      switchboardProgram,
      PROGRAM_ID,
      currentSlot,
      DEBUG_MODE,
    );

    if (newSelectedObligationAddress) {
      set(selectedObligationAtom, newSelectedObligationAddress);
    }

    set(selectedPoolAddressAtom, newSelectedPoolAddress);
  },
);

export const selectedPoolStateAtom = atom<
  'initial' | 'loading' | 'error' | 'done'
>((get) =>
  (get(selectedPoolAtom)?.reserves?.length ?? 0) === 0 ? 'loading' : 'done',
);

export const unqiueAssetsAtom = selectAtom(
  poolsAtom,
  (pools) => {
    const assets = Object.values(pools).flatMap((p) =>
      p.reserves.map((r) => r.mintAddress),
    );
    return assets.filter((item, pos) => assets.indexOf(item) === pos);
  },
  (a, b) => {
    const sortB = b.sort();
    return (
      Boolean(a.length) && a.sort().every((val, index) => val === sortB[index])
    );
  },
);
