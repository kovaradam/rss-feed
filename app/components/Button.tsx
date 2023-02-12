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
  'bg-black text-white hover:bg-gray-800 active:bg-gray-700 disabled:bg-gray-500';

export function SubmitButton(props: Props): JSX.Element {
  const transition = useTransition();
  const isLoading = props.isLoading ?? transition.state === 'submitting';

  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      type="submit"
      className={`flex items-center justify-center rounded  bg-rose-400 px-4 py-2 font-medium text-white hover:bg-rose-500 disabled:bg-rose-300 ${props.className}`}
    >
      {isLoading ? <SpinnerIcon className="w-4" /> : props.children}
    </button>
  );
}
