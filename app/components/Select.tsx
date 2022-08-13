import {
  Select as AriakitSelect,
  SelectArrow,
  SelectItem,
  SelectItemCheck,
  SelectLabel,
  SelectPopover,
  useSelectState,
} from 'ariakit/select';
import React from 'react';

type Props = {
  options: { value: string; label: React.ReactNode }[];
  defaultValue?: string[];
  className?: string;
  name?: string;
  id?: string;
  label?: string;
  title?: string;
  renderValue?: (values: string[]) => string;
};

function defaultRenderValue(values: string[]): string {
  switch (values.length) {
    case 0:
      return 'No category selected';
    case 1:
      return String(values);
    default:
      return `${String(values.slice(0, 1))}, ${values.length - 1} more...`;
  }
}

export function Select(props: Props): JSX.Element {
  const select = useSelectState({
    defaultValue: props.defaultValue ?? [],
    sameWidth: true,
  });

  return (
    <div className={props.className}>
      <SelectLabel state={select}>{props.label}</SelectLabel>
      <AriakitSelect
        name={props.name}
        id={props.id}
        title={props.title}
        state={select}
        className={`flex w-full flex-row-reverse items-center justify-between truncate rounded bg-slate-100 p-2 text-slate-600`}
      >
        <SelectArrow />
        {(props.renderValue ?? defaultRenderValue)(select.value)}
      </AriakitSelect>
      {props.options.length !== 0 && (
        <SelectPopover
          state={select}
          className="popover z-10 rounded-sm bg-white p-2 shadow-lg"
        >
          {props.options.map(({ value, label }) => (
            <SelectItem
              key={value}
              value={value}
              className="select-item flex items-center gap-1 rounded-sm p-1 hover:bg-blue-50 active-select-item:bg-blue-50"
            >
              <SelectItemCheck />
              {label}
            </SelectItem>
          ))}
        </SelectPopover>
      )}
    </div>
  );
}
