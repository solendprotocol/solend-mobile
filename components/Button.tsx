import React, { ReactElement } from 'react';
import { Button, ButtonProps, Pressable, PressableProps } from 'react-native';
import Typography from './Typography';

function SolendButton(props: PressableProps & {
    buttonStyle?: 'primary' | 'tag'
}): ReactElement {
    let buttonClassName = `items-center border bg-primary flex justify-center p-2 ${props.className}`


if (props.buttonStyle === 'tag') {
    buttonClassName = 'items-center border border-line bg-neutralAlt flex justify-center px-1 py-0.5'
}
  return (
    <Pressable {...props} 
        className={buttonClassName}
    >{props.children as React.ReactNode} 
    </Pressable>
  );
}

export default SolendButton;
