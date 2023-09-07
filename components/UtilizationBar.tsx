import React, { ReactElement, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import classNames from 'classnames';
import BigNumber from 'bignumber.js';
import { formatPercent, formatUsd } from '../util/numberFormatter';
import { selectedObligationAtom } from './atoms/obligations';
import { Pressable, View } from 'react-native';

Section.defaultProps = {
  width: 1.5,
  extraClassName: null,
  tooltip: null,
};

function Section({
  width = 1.5,
  extraClassName,
}: {
  width?: number;
  extraClassName?: string;
}) {
  return (
      <View
        style={{
          width: `${width}%`,
        }}
        className={classNames('h-full bg-line', extraClassName)}
      />
  );
}

function UtilizationBar({
  onClick,
  showBreakdown,
}: {
  onClick: () => void;
  showBreakdown: boolean;
}): ReactElement {
  const [obligation] = useAtom(selectedObligationAtom);

  const usedObligation = obligation ?? {
    totalSupplyValue: new BigNumber(0),
    totalBorrowValue: new BigNumber(0),
    borrowLimit: new BigNumber(0),
    liquidationThreshold: new BigNumber(0),
    borrowOverSupply: new BigNumber(0),
    borrowLimitOverSupply: new BigNumber(0),
    liquidationThresholdFactor: new BigNumber(0),
    weightedTotalBorrowValue: new BigNumber(0),
    weightedBorrowUtilization: new BigNumber(0),
  };

  const weightedBorrowOverSupply = usedObligation.totalSupplyValue.isZero()
    ? new BigNumber(0)
    : usedObligation.weightedTotalBorrowValue.dividedBy(
        usedObligation.totalSupplyValue,
      );

  const passedLimit =
    usedObligation.totalSupplyValue.isZero() ||
    (!usedObligation.weightedTotalBorrowValue.isZero() &&
      usedObligation.weightedTotalBorrowValue.isGreaterThanOrEqualTo(
        usedObligation.borrowLimit,
      ));
  const passedThreshold =
    usedObligation.totalSupplyValue.isZero() ||
    (!usedObligation.weightedTotalBorrowValue.isZero() &&
      usedObligation.weightedTotalBorrowValue.isGreaterThanOrEqualTo(
        usedObligation.liquidationThreshold,
      ));
  // 3% reserved for the bars
  const denominator =
    97 + (passedLimit ? 1.5 : 0) + (passedThreshold ? 1.5 : 0);

  const borrowWidth = Math.min(
    100,
    Number(Number(usedObligation.borrowOverSupply.toString()).toFixed(4)) *
      denominator,
  );

  const weightedBorrowWidth =
    Math.min(
      100,
      Number(Number(weightedBorrowOverSupply.toString()).toFixed(4)) *
        denominator,
    ) - borrowWidth;

  const totalBorrowWidth = borrowWidth + weightedBorrowWidth;

  const unborrowedWidth =
    Number(
      Number(
        usedObligation.totalSupplyValue.isZero()
          ? BigNumber(0)
          : BigNumber.max(
              usedObligation.borrowLimit.minus(
                usedObligation.weightedTotalBorrowValue,
              ),
              BigNumber(0),
            )
              .dividedBy(usedObligation.totalSupplyValue)
              .toString(),
      ).toFixed(4),
    ) * denominator;
  const unliquidatedWidth =
    Number(
      Number(
        usedObligation.totalSupplyValue.isZero()
          ? BigNumber(0)
          : BigNumber.max(
              usedObligation.liquidationThreshold.minus(
                BigNumber.max(
                  usedObligation.borrowLimit,
                  usedObligation.weightedTotalBorrowValue,
                ),
              ),
              BigNumber(0),
            )
              .dividedBy(usedObligation.totalSupplyValue)
              .toString(),
      ).toFixed(4),
    ) * denominator;
  const unusedSupply =
    denominator - totalBorrowWidth - unborrowedWidth - unliquidatedWidth;

  return (
    <Pressable className='w-full h-2 flex flex-row' onPress={onClick}>
      {showBreakdown && (
        <Section
          width={borrowWidth}
          extraClassName={passedLimit ? 'bg-brand' : 'bg-brandAlt opacity-50'}
        />
      )}
      {showBreakdown && (
        <Section
          width={weightedBorrowWidth}
          extraClassName={passedLimit ? 'bg-brand' : 'bg-brandAlt'}
        />
      )}
      {!showBreakdown && (
        <Section
          width={totalBorrowWidth}
          extraClassName={passedLimit ? 'bg-brand' : 'bg-brandAlt'}
        />
      )}
      {!passedLimit && (
        <Section
          width={unborrowedWidth}
        />
      )}
      {!passedLimit && (
        <Section
          extraClassName='bg-primary'
        />
      )}
      <Section
        width={unliquidatedWidth}
      />
      {!passedThreshold && (
        <Section
          extraClassName='bg-brand'
        />
      )}
      <Section
        width={unusedSupply}
      />
    </Pressable>
  );
}

export default UtilizationBar;
