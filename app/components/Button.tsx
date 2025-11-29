import React from "react";
import { SpinnerIcon } from "./SpinnerIcon";
import { useFormStatus } from "react-dom";
import clsx from "clsx";

type Props = {
  isPending?: boolean;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function Button({ isPending: isPending, ...buttonProps }: Props) {
  const formStatus = useFormStatus();
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isPending || formStatus.pending}
      className={clsx(buttonStyle, buttonProps.className)}
    >
      {buttonProps.children}
    </button>
  );
}

export const buttonStyle = `flex w-fit items-center gap-2 rounded px-4 py-2 bg-slate-100 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500
  dark:active:bg-slate-600 text-slate-700 hover:bg-slate-200 active:bg-slate-100 disabled:text-slate-300 *:pointer-events-none disabled:pointer-events-none`;

export function SubmitButton(props: Omit<Props, "type">) {
  return (
    <FormButton
      {...props}
      type="submit"
      className={clsx(
        "flex items-center justify-center rounded bg-rose-600 px-4 py-2 font-medium text-white *:pointer-events-none hover:bg-rose-700 active:bg-rose-500 disabled:bg-rose-500",
        props.className,
      )}
    >
      {props.children}
    </FormButton>
  );
}

export function FormButton({ isPending: isLoading, ...buttonProps }: Props) {
  const formStatus = useFormStatus();
  isLoading ||= formStatus.pending;
  return (
    <button
      {...buttonProps}
      disabled={buttonProps.disabled || isLoading}
      className={clsx(
        "flex items-center justify-center text-center",
        buttonProps.className,
      )}
    >
      <span className={clsx(isLoading && "opacity-0", "pointer-events-none")}>
        {buttonProps.children}
      </span>
      {isLoading && <SpinnerIcon className="absolute w-4 text-current" />}
    </button>
  );
}
