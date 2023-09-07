import { DEFAULT_RPC_ENDPOINTS } from '../../util/config';
import { atom } from 'jotai';
import { Connection } from '@solana/web3.js';
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";

type RpcEndpoint = {
  name: string;
  endpoint: string;
};

export const selectedRpcAtom = atom<RpcEndpoint>(
  DEFAULT_RPC_ENDPOINTS[0],
);

export const refreshCounterAtom = atom(0);

export const refreshPageAtom = atom(
  (get) => get(refreshCounterAtom),
  (_, set) => set(refreshCounterAtom, (i) => i + 1),
);

export const connectionAtom = atom<Connection>((get) => {
  const rpc = get(selectedRpcAtom);
  return new Connection(rpc.endpoint, 'confirmed');
});

export const switchboardAtom = atom(async (get) => {
  const connection = get(connectionAtom);
  try {
    await SwitchboardProgram.loadMainnet(connection);
  } catch(e: any) {
    console.log('error');
    console.log(e.stack);
    console.log('end error');
  }
  return SwitchboardProgram.loadMainnet(connection);
});
