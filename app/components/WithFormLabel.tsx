import React from "react";

type Props = {
  label: React.ReactNode;
  labelEndSlot?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: React.ReactNode | ((props: Props) => React.JSX.Element);
  className?: string;
  labelAs?: React.ElementType;
};

export function WithFormLabel(props: Props) {
  const { label, labelEndSlot, required, children, className, ...legendProps } =
    props;
  const id = React.useId();
  const htmlFor = props.htmlFor ?? id;

  return (
    <fieldset className={`flex w-full flex-col gap-1 ${className}`}>
      <legend
        className={`mb-1 flex w-full items-center gap-2 `}
        {...legendProps}
      >
        {React.createElement(
          props.labelAs ?? "label",
          {
            htmlFor:
              props.labelAs && props.labelAs !== "label" ? undefined : htmlFor,
            className: "dark:text-slate-100",
          },
          label,
        )}
        {required && (
          <span className="text-slate-500 dark:text-slate-200">(required)</span>
        )}
        {labelEndSlot && (
          <>
            <div className="flex-1" />
            <span className="text-sm text-slate-500 dark:text-slate-200">
              {labelEndSlot}
            </span>
          </>
        )}
      </legend>
      {typeof children === "function"
        ? children({ ...props, htmlFor })
        : children}
    </fieldset>
  );
}
