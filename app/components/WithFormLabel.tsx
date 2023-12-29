import React from 'react';

type Props = {
  label: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children?: React.ReactNode | ((props: Props) => JSX.Element);
};

export function WithFormLabel(props: Props): JSX.Element {
  const { label, required, htmlFor, children, ...legendProps } = props;

  return (
    <fieldset className="flex w-full flex-col gap-1">
      <legend className="mb-1 flex items-center gap-2 " {...legendProps}>
        <label htmlFor={htmlFor} className="dark:text-slate-100">
          {label}
        </label>{' '}
        {required && (
          <span className="text-slate-500 dark:text-slate-100">(required)</span>
        )}
      </legend>
      {typeof children === 'function' ? children(props) : children}
    </fieldset>
  );
}
