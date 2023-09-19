import React, { ReactElement } from 'react';
import { View } from 'react-native';
import Typography, { TypographyPropsType } from './Typography';
import Tooltip from 'rn-tooltip';
import Icon from 'react-native-vector-icons/MaterialIcons';

type MetricPropType = {
  label: React.ReactNode;
  value: React.ReactNode;
  row?: boolean,
  tooltip?: React.ReactElement;
  color?: TypographyPropsType['color'];
  dangerTooltip?: React.ReactElement;
  align?: 'left' | 'right' | 'center'
  extraClassName?: string,
};

function Metric({
  label,
  value,
  row,
  tooltip,
  color,
  dangerTooltip,
  align,
  extraClassName,
}: MetricPropType): ReactElement {
  return (
    <View className={`flex flex-${row ? 'row justify-between items-end' : 'col'} ${align === 'center' ? 'items-center' : ''} ${extraClassName}`}>
      <View className='flex flex-row items-center'>
        <Typography textClassName={`text-${align}`} level='caption' color='secondary'>
          {label}{" "}</Typography>

          {tooltip && (
            <Tooltip popover={dangerTooltip ?? tooltip} actionType='press'>
              <Typography level='caption' color={dangerTooltip ? 'brand' : 'secondary'}>
                {dangerTooltip ? (
                  <Icon name='warning' />
                ) : (
                  <Icon name='info' />
                )}
              </Typography>
            </Tooltip>
          )}
          </View>
        <Typography textClassName={`text-${align}`} color={color}>{value}</Typography>
    </View>
  );
}

export default Metric;
