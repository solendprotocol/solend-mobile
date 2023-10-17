import React from 'react';
import {
  Button,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import {formatAddress} from '@solendprotocol/solend-sdk';
import Typography from './Typography';
import colors from '../colors';
import axios from 'axios';
import {
  collapsableToken,
  formatToken,
  formatUsd,
  ordinalSuffix,
} from '../util/numberFormatter';
import LinearGradient from 'react-native-linear-gradient';
import {GradientText} from './GradientText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAtom} from 'jotai';
import {publicKeyAtom} from './atoms/wallet';
import {
  clickPointsAtom,
  computedClicksAtom,
  computedPointsAtom,
  leaderboardPointsAtom,
  userPointsAtom,
} from './atoms/points';
import {CLICK_ENDPOINT} from './PointsLoader';
import PointsLeaderboard from './PointsLeaderboard';

export type ClickResponseType = {
  current: number;
  max: number;
  success: boolean;
};

function PointsItemBase({
  amount,
  title,
  icon,
  description,
  onPress,
}: {
  amount: string;
  title: string;
  icon: string;
  description: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <View
      className="mb-4 w-full bg-neutralAlt border border-line px-4 py-2"
      key={title}>
      <View className="flex flex-row justify-around items-center">
        <View className="w-16">
          <Icon name={icon} size={36} color={colors.primary} />
        </View>

        <View className="w-[200px]">
          <Typography level="label">{title}</Typography>
          <Typography
            level="caption"
            color="secondary"
            textClassName="w-48"
            onPress={onPress}>
            {description}
          </Typography>
        </View>

        <View className={'flex flex-row items-center justify-end w-24'}>
          <Typography>◉ {formatToken(amount, 2)}</Typography>
        </View>
      </View>
    </View>
  );
}

export function PointsInterestItem() {
  const [userPoints] = useAtom(userPointsAtom);
  const [computedPoints] = useAtom(computedPointsAtom);
  const [computedClicks] = useAtom(computedClicksAtom);

  return (
    <PointsItemBase
      title="Interest"
      icon="monetization-on"
      amount={Math.max(
        Number(computedPoints?.toString() ?? 0) +
          (userPoints?.adjustments?.claim ?? 0) -
          Number(computedClicks?.toString() ?? 0) -
          (userPoints?.adjustments?.margin_trade ?? 0) -
          (userPoints?.adjustments?.manual ?? 0),
        0,
      ).toString()}
      description="Points are earned over time from deposited or borrowed assets."
    />
  );
}

export function PointsMarginItem() {
  const [userPoints] = useAtom(userPointsAtom);

  return (
    <PointsItemBase
      title="Margin"
      icon="area-chart"
      amount={(userPoints?.adjustments?.margin_trade ?? 0).toString()}
      description="Trade on on Solend margin mode for bonus points $1 volume = 10 points"
    />
  );
}

export function PointsClicksItem() {
  const [computedClicks] = useAtom(computedClicksAtom);

  return (
    <PointsItemBase
      title="Cookies"
      icon="cookie"
      amount={computedClicks?.toString() ?? '0'}
      description="Cookies redeemable up to half your total points for the season."
    />
  );
}

export function PointsMiscItem() {
  const [userPoints] = useAtom(userPointsAtom);

  return (
    <PointsItemBase
      title="Margin"
      icon="redeem"
      amount={(userPoints?.adjustments?.manual ?? 0).toString()}
      description="Follow @solendprotocol for bonus opportunities."
      onPress={() => Linking.openURL('https://twitter.com/solendprotocol')}
    />
  );
}
