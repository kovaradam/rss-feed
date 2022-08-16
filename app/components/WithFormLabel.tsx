import React from 'react';

type Props = {
  label: React.ReactNode;
  required?: boolean;
} & React.DetailedHTMLProps<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>;

export function WithFormLabel({
  label,
  required,
  ...labelProps
}: React.PropsWithChildren<Props>): JSX.Element {
  return (
    <div className="flex w-full flex-col gap-1">
      <label className="flex items-center gap-2" {...labelProps}>
        {label} {required && <span className="text-slate-400">(required)</span>}
      </label>
      {labelProps.children}
    </div>
  );
}
