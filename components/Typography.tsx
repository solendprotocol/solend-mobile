import React, { ReactElement } from 'react';
import { Text } from 'react-native';

export type TypographyPropsType = {
textClassName?: string;
  level?:
    | 'display'
    | 'title'
    | 'headline'
    | 'body'
    | 'bodyMono'
    | 'label'
    | 'caption'
    | 'captionMono'
    | 'disclosure';
  color?:
    | 'primary'
    | 'secondary'
    | 'line'
    | 'neutralAlt'
    | 'neutral'
    | 'overlay'
    | 'secondary'
    | 'brand'
    | 'brandAlt';
  children?: React.ReactNode;
  style?: any;
  onPress?: () => void;
  onLongPress?: () => void;
};

Typography.defaultProps = {
  textClassName: '',
  level: 'body',
  color: 'primary',
  children: null,
  style: undefined,
  onPress: undefined,
  onLongPress: undefined,
};

function Typography({
  level = 'body',
  color = 'primary',
  textClassName = '',
  children,
  style,
  onPress,
  onLongPress
}: TypographyPropsType): ReactElement {
  const fontStyleMap = {
    display: {
        fontFamily: 'IBMPlexSans-Light',
        fontSize: 48,
    },
    title: {
        fontFamily: 'IBMPlexSans-SemiBold',
        fontSize: 16,
    },
    headline: {
        fontFamily: 'IBMPlexSans-SemiBold',
        fontSize: 13,
        lineHeight: 20,
    },
    body: {
        fontFamily: 'IBMPlexSans-Regular',
        fontSize: 13,
        lineHeight: 20,
    },
    bodyMono: {
        fontFamily: 'IBMPlexMono-Regular',
        fontSize: 13,
    },
    label: {
        fontFamily: 'IBMPlexSans-SemiBold',
        fontSize: 11,
    },
    caption: {
        fontFamily: 'IBMPlexSans-Regular',
        fontSize: 11,
        lineHeight: 16,
    },
    captionMono: {
        fontFamily: 'IBMPlexMono-Regular',
        fontSize: 10,
    },
    disclosure: {
        fontFamily: 'IBMPlexSans-Regular',
        fontSize: 9,
    },
  };

  const fontStyle = fontStyleMap[level];
  return <Text
  onPress={onPress}
  onLongPress={onLongPress}
  className={`text-${color} ${textClassName}`}
    style={{
        ...fontStyle,
        ...style,
    }}
  >
    {children}
  </Text>
}

export default Typography;
