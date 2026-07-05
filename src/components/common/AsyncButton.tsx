import React, { useState } from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface AsyncButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<any> | void;
  label?: string;
  loadingText?: string;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  onClick,
  children,
  label,
  loadingText = 'Executing...',
  disabled,
  ...props
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const res = onClick();
    if (res instanceof Promise) {
      setLoading(true);
      try {
        await res;
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`font-sans text-xs uppercase tracking-wider font-bold ${props.className ?? ''}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <CircularProgress size={14} color="inherit" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children || label
      )}
    </Button>
  );
};
