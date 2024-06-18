import React from 'react';
import { SpinnerIcon } from './SpinnerIcon';

export function ChannelItemsOverlay(): JSX.Element | null {
  return (
    <div className="absolute z-10 flex h-full min-h-screen  w-full justify-center rounded-lg bg-black/10 pt-[50%]">
      <SpinnerIcon className="h-16 w-16" />
    </div>
  );
}
