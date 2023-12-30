import { useLocation } from '@remix-run/react';
import React from 'react';
import { useEvent } from '~/hooks/useEvent';

type Props = {
  isExpanded: boolean;
  children: React.ReactNode;
  hide: () => void;
};

export function NavWrapper(props: Props): JSX.Element {
  const { pathname } = useLocation();
  const hide = useEvent(props.hide);

  React.useEffect(() => hide(), [pathname, hide]);

  const isExpanded = props.isExpanded;

  return (
    <>
      <nav
        className={`absolute right-full h-full  w-3/4 bg-white dark:bg-slate-950 sm:relative sm:right-0 sm:block sm:h-auto sm:w-64 sm:bg-slate-100 sm:dark:bg-slate-950 lg:w-80`}
      >
        <div className="sticky top-0 h-[90vh] overflow-y-auto overflow-x-hidden sm:h-screen">
          {props.children}
        </div>
      </nav>
      <div
        className={`absolute right-0 top-0 z-10 h-full  w-full bg-black opacity-10 ${
          isExpanded ? 'visible' : 'hidden'
        } sm:hidden`}
        onClick={props.hide}
      />
    </>
  );
}
