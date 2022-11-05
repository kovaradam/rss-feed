import { useLocation } from '@remix-run/react';
import React from 'react';
import { useEvent } from '~/hooks/use-event';
import { useCreateChannelHandle } from './CreateChannelForm';

type Props = {
  isExpanded: boolean;
  children: React.ReactNode;
  hide: () => void;
};

export function NavWrapper(props: Props): JSX.Element {
  const { pathname } = useLocation();
  const hide = useEvent(props.hide);

  React.useEffect(() => hide(), [pathname, hide]);
  const [isNewChannelFormOpen] = useCreateChannelHandle();

  const isExpanded = props.isExpanded || isNewChannelFormOpen;

  return (
    <>
      <nav
        className={`absolute right-full h-full  w-3/4 bg-white sm:relative sm:right-0 sm:block sm:h-auto sm:w-64 sm:bg-slate-50 lg:w-80`}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {props.children}
        </div>
      </nav>
      <div
        className={`absolute top-0 right-0 z-10 h-full  w-full bg-black opacity-10 ${
          isExpanded ? 'visible' : 'hidden'
        } sm:hidden`}
        onClick={props.hide}
      />
    </>
  );
}
