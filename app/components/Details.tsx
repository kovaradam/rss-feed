import React from 'react';

type Props = React.DetailedHTMLProps<
  React.DetailsHTMLAttributes<HTMLDetailsElement>,
  HTMLDetailsElement
> & { title: string };

export function Details(props: Props): JSX.Element {
  return (
    <details {...props} className={`rounded-md border p-2 ${props.className}`}>
      <summary>{props.title}</summary>
      <div className="mt-2 border-t pt-2">{props.children}</div>
    </details>
  );
}
