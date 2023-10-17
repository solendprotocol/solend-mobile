import React, {useState, useCallback} from 'react';
import {Pressable, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../colors';
import {collapsableToken} from '../util/numberFormatter';
import {GradientText} from './GradientText';
import PointsModal from './PointsModal';
import {computedPointsAtom} from './atoms/points';
import {useAtom} from 'jotai';

export function PointsButton() {
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [computedPoints] = useAtom(computedPointsAtom);

  const onClose = useCallback(() => setShowPointsModal(false), []);

  return (
    <>
      <PointsModal visible={showPointsModal} onClose={onClose} />
      <Pressable onPress={() => setShowPointsModal(true)}>
        <LinearGradient
          colors={[colors.brand, colors.brandAlt]}
          className="p-[1px] rounded-full border flex flex-row justify-center items-center">
          <View className="p-2 w-24 rounded-full bg-neutral borderflex flex-row justify-end items-center">
            <GradientText colors={[colors.brand, colors.brandAlt]}>
              ◉ {collapsableToken(computedPoints?.toString() ?? '0', 4, 8)}
            </GradientText>
          </View>
        </LinearGradient>
      </Pressable>
    </>
  );
}
