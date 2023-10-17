import React, {useEffect} from 'react';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import {useAtom, useSetAtom} from 'jotai';
import {
  PointsAccountType,
  clickPointsAtom,
  computedClicksAtom,
  computedPointsAtom,
  configPointsAtom,
  leaderboardPointsAtom,
  userPointsAtom,
} from './atoms/points';
import {publicKeyAtom} from './atoms/wallet';
import {avgSlotTimeAtom, currentSlotAtom} from './atoms/settings';
import {useInterval} from './providers/useInterval';

export type PointsAccountResponseType = {
  id: number;
  wallet: string;
  quantity: string;
  timestamp: number;
  slot: number;
  stale: boolean;
  rank: number;
  rankDelta: number;
  pointsPerSlot: string;
  adjustments: {
    margin_trade?: number;
    manual?: number;
    click?: number;
    claim?: number;
  };
};

function parsePointsAccount(
  account: PointsAccountResponseType,
  avgSlotTime: number,
): PointsAccountType {
  return {
    ...account,
    rank: (account.rank ?? -1) + 1,
    pointsPerSlot: new BigNumber(account.pointsPerSlot ?? 0),
    quantity: new BigNumber(account.quantity ?? 0),
    pointsPerDay: new BigNumber(account.pointsPerSlot ?? 0).times(
      new BigNumber(86400).dividedBy(new BigNumber(avgSlotTime)),
    ),
  };
}

const API_HOST = 'https://api.solend.fi';
const LEADERBOARD_ENDPOINT = `${API_HOST}/points/leaderboard`;
const POINTS_ENDPOINT = `${API_HOST}/points?wallet=`;
const BREAKDOWN_ENDPOINT = `${API_HOST}/points/adjustments?wallet=`;
const CONFIG_ENDPOINT = `${API_HOST}/points/config`;
export const CLICK_ENDPOINT = `${API_HOST}/points/click?wallet=`;

export default function PointsLoader({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const setConfig = useSetAtom(configPointsAtom);
  const setLeaderboard = useSetAtom(leaderboardPointsAtom);

  const [publicKey] = useAtom(publicKeyAtom);
  const [userPoints, setUserPoints] = useAtom(userPointsAtom);
  const [currentSlot] = useAtom(currentSlotAtom);
  const [computedPoints, setComputedPoints] = useAtom(computedPointsAtom);
  const [computedClicks, setComputedClicks] = useAtom(computedClicksAtom);
  const [avgSlotTime] = useAtom(avgSlotTimeAtom);
  const [clicked, setClicked] = useAtom(clickPointsAtom);

  const avgSlotTimeUsed = avgSlotTime ?? 0;

  useInterval(() => {
    if (userPoints) {
      setComputedPoints(
        (computedPoints ?? userPoints.quantity)
          .plus(userPoints.pointsPerSlot)
          .plus(
            clicked.status === 'clicked' ? new BigNumber(1) : new BigNumber(0),
          ),
      );
      if (clicked.status === 'clicked') {
        setComputedClicks(
          (
            computedClicks ?? new BigNumber(userPoints.adjustments.click ?? 0)
          ).plus(BigNumber(1)),
        );
      }
      if (clicked.status !== 'unclicked') {
        setClicked({
          ...clicked,
          status: 'unclicked',
        });
      }
    }
  }, avgSlotTimeUsed * 1000);

  async function loadData() {
    axios.get(LEADERBOARD_ENDPOINT).then(res => {
      setLeaderboard(
        res.data.map((res: PointsAccountResponseType) =>
          parsePointsAccount(res, avgSlotTimeUsed),
        ),
      );
    });

    axios.get(CONFIG_ENDPOINT).then(res => {
      setConfig(res.data);
    });

    if (publicKey) {
      const user = parsePointsAccount(
        (await axios.get(`${POINTS_ENDPOINT}${publicKey}`)).data,
        avgSlotTimeUsed,
      );

      axios.get(`${BREAKDOWN_ENDPOINT}${publicKey}`).then(res => {
        const data = res.data as Array<{
          quantity: number;
          type: string;
        }>;
        const clickPoints = data.reduce(
          (acc, entry) => acc + (entry.type === 'click' ? entry.quantity : 0),
          0,
        );
        const marginPoints = data.reduce(
          (acc, entry) =>
            acc + (entry.type === 'margin_trade' ? entry.quantity : 0),
          0,
        );
        const claimPoints = data.reduce(
          (acc, entry) => acc + (entry.type === 'claim' ? entry.quantity : 0),
          0,
        );
        const miscPoints = data.reduce(
          (acc, entry) => acc + (entry.type === 'manual' ? entry.quantity : 0),
          0,
        );

        setComputedClicks(new BigNumber(clickPoints));
        setUserPoints({
          ...user,
          quantity: user.quantity.plus(
            user.pointsPerSlot.times(
              new BigNumber(currentSlot - (user.slot ?? 0)),
            ),
          ),
          adjustments: {
            click: clickPoints,
            margin_trade: marginPoints,
            claim: claimPoints,
            manual: miscPoints,
          },
        });
      });
    }
  }

  useEffect(() => {
    if (avgSlotTimeUsed > 0) {
      loadData();
    }
    if (!publicKey) {
      setUserPoints(null);
      setComputedPoints(null);
      setComputedClicks(null);
      setClicked({
        current: null,
        max: null,
        status: 'unclicked',
      });
    }
  }, [publicKey, avgSlotTimeUsed]);

  return children;
}
