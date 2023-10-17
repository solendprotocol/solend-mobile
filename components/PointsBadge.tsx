import React from 'react';
import {Pressable, View} from 'react-native';
import Typography from './Typography';
import colors from '../colors';
import axios from 'axios';
import {collapsableToken, ordinalSuffix} from '../util/numberFormatter';
import LinearGradient from 'react-native-linear-gradient';
import {GradientText} from './GradientText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAtom} from 'jotai';
import {publicKeyAtom} from './atoms/wallet';
import {
  clickPointsAtom,
  computedPointsAtom,
  userPointsAtom,
} from './atoms/points';
import {CLICK_ENDPOINT} from './PointsLoader';

export type ClickResponseType = {
  current: number;
  max: number;
  success: boolean;
};

function PointsBadge() {
  const [publicKey] = useAtom(publicKeyAtom);
  const [clicked, setClicked] = useAtom(clickPointsAtom);
  const [userPoints] = useAtom(userPointsAtom);
  const [computedPoints] = useAtom(computedPointsAtom);

  async function click() {
    if (publicKey && clicked.status !== 'maxed') {
      setClicked({
        ...clicked,
        status: 'requested',
      });
      return axios.get(`${CLICK_ENDPOINT}${publicKey}`).then(res => {
        const clickResponse = res.data as ClickResponseType;

        setClicked({
          status: 'clicked',
          current: clickResponse.current,
          max: clickResponse.max,
        });

        if (!clickResponse.success) {
          setClicked({
            status: 'maxed',
            current: clickResponse.current,
            max: clickResponse.max,
          });
        }
      });
    }

    return Promise.resolve(null);
  }

  return (
    <Pressable onPress={() => click()} className="mb-4">
      <LinearGradient
        colors={[colors.brand, colors.brandAlt]}
        className="m-4 p-[1px] rounded-full border flex flex-row justify-center items-center">
        <View className="px-4 w-full rounded-full bg-neutral borderflex flex justify-center items-center">
          <GradientText colors={[colors.brand, colors.brandAlt]} fontSize={48}>
            {['requested', 'clicked'].includes(clicked.status) ? (
              <Icon name="cookie" size={36} color={colors.primary} />
            ) : (
              '◉'
            )}{' '}
            {collapsableToken(computedPoints?.toString() ?? '0', 4, 8)}
          </GradientText>
          <Typography textClassName="mb-4" color="brandAlt">
            {clicked.status === 'unclicked' && (
              <>
                You are{' '}
                <Typography color="brandAlt" textClassName="underline">
                  {userPoints
                    ? `${userPoints.rank.toLocaleString()}${ordinalSuffix(
                        userPoints.rank,
                      )}`
                    : '-'}
                </Typography>{' '}
                place <View className="w-2" />
                <Typography color="brandAlt" textClassName="underline">
                  {userPoints ? userPoints.pointsPerDay.toFixed(2) : '-'}
                </Typography>{' '}
                / day
              </>
            )}
            {clicked.status === 'requested' && <>Retrieving ◉</>}
            {clicked.status === 'clicked' && (
              <>
                Bonus ◉ obtained
                {clicked.max !== null && ` (${clicked.current}/${clicked.max})`}
              </>
            )}
            {clicked.status === 'maxed' && (
              <>
                Daily limit reached
                {clicked.max !== null && ` (${clicked.max} ◉)`}
              </>
            )}
          </Typography>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default React.memo(PointsBadge);
