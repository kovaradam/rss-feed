import React from 'react';

type Props = { isExpanded: boolean; children: React.ReactNode };

export function NavWrapper(props: Props): JSX.Element {
  return (
    <nav
      className={`absolute z-10 h-full w-2/3  overflow-hidden -translate-x-${
        props.isExpanded ? '0' : '[110%]'
      } bg-white  shadow-sm duration-200 ease-in sm:relative sm:block sm:w-64 sm:translate-x-0`}
    >
      {props.children}
    </nav>
  );
}
