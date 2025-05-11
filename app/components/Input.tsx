import { styles } from "~/styles/shared";
import { WithFormLabel } from "./WithFormLabel";
import { useFormStatus } from "react-dom";
import { InputError } from "./InputError";
import { replaceAll } from "~/utils/replace-all";
import React from "react";

type Error<T> = T extends string
  ? {
      content: T;
    }
  : { key: string; content: T };

interface Props<T extends readonly React.ReactNode[]>
  extends React.ComponentProps<"input"> {
  formLabel?: React.ReactNode;
  formLabelEndSlot?: React.ReactNode;
  errors?: { [K in keyof T]: Error<T[K]> };
  wrapperClassName?: string;
  honeypot?: boolean;
}

export function Input<T extends readonly React.ReactNode[]>({
  formLabel,
  formLabelEndSlot,
  wrapperClassName,
  honeypot,
  errors: errorsProp,
  ...inputProps
}: Props<T>) {
  const formStatus = useFormStatus();

  const errors = errorsProp?.map((e) => ({
    ...e,
    id: "key" in e ? e.key : replaceAll(e.content, " ", "-"),
  }));

  const _id = React.useId();
  const id = inputProps.id ?? _id;

  const [isShowPassword, setIsShowPassword] = React.useState(false);

  wrapperClassName = honeypot
    ? "absolute -z-10 ".concat(wrapperClassName ?? "")
    : wrapperClassName;

  const input = (
    <div className={`${formLabel ? undefined : wrapperClassName}`}>
      <style>
        {`input:placeholder-shown ~ .password-toggle {display:none;}`}
      </style>
      <div
        className="relative"
        onBlur={(e) => {
          const currentTarget = e.currentTarget;
          setTimeout(() => {
            if (!currentTarget.querySelector("*:focus")) {
              setIsShowPassword(false);
            }
          });
        }}
      >
        <input
          {...inputProps}
          tabIndex={honeypot ? -1 : undefined}
          placeholder={
            inputProps.type === "password" ? " " : inputProps.placeholder
          }
          type={isShowPassword ? "text" : inputProps.type}
          id={id}
          className={styles.input
            .concat(" ")
            .concat(inputProps.className ?? "")}
          disabled={inputProps.disabled || formStatus.pending}
          aria-describedby={(inputProps["aria-describedby"] ?? "").concat(
            errors?.map((e) => e.id).join(" ") ?? ""
          )}
          aria-invalid={errors ? true : undefined}
        />
        {inputProps.type === "password" && (
          <button
            type="button"
            className="script-only password-toggle absolute right-2 top-0 h-full text-sm text-slate-600 hover:underline peer-placeholder-shown:hidden dark:text-slate-200"
            onClick={() => setIsShowPassword((p) => !p)}
          >
            {isShowPassword ? "hide" : "show"}
          </button>
        )}
      </div>
      <div aria-live="polite">
        {errors?.map((e) => (
          <InputError key={e.id}>{e.content}</InputError>
        ))}
      </div>
    </div>
  );

  if (formLabel) {
    return (
      <WithFormLabel
        label={formLabel}
        labelEndSlot={formLabelEndSlot}
        required={inputProps.required}
        className={wrapperClassName}
        htmlFor={id}
      >
        {input}
      </WithFormLabel>
    );
  }

  return input;
}

Input.Email = function EmailInput<T extends readonly React.ReactNode[]>(
  props: Omit<Props<T>, "type" | "placeholder">
) {
  return <Input {...props} type="email" placeholder="name@example.com" />;
};

Input.Password = function EmailInput<T extends readonly React.ReactNode[]>(
  props: Omit<Props<T>, "type" | "placeholder">
) {
  return <Input {...props} type="password" />;
};
