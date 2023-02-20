import React from 'react';
import useSound from 'use-sound';

import tapSound from 'public/sounds/ui_tap-variant-01.wav';
import closeSound from 'public/sounds/navigation_backward-selection-minimal.wav';
import openSound from 'public/sounds/navigation_forward-selection-minimal.wav';

export function UseSounds() {
  const [playTap] = useSound(tapSound);
  const [playCloseSound] = useSound(closeSound);
  const [playOpenSound] = useSound(openSound);

  React.useEffect(() => {
    const tagSoundMap: Record<string, (element: HTMLElement) => void> = {
      BUTTON: () => playTap(),
      SUMMARY: (element) => {
        if ((element.parentElement as HTMLDetailsElement).open) {
          playCloseSound();
        } else {
          playOpenSound();
        }
      },
      A: () => playTap(),
    };
    const abortController = new AbortController();

    document.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof HTMLElement)) {
          return;
        }

        const element = event.target;

        if (element.dataset.silent) {
          return;
        }

        tagSoundMap[event.target.tagName]?.(element);
      },
      {
        signal: abortController.signal,
      }
    );

    return () => abortController.abort();
  }, [playTap, playCloseSound, playOpenSound]);

  return null;
}
