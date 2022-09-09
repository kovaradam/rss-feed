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
        className={`absolute z-20 h-full w-3/4  ${
          isExpanded ? '-translate-x-0' : '-translate-x-96'
        }  bg-white  duration-200 ease-in  sm:relative sm:block sm:w-64 sm:translate-x-0`}
      >
        {props.children}
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
