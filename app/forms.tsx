import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { SubmitButton } from "./components/Button";
import React from "react";
import { WithFormLabel } from "./components/WithFormLabel";
import { styles } from "./styles/shared";

const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: (
      props: Omit<
        React.JSX.IntrinsicElements["input"],
        "value" | "name" | "id"
      > & {
        label: React.ReactNode;
        error?: React.ReactNode;
      }
    ) => {
      const field = useFieldContext<string>();
      const errorId = field.name.concat("-error");
      const errors = field.state.meta.errors;

      return (
        <WithFormLabel
          htmlFor={field.name}
          label={props.label}
          required={props.required}
        >
          <input
            {...props}
            name={field.name}
            value={field.state.value}
            onChange={(e) => {
              props.onChange?.(e);
              field.handleChange(e.currentTarget.value);
            }}
            onBlur={(e) => {
              props.onBlur?.(e);
              field.handleBlur();
            }}
            aria-invalid={Boolean(props.error)}
            aria-describedby={errors.map((e) => e.type ?? e).join(" ")}
            className={styles.input}
          />

          <ul
            className="[:not(:empty)]:pt-1 text-red-800 dark:text-red-400"
            id={errorId}
            aria-live="polite"
          >
            {field.state.meta.isDirty &&
              field.state.meta.errors.map((e) => (
                <li key={e.type ?? JSON.stringify(e)} id={e.type ?? e}>
                  {e.message ?? e}
                </li>
              ))}
          </ul>
        </WithFormLabel>
      );
    },
  },
  formComponents: {
    SubmitButton,
  },
});
