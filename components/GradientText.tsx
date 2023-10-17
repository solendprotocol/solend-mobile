import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {Text} from 'react-native';

export const GradientText = ({
  colors,
  fontSize = 13,
  ...rest
}: {
  fontSize?: number;
  colors: (string | number)[];
  style?: any;
  children: React.ReactNode;
}) => {
  return (
    <MaskedView
      maskElement={
        <Text
          {...rest}
          style={[
            rest.style,
            {
              fontFamily: 'IBMPlexMono-Regular',
              fontSize,
            },
          ]}
        />
      }>
      <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
        <Text
          {...rest}
          style={[
            rest.style,
            {
              opacity: 0,
              fontFamily: 'IBMPlexMono-Regular',
              fontSize,
            },
          ]}
        />
      </LinearGradient>
    </MaskedView>
  );
};
