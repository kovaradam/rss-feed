import React from "react";

type Props = {
  label: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: React.ReactNode | ((props: Props) => React.JSX.Element);
};

export function WithFormLabel(props: Props) {
  const { label, required, children, ...legendProps } = props;
  const id = React.useId();
  const htmlFor = props.htmlFor ?? id;

  return (
    <fieldset className="flex w-full flex-col gap-1">
      <legend className="mb-1 flex items-center gap-2 " {...legendProps}>
        <label htmlFor={htmlFor} className="dark:text-slate-100">
          {label}
        </label>{" "}
        {required && (
          <span className="text-slate-500 dark:text-slate-100">(required)</span>
        )}
      </legend>
      {typeof children === "function" ? children(props) : children}
    </fieldset>
  );
}
