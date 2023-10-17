import React, {useMemo} from 'react';
import {FlatList, View} from 'react-native';
import {formatAddress} from '@solendprotocol/solend-sdk';
import Typography from './Typography';
import {formatToken} from '../util/numberFormatter';
import {useAtom} from 'jotai';
import {leaderboardPointsAtom} from './atoms/points';

function PointsLeaderboard() {
  const [leaderboard] = useAtom(leaderboardPointsAtom);

  const sortedComputedLeaderboard = useMemo(
    () =>
      leaderboard
        ?.sort((a, b) =>
          a.quantity.isGreaterThanOrEqualTo(b.quantity) ? -1 : 1,
        )
        .map((r, index) => ({
          ...r,
          sortedRank: index + 1,
          rankDelta: index + 1 - r.rank + r.rankDelta,
        })),
    [leaderboard],
  );

  return (
    <View className="flex-1">
      <View className="flex flex-row mt-2 border-t border-line justify-between">
        <Typography
          level="caption"
          color="secondary"
          textClassName="basis-2/12 border-r border-line">
          Rank
        </Typography>
        <Typography
          level="caption"
          color="secondary"
          textClassName="basis-3/12">
          Wallet
        </Typography>
        <Typography
          level="caption"
          color="secondary"
          textClassName="basis-4/12 text-right border-l border-line">
          ◉ Points
        </Typography>
        <Typography
          level="caption"
          color="secondary"
          textClassName="basis-3/12 text-right border-l border-line">
          ◉ / day
        </Typography>
      </View>
      <FlatList
        data={sortedComputedLeaderboard}
        className="flex-1"
        renderItem={item => {
          const row = item.item;
          return (
            <View
              key={item.item.wallet}
              className="flex flex-row border-t border-line py-1 justify-between">
              <Typography level="caption" textClassName="basis-2/12">
                {row.sortedRank}{' '}
                {row.rankDelta < 0 && (
                  <Typography color="brandAlt">▲</Typography>
                )}
                {row.rankDelta > 0 && <Typography color="brand">▼</Typography>}
                {row.rankDelta !== 0 && (
                  <Typography level="caption">
                    {Math.abs(row.rankDelta)}
                  </Typography>
                )}
              </Typography>
              <View className="basis-3/12">
                <Typography level="caption">
                  {formatAddress(row.wallet, 4)}
                </Typography>
              </View>
              <Typography level="caption" textClassName="basis-4/12 text-right">
                {formatToken(row.quantity.toString() ?? 0, 2, true, false)}
              </Typography>
              <View className="basis-3/12">
                <Typography level="caption" textClassName="text-right">
                  {formatToken(row.pointsPerDay.toString(), 2, true)}
                </Typography>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

export default React.memo(PointsLeaderboard);
