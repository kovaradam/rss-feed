import { useTransition } from '@remix-run/react';
import React from 'react';
import { SpinnerIcon } from './SpinnerIcon';

export function ChannelItemsOverlay(): JSX.Element | null {
  const transition = useTransition();

  if (
    transition.state !== 'loading' &&
    !['POST', 'GET'].includes(transition.submission?.method ?? '')
  ) {
    return null;
  }
  return (
    <div className="absolute flex h-full min-h-screen w-full  justify-center rounded-lg bg-black/10 pt-[50%] ">
      <SpinnerIcon className="h-16 w-16" />
    </div>
  );
}
