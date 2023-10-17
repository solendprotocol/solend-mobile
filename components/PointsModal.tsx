import React from 'react';
import {StyleSheet, View} from 'react-native';
import Modal from 'react-native-modal';
import Typography from './Typography';
import colors from '../colors';
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
      className="m-0">
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
