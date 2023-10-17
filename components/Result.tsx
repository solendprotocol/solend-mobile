import React from 'react';
import {formatErrorMsg, titleCase} from '@solendprotocol/solend-sdk';
import SolendButton from './Button';
import Typography from './Typography';
import {Animated, Linking, View, Easing} from 'react-native';
import {formatToken} from '../util/numberFormatter';
import Loading from './Loading';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ENVIRONMENT} from '../util/config';
import colors from '../colors';

type LoadingResultType = {
  type: 'loading';
  message?: React.ReactNode;
};

type ErrorResultType = {
  type: 'error';
  message: string;
  onBack?: () => void;
};

type SuccessResultType = {
  type: 'success';
  amountString: string;
  signature: string;
  symbol: string;
  action: string;
  onBack?: () => void;
};

export type ResultConfigType =
  | ErrorResultType
  | SuccessResultType
  | LoadingResultType;

type ResultPropsType = {
  result: ResultConfigType;
  setResult: (result: ResultConfigType | null) => void;
};

export default function Result({result, setResult}: ResultPropsType) {
  let overridePage = <View />;
  const spinValue = new Animated.Value(0);

  Animated.loop(
    Animated.timing(spinValue, {
      toValue: 360,
      duration: 300000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ).start();

  const rotateValue = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (result?.type === 'loading') {
    overridePage = (
      <View className="h-48 flex justify-center items-center">
        <Loading />
        <Typography level="title">Loading...{'\n'}</Typography>
        <Typography color="secondary">{result.message}</Typography>
      </View>
    );
  }

  if (result?.type === 'error') {
    overridePage = (
      <View className="flex justify-center items-center">
        <Icon name="warning" color={colors.brand} size={120} />
        <Typography level="title">Error{'\n'}</Typography>
        <Typography color="secondary">
          {result.message && formatErrorMsg(result.message)}
          {'\n'}
        </Typography>
        <SolendButton
          full
          onPress={() => {
            if (result.onBack) {
              result.onBack();
            }
            setResult(null);
          }}>
          <Typography color="neutral" level="title">
            Back
          </Typography>
        </SolendButton>
      </View>
    );
  }

  if (result?.type === 'success') {
    overridePage = (
      <View className="flex justify-center items-center">
        <Icon name="check-circle" color={colors.brandAlt} size={96} />
        <Typography level="title">
          {titleCase(result.action)} successful{' '}
          {formatToken(result.amountString)} {result.symbol}
          {'\n'}
        </Typography>
        <Typography
          textClassName="underline"
          color="secondary"
          onPress={() =>
            Linking.openURL(
              `https://solscan.io/tx/${result.signature}?cluster=${ENVIRONMENT}`,
            )
          }>
          View on Solscan{'\n'}
        </Typography>
        <SolendButton
          full
          onPress={() => {
            if (result.onBack) {
              result.onBack();
            }
            setResult(null);
          }}>
          <Typography color="neutral" level="title">
            Back
          </Typography>
        </SolendButton>
      </View>
    );
  }

  return <View className="px-6 py-2">{overridePage}</View>;
}
