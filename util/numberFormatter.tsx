import React from 'react';

import BigNumber from 'bignumber.js';
import numbro from 'numbro';

export function formatExact(value: string | number) {
  return new BigNumber(value).toFormat();
}

export function collapsableToken(
  value: string,
  decimals: number,
  maxLength: number,
) {
  const bn = new BigNumber(value);
  if (bn.isLessThan(0.0001) && !bn.isLessThanOrEqualTo(new BigNumber(0))) {
    return '< 0.0001';
  }

  const valString = numbro(value).format({
    thousandSeparated: true,
    mantissa: decimals,
    trimMantissa: false,
  });

  return valString.length > maxLength ? numbro(value).format('4a') : valString;
}

export function formatToken(
  value: string | number,
  digits = 4,
  exactTip?: boolean,
  noTrim?: boolean,
  // by default we truncate for tokens
  round?: boolean,
  exact?: boolean,
): React.ReactNode {
  if (exact) {
    return formatExact(value);
  }
  const bn = new BigNumber(value);
  if (
    bn.isLessThan(1 / 10 ** digits) &&
    !bn.isLessThanOrEqualTo(new BigNumber(0))
  ) {
    return `< ${1 / 10 ** digits}`;
  }

  const usedValue = round ? value : bn.toFormat(digits, 1);

  const contents = numbro(usedValue).format({
    thousandSeparated: true,
    trimMantissa: !noTrim,
    optionalMantissa: !noTrim,
    mantissa: digits,
  });

  return contents;
}

export function ordinalSuffix(i: number) {
  const j = i % 10;
  const k = i % 100;

  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

export function formatUsd(
  value: string | number,
  omitPrefix?: boolean,
  rounded?: boolean,
  sigFigs?: number,
  noTrim?: boolean,
): string {
  const bn = new BigNumber(value);
  const neg = bn.isLessThan(0);
  const abs = bn.abs();
  if (value === '0' && sigFigs) {
    return `${neg ? '-' : ''}${omitPrefix ? '' : '$'}${Number(abs).toPrecision(
      sigFigs + 1,
    )}`;
  }
  if (sigFigs && bn.lt(0.1)) {
    return `${neg ? '-' : ''}${omitPrefix ? '' : '$'}${Number(abs).toPrecision(
      sigFigs,
    )}`;
  }
  if (
    !noTrim &&
    bn.isLessThan(0.01) &&
    !bn.isLessThanOrEqualTo(new BigNumber(0))
  ) {
    return `< ${omitPrefix ? '' : '$'}0.01`;
  }
  // When we have to do token price conversion into USD, we are often either too precise
  // or not precise enough to fully net a number back to 0. This accounts for that inaccuracy
  if (bn.abs().isLessThan(0.0001)) {
    return `${omitPrefix ? '' : '$'}0${rounded ? '' : '.00'}`;
  }

  return `${neg ? '-' : ''}${omitPrefix ? '' : '$'}${numbro(abs).format({
    thousandSeparated: true,
    trimMantissa: false,
    mantissa: rounded ? 0 : 2,
  })}`;
}

export function formatPercent(
  value: string | number,
  noTrim?: boolean,
  limit?: number,
) {
  const bnPercent = new BigNumber(value).multipliedBy(100);
  if (
    bnPercent.isLessThan(limit ?? 0.0001) &&
    !bnPercent.isLessThanOrEqualTo(new BigNumber(0))
  ) {
    return '< 0.01%';
  }

  return numbro(value).format({
    output: 'percent',
    thousandSeparated: true,
    trimMantissa: !noTrim,
    optionalMantissa: !noTrim,
    mantissa: 2,
  });
}
