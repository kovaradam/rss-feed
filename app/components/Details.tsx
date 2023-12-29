import { FilterIcon } from '@heroicons/react/outline';
import React from 'react';

type Props = React.DetailedHTMLProps<
  React.DetailsHTMLAttributes<HTMLDetailsElement>,
  HTMLDetailsElement
> & { title: string };

export function Details(props: Props): JSX.Element {
  return (
    <details
      onClick={(event) => {
        props.onClick?.(event);
      }}
      {...props}
      className={` cursor-pointer rounded-md border p-2 dark:border-none dark:bg-slate-800 dark:text-white ${props.className}`}
    >
      <summary className=" flex">
        <FilterIcon className="min-w-4 pointer-events-none w-4" />
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
