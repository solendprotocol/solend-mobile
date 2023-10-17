import React, {ReactElement, useState} from 'react';
import BigNumber from 'bignumber.js';
import {useAtom} from 'jotai';
import {ActionType, ReserveType} from '@solendprotocol/solend-sdk';
import {SelectedReserveType, rateLimiterAtom} from './atoms/pools';
import {formatPercent, formatToken, formatUsd} from '../util/numberFormatter';
import Typography from './Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Pressable, View, Linking, ScrollView} from 'react-native';
import Metric from './Metric';
import Tooltip from 'rn-tooltip';
import Clipboard from '@react-native-clipboard/clipboard';
import humanizeDuration from 'humanize-duration';
import {alertAndLog} from '../util/alertAndLog';
// certain oracles do not match their underlying asset, hence this mapping
const PYTH_ORACLE_MAPPING: Record<string, string> = {
  H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG: 'sol',
};

function getPythLink(feedAddress: string, assetName: string | null): string {
  if (!assetName) {
    return '';
  }
  if (feedAddress in PYTH_ORACLE_MAPPING) {
    return `https://pyth.network/price-feeds/crypto-${PYTH_ORACLE_MAPPING[
      feedAddress
    ].toLowerCase()}-usd`;
  }

  return `https://pyth.network/price-feeds/crypto-${assetName.toLowerCase()}-usd`;
}

type ReserveStatsPropsType = {
  reserve: SelectedReserveType;
  borrowLimit: BigNumber | null;
  newBorrowLimit: BigNumber | null;
  utilization: BigNumber | null;
  newBorrowUtilization: BigNumber | null;
  action: ActionType;
  calculatedBorrowFee: BigNumber | null;
};

