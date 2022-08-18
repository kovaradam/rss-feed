import { useLocation } from '@remix-run/react';
import React from 'react';
import { useEvent } from '~/hooks/use-event';

type Props = {
  isExpanded: boolean;
  children: React.ReactNode;
  hide: () => void;
};

export function NavWrapper(props: Props): JSX.Element {
  const { pathname } = useLocation();
  const hide = useEvent(props.hide);

  React.useEffect(() => hide(), [pathname, hide]);

  return (
    <nav
      className={`absolute z-10 h-full w-2/3  ${
        props.isExpanded ? '-translate-x-0' : '-translate-x-96'
      }  bg-white  duration-200 ease-in  sm:relative sm:block sm:w-64 sm:translate-x-0`}
    >
      {props.children}
      <div
        className={`absolute top-0 left-full h-full w-[200vw]  bg-black opacity-10 ${
          props.isExpanded ? 'visible' : 'hidden'
        }`}
        onClick={props.hide}
      />
    </nav>
  );
}
