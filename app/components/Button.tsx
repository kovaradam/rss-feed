import { useTransition } from '@remix-run/react';
import React from 'react';
import { SpinnerIcon } from './SpinnerIcon';

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

export function SubmitButton({
  ...buttonProps
}: Omit<Props, 'isLoading'>): JSX.Element {
  const isLoading = useTransition().state !== 'idle';
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      type="submit"
      className={`flex items-center justify-center rounded-md  bg-rose-400  px-4 py-3  font-medium text-white hover:bg-rose-500 disabled:bg-rose-300 sm:px-8 ${buttonProps.className}`}
    >
      {!isLoading ? buttonProps.children : <SpinnerIcon className="ml-2 " />}
    </button>
  );
}
