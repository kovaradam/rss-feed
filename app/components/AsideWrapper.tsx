import React from 'react';

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;

export function AsideWrapper(props: Props): JSX.Element {
  return (
    <aside
      className={`sticky bottom-0 -mb-8 flex gap-2 overflow-x-auto bg-white bg-opacity-90 py-4 backdrop-blur-sm sm:relative sm:mb-0 sm:ml-4 sm:flex-col sm:justify-start sm:bg-opacity-0 sm:py-0 sm:backdrop-blur-none dark:bg-inherit ${props.className}`}
    >
      {props.children}
    </aside>
  );
}
