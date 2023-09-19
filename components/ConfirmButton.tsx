import React, { ReactElement, useState } from 'react';
import { useAuthorization } from './providers/AuthorizationProvider';
import SolendButton from './Button';
import Typography from './Typography';
import { ResultConfigType } from './Result';

interface ConfirmButtonPropsType {
  value: string | null;
  onFinish: (res: ResultConfigType) => void;
  finishText: string;
  action: string;
  disabled?: boolean;
  needsConnect?: boolean;
  onClick: () => Promise<string | undefined> | undefined;
  canShowCanceled?: boolean;
  symbol: string;
}

ConfirmButton.defaultProps = {
  disabled: false,
  canShowCanceled: true,
  needsConnect: false,
};

function ConfirmButton({
  value,
  onFinish,
  finishText,
  action,
  disabled,
  needsConnect,
  onClick,
  canShowCanceled,
  symbol,
}: ConfirmButtonPropsType): ReactElement {
  const { connect } = useAuthorization();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  return (
    <SolendButton
    full
    overrideClassName='mt-2'
      disabled={!needsConnect && (disabled || showConfirm || !value)}
      onPress={async () => {
        if (needsConnect) {
          connect();
        } else {
          if (showCancelled) {
            setShowCancelled(false);
          }
          if (value) {
            setShowConfirm(true);
            let signature;
            try {
              signature = await onClick();
            } catch (e: any) {
              onFinish({
                type: 'error',
                message: String(e.message ?? e),
              });
            }
            if (!signature) {
              setShowConfirm(false);
              setShowCancelled(true);
            } else {
              setShowConfirm(false);
              setShowCancelled(false);
              onFinish({
                type: 'success',
                symbol,
                action,
                amountString: value,
                signature,
              });
            }
          }
        }
      }}
    >
      {/* TODO: express as if statement block */}
      {/* eslint-disable-next-line no-nested-ternary */}
      <Typography
        color='neutral'
        level='title'
      >
      {showConfirm
        ? 'Confirm transaction in wallet'
        : showCancelled && canShowCanceled
        ? 'Cancelled transaction'
        : finishText}
        </Typography>
    </SolendButton>
  );
}

export default ConfirmButton;
