import React, {ReactElement} from 'react';
import {Pressable, PressableProps} from 'react-native';

function SolendButton(
  props: PressableProps & {
    buttonStyle?: 'primary' | 'tag';
    full?: boolean;
    overrideClassName?: string;
  },
): ReactElement {
  let buttonClassName = `items-center border bg-primary flex justify-center p-2 ${
    props.full ? 'w-full ' : ''
  } h-12 ${props.overrideClassName}`;

  if (props.buttonStyle === 'tag') {
    buttonClassName =
      'items-center border border-line bg-neutralAlt flex justify-center px-1 py-0.5';
  }
  return (
    <Pressable {...props} className={buttonClassName}>
      {props.children as React.ReactNode}
    </Pressable>
  );
}

export default SolendButton;
