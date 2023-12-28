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
      className={`rounded px-4 py-2 ${buttonStyle} ${buttonProps.className}`}
    >
      {buttonProps.children}
    </button>
  );
}

export const buttonStyle =
  'px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-100 disabled:text-slate-300';

export function SubmitButton({
  isLoading,
  ...buttonProps
}: Props): JSX.Element {
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      type="submit"
      className={`flex items-center justify-center rounded  bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 active:bg-rose-500 disabled:bg-rose-500 ${buttonProps.className}`}
    >
      <span className={`${isLoading ? 'opacity-0' : ''}`}>
        {buttonProps.children}
      </span>
      {isLoading && <SpinnerIcon className="absolute w-4" />}
    </button>
  );
}