function ReserveStats({
  reserve,
  borrowLimit,
  newBorrowLimit,
  utilization,
  newBorrowUtilization,
  action,
  calculatedBorrowFee,
}: ReserveStatsPropsType): ReactElement {
  // const [rateLimiter] = useAtom(rateLimiterAtom);
  const rateLimiter = {
    config: {
      windowDuration: BigNumber(0),
      maxOutflow: BigNumber(0),
    },
    windowStart: BigNumber(0),
    previousQuantity: BigNumber(0),
    currentQuantity: BigNumber(0),
    remainingOutflow: BigNumber(0),
  };

  const [showParams, setShowParams] = useState(false);
  let newBorrowLimitDisplay = null;
  if (newBorrowLimit) {
    const nbuObj = newBorrowLimit;
    if (nbuObj.isLessThan(0)) {
      newBorrowLimitDisplay = formatUsd(0);
    } else {
      newBorrowLimitDisplay = formatUsd(newBorrowLimit.toString());
    }
  }

  let newUtilizationDisplay = null;
  if (newBorrowUtilization) {
    const nbuObj = newBorrowUtilization;
    if (nbuObj.isGreaterThanOrEqualTo(1)) {
      newUtilizationDisplay = (
        <Typography color="brand">{formatPercent(1)}</Typography>
      );
    } else if (nbuObj.isLessThan(0)) {
      newUtilizationDisplay = formatPercent(0);
    } else {
      newUtilizationDisplay = formatPercent(newBorrowUtilization.toString());
    }
  }

  const interestType = ['deposit', 'withdraw'].includes(action)
    ? 'Supply'
    : 'Borrow';

  return (
    <View className="w-full">
      {['borrow', 'repay'].includes(action) && (
        <Metric
          row
          label="Price"
          value={formatUsd(reserve.maxPrice.toString())}
          tooltip={
            <Typography>
              For the purpose of borrowed assets in utilization calculations,
              the max value between spot price a EMA (exponential moving
              average) is used. This is to protect the protocol against price
              manipulation.
            </Typography>
          }
        />
      )}
      {['deposit', 'withdraw'].includes(action) && (
        <Metric
          row
          label="Price"
          value={formatUsd(reserve.minPrice.toString())}
          tooltip={
            <Typography>
              For the purpose of supplied assets in utilization calculations,
              the min value between spot price a EMA (exponential moving
              average) is used. This is to protect the protocol against price
              manipulation.
            </Typography>
          }
        />
      )}
      <Metric
        label="User borrow limit"
        row
        value={
          <>
            {formatUsd(borrowLimit?.toString() ?? 0)}
            {newBorrowLimit && (
              <>
                {' \u2192 '}
                {newBorrowLimitDisplay}
              </>
            )}
          </>
        }
      />
      <Metric
        label="Utilization"
        row
        value={
          <>
            {formatPercent(utilization?.toString() ?? 0)}
            {newBorrowUtilization && (
              <>
                {' \u2192 '}
                {newUtilizationDisplay}
              </>
            )}
          </>
        }
      />
      <Metric
        row
        label={`${interestType} APR`}
        value={formatPercent(
          interestType === 'Supply'
            ? reserve.supplyInterest.toString()
            : reserve.borrowInterest.toString(),
        )}
      />
      {action === 'borrow' && calculatedBorrowFee && (
        <Metric
          label="Borrow fee"
          row
          value={
            <Typography>
              {formatToken(
                calculatedBorrowFee.toString(),
                4,
                false,
                false,
                false,
                true,
              )}{' '}
              {reserve.symbol}
            </Typography>
          }
        />
      )}
      <Pressable role="presentation" onPress={() => setShowParams(!showParams)}>
        <View className="flex flex-row justify-center items-center">
          <View className="border-b border-line w-full absolute" />
          <View className=" px-2 bg-neutral flex flex-row justify-center items-center">
            <Typography color="primary" textClassName="underline mr-1">
              More parameters
            </Typography>
            {showParams ? (
              <Icon name="expand-less" />
            ) : (
              <Icon name="expand-more" />
            )}
          </View>
        </View>
      </Pressable>
      <ScrollView
        className={
          showParams
            ? 'flex bg-neutralAlt h-24 mt-4 mx-[-32px] px-8'
            : 'flex hidden'
        }
        contentContainerStyle={{
          paddingVertical: 8,
        }}>
        <Metric
          row
          label="Current asset utilization"
          value={formatPercent(reserve.reserveUtilization.toString())}
          tooltip={
            <Typography>
              Percentage of the asset being lent out. Utilization determines
              interest rates via a function.{' '}
              <Typography
                onPress={() =>
                  Linking.openURL('https://docs.solend.fi/protocol/fees')
                }>
                Learn more
              </Typography>
              .
            </Typography>
          }
        />
        <Metric
          row
          label="Current borrow APR"
          value={formatPercent(reserve.borrowInterest.toString())}
        />
        <Metric
          row
          label="Min borrow APR"
          value={formatPercent(reserve.minBorrowApr)}
        />
        <Metric
          row
          label="Target utilization"
          value={formatPercent(reserve.targetUtilization)}
          tooltip={
            <Typography>
              When utilization goes above this value, interest rates are more
              sensitive to changes in utilization.
            </Typography>
          }
        />
        <Metric
          row
          label="Target borrow APR"
          value={formatPercent(reserve.targetBorrowApr)}
          tooltip={
            <Typography>
              When utilization is equal to the target utilization, borrow APR
              will be this value.
            </Typography>
          }
        />
        <Metric
          row
          label="Max utilization"
          value={formatPercent(reserve.maxUtilizationRate)}
          tooltip={
            <Typography>
              When utilization goes above this value, borrows and withdraws will
              not be possible.
            </Typography>
          }
        />
        <Metric
          row
          label="Max borrow APR"
          value={formatPercent(reserve.maxBorrowApr)}
          tooltip={<Typography>Maximum possible borrow APR.</Typography>}
        />
        <Metric
          row
          label="Supermax borrow APR"
          value={formatPercent(reserve.superMaxBorrowRate)}
          tooltip={<Typography>Maximum possible borrow APR.</Typography>}
        />
        {reserve.reserveSupplyLimit && (
          <Metric
            row
            label="Max reserve deposit limit"
            value={formatToken(reserve.reserveSupplyLimit.toString())}
            tooltip={
              <Typography>
                To limit risk, total deposits are limited.
              </Typography>
            }
          />
        )}
        {reserve.reserveBorrowLimit && (
          <Metric
            row
            label="Max reserve borrow limit"
            value={formatToken(reserve.reserveBorrowLimit.toString())}
            tooltip={
              <Typography>
                The total amount of borrows for this reserve is limited to this
                amount.
              </Typography>
            }
          />
        )}
        <Metric
          row
          label="Open LTV"
          value={formatPercent(reserve.loanToValueRatio)}
          tooltip={
            <Typography>
              Open loan-to-value (LTV) is the ratio describing how much you can
              borrow against your collateral.
            </Typography>
          }
        />
        <Metric
          row
          label="Close LTV"
          value={formatPercent(reserve.liquidationThreshold)}
          tooltip={
            <Typography>
              Close Loan-to-value (LTV) ratio at which liquidation occurs.
            </Typography>
          }
        />
        <Metric
          row
          label="Max close LTV"
          value={formatPercent(reserve.maxLiquidationThreshold)}
          tooltip={
            <Typography>
              Max close Loan-to-value (LTV) is the ratio at which the max
              liquidation penalty occurs.
            </Typography>
          }
        />
        <Metric
          row
          label="Liquidation penalty"
          value={formatPercent(reserve.liquidationPenalty)}
        />
        <Metric
          row
          label="Max liquidation penalty"
          value={<>{formatPercent(reserve.maxLiquidationPenalty)}</>}
          tooltip={
            <Typography>
              Liquidation penalty increases past close LTV until max close LTV,
              where max liquidation penalty occurs.
            </Typography>
          }
        />
        <Metric
          row
          label="Borrow fee percentage"
          value={<>{formatPercent(reserve.borrowFee.toString())}</>}
        />
        <Metric
          row
          label="Flash loan fee"
          value={<>{formatPercent(reserve.flashLoanFee.toString())}</>}
        />
        <Metric
          row
          label="Host fee percentage"
          value={<>{formatPercent(reserve.hostFee)}</>}
        />
        <Metric
          row
          label="Liquidation protocol fee"
          tooltip={
            <Typography>
              The liquidation protocol fee is a percentage of the liquidation
              penalty that goes to the Solend DAO treasury to help cover bad
              debt.
            </Typography>
          }
          value={<>{formatPercent(reserve.protocolLiquidationFee)}</>}
        />
        <Metric
          row
          label="Interest rate spread"
          tooltip={
            <Typography>
              Interest rate spread is a percentage of the borrow interest rate.
              The fee percentage ranges depending on the asset.
            </Typography>
          }
          value={<>{formatPercent(reserve.interestRateSpread)}</>}
        />
        <Metric
          row
          label="Reserve address"
          value={
            <Tooltip
              actionType="press"
              popover={<Typography>{reserve.address}</Typography>}>
              <View className="flex flex-row items-center">
                <Typography
                  onPress={() =>
                    Linking.openURL(
                      `https://solscan.io/account/${reserve.address}`,
                    )
                  }
                  onLongPress={() => {
                    Clipboard.setString(reserve.address);
                    alertAndLog('Address copied!', reserve.address);
                  }}>
                  {reserve.address.slice(0, 6)}...{reserve.address.slice(-6)}{' '}
                </Typography>
                <Pressable onPress={() => Clipboard.setString(reserve.address)}>
                  <Icon name="content-copy" />
                </Pressable>
              </View>
            </Tooltip>
          }
        />
        <Metric
          row
          label="Liquidity supply address"
          value={
            <Tooltip
              actionType="press"
              popover={<Typography>{reserve.liquidityAddress}</Typography>}>
              <View className="flex flex-row items-center">
                <Typography
                  onPress={() =>
                    Linking.openURL(
                      `https://solscan.io/account/${reserve.liquidityAddress}`,
                    )
                  }
                  onLongPress={() => {
                    Clipboard.setString(reserve.liquidityAddress);
                    alertAndLog('Address copied!', reserve.liquidityAddress);
                  }}>
                  {reserve.liquidityAddress.slice(0, 6)}
                  ...
                  {reserve.liquidityAddress.slice(-6)}{' '}
                </Typography>
                <Pressable
                  onPress={() => Clipboard.setString(reserve.liquidityAddress)}>
                  <Icon name="content-copy" />
                </Pressable>
              </View>
            </Tooltip>
          }
        />
        <Metric
          row
          label="Collateral supply address"
          value={
            <Tooltip
              actionType="press"
              popover={
                <Typography>{reserve.cTokenLiquidityAddress}</Typography>
              }>
              <View className="flex flex-row items-center">
                <Typography
                  onPress={() =>
                    Linking.openURL(
                      `https://solscan.io/account/${reserve.cTokenLiquidityAddress}`,
                    )
                  }
                  onLongPress={() => {
                    Clipboard.setString(reserve.cTokenLiquidityAddress);
                    alertAndLog(
                      'Address copied!',
                      reserve.cTokenLiquidityAddress,
                    );
                  }}>
                  {reserve.cTokenLiquidityAddress.slice(0, 6)}
                  ...
                  {reserve.cTokenLiquidityAddress.slice(-6)}{' '}
                </Typography>
                <Pressable
                  onPress={() =>
                    Clipboard.setString(reserve.cTokenLiquidityAddress)
                  }>
                  <Icon name="content-copy" />
                </Pressable>
              </View>
            </Tooltip>
          }
        />
        {reserve.feeReceiverAddress && (
          <Metric
            row
            label="Fee receiver address"
            value={
              <Tooltip
                actionType="press"
                popover={<Typography>{reserve.feeReceiverAddress}</Typography>}>
                <View className="flex flex-row items-center">
                  <Typography
                    onPress={() =>
                      Linking.openURL(
                        `https://solscan.io/account/${reserve.feeReceiverAddress}`,
                      )
                    }
                    onLongPress={() => {
                      Clipboard.setString(reserve.feeReceiverAddress);
                      alertAndLog(
                        'Address copied!',
                        reserve.feeReceiverAddress,
                      );
                    }}>
                    {reserve.feeReceiverAddress.slice(0, 6)}...
                    {reserve.feeReceiverAddress.slice(-6)}{' '}
                  </Typography>
                  <Pressable
                    onPress={() => {
                      Clipboard.setString(reserve.feeReceiverAddress);
                      alertAndLog(
                        'Address copied!',
                        reserve.feeReceiverAddress,
                      );
                    }}>
                    <Icon name="content-copy" />
                  </Pressable>
                </View>
              </Tooltip>
            }
          />
        )}
        <Metric
          row
          label="Token mint"
          value={
            <Tooltip
              actionType="press"
              popover={<Typography>{reserve.mintAddress}</Typography>}>
              <View className="flex flex-row items-center">
                <Typography
                  onPress={() =>
                    Linking.openURL(
                      `https://solscan.io/account/${reserve.mintAddress}`,
                    )
                  }
                  onLongPress={() => {
                    Clipboard.setString(reserve.mintAddress);
                    alertAndLog('Address copied!', reserve.mintAddress);
                  }}>
                  {reserve.mintAddress.slice(0, 6)}...
                  {reserve.mintAddress.slice(-6)}{' '}
                </Typography>
                <Pressable
                  onPress={() => Clipboard.setString(reserve.mintAddress)}>
                  <Icon name="content-copy" />
                </Pressable>
              </View>
            </Tooltip>
          }
        />
        <Metric
          row
          label="cToken mint"
          value={
            <Tooltip
              actionType="press"
              popover={<Typography>{reserve.cTokenMint}</Typography>}>
              <View className="flex flex-row items-center">
                <Typography
                  onPress={() =>
                    Linking.openURL(
                      `https://solscan.io/account/${reserve.cTokenMint}`,
                    )
                  }
                  onLongPress={() => {
                    Clipboard.setString(reserve.cTokenMint);
                    alertAndLog('Address copied!', reserve.cTokenMint);
                  }}>
                  {reserve.cTokenMint.slice(0, 6)}...
                  {reserve.cTokenMint.slice(-6)}{' '}
                </Typography>
                <Pressable
                  onPress={() => Clipboard.setString(reserve.cTokenMint)}>
                  <Icon name="content-copy" />
                </Pressable>
              </View>
            </Tooltip>
          }
        />
        {rateLimiter && (
          <Metric
            row
            label="Max reserve outflow"
            value={
              rateLimiter.config.windowDuration.isEqualTo(BigNumber(0)) ? (
                'N/A'
              ) : (
                <Typography>
                  {formatToken(
                    new BigNumber(
                      rateLimiter.config.maxOutflow.toString(),
                      reserve.decimals,
                    ).toString(),
                  )}{' '}
                  {reserve.symbol} per{' '}
                  {humanizeDuration(
                    (rateLimiter.config.windowDuration.toNumber() / 2) * 1000,
                  )}
                </Typography>
              )
            }
            tooltip={
              <Typography>
                For the safety of the pool, amounts being withdrawn or borrowed
                from the pool are limited by this rate.{'\n'}
                Remaining outflow this window:{' '}
                {formatUsd(
                  rateLimiter.remainingOutflow?.toString() ?? '0',
                  false,
                  true,
                )}
              </Typography>
            }
          />
        )}
        {!new BigNumber(reserve.borrowWeight).isEqualTo(new BigNumber(0)) && (
          <Metric
            row
            label="Borrow weight"
            value={reserve.borrowWeight.toString()}
            tooltip={
              <Typography>
                Borrow weight is a coefficient that is applied to the value
                being borrowed. This allows for the risk management on the
                borrowing of assets of various risk levels.
              </Typography>
            }
          />
        )}
        {reserve.pythOracle !==
          'nu11111111111111111111111111111111111111111' && (
          <Metric
            row
            label="Pyth oracle"
            value={
              <Tooltip
                popover={<Typography>{reserve.pythOracle}</Typography>}
                actionType="press">
                <View className="flex flex-row items-center">
                  <Typography
                    onPress={() =>
                      Linking.openURL(
                        getPythLink(reserve.pythOracle, reserve.symbol),
                      )
                    }
                    onLongPress={() => {
                      Clipboard.setString(reserve.pythOracle);
                      alertAndLog('Address copied!', reserve.pythOracle);
                    }}>
                    {reserve.pythOracle.slice(0, 6)}...
                    {reserve.pythOracle.slice(-6)}{' '}
                  </Typography>
                  <Pressable
                    onPress={() => Clipboard.setString(reserve.pythOracle)}>
                    <Icon name="content-copy" />
                  </Pressable>
                </View>
              </Tooltip>
            }
          />
        )}
        <Metric
          row
          label="Switchboard oracle"
          value={
            <Tooltip
              popover={<Typography>{reserve.switchboardOracle}</Typography>}
              actionType="press">
              <View className="flex flex-row items-center">
                <Typography
                  onPress={() =>
                    Linking.openURL(
                      `https://solscan.io/account/${reserve.switchboardOracle}`,
                    )
                  }
                  onLongPress={() => {
                    Clipboard.setString(reserve.switchboardOracle);
                    alertAndLog('Address copied!', reserve.switchboardOracle);
                  }}>
                  {reserve.switchboardOracle.slice(0, 6)}...
                  {reserve.switchboardOracle.slice(-6)}{' '}
                </Typography>
                <Pressable
                  onPress={() =>
                    Clipboard.setString(reserve.switchboardOracle)
                  }>
                  <Icon name="content-copy" />
                </Pressable>
              </View>
            </Tooltip>
          }
        />
      </ScrollView>
    </View>
  );
}

export default ReserveStats;
