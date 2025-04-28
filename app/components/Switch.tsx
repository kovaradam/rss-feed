import React from "react";
import { styles } from "~/styles/shared";

export function Switch<T>(props: {
  value: T;
  onClick: (
    value: T,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  options: Array<{ value: T; element: React.ReactNode }>;
  className?: string;
}) {
  return (
    <fieldset
      className={styles.input
        .concat(
          " script-only flex flex-col gap-1 bg-gray-50 py-1 pl-1 pr-1 sm:flex-row "
        )
        .concat(props.className ?? "")}
    >
      {props.options.map((option) => (
        <button
          key={option.value as string}
          onClick={(e) => {
            props.onClick(option.value, e);
          }}
          className={"flex-grow rounded-sm p-1 ".concat(
            option.value === props.value
              ? "bg-white shadow"
              : "text-gray-600 hover:bg-gray-100 hover:text-inherit"
          )}
        >
          {option.element}
        </button>
      ))}
    </fieldset>
  );
}
