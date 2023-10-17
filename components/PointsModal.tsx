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
  leaderboardPointsAtom,
  userPointsAtom,
} from './atoms/points';
import {CLICK_ENDPOINT} from './PointsLoader';
import PointsLeaderboard from './PointsLeaderboard';
import {
  PointsClicksItem,
  PointsInterestItem,
  PointsMarginItem,
  PointsMiscItem,
} from './PointsItemized';
import PointsBadge from './PointsBadge';

export type ClickResponseType = {
  current: number;
  max: number;
  success: boolean;
};

function PointsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      // We use the state here to toggle visibility of Bottom Sheet
      isVisible={Boolean(visible)}
      // We pass our function as default function to close the Modal
      onBackdropPress={() => onClose()}
      onBackButtonPress={() => onClose()}
      swipeDirection="up"
      useNativeDriver={true}
      onSwipeComplete={() => onClose()}
      swipeThreshold={25}
      avoidKeyboard
      animationIn="slideInDown"
      animationOut="slideOutUp"
      propagateSwipe
      style={{
        margin: 0,
      }}>
      <View style={[styles.bottomSheet]} className="flex pb-4 bg-neutral h-5/6">
        <View
          className={
            'w-full flex justify-center items-center h-12 border-t-2 border-primary'
          }>
          <Typography level="headline">Points</Typography>
        </View>
        <PointsBadge />
        <View className="flex-1 flex px-4">
          <PointsInterestItem />
          <PointsMarginItem />
          <PointsClicksItem />
          <PointsMiscItem />
          <PointsLeaderboard />
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(PointsModal);

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    backgroundViewor: colors.neutral,
    justifyContent: 'flex-start',
    alignItems: 'center',
    left: 0,
    right: 0,
    top: 0,
  },
});
