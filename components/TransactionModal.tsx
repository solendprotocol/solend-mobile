import React, {useState} from 'react';
import Modal from 'react-native-modal';
import {SelectedReserveType} from '../components/atoms/pools';
import BigNumber from 'bignumber.js';
import TransactionContent from './TransactionContent';
import {StyleSheet, View} from 'react-native';
import colors from '../colors';

export default function TransactionModal({
  selectedReserve,
  setSelectedReserve,
}: {
  selectedReserve: SelectedReserveType;
  setSelectedReserve: (reserve: SelectedReserveType | null) => void;
}) {
  const [useUsd, setUseUsd] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [usdAmount, setUsdAmount] = useState<string>('');

  function handleAmountChange(value: string) {
    if (value.length && BigNumber(value).isNaN()) {
      return;
    }
    if (useUsd) {
      setUsdAmount(value);
      setAmount(
        value.length
          ? new BigNumber(value)
              .dividedBy(selectedReserve.price)
              .decimalPlaces(selectedReserve.decimals)
              .toString()
          : '',
      );
    } else {
      setAmount(
        value.length
          ? value[value.length - 1] === '.'
            ? value
            : new BigNumber(value)
                .decimalPlaces(selectedReserve.decimals)
                .toString()
          : '',
      );
      setUsdAmount(
        value.length
          ? new BigNumber(value).times(selectedReserve.price).toString()
          : '',
      );
    }
  }

  function handleClose() {
    handleAmountChange('');
    setSelectedReserve(null);
  }
  return (
    <Modal
      // We use the state here to toggle visibility of Bottom Sheet
      isVisible={Boolean(selectedReserve)}
      // We pass our function as default function to close the Modal
      onBackdropPress={() => handleClose()}
      onBackButtonPress={() => handleClose()}
      useNativeDriver={true}
      swipeDirection="down"
      onSwipeComplete={() => handleClose()}
      swipeThreshold={25}
      avoidKeyboard
      className="m-0">
      <View style={[styles.bottomSheet]}>
        {/* <Suspense fallback={<Loading full/>}> */}
        <TransactionContent
          amount={amount}
          usdAmount={usdAmount}
          useUsd={useUsd}
          setUseUsd={setUseUsd}
          setUsdAmount={setUsdAmount}
          setAmount={setAmount}
          selectedReserve={selectedReserve}
        />
        {/* </Suspense> */}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    backgroundColor: colors.neutral,
    justifyContent: 'flex-start',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
