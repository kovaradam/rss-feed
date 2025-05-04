import React from "react";
import { SpinnerIcon } from "./SpinnerIcon";
import { useFormStatus } from "react-dom";

type Props = {
  isLoading?: boolean;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function Button({ isLoading, ...buttonProps }: Props) {
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      className={`${buttonStyle} ${buttonProps.className}`}
    >
      {buttonProps.children}
    </button>
  );
}

export const buttonStyle = `flex w-fit items-center gap-2 rounded px-4 py-2 bg-slate-100 dark:bg-slate-500 dark:text-white dark:hover:bg-slate-600
  dark:active:bg-slate-500 text-slate-700 hover:bg-slate-200 active:bg-slate-100 disabled:text-slate-300 [&>*]:pointer-events-none`;

export function SubmitButton({ isLoading, ...buttonProps }: Props) {
  const formStatus = useFormStatus();
  isLoading ||= formStatus.pending;
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      type="submit"
      className={`flex items-center justify-center rounded bg-rose-600  px-4 py-2 font-medium text-white hover:bg-rose-700 active:bg-rose-500 disabled:bg-rose-500 [&>*]:pointer-events-none ${buttonProps.className}`}
    >
      <span className={`${isLoading ? "opacity-0" : ""} `}>
        {buttonProps.children}
      </span>
      {isLoading && <SpinnerIcon className="absolute w-4" />}
    </button>
  );
}
