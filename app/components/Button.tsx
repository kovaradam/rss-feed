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
      className={`rounded  px-4 py-2 ${
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
  'bg-black text-white hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-500';

export function SubmitButton({
  isLoading,
  ...buttonProps
}: Props): JSX.Element {
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      type="submit"
      className={`flex items-center justify-center rounded  bg-rose-500 px-4 py-2 font-medium text-white hover:bg-rose-600 active:bg-rose-400 disabled:bg-rose-400 ${buttonProps.className}`}
    >
      <span className={`${isLoading ? 'opacity-0' : ''}`}>
        {buttonProps.children}
      </span>
      {isLoading && <SpinnerIcon className="absolute w-4" />}
    </button>
  );
}
