import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {getProgramId} from '@solendprotocol/solend-sdk';

export const DEBUG_MODE = Boolean(process.env.NEXT_PUBLIC_DEBUG);
export const SKIP_PREFLIGHT = Boolean(process.env.NEXT_PUBLIC_SKIP_PREFLIGHT);
export const ENVIRONMENT = WalletAdapterNetwork.Mainnet;
export const PROGRAM_ID = getProgramId(ENVIRONMENT).toBase58();
export const HOST_ATA = process.env.NEXT_PUBLIC_REACT_HOST_ATA;
export const DEFAULT_RPC_ENDPOINTS = [
  {
    name: 'Helius',
    endpoint:
      'https://rpc.helius.xyz/?api-key=96d88c32-e147-4ef8-88b0-18c758ca69df' as string,
  },
  {
    name: 'Alchemy RPC',
    endpoint:
      'https://solana-mainnet.g.alchemy.com/v2/ZT3c4pYf1inIrB0GVDNR7nx4LwyED5Ci' as string,
  },
].filter(Boolean) as Array<{name: string; endpoint: string}>;

export const MAIN_POOL_ADDRESS = '4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY';

export const ENDPOINTS = [
  {
    key: 'rpcpool',
    name: 'RPCPool',
    endpoint: process.env.NEXT_PUBLIC_RPCPOOL_RPC as string,
  },
  {
    key: 'alchemy',
    name: 'Alchemy',
    endpoint: process.env.NEXT_PUBLIC_ALCHEMY_RPC as string,
  },
];
