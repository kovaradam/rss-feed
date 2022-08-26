import React from 'react';

type Props = {
  secondary?: boolean;
  isLoading?: boolean;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function Button({
  isLoading,
  secondary,
  ...buttonProps
}: Props): JSX.Element {
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      className={`rounded  py-2 px-4 ${
        secondary ? secondaryButtonStyle : primaryButtonStyle
      } ${buttonProps.className}`}
    >
      {buttonProps.children}
    </button>
  );
}

export const secondaryButtonStyle =
  'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-100 disabled:text-slate-300';

export const primaryButtonStyle =
  'bg-blue-200 text-blue-600 hover:bg-blue-300 active:bg-slate-100 disabled:bg-blue-100 disabled:text-blue-300';
