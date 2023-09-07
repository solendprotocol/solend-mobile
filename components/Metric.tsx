import React, { ReactElement } from 'react';
import { View } from 'react-native';
import Typography from './Typography';

type MetricPropType = {
  label: React.ReactNode;
  value: React.ReactNode;
  row?: boolean,
  align?: 'left' | 'right' | 'center'
  extraClassName?: string,
};

function Metric({
  label,
  value,
  row,
  align,
  extraClassName,
}: MetricPropType): ReactElement {
  return (
    <View className={`flex flex-${row ? 'row' : 'col'} justify-between ${extraClassName}`}>
        <Typography level='caption' color='secondary'>{label}</Typography>
        <Typography textClassName={`text-${align}`}>{value}</Typography>
    </View>
  );
}

export default Metric;
