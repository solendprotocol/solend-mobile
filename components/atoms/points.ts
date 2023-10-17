import {atom} from 'jotai';
import BigNumber from 'bignumber.js';

export type PointsConfigType = Array<{
  reserve: string;
  market: string;
  side: 'borrow' | 'supply';
  weight: number;
}>;

export type PointsAccountType = {
  id: number;
  wallet: string;
  quantity: BigNumber;
  timestamp: number;
  slot: number;
  stale: boolean;
  rank: number;
  rankDelta: number;
  pointsPerSlot: BigNumber;
  pointsPerDay: BigNumber;
  adjustments: {
    margin_trade?: number;
    manual?: number;
    click?: number;
    claim?: number;
  };
};

export type ClickType = {
  status: 'requested' | 'clicked' | 'maxed' | 'unclicked';
  current: number | null;
  max: number | null;
};

export type PointsStatusType = 'requested' | 'clicked' | 'maxed' | 'unclicked';

export const userPointsAtom = atom<PointsAccountType | null>(null);
export const leaderboardPointsAtom = atom<Array<PointsAccountType> | null>(
  null,
);
export const configPointsAtom = atom<PointsConfigType | null>(null);
export const clickPointsAtom = atom<ClickType>({
  current: null,
  max: null,
  status: 'unclicked',
});
export const computedPointsAtom = atom<BigNumber | null>(null);
export const computedClicksAtom = atom<BigNumber | null>(null);
