import React from "react";

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;

export function AsideWrapper(props: Props) {
  return (
    <aside
      className={`sticky bottom-0 -mb-8 flex gap-2 overflow-x-auto bg-white bg-white/90 py-4 backdrop-blur-sm sm:relative sm:mb-0 sm:ml-4 sm:flex-col sm:justify-start sm:bg-white/0 sm:py-0 sm:backdrop-blur-none dark:bg-inherit dark:bg-inherit/0 ${props.className}`}
    >
      {props.children}
    </aside>
  );
}
