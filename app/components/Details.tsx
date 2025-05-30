import React from "react";

type Props = React.DetailedHTMLProps<
  React.DetailsHTMLAttributes<HTMLDetailsElement>,
  HTMLDetailsElement
> & { title: string; icon?: React.ReactNode };

export function Details(props: Props) {
  return (
    <details
      {...props}
      className={` rounded-md border bg-white p-2 dark:border-none dark:bg-slate-800 dark:text-white ${props.className}`}
    >
      <summary
        className={`group flex w-full cursor-pointer items-center px-2 ${
          props.icon ? "[&::-webkit-details-marker]:hidden" : ""
        }`}
      >
        {props.icon}
        <span className="pointer-events-none flex-1 text-center">
          {props.title}
        </span>
      </summary>
      <div className="mt-2 border-t pt-2 dark:border-t-slate-700">
        {props.children}
      </div>
    </details>
  );
}
