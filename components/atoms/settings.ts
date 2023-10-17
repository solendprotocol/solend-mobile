import {DEFAULT_RPC_ENDPOINTS} from '../../util/config';
import {atom} from 'jotai';
import {Connection} from '@solana/web3.js';
import SwitchboardProgram from '@switchboard-xyz/sbv2-lite';
import {atomWithRefresh} from './shared';

type RpcEndpoint = {
  name: string;
  endpoint: string;
};

export const selectedRpcAtom = atom<RpcEndpoint>(DEFAULT_RPC_ENDPOINTS[0]);

export const connectionAtom = atom<Connection>(get => {
  const rpc = get(selectedRpcAtom);
  return new Connection(rpc.endpoint, 'confirmed');
});

export const switchboardAtom = atom(get => {
  const connection = get(connectionAtom);
  return SwitchboardProgram.loadMainnet(connection);
});

export const currentSlotAtom = atomWithRefresh(async get => {
  const connection = get(connectionAtom);
  return connection.getSlot();
});

export const avgSlotTimeAtom = atomWithRefresh(async get => {
  const connection = get(connectionAtom);
  const currentSlot = await get(currentSlotAtom);

  const samples = await connection.getBlocks(
    currentSlot - 5000005,
    currentSlot - 5000000,
  );
  const startSlot = samples.find(Boolean);
  const startTime = startSlot ? await connection.getBlockTime(startSlot) : null;
  const currentTime = Date.now() / 1000;

  return startSlot && startTime
    ? (currentTime - startTime) / (currentSlot - startSlot)
    : null;
});
